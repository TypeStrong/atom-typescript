# tsproj
[![Build Status](https://secure.travis-ci.org/TypeStrong/tsproj.svg?branch=master)](http://travis-ci.org/TypeStrong/tsproj)

A specification for a file format + Parser Implementation for specifying TypeScript projects

# Specification
## Configuration file format
Specify the project configuration in a `tsproj.yml` file in the root of your project. The structure will be specified using the interface `TypeScriptProjectRootSpecification`: 

```ts
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
```
*Note:* all strings are case insensitive.<br>
*Note:* `defaults` are not required and should not participate in compilation.<br> 
*Note:* If you don't have `projects` then your configuration is invalid.<br>
*Note:* any `default` property can be overridden by individual projects.<br>

Please see the valid projects folder : https://github.com/TypeStrong/tsproj/tree/master/testprojects/valid

## Public API
See `tsproj.d.ts`. API exists for querying the projects file, querying the projects relevant for single TypeScript file and creating a new projects file.

# Contributing
Please open issues for discussion.

# Misc
## Inspirations 
https://github.com/fdecampredon/brackets-typescript and `grunt` configurations. 

Differences: removed the confusion around "target vs. task" options in grunt (here all options are overridable) and root sources in brackets-ts (here defaults are called `defaults`, do not participate in compilation and serve only to seed properties including sources to various projects). 
## Why YAML
So that you can comment your project file for the next dev. 
