///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

///ts:import=messages
import messages = require('./messages'); ///ts:import:generated

import childprocess = require('child_process');
import os = require('os');
var exec = childprocess.exec;
var spawn = childprocess.spawn;

var child: childprocess.ChildProcess;
var currentListeners: { [messages: string]: { [id: string]: Function } } = {};
export function startWorker() {
    try {
        var env = Object.create(process.env);
        env.ATOM_SHELL_INTERNAL_RUN_AS_NODE = '1';

        var node = os.platform() === 'win32' ? "node" : process.execPath;

        child = spawn(node, [
            // '--debug', // Uncomment if you want to debug the child process
            __dirname + '/workerProcess.js',
        ], { env });

        child.on('error', (err) => {
            console.log('CHILD ERR:', err.toString());
            child = null;
        });

        console.log('ts worker started');
        function processResponse(m: string) {
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
        }
        var bufferedResponseHandler = new messages.BufferedBySeperatorHandler(processResponse);

        child.stdout.on('data',(m) => {
            bufferedResponseHandler.handle(m)
        });


        child.stderr.on('data',(err) => {
            console.log("CHILD ERR:", err.toString());
        });
        child.on('close',(code) => {
            // Todo: handle process dropping
            console.log('ts worker exited with code:', code);

            // If orphaned then Definitely restart
            if (code === messages.orphanExitCode) {
                console.log('ts worker restarting');
                startWorker();
            }
            // probably restart even otherwise. Potential infinite loop.
            else if (code !== /* ENOENT? */ -2) {
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

function query<Query, Response>(message: string, data: Query, callback: (response: Response) => any = () => { }) {

    // If we don't have a child exit
    if (!child || !child.stdin.writable) {
        console.log('PARENT ERR: no child when you tried to send :', message);
        return;
    }

    // Create an id
    var id = createId();

    // Store the callback against this Id:
    if (!currentListeners[message]) currentListeners[message] = {};
    currentListeners[message][id] = callback;

    // Send data to worker
    child.stdin.write(JSON.stringify({ message: message, id: id, data: data }) + messages.BufferedBySeperatorHandler.seperator);
}

export interface Exec<Query, Response> {
    (data: Query, callback?: (res: Response) => any);
}

function showError(error?:Error) {
    atom.notifications.addError("Failed to start a child TypeScript worker. Atom-TypeScript is disabled.")
    if (error) {
        console.error('Failed to activate ts-worker:', error);
    }
}

/////////////////////////////////////// END INFRASTRUCTURE ////////////////////////////////////////////////////


export var echo: Exec<messages.EchoQuery, messages.EchoResponse>
    = (data, callback) => query(messages.echo, data, callback);

export var updateText: Exec<messages.UpdateTextQuery,messages.EchoResponse>
    = (data,callback?) => query(messages.updateText, data, callback);

export var getErrorsForFile: Exec<messages.GetErrorsForFileQuery, messages.GetErrorsForFileResponse>
        = (data, callback) => query(messages.getErrorsForFile, data, callback);
