/**
 * Things we care about:
 * name , kind , text
 */
// Inspired by `ts.forEachChild`:
// https://github.com/Microsoft/TypeScript/blob/65cbd91667acf890f21a3527b3647c7bc994ca32/src/compiler/parser.ts#L43-L320
function astToText(srcFile) {
    //// A useful function for debugging
    // aggregate(srcFile, 0);
    // function aggregate(node: ts.Node, depth: number): void {
    //     console.error(node.kind, (node.name && node.name.text), (node.parent), depth, node);
    //     ts.forEachChild(node, (node) => aggregate(node, depth + 1));
    // }
    var root;
}
exports.default = astToText;
