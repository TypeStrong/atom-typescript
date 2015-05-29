// This file is only called from linter
// See : https://github.com/AtomLinter/Linter/issues/337
var parent = require('./worker/parent');
var fs = require('fs');
var linterPath = atom.packages.getLoadedPackage("linter").path;
var Linter = require(linterPath + "/lib/linter");
var path = require("path");
var Rng = require("atom").Range;
var LinterTslint, __hasProp = {}.hasOwnProperty, __extends = function (child, parent) { for (var key in parent) {
    if (__hasProp.call(parent, key))
        child[key] = parent[key];
} function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
LinterTslint = (function (_super) {
    __extends(LinterTslint, _super);
    function LinterTslint() {
        return Linter.apply(this, arguments);
    }
    LinterTslint.syntax = ['source.ts'];
    LinterTslint.prototype.lintFile = function (filePath, callback) {
        if (!this.editor.buffer.file
            || !this.editor.buffer.file.path
            || !fs.existsSync(this.editor.buffer.file.path))
            return callback([]);
        filePath = this.editor.buffer.file.path;
        parent.errorsForFile({ filePath: filePath }).then(function (resp) {
            var linterErrors = resp.errors.map(function (err) { return {
                message: err.message,
                line: err.startPos.line + 1,
                range: new Rng([err.startPos.line, err.startPos.col], [err.endPos.line, err.endPos.col]),
                level: 'error',
                linter: 'TypeScript'
            }; });
            return callback(linterErrors);
        });
    };
    return LinterTslint;
})(Linter);
module.exports = LinterTslint;
