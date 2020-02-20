This file contains descriptions of the more advanced Atom-TypeScript features. If you don't understand what's written here, most probably, you don't need it.

# Specifying a custom path to TypeScript SDK

Atom-TypeScript needs to decide what SDK it should use for each new opened TypeScript file (remember those could be from different projects). Here's the overview of how Atom-TypeScript decides what SDK path it should use:

1. From the TypeScript source file, traverse the directory tree upwards, looking for `.atom-typescript.json` or `.atom/atom-typescript.json` or `.vscode/settings.json` in each directory (in that order, i.e. if a directory contains `.atom-typescript.json`, only that one will be used). If a file is found, parse it as a JSON object and

    - If the JSON object has `tsdkPath` property, assign it to `sdkPath`.
    - Otherwise, if the JSON object has `typescript.tsdk` property, use the parent directory name of the path specified in the property as `sdkPath` (i.e. `sdkPath = path.dirname(jsonObject['typescript.tsdk'])`)
    - Otherwise, go to 2.

    If `sdkPath` is relative, assume it is relative to the directory being traversed. Check if `tsserver`/`tsc` binary exists under `${sdkPath}/lib/${binaryName}.js`. If it exists, use it, otherwise go to 2.

2. Use Atom configuration `atom-typescript.tsdkPath` as as path to TypeScript SDK installation directory. Check if `tsserver`/`tsc` binary exists under `${tsdkPath}/lib/${binaryName}.js`. If it exists, use it, else go to 3.

3. Use the bundled TypeScript SDK.

Note that the result is memoized, so if you change path to SDK (using any method) when Atom-TypeScript is running, you'll need to restart Atom for changes to take effect.
