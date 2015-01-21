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

// Main configuration
interface TypeScriptProjectSpecification {
    compilerOptions?: CompilerOptions;
    files?: string[];            // optional: paths to files
    filesGlob?: string[];        // optional: An array of 'glob / minimatch / RegExp' patterns to specify source files  
}

///////// FOR USE WITH THE API /////////////

interface TypeScriptProjectFileDetails {
    projectFileDirectory: string; // The path to the project file
    project: TypeScriptProjectSpecification;
}