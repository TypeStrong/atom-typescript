// This file is only called from linter
// See : https://github.com/AtomLinter/Linter/issues/337
// This is what happens when packages use convention over configuration :P

///ts:ref=globals
/// <reference path="./globals.ts"/> ///ts:ref:generated

var linterPath = atom.packages.getLoadedPackage("linter").path;
var Linter = require(linterPath+"/lib/linter");
var path = require("path");
var Rng = require("atom").Range;

var LinterTslint,
__hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

    LinterTslint = (function(_super) {
        __extends(LinterTslint, _super);

        function LinterTslint() {
            return Linter.apply(this, arguments);
        }

        (<any>LinterTslint).syntax = ['source.ts'];

        LinterTslint.prototype.lintFile = function(filePath, callback) {
            var contents, fileName;
            filePath = this.editor.buffer.file.path;
            contents = this.editor.getText();
            fileName = path.basename(filePath);
            return callback([
                {
                    message: 'a very bad failure sample in file : ' + fileName,
                    line: 0,
                    range: new Rng([0, 0], [0, 5]),
                    linter: 'TypeScript',
                    level: 'error'
                }
                ]);
            };

            return LinterTslint;

            })(Linter);

module.exports = LinterTslint
