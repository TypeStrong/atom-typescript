/// <reference path="../../defs/tsd.d.ts"/>
/// <reference path="./interfaces.d.ts"/>

import fs = require('fs');
import path = require('path');
import grunt = require('grunt');
import _str = require('underscore.string');
import _ = require('underscore');
import os = require('os');
import utils = require('./utils');

// Setup when transformers are triggered
var currentTargetFiles: string[];
var currentTargetDirs: string[];


// Based on name
// if a filename matches we return a filepath
// If a foldername matches we return a folderpath
function getImports(currentFilePath: string, name: string, targetFiles: string[], targetDirs: string[], getIndexIfDir = true): string[] {
    var files = [];

    // Test if any filename matches 
    var targetFile = _.find(targetFiles, (targetFile) => {
        return path.basename(targetFile) === name
            || path.basename(targetFile, '.d.ts') === name
            || path.basename(targetFile, '.ts') === name;

    });
    if (targetFile) {
        files.push(targetFile);
    }

    // It might be worthwhile to cache this lookup
    // i.e. have a 'foldername':folderpath map passed in

    // Test if dirname matches
    var targetDir = _.find(targetDirs, (targetDir) => {
        return path.basename(targetDir) === name;
    });
    if (targetDir) {
        var possibleIndexFilePath = path.join(targetDir, 'index.ts');
        // If targetDir has an index file AND this is not that file then 
        // use index.ts instead of all the files in the directory
        if (getIndexIfDir
            && fs.existsSync(possibleIndexFilePath)
            && path.relative(currentFilePath, possibleIndexFilePath) !== '') {
            files.push(path.join(targetDir, 'index.ts'));
        }
        // Otherwise we lookup all the files that are in the folder
        else {
            var filesInDir = utils.getFiles(targetDir, (filename) => {
                // exclude current file
                if (path.relative(currentFilePath, filename) === '') { return true; }

                return path.extname(filename) // must have extension : do not exclude directories                
                    && (!_str.endsWith(filename, '.ts') || _str.endsWith(filename, '.d.ts'))
                    && !fs.lstatSync(filename).isDirectory(); // for people that name directories with dots
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
function getTargetFolders(targetFiles: string[]) {
    var folders = [];
    _.forEach(targetFiles, (targetFile) => {
        var dir = path.dirname(targetFile);
        while (dir !== '.') {
            // grunt.log.writeln(dir);
            folders.push(dir);
            dir = path.dirname(dir);
        }
    });

    return folders;
}

class BaseTransformer {

    static tsSignature = '///ts:';
    static tsSignatureMatch = '///ts:{0}=(.*)';

    intro: string;
    match: RegExp;
    signatureGenerated: string;
    constructor(public key: string) {
        this.intro = BaseTransformer.tsSignature + key;
        this.match = new RegExp(utils.format(BaseTransformer.tsSignatureMatch, key));
        this.signatureGenerated = ' ' + this.intro + ':generated';
    }

    isGenerated(line: string) {
        return _str.contains(line, this.signatureGenerated);
    }

    isSignature(line: string) {
        return _str.contains(line, this.intro);
    }

    transform(sourceFile: string, config: string, outputLines: string[]) {
        throw new Error('Must override transform function');
    }
}

class ImportTransformer extends BaseTransformer {

    constructor() {
        super('import');
    }

    importError = '/// No glob matched name: ';

    template: (data?: { filename: string; pathToFile: string }) => string =
    _.template('import <%=filename%> = require(\'<%= pathToFile %>\');' + this.signatureGenerated);

    transform(sourceFile: string, config: string, outputLines: string[]) {
        name = config;
        var sourceFileDirectory = path.dirname(sourceFile);

        var imports = getImports(sourceFile, name, currentTargetFiles, currentTargetDirs);

        if (imports.length) {
            _.forEach(imports, (completePathToFile) => {
                var filename = path.basename(completePathToFile, '.ts');
                // If filename is index, we replace it with dirname: 
                if (filename.toLowerCase() === 'index') {
                    filename = path.basename(path.dirname(completePathToFile));
                }
                var pathToFile = utils.makeRelativePath(sourceFileDirectory, completePathToFile.replace('.ts', ''), true);
                outputLines.push(this.template({ filename: filename, pathToFile: pathToFile }));
            });
        }
        else {
            outputLines.push(this.importError + name + this.signatureGenerated);
        }

    }
}

class ExportTransformer extends BaseTransformer {

    constructor() {
        super('export');
    }

    importError = '/// No glob matched name: ';

    template: (data?: { filename: string; pathToFile: string }) => string =
    _.template('import <%=filename%>_file = require(\'<%= pathToFile %>\');' + this.signatureGenerated
        + os.EOL + 'export var <%=filename%> = <%=filename%>_file;' + this.signatureGenerated);

    // This code is same as import transformer
    // One difference : we do not short circuit to `index.ts` if found
    transform(sourceFile: string, config: string, outputLines: string[]) {
        name = config;
        var sourceFileDirectory = path.dirname(sourceFile);

        var imports = getImports(sourceFile, name, currentTargetFiles, currentTargetDirs, false);

        if (imports.length) {
            _.forEach(imports, (completePathToFile) => {
                var filename = path.basename(completePathToFile, '.ts');
                // If filename is index, we replace it with dirname: 
                if (filename.toLowerCase() === 'index') {
                    filename = path.basename(path.dirname(completePathToFile));
                }
                var pathToFile = utils.makeRelativePath(sourceFileDirectory, completePathToFile.replace('.ts', ''), true);
                outputLines.push(this.template({ filename: filename, pathToFile: pathToFile }));
            });
        }
        else {
            outputLines.push(this.importError + name + this.signatureGenerated);
        }

    }
}

class ReferenceTransformer extends BaseTransformer {

    constructor() {
        super('ref');
    }

    importError = '/// No glob matched name: ';

    template: (data?: { filename: string; pathToFile: string }) => string =
    _.template('/// <reference path="<%= pathToFile %>"/>' + this.signatureGenerated);

    // This code is same as export transformer
    // also we preserve .ts file extension
    transform(sourceFile: string, config: string, outputLines: string[]) {
        name = config;
        var sourceFileDirectory = path.dirname(sourceFile);

        var imports = getImports(sourceFile, name, currentTargetFiles, currentTargetDirs, false);

        if (imports.length) {
            _.forEach(imports, (completePathToFile) => {
                var filename = path.basename(completePathToFile, '.ts');
                // If filename is index, we replace it with dirname: 
                if (filename.toLowerCase() === 'index') {
                    filename = path.basename(path.dirname(completePathToFile));
                }
                var pathToFile = utils.makeRelativePath(sourceFileDirectory, completePathToFile, true);
                outputLines.push(this.template({ filename: filename, pathToFile: pathToFile }));
            });
        }
        else {
            outputLines.push(this.importError + name + this.signatureGenerated);
        }

    }
}



// This code fixes the line encoding to be per os. 
// I think it is the best option available at the moment.
// I am open for suggestions
export function transformFiles(
    changedFiles: string[],
    targetFiles: string[],
    target: ITargetOptions,
    task: ITaskOptions) {

    currentTargetDirs = getTargetFolders(targetFiles);
    currentTargetFiles = targetFiles;

    ///////////////////////////////////// transformation

    var transformers: BaseTransformer[] = [
        new ImportTransformer(),
        new ExportTransformer(),
        new ReferenceTransformer()
    ];

    _.forEach(changedFiles, (fileToProcess) => {
        var contents = fs.readFileSync(fileToProcess).toString();

        // If no signature don't bother with this file
        if (!_str.contains(contents, BaseTransformer.tsSignature)) {
            return;
        }


        var lines = contents.split(/\r\n|\r|\n/);
        var outputLines: string[] = [];

        for (var i = 0; i < lines.length; i++) {

            var line = lines[i];

            //// Debugging 
            // grunt.log.writeln('line'.green);
            // grunt.log.writeln(line);

            // Skip generated lines as these will get regenerated
            if (_.some(transformers, (transformer: BaseTransformer) => transformer.isGenerated(line))) {
                continue;
            }

            // Directive line
            if (_.some(transformers, (transformer: BaseTransformer) => {
                if (transformer.isSignature(line)) {
                    // The code gen directive line automatically qualifies
                    outputLines.push(line);

                    // find the name: 
                    var match = line.match(transformer.match);
                    if (!match || !match[1]) {
                        outputLines.push('/// Must match: ' + transformer.match + transformer.signatureGenerated);
                    }
                    else {
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
