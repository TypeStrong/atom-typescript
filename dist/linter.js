"use strict";
var fs = require("fs");
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
        return Promise.resolve([]);
    }
};
