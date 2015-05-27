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
