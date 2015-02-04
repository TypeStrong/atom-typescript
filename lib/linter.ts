// This file is only called from linter
// See : https://github.com/AtomLinter/Linter/issues/337

///ts:ref=globals
/// <reference path="./globals.ts"/> ///ts:ref:generated

///ts:import=programManager
import programManager = require('./main/lang/programManager'); ///ts:import:generated
///ts:import=utils
import utils = require('./main/lang/utils'); ///ts:import:generated

import fs = require('fs');

var linterPath = atom.packages.getLoadedPackage("linter").path;
var Linter = require(linterPath + "/lib/linter");
var path = require("path");
var Rng = require("atom").Range;

var LinterTslint,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

interface LinterError {
    message: string;
    line: number; // startline.
    range: any; // LinterRange([startline,startch],[endline,endch]);
    level: string; // 'error' | 'warning'
    linter: string; // linter name
}

var debouncedErrors = utils.debounce((callback: Function, errors: LinterError[]) => {
    callback(errors);
}, 1500);

LinterTslint = (function(_super) {
    __extends(LinterTslint, _super);

    function LinterTslint() {
        return Linter.apply(this, arguments);
    }

    (<any>LinterTslint).syntax = ['source.ts'];

    LinterTslint.prototype.lintFile = function(filePath, callback: (errors: LinterError[]) => any) {
        // We refuse to work on files that are not on disk.
        if (!this.editor.buffer.file
            || !this.editor.buffer.file.path
            || !fs.existsSync(this.editor.buffer.file.path)) return callback([]);

        filePath = this.editor.buffer.file.path;

        var errors = programManager.getErrorsForFileFiltered(filePath);
        var linterErrors: LinterError[] = errors.map((err) => <LinterError>{
            message: err.message,
            line: err.startPos.line + 1,
            range: new Rng([err.startPos.line, err.startPos.ch], [err.endPos.line, err.endPos.ch]),
            level: 'error',
            linter: 'TypeScript'
        });

        return callback(linterErrors);
        // return debouncedErrors(callback, linterErrors);
    };

    return LinterTslint;

})(Linter);

module.exports = LinterTslint;
