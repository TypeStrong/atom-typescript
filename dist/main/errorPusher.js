"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const utils_1 = require("./atom/utils");
/** Class that collects errors from all of the clients and pushes them to the Linter service */
class ErrorPusher {
    constructor() {
        this.errors = new Map();
        this.unusedAsInfo = true;
        this.pushErrors = lodash_1.debounce(() => {
            const errors = [];
            for (const fileErrors of this.errors.values()) {
                for (const [filePath, diagnostics] of fileErrors) {
                    const _filePath = utils_1.systemPath(filePath);
                    for (const diagnostic of diagnostics) {
                        errors.push({
                            type: this.unusedAsInfo && diagnostic.code === 6133 ? "Info" : "Error",
                            text: diagnostic.text,
                            filePath: _filePath,
                            range: diagnostic.start ? utils_1.locationsToRange(diagnostic.start, diagnostic.end) : undefined
                        });
                    }
                }
            }
            if (this.linter) {
                this.linter.setMessages(errors);
            }
        }, 100);
    }
    /** Set errors. Previous errors with the same prefix and filePath are going to be replaced */
    setErrors(prefix, filePath, errors) {
        if (prefix == undefined || filePath == undefined) {
            console.warn("setErrors: prefix or filePath is undefined", prefix, filePath);
            return;
        }
        let prefixed = this.errors.get(prefix);
        if (!prefixed) {
            prefixed = new Map();
            this.errors.set(prefix, prefixed);
        }
        prefixed.set(filePath, errors);
        this.pushErrors();
    }
    setUnusedAsInfo(unusedAsInfo) {
        this.unusedAsInfo = unusedAsInfo;
    }
    /** Clear all errors */
    clear() {
        if (this.linter) {
            this.linter.deleteMessages();
        }
    }
    setLinter(linter) {
        this.linter = linter;
        this.pushErrors();
    }
}
exports.ErrorPusher = ErrorPusher;
//# sourceMappingURL=errorPusher.js.map