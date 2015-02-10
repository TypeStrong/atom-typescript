///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

///ts:import=atomConfig
import atomConfig = require('./atomConfig'); ///ts:import:generated
import ts = require('typescript');
import TokenClass = ts.TokenClass;

interface AtomTokenizeLineResult {
    tokens: any[];
    ruleStack: any[];
}

export function runDebugCode(details: { filePath: string; editor: AtomCore.IEditor }) {
    if (!atomConfig.debugAtomTs) return;

    console.log(details);

    var textForTest = details.editor.getText();

    //////////// Code for the built in grammar
    var grammar = (<any>atom).grammars.grammarForScopeName('source.ts'); // https://atom.io/docs/api/v0.177.0/Grammar
    var official = grammar.tokenizeLines(textForTest);

    var oldTokenizeLines = grammar.tokenizeLines;
    var oldTokenizeLine = grammar.tokenizeLine;
    grammar.tokenizeLine = function(line, ruleStack: any[], firstLine: boolean): AtomTokenizeLineResult {
        var result: AtomTokenizeLineResult = oldTokenizeLine.apply(grammar, arguments);
        console.log(line, result.tokens, getAtomTokensForLine(line));
        return result;
    }
    /*grammar.tokenizeLines = function(text) {
        var result = oldTokenizeLines.apply(grammar, arguments);
        console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!LINES!!!!!!!!!!!!!!!!!!!!!!!!!!!!!', text.length);
        return result;
    }*/

    console.log(grammar, official);


    //////////// using the language service
    /*var classifier: ts.Classifier = ts.createClassifier({ log: () => undefined });
    var classificationResult = classifier.getClassificationsForLine(textForTest, ts.EndOfLineState.Start).entries;
    var totalLength = 0;
    classificationResult.forEach((info) => {
        var str = textForTest.substr(totalLength, info.length);
        console.log(info, getStyleForToken(info, str), str);
        totalLength = totalLength + info.length;
    });*/

}

// https://github.com/fdecampredon/brackets-typescript/blob/master/src/main/mode.ts
interface AtomToken {
    bufferDelta: number; // Just the lenght it seems
    screenDelta: number; // seems same as buffer Delta.
    hasPairedCharacter: boolean;
    isAtomic: any; // undefined
    isHardTab: any; //undefined
    scopes: any[]; // just ["source.ts","constant.numeric.js"]
    value: string; // The buffer contents of the matched stuff
}

function getAtomTokensForLine(line: string): AtomToken[] {
    var classifier: ts.Classifier = ts.createClassifier({ log: () => undefined });
    // TODO: use finalLexState
    var classificationResult = classifier.getClassificationsForLine(line, ts.EndOfLineState.Start).entries;
    // TODO: collapse Whitespace
    var totalLength = 0;
    return classificationResult.map((info) => {
        var tokenStartPosition = totalLength;
        var str = line.substr(tokenStartPosition, info.length);
        totalLength = totalLength + info.length;
        return getAtomTokenForToken(info, str, tokenStartPosition);
    });
}

function getAtomTokenForToken(token: ts.ClassificationInfo, str: string, start: number): AtomToken {
    return {
        bufferDelta: token.length,
        screenDelta: token.length,
        hasPairedCharacter: false,
        isAtomic: undefined,
        isHardTab: undefined,
        scopes: ['source.ts', 'constant.numeric.js'],
        value: str
    }
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
            if (!str.trim()) return ''; // Hacky fix for https://github.com/Microsoft/TypeScript/issues/1997
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
