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
    "../compiler/diagnosticInformationMap.generated.ts",
    "../compiler/commandLineParser.ts",
    "breakpoints.ts",
    "navigationBar.ts",
    "outliningElementsCollector.ts",
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
var files = servicesFiles.map(function (f) { return ("./services/" + f.replace('.ts', '.js')); });
var vm = require('vm');
var fs = require('fs');
var path = require('path');
global.stack = function () {
    console.error((new Error()).stack);
};
function makeTsGlobal(typescriptServices) {
    var sandbox = {
        ts: {},
        console: console,
        stack: global.stack
    };
    vm.createContext(sandbox);
    if (typescriptServices) {
        vm.runInContext(fs.readFileSync(typescriptServices).toString(), sandbox);
    }
    else {
        files.forEach(function (f) {
            vm.runInContext(fs.readFileSync(path.resolve(__dirname, f)).toString(), sandbox);
        });
    }
    global.ts = sandbox.ts;
}
exports.makeTsGlobal = makeTsGlobal;
