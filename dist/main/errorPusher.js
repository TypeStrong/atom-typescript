"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const utils_1 = require("./atom/utils");
const atom_1 = require("atom");
const path = require("path");
/** Class that collects errors from all of the clients and pushes them to the Linter service */
class ErrorPusher {
    constructor() {
        this.errors = new Map();
        this.unusedAsInfo = true;
        this.subscriptions = new atom_1.CompositeDisposable();
        this.subscriptions.add(atom.config.observe("atom-typescript.unusedAsInfo", (unusedAsInfo) => {
            this.unusedAsInfo = unusedAsInfo;
        }));
        this.pushErrors = lodash_1.debounce(this.pushErrors.bind(this), 100);
    }
    /** Return any errors that cover the given location */
    getErrorsAt(filePath, loc) {
        const result = [];
        for (const prefixed of this.errors.values()) {
            const errors = prefixed.get(path.normalize(filePath));
            if (errors) {
                result.push(...errors.filter(err => utils_1.isLocationInRange(loc, err)));
            }
        }
        return result;
    }
    /** Set errors. Previous errors with the same prefix and filePath are going to be replaced */
    setErrors(prefix, filePath, errors) {
        let prefixed = this.errors.get(prefix);
        if (!prefixed) {
            prefixed = new Map();
            this.errors.set(prefix, prefixed);
        }
        prefixed.set(path.normalize(filePath), errors);
        this.pushErrors();
    }
    /** Clear all errors */
    clear() {
        if (this.linter) {
            this.linter.clearMessages();
        }
    }
    setLinter(linter) {
        this.linter = linter;
        this.pushErrors();
    }
    dispose() {
        this.subscriptions.dispose();
        this.clear();
    }
    pushErrors() {
        const errors = [];
        const config = atom.config.get("atom-typescript");
        if (!config.suppressAllDiagnostics) {
            for (const fileErrors of this.errors.values()) {
                for (const [filePath, diagnostics] of fileErrors) {
                    for (const diagnostic of diagnostics) {
                        if (config.ignoredDiagnosticCodes.includes(`${diagnostic.code}`))
                            continue;
                        if (config.ignoreUnusedSuggestionDiagnostics && diagnostic.reportsUnnecessary)
                            continue;
                        // Add a bit of extra validation that we have the necessary locations since linter v2
                        // does not allow range-less messages anymore. This happens with configFileDiagnostics.
                        let { start, end } = diagnostic;
                        if (!start || !end) {
                            start = end = { line: 1, offset: 1 };
                        }
                        errors.push({
                            severity: this.getSeverity(diagnostic),
                            excerpt: diagnostic.text,
                            location: {
                                file: filePath,
                                position: utils_1.locationsToRange(start, end),
                            },
                        });
                    }
                }
            }
        }
        if (this.linter) {
            this.linter.setAllMessages(errors);
        }
    }
    getSeverity(diagnostic) {
        if (this.unusedAsInfo && diagnostic.code === 6133)
            return "info";
        switch (diagnostic.category) {
            case "error":
                return "error";
            case "warning":
                return "warning";
            default:
                return "info";
        }
    }
}
exports.ErrorPusher = ErrorPusher;
//# sourceMappingURL=errorPusher.js.map