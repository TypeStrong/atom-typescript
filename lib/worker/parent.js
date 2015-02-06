var messages = require('./messages');
var programManager = require('../main/lang/programManager');
var childprocess = require('child_process');
var os = require('os');
var exec = childprocess.exec;
var spawn = childprocess.spawn;
var child;
var currentListeners = {};
function startWorker() {
    try {
        var env = Object.create(process.env);
        env.ATOM_SHELL_INTERNAL_RUN_AS_NODE = '1';
        var node = os.platform() === 'win32' ? "node" : process.execPath;
        child = spawn(node, [
            __dirname + '/child.js',
        ], { env: env, stdio: ['ipc'] });
        child.on('error', function (err) {
            console.log('CHILD ERR:', err.toString());
            child = null;
        });
        console.log('ts worker started');
        function processResponse(m) {
            var parsed = m;
            if (!parsed.message || !parsed.id) {
                console.log('PARENT ERR: Invalid JSON data from child:', m);
            }
            if (!currentListeners[parsed.message] || !currentListeners[parsed.message][parsed.id]) {
                console.log('PARENT ERR: No one was listening:', parsed.message, parsed.data);
                return;
            }
            else {
                currentListeners[parsed.message][parsed.id].resolve(parsed.data);
                delete currentListeners[parsed.message][parsed.id];
            }
        }
        child.on('message', function (resp) { return processResponse(resp); });
        child.stderr.on('data', function (err) {
            console.log("CHILD ERR:", err.toString());
        });
        child.on('close', function (code) {
            console.log('ts worker exited with code:', code);
            if (code === messages.orphanExitCode) {
                console.log('ts worker restarting');
                startWorker();
            }
            else if (code !== -2) {
                console.log('ts worker restarting');
                startWorker();
            }
            else {
                showError();
            }
        });
    }
    catch (ex) {
        showError(ex);
    }
}
exports.startWorker = startWorker;
function stopWorker() {
    if (!child)
        return;
    try {
        child.kill('SIGTERM');
    }
    catch (ex) {
        console.error('failed to kill worker child');
    }
    child = null;
}
exports.stopWorker = stopWorker;
function createId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
function childQuery(func) {
    return function (data) {
        var message = func.name;
        if (!child) {
            console.log('PARENT ERR: no child when you tried to send :', message);
            return;
        }
        if (!currentListeners[message])
            currentListeners[message] = {};
        var id = createId();
        var defer = Promise.defer();
        currentListeners[message][id] = defer;
        child.send({ message: message, id: id, data: data });
        return defer.promise;
    };
}
function showError(error) {
    atom.notifications.addError("Failed to start a child TypeScript worker. Atom-TypeScript is disabled.");
    if (error) {
        console.error('Failed to activate ts-worker:', error);
    }
}
exports.echo = childQuery(programManager.echo);
exports.quickInfo = childQuery(programManager.quickInfo);
exports.build = childQuery(programManager.build);
exports.errorsForFileFiltered = childQuery(programManager.errorsForFileFiltered);
exports.getCompletionsAtPosition = childQuery(programManager.getCompletionsAtPosition);
exports.emitFile = childQuery(programManager.emitFile);
exports.formatDocument = childQuery(programManager.formatDocument);
exports.formatDocumentRange = childQuery(programManager.formatDocumentRange);
exports.getDefinitionsAtPosition = childQuery(programManager.getDefinitionsAtPosition);
exports.updateText = childQuery(programManager.updateText);
exports.errorsForFile = childQuery(programManager.errorsForFile);
