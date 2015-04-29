var vm = require('vm');
var fs = require('fs');
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
        vm.runInContext(fs.readFileSync(require.resolve('typescript')).toString(), sandbox);
    }
    global.ts = sandbox.ts;
}
exports.makeTsGlobal = makeTsGlobal;
