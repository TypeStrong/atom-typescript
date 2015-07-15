var JSON2DTS = require("json2dts");
var Json2dts = JSON2DTS.Json2dts;
var toValidJSON = JSON2DTS.toValidJSON;
function convert(content) {
    try {
        var converter = new Json2dts();
        var text2Obj = JSON.parse(toValidJSON(content));
        if (typeof text2Obj != "string") {
            converter.parse(text2Obj, 'RootJson');
            content = converter.getCode();
        }
        else {
            atom.notifications.addError('Json2dts Invalid JSON');
        }
    }
    catch (e) {
        atom.notifications.addError("Json2dts Invalid JSON error: " + e);
    }
    return content;
}
exports.convert = convert;
