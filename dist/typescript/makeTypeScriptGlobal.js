var vm = require('vm');
var fs = require('fs');
var path = require('path');
var debug_1 = require("../worker/debug");
global.stack = function () {
    console.error((new Error()).stack);
};
function makeTsGlobal(typescriptServices) {
    var sandbox = {
        ts: {},
        console: console,
        stack: global.stack,
        require: require,
        module: module,
        process: process
    };
    vm.createContext(sandbox);
    if (debug_1.debugLanguageService) {
        var expand = require('glob-expand');
        var files = expand({ filter: 'isFile', cwd: __dirname }, [
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
        files = files.map(function (f) { return path.resolve(__dirname, f); });
        var content = files.map(function (f) { return fs.readFileSync(f).toString(); });
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
    global.ts = sandbox.ts;
}
exports.makeTsGlobal = makeTsGlobal;
