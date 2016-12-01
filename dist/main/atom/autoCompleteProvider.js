"use strict";
var tslib_1 = require("tslib");
var atomUtils = require("./atomUtils");
var fs = require("fs");
var parent = require("../../worker/parent");
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
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var filePath, client, prefix;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        filePath = options.editor.getPath();
                        if (!filePath || !fs.existsSync(filePath))
                            return [2 /*return*/, []];
                        return [4 /*yield*/, parent.clients.get(filePath)];
                    case 1:
                        client = _a.sent();
                        if (explicitlyTriggered) {
                            explicitlyTriggered = false;
                        }
                        else {
                            prefix = options.prefix.trim();
                            if (prefix === '' || prefix === ';' || prefix === '{') {
                                return [2 /*return*/, Promise.resolve([])];
                            }
                        }
                        return [2 /*return*/, client.executeCompletions({
                                file: filePath,
                                prefix: options.prefix,
                                line: options.bufferPosition.row + 1,
                                offset: options.bufferPosition.column + 1
                            }).then(function (resp) {
                                console.log("prefix", options.prefix);
                                return resp.body.map(function (c) {
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
                            })];
                }
            });
        });
    },
};
