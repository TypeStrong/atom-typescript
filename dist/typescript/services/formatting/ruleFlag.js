///<reference path='references.ts' />
var ts;
(function (ts) {
    var formatting;
    (function (formatting) {
        (function (RuleFlags) {
            RuleFlags[RuleFlags["None"] = 0] = "None";
            RuleFlags[RuleFlags["CanDeleteNewLines"] = 1] = "CanDeleteNewLines";
        })(formatting.RuleFlags || (formatting.RuleFlags = {}));
        var RuleFlags = formatting.RuleFlags;
    })(formatting = ts.formatting || (ts.formatting = {}));
})(ts || (ts = {}));
