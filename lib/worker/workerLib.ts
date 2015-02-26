// This code is designed to be used by both the parent and the child
///ts:ref=globals
/// <reference path="../globals.ts"/> ///ts:ref:generated

import childprocess = require('child_process');
var exec = childprocess.exec;
var spawn = childprocess.spawn;
import path = require('path');

// Parent makes queries<T>
// Child responds<T>
export interface Message<T> {
    message: string;
    id: string;
    data?: T;
    error?: {
        method: string;
        message: string;
        stack: string;
        details: any;
    };
    /** true if child is the one querying the parent */
    childToParent?: boolean;
}

/** Creates a Guid (UUID v4) */
function createId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export var orphanExitCode = 100;

/** call this from the child to keep it alive while its connected and die otherwise */
export function keepAlive() {
    setInterval(() => {
        // We have been orphaned
        if (!(<any>process).connected) {
            process.exit(orphanExitCode);
        }
    }, 1000);
}

/** The parent */
export class Parent {
    private child: childprocess.ChildProcess;
    private currentListeners: { [messages: string]: { [id: string]: PromiseDeferred<any> } } = {};
    private node = process.execPath;   
    
    /** If we get this error then the situation if fairly hopeless */
    private gotENOENTonSpawnNode = false; 
    
    /** 
     * Takes a sync named function 
     * and returns a function that will execute the function by name on the child
     * if the child has a responder registered
     */
    childQuery<Query, Response>(func: (query: Query) => Response): (data: Query) => Promise<Response> {
        return (data) => {
            var message = func.name;
    
            // If we don't have a child exit
            if (!this.child) {
                console.log('PARENT ERR: no child when you tried to send :', message);
                return <any>Promise.reject(new Error("No worker active to recieve message: " + message));
            }
    
            // Initialize if this is the first call of this type
            if (!this.currentListeners[message]) this.currentListeners[message] = {};
    
            // Create an id unique to this call and store the defered against it
            var id = createId();
            var defer = Promise.defer<Response>();
            this.currentListeners[message][id] = defer;
    
            // Send data to worker
            this.child.send({ message: message, id: id, data: data });
            return defer.promise;
        };
    }
    
    /** start worker */
    startWorker(childJsPath: string, terminalError: (e: Error) => any) {
        try {
            this.child = spawn(this.node, [
            // '--debug', // Uncomment if you want to debug the child process
                childJsPath
            ], { cwd: path.dirname(childJsPath), env: { ATOM_SHELL_INTERNAL_RUN_AS_NODE: '1' }, stdio: ['ipc'] });

            this.child.on('error',(err) => {
                if (err.code === "ENOENT" && err.path === this.node) {
                    this.gotENOENTonSpawnNode = true;
                }
                console.log('CHILD ERR ONERROR:', err.message, err.stack, err);
                this.child = null;
            });

            this.child.on('message',(resp) => this.processResponse(resp));

            this.child.stderr.on('data',(err) => {
                console.log("CHILD ERR STDERR:", err.toString());
            });
            this.child.on('close',(code) => {
                // Handle process dropping
                console.log('ts worker exited with code:', code);

                // If orphaned then Definitely restart
                if (code === orphanExitCode) {
                    console.log('ts worker restarting');
                    this.startWorker(childJsPath, terminalError);
                }
                // If we got ENOENT. Restarting will not help.
                else if (this.gotENOENTonSpawnNode) {
                    terminalError(new Error('gotENOENTonSpawnNode'));
                }
                // We haven't found a reson to not start worker yet
                else {
                    console.log('ts worker restarting');
                    this.startWorker(childJsPath, terminalError);
                }
            });
        } catch (err) {
            terminalError(err);
        }
    }
    
    /** stop worker */
    stopWorker() {
        if (!this.child) return;
        try {
            this.child.kill('SIGTERM');
        }
        catch (ex) {
            console.error('failed to kill worker child');
        }
        this.child = null;
    }
    
    /** process a message from the child */
    private processResponse(m: any) {
        var parsed: Message<any> = m;

        if (!parsed.message || !parsed.id) {
            console.log('PARENT ERR: Invalid JSON data from child:', m);
        }
        else if (!this.currentListeners[parsed.message] || !this.currentListeners[parsed.message][parsed.id]) {
            console.log('PARENT ERR: No one was listening:', parsed.message, parsed.data);
        }
        else { // Alright nothing *weird* happened
            if (parsed.error) {
                this.currentListeners[parsed.message][parsed.id].reject(parsed.error);
            }
            else {
                this.currentListeners[parsed.message][parsed.id].resolve(parsed.data);
            }
            delete this.currentListeners[parsed.message][parsed.id];
        }
    }
}

