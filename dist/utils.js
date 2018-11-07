"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function handlePromise(promise) {
    // tslint:disable-next-line:strict-type-predicates no-unbound-method
    if (typeof promise.catch !== "function") {
        atom.notifications.addFatalError("Atom-Typescript: non-promise passed to handlePromise. Please report this.", {
            stack: new Error().stack,
            dismissable: true,
        });
        return;
    }
    promise.catch((err) => {
        atom.notifications.addFatalError(`Atom-Typescript error: ${err.message}`, {
            detail: err.toString(),
            stack: err.stack,
            dismissable: true,
        });
    });
}
exports.handlePromise = handlePromise;
//# sourceMappingURL=utils.js.map