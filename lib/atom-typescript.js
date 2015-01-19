// This file is only called from linter
// See : https://github.com/AtomLinter/Linter/issues/337
// This is what happens when packages use convention over configuration :P

var linterPath = atom.packages.getLoadedPackage("linter").path;
var Linter = require(linterPath + "/lib/linter");
