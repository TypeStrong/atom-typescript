///<reference path='references.ts' />
var ts;
(function (ts) {
    var formatting;
    (function (formatting) {
        (function (RuleAction) {
            RuleAction[RuleAction["Ignore"] = 1] = "Ignore";
            RuleAction[RuleAction["Space"] = 2] = "Space";
            RuleAction[RuleAction["NewLine"] = 4] = "NewLine";
            RuleAction[RuleAction["Delete"] = 8] = "Delete";
        })(formatting.RuleAction || (formatting.RuleAction = {}));
        var RuleAction = formatting.RuleAction;
    })(formatting = ts.formatting || (ts.formatting = {}));
})(ts || (ts = {}));
