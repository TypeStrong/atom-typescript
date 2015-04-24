// This file is only called from linter
// See : https://github.com/AtomLinter/Linter/issues/337

///ts:import=utils
import utils = require('./main/lang/utils'); ///ts:import:generated
///ts:import=parent
import parent = require('./worker/parent'); ///ts:import:generated

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

LinterTslint = (function(_super) {
    __extends(LinterTslint, _super);

    function LinterTslint() {
        return Linter.apply(this, arguments);
    }

    (<any>LinterTslint).syntax = ['source.ts'];

    LinterTslint.prototype.lintFile = function(filePath:string, callback: (errors: LinterError[]) => any) {
        // We refuse to work on files that are not on disk.
        if (!this.editor.buffer.file
            || !this.editor.buffer.file.path
            || !fs.existsSync(this.editor.buffer.file.path)) return callback([]);

        filePath = this.editor.buffer.file.path;

        parent.errorsForFileFiltered({ filePath: filePath }).then((resp) => {
            var linterErrors: LinterError[] = resp.errors.map((err) => <LinterError>{
                message: err.message,
                line: err.startPos.line + 1,
                range: new Rng([err.startPos.line, err.startPos.col], [err.endPos.line, err.endPos.col]),
                level: 'error',
                linter: 'TypeScript'
            });

            return callback(linterErrors);
        });
    };

    return LinterTslint;

})(Linter);

module.exports = LinterTslint;
