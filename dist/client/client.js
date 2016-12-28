"use strict";
const child_process_1 = require("child_process");
const stream_1 = require("stream");
const byline = require("byline");
class TypescriptServiceClient {
    constructor(tsServerPath, version) {
        this.callbacks = {};
        this.listeners = {};
        this.seq = 0;
        this.tsServerArgs = [];
        this.onMessage = (res) => {
            if (isResponse(res)) {
                const callback = this.callbacks[res.request_seq];
                if (callback) {
                    console.log("received response for", res.command, "in", Date.now() - callback.started, "ms", "with data", res.body);
                    delete this.callbacks[res.request_seq];
                    if (res.success) {
                        callback.resolve(res);
                    }
                    else {
                        callback.reject(new Error(res.message));
                    }
                    this.emitPendingRequests();
                }
            }
            else if (isEvent(res)) {
                console.log("received event", res);
                this.emit(res.event, res.body);
            }
        };
        this.tsServerPath = tsServerPath;
        this.version = version;
    }
    executeChange(args) {
        this.execute("change", args);
    }
    executeClose(args) {
        this.execute("close", args);
    }
    executeCompileOnSaveAffectedFileList(args) {
        return this.execute("compileOnSaveAffectedFileList", args);
    }
    executeCompileOnSaveEmitFile(args) {
        return this.execute("compileOnSaveEmitFile", args);
    }
    executeCompletions(args) {
        return this.execute("completions", args);
    }
    executeCompletionDetails(args) {
        return this.execute("completionEntryDetails", args);
    }
    executeDefinition(args) {
        return this.execute("definition", args);
    }
    executeGetErr(args) {
        this.execute("geterr", args);
    }
    executeGetErrForProject(args) {
        this.execute("geterrForProject", args);
    }
    executeOccurances(args) {
        return this.execute("occurrences", args);
    }
    executeOpen(args) {
        this.execute("open", args);
    }
    executeProjectInfo(args) {
        return this.execute("projectInfo", args);
    }
    executeQuickInfo(args) {
        return this.execute("quickinfo", args);
    }
    executeReferences(args) {
        return this.execute("references", args);
    }
    executeReload(args) {
        return this.execute("reload", args);
    }
    executeRename(args) {
        return this.execute("rename", args);
    }
    executeSaveTo(args) {
        return this.execute("saveto", args);
    }
    execute(command, args) {
        return this.serverPromise.then(cp => {
            const expectResponse = !!TypescriptServiceClient.commandWithResponse[command];
            return this.sendRequest(cp, command, args, expectResponse);
        }).catch(err => {
            console.log("command", command, "failed due to", err);
            throw err;
        });
    }
    on(name, listener) {
        if (this.listeners[name] === undefined) {
            this.listeners[name] = [];
        }
        this.listeners[name].push(listener);
        return () => {
            const idx = this.listeners[name].indexOf(listener);
            this.listeners[name].splice(idx, 1);
        };
    }
    emit(name, data) {
        const listeners = this.listeners[name];
        if (listeners) {
            for (const listener of listeners) {
                listener(data);
            }
        }
    }
    emitPendingRequests() {
        const pending = [];
        for (const callback in this.callbacks) {
            pending.push(this.callbacks[callback].name);
        }
        this.emit("pendingRequestsChange", pending);
    }
    sendRequest(cp, command, args, expectResponse) {
        const req = {
            seq: this.seq++,
            command,
            arguments: args
        };
        console.log("sending request", command, "with args", args);
        let resultPromise = undefined;
        if (expectResponse) {
            resultPromise = new Promise((resolve, reject) => {
                this.callbacks[req.seq] = { name: command, resolve, reject, started: Date.now() };
            });
            this.emitPendingRequests();
        }
        cp.stdin.write(JSON.stringify(req) + "\n");
        return resultPromise;
    }
    startServer() {
        if (!this.serverPromise) {
            this.serverPromise = new Promise((resolve, reject) => {
                console.log("starting", this.tsServerPath);
                const cp = child_process_1.spawn(this.tsServerPath, this.tsServerArgs);
                cp.once("error", err => {
                    console.log("tsserver starting failed with", err);
                    reject(err);
                });
                cp.once("exit", code => {
                    console.log("tsserver failed to start with code", code);
                    reject({ code });
                });
                messageStream(cp.stdout).on("data", this.onMessage);
                cp.stderr.on("data", data => console.warn("tsserver stderr:", data.toString()));
                this.sendRequest(cp, "ping", null, true).then(res => resolve(cp), err => resolve(cp));
            });
            return this.serverPromise.catch(error => {
                this.serverPromise = null;
                throw error;
            });
        }
        else {
            throw new Error(`Server already started: ${this.tsServerPath}`);
        }
    }
}
TypescriptServiceClient.commandWithResponse = {
    compileOnSaveAffectedFileList: true,
    compileOnSaveEmitFile: true,
    completionEntryDetails: true,
    completions: true,
    definition: true,
    occurrences: true,
    projectInfo: true,
    quickinfo: true,
    references: true,
    reload: true,
    rename: true,
};
exports.TypescriptServiceClient = TypescriptServiceClient;
function isEvent(res) {
    return res.type === "event";
}
function isResponse(res) {
    return res.type === "response";
}
function messageStream(input) {
    return input.pipe(byline()).pipe(new MessageStream());
}
class MessageStream extends stream_1.Transform {
    constructor() {
        super({ objectMode: true });
        this.lineCount = 1;
    }
    _transform(line, encoding, callback) {
        if (this.lineCount % 2 === 0) {
            this.push(JSON.parse(line));
        }
        this.lineCount += 1;
        callback(null);
    }
}
