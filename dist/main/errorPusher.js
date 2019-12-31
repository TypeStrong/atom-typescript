"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const path = require("path");
const utils_1 = require("./atom/utils");
/** Class that collects errors from all of the clients and pushes them to the Linter service */
class ErrorPusher {
    constructor() {
        this.errors = new Map();
        this.pushErrors = lodash_1.debounce(this.pushErrors.bind(this), 100);
    }
    *getErrorsInRange(filePath, range) {
        for (const prefixed of this.errors.values()) {
            const errors = prefixed.get(path.normalize(filePath));
            if (errors)
                yield* errors.diagnostics.filter(err => utils_1.spanToRange(err).intersectsWith(range));
        }
    }
    /** Return any errors that cover the given location */
    *getErrorsAt(filePath, loc) {
        for (const prefixed of this.errors.values()) {
            const errors = prefixed.get(path.normalize(filePath));
            if (errors)
                yield* errors.diagnostics.filter(err => utils_1.spanToRange(err).containsPoint(loc));
        }
    }
    /** Set errors. Previous errors with the same prefix and filePath are going to be replaced */
    setErrors(prefix, filePath, errors, triggerFile) {
        let prefixed = this.errors.get(prefix);
        if (!prefixed) {
            prefixed = new Map();
            this.errors.set(prefix, prefixed);
        }
        prefixed.set(path.normalize(filePath), {
            triggerFile,
            diagnostics: errors
        });
        this.pushErrors();
    }
    clearProjectErrors(projectPath) {
        if (projectPath === undefined)
            return;
        for (const fileErrors of this.errors.values()) {
            for (const [filePath, errors] of fileErrors) {
                if (filePath.includes(projectPath) && fileErrors.has(filePath)) {
                    fileErrors.delete(filePath);
                }
            }
        }
        this.pushErrors();
    }
    clearFileErrors(triggerFile) {
        if (triggerFile === undefined)
            return;
        for (const fileErrors of this.errors.values()) {
            for (const [filePath, errors] of fileErrors) {
                if (triggerFile === errors.triggerFile && fileErrors.has(filePath)) {
                    fileErrors.delete(filePath);
                }
            }
        }
        this.pushErrors();
    }
    getErrors(triggerFile) {
        const errFiles = [];
        for (const fileErrors of this.errors.values()) {
            for (const [filePath, errors] of fileErrors) {
                if (triggerFile === errors.triggerFile && errFiles.indexOf(filePath) === -1) {
                    errFiles.push(filePath);
                }
            }
        }
        return errFiles;
    }
    clear() {
        if (!this.linter)
            return;
        this.linter.clearMessages();
    }
    setLinter(linter) {
        this.linter = linter;
        this.pushErrors();
    }
    dispose() {
        this.clear();
        if (this.linter)
            this.linter.dispose();
        this.linter = undefined;
    }
    pushErrors() {
        if (this.linter)
            this.linter.setAllMessages(Array.from(this.getLinterErrors()));
    }
    *getLinterErrors() {
        const config = atom.config.get("atom-typescript");
        if (!config.suppressAllDiagnostics) {
            for (const fileErrors of this.errors.values()) {
                for (const [filePath, errors] of fileErrors) {
                    for (const diagnostic of errors.diagnostics) {
                        if (config.ignoredDiagnosticCodes.includes(`${diagnostic.code}`))
                            continue;
                        if (config.ignoreUnusedSuggestionDiagnostics) {
                            if (diagnostic.reportsUnnecessary || diagnostic.category === "suggestion")
                                continue;
                        }
                        // if (filePath && atom.project.relativizePath(filePath)[1].startsWith(`node_modules${path.sep}`)) continue
                        // Add a bit of extra validation that we have the necessary locations since linter v2
                        // does not allow range-less messages anymore. This happens with configFileDiagnostics.
                        let { start, end } = diagnostic;
                        if (!start || !end) {
                            start = end = { line: 1, offset: 1 };
                        }
                        yield {
                            severity: this.getSeverity(config.unusedAsInfo, diagnostic),
                            excerpt: diagnostic.text,
                            location: {
                                file: filePath,
                                position: utils_1.locationsToRange(start, end),
                            },
                        };
                    }
                }
            }
        }
    }
    getSeverity(unusedAsInfo, diagnostic) {
        if (unusedAsInfo && diagnostic.code === 6133)
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