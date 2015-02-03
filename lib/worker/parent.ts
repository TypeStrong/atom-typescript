///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

///ts:import=messages
import messages = require('./messages'); ///ts:import:generated

import childprocess = require('child_process');
var exec = childprocess.exec;

var child: childprocess.ChildProcess;
var currentListeners: { [messages: string]: { [id: string]: Function } } = {};
export function startWorker() {
    try {
        child = exec('node ' + __dirname + '/workerProcess.js', function() { });
        child.stdout.on('data',(m) => {
            try {
                var parsed: messages.Message<any> = JSON.parse(m.toString());
            }
            catch (ex) {
                console.log('PARENT ERR: Non JSON data from child:', m);
            }
            if (!currentListeners[parsed.message] || !currentListeners[parsed.message][parsed.id]) {
                console.log('PARENT ERR: No one was listening:', parsed.message, parsed.data);
                return;
            }
            else {
                currentListeners[parsed.message][parsed.id](parsed.data);
                delete currentListeners[parsed.message][parsed.id];
            }
        });
        child.stderr.on('data',(err) => {
            console.log("CHILD ERR:", err);
        });
        child.on('close',(code) => {
            // Todo: handle process dropping
            console.log('ts worker exited with code:', code);
        });
    }
    catch (ex) {
        atom.notifications.addError("Failed to start a child TypeScript worker. Atom-TypeScript is disabled.")
        console.error('Failed to activate ts-worker:', ex);
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

function query<Query, Response>(message: string, data: Query, callback: (response: Response) => any) {
    // Create an id
    var id = createId();

    // Store the callback against this Id:
    if (!currentListeners[message]) currentListeners[message] = {};
    currentListeners[message][id] = callback;

    // Send data to worker
    child.stdin.write(JSON.stringify({ message: message, id: id, data: data }));
}

export interface Exec<Query, Response> {
    (data: Query, callback: (res: Response) => any);
}

/////////////////////////////////////// END INFRASTRUCTURE ////////////////////////////////////////////////////


export var echo: Exec<messages.EchoQuery, messages.EchoResponse>
    = (data, callback) => query(messages.echo, data, callback);
