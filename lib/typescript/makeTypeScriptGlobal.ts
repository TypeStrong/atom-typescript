////////////////////////////////// MAGIC
import vm = require('vm');
import fs = require('fs');
import os = require('os');
import path = require('path');
import {debugLanguageService} from "../worker/debug";

global.stack = function() {
    console.error((<any>new Error()).stack);
}

/** Makes the bundled typescript services global or (if passed in) a custom typescriptServices file */
export function makeTsGlobal(typescriptServices?: string) {
    var sandbox = {
        // This is going to gather the ts module exports
        ts: {},
        console: console,
        stack: global.stack,
        require: require,
        module: module,
        process: process
    };
    vm.createContext(sandbox);

    if (debugLanguageService) {
        // Load all the files from `./compiler` followed by `./services`
        // Making sure that a *few specific* files are in the correct order
        // I have found the ordering in most of the compiler to be *fiddly*
        var expand = require('glob-expand');
        let files: string[] = expand({ filter: 'isFile', cwd: __dirname }, [
            "./compiler/core.js",
            "./compiler/sys.js",
            "./compiler/types.js",
            "./compiler/scanner.js",
            "./compiler/parser.js",
            "./compiler/utilities.js",
            "./compiler/binder.js",
            "./compiler/checker.js",
            "./compiler/emitter.js",
            "./compiler/program.js",
            "./compiler/declarationEmitter.js",
            "./compiler/diagnosticInformationMap.generated.js",
            "./compiler/commandLineParser.js",
            './services/*.js',
            './services/formatting/*.js',
        ]);
        files = files.map(f=> path.resolve(__dirname, f));
        let content = files.map(f=> fs.readFileSync(f).toString());
        try {
            vm.runInContext(content.join(';\n'), sandbox);
        }
        catch (e) {
            console.error(e);
        }
    }
    else if (typescriptServices) {
        vm.runInContext(fs.readFileSync(typescriptServices).toString(), sandbox);
    }
    else {
        vm.runInContext(fs.readFileSync(require.resolve('typescript')).toString(), sandbox);
    }

    // Finally export ts to the local global namespace
    global.ts = sandbox.ts;
}
