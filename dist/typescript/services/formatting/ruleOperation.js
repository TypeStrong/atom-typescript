///<reference path='references.ts' />
var ts;
(function (ts) {
    var formatting;
    (function (formatting) {
        var RuleOperation = (function () {
            function RuleOperation() {
                this.Context = null;
                this.Action = null;
            }
            RuleOperation.prototype.toString = function () {
                return "[context=" + this.Context + "," +
                    "action=" + this.Action + "]";
            };
            RuleOperation.create1 = function (action) {
                return RuleOperation.create2(formatting.RuleOperationContext.Any, action);
            };
            RuleOperation.create2 = function (context, action) {
                var result = new RuleOperation();
                result.Context = context;
                result.Action = action;
                return result;
            };
            return RuleOperation;
        })();
        formatting.RuleOperation = RuleOperation;
    })(formatting = ts.formatting || (ts.formatting = {}));
})(ts || (ts = {}));
