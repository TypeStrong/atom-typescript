///<reference path='references.ts' />
var ts;
(function (ts) {
    var formatting;
    (function (formatting) {
        var Rule = (function () {
            function Rule(Descriptor, Operation, Flag) {
                if (Flag === void 0) { Flag = 0; }
                this.Descriptor = Descriptor;
                this.Operation = Operation;
                this.Flag = Flag;
            }
            Rule.prototype.toString = function () {
                return "[desc=" + this.Descriptor + "," +
                    "operation=" + this.Operation + "," +
                    "flag=" + this.Flag + "]";
            };
            return Rule;
        })();
        formatting.Rule = Rule;
    })(formatting = ts.formatting || (ts.formatting = {}));
})(ts || (ts = {}));
