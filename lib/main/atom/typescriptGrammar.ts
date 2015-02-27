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
        
        // Note: the Atom Tokenizer supports multiple nesting of ruleStacks
        // The TypeScript tokenizer has a single final state it cares about
        // So we only need to pass it the final lex state
        var finalLexState = firstLine ? ts.EndOfLineState.Start
            : ruleStack.length ? ruleStack[0]
                : ts.EndOfLineState.Start;
        
        // If we are in some TS tokenizing process use TS tokenizer
        // Otherwise use the specific ones we match 
        // Otherwise fall back to TS tokenizer        
        if (finalLexState !== ts.EndOfLineState.Start) {
            return this.getAtomTokensForLine(line, finalLexState);
        }
        if (line.match(this.fullTripleSlashReferencePathRegEx)) {
            return this.getfullTripleSlashReferencePathTokensForLine(line);
        }
        else if (line.match(this.importRequireRegex)) {
            return this.getImportRequireTokensForLine(line);
        }
        else {
            return this.getAtomTokensForLine(line, finalLexState);
        }
    }

    ///////////////////
    ////////////////////////////////// THE REMAINING CODE IS SPECIFIC TO US ////////////////////////////////////////
    ///////////////////

    classifier: ts.Classifier = ts.createClassifier({ log: () => undefined });
    
    // Useful to tokenize these differently for autocomplete ease
    fullTripleSlashReferencePathRegEx = /^(\/\/\/\s*<reference\s+path\s*=\s*)('|")(.+?)\2.*?\/>/;
    // Note this will not match multiple imports on same line. So shame on you
    importRequireRegex = /^import\s*(\w*)\s*=\s*require\((?:'|")(\S*)(?:'|")\.*\)/;

    getfullTripleSlashReferencePathTokensForLine(line: string): { tokens: any /* Atom's Token */[]; ruleStack: any[] } {
        return this.getAtomTokensForLine(line, ts.EndOfLineState.Start);
        
        // TODO: split this up 
        return { tokens: [this.registry.createToken(line, ["source.ts", "keyword.using.reference"])], ruleStack: [] };
    }

    getImportRequireTokensForLine(line: string): { tokens: any /* Atom's Token */[]; ruleStack: any[] } {
        return this.getAtomTokensForLine(line, ts.EndOfLineState.Start);
        // TODO: 
        // We split it into:
        // import
        // alias
        // =
        // require
        // 
        return { tokens: [this.registry.createToken(line, ["source.ts", "keyword.using.import"])], ruleStack: [] };
    }

    getTsTokensForLine(line: string, finalLexState: ts.EndOfLineState): { tokens: { style: string; str: string }[]; ruleStack: any[] } {

        var output = this.classifier.getClassificationsForLine(line, finalLexState, true);
        var ruleStack = [output.finalLexState];

        var classificationResults = output.entries;
        // TypeScript classifier returns empty for "". But Atom wants to have some Token
        if (!classificationResults.length) return { tokens: [{ style: '', str: '' }], ruleStack: ruleStack };

        var totalLength = 0;
        var tokens = classificationResults.map((info) => {
            var tokenStartPosition = totalLength;
            var str = line.substr(tokenStartPosition, info.length);
            totalLength = totalLength + info.length;

            var style = getAtomStyleForToken(info, str);

            return { style: style, str: str };
        });

        return { tokens, ruleStack };
    }

    getAtomTokensForLine(line: string, finalLexState: ts.EndOfLineState): { tokens: any /* Atom's Token */[]; ruleStack: any[] } {

        var tsTokensWithRuleStack = this.getTsTokensForLine(line, finalLexState);

        var tokens = tsTokensWithRuleStack.tokens.map((info) => {
            var atomToken = this.registry.createToken(info.str, ["source.ts", info.style]);
            return atomToken;
        });

        return { tokens, ruleStack: tsTokensWithRuleStack.ruleStack };
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
