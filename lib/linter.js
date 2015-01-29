var programManager = require('./main/lang/programManager');
var linterPath = atom.packages.getLoadedPackage("linter").path;
var Linter = require(linterPath + "/lib/linter");
var path = require("path");
var Rng = require("atom").Range;
var LinterTslint, __hasProp = {}.hasOwnProperty, __extends = function (child, parent) {
    for (var key in parent) {
        if (__hasProp.call(parent, key))
            child[key] = parent[key];
    }
    function ctor() {
        this.constructor = child;
    }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.__super__ = parent.prototype;
    return child;
};
LinterTslint = (function (_super) {
    __extends(LinterTslint, _super);
    function LinterTslint() {
        return Linter.apply(this, arguments);
    }
    LinterTslint.syntax = ['source.ts'];
    LinterTslint.prototype.lintFile = function (filePath, callback) {
        var contents, fileName;
        filePath = this.editor.buffer.file.path;
        contents = this.editor.getText();
        fileName = path.basename(filePath);
        return callback([]);
        var errors = programManager.getErrorsForFileFiltered(filePath);
        var linterErrors = errors.map(function (err) { return {
            message: err.message,
            line: err.startPos.line + 1,
            range: new Rng([err.startPos.line, err.startPos.ch], [err.endPos.line, err.endPos.ch]),
            level: 'error',
            linter: 'TypeScript'
        }; });
        return callback(linterErrors);
    };
    return LinterTslint;
})(Linter);
module.exports = LinterTslint;
