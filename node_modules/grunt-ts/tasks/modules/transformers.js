/// <reference path="../../defs/tsd.d.ts"/>
/// <reference path="./interfaces.d.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var fs = require('fs');
var path = require('path');
var grunt = require('grunt');
var _str = require('underscore.string');
var _ = require('underscore');
var os = require('os');
var utils = require('./utils');

// Setup when transformers are triggered
var currentTargetFiles;
var currentTargetDirs;

// Based on name
// if a filename matches we return a filepath
// If a foldername matches we return a folderpath
function getImports(currentFilePath, name, targetFiles, targetDirs, getIndexIfDir) {
    if (typeof getIndexIfDir === "undefined") { getIndexIfDir = true; }
    var files = [];

    // Test if any filename matches
    var targetFile = _.find(targetFiles, function (targetFile) {
        return path.basename(targetFile) === name || path.basename(targetFile, '.d.ts') === name || path.basename(targetFile, '.ts') === name;
    });
    if (targetFile) {
        files.push(targetFile);
    }

    // It might be worthwhile to cache this lookup
    // i.e. have a 'foldername':folderpath map passed in
    // Test if dirname matches
    var targetDir = _.find(targetDirs, function (targetDir) {
        return path.basename(targetDir) === name;
    });
    if (targetDir) {
        var possibleIndexFilePath = path.join(targetDir, 'index.ts');

        // If targetDir has an index file AND this is not that file then
        // use index.ts instead of all the files in the directory
        if (getIndexIfDir && fs.existsSync(possibleIndexFilePath) && path.relative(currentFilePath, possibleIndexFilePath) !== '') {
            files.push(path.join(targetDir, 'index.ts'));
        } else {
            var filesInDir = utils.getFiles(targetDir, function (filename) {
                // exclude current file
                if (path.relative(currentFilePath, filename) === '') {
                    return true;
                }

                return path.extname(filename) && (!_str.endsWith(filename, '.ts') || _str.endsWith(filename, '.d.ts')) && !fs.lstatSync(filename).isDirectory();
            });
            filesInDir.sort(); // Sort needed to increase reliability of codegen between runs
            files = files.concat(filesInDir);
        }
    }

    return files;
}

// Algo
// Notice that the file globs come as
// test/fail/ts/deep/work.ts
// So simply get dirname recursively till reach root '.'
function getTargetFolders(targetFiles) {
    var folders = [];
    _.forEach(targetFiles, function (targetFile) {
        var dir = path.dirname(targetFile);
        while (dir !== '.') {
            // grunt.log.writeln(dir);
            folders.push(dir);
            dir = path.dirname(dir);
        }
    });

    return folders;
}

var BaseTransformer = (function () {
    function BaseTransformer(key) {
        this.key = key;
        this.intro = BaseTransformer.tsSignature + key;
        this.match = new RegExp(utils.format(BaseTransformer.tsSignatureMatch, key));
        this.signatureGenerated = ' ' + this.intro + ':generated';
    }
    BaseTransformer.prototype.isGenerated = function (line) {
        return _str.contains(line, this.signatureGenerated);
    };

    BaseTransformer.prototype.isSignature = function (line) {
        return _str.contains(line, this.intro);
    };

    BaseTransformer.prototype.transform = function (sourceFile, config, outputLines) {
        throw new Error('Must override transform function');
    };
    BaseTransformer.tsSignature = '///ts:';
    BaseTransformer.tsSignatureMatch = '///ts:{0}=(.*)';
    return BaseTransformer;
})();

var ImportTransformer = (function (_super) {
    __extends(ImportTransformer, _super);
    function ImportTransformer() {
        _super.call(this, 'import');
        this.importError = '/// No glob matched name: ';
        this.template = _.template('import <%=filename%> = require(\'<%= pathToFile %>\');' + this.signatureGenerated);
    }
    ImportTransformer.prototype.transform = function (sourceFile, config, outputLines) {
        var _this = this;
        name = config;
        var sourceFileDirectory = path.dirname(sourceFile);

        var imports = getImports(sourceFile, name, currentTargetFiles, currentTargetDirs);

        if (imports.length) {
            _.forEach(imports, function (completePathToFile) {
                var filename = path.basename(completePathToFile, '.ts');

                // If filename is index, we replace it with dirname:
                if (filename.toLowerCase() === 'index') {
                    filename = path.basename(path.dirname(completePathToFile));
                }
                var pathToFile = utils.makeRelativePath(sourceFileDirectory, completePathToFile.replace('.ts', ''), true);
                outputLines.push(_this.template({ filename: filename, pathToFile: pathToFile }));
            });
        } else {
            outputLines.push(this.importError + name + this.signatureGenerated);
        }
    };
    return ImportTransformer;
})(BaseTransformer);

var ExportTransformer = (function (_super) {
    __extends(ExportTransformer, _super);
    function ExportTransformer() {
        _super.call(this, 'export');
        this.importError = '/// No glob matched name: ';
        this.template = _.template('import <%=filename%>_file = require(\'<%= pathToFile %>\');' + this.signatureGenerated + os.EOL + 'export var <%=filename%> = <%=filename%>_file;' + this.signatureGenerated);
    }
    // This code is same as import transformer
    // One difference : we do not short circuit to `index.ts` if found
    ExportTransformer.prototype.transform = function (sourceFile, config, outputLines) {
        var _this = this;
        name = config;
        var sourceFileDirectory = path.dirname(sourceFile);

        var imports = getImports(sourceFile, name, currentTargetFiles, currentTargetDirs, false);

        if (imports.length) {
            _.forEach(imports, function (completePathToFile) {
                var filename = path.basename(completePathToFile, '.ts');

                // If filename is index, we replace it with dirname:
                if (filename.toLowerCase() === 'index') {
                    filename = path.basename(path.dirname(completePathToFile));
                }
                var pathToFile = utils.makeRelativePath(sourceFileDirectory, completePathToFile.replace('.ts', ''), true);
                outputLines.push(_this.template({ filename: filename, pathToFile: pathToFile }));
            });
        } else {
            outputLines.push(this.importError + name + this.signatureGenerated);
        }
    };
    return ExportTransformer;
})(BaseTransformer);

var ReferenceTransformer = (function (_super) {
    __extends(ReferenceTransformer, _super);
    function ReferenceTransformer() {
        _super.call(this, 'ref');
        this.importError = '/// No glob matched name: ';
        this.template = _.template('/// <reference path="<%= pathToFile %>"/>' + this.signatureGenerated);
    }
    // This code is same as export transformer
    // also we preserve .ts file extension
    ReferenceTransformer.prototype.transform = function (sourceFile, config, outputLines) {
        var _this = this;
        name = config;
        var sourceFileDirectory = path.dirname(sourceFile);

        var imports = getImports(sourceFile, name, currentTargetFiles, currentTargetDirs, false);

        if (imports.length) {
            _.forEach(imports, function (completePathToFile) {
                var filename = path.basename(completePathToFile, '.ts');

                // If filename is index, we replace it with dirname:
                if (filename.toLowerCase() === 'index') {
                    filename = path.basename(path.dirname(completePathToFile));
                }
                var pathToFile = utils.makeRelativePath(sourceFileDirectory, completePathToFile, true);
                outputLines.push(_this.template({ filename: filename, pathToFile: pathToFile }));
            });
        } else {
            outputLines.push(this.importError + name + this.signatureGenerated);
        }
    };
    return ReferenceTransformer;
})(BaseTransformer);

// This code fixes the line encoding to be per os.
// I think it is the best option available at the moment.
// I am open for suggestions
function transformFiles(changedFiles, targetFiles, target, task) {
    currentTargetDirs = getTargetFolders(targetFiles);
    currentTargetFiles = targetFiles;

    ///////////////////////////////////// transformation
    var transformers = [
        new ImportTransformer(),
        new ExportTransformer(),
        new ReferenceTransformer()
    ];

    _.forEach(changedFiles, function (fileToProcess) {
        var contents = fs.readFileSync(fileToProcess).toString();

        // If no signature don't bother with this file
        if (!_str.contains(contents, BaseTransformer.tsSignature)) {
            return;
        }

        var lines = contents.split(/\r\n|\r|\n/);
        var outputLines = [];

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];

            //// Debugging
            // grunt.log.writeln('line'.green);
            // grunt.log.writeln(line);
            // Skip generated lines as these will get regenerated
            if (_.some(transformers, function (transformer) {
                return transformer.isGenerated(line);
            })) {
                continue;
            }

            // Directive line
            if (_.some(transformers, function (transformer) {
                if (transformer.isSignature(line)) {
                    // The code gen directive line automatically qualifies
                    outputLines.push(line);

                    // find the name:
                    var match = line.match(transformer.match);
                    if (!match || !match[1]) {
                        outputLines.push('/// Must match: ' + transformer.match + transformer.signatureGenerated);
                    } else {
                        var config = match[1];
                        config = config.trim();

                        // Code gen in place
                        transformer.transform(fileToProcess, config, outputLines);
                    }

                    return true;
                }
            })) {
                continue;
            }

            // Lines not generated or not directives
            outputLines.push(line);
        }
        var transformedContent = outputLines.join(os.EOL);
        if (transformedContent !== contents) {
            grunt.file.write(fileToProcess, transformedContent);
        }
    });
}
exports.transformFiles = transformFiles;
//# sourceMappingURL=transformers.js.map
