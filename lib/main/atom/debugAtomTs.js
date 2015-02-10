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
    console.log(official);
    var classifier = ts.createClassifier({ log: function () { return undefined; } });
    var classificationResult = classifier.getClassificationsForLine(textForTest, 0 /* Start */).entries;
    var totalLength = 0;
    classificationResult.forEach(function (info) {
        var str = textForTest.substr(totalLength, info.length);
        console.log(info, getStyleForToken(info, str), str);
        totalLength = totalLength + info.length;
    });
}
exports.runDebugCode = runDebugCode;
function getStyleForToken(token, str) {
    switch (token.classification) {
        case 0 /* Punctuation */:
            return 'punctuation';
        case 1 /* Keyword */:
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
        case 2 /* Operator */:
            return 'operator';
        case 3 /* Comment */:
            return 'comment';
        case 4 /* Whitespace */:
            return '';
        case 5 /* Identifier */:
            if (!str.trim())
                return '';
            return 'identifier';
        case 6 /* NumberLiteral */:
            return 'number';
        case 7 /* StringLiteral */:
            return 'string';
        case 8 /* RegExpLiteral */:
            return 'regexp';
        default:
            return null;
    }
}
