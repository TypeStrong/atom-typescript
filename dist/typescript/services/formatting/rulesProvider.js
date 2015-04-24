/// <reference path="references.ts"/>
var ts;
(function (ts) {
    var formatting;
    (function (formatting) {
        var RulesProvider = (function () {
            function RulesProvider() {
                this.globalRules = new formatting.Rules();
            }
            RulesProvider.prototype.getRuleName = function (rule) {
                return this.globalRules.getRuleName(rule);
            };
            RulesProvider.prototype.getRuleByName = function (name) {
                return this.globalRules[name];
            };
            RulesProvider.prototype.getRulesMap = function () {
                return this.rulesMap;
            };
            RulesProvider.prototype.ensureUpToDate = function (options) {
                if (this.options == null || !ts.compareDataObjects(this.options, options)) {
                    var activeRules = this.createActiveRules(options);
                    var rulesMap = formatting.RulesMap.create(activeRules);
                    this.activeRules = activeRules;
                    this.rulesMap = rulesMap;
                    this.options = ts.clone(options);
                }
            };
            RulesProvider.prototype.createActiveRules = function (options) {
                var rules = this.globalRules.HighPriorityCommonRules.slice(0);
                if (options.InsertSpaceAfterCommaDelimiter) {
                    rules.push(this.globalRules.SpaceAfterComma);
                }
                else {
                    rules.push(this.globalRules.NoSpaceAfterComma);
                }
                if (options.InsertSpaceAfterFunctionKeywordForAnonymousFunctions) {
                    rules.push(this.globalRules.SpaceAfterAnonymousFunctionKeyword);
                }
                else {
                    rules.push(this.globalRules.NoSpaceAfterAnonymousFunctionKeyword);
                }
                if (options.InsertSpaceAfterKeywordsInControlFlowStatements) {
                    rules.push(this.globalRules.SpaceAfterKeywordInControl);
                }
                else {
                    rules.push(this.globalRules.NoSpaceAfterKeywordInControl);
                }
                if (options.InsertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis) {
                    rules.push(this.globalRules.SpaceAfterOpenParen);
                    rules.push(this.globalRules.SpaceBeforeCloseParen);
                    rules.push(this.globalRules.NoSpaceBetweenParens);
                }
                else {
                    rules.push(this.globalRules.NoSpaceAfterOpenParen);
                    rules.push(this.globalRules.NoSpaceBeforeCloseParen);
                    rules.push(this.globalRules.NoSpaceBetweenParens);
                }
                if (options.InsertSpaceAfterSemicolonInForStatements) {
                    rules.push(this.globalRules.SpaceAfterSemicolonInFor);
                }
                else {
                    rules.push(this.globalRules.NoSpaceAfterSemicolonInFor);
                }
                if (options.InsertSpaceBeforeAndAfterBinaryOperators) {
                    rules.push(this.globalRules.SpaceBeforeBinaryOperator);
                    rules.push(this.globalRules.SpaceAfterBinaryOperator);
                }
                else {
                    rules.push(this.globalRules.NoSpaceBeforeBinaryOperator);
                    rules.push(this.globalRules.NoSpaceAfterBinaryOperator);
                }
                if (options.PlaceOpenBraceOnNewLineForControlBlocks) {
                    rules.push(this.globalRules.NewLineBeforeOpenBraceInControl);
                }
                if (options.PlaceOpenBraceOnNewLineForFunctions) {
                    rules.push(this.globalRules.NewLineBeforeOpenBraceInFunction);
                    rules.push(this.globalRules.NewLineBeforeOpenBraceInTypeScriptDeclWithBlock);
                }
                rules = rules.concat(this.globalRules.LowPriorityCommonRules);
                return rules;
            };
            return RulesProvider;
        })();
        formatting.RulesProvider = RulesProvider;
    })(formatting = ts.formatting || (ts.formatting = {}));
})(ts || (ts = {}));
