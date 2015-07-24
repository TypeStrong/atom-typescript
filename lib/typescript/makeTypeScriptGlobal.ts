////////////////////////////////// MAGIC
import vm = require('vm');
import fs = require('fs');
import os = require('os');
import path = require('path');

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

    if (typescriptServices) {
        vm.runInContext(fs.readFileSync(typescriptServices).toString(), sandbox);
    }
    else {
        sandbox.ts = require('ntypescript');
    }

    // Finally export ts to the local global namespace
    global.ts = sandbox.ts;
}
