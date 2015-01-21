
interface CompilerOptions {
    target?: string;            // 'es3'|'es5' (default) | 'es6'
    module?: string;            // 'amd'|'commonjs' (default)

    declaration?: boolean;      // Generates corresponding `.d.ts` file
    out?: string;               // Concatenate and emit a single file
    outDir?: string;            // Redirect output structure to this directory

    noImplicitAny?: boolean;    // Error on inferred `any` type
    removeComments?: boolean;   // Do not emit comments in output

    sourceMap?: boolean;        // Generates SourceMaps (.map files)
    sourceRoot?: string;        // Optionally specifies the location where debugger should locate TypeScript source files after deployment
    mapRoot?: string;           // Optionally Specifies the location where debugger should locate map files after deployment
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

function createTSCompilerOptions(options: CompilerOptions): ts.CompilerOptions {
    var tsCompilerOptions: ts.CompilerOptions = {};
    options = options || {};
    tsCompilerOptions.declaration = options.declaration;

    return tsCompilerOptions;
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


    // TODO: Validation
    var project: TypeScriptProjectSpecification = {
        compilerOptions: {},
        files: projectSpec.files
    };


    // Setup with defaults: 
    project.compilerOptions.target =
    projectSpec.compilerOptions.target == 'es3' ? ts.ScriptTarget.ES3
        : projectSpec.compilerOptions.target == 'es5' ? ts.ScriptTarget.ES5
            : projectSpec.compilerOptions.target == 'es6' ? ts.ScriptTarget.ES6
                : defaults.target;
    project.compilerOptions.module =
    projectSpec.compilerOptions.module == 'none' ? ts.ModuleKind.None
        : projectSpec.compilerOptions.module == 'commonjs' ? ts.ModuleKind.CommonJS
            : projectSpec.compilerOptions.module == 'amd' ? ts.ModuleKind.AMD
                : defaults.module;
    project.compilerOptions.declaration = projectSpec.compilerOptions.declaration == void 0 ? defaults.declaration : projectSpec.compilerOptions.declaration;
    project.compilerOptions.noImplicitAny = projectSpec.compilerOptions.noImplicitAny == void 0 ? defaults.noImplicitAny : projectSpec.compilerOptions.noImplicitAny;
    project.compilerOptions.removeComments = projectSpec.compilerOptions.removeComments == void 0 ? defaults.removeComments : projectSpec.compilerOptions.removeComments;

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
    var projectSpec = {};
    
    // TODO: convert defaultOptions to Strings 
    fs.writeFileSync(projectFilePath, JSON.stringify(projectSpec));

    return {
        projectFileDirectory: path.dirname(projectFilePath) + path.sep,
        project: project
    }
}
