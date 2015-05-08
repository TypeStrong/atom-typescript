# Magic
Basically we run `makeTypeScriptGlobal.ts` (both in parent and child) to export `module ts` to the variable `global.ts` so we can just use `ts.` without any imports.
This isn't ideal but if you are willing to do more work to make it easier/safer to use the compiler source send a PR :P.

# How to update the compiler source
* get a copy of `microsoft/typescript` and checkout `master`.
* Copy the `compiler` and `services` folders from the TypeScript `master` to here.
* Delete the following:
  * `compiler/tsc.ts` as that is not a part of `services` proper and is used for command line handling which we don't need.
  * `compiler/tsconfig.json`
  * `services/tsconfig.json`

# Notes
When in debug mode we use the files from these folders. The order of how the files in `compiler` is run in the `vm` seems very touchy so try to copy that from the services `tsconfig.json`.

# package.json TypeScript vs this
We use `package.json` as its binary as faster. We use the files in this folder to provide the type information for package.json stuff. You can enable a value from `debug.ts` to use these files at runtime instead of package.json file for testing out compiler modifications.
