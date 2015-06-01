var transformerRegistry_1 = require("../transformerRegistry");
var NullTransformer = (function () {
    function NullTransformer() {
        this.name = "null";
    }
    NullTransformer.prototype.transform = function (code) {
        return { code: code };
    };
    return NullTransformer;
})();
exports.NullTransformer = NullTransformer;
transformerRegistry_1.add(new NullTransformer());
