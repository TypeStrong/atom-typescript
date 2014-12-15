interface TypeScriptProjectSpecification {
    sources?: string[];         // An array of 'minimatch` patterns to specify source files  
    target?: string;            // 'es3'|'es5'
    module?: string;            // 'amd'|'commonjs'

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
interface TypeScriptProjectsRootSpecification extends TypeScriptProjectSpecification {
    defaults?: TypeScriptProjectSpecification;
    projects: {
        [projectName: string]: TypeScriptProjectSpecification;
    }
}

///////// FOR USE WITH THE API /////////////

interface TypeScriptProjectSpecificationParsed extends TypeScriptProjectSpecification {
    name: string; // project name. `.root` if the anonymous root project
    expandedSources: string[]; // The expanded `sources` so you don't need to expand yourself
}

interface TypeScriptProjectFileDetails {
    projectFileDirectory: string; // The path to the project file
    projects: TypeScriptProjectSpecificationParsed[];
}