"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const atom_1 = require("atom");
const callbacks_1 = require("./callbacks");
const stream_1 = require("stream");
const byline = require("byline");
// Set this to true to start tsserver with node --inspect
const INSPECT_TSSERVER = false;
const commandWithResponseMap = {
    compileOnSaveAffectedFileList: true,
    compileOnSaveEmitFile: true,
    completionEntryDetails: true,
    completions: true,
    configure: true,
    definition: true,
    format: true,
    getCodeFixes: true,
    getSupportedCodeFixes: true,
    occurrences: true,
    projectInfo: true,
    quickinfo: true,
    references: true,
    reload: true,
    rename: true,
    navtree: true,
    navto: true,
    getApplicableRefactors: true,
    getEditsForRefactor: true,
    ping: true,
    organizeImports: true,
};
const commandWithResponse = new Set(Object.keys(commandWithResponseMap));
class TypescriptServiceClient {
    constructor(tsServerPath, version) {
        this.tsServerPath = tsServerPath;
        this.version = version;
        this.emitter = new atom_1.Emitter();
        this.seq = 0;
        this.running = false;
        this.lastStderrOutput = "";
        this.exitHandler = (reject) => (err) => {
            console.error("tsserver: ", err);
            this.callbacks.rejectAll(err);
            this.emitter.dispose();
            reject(err);
            this.running = false;
            setImmediate(() => {
                let detail = err.message;
                if (this.lastStderrOutput) {
                    detail = `Last output from tsserver:\n${this.lastStderrOutput}\n\n${detail}`;
                }
                atom.notifications.addError("TypeScript quit unexpectedly", {
                    detail,
                    stack: err.stack,
                    dismissable: true,
                });
            });
        };
        this.emitPendingRequests = (pending) => {
            this.emitter.emit("pendingRequestsChange", pending);
        };
        this.onMessage = (res) => {
            if (res.type === "response")
                this.onResponse(res);
            else
                this.onEvent(res);
        };
        this.callbacks = new callbacks_1.Callbacks(this.emitPendingRequests);
        this.serverPromise = this.startServer();
    }
    async execute(command, args) {
        if (!this.running) {
            throw new Error("Server is not running");
        }
        return this.sendRequest(await this.serverPromise, command, args);
    }
    on(name, listener) {
        return this.emitter.on(name, listener);
    }
    startServer() {
        return new Promise((resolve, reject) => {
            this.running = true;
            if (window.atom_typescript_debug) {
                console.log("starting", this.tsServerPath);
            }
            const cp = startServer(this.tsServerPath);
            const h = this.exitHandler(reject);
            if (!cp) {
                h(new Error("ChildProcess failed to start"));
                return;
            }
            cp.once("error", h);
            cp.once("exit", (code, signal) => {
                if (code !== null)
                    h(new Error(`exited with code: ${code}`));
                else if (signal !== null)
                    h(new Error(`terminated on signal: ${signal}`));
            });
            // Pipe both stdout and stderr appropriately
            messageStream(cp.stdout).on("data", this.onMessage);
            cp.stderr.on("data", data => {
                console.warn("tsserver stderr:", (this.lastStderrOutput = data.toString()));
            });
            this.sendRequest(cp, "ping", undefined).then(() => resolve(cp), () => resolve(cp));
        });
    }
    onResponse(res) {
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
    onEvent(res) {
        if (window.atom_typescript_debug) {
            console.log("received event", res);
        }
        // tslint:disable-next-line:no-unsafe-any
        if (res.body)
            this.emitter.emit(res.event, res.body);
    }
    async sendRequest(cp, command, args) {
        const expectResponse = commandWithResponse.has(command);
        const req = {
            seq: this.seq++,
            command,
            arguments: args,
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
        else {
            return undefined;
        }
    }
}
exports.TypescriptServiceClient = TypescriptServiceClient;
function startServer(tsServerPath) {
    const locale = atom.config.get("atom-typescript.locale");
    const tsServerArgs = locale ? ["--locale", locale] : [];
    if (INSPECT_TSSERVER) {
        return new atom_1.BufferedProcess({
            command: "node",
            args: ["--inspect", tsServerPath].concat(tsServerArgs),
        }).process;
    }
    else {
        return new atom_1.BufferedNodeProcess({
            command: tsServerPath,
            args: tsServerArgs,
        }).process;
    }
}
function messageStream(input) {
    return input.pipe(byline()).pipe(new MessageStream());
}
/** Helper to parse the tsserver output stream to a message stream  */
class MessageStream extends stream_1.Transform {
    constructor() {
        super({ objectMode: true });
    }
    _transform(buf, _encoding, callback) {
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