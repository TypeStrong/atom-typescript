"use strict";
const tslib_1 = require("tslib");
const atomUtils = require("./atomUtils");
const fs = require("fs");
const atomts_1 = require("../atomts");
var explicitlyTriggered = false;
function triggerAutocompletePlus() {
    atom.commands.dispatch(atom.views.getView(atom.workspace.getActiveTextEditor()), 'autocomplete-plus:activate');
    explicitlyTriggered = true;
}
exports.triggerAutocompletePlus = triggerAutocompletePlus;
exports.provider = {
    selector: '.source.ts, .source.tsx',
    inclusionPriority: 3,
    suggestionPriority: 3,
    excludeLowerPriority: false,
    getSuggestions: function (options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const filePath = options.editor.getPath();
            if (!filePath || !fs.existsSync(filePath))
                return [];
            const client = yield atomts_1.clientResolver.get(filePath);
            if (explicitlyTriggered) {
                explicitlyTriggered = false;
            }
            else {
                const prefix = options.prefix.trim();
                if (prefix === '' || prefix === ';' || prefix === '{') {
                    return Promise.resolve([]);
                }
            }
            return client.executeCompletions({
                file: filePath,
                prefix: options.prefix,
                line: options.bufferPosition.row + 1,
                offset: options.bufferPosition.column + 1
            }).then(resp => {
                console.log("prefix", options.prefix);
                return resp.body.map(c => {
                    var prefix = options.prefix;
                    if (c.name && c.name.startsWith('$')) {
                        prefix = "$" + prefix;
                    }
                    return {
                        text: c.name,
                        replacementPrefix: prefix === "." ? "" : prefix.trim(),
                        rightLabel: c.name,
                        leftLabel: c.kind,
                        type: atomUtils.kindToType(c.kind),
                        description: null,
                    };
                });
            }).catch(() => []);
        });
    },
};
