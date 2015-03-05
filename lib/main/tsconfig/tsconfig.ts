///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

import simpleValidator = require('./simpleValidator');
var types = simpleValidator.types;

// Most compiler options come from require('typescript').CompilerOptions, but
// 'module' and 'target' cannot use the same enum as that interface since we
// do not want to force users to put magic numbers in their tsconfig files
// TODO: Use require('typescript').parseConfigFile when TS1.5 is released
interface CompilerOptions {
    allowNonTsExtensions?: boolean;
    charset?: string;
    codepage?: number;
    declaration?: boolean;
    diagnostics?: boolean;
    emitBOM?: boolean;
    help?: boolean;
    locale?: string;
    mapRoot?: string;                                 // Optionally Specifies the location where debugger should locate map files after deployment
    module?: string;                                  //'amd'|'commonjs' (default)
    noEmitOnError?: boolean;
    noErrorTruncation?: boolean;
    noImplicitAny?: boolean;                          // Error on inferred `any` type
    noLib?: boolean;
    noLibCheck?: boolean;
    noResolve?: boolean;
    out?: string;
    outDir?: string;                                  // Redirect output structure to this directory
    preserveConstEnums?: boolean;
    removeComments?: boolean;                         // Do not emit comments in output
    sourceMap?: boolean;                              // Generates SourceMaps (.map files)
    sourceRoot?: string;                              // Optionally specifies the location where debugger should locate TypeScript source files after deployment
    suppressImplicitAnyIndexErrors?: boolean;
    target?: string;                                  // 'es3'|'es5' (default)|'es6'
    version?: boolean;
    watch?: boolean;
}

var compilerOptionsValidation: simpleValidator.ValidationInfo = {
    allowNonTsExtensions: { type: simpleValidator.types.boolean },
    charset: { type: simpleValidator.types.string },
    codepage: { type: types.number },
    declaration: { type: types.boolean },
    diagnostics: { type: types.boolean },
    emitBOM: { type: types.boolean },
    help: { type: types.boolean },
    locals: { type: types.string },
    mapRoot: { type: types.string },
    module: { type: types.string, validValues: ['commonjs', 'amd'] },
    noEmitOnError: { type: types.boolean },
    noErrorTruncation: { type: types.boolean },
    noImplicitAny: { type: types.boolean },
    noLib: { type: types.boolean },
    noLibCheck: { type: types.boolean },
    noResolve: { type: types.boolean },
    out: { type: types.string },
    outDir: { type: types.string },
    preserveConstEnums: { type: types.boolean },
    removeComments: { type: types.boolean },
    sourceMap: { type: types.boolean },
    sourceRoot: { type: types.string },
    suppressImplicitAnyIndexErrors: { type: types.boolean },
    target: { type: types.string, validValues: ['es3', 'es5', 'es6'] },
    version: { type: types.boolean },
    watch: { type: types.boolean },
}
var validator = new simpleValidator.SimpleValidator(compilerOptionsValidation);

interface TypeScriptProjectRawSpecification {
    version?: string;
    compilerOptions?: CompilerOptions;
    files?: string[];                                   // optional: paths to files
    filesGlob?: string[];                               // optional: An array of 'glob / minimatch / RegExp' patterns to specify source files
    format?: formatting.FormatCodeOptions;                  // optional: formatting options
}

// Main configuration
export interface TypeScriptProjectSpecification {
    compilerOptions: ts.CompilerOptions;
    files: string[];
    format: ts.FormatCodeOptions;
}

///////// FOR USE WITH THE API /////////////

export interface TypeScriptProjectFileDetails {
    /** The path to the project file. This acts as the baseDIR */
    projectFileDirectory: string; 
    /** The actual path of the project file (including tsconfig.json) */
    projectFilePath: string;
    project: TypeScriptProjectSpecification;
}


//////////////////////////////////////////////////////////////////////

export var errors = {
    GET_PROJECT_INVALID_PATH: 'Invalid Path',
    GET_PROJECT_NO_PROJECT_FOUND: 'No Project Found',
    GET_PROJECT_FAILED_TO_OPEN_PROJECT_FILE: 'Failed to fs.readFileSync the project file',
    GET_PROJECT_JSON_PARSE_FAILED: 'Failed to JSON.parse the project file',
    GET_PROJECT_GLOB_EXPAND_FAILED: 'Failed to expand filesGlob in the project file',
    GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS: 'Project file contains invalid options',

    CREATE_FILE_MUST_EXIST: 'To create a project the file must exist',
    CREATE_PROJECT_ALREADY_EXISTS: 'Project file already exists',
};
export interface GET_PROJECT_JSON_PARSE_FAILED_Details {
    projectFilePath: string;
    error: Error;
}
export interface GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS_Details {
    projectFilePath: string;
    errorMessage: string;
}
function errorWithDetails<T>(error: Error, details: T): Error {
    error.details = details;
    return error;
}

import fs = require('fs');
import path = require('path');
import expand = require('glob-expand');
import ts = require('typescript');
import os = require('os');
import formatting = require('./formatting');

var projectFileName = 'tsconfig.json';
var defaultFilesGlob = ["./**/*.ts", "!./node_modules/**/*.ts"];
var typeScriptVersion = '1.4.1';

export var defaults: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS,
    declaration: false,
    noImplicitAny: false,
    removeComments: true,
    noLib: false
};

// TODO: add validation and add all options
var deprecatedKeys = {
    outdir: 'outDir',
    noimplicitany: 'noImplicitAny',
    removecomments: 'removeComments',
    sourcemap: 'sourceMap',
    sourceroot: 'sourceRoot',
    maproot: 'mapRoot',
    nolib: 'noLib'
};

var typescriptEnumMap = {
    target: {
        'es3': ts.ScriptTarget.ES3,
        'es5': ts.ScriptTarget.ES5,
        'es6': ts.ScriptTarget.ES6,
        'latest': ts.ScriptTarget.Latest
    },
    module: {
        'none': ts.ModuleKind.None,
        'commonjs': ts.ModuleKind.CommonJS,
        'amd': ts.ModuleKind.AMD
    }
};

var jsonEnumMap = {
    target: (function() {
        var map: { [key: number]: string; } = {};
        map[ts.ScriptTarget.ES3] = 'es3';
        map[ts.ScriptTarget.ES5] = 'es5';
        map[ts.ScriptTarget.ES6] = 'es6';
        map[ts.ScriptTarget.Latest] = 'latest';
        return map;
    })(),
    module: (function() {
        var map: { [key: number]: string; } = {};
        map[ts.ModuleKind.None] = 'none';
        map[ts.ModuleKind.CommonJS] = 'commonjs';
        map[ts.ModuleKind.AMD] = 'amd';
        return map;
    })()
};

function mixin(target: any, source: any): any {
    for (var key in source) {
        target[key] = source[key];
    }
    return target;
}

function rawToTsCompilerOptions(jsonOptions: CompilerOptions, projectDir: string): ts.CompilerOptions {
    // Cannot use Object.create because the compiler checks hasOwnProperty
    var compilerOptions = <ts.CompilerOptions> mixin({}, defaults);
    for (var key in jsonOptions) {
        if (deprecatedKeys[key]) {
            // Warn using : https://github.com/TypeStrong/atom-typescript/issues/51
            // atom.notifications.addWarning('Compiler option "' + key + '" is deprecated; use "' + deprecatedKeys[key] + '" instead');
            key = deprecatedKeys[key];
        }

        if (typescriptEnumMap[key]) {
            compilerOptions[key] = typescriptEnumMap[key][jsonOptions[key].toLowerCase()];
        }
        else {
            compilerOptions[key] = jsonOptions[key];
        }
    }

    if (compilerOptions.outDir !== undefined) {
        compilerOptions.outDir = path.resolve(projectDir, compilerOptions.outDir);
    }

    if (compilerOptions.out !== undefined) {
        compilerOptions.out = path.resolve(projectDir, compilerOptions.out);
    }

    return compilerOptions;
}

function tsToRawCompilerOptions(compilerOptions: ts.CompilerOptions): CompilerOptions {
    // Cannot use Object.create because JSON.stringify will only serialize own properties
    var jsonOptions = <CompilerOptions> mixin({}, compilerOptions);

    if (compilerOptions.target !== undefined) {
        jsonOptions.target = jsonEnumMap.target[compilerOptions.target];
    }

    if (compilerOptions.module !== undefined) {
        jsonOptions.module = jsonEnumMap.module[compilerOptions.module];
    }

    return jsonOptions;
}

/** Given an src (source file or directory) goes up the directory tree to find the project specifications.
 * Use this to bootstrap the UI for what project the user might want to work on.
 * Note: Definition files (.d.ts) are considered thier own project
 */
export function getProjectSync(pathOrSrcFile: string): TypeScriptProjectFileDetails {

    if (!fs.existsSync(pathOrSrcFile))
        throw new Error(errors.GET_PROJECT_INVALID_PATH);

    // Get the path directory
    var dir = fs.lstatSync(pathOrSrcFile).isDirectory() ? pathOrSrcFile : path.dirname(pathOrSrcFile);

    // If we have a .d.ts file then it is its own project and return
    if (dir !== pathOrSrcFile) { // Not a directory
        if (endsWith(pathOrSrcFile.toLowerCase(), '.d.ts')) {
            return {
                projectFileDirectory: dir,
                projectFilePath: dir + '/' + projectFileName,
                project: {
                    compilerOptions: defaults,
                    files: [pathOrSrcFile],
                    format: formatting.defaultFormatCodeOptions()
                },
            }
        }
    }

    // Keep going up till we find the project file
    var projectFile = '';
    while (fs.existsSync(dir)) { // while directory exists

        var potentialProjectFile = dir + '/' + projectFileName;
        if (fs.existsSync(potentialProjectFile)) { // found it
            projectFile = potentialProjectFile;
            break;
        }
        else { // go up
            var before = dir;
            dir = path.dirname(dir);
            // At root:
            if (dir == before) throw new Error(errors.GET_PROJECT_NO_PROJECT_FOUND);
        }
    }
    projectFile = path.normalize(projectFile);
    var projectFileDirectory = path.dirname(projectFile) + path.sep;

    // We now have a valid projectFile. Parse it:
    var projectSpec: TypeScriptProjectRawSpecification;
    try {
        var projectFileTextContent = fs.readFileSync(projectFile, 'utf8');
    } catch (ex) {
        throw new Error(errors.GET_PROJECT_FAILED_TO_OPEN_PROJECT_FILE);
    }
    try {
        projectSpec = JSON.parse(projectFileTextContent);
    } catch (ex) {
        throw errorWithDetails<GET_PROJECT_JSON_PARSE_FAILED_Details>(
            new Error(errors.GET_PROJECT_JSON_PARSE_FAILED), { projectFilePath: consistentPath(projectFile), error: ex.message });
    }

    // Setup default project options
    if (!projectSpec.compilerOptions) projectSpec.compilerOptions = {};

    // Our customizations for "tsconfig.json"
    // Use grunt.file.expand type of logic
    var cwdPath = path.relative(process.cwd(), path.dirname(projectFile));
    // If there is no files or no filesGlob, we create one.
    if (!projectSpec.files && !projectSpec.filesGlob) {
        projectSpec.filesGlob = defaultFilesGlob;
    }
    if (projectSpec.filesGlob) {
        try {
            projectSpec.files = expand({ filter: 'isFile', cwd: cwdPath }, projectSpec.filesGlob);
        }
        catch (ex) {
            throw errorWithDetails(
                new Error(errors.GET_PROJECT_GLOB_EXPAND_FAILED),
                { glob: projectSpec.filesGlob, projectFilePath: consistentPath(projectFile), error: ex.message });
        }
        var prettyJSONProjectSpec = prettyJSON(projectSpec);
        if (prettyJSONProjectSpec !== projectFileTextContent) {
            fs.writeFileSync(projectFile, prettyJSON(projectSpec));
        }
    }

    // Remove all relativeness
    projectSpec.files = projectSpec.files.map((file) => path.resolve(projectFileDirectory, file));

    var project: TypeScriptProjectSpecification = {
        compilerOptions: {},
        files: projectSpec.files,
        format: formatting.makeFormatCodeOptions(projectSpec.format),
    };
    
    // Validate the raw compiler options before converting them to TS compiler options 
    var validationResult = validator.validate(projectSpec.compilerOptions);
    if (validationResult.errorMessage) {
        throw errorWithDetails<GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS_Details>(
            new Error(errors.GET_PROJECT_PROJECT_FILE_INVALID_OPTIONS),
            { projectFilePath: consistentPath(projectFile), errorMessage: validationResult.errorMessage }
            );
    }
    
    // Convert the raw options to TS options
    project.compilerOptions = rawToTsCompilerOptions(projectSpec.compilerOptions, projectFileDirectory);

    // Expand files to include references
    project.files = increaseProjectForReferenceAndImports(project.files);

    // Normalize to "/" for all files
    // And take the uniq values
    project.files = uniq(project.files.map(consistentPath));
    projectFileDirectory = removeTrailingSlash(consistentPath(projectFileDirectory));

    return {
        projectFileDirectory: projectFileDirectory,
        projectFilePath: projectFileDirectory + '/' + projectFileName,
        project: project
    };

}

/** Creates a project by  source file location. Defaults are assumed unless overriden by the optional spec. */
export function createProjectRootSync(srcFile: string, defaultOptions?: ts.CompilerOptions) {
    if (!fs.existsSync(srcFile)) {
        throw new Error(errors.CREATE_FILE_MUST_EXIST);
    }

    // Get directory
    var dir = fs.lstatSync(srcFile).isDirectory() ? srcFile : path.dirname(srcFile);
    var projectFilePath = path.normalize(dir + '/' + projectFileName);

    if (fs.existsSync(projectFilePath))
        throw new Error(errors.CREATE_PROJECT_ALREADY_EXISTS);

    // We need to write the raw spec
    var projectSpec: TypeScriptProjectRawSpecification = {};
    projectSpec.version = typeScriptVersion;
    projectSpec.compilerOptions = tsToRawCompilerOptions(defaultOptions || defaults);
    projectSpec.filesGlob = defaultFilesGlob;

    fs.writeFileSync(projectFilePath, prettyJSON(projectSpec));
    return getProjectSync(srcFile);
}

// we work with "/" for all paths
export function consistentPath(filePath: string): string {
    return filePath.split('\\').join('/');
}

/////////////////////////////////////////////
/////////////// UTILITIES ///////////////////
/////////////////////////////////////////////

function increaseProjectForReferenceAndImports(files: string[]) {

    var filesMap = simpleValidator.createMap(files);
    var willNeedMoreAnalysis = (file: string) => {
        if (!filesMap[file]) {
            filesMap[file] = true;
            files.push(file);
            return true;
        } else {
            return false;
        }
    }

    var getReferencedOrImportedFiles = (files: string[]): string[]=> {
        var referenced: string[][] = [];

        files.forEach(file => {
            try {
                var content = fs.readFileSync(file).toString();
            }
            catch (ex) {
                // if we cannot read a file for whatever reason just quit
                return;
            }
            var preProcessedFileInfo = ts.preProcessFile(content, true),
                dir = path.dirname(file);

            referenced.push(
                preProcessedFileInfo.referencedFiles.map(fileReference => path.resolve(dir, fileReference.filename))
                    .concat(
                    preProcessedFileInfo.importedFiles
                        .filter((fileReference) => pathIsRelative(fileReference.filename))
                        .map(fileReference => {
                        var file = path.resolve(dir, fileReference.filename + '.ts');
                        if (!fs.existsSync(file)) {
                            file = path.resolve(dir, fileReference.filename + '.d.ts');
                        }
                        return file;
                    })
                    )
                );
        });

        return selectMany(referenced);
    }

    var more = getReferencedOrImportedFiles(files)
        .filter(willNeedMoreAnalysis);
    while (more.length) {
        more = getReferencedOrImportedFiles(files)
            .filter(willNeedMoreAnalysis);
    }

    return files;
}

function prettyJSON(object: any): string {
    var cache = [];
    var value = JSON.stringify(object,
        // fixup circular reference
        function(key, value) {
            if (typeof value === 'object' && value !== null) {
                if (cache.indexOf(value) !== -1) {
                    // Circular reference found, discard key
                    return;
                }
                // Store value in our collection
                cache.push(value);
            }
            return value;
        },
    // indent 4 spaces
        4);
    cache = null;
    return value;
}

// Not particularly awesome e.g. '/..foo' will pass
function pathIsRelative(str: string) {
    if (!str.length) return false;
    return str[0] == '.' || str.substring(0, 2) == "./" || str.substring(0, 3) == "../";
}

// Not optimized
function selectMany<T>(arr: T[][]): T[] {
    var result = [];
    for (var i = 0; i < arr.length; i++) {
        for (var j = 0; j < arr[i].length; j++) {
            result.push(arr[i][j]);
        }
    }
    return result;
}

function endsWith(str: string, suffix: string): boolean {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function uniq(arr: string[]): string[] {
    var map = simpleValidator.createMap(arr);
    return Object.keys(map);
}

// Converts "C:\boo" , "C:\boo\foo.ts" => "./foo.ts"; Works on unix as well.
export function makeRelativePath(relativeFolder: string, filePath: string) {
    var relativePath = path.relative(relativeFolder, filePath).split('\\').join('/');
    if (relativePath[0] !== '.') {
        relativePath = './' + relativePath;
    }
    return relativePath;
}

export function removeExt(filePath: string) {
    return filePath.substr(0, filePath.lastIndexOf('.'));
}

export function removeTrailingSlash(filePath: string) {
    if (!filePath) return filePath;
    if (endsWith(filePath, '/')) return filePath.substr(0, filePath.length - 1);
    return filePath;
}