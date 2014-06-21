/// <reference path="../defs/tsd.d.ts"/>
/// <reference path="./modules/interfaces.d.ts"/>
/*
* grunt-ts
* Licensed under the MIT license.
*/
// Typescript imports
var _ = require('underscore');
var path = require('path');
var fs = require('fs');

// Modules of grunt-ts
var utils = require('./modules/utils');
var compileModule = require('./modules/compile');
var referenceModule = require('./modules/reference');
var amdLoaderModule = require('./modules/amdLoader');
var html2tsModule = require('./modules/html2ts');
var templateCacheModule = require('./modules/templateCache');

// plain vanilla imports
var Promise = require('es6-promise').Promise;

/**
* Time a function and print the result.
*
* @param makeIt the code to time
* @returns the result of the block of code
*/
function timeIt(makeIt) {
    var starttime = new Date().getTime();
    var it = makeIt();
    var endtime = new Date().getTime();
    return {
        it: it,
        time: endtime - starttime
    };
}

/**
* Run a map operation async in series (simplified)
*/
function asyncSeries(arr, iter) {
    arr = arr.slice(0);

    var memo = [];

    // Run one at a time
    return new Promise(function (resolve, reject) {
        var next = function () {
            if (arr.length === 0) {
                resolve(memo);
                return;
            }
            Promise.cast(iter(arr.shift())).then(function (res) {
                memo.push(res);
                next();
            }, reject);
        };
        next();
    });
}

function pluginFn(grunt) {
    /////////////////////////////////////////////////////////////////////
    // The grunt task
    ////////////////////////////////////////////////////////////////////
    // Note: this function is called once for each target
    // so task + target options are a bit blurred inside this function
    grunt.registerMultiTask('ts', 'Compile TypeScript files', function () {
        var currenttask = this;

        // make async
        var done = currenttask.async();

        var watch;

        // setup default options
        var options = currenttask.options({
            allowBool: false,
            allowImportModule: false,
            compile: true,
            declaration: false,
            mapRoot: '',
            module: 'amd',
            noImplicitAny: false,
            noResolve: false,
            comments: null,
            removeComments: null,
            sourceMap: true,
            sourceRoot: '',
            target: 'es5',
            verbose: false,
            fast: 'watch'
        });

        // fix the properly cased options to their appropriate values
        options.allowBool = 'allowbool' in options ? options['allowbool'] : options.allowBool;
        options.allowImportModule = 'allowimportmodule' in options ? options['allowimportmodule'] : options.allowImportModule;
        options.sourceMap = 'sourcemap' in options ? options['sourcemap'] : options.sourceMap;

        // Warn the user of invalid values
        if (options.fast !== 'watch' && options.fast !== 'always' && options.fast !== 'never') {
            console.warn(('"fast" needs to be one of : "watch" (default) | "always" | "never" but you provided: ' + options.fast).magenta);
            options.fast = 'watch';
        }

        // Remove comments based on the removeComments flag first then based on the comments flag, otherwise true
        if (options.removeComments === null) {
            options.removeComments = !options.comments;
        } else if (options.comments !== null) {
            console.warn('WARNING: Option "comments" and "removeComments" should not be used together'.magenta);
            if (options.removeComments === options.comments) {
                console.warn('Either option will suffice (and removing the other will have no effect).'.magenta);
            } else {
                console.warn(('The --removeComments value of "' + options.removeComments + '" ' + 'supercedes the --comments value of "' + options.comments + '"').magenta);
            }
        }
        options.removeComments = !!options.removeComments;

        // Some interesting logs:
        // http://gruntjs.com/api/inside-tasks#inside-multi-tasks
        // console.log(this)
        // console.log(this.files[0]); // An array of target files ( only one in our case )
        // console.log(this.files[0].src); // a getter for a resolved list of files
        // console.log(this.files[0].orig.src); // The original glob / array / !array / <% array %> for files. Can be very fancy :)
        // NOTE: to access the specified src files we use
        // currenttaks.data as that is the raw (non interpolated) string that we reinterpolate ourselves,
        //     in case the file system as changed since this task was started
        // this.files[0] is actually a single in our case as we gave examples of  one source / out per target
        // Run compiler
        asyncSeries(this.files, function (target) {
            // Create a reference file?
            var reference = target.reference;
            var referenceFile;
            var referencePath;
            if (!!reference) {
                referenceFile = path.resolve(reference);
                referencePath = path.dirname(referenceFile);
            }
            function isReferenceFile(filename) {
                return path.resolve(filename) === referenceFile;
            }

            // Create an output file?
            var out = target.out;
            var outFile;
            var outFile_d_ts;
            if (!!out) {
                outFile = path.resolve(out);
                outFile_d_ts = outFile.replace('.js', '.d.ts');
            }
            function isOutFile(filename) {
                return path.resolve(filename) === outFile_d_ts;
            }

            // see https://github.com/grunt-ts/grunt-ts/issues/77
            function isBaseDirFile(filename, targetFiles) {
                var baseDirFile = '.baseDir.ts';
                if (!target.baseDir) {
                    target.baseDir = utils.findCommonPath(targetFiles, '/');
                }
                return path.resolve(filename) === path.resolve(path.join(target.baseDir, baseDirFile));
            }

            // Create an amd loader?
            var amdloader = target.amdloader;
            var amdloaderFile;
            var amdloaderPath;
            if (!!amdloader) {
                amdloaderFile = path.resolve(amdloader);
                amdloaderPath = path.dirname(amdloaderFile);
            }

            // Compiles all the files
            // Uses the blind tsc compile task
            // logs errors
            function runCompilation(files, target, options) {
                // Don't run it yet
                grunt.log.writeln('Compiling...'.yellow);

                // The files to compile
                var filesToCompile = files;

                // Time the compiler process
                var starttime = new Date().getTime();
                var endtime;

                // Compile the files
                return compileModule.compileAllFiles(filesToCompile, target, options).then(function (result) {
                    // End the timer
                    endtime = new Date().getTime();

                    // Evaluate the result
                    if (!result || result.code) {
                        grunt.log.error('Compilation failed'.red);
                        return false;
                    } else {
                        var time = (endtime - starttime) / 1000;
                        grunt.log.writeln(('Success: ' + time.toFixed(2) + 's for ' + result.fileCount + ' typescript files').green);
                        return true;
                    }
                });
            }

            // Find out which files to compile, codegen etc.
            // Then calls the appropriate functions + compile function on those files
            function filterFilesAndCompile() {
                // Reexpand the original file glob
                var files = grunt.file.expand(currenttask.data.src);

                // ignore directories
                files = files.filter(function (file) {
                    var stats = fs.lstatSync(file);
                    return !stats.isDirectory();
                });

                // Clear the files of output.d.ts and reference.ts and baseDirFile
                files = _.filter(files, function (filename) {
                    return (!isReferenceFile(filename) && !isOutFile(filename) && !isBaseDirFile(filename, files));
                });

                ///// Html files:
                // Note:
                //    compile html files must be before reference file creation
                var generatedFiles = [];
                if (currenttask.data.html) {
                    var htmlFiles = grunt.file.expand(currenttask.data.html);
                    generatedFiles = _.map(htmlFiles, function (filename) {
                        return html2tsModule.compileHTML(filename);
                    });
                }

                ///// Template cache
                // Note: The template cache files do not go into generated files.
                // Note: You are free to generate a `ts OR js` file for template cache, both should just work
                if (currenttask.data.templateCache) {
                    if (!currenttask.data.templateCache.src || !currenttask.data.templateCache.dest || !currenttask.data.templateCache.baseUrl) {
                        grunt.log.writeln('templateCache : src, dest, baseUrl must be specified if templateCache option is used'.red);
                    } else {
                        var templateCacheSrc = grunt.file.expand(currenttask.data.templateCache.src);
                        var templateCacheDest = path.resolve(target.templateCache.dest);
                        var templateCacheBasePath = path.resolve(target.templateCache.baseUrl);
                        templateCacheModule.generateTemplateCache(templateCacheSrc, templateCacheDest, templateCacheBasePath);
                    }
                }

                ///// Reference File
                // Generate the reference file
                // Create a reference file if specified
                if (!!referencePath) {
                    var result = timeIt(function () {
                        return referenceModule.updateReferenceFile(files, generatedFiles, referenceFile, referencePath);
                    });
                    if (result.it === true) {
                        grunt.log.writeln(('Updated reference file (' + result.time + 'ms).').green);
                    }
                }

                ///// AMD loader
                // Create the amdLoader if specified
                if (!!amdloaderPath) {
                    var referenceOrder = amdLoaderModule.getReferencesInOrder(referenceFile, referencePath, generatedFiles);
                    amdLoaderModule.updateAmdLoader(referenceFile, referenceOrder, amdloaderFile, amdloaderPath, target.outDir);
                }

                // Return promise to compliation
                if (options.compile) {
                    // Compile, if there are any files to compile!
                    if (files.length > 0) {
                        return runCompilation(files, target, options).then(function (success) {
                            return success;
                        });
                    } else {
                        grunt.log.writeln('No files to compile'.red);
                        return Promise.resolve(true);
                    }
                } else {
                    return Promise.resolve(true);
                }
            }

            // Time (in ms) when last compile took place
            var lastCompile = 0;

            // Watch a folder?
            watch = target.watch;
            if (!!watch) {
                // local event to handle file event
                function handleFileEvent(filepath, displaystr, addedOrChanged) {
                    if (typeof addedOrChanged === "undefined") { addedOrChanged = false; }
                    // Only ts and html :
                    if (!utils.endsWith(filepath.toLowerCase(), '.ts') && !utils.endsWith(filepath.toLowerCase(), '.html')) {
                        return;
                    }

                    // Do not run if just ran, behaviour same as grunt-watch
                    // These are the files our run modified
                    if ((new Date().getTime() - lastCompile) <= 100) {
                        // Uncomment for debugging which files were ignored
                        // grunt.log.writeln((' ///'  + ' >>' + filepath).grey);
                        return;
                    }

                    // Log and run the debounced version.
                    grunt.log.writeln((displaystr + ' >>' + filepath).yellow);

                    filterFilesAndCompile();
                }

                // get path
                var watchpath = path.resolve(watch);

                // create a file watcher for path
                var chokidar = require('chokidar');
                var watcher = chokidar.watch(watchpath, { ignoreInitial: true, persistent: true });

                // Log what we are doing
                grunt.log.writeln(('Watching all TypeScript / Html files under : ' + watchpath).cyan);

                // A file has been added/changed/deleted has occurred
                watcher.on('add', function (path) {
                    handleFileEvent(path, '+++ added   ', true);

                    // Reset the time for last compile call
                    lastCompile = new Date().getTime();
                }).on('change', function (path) {
                    handleFileEvent(path, '### changed ', true);

                    // Reset the time for last compile call
                    lastCompile = new Date().getTime();
                }).on('unlink', function (path) {
                    handleFileEvent(path, '--- removed ');

                    // Reset the time for last compile call
                    lastCompile = new Date().getTime();
                }).on('error', function (error) {
                    console.error('Error happened in chokidar: ', error);
                });
            }

            // Reset the time for last compile call
            lastCompile = new Date().getTime();

            // Run initial compile
            return filterFilesAndCompile();
        }).then(function (res) {
            // Ignore res? (either logs or throws)
            if (!watch) {
                if (res.some(function (succes) {
                    return !succes;
                })) {
                    done(false);
                } else {
                    done();
                }
            }
        }, done);
    });
}
module.exports = pluginFn;
//# sourceMappingURL=ts.js.map
