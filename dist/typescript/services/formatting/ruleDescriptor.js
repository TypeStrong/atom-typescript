///<reference path='references.ts' />
var ts;
(function (ts) {
    var formatting;
    (function (formatting) {
        var RuleDescriptor = (function () {
            function RuleDescriptor(LeftTokenRange, RightTokenRange) {
                this.LeftTokenRange = LeftTokenRange;
                this.RightTokenRange = RightTokenRange;
            }
            RuleDescriptor.prototype.toString = function () {
                return "[leftRange=" + this.LeftTokenRange + "," +
                    "rightRange=" + this.RightTokenRange + "]";
            };
            RuleDescriptor.create1 = function (left, right) {
                return RuleDescriptor.create4(formatting.Shared.TokenRange.FromToken(left), formatting.Shared.TokenRange.FromToken(right));
            };
            RuleDescriptor.create2 = function (left, right) {
                return RuleDescriptor.create4(left, formatting.Shared.TokenRange.FromToken(right));
            };
            RuleDescriptor.create3 = function (left, right) {
                return RuleDescriptor.create4(formatting.Shared.TokenRange.FromToken(left), right);
            };
            RuleDescriptor.create4 = function (left, right) {
                return new RuleDescriptor(left, right);
            };
            return RuleDescriptor;
        })();
        formatting.RuleDescriptor = RuleDescriptor;
    })(formatting = ts.formatting || (ts.formatting = {}));
})(ts || (ts = {}));
