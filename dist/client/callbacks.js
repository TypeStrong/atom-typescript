"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Callbacks keeps track of all the outstanding requests
class Callbacks {
    constructor(onPendingChange) {
        this.onPendingChange = onPendingChange;
        this.callbacks = new Map();
    }
    add(seq, command) {
        return new Promise((resolve, reject) => {
            this.callbacks.set(seq, {
                name: command,
                resolve,
                reject,
                started: Date.now()
            });
            this.onPendingChange(this.pending());
        });
    }
    // pending returns names of requests waiting for a response
    pending() {
        const pending = [];
        for (const { name } of this.callbacks.values()) {
            pending.push(name);
        }
        return pending;
    }
    rejectAll(error) {
        for (const { reject } of this.callbacks.values()) {
            reject(error);
        }
        this.callbacks.clear();
        this.onPendingChange(this.pending());
    }
    // Remove and return a Request object, if one exists
    remove(seq) {
        const req = this.callbacks.get(seq);
        this.callbacks.delete(seq);
        if (req) {
            this.onPendingChange(this.pending());
        }
        return req;
    }
}
exports.Callbacks = Callbacks;
//# sourceMappingURL=callbacks.js.map