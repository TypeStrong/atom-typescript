"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:max-classes-per-file
const atom_1 = require("atom");
const byline = require("byline");
const stream_1 = require("stream");
const callbacks_1 = require("./callbacks");
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
    organizeImports: true,
    signatureHelp: true,
};
const commandWithResponse = new Set(Object.keys(commandWithResponseMap));
function isCommandWithResponse(command) {
    return commandWithResponse.has(command);
}
class TypescriptServiceClient {
    constructor(tsServerPath, version, reportBusyWhile) {
        this.tsServerPath = tsServerPath;
        this.version = version;
        this.reportBusyWhile = reportBusyWhile;
        this.emitter = new atom_1.Emitter();
        this.seq = 0;
        this.lastStderrOutput = "";
        // tslint:disable-next-line:member-ordering
        this.on = this.emitter.on.bind(this.emitter);
        this.exitHandler = (err, report = true) => {
            this.callbacks.rejectAll(err);
            if (report)
                console.error("tsserver: ", err);
            this.server = undefined;
            if (report) {
                let detail = err.message;
                if (this.lastStderrOutput) {
                    detail = `Last output from tsserver:\n${this.lastStderrOutput}\n\n${detail}`;
                }
                atom.notifications.addError("TypeScript quit unexpectedly", {
                    detail,
                    stack: err.stack,
                    dismissable: true,
                });
            }
            if (this.lastStartAttempt === undefined || Date.now() - this.lastStartAttempt > 5000) {
                this.server = this.startServer();
                this.emitter.emit("restarted", undefined);
            }
            else {
                atom.notifications.addWarning("Not restarting tsserver", {
                    detail: "Restarting too fast",
                });
            }
        };
        this.onMessage = (res) => {
            if (res.type === "response")
                this.onResponse(res);
            else
                this.onEvent(res);
        };
        this.callbacks = new callbacks_1.Callbacks(this.reportBusyWhile);
        this.server = this.startServer();
    }
    async execute(command, ...args) {
        if (!this.server) {
            throw new Error("Server is not running");
        }
        const req = {
            seq: this.seq++,
            command,
            arguments: args[0],
        };
        if (window.atom_typescript_debug) {
            console.log("sending request", command, "with args", args);
        }
        const result = isCommandWithResponse(command)
            ? this.callbacks.add(req.seq, command)
            : undefined;
        try {
            this.server.stdin.write(JSON.stringify(req) + "\n");
        }
        catch (error) {
            this.callbacks.error(req.seq, error);
        }
        return result;
    }
    async restartServer() {
        if (this.server) {
            this.lastStartAttempt = undefined; // reset auto-restart loop guard
            const server = this.server;
            const graceTimer = setTimeout(() => server.kill(), 10000);
            await this.execute("exit");
            clearTimeout(graceTimer);
        }
        else {
            this.server = this.startServer();
            this.emitter.emit("restarted", undefined);
        }
    }
    startServer() {
        if (window.atom_typescript_debug) {
            console.log("starting", this.tsServerPath);
        }
        this.lastStartAttempt = Date.now();
        const cp = startServer(this.tsServerPath);
        if (!cp)
            throw new Error("ChildProcess failed to start");
        const h = this.exitHandler;
        cp.once("error", h);
        cp.once("exit", (code, signal) => {
            if (code === 0)
                h(new Error("Server stopped normally"), false);
            else if (code !== null)
                h(new Error(`exited with code: ${code}`));
            else if (signal !== null)
                h(new Error(`terminated on signal: ${signal}`));
        });
        // Pipe both stdout and stderr appropriately
        messageStream(cp.stdout).on("data", this.onMessage);
        cp.stderr.on("data", data => {
            console.warn("tsserver stderr:", (this.lastStderrOutput = data.toString()));
        });
        return cp;
    }
    onResponse(res) {
        this.callbacks.resolve(res.request_seq, res);
    }
    onEvent(res) {
        if (window.atom_typescript_debug) {
            console.log("received event", res);
        }
        // tslint:disable-next-line:no-unsafe-any
        if (res.body)
            this.emitter.emit(res.event, res.body);
    }
}
exports.TypescriptServiceClient = TypescriptServiceClient;
function startServer(tsServerPath) {
    const locale = atom.config.get("atom-typescript").locale;
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