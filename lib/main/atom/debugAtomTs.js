var atomConfig = require('./atomConfig');
var ts = require('typescript');
var TokenClass = ts.TokenClass;
function runDebugCode(details) {
    if (!atomConfig.debugAtomTs)
        return;
    console.log(details);
    var textForTest = 'var foo = 123;';
    var grammar = atom.grammars.grammarForScopeName('source.ts');
    var official = grammar.tokenizeLines(textForTest);
    console.log(official);
    var classifier = ts.createClassifier({ log: function () { return undefined; } });
    var classificationResult = classifier.getClassificationsForLine(textForTest, 0 /* Start */).entries;
    classificationResult.map(function (info) {
        console.log(info.classification, getStyleForToken(info));
    });
}
exports.runDebugCode = runDebugCode;
function getStyleForToken(token) {
    switch (token.classification) {
        case 6 /* NumberLiteral */:
            return 'number';
        case 7 /* StringLiteral */:
            return 'string';
        case 8 /* RegExpLiteral */:
            return 'string-2';
        case 2 /* Operator */:
            return 'operator';
        case 3 /* Comment */:
            return 'comment';
        case 0 /* Punctuation */:
            return 'bracket';
        case 4 /* Whitespace */:
        default:
            return null;
    }
}
