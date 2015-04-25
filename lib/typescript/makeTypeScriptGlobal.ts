// Put the whole of `ts` namespace into the global `ts` variable
// IMPORTANT!!!!!!!!!!!! `diagnosticInformationMap` needs to be before `commandLineParser`
// Also a few files were missing that I added manually below
var servicesFiles = [
    "../compiler/core.ts",
    "../compiler/sys.ts",
    "../compiler/types.ts",
    "../compiler/scanner.ts",
    "../compiler/parser.ts",
    "../compiler/utilities.ts",
    "../compiler/binder.ts",
    "../compiler/checker.ts",
    "../compiler/emitter.ts",
    "../compiler/program.ts",
    "../compiler/declarationEmitter.ts",
    "../compiler/diagnosticInformationMap.generated.ts",
    "../compiler/commandLineParser.ts",
    "breakpoints.ts",
    "navigateTo.ts",
    "navigationBar.ts",
    "outliningElementsCollector.ts",
    "patternMatcher.ts",
    "services.ts",
    "shims.ts",
    "signatureHelp.ts",
    "utilities.ts",
    "formatting/formatting.ts",
    "formatting/formattingContext.ts",
    "formatting/formattingRequestKind.ts",
    "formatting/formattingScanner.ts",
    "formatting/references.ts",
    "formatting/rule.ts",
    "formatting/ruleAction.ts",
    "formatting/ruleDescriptor.ts",
    "formatting/ruleFlag.ts",
    "formatting/ruleOperation.ts",
    "formatting/ruleOperationContext.ts",
    "formatting/rules.ts",
    "formatting/rulesMap.ts",
    "formatting/rulesProvider.ts",
    "formatting/smartIndenter.ts",
    "formatting/tokenRange.ts"
];


var files = servicesFiles.map(f=> `./services/${f.replace('.ts', '.js') }`);

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
        stack: global.stack
    };
    vm.createContext(sandbox);

    if (typescriptServices) {
        vm.runInContext(fs.readFileSync(typescriptServices).toString(), sandbox);
    }
    else {
        let fileContents = [];
        files.forEach(f=> fileContents.push(fs.readFileSync(path.resolve(__dirname, f)).toString()));
        let fileContent = fileContents.join(os.EOL);
        files.forEach(f=> {
            vm.runInContext(fileContent, sandbox);
        });
    }

    // Finally export ts to the local global namespace
    global.ts = sandbox.ts;
}
