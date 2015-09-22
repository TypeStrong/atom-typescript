var parent = require('./worker/parent');
var fs = require('fs');
var atom_1 = require("atom");
exports.provider = {
    grammarScopes: ['source.ts', 'source.ts.tsx'],
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
                html: "<span class=\"badge badge-flexible\" style=\"color:rgb(0, 148, 255)\"> TS </span> " + err.message.replace(/\n/g, '<br />'),
                range: new atom_1.Range([err.startPos.line, err.startPos.col], [err.endPos.line, err.endPos.col]),
            }); });
            return linterErrors;
        })
            .catch(function (error) {
            return [];
        });
    }
};
