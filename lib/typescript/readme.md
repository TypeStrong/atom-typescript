# How to update the compiler source
* get a copy of `microsoft/typescript` and checkout `master`.
* Copy the `compiler` and `services` folders from the TypeScript `master` to here.
* Delete the following:
  * `compiler/tsc.ts` as that is not a part of `services` proper and is used for command line handling which we don't need.
  * `compiler/tsconfig.json`
  * `services/tsconfig.json`


# Magic
Basically we run `makeTypeScriptGlobal.ts` (both in parent and child) to export `module ts` to the variable `global.ts` so we can just use `ts.` without any imports.
This isn't ideal but if you are willing to do more work to make it easier/safer to use the compiler source send a PR :P.

# Notes
We list the files in `makeTypeScriptGlobal.ts`, these are basically the `tsconfig.json` files from the `services` folder, with a minor change to preserve the order:

```ts
"../compiler/diagnosticInformationMap.generated.ts",
"../compiler/commandLineParser.ts",
```

as `commandLineParser` depends on stuff from `compiler/diagnosticInformationMap.generated.ts`. We should report this to the TS team.


# package.json TypeScript vs this
We still have typescript in `package.json` for: `grunt` and `lib.d.ts`. That should go away soon.
