///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

// Most compiler options come from require('typescript').CompilerOptions, but
// 'module' and 'target' cannot use the same enum as that interface since we
// do not want to force users to put magic numbers in their tsconfig files
// TODO: Use require('typescript').parseConfigFile when TS1.5 is released
interface CompilerOptions {
    // Backwards compatibility for 0.27.0 and earlier
    outdir?: string;            // Redirect output structure to this directory
    noimplicitany?: boolean;    // Error on inferred `any` type
    removecomments?: boolean;   // Do not emit comments in output
    sourcemap?: boolean;        // Generates SourceMaps (.map files)
    sourceroot?: string;        // Optionally specifies the location where debugger should locate TypeScript source files after deployment
    maproot?: string;           // Optionally Specifies the location where debugger should locate map files after deployment
    nolib?: boolean;

    allowNonTsExtensions?: boolean;
    charset?: string;
    codepage?: number;
    declaration?: boolean;
    diagnostics?: boolean;
    emitBOM?: boolean;
    help?: boolean;
    locale?: string;
    mapRoot?: string;
    module?: string; //'amd'|'commonjs' (default)
    noEmitOnError?: boolean;
    noErrorTruncation?: boolean;
    noImplicitAny?: boolean;
    noLib?: boolean;
    noLibCheck?: boolean;
    noResolve?: boolean;
    out?: string;
    outDir?: string;
    preserveConstEnums?: boolean;
    removeComments?: boolean;
    sourceMap?: boolean;
    sourceRoot?: string;
    suppressImplicitAnyIndexErrors?: boolean;
    target?: string; // 'es3'|'es5' (default)|'es6'
    version?: boolean;
    watch?: boolean;
}

interface TypeScriptProjectRawSpecification {
    compilerOptions?: CompilerOptions;
    files?: string[];            // optional: paths to files
    filesGlob?: string[];        // optional: An array of 'glob / minimatch / RegExp' patterns to specify source files
}

// Main configuration
export interface TypeScriptProjectSpecification {
    compilerOptions: ts.CompilerOptions;
    files: string[];            // optional: paths to files
}

///////// FOR USE WITH THE API /////////////

export interface TypeScriptProjectFileDetails {
    projectFileDirectory: string; // The path to the project file. This acts as the baseDIR
    project: TypeScriptProjectSpecification;
}


//////////////////////////////////////////////////////////////////////

export var errors = {
    GET_PROJECT_INVALID_PATH: 'Invalid Path',
    GET_PROJECT_NO_PROJECT_FOUND: 'No Project Found',
    GET_PROJECT_INVALID_PROJECT_FILE: 'Failed to open / parse the project file',

    CREATE_FILE_MUST_EXIST: 'To create a project the file must exist',
    CREATE_PROJECT_ALREADY_EXISTS: 'Project file already exists',
};


import fs = require('fs');
import path = require('path');
import expand = require('glob-expand');
import ts = require('typescript');

var projectFileName = 'tsconfig.json';

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
    target: (function () {
        var map: { [key: number]: string; } = {};
        map[ts.ScriptTarget.ES3] = 'es3';
        map[ts.ScriptTarget.ES5] = 'es5';
        map[ts.ScriptTarget.ES6] = 'es6';
        map[ts.ScriptTarget.Latest] = 'latest';
        return map;
    })(),
    module: (function () {
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
                project: {
                    compilerOptions: defaults,
                    files: [pathOrSrcFile]
                }
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
    try {
        var projectSpec: TypeScriptProjectRawSpecification = JSON.parse(fs.readFileSync(projectFile, 'utf8'));
    } catch (ex) {
        throw new Error(errors.GET_PROJECT_INVALID_PROJECT_FILE);
    }

    // Setup default project options
    if (!projectSpec.compilerOptions) projectSpec.compilerOptions = {};

    // Use grunt.file.expand type of logic
    var cwdPath = path.relative(process.cwd(), path.dirname(projectFile));
    if (!projectSpec.files) projectSpec.filesGlob = ['./**/*.ts'];
    if (projectSpec.filesGlob) {
        projectSpec.files = expand({ filter: 'isFile', cwd: cwdPath }, projectSpec.filesGlob);
        fs.writeFileSync(projectFile, prettyJSON(projectSpec));
    }

    // Remove all relativeness
    projectSpec.files = projectSpec.files.map((file) => path.resolve(projectFileDirectory, file));

    var project: TypeScriptProjectSpecification = {
        compilerOptions: {},
        files: projectSpec.files
    };

    project.compilerOptions = rawToTsCompilerOptions(projectSpec.compilerOptions, projectFileDirectory);

    // Expand files to include references
    project.files = increaseProjectForReferenceAndImports(project.files);

    // Normalize to "/" for all files
    // And take the uniq values
    project.files = uniq(project.files.map(consistentPath));

    return {
        projectFileDirectory: projectFileDirectory,
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
    projectSpec.compilerOptions = tsToRawCompilerOptions(defaultOptions || defaults);
    projectSpec.filesGlob = ["./**/*.ts", "!node_modules/**/*.ts"]

    fs.writeFileSync(projectFilePath, prettyJSON(projectSpec));
    return getProjectSync(srcFile);
}

// we work with "/" for all paths
export function consistentPath(filePath: string): string {
    return filePath.replace('\\', '/');
}

/////////////////////////////////////////////
/////////////// UTILITIES ///////////////////
/////////////////////////////////////////////

function increaseProjectForReferenceAndImports(files: string[]) {

    var filesMap = createMap(files);
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

function createMap(arr: string[]): { [string: string]: boolean } {
    return arr.reduce((result: { [string: string]: boolean }, key: string) => {
        result[key] = true;
        return result;
    }, <{ [string: string]: boolean }>{});
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
    var map = createMap(arr);
    return Object.keys(map);
}
