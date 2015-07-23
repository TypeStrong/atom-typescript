var QuotesToQuotes = (function () {
    function QuotesToQuotes() {
        this.key = QuotesToQuotes.name;
    }
    QuotesToQuotes.prototype.canProvideFix = function (info) {
        if (info.positionNode.kind === ts.SyntaxKind.StringLiteral) {
            if (info.positionNode.getText().trim()[0] === "'") {
                return { display: "Convert ' to \"" };
            }
            if (info.positionNode.getText().trim()[0] === "\"") {
                return { display: "Convert \" to '" };
            }
        }
    };
    QuotesToQuotes.prototype.provideFix = function (info) {
        var text = info.positionNode.getText();
        var quoteCharacter = text.trim()[0];
        var nextQuoteCharacter = quoteCharacter === "'" ? '"' : "'";
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
    return QuotesToQuotes;
})();
exports.QuotesToQuotes = QuotesToQuotes;
