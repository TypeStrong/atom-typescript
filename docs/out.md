# `--out` is BAD
We do not support `--out` as we think its a bad idea for you to use because of the following reasons:

* Runtime Errors
* Fast compile
* Global scope
* Hard to analyze
* Hard to scale
* `_references`

## Runtime Errors

If your code depends on any form of js ordering you will get random errors and runtime.

* class inheritance can break at runtime.
* module splitting can fail at runtime.

## Fast compile
If you use `--out` then single `.ts` files cannot be codegened into single `.js` files in isolation without unnecessary hacks. `--out` essentially forces a slower incremental build.

## Global Scope
Sure you can use name spaces but its still on `window` if you run it in the browser. Namespaces are just an unnecessary workaround. Also `/// <reference` comments introduce an global context in *your code* that can get hard to maintain.

## Hard to analyze
We wish to provide more code analysis tools. These will be easier if you provide us with the dependency chain (implicitly there on a silver platter using external modules).

## Hard to scale
Really just a result of random runtime errors + slower and slower compile times.

## `_references.ts`
Isn't supported by `tsconfig.json` : https://github.com/Microsoft/TypeScript/issues/2472#issuecomment-85330803 You'll have to manually sort the  `files` array. 

## Summary
`--out` is really the job of some build tool. And even such a build tool can benefit from the dependency mentions provided by external modules. So we recommend you use external modules and then let the build tool create a single `.js` for you if you so desire.
