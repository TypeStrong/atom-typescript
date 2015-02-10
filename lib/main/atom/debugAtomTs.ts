///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

///ts:import=atomConfig
import atomConfig = require('./atomConfig'); ///ts:import:generated
import ts = require('typescript');
import TokenClass = ts.TokenClass;

export function runDebugCode(details: { filePath: string; editor: AtomCore.IEditor }) {
    if (!atomConfig.debugAtomTs) return;

    console.log(details);

    var textForTest = 'var foo = 123;';

    //////////// Code for the built in grammar
    var grammar = (<any>atom).grammars.grammarForScopeName('source.ts'); // https://atom.io/docs/api/v0.177.0/Grammar
    var official = grammar.tokenizeLines(textForTest);
    console.log(official);


    var classifier: ts.Classifier = ts.createClassifier({ log: () => undefined });

    var classificationResult = classifier.getClassificationsForLine(textForTest, ts.EndOfLineState.Start).entries;

    classificationResult.map((info) => {
        console.log(info.classification, getStyleForToken(info));
    });

}

function getStyleForToken(token: ts.ClassificationInfo): string {
    switch (token.classification) {
        case ts.TokenClass.NumberLiteral:
            return 'number';
        case TokenClass.StringLiteral:
            return 'string';
        case TokenClass.RegExpLiteral:
            return 'string-2';
        case TokenClass.Operator:
            return 'operator';
        case TokenClass.Comment:
            return 'comment';
        /*case TokenClass.Keyword:
            switch (token.string) {
                case 'string':
                case 'number':
                case 'void':
                case 'bool':
                case 'boolean':
                    return 'variable-2';
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
                    return 'def';
                default:
                    return 'keyword';
            }

        case TokenClass.Identifier:
            // Show types (indentifiers in PascalCase) as variable-2, other types (camelCase) as variable
            if (token.string.charAt(0).toLowerCase() !== token.string.charAt(0)) {
                return 'variable-2';
            } else {
                return 'variable';
            }*/
        case TokenClass.Punctuation:
            return 'bracket';
        case TokenClass.Whitespace:
        default:
            return null;
    }
}
