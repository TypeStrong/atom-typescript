"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const events_1 = require("events");
const stream_1 = require("stream");
const byline = require("byline");
const atom_1 = require("atom");
exports.CommandWithResponse = new Set([
    "compileOnSaveAffectedFileList",
    "compileOnSaveEmitFile",
    "completionEntryDetails",
    "completions",
    "configure",
    "definition",
    "format",
    "occurrences",
    "projectInfo",
    "quickinfo",
    "references",
    "reload",
    "rename",
]);
class TypescriptServiceClient {
    constructor(tsServerPath, version) {
        /** Map of callbacks that are waiting for responses */
        this.callbacks = {};
        this.events = new events_1.EventEmitter();
        this.seq = 0;
        this.tsServerArgs = [];
        this.onMessage = (res) => {
            if (isResponse(res)) {
                const callback = this.callbacks[res.request_seq];
                if (callback) {
                    // console.log("received response for", res.command, "in", Date.now() - callback.started, "ms", "with data", res.body)
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
                // console.log("received event", res)
                this.events.emit(res.event, res.body);
            }
        };
        this.tsServerPath = tsServerPath;
        this.version = version;
    }
    executeChange(args) {
        return this.execute("change", args);
    }
    executeClose(args) {
        return this.execute("close", args);
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
    executeConfigure(args) {
        return this.execute("configure", args);
    }
    executeDefinition(args) {
        return this.execute("definition", args);
    }
    executeFormat(args) {
        return this.execute("format", args);
    }
    executeGetErr(args) {
        return this.execute("geterr", args);
    }
    executeGetErrForProject(args) {
        return this.execute("geterrForProject", args);
    }
    executeOccurances(args) {
        return this.execute("occurrences", args);
    }
    executeOpen(args) {
        return this.execute("open", args);
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
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.serverPromise) {
                throw new Error("Server is not running");
            }
            return this.sendRequest(yield this.serverPromise, command, args, exports.CommandWithResponse.has(command));
        });
    }
    on(name, listener) {
        this.events.on(name, listener);
        return () => {
            this.events.removeListener(name, listener);
        };
    }
    emitPendingRequests() {
        const pending = [];
        for (const callback in this.callbacks) {
            pending.push(this.callbacks[callback].name);
        }
        this.events.emit("pendingRequestsChange", pending);
    }
    sendRequest(cp, command, args, expectResponse) {
        const req = {
            seq: this.seq++,
            command,
            arguments: args
        };
        // console.log("sending request", command, "with args", args)
        setImmediate(() => {
            cp.stdin.write(JSON.stringify(req) + "\n");
        });
        if (expectResponse) {
            const resultPromise = new Promise((resolve, reject) => {
                this.callbacks[req.seq] = { name: command, resolve, reject, started: Date.now() };
            });
            this.emitPendingRequests();
            return resultPromise;
        }
    }
    startServer() {
        if (!this.serverPromise) {
            this.serverPromise = new Promise((resolve, reject) => {
                // console.log("starting", this.tsServerPath)
                const cp = new atom_1.BufferedNodeProcess({
                    command: this.tsServerPath,
                    args: this.tsServerArgs,
                }).process;
                cp.once("error", err => {
                    console.log("tsserver failed with", err);
                    reject(err);
                });
                cp.once("exit", code => {
                    console.log("tsserver failed to start with code", code);
                    reject({ code });
                });
                messageStream(cp.stdout).on("data", this.onMessage);
                cp.stderr.on("data", data => console.warn("tsserver stderr:", data.toString()));
                // We send an unknown command to verify that the server is working.
                this.sendRequest(cp, "ping", null, true).then(res => resolve(cp), err => resolve(cp));
            });
            return this.serverPromise.catch(error => {
                this.serverPromise = undefined;
                throw error;
            });
        }
        else {
            throw new Error(`Server already started: ${this.tsServerPath}`);
        }
    }
}
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
/** Helper to parse the tsserver output stream to a message stream  */
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
