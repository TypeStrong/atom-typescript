var HTMLtoJSX = require("htmltojsx");
function convert(content, indentSize) {
    var indent = Array(indentSize + 1).join(' ');
    var converter = new HTMLtoJSX({ indent: indent, createClass: false });
    var output = converter.convert(content);
    return output;
}
exports.convert = convert;
