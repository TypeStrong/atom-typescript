"use strict";
const lodash_1 = require("lodash");
const utils_1 = require("./atom/utils");
/** Class that collects errors from all of the clients and pushes them to the Linter service */
class ErrorPusher {
    constructor() {
        this.errors = new Map();
        this.pushErrors = lodash_1.debounce(() => {
            const errors = [];
            for (const fileErrors of this.errors.values()) {
                for (const [filePath, diagnostics] of fileErrors) {
                    for (const diagnostic of diagnostics) {
                        errors.push({
                            type: "Error",
                            text: diagnostic.text,
                            filePath: filePath,
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
        let prefixed = this.errors.get(prefix);
        if (!prefixed) {
            prefixed = new Map();
            this.errors.set(prefix, prefixed);
        }
        prefixed.set(filePath, errors);
        this.pushErrors();
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
