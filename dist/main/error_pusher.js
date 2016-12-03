"use strict";
const lodash_1 = require("lodash");
const tsUtil_1 = require("./utils/tsUtil");
class ErrorPusher {
    constructor(linter) {
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
                            range: diagnostic.start ? tsUtil_1.locationsToRange(diagnostic.start, diagnostic.end) : undefined
                        });
                    }
                }
            }
            this.linter.setMessages(errors);
        }, 100);
        this.linter = linter;
    }
    addErrors(prefix, filePath, errors) {
        let prefixed = this.errors.get(prefix);
        if (!prefixed) {
            prefixed = new Map();
            this.errors.set(prefix, prefixed);
        }
        prefixed.set(filePath, errors);
        this.pushErrors();
    }
    clear() {
        console.log("clearing errors");
    }
}
exports.ErrorPusher = ErrorPusher;
