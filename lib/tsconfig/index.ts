
interface CompilerOptions {
    target?: string;            // 'es3'|'es5' (default) | 'es6'
    module?: string;            // 'amd'|'commonjs' (default)

    declaration?: boolean;      // Generates corresponding `.d.ts` file
    out?: string;               // Concatenate and emit a single file
    outdir?: string;            // Redirect output structure to this directory

    noimplicitany?: boolean;    // Error on inferred `any` type
    removecomments?: boolean;   // Do not emit comments in output

    sourcemap?: boolean;        // Generates SourceMaps (.map files)
    sourceroot?: string;        // Optionally specifies the location where debugger should locate TypeScript source files after deployment
    maproot?: string;           // Optionally Specifies the location where debugger should locate map files after deployment
}

interface TypeScriptProjectRawSpecification {
    compilerOptions?: CompilerOptions;
    files?: string[];            // optional: paths to files
    filesGlob?: string[];        // optional: An array of 'glob / minimatch / RegExp' patterns to specify source files  
}

// Main configuration
export interface TypeScriptProjectSpecification {
    compilerOptions?: ts.CompilerOptions;
    files?: string[];            // optional: paths to files
}

///////// FOR USE WITH THE API /////////////

export interface TypeScriptProjectFileDetails {
    projectFileDirectory: string; // The path to the project file
    project: TypeScriptProjectSpecification;
}


//////////////////////////////////////////////////////////////////////


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
    removeComments: true
};



// TODO: add validation and add all options
function rawToTsCompilerOptions(raw: CompilerOptions): ts.CompilerOptions {
    // Convert everything inside compilerOptions to lowerCase
    var lower:CompilerOptions = {};
    Object.keys(raw).forEach((key:string) => {
        lower[key.toLowerCase()] = raw[key];
    });

    // Change to enums
    var proper: ts.CompilerOptions = {};
    proper.target =
    lower.target == 'es3' ? ts.ScriptTarget.ES3
        : lower.target == 'es5' ? ts.ScriptTarget.ES5
            : lower.target == 'es6' ? ts.ScriptTarget.ES6
                : defaults.target;
    proper.module =
    lower.module == 'none' ? ts.ModuleKind.None
        : lower.module == 'commonjs' ? ts.ModuleKind.CommonJS
            : lower.module == 'amd' ? ts.ModuleKind.AMD
                : defaults.module;
    proper.declaration = lower.declaration == void 0 ? defaults.declaration : lower.declaration;
    proper.noImplicitAny = lower.noimplicitany == void 0 ? defaults.noImplicitAny : lower.noimplicitany;
    proper.removeComments = lower.removecomments == void 0 ? defaults.removeComments : lower.removecomments;
    return proper;
}

function tsToRawCompilerOptions(proper: ts.CompilerOptions): CompilerOptions {
    var raw: CompilerOptions = {};

    var targetLookup = {};
    targetLookup[ts.ScriptTarget.ES3] = 'es3';
    targetLookup[ts.ScriptTarget.ES5] = 'es5';
    targetLookup[ts.ScriptTarget.ES6] = 'es6';

    var moduleLookup = {};
    moduleLookup[ts.ModuleKind.None] = 'none';
    moduleLookup[ts.ModuleKind.CommonJS] = 'commonjs';
    moduleLookup[ts.ModuleKind.AMD] = 'amd';

    runWithDefault((val) => raw.target = val, targetLookup[proper.target]);
    runWithDefault((val) => raw.module = val, moduleLookup[proper.module]);
    runWithDefault((val) => raw.declaration = val, proper.declaration);
    runWithDefault((val) => raw.noimplicitany = val, proper.noImplicitAny);
    runWithDefault((val) => raw.removecomments = val, proper.removeComments);

    return raw;
}

/** Given an src (source file or directory) goes up the directory tree to find the project specifications. Use this to bootstrap the UI for what project the user might want to work on. */
export function getProjectSync(pathOrSrcFile: string): TypeScriptProjectFileDetails {

    if (!fs.existsSync(pathOrSrcFile))
        throw new Error('Invalid Path');

    // Get the path directory
    var dir = fs.lstatSync(pathOrSrcFile).isDirectory() ? pathOrSrcFile : path.dirname(pathOrSrcFile);

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
            if (dir == before) throw new Error('No Project Found');
        }
    }
    projectFile = path.normalize(projectFile);

    // We now have a valid projectFile. Parse it: 
    try {
        var projectSpec: TypeScriptProjectRawSpecification = JSON.parse(fs.readFileSync(projectFile, 'utf8'));
    } catch (ex) {
        throw new Error("Invalid JSON");
    }
    
    // Setup default project options
    if (!projectSpec.compilerOptions) projectSpec.compilerOptions = {};
    
    // Use grunt.file.expand type of logic
    var cwdPath = path.relative(process.cwd(), path.dirname(projectFile));
    if (!projectSpec.files) projectSpec.filesGlob = ['./**/*.ts'];
    if (projectSpec.filesGlob) {
        projectSpec.files = expand({ filter: 'isFile', cwd: cwdPath }, projectSpec.filesGlob);
        fs.writeFileSync(projectFile, JSON.stringify(projectSpec));
    }

    var project: TypeScriptProjectSpecification = {
        compilerOptions: {},
        files: projectSpec.files
    };

    project.compilerOptions = rawToTsCompilerOptions(projectSpec.compilerOptions);

    return {
        projectFileDirectory: path.dirname(projectFile) + path.sep,
        project: project
    };
}

/** Creates a project at the specified path (or by source file location). Defaults are assumed unless overriden by the optional spec. */
export function createProjectRootSync(pathOrSrcFile: string, defaultOptions?: ts.CompilerOptions) {
    if (!fs.existsSync(pathOrSrcFile))
        throw new Error('Project directory must exist');

    // Get directory 
    var dir = fs.lstatSync(pathOrSrcFile).isDirectory() ? pathOrSrcFile : path.dirname(pathOrSrcFile);
    var projectFilePath = path.normalize(dir + '/' + projectFileName);

    if (fs.existsSync(projectFilePath))
        throw new Error('Project file already exists');

    // Setup a main project
    var project: TypeScriptProjectSpecification = {
        compilerOptions: defaultOptions || defaults
    };

    // We need to write the raw spec
    var projectSpec:TypeScriptProjectRawSpecification = {};
    projectSpec.compilerOptions = tsToRawCompilerOptions(project.compilerOptions);
    
    fs.writeFileSync(projectFilePath, prettyJSON(projectSpec));

    return {
        projectFileDirectory: path.dirname(projectFilePath) + path.sep,
        project: project
    }
}

/** if ( no val given && default given then run with default ) else ( run with val ) */
function runWithDefault<T>(run: (val: T) => any, val: T, def?: T) {
    // no val
    if (val == void 0) {
        if (def != void 0) {
            run(def);
        }
    }
    else {
        run(val);
    }
}

export function prettyJSON(object: any): string {
    var cache = [];
    var value = JSON.stringify(object,
        // fixup circular reference
        function (key, value) {
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