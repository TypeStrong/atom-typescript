var QuoteToTemplate = (function () {
    function QuoteToTemplate() {
        this.key = QuoteToTemplate.name;
    }
    QuoteToTemplate.prototype.canProvideFix = function (info) {
        if (info.positionNode.kind === ts.SyntaxKind.StringLiteral) {
            return { display: "Convert to Template String" };
        }
    };
    QuoteToTemplate.prototype.provideFix = function (info) {
        var text = info.positionNode.getText();
        var quoteCharacter = text.trim()[0];
        var nextQuoteCharacter = '`';
        var quoteRegex = new RegExp(quoteCharacter, 'g');
        var escapedQuoteRegex = new RegExp("\\\\" + quoteCharacter, 'g');
        var nextQuoteRegex = new RegExp(nextQuoteCharacter, 'g');
        var newText = text
            .replace(nextQuoteRegex, "\\" + nextQuoteCharacter)
            .replace(escapedQuoteRegex, quoteCharacter);
        newText = nextQuoteCharacter + newText.substr(1, newText.length - 2) + nextQuoteCharacter;
        var refactoring = {
            span: {
                start: info.positionNode.getStart(),
                length: info.positionNode.end - info.positionNode.getStart()
            },
            newText: newText,
            filePath: info.filePath
        };
        return [refactoring];
    };
    return QuoteToTemplate;
})();
exports.QuoteToTemplate = QuoteToTemplate;
