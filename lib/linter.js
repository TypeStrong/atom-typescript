var programManager = require('./main/lang/programManager');
var utils = require('./main/lang/utils');
var fs = require('fs');
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
var debouncedErrors = utils.debounce(function (callback, errors) {
    callback(errors);
}, 1500);
LinterTslint = (function (_super) {
    __extends(LinterTslint, _super);
    function LinterTslint() {
        return Linter.apply(this, arguments);
    }
    LinterTslint.syntax = ['source.ts'];
    LinterTslint.prototype.lintFile = function (filePath, callback) {
        if (!this.editor.buffer.file || !this.editor.buffer.file.path || !fs.existsSync(this.editor.buffer.file.path))
            return callback([]);
        filePath = this.editor.buffer.file.path;
        var fileName = path.basename(filePath);
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
