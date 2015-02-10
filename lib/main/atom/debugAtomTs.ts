///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

///ts:import=atomConfig
import atomConfig = require('./atomConfig'); ///ts:import:generated
import ts = require('typescript');
import TokenClass = ts.TokenClass;

export function runDebugCode(details: { filePath: string; editor: AtomCore.IEditor }) {
    if (!atomConfig.debugAtomTs) return;

    console.log(details);

    var textForTest = details.editor.getText();

    //////////// Code for the built in grammar
    var grammar = (<any>atom).grammars.grammarForScopeName('source.ts'); // https://atom.io/docs/api/v0.177.0/Grammar
    var official = grammar.tokenizeLines(textForTest);
    console.log(official);


    var classifier: ts.Classifier = ts.createClassifier({ log: () => undefined });
    var classificationResult = classifier.getClassificationsForLine(textForTest, ts.EndOfLineState.Start).entries;
    var totalLength = 0;
    classificationResult.forEach((info) => {
        var str = textForTest.substr(totalLength, info.length);
        console.log(info, getStyleForToken(info, ''), str);
        totalLength = totalLength + info.length;
    });

}

// https://github.com/fdecampredon/brackets-typescript/blob/master/src/main/mode.ts
type Token  = {
    string: string;
    classification: ts.TokenClass;
    length: number;
    position: number;
}

function getStyleForToken(token: ts.ClassificationInfo, str: string): string {
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
            return 'identifier';
        case TokenClass.NumberLiteral:
            return 'number';
        case TokenClass.StringLiteral:
            return 'string';
        case TokenClass.RegExpLiteral:
            return 'regexp';
        default:
            return null; // This should not happen
    }
}
