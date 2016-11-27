"use strict";
var parent = require("./worker/parent");
var fs = require("fs");
var atom_1 = require("atom");
exports.provider = {
    name: 'TS',
    grammarScopes: ['source.ts', 'source.tsx'],
    scope: 'file',
    lintOnFly: true,
    lint: function (textEditor) {
        if (!textEditor.buffer.file
            || !textEditor.buffer.file.path
            || !fs.existsSync(textEditor.buffer.file.path))
            return Promise.resolve([]);
        var filePath = textEditor.buffer.file.path;
        parent.client.executeGetErr({ files: [filePath], delay: 100 });
        return new Promise(function (resolve, reject) {
            var unsub = parent.client.on("semanticDiag", function (result) {
                if (result.file === filePath) {
                    try {
                        unsub();
                        var errors = result.diagnostics.map(function (diag) {
                            return {
                                type: "Error",
                                filePath: filePath,
                                text: diag.text,
                                range: new atom_1.Range([diag.start.line - 1, diag.start.offset - 1], [diag.end.line - 1, diag.end.offset - 1])
                            };
                        });
                        resolve(errors);
                    }
                    catch (error) {
                        resolve([]);
                    }
                }
            });
        });
    }
};
