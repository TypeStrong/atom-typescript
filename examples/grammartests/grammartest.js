var func;
(function (func) {
    function foo() {
    }
    function bar(a, b) {
    }
})(func || (func = {}));
var Foo = (function () {
    function Foo() {
    }
    Object.defineProperty(Foo.prototype, "awesome", {
        get: function () {
            return true;
        },
        enumerable: true,
        configurable: true
    });
    return Foo;
})();
