/// <reference path="references.ts"/>
var ts;
(function (ts) {
    var formatting;
    (function (formatting) {
        var FormattingContext = (function () {
            function FormattingContext(sourceFile, formattingRequestKind) {
                this.sourceFile = sourceFile;
                this.formattingRequestKind = formattingRequestKind;
            }
            FormattingContext.prototype.updateContext = function (currentRange, currentTokenParent, nextRange, nextTokenParent, commonParent) {
                ts.Debug.assert(currentRange !== undefined, "currentTokenSpan is null");
                ts.Debug.assert(currentTokenParent !== undefined, "currentTokenParent is null");
                ts.Debug.assert(nextRange !== undefined, "nextTokenSpan is null");
                ts.Debug.assert(nextTokenParent !== undefined, "nextTokenParent is null");
                ts.Debug.assert(commonParent !== undefined, "commonParent is null");
                this.currentTokenSpan = currentRange;
                this.currentTokenParent = currentTokenParent;
                this.nextTokenSpan = nextRange;
                this.nextTokenParent = nextTokenParent;
                this.contextNode = commonParent;
                this.contextNodeAllOnSameLine = undefined;
                this.nextNodeAllOnSameLine = undefined;
                this.tokensAreOnSameLine = undefined;
                this.contextNodeBlockIsOnOneLine = undefined;
                this.nextNodeBlockIsOnOneLine = undefined;
            };
            FormattingContext.prototype.ContextNodeAllOnSameLine = function () {
                if (this.contextNodeAllOnSameLine === undefined) {
                    this.contextNodeAllOnSameLine = this.NodeIsOnOneLine(this.contextNode);
                }
                return this.contextNodeAllOnSameLine;
            };
            FormattingContext.prototype.NextNodeAllOnSameLine = function () {
                if (this.nextNodeAllOnSameLine === undefined) {
                    this.nextNodeAllOnSameLine = this.NodeIsOnOneLine(this.nextTokenParent);
                }
                return this.nextNodeAllOnSameLine;
            };
            FormattingContext.prototype.TokensAreOnSameLine = function () {
                if (this.tokensAreOnSameLine === undefined) {
                    var startLine = this.sourceFile.getLineAndCharacterOfPosition(this.currentTokenSpan.pos).line;
                    var endLine = this.sourceFile.getLineAndCharacterOfPosition(this.nextTokenSpan.pos).line;
                    this.tokensAreOnSameLine = (startLine == endLine);
                }
                return this.tokensAreOnSameLine;
            };
            FormattingContext.prototype.ContextNodeBlockIsOnOneLine = function () {
                if (this.contextNodeBlockIsOnOneLine === undefined) {
                    this.contextNodeBlockIsOnOneLine = this.BlockIsOnOneLine(this.contextNode);
                }
                return this.contextNodeBlockIsOnOneLine;
            };
            FormattingContext.prototype.NextNodeBlockIsOnOneLine = function () {
                if (this.nextNodeBlockIsOnOneLine === undefined) {
                    this.nextNodeBlockIsOnOneLine = this.BlockIsOnOneLine(this.nextTokenParent);
                }
                return this.nextNodeBlockIsOnOneLine;
            };
            FormattingContext.prototype.NodeIsOnOneLine = function (node) {
                var startLine = this.sourceFile.getLineAndCharacterOfPosition(node.getStart(this.sourceFile)).line;
                var endLine = this.sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line;
                return startLine == endLine;
            };
            FormattingContext.prototype.BlockIsOnOneLine = function (node) {
                var openBrace = ts.findChildOfKind(node, 14, this.sourceFile);
                var closeBrace = ts.findChildOfKind(node, 15, this.sourceFile);
                if (openBrace && closeBrace) {
                    var startLine = this.sourceFile.getLineAndCharacterOfPosition(openBrace.getEnd()).line;
                    var endLine = this.sourceFile.getLineAndCharacterOfPosition(closeBrace.getStart(this.sourceFile)).line;
                    return startLine === endLine;
                }
                return false;
            };
            return FormattingContext;
        })();
        formatting.FormattingContext = FormattingContext;
    })(formatting = ts.formatting || (ts.formatting = {}));
})(ts || (ts = {}));
