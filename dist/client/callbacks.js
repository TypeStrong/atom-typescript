"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Callbacks keeps track of all the outstanding requests
class Callbacks {
    constructor(reportBusyWhile) {
        this.reportBusyWhile = reportBusyWhile;
        this.callbacks = new Map();
    }
    async add(seq, command) {
        try {
            const promise = new Promise((resolve, reject) => {
                this.callbacks.set(seq, {
                    resolve,
                    reject,
                    started: Date.now(),
                });
            });
            return await this.reportBusyWhile(command, () => promise);
        }
        finally {
            this.callbacks.delete(seq);
        }
    }
    rejectAll(error) {
        for (const { reject } of this.callbacks.values()) {
            reject(error);
        }
        this.callbacks.clear();
    }
    resolve(seq, res) {
        const req = this.callbacks.get(seq);
        if (req) {
            if (window.atom_typescript_debug) {
                console.log("received response for", res.command, "in", Date.now() - req.started, "ms", "with data", res.body);
            }
            if (res.success)
                req.resolve(res);
            else
                req.reject(new Error(res.message));
        }
        else
            console.warn("unexpected response:", res);
    }
    error(seq, err) {
        const req = this.callbacks.get(seq);
        if (req)
            req.reject(err);
        else
            console.error(err);
    }
}
exports.Callbacks = Callbacks;
//# sourceMappingURL=callbacks.js.map