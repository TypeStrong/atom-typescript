"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const atom_1 = require("atom");
const callbacks_1 = require("./callbacks");
const events_1 = require("events");
const stream_1 = require("stream");
const byline = require("byline");
// Set this to true to start tsserver with node --inspect
const INSPECT_TSSERVER = false;
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
        this.tsServerPath = tsServerPath;
        this.version = version;
        this.events = new events_1.EventEmitter();
        this.seq = 0;
        /** Extra args passed to the tsserver executable */
        this.tsServerArgs = [];
        this.emitPendingRequests = (pending) => {
            this.events.emit("pendingRequestsChange", pending);
        };
        this.onMessage = (res) => {
            if (isResponse(res)) {
                const req = this.callbacks.remove(res.request_seq);
                if (req) {
                    if (window.atom_typescript_debug) {
                        console.log("received response for", res.command, "in", Date.now() - req.started, "ms", "with data", res.body);
                    }
                    if (res.success) {
                        req.resolve(res);
                    }
                    else {
                        req.reject(new Error(res.message));
                    }
                }
                else {
                    console.warn("unexpected response:", res);
                }
            }
            else if (isEvent(res)) {
                if (window.atom_typescript_debug) {
                    console.log("received event", res);
                }
                this.events.emit(res.event, res.body);
            }
        };
        this.callbacks = new callbacks_1.Callbacks(this.emitPendingRequests);
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
    sendRequest(cp, command, args, expectResponse) {
        const req = {
            seq: this.seq++,
            command,
            arguments: args
        };
        if (window.atom_typescript_debug) {
            console.log("sending request", command, "with args", args);
        }
        setImmediate(() => {
            try {
                cp.stdin.write(JSON.stringify(req) + "\n");
            }
            catch (error) {
                const callback = this.callbacks.remove(req.seq);
                if (callback) {
                    callback.reject(error);
                }
                else {
                    console.error(error);
                }
            }
        });
        if (expectResponse) {
            return this.callbacks.add(req.seq, command);
        }
    }
    startServer() {
        if (!this.serverPromise) {
            let lastStderrOutput;
            let reject;
            const exitHandler = (result) => {
                const err = typeof result === "number" ?
                    new Error("exited with code: " + result) : result;
                console.error("tsserver: ", err);
                this.callbacks.rejectAll(err);
                reject(err);
                this.serverPromise = undefined;
                setImmediate(() => {
                    let detail = err && err.stack || "";
                    if (lastStderrOutput) {
                        detail = "Last output from tsserver:\n" + lastStderrOutput + "\n \n" + detail;
                    }
                    atom.notifications.addError("Typescript quit unexpectedly", {
                        detail,
                        dismissable: true,
                    });
                });
            };
            return this.serverPromise = new Promise((resolve, _reject) => {
                reject = _reject;
                if (window.atom_typescript_debug) {
                    console.log("starting", this.tsServerPath);
                }
                const cp = startServer(this.tsServerPath, this.tsServerArgs);
                cp.once("error", exitHandler);
                cp.once("exit", exitHandler);
                // Pipe both stdout and stderr appropriately
                messageStream(cp.stdout).on("data", this.onMessage);
                cp.stderr.on("data", data => {
                    console.warn("tsserver stderr:", lastStderrOutput = data.toString());
                });
                // We send an unknown command to verify that the server is working.
                this.sendRequest(cp, "ping", null, true).then(res => resolve(cp), err => resolve(cp));
            });
        }
        else {
            throw new Error(`Server already started: ${this.tsServerPath}`);
        }
    }
}
exports.TypescriptServiceClient = TypescriptServiceClient;
function startServer(tsServerPath, tsServerArgs) {
    if (INSPECT_TSSERVER) {
        return new atom_1.BufferedProcess({
            command: "node",
            args: ["--inspect", tsServerPath].concat(tsServerArgs),
        }).process;
    }
    else {
        return new atom_1.BufferedNodeProcess({
            command: tsServerPath,
            args: tsServerArgs
        }).process;
    }
}
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
    }
    _transform(buf, encoding, callback) {
        const line = buf.toString();
        try {
            if (line.startsWith("{")) {
                this.push(JSON.parse(line));
            }
            else if (!line.startsWith("Content-Length:")) {
                console.warn(line);
            }
        }
        catch (error) {
            console.error("client: failed to parse: ", line);
        }
        finally {
            callback(null);
        }
    }
}
//# sourceMappingURL=client.js.map