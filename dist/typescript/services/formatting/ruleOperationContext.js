///<reference path='references.ts' />
var ts;
(function (ts) {
    var formatting;
    (function (formatting) {
        var RuleOperationContext = (function () {
            function RuleOperationContext() {
                var funcs = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    funcs[_i - 0] = arguments[_i];
                }
                this.customContextChecks = funcs;
            }
            RuleOperationContext.prototype.IsAny = function () {
                return this == RuleOperationContext.Any;
            };
            RuleOperationContext.prototype.InContext = function (context) {
                if (this.IsAny()) {
                    return true;
                }
                for (var _i = 0, _a = this.customContextChecks; _i < _a.length; _i++) {
                    var check = _a[_i];
                    if (!check(context)) {
                        return false;
                    }
                }
                return true;
            };
            RuleOperationContext.Any = new RuleOperationContext();
            return RuleOperationContext;
        })();
        formatting.RuleOperationContext = RuleOperationContext;
    })(formatting = ts.formatting || (ts.formatting = {}));
})(ts || (ts = {}));
