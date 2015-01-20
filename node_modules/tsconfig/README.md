# tsconfig
[![Build Status](https://secure.travis-ci.org/TypeStrong/tsconfig.svg?branch=master)](http://travis-ci.org/TypeStrong/tsconfig)

Based on [this spec](https://github.com/Microsoft/TypeScript/issues/1667) and [this implementation](https://github.com/Microsoft/TypeScript/pull/1692)

A specification for a file format + parser Implementation for specifying TypeScript projects

# Specification
## Configuration file format
Specify the project configuration in a `tsconfig.json` file in the root of your project. The structure will be specified using the interface `TypeScriptProjectSpecification`: 

```ts
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
    compilerOptions: CompilerOptions;
    files?: string[];            // optional: paths to files
    filesGlob?: string[];       // optional: An array of 'glob / minimatch / RegExp' patterns to specify source files  
}
```
*Note:* `filesGlob` can be fairly dynamic. See [node-glob](https://github.com/isaacs/node-glob) and [minimatch](https://github.com/isaacs/minimatch) (similar to `grunt`) for all the configuration options. If you call any of the API in this project that reads a `tsconfig.json` file, the `files-glob` is auto expanded (on disk) into `files` before returning.  

Please see the valid projects folder : https://github.com/TypeStrong/tsconfig/tree/master/testprojects/valid

## Public API
See [`tsconfig.d.ts`](https://github.com/TypeStrong/tsconfig/blob/master/dist/lib/tsconfig.d.ts). API exists for querying the projects file, querying the projects relevant for single TypeScript file and creating a new projects file.

# Contributing
Please open issues for discussion.
