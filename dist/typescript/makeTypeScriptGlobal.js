var vm = require('vm');
var fs = require('fs');
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
    if (typescriptServices) {
        vm.runInContext(fs.readFileSync(typescriptServices).toString(), sandbox);
    }
    else {
        sandbox.ts = require('ntypescript');
    }
    global.ts = sandbox.ts;
}
exports.makeTsGlobal = makeTsGlobal;
