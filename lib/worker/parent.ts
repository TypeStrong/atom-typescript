///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

import childprocess = require('child_process');
var exec = childprocess.exec;
var spawn = childprocess.spawn;

///ts:import=messages
import messages = require('./messages'); ///ts:import:generated
import tsconfig = require('../main/tsconfig/tsconfig');


var gotENOENTonSpawnNode = false;
var child: childprocess.ChildProcess;
var currentListeners: { [messages: string]: { [id: string]: PromiseDeferred<any> } } = {};
export function startWorker() {
    try {
        var env = Object.create(process.env);
        env.ATOM_SHELL_INTERNAL_RUN_AS_NODE = '1';

        var node = process.execPath; // We will run atom as node

        // Sad panda : https://github.com/TypeStrong/atom-typescript/issues/50
        if (process.platform === 'win32') {
            node = "node";
        }

        child = spawn(node, [
            // '--debug', // Uncomment if you want to debug the child process
            __dirname + '/child.js',
        ], { env: env, stdio: ['ipc'] });

        child.on('error',(err) => {
            if (err.code === "ENOENT" && err.path === node) {
                gotENOENTonSpawnNode = true;
            }
            console.log('CHILD ERR:', err.toString());
            child = null;
        });

        console.log('ts worker started');
        function processResponse(m: any) {
            var parsed: messages.Message<any> = m;

            if (!parsed.message || !parsed.id) {
                console.log('PARENT ERR: Invalid JSON data from child:', m);
            }
            if (!currentListeners[parsed.message] || !currentListeners[parsed.message][parsed.id]) {
                console.log('PARENT ERR: No one was listening:', parsed.message, parsed.data);
                return;
            }
            else { // Alright nothing *weird* happened
                if (parsed.error) {
                    currentListeners[parsed.message][parsed.id].reject(parsed.error);
                }
                else {
                    currentListeners[parsed.message][parsed.id].resolve(parsed.data);
                }
                delete currentListeners[parsed.message][parsed.id];
            }
        }

        child.on('message',(resp) => processResponse(resp));


        child.stderr.on('data',(err) => {
            console.log("CHILD ERR:", err.toString());
        });
        child.on('close',(code) => {
            // Handle process dropping
            console.log('ts worker exited with code:', code);

            // If orphaned then Definitely restart
            if (code === messages.orphanExitCode) {
                console.log('ts worker restarting');
                startWorker();
            }
            // If we got ENOENT. Restarting will not help.
            else if (gotENOENTonSpawnNode) {
                showError();
            }
            // We haven't found a reson to not start worker yet
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

export function stopWorker() {
    if (!child) return;
    try {
        child.kill('SIGTERM');
    }
    catch (ex) {
        console.error('failed to kill worker child');
    }
    child = null;
}

// Creates a Guid (UUID v4)
function createId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function childQuery<Query, Response>(func: (query: Query) => Response): (data: Query) => Promise<Response> {
    return (data) => {
        var message = func.name;

        // If we don't have a child exit
        if (!child) {
            console.log('PARENT ERR: no child when you tried to send :', message);
            return <any>Promise.reject(new Error("No worker active to recieve message: " + message));
        }

        // Initialize if this is the first call of this type
        if (!currentListeners[message]) currentListeners[message] = {};

        // Create an id unique to this call and store the defered against it
        var id = createId();
        var defer = Promise.defer<Response>();
        currentListeners[message][id] = defer;

        // Send data to worker
        child.send({ message: message, id: id, data: data });
        return defer.promise;
    };
}

function showError(error?: Error) {
    var message = "Failed to start a child TypeScript worker. Atom-TypeScript is disabled.";
    // Sad panda : https://github.com/TypeStrong/atom-typescript/issues/50
    if (process.platform === "win32") {
        message = message + " Make sure you have 'node' installed and available in your system path.";
    }
    atom.notifications.addError(message, { dismissable: true });

    if (error) {
        console.error('Failed to activate ts-worker:', error);
    }
}

/////////////////////////////////////// END INFRASTRUCTURE ////////////////////////////////////////////////////

///ts:import=projectService
import projectService = require('../main/lang/projectService'); ///ts:import:generated

export var echo = childQuery(projectService.echo);
export var quickInfo = childQuery(projectService.quickInfo);
export var build = childQuery(projectService.build);
export var errorsForFileFiltered = childQuery(projectService.errorsForFileFiltered);
export var getCompletionsAtPosition = childQuery(projectService.getCompletionsAtPosition);
export var emitFile = childQuery(projectService.emitFile);
export var regenerateProjectGlob = childQuery(projectService.regenerateProjectGlob);
export var formatDocument = childQuery(projectService.formatDocument);
export var formatDocumentRange = childQuery(projectService.formatDocumentRange);
export var getDefinitionsAtPosition = childQuery(projectService.getDefinitionsAtPosition);
export var updateText = childQuery(projectService.updateText);
export var errorsForFile = childQuery(projectService.errorsForFile);
export var getSignatureHelps = childQuery(projectService.getSignatureHelps);
