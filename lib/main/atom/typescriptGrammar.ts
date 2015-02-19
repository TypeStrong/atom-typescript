///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

// Help:
// https://github.com/fdecampredon/brackets-typescript/blob/master/src/main/mode.ts
// https://github.com/p-e-w/language-javascript-semantic/blob/master/lib/javascript-semantic-grammar.coffee

import ts = require('typescript');
import TokenClass = ts.TokenClass;

var atom$: { extend: Function } = require('atom').$;

declare class AtomTSBaseGrammar {
    constructor(registry, config)
}

// This should be
//  {Grammar} = require "first-mate"
// but doing so throws "Error: Cannot find module 'first-mate'"
global.AtomTSBaseGrammar = require((<any> atom).config.resourcePath + "/node_modules/first-mate/lib/grammar.js");

export class TypeScriptSemanticGrammar extends AtomTSBaseGrammar {
    constructor(public registry) {
        super(registry,
            {
                name: "TypeScript",
                scopeName: "source.ts",
                patterns: {
                    // include: 'source.js' // Just makes us slower :P
                },
                fileTypes: ['ts']
            });
    }

    tokenizeLine(line, ruleStack: any[], firstLine = false) {
        var response = this.getAtomTokensForLine(line, ruleStack, firstLine);
        return response;
    }

    ///////////////////
    ////////////////////////////////// THE REMAINING CODE IS SPECIFIC TO US ////////////////////////////////////////
    ///////////////////

    classifier: ts.Classifier = ts.createClassifier({ log: () => undefined });

    getAtomTokensForLine(line: string, ruleStack: any[], firstLine: boolean): { tokens: any /* Atom's Token */[]; ruleStack: any[] } {

        // use finalLexState
        if (firstLine) {
            var finalLexState = ts.EndOfLineState.Start;
            ruleStack = [];
        }
        else {
            finalLexState = ruleStack[0];
        }

        var output = this.classifier.getClassificationsForLine(line, finalLexState, true);
        ruleStack = [output.finalLexState];

        var classificationResults = output.entries;

        // TypeScript classifier returns empty for "". But Atom wants to have some Token
        if (!classificationResults.length) return { tokens: [this.registry.createToken("", ["source.ts"])], ruleStack: ruleStack };

        var totalLength = 0;
        var tokens = classificationResults.map((info) => {
            var tokenStartPosition = totalLength;
            var str = line.substr(tokenStartPosition, info.length);
            totalLength = totalLength + info.length;

            var style = getAtomStyleForToken(info, str);

            var atomToken = this.registry.createToken(str, ["source.ts", style]);
            return atomToken;
        });

        return { tokens, ruleStack };
    }
}


/// NOTE: best way I have found for these is to just look at theme "less" files
function getAtomStyleForToken(token: ts.ClassificationInfo, str: string): string {
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
                    return 'support.function';
                case 'class':
                case 'module':
                case 'var':
                    return 'storage.modifier';
                case 'function':
                    return 'storage.type.function';
                case 'string':
                case 'number':
                case 'void':
                case 'boolean':
                    return 'keyword';
                default:
                    return 'keyword';
            }
        case TokenClass.Operator:
            return 'keyword.operator.js';
        case TokenClass.Comment:
            return 'comment';
        case TokenClass.Whitespace:
            return 'whitespace';
        case TokenClass.Identifier:
            if (!str.trim()) return ''; // Hacky fix for https://github.com/Microsoft/TypeScript/issues/1997
            return 'identifier';
        case TokenClass.NumberLiteral:
            return 'constant.numeric';
        case TokenClass.StringLiteral:
            return 'string';
        case TokenClass.RegExpLiteral:
            return 'constant.character';
        default:
            return null; // This should not happen
    }
}
