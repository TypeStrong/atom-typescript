"use strict";
var parent = require('./worker/parent');
var fs = require('fs');
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
        return parent.errorsForFile({ filePath: filePath })
            .then(function (resp) {
            var linterErrors = resp.errors.map(function (err) { return ({
                type: "Error",
                filePath: filePath,
                text: err.message,
                range: new atom_1.Range([err.startPos.line, err.startPos.col], [err.endPos.line, err.endPos.col]),
            }); });
            return linterErrors;
        })
            .catch(function (error) {
            return [];
        });
    }
};
