/**
 * Things we care about:
 * name , kind , text
 */
// Inspired by `ts.forEachChild`:
// https://github.com/Microsoft/TypeScript/blob/65cbd91667acf890f21a3527b3647c7bc994ca32/src/compiler/parser.ts#L43-L320
var ts = require("typescript");
function astToText(srcFile) {
    ts.forEachChild(srcFile, function (node) {
        console.error(node.name, node.kind);
    });
}
exports.default = astToText;
