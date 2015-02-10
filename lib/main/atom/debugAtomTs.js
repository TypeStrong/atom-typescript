var atomConfig = require('./atomConfig');
var ts = require('typescript');
var TokenClass = ts.TokenClass;
function runDebugCode(details) {
    if (!atomConfig.debugAtomTs)
        return;
    console.log(details);
    var textForTest = details.editor.getText();
    var grammar = atom.grammars.grammarForScopeName('source.ts');
    var official = grammar.tokenizeLines(textForTest);
    var oldTokenizeLines = grammar.tokenizeLines;
    var oldTokenizeLine = grammar.tokenizeLine;
    grammar.tokenizeLine = function (line, ruleStack, firstLine) {
        var result = oldTokenizeLine.apply(grammar, arguments);
        console.log(line, result.tokens, getAtomTokensForLine(line));
        return result;
    };
    console.log(grammar, official);
}
exports.runDebugCode = runDebugCode;
function getAtomTokensForLine(line) {
    var classifier = ts.createClassifier({ log: function () { return undefined; } });
    var classificationResult = classifier.getClassificationsForLine(line, ts.EndOfLineState.Start).entries;
    var totalLength = 0;
    return classificationResult.map(function (info) {
        var tokenStartPosition = totalLength;
        var str = line.substr(tokenStartPosition, info.length);
        totalLength = totalLength + info.length;
        return getAtomTokenForToken(info, str, tokenStartPosition);
    });
}
function getAtomTokenForToken(token, str, start) {
    return {
        bufferDelta: token.length,
        screenDelta: token.length,
        hasPairedCharacter: false,
        isAtomic: undefined,
        isHardTab: undefined,
        scopes: ['source.ts', 'constant.numeric.js'],
        value: str
    };
}
function getStyleForToken(token, str) {
    switch (token.classification) {
        case TokenClass.Punctuation:
            return 'punctuation';
        case TokenClass.Keyword:
            switch (str) {
                case 'static':
                case 'public':
                case 'private':
                case 'export':
                case 'get':
                case 'set':
                    return 'qualifier';
                case 'class':
                case 'function':
                case 'module':
                case 'var':
                    return 'definition';
                case 'string':
                case 'number':
                case 'void':
                case 'boolean':
                    return 'keyword';
                default:
                    return 'keyword';
            }
        case TokenClass.Operator:
            return 'operator';
        case TokenClass.Comment:
            return 'comment';
        case TokenClass.Whitespace:
            return '';
        case TokenClass.Identifier:
            if (!str.trim())
                return '';
            return 'identifier';
        case TokenClass.NumberLiteral:
            return 'number';
        case TokenClass.StringLiteral:
            return 'string';
        case TokenClass.RegExpLiteral:
            return 'regexp';
        default:
            return null;
    }
}
