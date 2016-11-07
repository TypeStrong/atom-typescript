"use strict";
var path_1 = require("path");
global.stack = function () {
    console.error(new Error().stack);
};
function makeTsGlobal(typescriptPath) {
    if (typescriptPath) {
        if (!path_1.isAbsolute(typescriptPath)) {
            throw new Error("Path to Typescript \"" + typescriptPath + "\" is not absolute");
        }
        typescriptPath = typescriptPath.trim();
    }
    else {
        typescriptPath = "typescript";
    }
    global.ts = require(typescriptPath);
}
exports.makeTsGlobal = makeTsGlobal;
