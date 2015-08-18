

// Help:
// https://github.com/atom/first-mate/
// https://github.com/fdecampredon/brackets-typescript/blob/master/src/main/mode.ts
// https://github.com/p-e-w/language-javascript-semantic/blob/master/lib/javascript-semantic-grammar.coffee
// TODO: update to latest : https://github.com/atom/atom/pull/6757

import utils = require('../lang/utils');
import TokenClass = ts.TokenClass;

declare class AtomTSBaseGrammar {
    constructor(registry, config)
}

interface AtomTSTokens { tokens: any /* Atom's Token */[]; ruleStack: any[] }
interface TSToken { style: string[]; str: string }
interface TSTokens { tokens: TSToken[]; ruleStack: any[] }

// This should be
//  {Grammar} = require "first-mate"
// but doing so throws "Error: Cannot find module 'first-mate'"
(<any>global).AtomTSBaseGrammar = require((<any> atom).config.resourcePath + "/node_modules/first-mate/lib/grammar.js");

export class TypeScriptSemanticGrammar extends AtomTSBaseGrammar {
    constructor(public registry) {
        super(registry,
            {
                name: "TypeScript",
                scopeName: "source.ts",
                patterns: {
                    // include: 'source.js' // Just makes us slower :P
                },
                fileTypes: ['ts','tst']
            });
    }

    /** only set to true if we have a trailingWhiteSpace for the currenlty analyzed line */
    trailingWhiteSpaceLength = 0;
    tokenizeLine(line: string, ruleStack: any[], firstLine = false): AtomTSTokens {

        // BOM handling:
        // NOTE THERE ARE OTHER BOMS. I just wanted a proof of concept.
        // Feel free to add here if you know of ones that are giving you pain.
        if (firstLine
            && line.length > 1
            && (line.charCodeAt(0) == 0xFFFE || line.charCodeAt(0) == 0xFEFF)) {
            this.trailingWhiteSpaceLength = 1;
        }
        else {
            this.trailingWhiteSpaceLength = 0;
        }



        // Note: the Atom Tokenizer supports multiple nesting of ruleStacks
        // The TypeScript tokenizer has a single final state it cares about
        // So we only need to pass it the final lex state
        var finalLexState = firstLine ? ts.EndOfLineState.None
            : ruleStack && ruleStack.length ? ruleStack[0]
                : ts.EndOfLineState.None;

        // If we are in some TS tokenizing process use TS tokenizer
        // Otherwise use the specific ones we match
        // Otherwise fall back to TS tokenizer
        if (finalLexState !== ts.EndOfLineState.None) {
            return this.getAtomTokensForLine(line, finalLexState);
        }
        if (line.match(this.fullTripleSlashReferencePathRegEx)) {
            return this.getFullTripleSlashReferencePathTokensForLine(line);
        }
        else if (line.match(this.fullTripleSlashAMDNameRegEx)) {
            return this.getFullTripleSlashAMDModuleNameTokensForLine(line);
        }
        else if (line.match(this.fullTripleSlashAMDDependencyPathRegEx)) {
            return this.getFullTripleSlashAMDDependencyPathTokensForLine(line);
        }
        else if (line.match(this.importRequireRegex)) {
            return this.getImportRequireTokensForLine(line);
        }
        else if (line.match(this.es6importRegex)) {
            return this.getEs6importTokensForLine(line);
        }
        else {
            return this.getAtomTokensForLine(line, finalLexState);
        }
    }

    ///////////////////
    ////////////////////////////////// THE REMAINING CODE IS SPECIFIC TO US ////////////////////////////////////////
    ///////////////////

    classifier: ts.Classifier = ts.createClassifier();

    // Useful to tokenize these differently for autocomplete ease
    fullTripleSlashReferencePathRegEx = /^(\/\/\/\s*<reference\s+path\s*=\s*)('|")(.+?)\2.*?\/>/;
    // AMD module name
    fullTripleSlashAMDNameRegEx = /^(\/\/\/\s*<amd-module\s+name\s*=\s*)('|")(.+?)\2.*?\/>/;
    // AMD dependency path
    fullTripleSlashAMDDependencyPathRegEx = /^(\/\/\/\s*<amd-dependency\s+path\s*=\s*)('|")(.+?)\2.*?\/>/;
    // Note this will not match multiple imports on same line. So shame on you
    importRequireRegex = /^import\s*(\w*)\s*=\s*require\((?:'|")(\S*)(?:'|")\.*\)/;
    // es6
    es6importRegex = /^import.*from.*/;
    // For todo support
    todoRegex = new RegExp('(BUG|TODO|FIXME|CHANGED|XXX|IDEA|HACK|NOTE)');

    getFullTripleSlashTokensForLine(line: string, matches: RegExpMatchArray, argumentType: string): AtomTSTokens {
        var tsTokensWithRuleStack = this.getTsTokensForLine(line);
        if (matches[3]) {
            var path = matches[3];
            if (line.indexOf('"' + path + '"') != -1) {
                path = '"' + path + '"';
            }
            else {
                path = "'" + path + "'";
            }
            var startPosition = line.indexOf(path);
            var endPosition = startPosition + path.length;
            var atomTokens = [];
            atomTokens.push(this.registry.createToken(line.substr(0, startPosition), ['source.ts', 'keyword']));
            atomTokens.push(this.registry.createToken(line.substr(startPosition, path.length), ['source.ts', argumentType]));
            atomTokens.push(this.registry.createToken(line.substr(endPosition, line.length - endPosition), ['source.ts', 'keyword']));
            return { tokens: atomTokens, ruleStack: [] };
        }
        else {
            return this.convertTsTokensToAtomTokens(tsTokensWithRuleStack);
        }
    }

    getFullTripleSlashReferencePathTokensForLine(line: string): AtomTSTokens {
        var tsTokensWithRuleStack = this.getTsTokensForLine(line);
        var matches = line.match(this.fullTripleSlashReferencePathRegEx);
        return this.getFullTripleSlashTokensForLine(line, matches, 'reference.path.string');
    }

    getFullTripleSlashAMDModuleNameTokensForLine(line: string): AtomTSTokens {
        var tsTokensWithRuleStack = this.getTsTokensForLine(line);
        var matches = line.match(this.fullTripleSlashAMDNameRegEx);
        return this.getFullTripleSlashTokensForLine(line, matches, 'module.name.string');
    }

    getFullTripleSlashAMDDependencyPathTokensForLine(line: string): AtomTSTokens {
        var tsTokensWithRuleStack = this.getTsTokensForLine(line);
        var matches = line.match(this.fullTripleSlashAMDDependencyPathRegEx);
        return this.getFullTripleSlashTokensForLine(line, matches, 'dependency.path.string');
    }

    getImportRequireTokensForLine(line: string): { tokens: any /* Atom's Token */[]; ruleStack: any[] } {
        var tsTokensWithRuleStack = this.getTsTokensForLine(line);

        // Based on ts tokenizer we should have a single "identifier" and a single "string"
        // Update these tokens to be more specific
        tsTokensWithRuleStack.tokens.forEach(t=> {
            if (t.style[0] == "identifier") {
                t.style = ["require.identifier"];
            }
            if (t.style[0] == "string") {
                t.style = ["require.path.string"];
            }
        });

        return this.convertTsTokensToAtomTokens(tsTokensWithRuleStack);
    }

    getEs6importTokensForLine(line: string): { tokens: any /* Atom's Token */[]; ruleStack: any[] } {
        var tsTokensWithRuleStack = this.getTsTokensForLine(line);

        // Based on ts tokenizer we should have a few "identifiers" and a single "string"
        // Update these tokens to be more specific
        tsTokensWithRuleStack.tokens.forEach(t=> {
            if (t.style[0] == "identifier") {
                t.style = ["es6import.identifier"];
            }
            if (t.style[0] == "string") {
                t.style = ["es6import.path.string"];
            }
        });

        return this.convertTsTokensToAtomTokens(tsTokensWithRuleStack);
    }

    getTsTokensForLine(line: string, finalLexState: ts.EndOfLineState = ts.EndOfLineState.None)
        : TSTokens {

        var output = this.classifier.getClassificationsForLine(line, finalLexState, true);
        var ruleStack = [output.finalLexState];

        var classificationResults = output.entries;
        // TypeScript classifier returns empty for "". But Atom wants to have some Token and it needs to be "whitespace" for autoindent to work
        if (!classificationResults.length) return { tokens: [{ style: ['whitespace'], str: '' }], ruleStack: ruleStack };

        // Start with trailing whitespace taken into account.
        // This is needed because classification for that is already done by ATOM internally (somehow)
        var totalLength = this.trailingWhiteSpaceLength;
        var tokens = utils.selectMany(classificationResults.map((info) => {
            var tokenStartPosition = totalLength;
            var str = line.substr(tokenStartPosition, info.length);
            totalLength = totalLength + info.length;

            var style = getAtomStyleForToken(info, str);

            if (style == 'comment.block') {
                let toret: TSToken[] = [];
                // TODO: add todo logic
                // TODO|FIXME|CHANGED|XXX|IDEA|HACK|NOTE|BUG
                // REF : https://github.com/atom/language-todo/blob/master/grammars/todo.cson
                let match;
                while (match = this.todoRegex.exec(str)) {
                    var start = match.index;
                    var length = match[1].length;
                    var before = str.substr(0, start);
                    var actual = match[1];

                    toret.push({ style: ['comment.block'], str: before });
                    toret.push({ style: ['comment.block', 'storage.type.class'], str: actual });
                    
                    // continue with rest 
                    str = str.substr(start + length);
                }
                toret.push({ style: ['comment.block'], str: str });
                return toret;
            }

            return [{ style: [style], str: str }];
        }));

        return { tokens, ruleStack };
    }

    getAtomTokensForLine(line: string, finalLexState: ts.EndOfLineState): AtomTSTokens {
        var tsTokensWithRuleStack = this.getTsTokensForLine(line, finalLexState);
        return this.convertTsTokensToAtomTokens(tsTokensWithRuleStack);
    }

    convertTsTokensToAtomTokens(tsTokensWithRuleStack: TSTokens): AtomTSTokens {
        var tokens = tsTokensWithRuleStack.tokens.map((info) => {
            var atomToken = this.registry.createToken(info.str, ["source.ts"].concat(info.style));
            return atomToken;
        });

        return { tokens, ruleStack: tsTokensWithRuleStack.ruleStack };
    }
}


/// NOTE: best way I have found for these is to just look at theme "less" files
// Alternatively just inspect the token for a .js file
function getAtomStyleForToken(token: ts.ClassificationInfo, str: string): string {
    switch (token.classification) {
        case TokenClass.Punctuation:
            switch (str) {
                case '{':
                    return "punctuation.section.scope.begin.ts";
                case '}':
                    return "punctuation.section.scope.end.ts";
                case ')':
                    return "meta.brace.round.ts";
                case '(':
                    return "meta.brace.round.ts";
                case ';':
                    return "punctuation.terminator.statement.ts";
                default:
                    return "punctuation";
            }
        case TokenClass.Keyword:
            switch (str) {
                case 'static':
                case 'public':
                case 'private':
                case 'protected':
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
            return 'comment.block';
        case TokenClass.Whitespace:
            return 'whitespace';
        case TokenClass.Identifier:
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
