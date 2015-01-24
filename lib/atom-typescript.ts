// This file is only called from linter
// See : https://github.com/AtomLinter/Linter/issues/337
// This is what happens when packages use convention over configuration :P

///ts:ref=globals
/// <reference path="./globals.ts"/> ///ts:ref:generated

///ts:import=programManager
import programManager = require('./main/lang/programManager'); ///ts:import:generated
///ts:import=utils
import utils = require('./main/lang/utils'); ///ts:import:generated

var linterPath = atom.packages.getLoadedPackage("linter").path;
var Linter = require(linterPath + "/lib/linter");
var path = require("path");
var Rng = require("atom").Range;

var LinterTslint,
    __hasProp = {}.hasOwnProperty,
    __extends = function (child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

interface LinterError {
    message: string;
    line: number; // startline.
    range: any; // LinterRange([startline,startch],[endline,endch]);
    level: string; // 'error' | 'warning'
    linter: string; // linter name
}

LinterTslint = (function (_super) {
    __extends(LinterTslint, _super);

    function LinterTslint() {
        return Linter.apply(this, arguments);
    }

    (<any>LinterTslint).syntax = ['source.ts'];

    LinterTslint.prototype.lintFile = function (filePath, callback: (errors: LinterError[]) => any) {
        var contents, fileName;
        filePath = this.editor.buffer.file.path;
        contents = this.editor.getText();
        fileName = path.basename(filePath);

        var errors = programManager.getErrorsForFileFiltered(filePath);
        var linterErrors: LinterError[] = errors.map((err) => <LinterError>{
            message: err.message,
            line: err.startPos.line + 1,
            range: new Rng([err.startPos.line, err.startPos.ch], [err.endPos.line, err.endPos.ch]),
            level: 'error',
            linter: 'TypeScript'
        });

        return callback(linterErrors);
    };

    return LinterTslint;

})(Linter);

module.exports = LinterTslint;
