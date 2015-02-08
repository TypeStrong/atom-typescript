var childprocess = require('child_process');
var exec = childprocess.exec;
var spawn = childprocess.spawn;
var messages = require('./messages');
var gotENOENTonSpawnNode = false;
var child;
var currentListeners = {};
function startWorker() {
    try {
        var env = Object.create(process.env);
        env.ATOM_SHELL_INTERNAL_RUN_AS_NODE = '1';
        var node = process.execPath;
        if (process.platform === 'win32') {
            node = "node";
        }
        child = spawn(node, [
            __dirname + '/child.js',
        ], { env: env, stdio: ['ipc'] });
        child.on('error', function (err) {
            if (err.code === "ENOENT" && err.path === node) {
                gotENOENTonSpawnNode = true;
            }
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
            else if (gotENOENTonSpawnNode) {
                showError();
            }
            else {
                console.log('ts worker restarting');
                startWorker();
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
            return Promise.reject(new Error("No worker active to recieve message: " + message));
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
    var message = "Failed to start a child TypeScript worker. Atom-TypeScript is disabled.";
    if (process.platform === "win32") {
        message = message + " Make sure you have 'node' installed and available in your system path.";
    }
    atom.notifications.addError(message, { dismissable: true });
    if (error) {
        console.error('Failed to activate ts-worker:', error);
    }
}
var projectService = require('../main/lang/projectService');
exports.echo = childQuery(projectService.echo);
exports.quickInfo = childQuery(projectService.quickInfo);
exports.build = childQuery(projectService.build);
exports.errorsForFileFiltered = childQuery(projectService.errorsForFileFiltered);
exports.getCompletionsAtPosition = childQuery(projectService.getCompletionsAtPosition);
exports.emitFile = childQuery(projectService.emitFile);
exports.formatDocument = childQuery(projectService.formatDocument);
exports.formatDocumentRange = childQuery(projectService.formatDocumentRange);
exports.getDefinitionsAtPosition = childQuery(projectService.getDefinitionsAtPosition);
exports.updateText = childQuery(projectService.updateText);
exports.errorsForFile = childQuery(projectService.errorsForFile);
