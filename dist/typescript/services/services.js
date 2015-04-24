/// <reference path="..\compiler\program.ts"/>
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/// <reference path='breakpoints.ts' />
/// <reference path='outliningElementsCollector.ts' />
/// <reference path='navigateTo.ts' />
/// <reference path='navigationBar.ts' />
/// <reference path='patternMatcher.ts' />
/// <reference path='signatureHelp.ts' />
/// <reference path='utilities.ts' />
/// <reference path='formatting\formatting.ts' />
/// <reference path='formatting\smartIndenter.ts' />
var ts;
(function (ts) {
    ts.servicesVersion = "0.4";
    var ScriptSnapshot;
    (function (ScriptSnapshot) {
        var StringScriptSnapshot = (function () {
            function StringScriptSnapshot(text) {
                this.text = text;
                this._lineStartPositions = undefined;
            }
            StringScriptSnapshot.prototype.getText = function (start, end) {
                return this.text.substring(start, end);
            };
            StringScriptSnapshot.prototype.getLength = function () {
                return this.text.length;
            };
            StringScriptSnapshot.prototype.getChangeRange = function (oldSnapshot) {
                return undefined;
            };
            return StringScriptSnapshot;
        })();
        function fromString(text) {
            return new StringScriptSnapshot(text);
        }
        ScriptSnapshot.fromString = fromString;
    })(ScriptSnapshot = ts.ScriptSnapshot || (ts.ScriptSnapshot = {}));
    var scanner = ts.createScanner(2, true);
    var emptyArray = [];
    function createNode(kind, pos, end, flags, parent) {
        var node = new (ts.getNodeConstructor(kind))();
        node.pos = pos;
        node.end = end;
        node.flags = flags;
        node.parent = parent;
        return node;
    }
    var NodeObject = (function () {
        function NodeObject() {
        }
        NodeObject.prototype.getSourceFile = function () {
            return ts.getSourceFileOfNode(this);
        };
        NodeObject.prototype.getStart = function (sourceFile) {
            return ts.getTokenPosOfNode(this, sourceFile);
        };
        NodeObject.prototype.getFullStart = function () {
            return this.pos;
        };
        NodeObject.prototype.getEnd = function () {
            return this.end;
        };
        NodeObject.prototype.getWidth = function (sourceFile) {
            return this.getEnd() - this.getStart(sourceFile);
        };
        NodeObject.prototype.getFullWidth = function () {
            return this.end - this.getFullStart();
        };
        NodeObject.prototype.getLeadingTriviaWidth = function (sourceFile) {
            return this.getStart(sourceFile) - this.pos;
        };
        NodeObject.prototype.getFullText = function (sourceFile) {
            return (sourceFile || this.getSourceFile()).text.substring(this.pos, this.end);
        };
        NodeObject.prototype.getText = function (sourceFile) {
            return (sourceFile || this.getSourceFile()).text.substring(this.getStart(), this.getEnd());
        };
        NodeObject.prototype.addSyntheticNodes = function (nodes, pos, end) {
            scanner.setTextPos(pos);
            while (pos < end) {
                var token = scanner.scan();
                var textPos = scanner.getTextPos();
                nodes.push(createNode(token, pos, textPos, 1024, this));
                pos = textPos;
            }
            return pos;
        };
        NodeObject.prototype.createSyntaxList = function (nodes) {
            var list = createNode(228, nodes.pos, nodes.end, 1024, this);
            list._children = [];
            var pos = nodes.pos;
            for (var _i = 0; _i < nodes.length; _i++) {
                var node = nodes[_i];
                if (pos < node.pos) {
                    pos = this.addSyntheticNodes(list._children, pos, node.pos);
                }
                list._children.push(node);
                pos = node.end;
            }
            if (pos < nodes.end) {
                this.addSyntheticNodes(list._children, pos, nodes.end);
            }
            return list;
        };
        NodeObject.prototype.createChildren = function (sourceFile) {
            var _this = this;
            var children;
            if (this.kind >= 126) {
                scanner.setText((sourceFile || this.getSourceFile()).text);
                children = [];
                var pos = this.pos;
                var processNode = function (node) {
                    if (pos < node.pos) {
                        pos = _this.addSyntheticNodes(children, pos, node.pos);
                    }
                    children.push(node);
                    pos = node.end;
                };
                var processNodes = function (nodes) {
                    if (pos < nodes.pos) {
                        pos = _this.addSyntheticNodes(children, pos, nodes.pos);
                    }
                    children.push(_this.createSyntaxList(nodes));
                    pos = nodes.end;
                };
                ts.forEachChild(this, processNode, processNodes);
                if (pos < this.end) {
                    this.addSyntheticNodes(children, pos, this.end);
                }
                scanner.setText(undefined);
            }
            this._children = children || emptyArray;
        };
        NodeObject.prototype.getChildCount = function (sourceFile) {
            if (!this._children)
                this.createChildren(sourceFile);
            return this._children.length;
        };
        NodeObject.prototype.getChildAt = function (index, sourceFile) {
            if (!this._children)
                this.createChildren(sourceFile);
            return this._children[index];
        };
        NodeObject.prototype.getChildren = function (sourceFile) {
            if (!this._children)
                this.createChildren(sourceFile);
            return this._children;
        };
        NodeObject.prototype.getFirstToken = function (sourceFile) {
            var children = this.getChildren();
            for (var _i = 0; _i < children.length; _i++) {
                var child = children[_i];
                if (child.kind < 126) {
                    return child;
                }
                return child.getFirstToken(sourceFile);
            }
        };
        NodeObject.prototype.getLastToken = function (sourceFile) {
            var children = this.getChildren(sourceFile);
            for (var i = children.length - 1; i >= 0; i--) {
                var child = children[i];
                if (child.kind < 126) {
                    return child;
                }
                return child.getLastToken(sourceFile);
            }
        };
        return NodeObject;
    })();
    var SymbolObject = (function () {
        function SymbolObject(flags, name) {
            this.flags = flags;
            this.name = name;
        }
        SymbolObject.prototype.getFlags = function () {
            return this.flags;
        };
        SymbolObject.prototype.getName = function () {
            return this.name;
        };
        SymbolObject.prototype.getDeclarations = function () {
            return this.declarations;
        };
        SymbolObject.prototype.getDocumentationComment = function () {
            if (this.documentationComment === undefined) {
                this.documentationComment = getJsDocCommentsFromDeclarations(this.declarations, this.name, !(this.flags & 4));
            }
            return this.documentationComment;
        };
        return SymbolObject;
    })();
    function getJsDocCommentsFromDeclarations(declarations, name, canUseParsedParamTagComments) {
        var documentationComment = [];
        var docComments = getJsDocCommentsSeparatedByNewLines();
        ts.forEach(docComments, function (docComment) {
            if (documentationComment.length) {
                documentationComment.push(ts.lineBreakPart());
            }
            documentationComment.push(docComment);
        });
        return documentationComment;
        function getJsDocCommentsSeparatedByNewLines() {
            var paramTag = "@param";
            var jsDocCommentParts = [];
            ts.forEach(declarations, function (declaration, indexOfDeclaration) {
                if (ts.indexOf(declarations, declaration) === indexOfDeclaration) {
                    var sourceFileOfDeclaration = ts.getSourceFileOfNode(declaration);
                    if (canUseParsedParamTagComments && declaration.kind === 129) {
                        ts.forEach(getJsDocCommentTextRange(declaration.parent, sourceFileOfDeclaration), function (jsDocCommentTextRange) {
                            var cleanedParamJsDocComment = getCleanedParamJsDocComment(jsDocCommentTextRange.pos, jsDocCommentTextRange.end, sourceFileOfDeclaration);
                            if (cleanedParamJsDocComment) {
                                jsDocCommentParts.push.apply(jsDocCommentParts, cleanedParamJsDocComment);
                            }
                        });
                    }
                    if (declaration.kind === 205 && declaration.body.kind === 205) {
                        return;
                    }
                    while (declaration.kind === 205 && declaration.parent.kind === 205) {
                        declaration = declaration.parent;
                    }
                    ts.forEach(getJsDocCommentTextRange(declaration.kind === 198 ? declaration.parent.parent : declaration, sourceFileOfDeclaration), function (jsDocCommentTextRange) {
                        var cleanedJsDocComment = getCleanedJsDocComment(jsDocCommentTextRange.pos, jsDocCommentTextRange.end, sourceFileOfDeclaration);
                        if (cleanedJsDocComment) {
                            jsDocCommentParts.push.apply(jsDocCommentParts, cleanedJsDocComment);
                        }
                    });
                }
            });
            return jsDocCommentParts;
            function getJsDocCommentTextRange(node, sourceFile) {
                return ts.map(ts.getJsDocComments(node, sourceFile), function (jsDocComment) {
                    return {
                        pos: jsDocComment.pos + "/*".length,
                        end: jsDocComment.end - "*/".length
                    };
                });
            }
            function consumeWhiteSpacesOnTheLine(pos, end, sourceFile, maxSpacesToRemove) {
                if (maxSpacesToRemove !== undefined) {
                    end = Math.min(end, pos + maxSpacesToRemove);
                }
                for (; pos < end; pos++) {
                    var ch = sourceFile.text.charCodeAt(pos);
                    if (!ts.isWhiteSpace(ch) || ts.isLineBreak(ch)) {
                        return pos;
                    }
                }
                return end;
            }
            function consumeLineBreaks(pos, end, sourceFile) {
                while (pos < end && ts.isLineBreak(sourceFile.text.charCodeAt(pos))) {
                    pos++;
                }
                return pos;
            }
            function isName(pos, end, sourceFile, name) {
                return pos + name.length < end &&
                    sourceFile.text.substr(pos, name.length) === name &&
                    (ts.isWhiteSpace(sourceFile.text.charCodeAt(pos + name.length)) ||
                        ts.isLineBreak(sourceFile.text.charCodeAt(pos + name.length)));
            }
            function isParamTag(pos, end, sourceFile) {
                return isName(pos, end, sourceFile, paramTag);
            }
            function pushDocCommentLineText(docComments, text, blankLineCount) {
                while (blankLineCount--) {
                    docComments.push(ts.textPart(""));
                }
                docComments.push(ts.textPart(text));
            }
            function getCleanedJsDocComment(pos, end, sourceFile) {
                var spacesToRemoveAfterAsterisk;
                var docComments = [];
                var blankLineCount = 0;
                var isInParamTag = false;
                while (pos < end) {
                    var docCommentTextOfLine = "";
                    pos = consumeWhiteSpacesOnTheLine(pos, end, sourceFile);
                    if (pos < end && sourceFile.text.charCodeAt(pos) === 42) {
                        var lineStartPos = pos + 1;
                        pos = consumeWhiteSpacesOnTheLine(pos + 1, end, sourceFile, spacesToRemoveAfterAsterisk);
                        if (spacesToRemoveAfterAsterisk === undefined && pos < end && !ts.isLineBreak(sourceFile.text.charCodeAt(pos))) {
                            spacesToRemoveAfterAsterisk = pos - lineStartPos;
                        }
                    }
                    else if (spacesToRemoveAfterAsterisk === undefined) {
                        spacesToRemoveAfterAsterisk = 0;
                    }
                    while (pos < end && !ts.isLineBreak(sourceFile.text.charCodeAt(pos))) {
                        var ch = sourceFile.text.charAt(pos);
                        if (ch === "@") {
                            if (isParamTag(pos, end, sourceFile)) {
                                isInParamTag = true;
                                pos += paramTag.length;
                                continue;
                            }
                            else {
                                isInParamTag = false;
                            }
                        }
                        if (!isInParamTag) {
                            docCommentTextOfLine += ch;
                        }
                        pos++;
                    }
                    pos = consumeLineBreaks(pos, end, sourceFile);
                    if (docCommentTextOfLine) {
                        pushDocCommentLineText(docComments, docCommentTextOfLine, blankLineCount);
                        blankLineCount = 0;
                    }
                    else if (!isInParamTag && docComments.length) {
                        blankLineCount++;
                    }
                }
                return docComments;
            }
            function getCleanedParamJsDocComment(pos, end, sourceFile) {
                var paramHelpStringMargin;
                var paramDocComments = [];
                while (pos < end) {
                    if (isParamTag(pos, end, sourceFile)) {
                        var blankLineCount = 0;
                        var recordedParamTag = false;
                        pos = consumeWhiteSpaces(pos + paramTag.length);
                        if (pos >= end) {
                            break;
                        }
                        if (sourceFile.text.charCodeAt(pos) === 123) {
                            pos++;
                            for (var curlies = 1; pos < end; pos++) {
                                var charCode = sourceFile.text.charCodeAt(pos);
                                if (charCode === 123) {
                                    curlies++;
                                    continue;
                                }
                                if (charCode === 125) {
                                    curlies--;
                                    if (curlies === 0) {
                                        pos++;
                                        break;
                                    }
                                    else {
                                        continue;
                                    }
                                }
                                if (charCode === 64) {
                                    break;
                                }
                            }
                            pos = consumeWhiteSpaces(pos);
                            if (pos >= end) {
                                break;
                            }
                        }
                        if (isName(pos, end, sourceFile, name)) {
                            pos = consumeWhiteSpaces(pos + name.length);
                            if (pos >= end) {
                                break;
                            }
                            var paramHelpString = "";
                            var firstLineParamHelpStringPos = pos;
                            while (pos < end) {
                                var ch = sourceFile.text.charCodeAt(pos);
                                if (ts.isLineBreak(ch)) {
                                    if (paramHelpString) {
                                        pushDocCommentLineText(paramDocComments, paramHelpString, blankLineCount);
                                        paramHelpString = "";
                                        blankLineCount = 0;
                                        recordedParamTag = true;
                                    }
                                    else if (recordedParamTag) {
                                        blankLineCount++;
                                    }
                                    setPosForParamHelpStringOnNextLine(firstLineParamHelpStringPos);
                                    continue;
                                }
                                if (ch === 64) {
                                    break;
                                }
                                paramHelpString += sourceFile.text.charAt(pos);
                                pos++;
                            }
                            if (paramHelpString) {
                                pushDocCommentLineText(paramDocComments, paramHelpString, blankLineCount);
                            }
                            paramHelpStringMargin = undefined;
                        }
                        if (sourceFile.text.charCodeAt(pos) === 64) {
                            continue;
                        }
                    }
                    pos++;
                }
                return paramDocComments;
                function consumeWhiteSpaces(pos) {
                    while (pos < end && ts.isWhiteSpace(sourceFile.text.charCodeAt(pos))) {
                        pos++;
                    }
                    return pos;
                }
                function setPosForParamHelpStringOnNextLine(firstLineParamHelpStringPos) {
                    pos = consumeLineBreaks(pos, end, sourceFile);
                    if (pos >= end) {
                        return;
                    }
                    if (paramHelpStringMargin === undefined) {
                        paramHelpStringMargin = sourceFile.getLineAndCharacterOfPosition(firstLineParamHelpStringPos).character;
                    }
                    var startOfLinePos = pos;
                    pos = consumeWhiteSpacesOnTheLine(pos, end, sourceFile, paramHelpStringMargin);
                    if (pos >= end) {
                        return;
                    }
                    var consumedSpaces = pos - startOfLinePos;
                    if (consumedSpaces < paramHelpStringMargin) {
                        var ch = sourceFile.text.charCodeAt(pos);
                        if (ch === 42) {
                            pos = consumeWhiteSpacesOnTheLine(pos + 1, end, sourceFile, paramHelpStringMargin - consumedSpaces - 1);
                        }
                    }
                }
            }
        }
    }
    var TypeObject = (function () {
        function TypeObject(checker, flags) {
            this.checker = checker;
            this.flags = flags;
        }
        TypeObject.prototype.getFlags = function () {
            return this.flags;
        };
        TypeObject.prototype.getSymbol = function () {
            return this.symbol;
        };
        TypeObject.prototype.getProperties = function () {
            return this.checker.getPropertiesOfType(this);
        };
        TypeObject.prototype.getProperty = function (propertyName) {
            return this.checker.getPropertyOfType(this, propertyName);
        };
        TypeObject.prototype.getApparentProperties = function () {
            return this.checker.getAugmentedPropertiesOfType(this);
        };
        TypeObject.prototype.getCallSignatures = function () {
            return this.checker.getSignaturesOfType(this, 0);
        };
        TypeObject.prototype.getConstructSignatures = function () {
            return this.checker.getSignaturesOfType(this, 1);
        };
        TypeObject.prototype.getStringIndexType = function () {
            return this.checker.getIndexTypeOfType(this, 0);
        };
        TypeObject.prototype.getNumberIndexType = function () {
            return this.checker.getIndexTypeOfType(this, 1);
        };
        return TypeObject;
    })();
    var SignatureObject = (function () {
        function SignatureObject(checker) {
            this.checker = checker;
        }
        SignatureObject.prototype.getDeclaration = function () {
            return this.declaration;
        };
        SignatureObject.prototype.getTypeParameters = function () {
            return this.typeParameters;
        };
        SignatureObject.prototype.getParameters = function () {
            return this.parameters;
        };
        SignatureObject.prototype.getReturnType = function () {
            return this.checker.getReturnTypeOfSignature(this);
        };
        SignatureObject.prototype.getDocumentationComment = function () {
            if (this.documentationComment === undefined) {
                this.documentationComment = this.declaration ? getJsDocCommentsFromDeclarations([this.declaration], undefined, false) : [];
            }
            return this.documentationComment;
        };
        return SignatureObject;
    })();
    var SourceFileObject = (function (_super) {
        __extends(SourceFileObject, _super);
        function SourceFileObject() {
            _super.apply(this, arguments);
        }
        SourceFileObject.prototype.update = function (newText, textChangeRange) {
            return ts.updateSourceFile(this, newText, textChangeRange);
        };
        SourceFileObject.prototype.getLineAndCharacterOfPosition = function (position) {
            return ts.getLineAndCharacterOfPosition(this, position);
        };
        SourceFileObject.prototype.getLineStarts = function () {
            return ts.getLineStarts(this);
        };
        SourceFileObject.prototype.getPositionOfLineAndCharacter = function (line, character) {
            return ts.getPositionOfLineAndCharacter(this, line, character);
        };
        SourceFileObject.prototype.getNamedDeclarations = function () {
            if (!this.namedDeclarations) {
                this.namedDeclarations = this.computeNamedDeclarations();
            }
            return this.namedDeclarations;
        };
        SourceFileObject.prototype.computeNamedDeclarations = function () {
            var result = {};
            ts.forEachChild(this, visit);
            return result;
            function addDeclaration(declaration) {
                var name = getDeclarationName(declaration);
                if (name) {
                    var declarations = getDeclarations(name);
                    declarations.push(declaration);
                }
            }
            function getDeclarations(name) {
                return ts.getProperty(result, name) || (result[name] = []);
            }
            function getDeclarationName(declaration) {
                if (declaration.name) {
                    var result_1 = getTextOfIdentifierOrLiteral(declaration.name);
                    if (result_1 !== undefined) {
                        return result_1;
                    }
                    if (declaration.name.kind === 127) {
                        var expr = declaration.name.expression;
                        if (expr.kind === 155) {
                            return expr.name.text;
                        }
                        return getTextOfIdentifierOrLiteral(expr);
                    }
                }
                return undefined;
            }
            function getTextOfIdentifierOrLiteral(node) {
                if (node) {
                    if (node.kind === 65 ||
                        node.kind === 8 ||
                        node.kind === 7) {
                        return node.text;
                    }
                }
                return undefined;
            }
            function visit(node) {
                switch (node.kind) {
                    case 200:
                    case 134:
                    case 133:
                        var functionDeclaration = node;
                        var declarationName = getDeclarationName(functionDeclaration);
                        if (declarationName) {
                            var declarations = getDeclarations(declarationName);
                            var lastDeclaration = ts.lastOrUndefined(declarations);
                            if (lastDeclaration && functionDeclaration.parent === lastDeclaration.parent && functionDeclaration.symbol === lastDeclaration.symbol) {
                                if (functionDeclaration.body && !lastDeclaration.body) {
                                    declarations[declarations.length - 1] = functionDeclaration;
                                }
                            }
                            else {
                                declarations.push(functionDeclaration);
                            }
                            ts.forEachChild(node, visit);
                        }
                        break;
                    case 201:
                    case 202:
                    case 203:
                    case 204:
                    case 205:
                    case 208:
                    case 217:
                    case 213:
                    case 208:
                    case 210:
                    case 211:
                    case 136:
                    case 137:
                    case 145:
                        addDeclaration(node);
                    case 135:
                    case 180:
                    case 199:
                    case 150:
                    case 151:
                    case 206:
                        ts.forEachChild(node, visit);
                        break;
                    case 179:
                        if (ts.isFunctionBlock(node)) {
                            ts.forEachChild(node, visit);
                        }
                        break;
                    case 129:
                        if (!(node.flags & 112)) {
                            break;
                        }
                    case 198:
                    case 152:
                        if (ts.isBindingPattern(node.name)) {
                            ts.forEachChild(node.name, visit);
                            break;
                        }
                    case 226:
                    case 132:
                    case 131:
                        addDeclaration(node);
                        break;
                    case 215:
                        if (node.exportClause) {
                            ts.forEach(node.exportClause.elements, visit);
                        }
                        break;
                    case 209:
                        var importClause = node.importClause;
                        if (importClause) {
                            if (importClause.name) {
                                addDeclaration(importClause);
                            }
                            if (importClause.namedBindings) {
                                if (importClause.namedBindings.kind === 211) {
                                    addDeclaration(importClause.namedBindings);
                                }
                                else {
                                    ts.forEach(importClause.namedBindings.elements, visit);
                                }
                            }
                        }
                        break;
                }
            }
        };
        return SourceFileObject;
    })(NodeObject);
    var TextChange = (function () {
        function TextChange() {
        }
        return TextChange;
    })();
    ts.TextChange = TextChange;
    var HighlightSpanKind;
    (function (HighlightSpanKind) {
        HighlightSpanKind.none = "none";
        HighlightSpanKind.definition = "definition";
        HighlightSpanKind.reference = "reference";
        HighlightSpanKind.writtenReference = "writtenReference";
    })(HighlightSpanKind = ts.HighlightSpanKind || (ts.HighlightSpanKind = {}));
    (function (SymbolDisplayPartKind) {
        SymbolDisplayPartKind[SymbolDisplayPartKind["aliasName"] = 0] = "aliasName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["className"] = 1] = "className";
        SymbolDisplayPartKind[SymbolDisplayPartKind["enumName"] = 2] = "enumName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["fieldName"] = 3] = "fieldName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["interfaceName"] = 4] = "interfaceName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["keyword"] = 5] = "keyword";
        SymbolDisplayPartKind[SymbolDisplayPartKind["lineBreak"] = 6] = "lineBreak";
        SymbolDisplayPartKind[SymbolDisplayPartKind["numericLiteral"] = 7] = "numericLiteral";
        SymbolDisplayPartKind[SymbolDisplayPartKind["stringLiteral"] = 8] = "stringLiteral";
        SymbolDisplayPartKind[SymbolDisplayPartKind["localName"] = 9] = "localName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["methodName"] = 10] = "methodName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["moduleName"] = 11] = "moduleName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["operator"] = 12] = "operator";
        SymbolDisplayPartKind[SymbolDisplayPartKind["parameterName"] = 13] = "parameterName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["propertyName"] = 14] = "propertyName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["punctuation"] = 15] = "punctuation";
        SymbolDisplayPartKind[SymbolDisplayPartKind["space"] = 16] = "space";
        SymbolDisplayPartKind[SymbolDisplayPartKind["text"] = 17] = "text";
        SymbolDisplayPartKind[SymbolDisplayPartKind["typeParameterName"] = 18] = "typeParameterName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["enumMemberName"] = 19] = "enumMemberName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["functionName"] = 20] = "functionName";
        SymbolDisplayPartKind[SymbolDisplayPartKind["regularExpressionLiteral"] = 21] = "regularExpressionLiteral";
    })(ts.SymbolDisplayPartKind || (ts.SymbolDisplayPartKind = {}));
    var SymbolDisplayPartKind = ts.SymbolDisplayPartKind;
    (function (OutputFileType) {
        OutputFileType[OutputFileType["JavaScript"] = 0] = "JavaScript";
        OutputFileType[OutputFileType["SourceMap"] = 1] = "SourceMap";
        OutputFileType[OutputFileType["Declaration"] = 2] = "Declaration";
    })(ts.OutputFileType || (ts.OutputFileType = {}));
    var OutputFileType = ts.OutputFileType;
    (function (EndOfLineState) {
        EndOfLineState[EndOfLineState["Start"] = 0] = "Start";
        EndOfLineState[EndOfLineState["InMultiLineCommentTrivia"] = 1] = "InMultiLineCommentTrivia";
        EndOfLineState[EndOfLineState["InSingleQuoteStringLiteral"] = 2] = "InSingleQuoteStringLiteral";
        EndOfLineState[EndOfLineState["InDoubleQuoteStringLiteral"] = 3] = "InDoubleQuoteStringLiteral";
        EndOfLineState[EndOfLineState["InTemplateHeadOrNoSubstitutionTemplate"] = 4] = "InTemplateHeadOrNoSubstitutionTemplate";
        EndOfLineState[EndOfLineState["InTemplateMiddleOrTail"] = 5] = "InTemplateMiddleOrTail";
        EndOfLineState[EndOfLineState["InTemplateSubstitutionPosition"] = 6] = "InTemplateSubstitutionPosition";
    })(ts.EndOfLineState || (ts.EndOfLineState = {}));
    var EndOfLineState = ts.EndOfLineState;
    (function (TokenClass) {
        TokenClass[TokenClass["Punctuation"] = 0] = "Punctuation";
        TokenClass[TokenClass["Keyword"] = 1] = "Keyword";
        TokenClass[TokenClass["Operator"] = 2] = "Operator";
        TokenClass[TokenClass["Comment"] = 3] = "Comment";
        TokenClass[TokenClass["Whitespace"] = 4] = "Whitespace";
        TokenClass[TokenClass["Identifier"] = 5] = "Identifier";
        TokenClass[TokenClass["NumberLiteral"] = 6] = "NumberLiteral";
        TokenClass[TokenClass["StringLiteral"] = 7] = "StringLiteral";
        TokenClass[TokenClass["RegExpLiteral"] = 8] = "RegExpLiteral";
    })(ts.TokenClass || (ts.TokenClass = {}));
    var TokenClass = ts.TokenClass;
    var ScriptElementKind;
    (function (ScriptElementKind) {
        ScriptElementKind.unknown = "";
        ScriptElementKind.warning = "warning";
        ScriptElementKind.keyword = "keyword";
        ScriptElementKind.scriptElement = "script";
        ScriptElementKind.moduleElement = "module";
        ScriptElementKind.classElement = "class";
        ScriptElementKind.interfaceElement = "interface";
        ScriptElementKind.typeElement = "type";
        ScriptElementKind.enumElement = "enum";
        ScriptElementKind.variableElement = "var";
        ScriptElementKind.localVariableElement = "local var";
        ScriptElementKind.functionElement = "function";
        ScriptElementKind.localFunctionElement = "local function";
        ScriptElementKind.memberFunctionElement = "method";
        ScriptElementKind.memberGetAccessorElement = "getter";
        ScriptElementKind.memberSetAccessorElement = "setter";
        ScriptElementKind.memberVariableElement = "property";
        ScriptElementKind.constructorImplementationElement = "constructor";
        ScriptElementKind.callSignatureElement = "call";
        ScriptElementKind.indexSignatureElement = "index";
        ScriptElementKind.constructSignatureElement = "construct";
        ScriptElementKind.parameterElement = "parameter";
        ScriptElementKind.typeParameterElement = "type parameter";
        ScriptElementKind.primitiveType = "primitive type";
        ScriptElementKind.label = "label";
        ScriptElementKind.alias = "alias";
        ScriptElementKind.constElement = "const";
        ScriptElementKind.letElement = "let";
    })(ScriptElementKind = ts.ScriptElementKind || (ts.ScriptElementKind = {}));
    var ScriptElementKindModifier;
    (function (ScriptElementKindModifier) {
        ScriptElementKindModifier.none = "";
        ScriptElementKindModifier.publicMemberModifier = "public";
        ScriptElementKindModifier.privateMemberModifier = "private";
        ScriptElementKindModifier.protectedMemberModifier = "protected";
        ScriptElementKindModifier.exportedModifier = "export";
        ScriptElementKindModifier.ambientModifier = "declare";
        ScriptElementKindModifier.staticModifier = "static";
    })(ScriptElementKindModifier = ts.ScriptElementKindModifier || (ts.ScriptElementKindModifier = {}));
    var ClassificationTypeNames = (function () {
        function ClassificationTypeNames() {
        }
        ClassificationTypeNames.comment = "comment";
        ClassificationTypeNames.identifier = "identifier";
        ClassificationTypeNames.keyword = "keyword";
        ClassificationTypeNames.numericLiteral = "number";
        ClassificationTypeNames.operator = "operator";
        ClassificationTypeNames.stringLiteral = "string";
        ClassificationTypeNames.whiteSpace = "whitespace";
        ClassificationTypeNames.text = "text";
        ClassificationTypeNames.punctuation = "punctuation";
        ClassificationTypeNames.className = "class name";
        ClassificationTypeNames.enumName = "enum name";
        ClassificationTypeNames.interfaceName = "interface name";
        ClassificationTypeNames.moduleName = "module name";
        ClassificationTypeNames.typeParameterName = "type parameter name";
        ClassificationTypeNames.typeAlias = "type alias name";
        return ClassificationTypeNames;
    })();
    ts.ClassificationTypeNames = ClassificationTypeNames;
    function displayPartsToString(displayParts) {
        if (displayParts) {
            return ts.map(displayParts, function (displayPart) { return displayPart.text; }).join("");
        }
        return "";
    }
    ts.displayPartsToString = displayPartsToString;
    function isLocalVariableOrFunction(symbol) {
        if (symbol.parent) {
            return false;
        }
        return ts.forEach(symbol.declarations, function (declaration) {
            if (declaration.kind === 162) {
                return true;
            }
            if (declaration.kind !== 198 && declaration.kind !== 200) {
                return false;
            }
            for (var parent_1 = declaration.parent; !ts.isFunctionBlock(parent_1); parent_1 = parent_1.parent) {
                if (parent_1.kind === 227 || parent_1.kind === 206) {
                    return false;
                }
            }
            return true;
        });
    }
    function getDefaultCompilerOptions() {
        return {
            target: 1,
            module: 0,
        };
    }
    ts.getDefaultCompilerOptions = getDefaultCompilerOptions;
    var OperationCanceledException = (function () {
        function OperationCanceledException() {
        }
        return OperationCanceledException;
    })();
    ts.OperationCanceledException = OperationCanceledException;
    var CancellationTokenObject = (function () {
        function CancellationTokenObject(cancellationToken) {
            this.cancellationToken = cancellationToken;
        }
        CancellationTokenObject.prototype.isCancellationRequested = function () {
            return this.cancellationToken && this.cancellationToken.isCancellationRequested();
        };
        CancellationTokenObject.prototype.throwIfCancellationRequested = function () {
            if (this.isCancellationRequested()) {
                throw new OperationCanceledException();
            }
        };
        CancellationTokenObject.None = new CancellationTokenObject(null);
        return CancellationTokenObject;
    })();
    ts.CancellationTokenObject = CancellationTokenObject;
    var HostCache = (function () {
        function HostCache(host) {
            this.host = host;
            this.fileNameToEntry = {};
            var rootFileNames = host.getScriptFileNames();
            for (var _i = 0; _i < rootFileNames.length; _i++) {
                var fileName = rootFileNames[_i];
                this.createEntry(fileName);
            }
            this._compilationSettings = host.getCompilationSettings() || getDefaultCompilerOptions();
        }
        HostCache.prototype.compilationSettings = function () {
            return this._compilationSettings;
        };
        HostCache.prototype.createEntry = function (fileName) {
            var entry;
            var scriptSnapshot = this.host.getScriptSnapshot(fileName);
            if (scriptSnapshot) {
                entry = {
                    hostFileName: fileName,
                    version: this.host.getScriptVersion(fileName),
                    scriptSnapshot: scriptSnapshot
                };
            }
            return this.fileNameToEntry[ts.normalizeSlashes(fileName)] = entry;
        };
        HostCache.prototype.getEntry = function (fileName) {
            return ts.lookUp(this.fileNameToEntry, ts.normalizeSlashes(fileName));
        };
        HostCache.prototype.contains = function (fileName) {
            return ts.hasProperty(this.fileNameToEntry, ts.normalizeSlashes(fileName));
        };
        HostCache.prototype.getOrCreateEntry = function (fileName) {
            if (this.contains(fileName)) {
                return this.getEntry(fileName);
            }
            return this.createEntry(fileName);
        };
        HostCache.prototype.getRootFileNames = function () {
            var _this = this;
            var fileNames = [];
            ts.forEachKey(this.fileNameToEntry, function (key) {
                if (ts.hasProperty(_this.fileNameToEntry, key) && _this.fileNameToEntry[key])
                    fileNames.push(key);
            });
            return fileNames;
        };
        HostCache.prototype.getVersion = function (fileName) {
            var file = this.getEntry(fileName);
            return file && file.version;
        };
        HostCache.prototype.getScriptSnapshot = function (fileName) {
            var file = this.getEntry(fileName);
            return file && file.scriptSnapshot;
        };
        return HostCache;
    })();
    var SyntaxTreeCache = (function () {
        function SyntaxTreeCache(host) {
            this.host = host;
        }
        SyntaxTreeCache.prototype.getCurrentSourceFile = function (fileName) {
            var scriptSnapshot = this.host.getScriptSnapshot(fileName);
            if (!scriptSnapshot) {
                throw new Error("Could not find file: '" + fileName + "'.");
            }
            var version = this.host.getScriptVersion(fileName);
            var sourceFile;
            if (this.currentFileName !== fileName) {
                sourceFile = createLanguageServiceSourceFile(fileName, scriptSnapshot, 2, version, true);
            }
            else if (this.currentFileVersion !== version) {
                var editRange = scriptSnapshot.getChangeRange(this.currentFileScriptSnapshot);
                sourceFile = updateLanguageServiceSourceFile(this.currentSourceFile, scriptSnapshot, version, editRange);
            }
            if (sourceFile) {
                this.currentFileVersion = version;
                this.currentFileName = fileName;
                this.currentFileScriptSnapshot = scriptSnapshot;
                this.currentSourceFile = sourceFile;
            }
            return this.currentSourceFile;
        };
        return SyntaxTreeCache;
    })();
    function setSourceFileFields(sourceFile, scriptSnapshot, version) {
        sourceFile.version = version;
        sourceFile.scriptSnapshot = scriptSnapshot;
    }
    function transpile(input, compilerOptions, fileName, diagnostics) {
        var options = compilerOptions ? ts.clone(compilerOptions) : getDefaultCompilerOptions();
        options.separateCompilation = true;
        options.allowNonTsExtensions = true;
        var inputFileName = fileName || "module.ts";
        var sourceFile = ts.createSourceFile(inputFileName, input, options.target);
        if (diagnostics && sourceFile.parseDiagnostics) {
            diagnostics.push.apply(diagnostics, sourceFile.parseDiagnostics);
        }
        var outputText;
        var compilerHost = {
            getSourceFile: function (fileName, target) { return fileName === inputFileName ? sourceFile : undefined; },
            writeFile: function (name, text, writeByteOrderMark) {
                ts.Debug.assert(outputText === undefined, "Unexpected multiple outputs for the file: " + name);
                outputText = text;
            },
            getDefaultLibFileName: function () { return "lib.d.ts"; },
            useCaseSensitiveFileNames: function () { return false; },
            getCanonicalFileName: function (fileName) { return fileName; },
            getCurrentDirectory: function () { return ""; },
            getNewLine: function () { return (ts.sys && ts.sys.newLine) || "\r\n"; }
        };
        var program = ts.createProgram([inputFileName], options, compilerHost);
        if (diagnostics) {
            diagnostics.push.apply(diagnostics, program.getGlobalDiagnostics());
        }
        program.emit();
        ts.Debug.assert(outputText !== undefined, "Output generation failed");
        return outputText;
    }
    ts.transpile = transpile;
    function createLanguageServiceSourceFile(fileName, scriptSnapshot, scriptTarget, version, setNodeParents) {
        var sourceFile = ts.createSourceFile(fileName, scriptSnapshot.getText(0, scriptSnapshot.getLength()), scriptTarget, setNodeParents);
        setSourceFileFields(sourceFile, scriptSnapshot, version);
        sourceFile.nameTable = sourceFile.identifiers;
        return sourceFile;
    }
    ts.createLanguageServiceSourceFile = createLanguageServiceSourceFile;
    ts.disableIncrementalParsing = false;
    function updateLanguageServiceSourceFile(sourceFile, scriptSnapshot, version, textChangeRange, aggressiveChecks) {
        if (textChangeRange) {
            if (version !== sourceFile.version) {
                if (!ts.disableIncrementalParsing) {
                    var newSourceFile = ts.updateSourceFile(sourceFile, scriptSnapshot.getText(0, scriptSnapshot.getLength()), textChangeRange, aggressiveChecks);
                    setSourceFileFields(newSourceFile, scriptSnapshot, version);
                    newSourceFile.nameTable = undefined;
                    return newSourceFile;
                }
            }
        }
        return createLanguageServiceSourceFile(sourceFile.fileName, scriptSnapshot, sourceFile.languageVersion, version, true);
    }
    ts.updateLanguageServiceSourceFile = updateLanguageServiceSourceFile;
    function createDocumentRegistry() {
        var buckets = {};
        function getKeyFromCompilationSettings(settings) {
            return "_" + settings.target;
        }
        function getBucketForCompilationSettings(settings, createIfMissing) {
            var key = getKeyFromCompilationSettings(settings);
            var bucket = ts.lookUp(buckets, key);
            if (!bucket && createIfMissing) {
                buckets[key] = bucket = {};
            }
            return bucket;
        }
        function reportStats() {
            var bucketInfoArray = Object.keys(buckets).filter(function (name) { return name && name.charAt(0) === '_'; }).map(function (name) {
                var entries = ts.lookUp(buckets, name);
                var sourceFiles = [];
                for (var i in entries) {
                    var entry = entries[i];
                    sourceFiles.push({
                        name: i,
                        refCount: entry.languageServiceRefCount,
                        references: entry.owners.slice(0)
                    });
                }
                sourceFiles.sort(function (x, y) { return y.refCount - x.refCount; });
                return {
                    bucket: name,
                    sourceFiles: sourceFiles
                };
            });
            return JSON.stringify(bucketInfoArray, null, 2);
        }
        function acquireDocument(fileName, compilationSettings, scriptSnapshot, version) {
            return acquireOrUpdateDocument(fileName, compilationSettings, scriptSnapshot, version, true);
        }
        function updateDocument(fileName, compilationSettings, scriptSnapshot, version) {
            return acquireOrUpdateDocument(fileName, compilationSettings, scriptSnapshot, version, false);
        }
        function acquireOrUpdateDocument(fileName, compilationSettings, scriptSnapshot, version, acquiring) {
            var bucket = getBucketForCompilationSettings(compilationSettings, true);
            var entry = ts.lookUp(bucket, fileName);
            if (!entry) {
                ts.Debug.assert(acquiring, "How could we be trying to update a document that the registry doesn't have?");
                var sourceFile = createLanguageServiceSourceFile(fileName, scriptSnapshot, compilationSettings.target, version, false);
                bucket[fileName] = entry = {
                    sourceFile: sourceFile,
                    languageServiceRefCount: 0,
                    owners: []
                };
            }
            else {
                if (entry.sourceFile.version !== version) {
                    entry.sourceFile = updateLanguageServiceSourceFile(entry.sourceFile, scriptSnapshot, version, scriptSnapshot.getChangeRange(entry.sourceFile.scriptSnapshot));
                }
            }
            if (acquiring) {
                entry.languageServiceRefCount++;
            }
            return entry.sourceFile;
        }
        function releaseDocument(fileName, compilationSettings) {
            var bucket = getBucketForCompilationSettings(compilationSettings, false);
            ts.Debug.assert(bucket !== undefined);
            var entry = ts.lookUp(bucket, fileName);
            entry.languageServiceRefCount--;
            ts.Debug.assert(entry.languageServiceRefCount >= 0);
            if (entry.languageServiceRefCount === 0) {
                delete bucket[fileName];
            }
        }
        return {
            acquireDocument: acquireDocument,
            updateDocument: updateDocument,
            releaseDocument: releaseDocument,
            reportStats: reportStats
        };
    }
    ts.createDocumentRegistry = createDocumentRegistry;
    function preProcessFile(sourceText, readImportFiles) {
        if (readImportFiles === void 0) { readImportFiles = true; }
        var referencedFiles = [];
        var importedFiles = [];
        var isNoDefaultLib = false;
        function processTripleSlashDirectives() {
            var commentRanges = ts.getLeadingCommentRanges(sourceText, 0);
            ts.forEach(commentRanges, function (commentRange) {
                var comment = sourceText.substring(commentRange.pos, commentRange.end);
                var referencePathMatchResult = ts.getFileReferenceFromReferencePath(comment, commentRange);
                if (referencePathMatchResult) {
                    isNoDefaultLib = referencePathMatchResult.isNoDefaultLib;
                    var fileReference = referencePathMatchResult.fileReference;
                    if (fileReference) {
                        referencedFiles.push(fileReference);
                    }
                }
            });
        }
        function recordModuleName() {
            var importPath = scanner.getTokenValue();
            var pos = scanner.getTokenPos();
            importedFiles.push({
                fileName: importPath,
                pos: pos,
                end: pos + importPath.length
            });
        }
        function processImport() {
            scanner.setText(sourceText);
            var token = scanner.scan();
            while (token !== 1) {
                if (token === 85) {
                    token = scanner.scan();
                    if (token === 8) {
                        recordModuleName();
                        continue;
                    }
                    else {
                        if (token === 65) {
                            token = scanner.scan();
                            if (token === 124) {
                                token = scanner.scan();
                                if (token === 8) {
                                    recordModuleName();
                                    continue;
                                }
                            }
                            else if (token === 53) {
                                token = scanner.scan();
                                if (token === 118) {
                                    token = scanner.scan();
                                    if (token === 16) {
                                        token = scanner.scan();
                                        if (token === 8) {
                                            recordModuleName();
                                            continue;
                                        }
                                    }
                                }
                            }
                            else if (token === 23) {
                                token = scanner.scan();
                            }
                            else {
                                continue;
                            }
                        }
                        if (token === 14) {
                            token = scanner.scan();
                            while (token !== 15) {
                                token = scanner.scan();
                            }
                            if (token === 15) {
                                token = scanner.scan();
                                if (token === 124) {
                                    token = scanner.scan();
                                    if (token === 8) {
                                        recordModuleName();
                                    }
                                }
                            }
                        }
                        else if (token === 35) {
                            token = scanner.scan();
                            if (token === 111) {
                                token = scanner.scan();
                                if (token === 65) {
                                    token = scanner.scan();
                                    if (token === 124) {
                                        token = scanner.scan();
                                        if (token === 8) {
                                            recordModuleName();
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else if (token === 78) {
                    token = scanner.scan();
                    if (token === 14) {
                        token = scanner.scan();
                        while (token !== 15) {
                            token = scanner.scan();
                        }
                        if (token === 15) {
                            token = scanner.scan();
                            if (token === 124) {
                                token = scanner.scan();
                                if (token === 8) {
                                    recordModuleName();
                                }
                            }
                        }
                    }
                    else if (token === 35) {
                        token = scanner.scan();
                        if (token === 124) {
                            token = scanner.scan();
                            if (token === 8) {
                                recordModuleName();
                            }
                        }
                    }
                }
                token = scanner.scan();
            }
            scanner.setText(undefined);
        }
        if (readImportFiles) {
            processImport();
        }
        processTripleSlashDirectives();
        return { referencedFiles: referencedFiles, importedFiles: importedFiles, isLibFile: isNoDefaultLib };
    }
    ts.preProcessFile = preProcessFile;
    function getTargetLabel(referenceNode, labelName) {
        while (referenceNode) {
            if (referenceNode.kind === 194 && referenceNode.label.text === labelName) {
                return referenceNode.label;
            }
            referenceNode = referenceNode.parent;
        }
        return undefined;
    }
    function isJumpStatementTarget(node) {
        return node.kind === 65 &&
            (node.parent.kind === 190 || node.parent.kind === 189) &&
            node.parent.label === node;
    }
    function isLabelOfLabeledStatement(node) {
        return node.kind === 65 &&
            node.parent.kind === 194 &&
            node.parent.label === node;
    }
    function isLabeledBy(node, labelName) {
        for (var owner = node.parent; owner.kind === 194; owner = owner.parent) {
            if (owner.label.text === labelName) {
                return true;
            }
        }
        return false;
    }
    function isLabelName(node) {
        return isLabelOfLabeledStatement(node) || isJumpStatementTarget(node);
    }
    function isRightSideOfQualifiedName(node) {
        return node.parent.kind === 126 && node.parent.right === node;
    }
    function isRightSideOfPropertyAccess(node) {
        return node && node.parent && node.parent.kind === 155 && node.parent.name === node;
    }
    function isCallExpressionTarget(node) {
        if (isRightSideOfPropertyAccess(node)) {
            node = node.parent;
        }
        return node && node.parent && node.parent.kind === 157 && node.parent.expression === node;
    }
    function isNewExpressionTarget(node) {
        if (isRightSideOfPropertyAccess(node)) {
            node = node.parent;
        }
        return node && node.parent && node.parent.kind === 158 && node.parent.expression === node;
    }
    function isNameOfModuleDeclaration(node) {
        return node.parent.kind === 205 && node.parent.name === node;
    }
    function isNameOfFunctionDeclaration(node) {
        return node.kind === 65 &&
            ts.isFunctionLike(node.parent) && node.parent.name === node;
    }
    function isNameOfPropertyAssignment(node) {
        return (node.kind === 65 || node.kind === 8 || node.kind === 7) &&
            (node.parent.kind === 224 || node.parent.kind === 225) && node.parent.name === node;
    }
    function isLiteralNameOfPropertyDeclarationOrIndexAccess(node) {
        if (node.kind === 8 || node.kind === 7) {
            switch (node.parent.kind) {
                case 132:
                case 131:
                case 224:
                case 226:
                case 134:
                case 133:
                case 136:
                case 137:
                case 205:
                    return node.parent.name === node;
                case 156:
                    return node.parent.argumentExpression === node;
            }
        }
        return false;
    }
    function isNameOfExternalModuleImportOrDeclaration(node) {
        if (node.kind === 8) {
            return isNameOfModuleDeclaration(node) ||
                (ts.isExternalModuleImportEqualsDeclaration(node.parent.parent) && ts.getExternalModuleImportEqualsDeclarationExpression(node.parent.parent) === node);
        }
        return false;
    }
    function isInsideComment(sourceFile, token, position) {
        return position <= token.getStart(sourceFile) &&
            (isInsideCommentRange(ts.getTrailingCommentRanges(sourceFile.text, token.getFullStart())) ||
                isInsideCommentRange(ts.getLeadingCommentRanges(sourceFile.text, token.getFullStart())));
        function isInsideCommentRange(comments) {
            return ts.forEach(comments, function (comment) {
                if (comment.pos < position && position < comment.end) {
                    return true;
                }
                else if (position === comment.end) {
                    var text = sourceFile.text;
                    var width = comment.end - comment.pos;
                    if (width <= 2 || text.charCodeAt(comment.pos + 1) === 47) {
                        return true;
                    }
                    else {
                        return !(text.charCodeAt(comment.end - 1) === 47 &&
                            text.charCodeAt(comment.end - 2) === 42);
                    }
                }
                return false;
            });
        }
    }
    var SemanticMeaning;
    (function (SemanticMeaning) {
        SemanticMeaning[SemanticMeaning["None"] = 0] = "None";
        SemanticMeaning[SemanticMeaning["Value"] = 1] = "Value";
        SemanticMeaning[SemanticMeaning["Type"] = 2] = "Type";
        SemanticMeaning[SemanticMeaning["Namespace"] = 4] = "Namespace";
        SemanticMeaning[SemanticMeaning["All"] = 7] = "All";
    })(SemanticMeaning || (SemanticMeaning = {}));
    var BreakContinueSearchType;
    (function (BreakContinueSearchType) {
        BreakContinueSearchType[BreakContinueSearchType["None"] = 0] = "None";
        BreakContinueSearchType[BreakContinueSearchType["Unlabeled"] = 1] = "Unlabeled";
        BreakContinueSearchType[BreakContinueSearchType["Labeled"] = 2] = "Labeled";
        BreakContinueSearchType[BreakContinueSearchType["All"] = 3] = "All";
    })(BreakContinueSearchType || (BreakContinueSearchType = {}));
    var keywordCompletions = [];
    for (var i = 66; i <= 125; i++) {
        keywordCompletions.push({
            name: ts.tokenToString(i),
            kind: ScriptElementKind.keyword,
            kindModifiers: ScriptElementKindModifier.none,
            sortText: "0"
        });
    }
    function getContainerNode(node) {
        while (true) {
            node = node.parent;
            if (!node) {
                return undefined;
            }
            switch (node.kind) {
                case 227:
                case 134:
                case 133:
                case 200:
                case 162:
                case 136:
                case 137:
                case 201:
                case 202:
                case 204:
                case 205:
                    return node;
            }
        }
    }
    ts.getContainerNode = getContainerNode;
    function getNodeKind(node) {
        switch (node.kind) {
            case 205: return ScriptElementKind.moduleElement;
            case 201: return ScriptElementKind.classElement;
            case 202: return ScriptElementKind.interfaceElement;
            case 203: return ScriptElementKind.typeElement;
            case 204: return ScriptElementKind.enumElement;
            case 198:
                return ts.isConst(node)
                    ? ScriptElementKind.constElement
                    : ts.isLet(node)
                        ? ScriptElementKind.letElement
                        : ScriptElementKind.variableElement;
            case 200: return ScriptElementKind.functionElement;
            case 136: return ScriptElementKind.memberGetAccessorElement;
            case 137: return ScriptElementKind.memberSetAccessorElement;
            case 134:
            case 133:
                return ScriptElementKind.memberFunctionElement;
            case 132:
            case 131:
                return ScriptElementKind.memberVariableElement;
            case 140: return ScriptElementKind.indexSignatureElement;
            case 139: return ScriptElementKind.constructSignatureElement;
            case 138: return ScriptElementKind.callSignatureElement;
            case 135: return ScriptElementKind.constructorImplementationElement;
            case 128: return ScriptElementKind.typeParameterElement;
            case 226: return ScriptElementKind.variableElement;
            case 129: return (node.flags & 112) ? ScriptElementKind.memberVariableElement : ScriptElementKind.parameterElement;
            case 208:
            case 213:
            case 210:
            case 217:
            case 211:
                return ScriptElementKind.alias;
        }
        return ScriptElementKind.unknown;
    }
    ts.getNodeKind = getNodeKind;
    function createLanguageService(host, documentRegistry) {
        if (documentRegistry === void 0) { documentRegistry = createDocumentRegistry(); }
        var syntaxTreeCache = new SyntaxTreeCache(host);
        var ruleProvider;
        var program;
        var useCaseSensitivefileNames = false;
        var cancellationToken = new CancellationTokenObject(host.getCancellationToken && host.getCancellationToken());
        if (!ts.localizedDiagnosticMessages && host.getLocalizedDiagnosticMessages) {
            ts.localizedDiagnosticMessages = host.getLocalizedDiagnosticMessages();
        }
        function log(message) {
            if (host.log) {
                host.log(message);
            }
        }
        function getCanonicalFileName(fileName) {
            return useCaseSensitivefileNames ? fileName : fileName.toLowerCase();
        }
        function getValidSourceFile(fileName) {
            fileName = ts.normalizeSlashes(fileName);
            var sourceFile = program.getSourceFile(getCanonicalFileName(fileName));
            if (!sourceFile) {
                throw new Error("Could not find file: '" + fileName + "'.");
            }
            return sourceFile;
        }
        function getRuleProvider(options) {
            if (!ruleProvider) {
                ruleProvider = new ts.formatting.RulesProvider();
            }
            ruleProvider.ensureUpToDate(options);
            return ruleProvider;
        }
        function synchronizeHostData() {
            var hostCache = new HostCache(host);
            if (programUpToDate()) {
                return;
            }
            var oldSettings = program && program.getCompilerOptions();
            var newSettings = hostCache.compilationSettings();
            var changesInCompilationSettingsAffectSyntax = oldSettings && oldSettings.target !== newSettings.target;
            var newProgram = ts.createProgram(hostCache.getRootFileNames(), newSettings, {
                getSourceFile: getOrCreateSourceFile,
                getCancellationToken: function () { return cancellationToken; },
                getCanonicalFileName: function (fileName) { return useCaseSensitivefileNames ? fileName : fileName.toLowerCase(); },
                useCaseSensitiveFileNames: function () { return useCaseSensitivefileNames; },
                getNewLine: function () { return host.getNewLine ? host.getNewLine() : "\r\n"; },
                getDefaultLibFileName: function (options) { return host.getDefaultLibFileName(options); },
                writeFile: function (fileName, data, writeByteOrderMark) { },
                getCurrentDirectory: function () { return host.getCurrentDirectory(); }
            });
            if (program) {
                var oldSourceFiles = program.getSourceFiles();
                for (var _i = 0; _i < oldSourceFiles.length; _i++) {
                    var oldSourceFile = oldSourceFiles[_i];
                    var fileName = oldSourceFile.fileName;
                    if (!newProgram.getSourceFile(fileName) || changesInCompilationSettingsAffectSyntax) {
                        documentRegistry.releaseDocument(fileName, oldSettings);
                    }
                }
            }
            program = newProgram;
            program.getTypeChecker();
            return;
            function getOrCreateSourceFile(fileName) {
                var hostFileInformation = hostCache.getOrCreateEntry(fileName);
                if (!hostFileInformation) {
                    return undefined;
                }
                if (!changesInCompilationSettingsAffectSyntax) {
                    var oldSourceFile = program && program.getSourceFile(fileName);
                    if (oldSourceFile) {
                        return documentRegistry.updateDocument(fileName, newSettings, hostFileInformation.scriptSnapshot, hostFileInformation.version);
                    }
                }
                return documentRegistry.acquireDocument(fileName, newSettings, hostFileInformation.scriptSnapshot, hostFileInformation.version);
            }
            function sourceFileUpToDate(sourceFile) {
                return sourceFile && sourceFile.version === hostCache.getVersion(sourceFile.fileName);
            }
            function programUpToDate() {
                if (!program) {
                    return false;
                }
                var rootFileNames = hostCache.getRootFileNames();
                if (program.getSourceFiles().length !== rootFileNames.length) {
                    return false;
                }
                for (var _i = 0; _i < rootFileNames.length; _i++) {
                    var fileName = rootFileNames[_i];
                    if (!sourceFileUpToDate(program.getSourceFile(fileName))) {
                        return false;
                    }
                }
                return ts.compareDataObjects(program.getCompilerOptions(), hostCache.compilationSettings());
            }
        }
        function getProgram() {
            synchronizeHostData();
            return program;
        }
        function cleanupSemanticCache() {
        }
        function dispose() {
            if (program) {
                ts.forEach(program.getSourceFiles(), function (f) {
                    return documentRegistry.releaseDocument(f.fileName, program.getCompilerOptions());
                });
            }
        }
        function getSyntacticDiagnostics(fileName) {
            synchronizeHostData();
            return program.getSyntacticDiagnostics(getValidSourceFile(fileName));
        }
        function getSemanticDiagnostics(fileName) {
            synchronizeHostData();
            var targetSourceFile = getValidSourceFile(fileName);
            if (ts.isJavaScript(fileName)) {
                return getJavaScriptSemanticDiagnostics(targetSourceFile);
            }
            var semanticDiagnostics = program.getSemanticDiagnostics(targetSourceFile);
            if (!program.getCompilerOptions().declaration) {
                return semanticDiagnostics;
            }
            var declarationDiagnostics = program.getDeclarationDiagnostics(targetSourceFile);
            return ts.concatenate(semanticDiagnostics, declarationDiagnostics);
        }
        function getJavaScriptSemanticDiagnostics(sourceFile) {
            var diagnostics = [];
            walk(sourceFile);
            return diagnostics;
            function walk(node) {
                if (!node) {
                    return false;
                }
                switch (node.kind) {
                    case 208:
                        diagnostics.push(ts.createDiagnosticForNode(node, ts.Diagnostics.import_can_only_be_used_in_a_ts_file));
                        return true;
                    case 214:
                        diagnostics.push(ts.createDiagnosticForNode(node, ts.Diagnostics.export_can_only_be_used_in_a_ts_file));
                        return true;
                    case 201:
                        var classDeclaration = node;
                        if (checkModifiers(classDeclaration.modifiers) ||
                            checkTypeParameters(classDeclaration.typeParameters)) {
                            return true;
                        }
                        break;
                    case 222:
                        var heritageClause = node;
                        if (heritageClause.token === 102) {
                            diagnostics.push(ts.createDiagnosticForNode(node, ts.Diagnostics.implements_clauses_can_only_be_used_in_a_ts_file));
                            return true;
                        }
                        break;
                    case 202:
                        diagnostics.push(ts.createDiagnosticForNode(node, ts.Diagnostics.interface_declarations_can_only_be_used_in_a_ts_file));
                        return true;
                    case 205:
                        diagnostics.push(ts.createDiagnosticForNode(node, ts.Diagnostics.module_declarations_can_only_be_used_in_a_ts_file));
                        return true;
                    case 203:
                        diagnostics.push(ts.createDiagnosticForNode(node, ts.Diagnostics.type_aliases_can_only_be_used_in_a_ts_file));
                        return true;
                    case 134:
                    case 133:
                    case 135:
                    case 136:
                    case 137:
                    case 162:
                    case 200:
                    case 163:
                    case 200:
                        var functionDeclaration = node;
                        if (checkModifiers(functionDeclaration.modifiers) ||
                            checkTypeParameters(functionDeclaration.typeParameters) ||
                            checkTypeAnnotation(functionDeclaration.type)) {
                            return true;
                        }
                        break;
                    case 180:
                        var variableStatement = node;
                        if (checkModifiers(variableStatement.modifiers)) {
                            return true;
                        }
                        break;
                    case 198:
                        var variableDeclaration = node;
                        if (checkTypeAnnotation(variableDeclaration.type)) {
                            return true;
                        }
                        break;
                    case 157:
                    case 158:
                        var expression = node;
                        if (expression.typeArguments && expression.typeArguments.length > 0) {
                            var start = expression.typeArguments.pos;
                            diagnostics.push(ts.createFileDiagnostic(sourceFile, start, expression.typeArguments.end - start, ts.Diagnostics.type_arguments_can_only_be_used_in_a_ts_file));
                            return true;
                        }
                        break;
                    case 129:
                        var parameter = node;
                        if (parameter.modifiers) {
                            var start = parameter.modifiers.pos;
                            diagnostics.push(ts.createFileDiagnostic(sourceFile, start, parameter.modifiers.end - start, ts.Diagnostics.parameter_modifiers_can_only_be_used_in_a_ts_file));
                            return true;
                        }
                        if (parameter.questionToken) {
                            diagnostics.push(ts.createDiagnosticForNode(parameter.questionToken, ts.Diagnostics.can_only_be_used_in_a_ts_file));
                            return true;
                        }
                        if (parameter.type) {
                            diagnostics.push(ts.createDiagnosticForNode(parameter.type, ts.Diagnostics.types_can_only_be_used_in_a_ts_file));
                            return true;
                        }
                        break;
                    case 132:
                        diagnostics.push(ts.createDiagnosticForNode(node, ts.Diagnostics.property_declarations_can_only_be_used_in_a_ts_file));
                        return true;
                    case 204:
                        diagnostics.push(ts.createDiagnosticForNode(node, ts.Diagnostics.enum_declarations_can_only_be_used_in_a_ts_file));
                        return true;
                    case 160:
                        var typeAssertionExpression = node;
                        diagnostics.push(ts.createDiagnosticForNode(typeAssertionExpression.type, ts.Diagnostics.type_assertion_expressions_can_only_be_used_in_a_ts_file));
                        return true;
                    case 130:
                        diagnostics.push(ts.createDiagnosticForNode(node, ts.Diagnostics.decorators_can_only_be_used_in_a_ts_file));
                        return true;
                }
                return ts.forEachChild(node, walk);
            }
            function checkTypeParameters(typeParameters) {
                if (typeParameters) {
                    var start = typeParameters.pos;
                    diagnostics.push(ts.createFileDiagnostic(sourceFile, start, typeParameters.end - start, ts.Diagnostics.type_parameter_declarations_can_only_be_used_in_a_ts_file));
                    return true;
                }
                return false;
            }
            function checkTypeAnnotation(type) {
                if (type) {
                    diagnostics.push(ts.createDiagnosticForNode(type, ts.Diagnostics.types_can_only_be_used_in_a_ts_file));
                    return true;
                }
                return false;
            }
            function checkModifiers(modifiers) {
                if (modifiers) {
                    for (var _i = 0; _i < modifiers.length; _i++) {
                        var modifier = modifiers[_i];
                        switch (modifier.kind) {
                            case 108:
                            case 106:
                            case 107:
                            case 115:
                                diagnostics.push(ts.createDiagnosticForNode(modifier, ts.Diagnostics._0_can_only_be_used_in_a_ts_file, ts.tokenToString(modifier.kind)));
                                return true;
                            case 109:
                            case 78:
                            case 70:
                            case 73:
                        }
                    }
                }
                return false;
            }
        }
        function getCompilerOptionsDiagnostics() {
            synchronizeHostData();
            return program.getGlobalDiagnostics();
        }
        function getCompletionEntryDisplayNameForSymbol(symbol, target, performCharacterChecks) {
            var displayName = symbol.getName();
            if (displayName) {
                if (displayName === "default") {
                    var localSymbol = ts.getLocalSymbolForExportDefault(symbol);
                    if (localSymbol && localSymbol.name) {
                        displayName = symbol.valueDeclaration.localSymbol.name;
                    }
                }
                var firstCharCode = displayName.charCodeAt(0);
                if ((symbol.flags & 1536) && (firstCharCode === 39 || firstCharCode === 34)) {
                    return undefined;
                }
            }
            return getCompletionEntryDisplayName(displayName, target, performCharacterChecks);
        }
        function getCompletionEntryDisplayName(displayName, target, performCharacterChecks) {
            if (!displayName) {
                return undefined;
            }
            var firstCharCode = displayName.charCodeAt(0);
            if (displayName.length >= 2 &&
                firstCharCode === displayName.charCodeAt(displayName.length - 1) &&
                (firstCharCode === 39 || firstCharCode === 34)) {
                displayName = displayName.substring(1, displayName.length - 1);
            }
            if (!displayName) {
                return undefined;
            }
            if (performCharacterChecks) {
                if (!ts.isIdentifierStart(displayName.charCodeAt(0), target)) {
                    return undefined;
                }
                for (var i = 1, n = displayName.length; i < n; i++) {
                    if (!ts.isIdentifierPart(displayName.charCodeAt(i), target)) {
                        return undefined;
                    }
                }
            }
            return ts.unescapeIdentifier(displayName);
        }
        function getCompletionData(fileName, position) {
            var typeChecker = program.getTypeChecker();
            var syntacticStart = new Date().getTime();
            var sourceFile = getValidSourceFile(fileName);
            var start = new Date().getTime();
            var currentToken = ts.getTokenAtPosition(sourceFile, position);
            log("getCompletionData: Get current token: " + (new Date().getTime() - start));
            start = new Date().getTime();
            var insideComment = isInsideComment(sourceFile, currentToken, position);
            log("getCompletionData: Is inside comment: " + (new Date().getTime() - start));
            if (insideComment) {
                log("Returning an empty list because completion was inside a comment.");
                return undefined;
            }
            start = new Date().getTime();
            var previousToken = ts.findPrecedingToken(position, sourceFile);
            log("getCompletionData: Get previous token 1: " + (new Date().getTime() - start));
            var contextToken = previousToken;
            if (contextToken && position <= contextToken.end && ts.isWord(contextToken.kind)) {
                var start_1 = new Date().getTime();
                contextToken = ts.findPrecedingToken(contextToken.getFullStart(), sourceFile);
                log("getCompletionData: Get previous token 2: " + (new Date().getTime() - start_1));
            }
            if (contextToken && isCompletionListBlocker(contextToken)) {
                log("Returning an empty list because completion was requested in an invalid position.");
                return undefined;
            }
            var node = currentToken;
            var isRightOfDot = false;
            if (contextToken && contextToken.kind === 20 && contextToken.parent.kind === 155) {
                node = contextToken.parent.expression;
                isRightOfDot = true;
            }
            else if (contextToken && contextToken.kind === 20 && contextToken.parent.kind === 126) {
                node = contextToken.parent.left;
                isRightOfDot = true;
            }
            var location = ts.getTouchingPropertyName(sourceFile, position);
            var target = program.getCompilerOptions().target;
            var semanticStart = new Date().getTime();
            var isMemberCompletion;
            var isNewIdentifierLocation;
            var symbols = [];
            if (isRightOfDot) {
                getTypeScriptMemberSymbols();
            }
            else {
                if (!tryGetGlobalSymbols()) {
                    return undefined;
                }
            }
            log("getCompletionData: Semantic work: " + (new Date().getTime() - semanticStart));
            return { symbols: symbols, isMemberCompletion: isMemberCompletion, isNewIdentifierLocation: isNewIdentifierLocation, location: location, isRightOfDot: isRightOfDot };
            function getTypeScriptMemberSymbols() {
                isMemberCompletion = true;
                isNewIdentifierLocation = false;
                if (node.kind === 65 || node.kind === 126 || node.kind === 155) {
                    var symbol = typeChecker.getSymbolAtLocation(node);
                    if (symbol && symbol.flags & 8388608) {
                        symbol = typeChecker.getAliasedSymbol(symbol);
                    }
                    if (symbol && symbol.flags & 1952) {
                        var exportedSymbols = typeChecker.getExportsOfModule(symbol);
                        ts.forEach(exportedSymbols, function (symbol) {
                            if (typeChecker.isValidPropertyAccess((node.parent), symbol.name)) {
                                symbols.push(symbol);
                            }
                        });
                    }
                }
                var type = typeChecker.getTypeAtLocation(node);
                if (type) {
                    ts.forEach(type.getApparentProperties(), function (symbol) {
                        if (typeChecker.isValidPropertyAccess((node.parent), symbol.name)) {
                            symbols.push(symbol);
                        }
                    });
                }
            }
            function tryGetGlobalSymbols() {
                var containingObjectLiteral = getContainingObjectLiteralApplicableForCompletion(contextToken);
                if (containingObjectLiteral) {
                    isMemberCompletion = true;
                    isNewIdentifierLocation = true;
                    var contextualType = typeChecker.getContextualType(containingObjectLiteral);
                    if (!contextualType) {
                        return false;
                    }
                    var contextualTypeMembers = typeChecker.getPropertiesOfType(contextualType);
                    if (contextualTypeMembers && contextualTypeMembers.length > 0) {
                        symbols = filterContextualMembersList(contextualTypeMembers, containingObjectLiteral.properties);
                    }
                }
                else if (ts.getAncestor(contextToken, 210)) {
                    isMemberCompletion = true;
                    isNewIdentifierLocation = true;
                    if (showCompletionsInImportsClause(contextToken)) {
                        var importDeclaration = ts.getAncestor(contextToken, 209);
                        ts.Debug.assert(importDeclaration !== undefined);
                        var exports_1;
                        if (importDeclaration.moduleSpecifier) {
                            var moduleSpecifierSymbol = typeChecker.getSymbolAtLocation(importDeclaration.moduleSpecifier);
                            if (moduleSpecifierSymbol) {
                                exports_1 = typeChecker.getExportsOfModule(moduleSpecifierSymbol);
                            }
                        }
                        symbols = exports_1 ? filterModuleExports(exports_1, importDeclaration) : emptyArray;
                    }
                }
                else {
                    isMemberCompletion = false;
                    isNewIdentifierLocation = isNewIdentifierDefinitionLocation(contextToken);
                    if (previousToken !== contextToken) {
                        ts.Debug.assert(!!previousToken, "Expected 'contextToken' to be defined when different from 'previousToken'.");
                    }
                    var adjustedPosition = previousToken !== contextToken ?
                        previousToken.getStart() :
                        position;
                    var scopeNode = getScopeNode(contextToken, adjustedPosition, sourceFile) || sourceFile;
                    var symbolMeanings = 793056 | 107455 | 1536 | 8388608;
                    symbols = typeChecker.getSymbolsInScope(scopeNode, symbolMeanings);
                }
                return true;
            }
            function getScopeNode(initialToken, position, sourceFile) {
                var scope = initialToken;
                while (scope && !ts.positionBelongsToNode(scope, position, sourceFile)) {
                    scope = scope.parent;
                }
                return scope;
            }
            function isCompletionListBlocker(previousToken) {
                var start = new Date().getTime();
                var result = isInStringOrRegularExpressionOrTemplateLiteral(previousToken) ||
                    isIdentifierDefinitionLocation(previousToken) ||
                    isRightOfIllegalDot(previousToken);
                log("getCompletionsAtPosition: isCompletionListBlocker: " + (new Date().getTime() - start));
                return result;
            }
            function showCompletionsInImportsClause(node) {
                if (node) {
                    if (node.kind === 14 || node.kind === 23) {
                        return node.parent.kind === 212;
                    }
                }
                return false;
            }
            function isNewIdentifierDefinitionLocation(previousToken) {
                if (previousToken) {
                    var containingNodeKind = previousToken.parent.kind;
                    switch (previousToken.kind) {
                        case 23:
                            return containingNodeKind === 157
                                || containingNodeKind === 135
                                || containingNodeKind === 158
                                || containingNodeKind === 153
                                || containingNodeKind === 169;
                        case 16:
                            return containingNodeKind === 157
                                || containingNodeKind === 135
                                || containingNodeKind === 158
                                || containingNodeKind === 161;
                        case 18:
                            return containingNodeKind === 153;
                        case 117:
                            return true;
                        case 20:
                            return containingNodeKind === 205;
                        case 14:
                            return containingNodeKind === 201;
                        case 53:
                            return containingNodeKind === 198
                                || containingNodeKind === 169;
                        case 11:
                            return containingNodeKind === 171;
                        case 12:
                            return containingNodeKind === 176;
                        case 108:
                        case 106:
                        case 107:
                            return containingNodeKind === 132;
                    }
                    switch (previousToken.getText()) {
                        case "public":
                        case "protected":
                        case "private":
                            return true;
                    }
                }
                return false;
            }
            function isInStringOrRegularExpressionOrTemplateLiteral(previousToken) {
                if (previousToken.kind === 8
                    || previousToken.kind === 9
                    || ts.isTemplateLiteralKind(previousToken.kind)) {
                    var start_2 = previousToken.getStart();
                    var end = previousToken.getEnd();
                    if (start_2 < position && position < end) {
                        return true;
                    }
                    else if (position === end) {
                        return !!previousToken.isUnterminated;
                    }
                }
                return false;
            }
            function getContainingObjectLiteralApplicableForCompletion(previousToken) {
                // The locations in an object literal expression that are applicable for completion are property name definition locations.
                if (previousToken) {
                    var parent_2 = previousToken.parent;
                    switch (previousToken.kind) {
                        case 14:
                        case 23:
                            if (parent_2 && parent_2.kind === 154) {
                                return parent_2;
                            }
                            break;
                    }
                }
                return undefined;
            }
            function isFunction(kind) {
                switch (kind) {
                    case 162:
                    case 163:
                    case 200:
                    case 134:
                    case 133:
                    case 136:
                    case 137:
                    case 138:
                    case 139:
                    case 140:
                        return true;
                }
                return false;
            }
            function isIdentifierDefinitionLocation(previousToken) {
                if (previousToken) {
                    var containingNodeKind = previousToken.parent.kind;
                    switch (previousToken.kind) {
                        case 23:
                            return containingNodeKind === 198 ||
                                containingNodeKind === 199 ||
                                containingNodeKind === 180 ||
                                containingNodeKind === 204 ||
                                isFunction(containingNodeKind) ||
                                containingNodeKind === 201 ||
                                containingNodeKind === 200 ||
                                containingNodeKind === 202 ||
                                containingNodeKind === 151 ||
                                containingNodeKind === 150;
                        case 20:
                            return containingNodeKind === 151;
                        case 18:
                            return containingNodeKind === 151;
                        case 16:
                            return containingNodeKind === 223 ||
                                isFunction(containingNodeKind);
                        case 14:
                            return containingNodeKind === 204 ||
                                containingNodeKind === 202 ||
                                containingNodeKind === 145 ||
                                containingNodeKind === 150;
                        case 22:
                            return containingNodeKind === 131 &&
                                previousToken.parent && previousToken.parent.parent &&
                                (previousToken.parent.parent.kind === 202 ||
                                    previousToken.parent.parent.kind === 145);
                        case 24:
                            return containingNodeKind === 201 ||
                                containingNodeKind === 200 ||
                                containingNodeKind === 202 ||
                                isFunction(containingNodeKind);
                        case 109:
                            return containingNodeKind === 132;
                        case 21:
                            return containingNodeKind === 129 ||
                                containingNodeKind === 135 ||
                                (previousToken.parent && previousToken.parent.parent &&
                                    previousToken.parent.parent.kind === 151);
                        case 108:
                        case 106:
                        case 107:
                            return containingNodeKind === 129;
                        case 69:
                        case 77:
                        case 103:
                        case 83:
                        case 98:
                        case 116:
                        case 120:
                        case 85:
                        case 104:
                        case 70:
                        case 110:
                            return true;
                    }
                    switch (previousToken.getText()) {
                        case "class":
                        case "interface":
                        case "enum":
                        case "function":
                        case "var":
                        case "static":
                        case "let":
                        case "const":
                        case "yield":
                            return true;
                    }
                }
                return false;
            }
            function isRightOfIllegalDot(previousToken) {
                if (previousToken && previousToken.kind === 7) {
                    var text = previousToken.getFullText();
                    return text.charAt(text.length - 1) === ".";
                }
                return false;
            }
            function filterModuleExports(exports, importDeclaration) {
                var exisingImports = {};
                if (!importDeclaration.importClause) {
                    return exports;
                }
                if (importDeclaration.importClause.namedBindings &&
                    importDeclaration.importClause.namedBindings.kind === 212) {
                    ts.forEach(importDeclaration.importClause.namedBindings.elements, function (el) {
                        var name = el.propertyName || el.name;
                        exisingImports[name.text] = true;
                    });
                }
                if (ts.isEmpty(exisingImports)) {
                    return exports;
                }
                return ts.filter(exports, function (e) { return !ts.lookUp(exisingImports, e.name); });
            }
            function filterContextualMembersList(contextualMemberSymbols, existingMembers) {
                if (!existingMembers || existingMembers.length === 0) {
                    return contextualMemberSymbols;
                }
                var existingMemberNames = {};
                ts.forEach(existingMembers, function (m) {
                    if (m.kind !== 224 && m.kind !== 225) {
                        return;
                    }
                    if (m.getStart() <= position && position <= m.getEnd()) {
                        return;
                    }
                    existingMemberNames[m.name.text] = true;
                });
                var filteredMembers = [];
                ts.forEach(contextualMemberSymbols, function (s) {
                    if (!existingMemberNames[s.name]) {
                        filteredMembers.push(s);
                    }
                });
                return filteredMembers;
            }
        }
        function getCompletionsAtPosition(fileName, position) {
            synchronizeHostData();
            var completionData = getCompletionData(fileName, position);
            if (!completionData) {
                return undefined;
            }
            var symbols = completionData.symbols, isMemberCompletion = completionData.isMemberCompletion, isNewIdentifierLocation = completionData.isNewIdentifierLocation, location = completionData.location, isRightOfDot = completionData.isRightOfDot;
            var entries;
            if (isRightOfDot && ts.isJavaScript(fileName)) {
                entries = getCompletionEntriesFromSymbols(symbols);
                ts.addRange(entries, getJavaScriptCompletionEntries());
            }
            else {
                if (!symbols || symbols.length === 0) {
                    return undefined;
                }
                entries = getCompletionEntriesFromSymbols(symbols);
            }
            if (!isMemberCompletion) {
                ts.addRange(entries, keywordCompletions);
            }
            return { isMemberCompletion: isMemberCompletion, isNewIdentifierLocation: isNewIdentifierLocation, entries: entries };
            function getJavaScriptCompletionEntries() {
                var entries = [];
                var allNames = {};
                var target = program.getCompilerOptions().target;
                for (var _i = 0, _a = program.getSourceFiles(); _i < _a.length; _i++) {
                    var sourceFile = _a[_i];
                    var nameTable = getNameTable(sourceFile);
                    for (var name_1 in nameTable) {
                        if (!allNames[name_1]) {
                            allNames[name_1] = name_1;
                            var displayName = getCompletionEntryDisplayName(name_1, target, true);
                            if (displayName) {
                                var entry = {
                                    name: displayName,
                                    kind: ScriptElementKind.warning,
                                    kindModifiers: "",
                                    sortText: "1"
                                };
                                entries.push(entry);
                            }
                        }
                    }
                }
                return entries;
            }
            function createCompletionEntry(symbol, location) {
                var displayName = getCompletionEntryDisplayNameForSymbol(symbol, program.getCompilerOptions().target, true);
                if (!displayName) {
                    return undefined;
                }
                return {
                    name: displayName,
                    kind: getSymbolKind(symbol, location),
                    kindModifiers: getSymbolModifiers(symbol),
                    sortText: "0",
                };
            }
            function getCompletionEntriesFromSymbols(symbols) {
                var start = new Date().getTime();
                var entries = [];
                if (symbols) {
                    var nameToSymbol = {};
                    for (var _i = 0; _i < symbols.length; _i++) {
                        var symbol = symbols[_i];
                        var entry = createCompletionEntry(symbol, location);
                        if (entry) {
                            var id = ts.escapeIdentifier(entry.name);
                            if (!ts.lookUp(nameToSymbol, id)) {
                                entries.push(entry);
                                nameToSymbol[id] = symbol;
                            }
                        }
                    }
                }
                log("getCompletionsAtPosition: getCompletionEntriesFromSymbols: " + (new Date().getTime() - start));
                return entries;
            }
        }
        function getCompletionEntryDetails(fileName, position, entryName) {
            synchronizeHostData();
            var completionData = getCompletionData(fileName, position);
            if (completionData) {
                var symbols = completionData.symbols, location_1 = completionData.location;
                var target = program.getCompilerOptions().target;
                var symbol = ts.forEach(symbols, function (s) { return getCompletionEntryDisplayNameForSymbol(s, target, false) === entryName ? s : undefined; });
                if (symbol) {
                    var displayPartsDocumentationsAndSymbolKind = getSymbolDisplayPartsDocumentationAndSymbolKind(symbol, getValidSourceFile(fileName), location_1, location_1, 7);
                    return {
                        name: entryName,
                        kind: displayPartsDocumentationsAndSymbolKind.symbolKind,
                        kindModifiers: getSymbolModifiers(symbol),
                        displayParts: displayPartsDocumentationsAndSymbolKind.displayParts,
                        documentation: displayPartsDocumentationsAndSymbolKind.documentation
                    };
                }
            }
            var keywordCompletion = ts.forEach(keywordCompletions, function (c) { return c.name === entryName; });
            if (keywordCompletion) {
                return {
                    name: entryName,
                    kind: ScriptElementKind.keyword,
                    kindModifiers: ScriptElementKindModifier.none,
                    displayParts: [ts.displayPart(entryName, SymbolDisplayPartKind.keyword)],
                    documentation: undefined
                };
            }
            return undefined;
        }
        function getSymbolKind(symbol, location) {
            var flags = symbol.getFlags();
            if (flags & 32)
                return ScriptElementKind.classElement;
            if (flags & 384)
                return ScriptElementKind.enumElement;
            if (flags & 524288)
                return ScriptElementKind.typeElement;
            if (flags & 64)
                return ScriptElementKind.interfaceElement;
            if (flags & 262144)
                return ScriptElementKind.typeParameterElement;
            var result = getSymbolKindOfConstructorPropertyMethodAccessorFunctionOrVar(symbol, flags, location);
            if (result === ScriptElementKind.unknown) {
                if (flags & 262144)
                    return ScriptElementKind.typeParameterElement;
                if (flags & 8)
                    return ScriptElementKind.variableElement;
                if (flags & 8388608)
                    return ScriptElementKind.alias;
                if (flags & 1536)
                    return ScriptElementKind.moduleElement;
            }
            return result;
        }
        function getSymbolKindOfConstructorPropertyMethodAccessorFunctionOrVar(symbol, flags, location) {
            var typeChecker = program.getTypeChecker();
            if (typeChecker.isUndefinedSymbol(symbol)) {
                return ScriptElementKind.variableElement;
            }
            if (typeChecker.isArgumentsSymbol(symbol)) {
                return ScriptElementKind.localVariableElement;
            }
            if (flags & 3) {
                if (ts.isFirstDeclarationOfSymbolParameter(symbol)) {
                    return ScriptElementKind.parameterElement;
                }
                else if (symbol.valueDeclaration && ts.isConst(symbol.valueDeclaration)) {
                    return ScriptElementKind.constElement;
                }
                else if (ts.forEach(symbol.declarations, ts.isLet)) {
                    return ScriptElementKind.letElement;
                }
                return isLocalVariableOrFunction(symbol) ? ScriptElementKind.localVariableElement : ScriptElementKind.variableElement;
            }
            if (flags & 16)
                return isLocalVariableOrFunction(symbol) ? ScriptElementKind.localFunctionElement : ScriptElementKind.functionElement;
            if (flags & 32768)
                return ScriptElementKind.memberGetAccessorElement;
            if (flags & 65536)
                return ScriptElementKind.memberSetAccessorElement;
            if (flags & 8192)
                return ScriptElementKind.memberFunctionElement;
            if (flags & 16384)
                return ScriptElementKind.constructorImplementationElement;
            if (flags & 4) {
                if (flags & 268435456) {
                    var unionPropertyKind = ts.forEach(typeChecker.getRootSymbols(symbol), function (rootSymbol) {
                        var rootSymbolFlags = rootSymbol.getFlags();
                        if (rootSymbolFlags & (98308 | 3)) {
                            return ScriptElementKind.memberVariableElement;
                        }
                        ts.Debug.assert(!!(rootSymbolFlags & 8192));
                    });
                    if (!unionPropertyKind) {
                        var typeOfUnionProperty = typeChecker.getTypeOfSymbolAtLocation(symbol, location);
                        if (typeOfUnionProperty.getCallSignatures().length) {
                            return ScriptElementKind.memberFunctionElement;
                        }
                        return ScriptElementKind.memberVariableElement;
                    }
                    return unionPropertyKind;
                }
                return ScriptElementKind.memberVariableElement;
            }
            return ScriptElementKind.unknown;
        }
        function getTypeKind(type) {
            var flags = type.getFlags();
            if (flags & 128)
                return ScriptElementKind.enumElement;
            if (flags & 1024)
                return ScriptElementKind.classElement;
            if (flags & 2048)
                return ScriptElementKind.interfaceElement;
            if (flags & 512)
                return ScriptElementKind.typeParameterElement;
            if (flags & 1048703)
                return ScriptElementKind.primitiveType;
            if (flags & 256)
                return ScriptElementKind.primitiveType;
            return ScriptElementKind.unknown;
        }
        function getSymbolModifiers(symbol) {
            return symbol && symbol.declarations && symbol.declarations.length > 0
                ? ts.getNodeModifiers(symbol.declarations[0])
                : ScriptElementKindModifier.none;
        }
        function getSymbolDisplayPartsDocumentationAndSymbolKind(symbol, sourceFile, enclosingDeclaration, location, semanticMeaning) {
            if (semanticMeaning === void 0) { semanticMeaning = getMeaningFromLocation(location); }
            var typeChecker = program.getTypeChecker();
            var displayParts = [];
            var documentation;
            var symbolFlags = symbol.flags;
            var symbolKind = getSymbolKindOfConstructorPropertyMethodAccessorFunctionOrVar(symbol, symbolFlags, location);
            var hasAddedSymbolInfo;
            var type;
            if (symbolKind !== ScriptElementKind.unknown || symbolFlags & 32 || symbolFlags & 8388608) {
                if (symbolKind === ScriptElementKind.memberGetAccessorElement || symbolKind === ScriptElementKind.memberSetAccessorElement) {
                    symbolKind = ScriptElementKind.memberVariableElement;
                }
                var signature;
                type = typeChecker.getTypeOfSymbolAtLocation(symbol, location);
                if (type) {
                    if (location.parent && location.parent.kind === 155) {
                        var right = location.parent.name;
                        if (right === location || (right && right.getFullWidth() === 0)) {
                            location = location.parent;
                        }
                    }
                    var callExpression;
                    if (location.kind === 157 || location.kind === 158) {
                        callExpression = location;
                    }
                    else if (isCallExpressionTarget(location) || isNewExpressionTarget(location)) {
                        callExpression = location.parent;
                    }
                    if (callExpression) {
                        var candidateSignatures = [];
                        signature = typeChecker.getResolvedSignature(callExpression, candidateSignatures);
                        if (!signature && candidateSignatures.length) {
                            signature = candidateSignatures[0];
                        }
                        var useConstructSignatures = callExpression.kind === 158 || callExpression.expression.kind === 91;
                        var allSignatures = useConstructSignatures ? type.getConstructSignatures() : type.getCallSignatures();
                        if (!ts.contains(allSignatures, signature.target || signature)) {
                            signature = allSignatures.length ? allSignatures[0] : undefined;
                        }
                        if (signature) {
                            if (useConstructSignatures && (symbolFlags & 32)) {
                                symbolKind = ScriptElementKind.constructorImplementationElement;
                                addPrefixForAnyFunctionOrVar(type.symbol, symbolKind);
                            }
                            else if (symbolFlags & 8388608) {
                                symbolKind = ScriptElementKind.alias;
                                pushTypePart(symbolKind);
                                displayParts.push(ts.spacePart());
                                if (useConstructSignatures) {
                                    displayParts.push(ts.keywordPart(88));
                                    displayParts.push(ts.spacePart());
                                }
                                addFullSymbolName(symbol);
                            }
                            else {
                                addPrefixForAnyFunctionOrVar(symbol, symbolKind);
                            }
                            switch (symbolKind) {
                                case ScriptElementKind.memberVariableElement:
                                case ScriptElementKind.variableElement:
                                case ScriptElementKind.constElement:
                                case ScriptElementKind.letElement:
                                case ScriptElementKind.parameterElement:
                                case ScriptElementKind.localVariableElement:
                                    displayParts.push(ts.punctuationPart(51));
                                    displayParts.push(ts.spacePart());
                                    if (useConstructSignatures) {
                                        displayParts.push(ts.keywordPart(88));
                                        displayParts.push(ts.spacePart());
                                    }
                                    if (!(type.flags & 32768)) {
                                        displayParts.push.apply(displayParts, ts.symbolToDisplayParts(typeChecker, type.symbol, enclosingDeclaration, undefined, 1));
                                    }
                                    addSignatureDisplayParts(signature, allSignatures, 8);
                                    break;
                                default:
                                    addSignatureDisplayParts(signature, allSignatures);
                            }
                            hasAddedSymbolInfo = true;
                        }
                    }
                    else if ((isNameOfFunctionDeclaration(location) && !(symbol.flags & 98304)) ||
                        (location.kind === 114 && location.parent.kind === 135)) {
                        var functionDeclaration = location.parent;
                        var allSignatures = functionDeclaration.kind === 135 ? type.getConstructSignatures() : type.getCallSignatures();
                        if (!typeChecker.isImplementationOfOverload(functionDeclaration)) {
                            signature = typeChecker.getSignatureFromDeclaration(functionDeclaration);
                        }
                        else {
                            signature = allSignatures[0];
                        }
                        if (functionDeclaration.kind === 135) {
                            symbolKind = ScriptElementKind.constructorImplementationElement;
                            addPrefixForAnyFunctionOrVar(type.symbol, symbolKind);
                        }
                        else {
                            addPrefixForAnyFunctionOrVar(functionDeclaration.kind === 138 &&
                                !(type.symbol.flags & 2048 || type.symbol.flags & 4096) ? type.symbol : symbol, symbolKind);
                        }
                        addSignatureDisplayParts(signature, allSignatures);
                        hasAddedSymbolInfo = true;
                    }
                }
            }
            if (symbolFlags & 32 && !hasAddedSymbolInfo) {
                displayParts.push(ts.keywordPart(69));
                displayParts.push(ts.spacePart());
                addFullSymbolName(symbol);
                writeTypeParametersOfSymbol(symbol, sourceFile);
            }
            if ((symbolFlags & 64) && (semanticMeaning & 2)) {
                addNewLineIfDisplayPartsExist();
                displayParts.push(ts.keywordPart(103));
                displayParts.push(ts.spacePart());
                addFullSymbolName(symbol);
                writeTypeParametersOfSymbol(symbol, sourceFile);
            }
            if (symbolFlags & 524288) {
                addNewLineIfDisplayPartsExist();
                displayParts.push(ts.keywordPart(123));
                displayParts.push(ts.spacePart());
                addFullSymbolName(symbol);
                displayParts.push(ts.spacePart());
                displayParts.push(ts.operatorPart(53));
                displayParts.push(ts.spacePart());
                displayParts.push.apply(displayParts, ts.typeToDisplayParts(typeChecker, typeChecker.getDeclaredTypeOfSymbol(symbol), enclosingDeclaration));
            }
            if (symbolFlags & 384) {
                addNewLineIfDisplayPartsExist();
                if (ts.forEach(symbol.declarations, ts.isConstEnumDeclaration)) {
                    displayParts.push(ts.keywordPart(70));
                    displayParts.push(ts.spacePart());
                }
                displayParts.push(ts.keywordPart(77));
                displayParts.push(ts.spacePart());
                addFullSymbolName(symbol);
            }
            if (symbolFlags & 1536) {
                addNewLineIfDisplayPartsExist();
                displayParts.push(ts.keywordPart(117));
                displayParts.push(ts.spacePart());
                addFullSymbolName(symbol);
            }
            if ((symbolFlags & 262144) && (semanticMeaning & 2)) {
                addNewLineIfDisplayPartsExist();
                displayParts.push(ts.punctuationPart(16));
                displayParts.push(ts.textPart("type parameter"));
                displayParts.push(ts.punctuationPart(17));
                displayParts.push(ts.spacePart());
                addFullSymbolName(symbol);
                displayParts.push(ts.spacePart());
                displayParts.push(ts.keywordPart(86));
                displayParts.push(ts.spacePart());
                if (symbol.parent) {
                    addFullSymbolName(symbol.parent, enclosingDeclaration);
                    writeTypeParametersOfSymbol(symbol.parent, enclosingDeclaration);
                }
                else {
                    var signatureDeclaration = ts.getDeclarationOfKind(symbol, 128).parent;
                    var signature = typeChecker.getSignatureFromDeclaration(signatureDeclaration);
                    if (signatureDeclaration.kind === 139) {
                        displayParts.push(ts.keywordPart(88));
                        displayParts.push(ts.spacePart());
                    }
                    else if (signatureDeclaration.kind !== 138 && signatureDeclaration.name) {
                        addFullSymbolName(signatureDeclaration.symbol);
                    }
                    displayParts.push.apply(displayParts, ts.signatureToDisplayParts(typeChecker, signature, sourceFile, 32));
                }
            }
            if (symbolFlags & 8) {
                addPrefixForAnyFunctionOrVar(symbol, "enum member");
                var declaration = symbol.declarations[0];
                if (declaration.kind === 226) {
                    var constantValue = typeChecker.getConstantValue(declaration);
                    if (constantValue !== undefined) {
                        displayParts.push(ts.spacePart());
                        displayParts.push(ts.operatorPart(53));
                        displayParts.push(ts.spacePart());
                        displayParts.push(ts.displayPart(constantValue.toString(), SymbolDisplayPartKind.numericLiteral));
                    }
                }
            }
            if (symbolFlags & 8388608) {
                addNewLineIfDisplayPartsExist();
                displayParts.push(ts.keywordPart(85));
                displayParts.push(ts.spacePart());
                addFullSymbolName(symbol);
                ts.forEach(symbol.declarations, function (declaration) {
                    if (declaration.kind === 208) {
                        var importEqualsDeclaration = declaration;
                        if (ts.isExternalModuleImportEqualsDeclaration(importEqualsDeclaration)) {
                            displayParts.push(ts.spacePart());
                            displayParts.push(ts.operatorPart(53));
                            displayParts.push(ts.spacePart());
                            displayParts.push(ts.keywordPart(118));
                            displayParts.push(ts.punctuationPart(16));
                            displayParts.push(ts.displayPart(ts.getTextOfNode(ts.getExternalModuleImportEqualsDeclarationExpression(importEqualsDeclaration)), SymbolDisplayPartKind.stringLiteral));
                            displayParts.push(ts.punctuationPart(17));
                        }
                        else {
                            var internalAliasSymbol = typeChecker.getSymbolAtLocation(importEqualsDeclaration.moduleReference);
                            if (internalAliasSymbol) {
                                displayParts.push(ts.spacePart());
                                displayParts.push(ts.operatorPart(53));
                                displayParts.push(ts.spacePart());
                                addFullSymbolName(internalAliasSymbol, enclosingDeclaration);
                            }
                        }
                        return true;
                    }
                });
            }
            if (!hasAddedSymbolInfo) {
                if (symbolKind !== ScriptElementKind.unknown) {
                    if (type) {
                        addPrefixForAnyFunctionOrVar(symbol, symbolKind);
                        if (symbolKind === ScriptElementKind.memberVariableElement ||
                            symbolFlags & 3 ||
                            symbolKind === ScriptElementKind.localVariableElement) {
                            displayParts.push(ts.punctuationPart(51));
                            displayParts.push(ts.spacePart());
                            if (type.symbol && type.symbol.flags & 262144) {
                                var typeParameterParts = ts.mapToDisplayParts(function (writer) {
                                    typeChecker.getSymbolDisplayBuilder().buildTypeParameterDisplay(type, writer, enclosingDeclaration);
                                });
                                displayParts.push.apply(displayParts, typeParameterParts);
                            }
                            else {
                                displayParts.push.apply(displayParts, ts.typeToDisplayParts(typeChecker, type, enclosingDeclaration));
                            }
                        }
                        else if (symbolFlags & 16 ||
                            symbolFlags & 8192 ||
                            symbolFlags & 16384 ||
                            symbolFlags & 131072 ||
                            symbolFlags & 98304 ||
                            symbolKind === ScriptElementKind.memberFunctionElement) {
                            var allSignatures = type.getCallSignatures();
                            addSignatureDisplayParts(allSignatures[0], allSignatures);
                        }
                    }
                }
                else {
                    symbolKind = getSymbolKind(symbol, location);
                }
            }
            if (!documentation) {
                documentation = symbol.getDocumentationComment();
            }
            return { displayParts: displayParts, documentation: documentation, symbolKind: symbolKind };
            function addNewLineIfDisplayPartsExist() {
                if (displayParts.length) {
                    displayParts.push(ts.lineBreakPart());
                }
            }
            function addFullSymbolName(symbol, enclosingDeclaration) {
                var fullSymbolDisplayParts = ts.symbolToDisplayParts(typeChecker, symbol, enclosingDeclaration || sourceFile, undefined, 1 | 2);
                displayParts.push.apply(displayParts, fullSymbolDisplayParts);
            }
            function addPrefixForAnyFunctionOrVar(symbol, symbolKind) {
                addNewLineIfDisplayPartsExist();
                if (symbolKind) {
                    pushTypePart(symbolKind);
                    displayParts.push(ts.spacePart());
                    addFullSymbolName(symbol);
                }
            }
            function pushTypePart(symbolKind) {
                switch (symbolKind) {
                    case ScriptElementKind.variableElement:
                    case ScriptElementKind.functionElement:
                    case ScriptElementKind.letElement:
                    case ScriptElementKind.constElement:
                    case ScriptElementKind.constructorImplementationElement:
                        displayParts.push(ts.textOrKeywordPart(symbolKind));
                        return;
                    default:
                        displayParts.push(ts.punctuationPart(16));
                        displayParts.push(ts.textOrKeywordPart(symbolKind));
                        displayParts.push(ts.punctuationPart(17));
                        return;
                }
            }
            function addSignatureDisplayParts(signature, allSignatures, flags) {
                displayParts.push.apply(displayParts, ts.signatureToDisplayParts(typeChecker, signature, enclosingDeclaration, flags | 32));
                if (allSignatures.length > 1) {
                    displayParts.push(ts.spacePart());
                    displayParts.push(ts.punctuationPart(16));
                    displayParts.push(ts.operatorPart(33));
                    displayParts.push(ts.displayPart((allSignatures.length - 1).toString(), SymbolDisplayPartKind.numericLiteral));
                    displayParts.push(ts.spacePart());
                    displayParts.push(ts.textPart(allSignatures.length === 2 ? "overload" : "overloads"));
                    displayParts.push(ts.punctuationPart(17));
                }
                documentation = signature.getDocumentationComment();
            }
            function writeTypeParametersOfSymbol(symbol, enclosingDeclaration) {
                var typeParameterParts = ts.mapToDisplayParts(function (writer) {
                    typeChecker.getSymbolDisplayBuilder().buildTypeParameterDisplayFromSymbol(symbol, writer, enclosingDeclaration);
                });
                displayParts.push.apply(displayParts, typeParameterParts);
            }
        }
        function getQuickInfoAtPosition(fileName, position) {
            synchronizeHostData();
            var sourceFile = getValidSourceFile(fileName);
            var node = ts.getTouchingPropertyName(sourceFile, position);
            if (!node) {
                return undefined;
            }
            if (isLabelName(node)) {
                return undefined;
            }
            var typeChecker = program.getTypeChecker();
            var symbol = typeChecker.getSymbolAtLocation(node);
            if (!symbol) {
                switch (node.kind) {
                    case 65:
                    case 155:
                    case 126:
                    case 93:
                    case 91:
                        var type = typeChecker.getTypeAtLocation(node);
                        if (type) {
                            return {
                                kind: ScriptElementKind.unknown,
                                kindModifiers: ScriptElementKindModifier.none,
                                textSpan: ts.createTextSpan(node.getStart(), node.getWidth()),
                                displayParts: ts.typeToDisplayParts(typeChecker, type, getContainerNode(node)),
                                documentation: type.symbol ? type.symbol.getDocumentationComment() : undefined
                            };
                        }
                }
                return undefined;
            }
            var displayPartsDocumentationsAndKind = getSymbolDisplayPartsDocumentationAndSymbolKind(symbol, sourceFile, getContainerNode(node), node);
            return {
                kind: displayPartsDocumentationsAndKind.symbolKind,
                kindModifiers: getSymbolModifiers(symbol),
                textSpan: ts.createTextSpan(node.getStart(), node.getWidth()),
                displayParts: displayPartsDocumentationsAndKind.displayParts,
                documentation: displayPartsDocumentationsAndKind.documentation
            };
        }
        function createDefinitionInfo(node, symbolKind, symbolName, containerName) {
            return {
                fileName: node.getSourceFile().fileName,
                textSpan: ts.createTextSpanFromBounds(node.getStart(), node.getEnd()),
                kind: symbolKind,
                name: symbolName,
                containerKind: undefined,
                containerName: containerName
            };
        }
        function getDefinitionAtPosition(fileName, position) {
            synchronizeHostData();
            var sourceFile = getValidSourceFile(fileName);
            var node = ts.getTouchingPropertyName(sourceFile, position);
            if (!node) {
                return undefined;
            }
            if (isJumpStatementTarget(node)) {
                var labelName = node.text;
                var label = getTargetLabel(node.parent, node.text);
                return label ? [createDefinitionInfo(label, ScriptElementKind.label, labelName, undefined)] : undefined;
            }
            var comment = ts.forEach(sourceFile.referencedFiles, function (r) { return (r.pos <= position && position < r.end) ? r : undefined; });
            if (comment) {
                var referenceFile = ts.tryResolveScriptReference(program, sourceFile, comment);
                if (referenceFile) {
                    return [{
                            fileName: referenceFile.fileName,
                            textSpan: ts.createTextSpanFromBounds(0, 0),
                            kind: ScriptElementKind.scriptElement,
                            name: comment.fileName,
                            containerName: undefined,
                            containerKind: undefined
                        }];
                }
                return undefined;
            }
            var typeChecker = program.getTypeChecker();
            var symbol = typeChecker.getSymbolAtLocation(node);
            if (!symbol) {
                return undefined;
            }
            if (symbol.flags & 8388608) {
                var declaration = symbol.declarations[0];
                if (node.kind === 65 && node.parent === declaration) {
                    symbol = typeChecker.getAliasedSymbol(symbol);
                }
            }
            if (node.parent.kind === 225) {
                var shorthandSymbol = typeChecker.getShorthandAssignmentValueSymbol(symbol.valueDeclaration);
                if (!shorthandSymbol) {
                    return [];
                }
                var shorthandDeclarations = shorthandSymbol.getDeclarations();
                var shorthandSymbolKind = getSymbolKind(shorthandSymbol, node);
                var shorthandSymbolName = typeChecker.symbolToString(shorthandSymbol);
                var shorthandContainerName = typeChecker.symbolToString(symbol.parent, node);
                return ts.map(shorthandDeclarations, function (declaration) { return createDefinitionInfo(declaration, shorthandSymbolKind, shorthandSymbolName, shorthandContainerName); });
            }
            var result = [];
            var declarations = symbol.getDeclarations();
            var symbolName = typeChecker.symbolToString(symbol);
            var symbolKind = getSymbolKind(symbol, node);
            var containerSymbol = symbol.parent;
            var containerName = containerSymbol ? typeChecker.symbolToString(containerSymbol, node) : "";
            if (!tryAddConstructSignature(symbol, node, symbolKind, symbolName, containerName, result) &&
                !tryAddCallSignature(symbol, node, symbolKind, symbolName, containerName, result)) {
                ts.forEach(declarations, function (declaration) {
                    result.push(createDefinitionInfo(declaration, symbolKind, symbolName, containerName));
                });
            }
            return result;
            function tryAddConstructSignature(symbol, location, symbolKind, symbolName, containerName, result) {
                if (isNewExpressionTarget(location) || location.kind === 114) {
                    if (symbol.flags & 32) {
                        var classDeclaration = symbol.getDeclarations()[0];
                        ts.Debug.assert(classDeclaration && classDeclaration.kind === 201);
                        return tryAddSignature(classDeclaration.members, true, symbolKind, symbolName, containerName, result);
                    }
                }
                return false;
            }
            function tryAddCallSignature(symbol, location, symbolKind, symbolName, containerName, result) {
                if (isCallExpressionTarget(location) || isNewExpressionTarget(location) || isNameOfFunctionDeclaration(location)) {
                    return tryAddSignature(symbol.declarations, false, symbolKind, symbolName, containerName, result);
                }
                return false;
            }
            function tryAddSignature(signatureDeclarations, selectConstructors, symbolKind, symbolName, containerName, result) {
                var declarations = [];
                var definition;
                ts.forEach(signatureDeclarations, function (d) {
                    if ((selectConstructors && d.kind === 135) ||
                        (!selectConstructors && (d.kind === 200 || d.kind === 134 || d.kind === 133))) {
                        declarations.push(d);
                        if (d.body)
                            definition = d;
                    }
                });
                if (definition) {
                    result.push(createDefinitionInfo(definition, symbolKind, symbolName, containerName));
                    return true;
                }
                else if (declarations.length) {
                    result.push(createDefinitionInfo(declarations[declarations.length - 1], symbolKind, symbolName, containerName));
                    return true;
                }
                return false;
            }
        }
        function getOccurrencesAtPosition(fileName, position) {
            var results = getOccurrencesAtPositionCore(fileName, position);
            if (results) {
                var sourceFile = getCanonicalFileName(ts.normalizeSlashes(fileName));
                results = ts.filter(results, function (r) { return getCanonicalFileName(ts.normalizeSlashes(r.fileName)) === sourceFile; });
            }
            return results;
        }
        function getDocumentHighlights(fileName, position, filesToSearch) {
            synchronizeHostData();
            filesToSearch = ts.map(filesToSearch, ts.normalizeSlashes);
            var sourceFilesToSearch = ts.filter(program.getSourceFiles(), function (f) { return ts.contains(filesToSearch, f.fileName); });
            var sourceFile = getValidSourceFile(fileName);
            var node = ts.getTouchingWord(sourceFile, position);
            if (!node) {
                return undefined;
            }
            return getSemanticDocumentHighlights(node) || getSyntacticDocumentHighlights(node);
            function getHighlightSpanForNode(node) {
                var start = node.getStart();
                var end = node.getEnd();
                return {
                    fileName: sourceFile.fileName,
                    textSpan: ts.createTextSpanFromBounds(start, end),
                    kind: HighlightSpanKind.none
                };
            }
            function getSemanticDocumentHighlights(node) {
                if (node.kind === 65 ||
                    node.kind === 93 ||
                    node.kind === 91 ||
                    isLiteralNameOfPropertyDeclarationOrIndexAccess(node) ||
                    isNameOfExternalModuleImportOrDeclaration(node)) {
                    var referencedSymbols = getReferencedSymbolsForNodes(node, sourceFilesToSearch, false, false);
                    return convertReferencedSymbols(referencedSymbols);
                }
                return undefined;
                function convertReferencedSymbols(referencedSymbols) {
                    if (!referencedSymbols) {
                        return undefined;
                    }
                    var fileNameToDocumentHighlights = {};
                    var result = [];
                    for (var _i = 0; _i < referencedSymbols.length; _i++) {
                        var referencedSymbol = referencedSymbols[_i];
                        for (var _a = 0, _b = referencedSymbol.references; _a < _b.length; _a++) {
                            var referenceEntry = _b[_a];
                            var fileName_1 = referenceEntry.fileName;
                            var documentHighlights = ts.getProperty(fileNameToDocumentHighlights, fileName_1);
                            if (!documentHighlights) {
                                documentHighlights = { fileName: fileName_1, highlightSpans: [] };
                                fileNameToDocumentHighlights[fileName_1] = documentHighlights;
                                result.push(documentHighlights);
                            }
                            documentHighlights.highlightSpans.push({
                                textSpan: referenceEntry.textSpan,
                                kind: referenceEntry.isWriteAccess ? HighlightSpanKind.writtenReference : HighlightSpanKind.reference
                            });
                        }
                    }
                    return result;
                }
            }
            function getSyntacticDocumentHighlights(node) {
                var fileName = sourceFile.fileName;
                var highlightSpans = getHighlightSpans(node);
                if (!highlightSpans || highlightSpans.length === 0) {
                    return undefined;
                }
                return [{ fileName: fileName, highlightSpans: highlightSpans }];
                function hasKind(node, kind) {
                    return node !== undefined && node.kind === kind;
                }
                function parent(node) {
                    return node && node.parent;
                }
                function getHighlightSpans(node) {
                    if (node) {
                        switch (node.kind) {
                            case 84:
                            case 76:
                                if (hasKind(node.parent, 183)) {
                                    return getIfElseOccurrences(node.parent);
                                }
                                break;
                            case 90:
                                if (hasKind(node.parent, 191)) {
                                    return getReturnOccurrences(node.parent);
                                }
                                break;
                            case 94:
                                if (hasKind(node.parent, 195)) {
                                    return getThrowOccurrences(node.parent);
                                }
                                break;
                            case 68:
                                if (hasKind(parent(parent(node)), 196)) {
                                    return getTryCatchFinallyOccurrences(node.parent.parent);
                                }
                                break;
                            case 96:
                            case 81:
                                if (hasKind(parent(node), 196)) {
                                    return getTryCatchFinallyOccurrences(node.parent);
                                }
                                break;
                            case 92:
                                if (hasKind(node.parent, 193)) {
                                    return getSwitchCaseDefaultOccurrences(node.parent);
                                }
                                break;
                            case 67:
                            case 73:
                                if (hasKind(parent(parent(parent(node))), 193)) {
                                    return getSwitchCaseDefaultOccurrences(node.parent.parent.parent);
                                }
                                break;
                            case 66:
                            case 71:
                                if (hasKind(node.parent, 190) || hasKind(node.parent, 189)) {
                                    return getBreakOrContinueStatementOccurences(node.parent);
                                }
                                break;
                            case 82:
                                if (hasKind(node.parent, 186) ||
                                    hasKind(node.parent, 187) ||
                                    hasKind(node.parent, 188)) {
                                    return getLoopBreakContinueOccurrences(node.parent);
                                }
                                break;
                            case 100:
                            case 75:
                                if (hasKind(node.parent, 185) || hasKind(node.parent, 184)) {
                                    return getLoopBreakContinueOccurrences(node.parent);
                                }
                                break;
                            case 114:
                                if (hasKind(node.parent, 135)) {
                                    return getConstructorOccurrences(node.parent);
                                }
                                break;
                            case 116:
                            case 120:
                                if (hasKind(node.parent, 136) || hasKind(node.parent, 137)) {
                                    return getGetAndSetOccurrences(node.parent);
                                }
                            default:
                                if (ts.isModifier(node.kind) && node.parent &&
                                    (ts.isDeclaration(node.parent) || node.parent.kind === 180)) {
                                    return getModifierOccurrences(node.kind, node.parent);
                                }
                        }
                    }
                    return undefined;
                }
                function aggregateOwnedThrowStatements(node) {
                    var statementAccumulator = [];
                    aggregate(node);
                    return statementAccumulator;
                    function aggregate(node) {
                        if (node.kind === 195) {
                            statementAccumulator.push(node);
                        }
                        else if (node.kind === 196) {
                            var tryStatement = node;
                            if (tryStatement.catchClause) {
                                aggregate(tryStatement.catchClause);
                            }
                            else {
                                aggregate(tryStatement.tryBlock);
                            }
                            if (tryStatement.finallyBlock) {
                                aggregate(tryStatement.finallyBlock);
                            }
                        }
                        else if (!ts.isFunctionLike(node)) {
                            ts.forEachChild(node, aggregate);
                        }
                    }
                    ;
                }
                function getThrowStatementOwner(throwStatement) {
                    var child = throwStatement;
                    while (child.parent) {
                        var parent_3 = child.parent;
                        if (ts.isFunctionBlock(parent_3) || parent_3.kind === 227) {
                            return parent_3;
                        }
                        if (parent_3.kind === 196) {
                            var tryStatement = parent_3;
                            if (tryStatement.tryBlock === child && tryStatement.catchClause) {
                                return child;
                            }
                        }
                        child = parent_3;
                    }
                    return undefined;
                }
                function aggregateAllBreakAndContinueStatements(node) {
                    var statementAccumulator = [];
                    aggregate(node);
                    return statementAccumulator;
                    function aggregate(node) {
                        if (node.kind === 190 || node.kind === 189) {
                            statementAccumulator.push(node);
                        }
                        else if (!ts.isFunctionLike(node)) {
                            ts.forEachChild(node, aggregate);
                        }
                    }
                    ;
                }
                function ownsBreakOrContinueStatement(owner, statement) {
                    var actualOwner = getBreakOrContinueOwner(statement);
                    return actualOwner && actualOwner === owner;
                }
                function getBreakOrContinueOwner(statement) {
                    for (var node_1 = statement.parent; node_1; node_1 = node_1.parent) {
                        switch (node_1.kind) {
                            case 193:
                                if (statement.kind === 189) {
                                    continue;
                                }
                            case 186:
                            case 187:
                            case 188:
                            case 185:
                            case 184:
                                if (!statement.label || isLabeledBy(node_1, statement.label.text)) {
                                    return node_1;
                                }
                                break;
                            default:
                                if (ts.isFunctionLike(node_1)) {
                                    return undefined;
                                }
                                break;
                        }
                    }
                    return undefined;
                }
                function getModifierOccurrences(modifier, declaration) {
                    var container = declaration.parent;
                    if (ts.isAccessibilityModifier(modifier)) {
                        if (!(container.kind === 201 ||
                            (declaration.kind === 129 && hasKind(container, 135)))) {
                            return undefined;
                        }
                    }
                    else if (modifier === 109) {
                        if (container.kind !== 201) {
                            return undefined;
                        }
                    }
                    else if (modifier === 78 || modifier === 115) {
                        if (!(container.kind === 206 || container.kind === 227)) {
                            return undefined;
                        }
                    }
                    else {
                        return undefined;
                    }
                    var keywords = [];
                    var modifierFlag = getFlagFromModifier(modifier);
                    var nodes;
                    switch (container.kind) {
                        case 206:
                        case 227:
                            nodes = container.statements;
                            break;
                        case 135:
                            nodes = container.parameters.concat(container.parent.members);
                            break;
                        case 201:
                            nodes = container.members;
                            if (modifierFlag & 112) {
                                var constructor = ts.forEach(container.members, function (member) {
                                    return member.kind === 135 && member;
                                });
                                if (constructor) {
                                    nodes = nodes.concat(constructor.parameters);
                                }
                            }
                            break;
                        default:
                            ts.Debug.fail("Invalid container kind.");
                    }
                    ts.forEach(nodes, function (node) {
                        if (node.modifiers && node.flags & modifierFlag) {
                            ts.forEach(node.modifiers, function (child) { return pushKeywordIf(keywords, child, modifier); });
                        }
                    });
                    return ts.map(keywords, getHighlightSpanForNode);
                    function getFlagFromModifier(modifier) {
                        switch (modifier) {
                            case 108:
                                return 16;
                            case 106:
                                return 32;
                            case 107:
                                return 64;
                            case 109:
                                return 128;
                            case 78:
                                return 1;
                            case 115:
                                return 2;
                            default:
                                ts.Debug.fail();
                        }
                    }
                }
                function pushKeywordIf(keywordList, token) {
                    var expected = [];
                    for (var _i = 2; _i < arguments.length; _i++) {
                        expected[_i - 2] = arguments[_i];
                    }
                    if (token && ts.contains(expected, token.kind)) {
                        keywordList.push(token);
                        return true;
                    }
                    return false;
                }
                function getGetAndSetOccurrences(accessorDeclaration) {
                    var keywords = [];
                    tryPushAccessorKeyword(accessorDeclaration.symbol, 136);
                    tryPushAccessorKeyword(accessorDeclaration.symbol, 137);
                    return ts.map(keywords, getHighlightSpanForNode);
                    function tryPushAccessorKeyword(accessorSymbol, accessorKind) {
                        var accessor = ts.getDeclarationOfKind(accessorSymbol, accessorKind);
                        if (accessor) {
                            ts.forEach(accessor.getChildren(), function (child) { return pushKeywordIf(keywords, child, 116, 120); });
                        }
                    }
                }
                function getConstructorOccurrences(constructorDeclaration) {
                    var declarations = constructorDeclaration.symbol.getDeclarations();
                    var keywords = [];
                    ts.forEach(declarations, function (declaration) {
                        ts.forEach(declaration.getChildren(), function (token) {
                            return pushKeywordIf(keywords, token, 114);
                        });
                    });
                    return ts.map(keywords, getHighlightSpanForNode);
                }
                function getLoopBreakContinueOccurrences(loopNode) {
                    var keywords = [];
                    if (pushKeywordIf(keywords, loopNode.getFirstToken(), 82, 100, 75)) {
                        if (loopNode.kind === 184) {
                            var loopTokens = loopNode.getChildren();
                            for (var i = loopTokens.length - 1; i >= 0; i--) {
                                if (pushKeywordIf(keywords, loopTokens[i], 100)) {
                                    break;
                                }
                            }
                        }
                    }
                    var breaksAndContinues = aggregateAllBreakAndContinueStatements(loopNode.statement);
                    ts.forEach(breaksAndContinues, function (statement) {
                        if (ownsBreakOrContinueStatement(loopNode, statement)) {
                            pushKeywordIf(keywords, statement.getFirstToken(), 66, 71);
                        }
                    });
                    return ts.map(keywords, getHighlightSpanForNode);
                }
                function getBreakOrContinueStatementOccurences(breakOrContinueStatement) {
                    var owner = getBreakOrContinueOwner(breakOrContinueStatement);
                    if (owner) {
                        switch (owner.kind) {
                            case 186:
                            case 187:
                            case 188:
                            case 184:
                            case 185:
                                return getLoopBreakContinueOccurrences(owner);
                            case 193:
                                return getSwitchCaseDefaultOccurrences(owner);
                        }
                    }
                    return undefined;
                }
                function getSwitchCaseDefaultOccurrences(switchStatement) {
                    var keywords = [];
                    pushKeywordIf(keywords, switchStatement.getFirstToken(), 92);
                    ts.forEach(switchStatement.caseBlock.clauses, function (clause) {
                        pushKeywordIf(keywords, clause.getFirstToken(), 67, 73);
                        var breaksAndContinues = aggregateAllBreakAndContinueStatements(clause);
                        ts.forEach(breaksAndContinues, function (statement) {
                            if (ownsBreakOrContinueStatement(switchStatement, statement)) {
                                pushKeywordIf(keywords, statement.getFirstToken(), 66);
                            }
                        });
                    });
                    return ts.map(keywords, getHighlightSpanForNode);
                }
                function getTryCatchFinallyOccurrences(tryStatement) {
                    var keywords = [];
                    pushKeywordIf(keywords, tryStatement.getFirstToken(), 96);
                    if (tryStatement.catchClause) {
                        pushKeywordIf(keywords, tryStatement.catchClause.getFirstToken(), 68);
                    }
                    if (tryStatement.finallyBlock) {
                        var finallyKeyword = ts.findChildOfKind(tryStatement, 81, sourceFile);
                        pushKeywordIf(keywords, finallyKeyword, 81);
                    }
                    return ts.map(keywords, getHighlightSpanForNode);
                }
                function getThrowOccurrences(throwStatement) {
                    var owner = getThrowStatementOwner(throwStatement);
                    if (!owner) {
                        return undefined;
                    }
                    var keywords = [];
                    ts.forEach(aggregateOwnedThrowStatements(owner), function (throwStatement) {
                        pushKeywordIf(keywords, throwStatement.getFirstToken(), 94);
                    });
                    if (ts.isFunctionBlock(owner)) {
                        ts.forEachReturnStatement(owner, function (returnStatement) {
                            pushKeywordIf(keywords, returnStatement.getFirstToken(), 90);
                        });
                    }
                    return ts.map(keywords, getHighlightSpanForNode);
                }
                function getReturnOccurrences(returnStatement) {
                    var func = ts.getContainingFunction(returnStatement);
                    if (!(func && hasKind(func.body, 179))) {
                        return undefined;
                    }
                    var keywords = [];
                    ts.forEachReturnStatement(func.body, function (returnStatement) {
                        pushKeywordIf(keywords, returnStatement.getFirstToken(), 90);
                    });
                    ts.forEach(aggregateOwnedThrowStatements(func.body), function (throwStatement) {
                        pushKeywordIf(keywords, throwStatement.getFirstToken(), 94);
                    });
                    return ts.map(keywords, getHighlightSpanForNode);
                }
                function getIfElseOccurrences(ifStatement) {
                    var keywords = [];
                    while (hasKind(ifStatement.parent, 183) && ifStatement.parent.elseStatement === ifStatement) {
                        ifStatement = ifStatement.parent;
                    }
                    while (ifStatement) {
                        var children = ifStatement.getChildren();
                        pushKeywordIf(keywords, children[0], 84);
                        for (var i = children.length - 1; i >= 0; i--) {
                            if (pushKeywordIf(keywords, children[i], 76)) {
                                break;
                            }
                        }
                        if (!hasKind(ifStatement.elseStatement, 183)) {
                            break;
                        }
                        ifStatement = ifStatement.elseStatement;
                    }
                    var result = [];
                    for (var i = 0; i < keywords.length; i++) {
                        if (keywords[i].kind === 76 && i < keywords.length - 1) {
                            var elseKeyword = keywords[i];
                            var ifKeyword = keywords[i + 1];
                            var shouldCombindElseAndIf = true;
                            for (var j = ifKeyword.getStart() - 1; j >= elseKeyword.end; j--) {
                                if (!ts.isWhiteSpace(sourceFile.text.charCodeAt(j))) {
                                    shouldCombindElseAndIf = false;
                                    break;
                                }
                            }
                            if (shouldCombindElseAndIf) {
                                result.push({
                                    fileName: fileName,
                                    textSpan: ts.createTextSpanFromBounds(elseKeyword.getStart(), ifKeyword.end),
                                    kind: HighlightSpanKind.reference
                                });
                                i++;
                                continue;
                            }
                        }
                        result.push(getHighlightSpanForNode(keywords[i]));
                    }
                    return result;
                }
            }
        }
        function getOccurrencesAtPositionCore(fileName, position) {
            synchronizeHostData();
            return convertDocumentHighlights(getDocumentHighlights(fileName, position, [fileName]));
            function convertDocumentHighlights(documentHighlights) {
                if (!documentHighlights) {
                    return undefined;
                }
                var result = [];
                for (var _i = 0; _i < documentHighlights.length; _i++) {
                    var entry = documentHighlights[_i];
                    for (var _a = 0, _b = entry.highlightSpans; _a < _b.length; _a++) {
                        var highlightSpan = _b[_a];
                        result.push({
                            fileName: entry.fileName,
                            textSpan: highlightSpan.textSpan,
                            isWriteAccess: highlightSpan.kind === HighlightSpanKind.writtenReference
                        });
                    }
                }
                return result;
            }
        }
        function convertReferences(referenceSymbols) {
            if (!referenceSymbols) {
                return undefined;
            }
            var referenceEntries = [];
            for (var _i = 0; _i < referenceSymbols.length; _i++) {
                var referenceSymbol = referenceSymbols[_i];
                ts.addRange(referenceEntries, referenceSymbol.references);
            }
            return referenceEntries;
        }
        function findRenameLocations(fileName, position, findInStrings, findInComments) {
            var referencedSymbols = findReferencedSymbols(fileName, position, findInStrings, findInComments);
            return convertReferences(referencedSymbols);
        }
        function getReferencesAtPosition(fileName, position) {
            var referencedSymbols = findReferencedSymbols(fileName, position, false, false);
            return convertReferences(referencedSymbols);
        }
        function findReferences(fileName, position) {
            var referencedSymbols = findReferencedSymbols(fileName, position, false, false);
            return ts.filter(referencedSymbols, function (rs) { return !!rs.definition; });
        }
        function findReferencedSymbols(fileName, position, findInStrings, findInComments) {
            synchronizeHostData();
            var sourceFile = getValidSourceFile(fileName);
            var node = ts.getTouchingPropertyName(sourceFile, position);
            if (!node) {
                return undefined;
            }
            if (node.kind !== 65 &&
                !isLiteralNameOfPropertyDeclarationOrIndexAccess(node) &&
                !isNameOfExternalModuleImportOrDeclaration(node)) {
                return undefined;
            }
            ts.Debug.assert(node.kind === 65 || node.kind === 7 || node.kind === 8);
            return getReferencedSymbolsForNodes(node, program.getSourceFiles(), findInStrings, findInComments);
        }
        function getReferencedSymbolsForNodes(node, sourceFiles, findInStrings, findInComments) {
            var typeChecker = program.getTypeChecker();
            if (isLabelName(node)) {
                if (isJumpStatementTarget(node)) {
                    var labelDefinition = getTargetLabel(node.parent, node.text);
                    return labelDefinition ? getLabelReferencesInNode(labelDefinition.parent, labelDefinition) : undefined;
                }
                else {
                    return getLabelReferencesInNode(node.parent, node);
                }
            }
            if (node.kind === 93) {
                return getReferencesForThisKeyword(node, sourceFiles);
            }
            if (node.kind === 91) {
                return getReferencesForSuperKeyword(node);
            }
            var symbol = typeChecker.getSymbolAtLocation(node);
            if (!symbol) {
                return undefined;
            }
            var declarations = symbol.declarations;
            if (!declarations || !declarations.length) {
                return undefined;
            }
            var result;
            var searchMeaning = getIntersectingMeaningFromDeclarations(getMeaningFromLocation(node), declarations);
            var declaredName = getDeclaredName(symbol, node);
            var scope = getSymbolScope(symbol);
            var symbolToIndex = [];
            if (scope) {
                result = [];
                getReferencesInNode(scope, symbol, declaredName, node, searchMeaning, findInStrings, findInComments, result, symbolToIndex);
            }
            else {
                var internedName = getInternedName(symbol, node, declarations);
                for (var _i = 0; _i < sourceFiles.length; _i++) {
                    var sourceFile = sourceFiles[_i];
                    cancellationToken.throwIfCancellationRequested();
                    var nameTable = getNameTable(sourceFile);
                    if (ts.lookUp(nameTable, internedName)) {
                        result = result || [];
                        getReferencesInNode(sourceFile, symbol, declaredName, node, searchMeaning, findInStrings, findInComments, result, symbolToIndex);
                    }
                }
            }
            return result;
            function getDefinition(symbol) {
                var info = getSymbolDisplayPartsDocumentationAndSymbolKind(symbol, node.getSourceFile(), getContainerNode(node), node);
                var name = ts.map(info.displayParts, function (p) { return p.text; }).join("");
                var declarations = symbol.declarations;
                if (!declarations || declarations.length === 0) {
                    return undefined;
                }
                return {
                    containerKind: "",
                    containerName: "",
                    name: name,
                    kind: info.symbolKind,
                    fileName: declarations[0].getSourceFile().fileName,
                    textSpan: ts.createTextSpan(declarations[0].getStart(), 0)
                };
            }
            function isImportOrExportSpecifierName(location) {
                return location.parent &&
                    (location.parent.kind === 213 || location.parent.kind === 217) &&
                    location.parent.propertyName === location;
            }
            function isImportOrExportSpecifierImportSymbol(symbol) {
                return (symbol.flags & 8388608) && ts.forEach(symbol.declarations, function (declaration) {
                    return declaration.kind === 213 || declaration.kind === 217;
                });
            }
            function getDeclaredName(symbol, location) {
                var functionExpression = ts.forEach(symbol.declarations, function (d) { return d.kind === 162 ? d : undefined; });
                var name;
                if (functionExpression && functionExpression.name) {
                    name = functionExpression.name.text;
                }
                if (isImportOrExportSpecifierName(location)) {
                    return location.getText();
                }
                name = typeChecker.symbolToString(symbol);
                return stripQuotes(name);
            }
            function getInternedName(symbol, location, declarations) {
                if (isImportOrExportSpecifierName(location)) {
                    return location.getText();
                }
                var functionExpression = ts.forEach(declarations, function (d) { return d.kind === 162 ? d : undefined; });
                var name = functionExpression && functionExpression.name
                    ? functionExpression.name.text
                    : symbol.name;
                return stripQuotes(name);
            }
            function stripQuotes(name) {
                var length = name.length;
                if (length >= 2 && name.charCodeAt(0) === 34 && name.charCodeAt(length - 1) === 34) {
                    return name.substring(1, length - 1);
                }
                ;
                return name;
            }
            function getSymbolScope(symbol) {
                if (symbol.flags & (4 | 8192)) {
                    var privateDeclaration = ts.forEach(symbol.getDeclarations(), function (d) { return (d.flags & 32) ? d : undefined; });
                    if (privateDeclaration) {
                        return ts.getAncestor(privateDeclaration, 201);
                    }
                }
                if (symbol.flags & 8388608) {
                    return undefined;
                }
                if (symbol.parent || (symbol.flags & 268435456)) {
                    return undefined;
                }
                var scope = undefined;
                var declarations = symbol.getDeclarations();
                if (declarations) {
                    for (var _i = 0; _i < declarations.length; _i++) {
                        var declaration = declarations[_i];
                        var container = getContainerNode(declaration);
                        if (!container) {
                            return undefined;
                        }
                        if (scope && scope !== container) {
                            return undefined;
                        }
                        if (container.kind === 227 && !ts.isExternalModule(container)) {
                            return undefined;
                        }
                        scope = container;
                    }
                }
                return scope;
            }
            function getPossibleSymbolReferencePositions(sourceFile, symbolName, start, end) {
                var positions = [];
                if (!symbolName || !symbolName.length) {
                    return positions;
                }
                var text = sourceFile.text;
                var sourceLength = text.length;
                var symbolNameLength = symbolName.length;
                var position = text.indexOf(symbolName, start);
                while (position >= 0) {
                    cancellationToken.throwIfCancellationRequested();
                    if (position > end)
                        break;
                    var endPosition = position + symbolNameLength;
                    if ((position === 0 || !ts.isIdentifierPart(text.charCodeAt(position - 1), 2)) &&
                        (endPosition === sourceLength || !ts.isIdentifierPart(text.charCodeAt(endPosition), 2))) {
                        positions.push(position);
                    }
                    position = text.indexOf(symbolName, position + symbolNameLength + 1);
                }
                return positions;
            }
            function getLabelReferencesInNode(container, targetLabel) {
                var references = [];
                var sourceFile = container.getSourceFile();
                var labelName = targetLabel.text;
                var possiblePositions = getPossibleSymbolReferencePositions(sourceFile, labelName, container.getStart(), container.getEnd());
                ts.forEach(possiblePositions, function (position) {
                    cancellationToken.throwIfCancellationRequested();
                    var node = ts.getTouchingWord(sourceFile, position);
                    if (!node || node.getWidth() !== labelName.length) {
                        return;
                    }
                    if (node === targetLabel ||
                        (isJumpStatementTarget(node) && getTargetLabel(node, labelName) === targetLabel)) {
                        references.push(getReferenceEntryFromNode(node));
                    }
                });
                var definition = {
                    containerKind: "",
                    containerName: "",
                    fileName: targetLabel.getSourceFile().fileName,
                    kind: ScriptElementKind.label,
                    name: labelName,
                    textSpan: ts.createTextSpanFromBounds(targetLabel.getStart(), targetLabel.getEnd())
                };
                return [{ definition: definition, references: references }];
            }
            function isValidReferencePosition(node, searchSymbolName) {
                if (node) {
                    switch (node.kind) {
                        case 65:
                            return node.getWidth() === searchSymbolName.length;
                        case 8:
                            if (isLiteralNameOfPropertyDeclarationOrIndexAccess(node) ||
                                isNameOfExternalModuleImportOrDeclaration(node)) {
                                return node.getWidth() === searchSymbolName.length + 2;
                            }
                            break;
                        case 7:
                            if (isLiteralNameOfPropertyDeclarationOrIndexAccess(node)) {
                                return node.getWidth() === searchSymbolName.length;
                            }
                            break;
                    }
                }
                return false;
            }
            function getReferencesInNode(container, searchSymbol, searchText, searchLocation, searchMeaning, findInStrings, findInComments, result, symbolToIndex) {
                var sourceFile = container.getSourceFile();
                var tripleSlashDirectivePrefixRegex = /^\/\/\/\s*</;
                var possiblePositions = getPossibleSymbolReferencePositions(sourceFile, searchText, container.getStart(), container.getEnd());
                if (possiblePositions.length) {
                    var searchSymbols = populateSearchSymbolSet(searchSymbol, searchLocation);
                    ts.forEach(possiblePositions, function (position) {
                        cancellationToken.throwIfCancellationRequested();
                        var referenceLocation = ts.getTouchingPropertyName(sourceFile, position);
                        if (!isValidReferencePosition(referenceLocation, searchText)) {
                            if ((findInStrings && isInString(position)) ||
                                (findInComments && isInComment(position))) {
                                result.push({
                                    definition: undefined,
                                    references: [{
                                            fileName: sourceFile.fileName,
                                            textSpan: ts.createTextSpan(position, searchText.length),
                                            isWriteAccess: false
                                        }]
                                });
                            }
                            return;
                        }
                        if (!(getMeaningFromLocation(referenceLocation) & searchMeaning)) {
                            return;
                        }
                        var referenceSymbol = typeChecker.getSymbolAtLocation(referenceLocation);
                        if (referenceSymbol) {
                            var referenceSymbolDeclaration = referenceSymbol.valueDeclaration;
                            var shorthandValueSymbol = typeChecker.getShorthandAssignmentValueSymbol(referenceSymbolDeclaration);
                            var relatedSymbol = getRelatedSymbol(searchSymbols, referenceSymbol, referenceLocation);
                            if (relatedSymbol) {
                                var referencedSymbol = getReferencedSymbol(relatedSymbol);
                                referencedSymbol.references.push(getReferenceEntryFromNode(referenceLocation));
                            }
                            else if (!(referenceSymbol.flags & 67108864) && searchSymbols.indexOf(shorthandValueSymbol) >= 0) {
                                var referencedSymbol = getReferencedSymbol(shorthandValueSymbol);
                                referencedSymbol.references.push(getReferenceEntryFromNode(referenceSymbolDeclaration.name));
                            }
                        }
                    });
                }
                return;
                function getReferencedSymbol(symbol) {
                    var symbolId = ts.getSymbolId(symbol);
                    var index = symbolToIndex[symbolId];
                    if (index === undefined) {
                        index = result.length;
                        symbolToIndex[symbolId] = index;
                        result.push({
                            definition: getDefinition(symbol),
                            references: []
                        });
                    }
                    return result[index];
                }
                function isInString(position) {
                    var token = ts.getTokenAtPosition(sourceFile, position);
                    return token && token.kind === 8 && position > token.getStart();
                }
                function isInComment(position) {
                    var token = ts.getTokenAtPosition(sourceFile, position);
                    if (token && position < token.getStart()) {
                        var commentRanges = ts.getLeadingCommentRanges(sourceFile.text, token.pos);
                        return ts.forEach(commentRanges, function (c) {
                            if (c.pos < position && position < c.end) {
                                var commentText = sourceFile.text.substring(c.pos, c.end);
                                if (!tripleSlashDirectivePrefixRegex.test(commentText)) {
                                    return true;
                                }
                            }
                        });
                    }
                    return false;
                }
            }
            function getReferencesForSuperKeyword(superKeyword) {
                var searchSpaceNode = ts.getSuperContainer(superKeyword, false);
                if (!searchSpaceNode) {
                    return undefined;
                }
                var staticFlag = 128;
                switch (searchSpaceNode.kind) {
                    case 132:
                    case 131:
                    case 134:
                    case 133:
                    case 135:
                    case 136:
                    case 137:
                        staticFlag &= searchSpaceNode.flags;
                        searchSpaceNode = searchSpaceNode.parent;
                        break;
                    default:
                        return undefined;
                }
                var references = [];
                var sourceFile = searchSpaceNode.getSourceFile();
                var possiblePositions = getPossibleSymbolReferencePositions(sourceFile, "super", searchSpaceNode.getStart(), searchSpaceNode.getEnd());
                ts.forEach(possiblePositions, function (position) {
                    cancellationToken.throwIfCancellationRequested();
                    var node = ts.getTouchingWord(sourceFile, position);
                    if (!node || node.kind !== 91) {
                        return;
                    }
                    var container = ts.getSuperContainer(node, false);
                    if (container && (128 & container.flags) === staticFlag && container.parent.symbol === searchSpaceNode.symbol) {
                        references.push(getReferenceEntryFromNode(node));
                    }
                });
                var definition = getDefinition(searchSpaceNode.symbol);
                return [{ definition: definition, references: references }];
            }
            function getReferencesForThisKeyword(thisOrSuperKeyword, sourceFiles) {
                var searchSpaceNode = ts.getThisContainer(thisOrSuperKeyword, false);
                var staticFlag = 128;
                switch (searchSpaceNode.kind) {
                    case 134:
                    case 133:
                        if (ts.isObjectLiteralMethod(searchSpaceNode)) {
                            break;
                        }
                    case 132:
                    case 131:
                    case 135:
                    case 136:
                    case 137:
                        staticFlag &= searchSpaceNode.flags;
                        searchSpaceNode = searchSpaceNode.parent;
                        break;
                    case 227:
                        if (ts.isExternalModule(searchSpaceNode)) {
                            return undefined;
                        }
                    case 200:
                    case 162:
                        break;
                    default:
                        return undefined;
                }
                var references = [];
                var possiblePositions;
                if (searchSpaceNode.kind === 227) {
                    ts.forEach(sourceFiles, function (sourceFile) {
                        possiblePositions = getPossibleSymbolReferencePositions(sourceFile, "this", sourceFile.getStart(), sourceFile.getEnd());
                        getThisReferencesInFile(sourceFile, sourceFile, possiblePositions, references);
                    });
                }
                else {
                    var sourceFile = searchSpaceNode.getSourceFile();
                    possiblePositions = getPossibleSymbolReferencePositions(sourceFile, "this", searchSpaceNode.getStart(), searchSpaceNode.getEnd());
                    getThisReferencesInFile(sourceFile, searchSpaceNode, possiblePositions, references);
                }
                return [{
                        definition: {
                            containerKind: "",
                            containerName: "",
                            fileName: node.getSourceFile().fileName,
                            kind: ScriptElementKind.variableElement,
                            name: "this",
                            textSpan: ts.createTextSpanFromBounds(node.getStart(), node.getEnd())
                        },
                        references: references
                    }];
                function getThisReferencesInFile(sourceFile, searchSpaceNode, possiblePositions, result) {
                    ts.forEach(possiblePositions, function (position) {
                        cancellationToken.throwIfCancellationRequested();
                        var node = ts.getTouchingWord(sourceFile, position);
                        if (!node || node.kind !== 93) {
                            return;
                        }
                        var container = ts.getThisContainer(node, false);
                        switch (searchSpaceNode.kind) {
                            case 162:
                            case 200:
                                if (searchSpaceNode.symbol === container.symbol) {
                                    result.push(getReferenceEntryFromNode(node));
                                }
                                break;
                            case 134:
                            case 133:
                                if (ts.isObjectLiteralMethod(searchSpaceNode) && searchSpaceNode.symbol === container.symbol) {
                                    result.push(getReferenceEntryFromNode(node));
                                }
                                break;
                            case 201:
                                if (container.parent && searchSpaceNode.symbol === container.parent.symbol && (container.flags & 128) === staticFlag) {
                                    result.push(getReferenceEntryFromNode(node));
                                }
                                break;
                            case 227:
                                if (container.kind === 227 && !ts.isExternalModule(container)) {
                                    result.push(getReferenceEntryFromNode(node));
                                }
                                break;
                        }
                    });
                }
            }
            function populateSearchSymbolSet(symbol, location) {
                var result = [symbol];
                if (isImportOrExportSpecifierImportSymbol(symbol)) {
                    result.push(typeChecker.getAliasedSymbol(symbol));
                }
                if (isNameOfPropertyAssignment(location)) {
                    ts.forEach(getPropertySymbolsFromContextualType(location), function (contextualSymbol) {
                        result.push.apply(result, typeChecker.getRootSymbols(contextualSymbol));
                    });
                    var shorthandValueSymbol = typeChecker.getShorthandAssignmentValueSymbol(location.parent);
                    if (shorthandValueSymbol) {
                        result.push(shorthandValueSymbol);
                    }
                }
                ts.forEach(typeChecker.getRootSymbols(symbol), function (rootSymbol) {
                    if (rootSymbol !== symbol) {
                        result.push(rootSymbol);
                    }
                    if (rootSymbol.parent && rootSymbol.parent.flags & (32 | 64)) {
                        getPropertySymbolsFromBaseTypes(rootSymbol.parent, rootSymbol.getName(), result);
                    }
                });
                return result;
            }
            function getPropertySymbolsFromBaseTypes(symbol, propertyName, result) {
                if (symbol && symbol.flags & (32 | 64)) {
                    ts.forEach(symbol.getDeclarations(), function (declaration) {
                        if (declaration.kind === 201) {
                            getPropertySymbolFromTypeReference(ts.getClassExtendsHeritageClauseElement(declaration));
                            ts.forEach(ts.getClassImplementsHeritageClauseElements(declaration), getPropertySymbolFromTypeReference);
                        }
                        else if (declaration.kind === 202) {
                            ts.forEach(ts.getInterfaceBaseTypeNodes(declaration), getPropertySymbolFromTypeReference);
                        }
                    });
                }
                return;
                function getPropertySymbolFromTypeReference(typeReference) {
                    if (typeReference) {
                        var type = typeChecker.getTypeAtLocation(typeReference);
                        if (type) {
                            var propertySymbol = typeChecker.getPropertyOfType(type, propertyName);
                            if (propertySymbol) {
                                result.push(propertySymbol);
                            }
                            getPropertySymbolsFromBaseTypes(type.symbol, propertyName, result);
                        }
                    }
                }
            }
            function getRelatedSymbol(searchSymbols, referenceSymbol, referenceLocation) {
                if (searchSymbols.indexOf(referenceSymbol) >= 0) {
                    return referenceSymbol;
                }
                if (isImportOrExportSpecifierImportSymbol(referenceSymbol)) {
                    var aliasedSymbol = typeChecker.getAliasedSymbol(referenceSymbol);
                    if (searchSymbols.indexOf(aliasedSymbol) >= 0) {
                        return aliasedSymbol;
                    }
                }
                if (isNameOfPropertyAssignment(referenceLocation)) {
                    return ts.forEach(getPropertySymbolsFromContextualType(referenceLocation), function (contextualSymbol) {
                        return ts.forEach(typeChecker.getRootSymbols(contextualSymbol), function (s) { return searchSymbols.indexOf(s) >= 0 ? s : undefined; });
                    });
                }
                return ts.forEach(typeChecker.getRootSymbols(referenceSymbol), function (rootSymbol) {
                    if (searchSymbols.indexOf(rootSymbol) >= 0) {
                        return rootSymbol;
                    }
                    if (rootSymbol.parent && rootSymbol.parent.flags & (32 | 64)) {
                        var result_2 = [];
                        getPropertySymbolsFromBaseTypes(rootSymbol.parent, rootSymbol.getName(), result_2);
                        return ts.forEach(result_2, function (s) { return searchSymbols.indexOf(s) >= 0 ? s : undefined; });
                    }
                    return undefined;
                });
            }
            function getPropertySymbolsFromContextualType(node) {
                if (isNameOfPropertyAssignment(node)) {
                    var objectLiteral = node.parent.parent;
                    var contextualType = typeChecker.getContextualType(objectLiteral);
                    var name_2 = node.text;
                    if (contextualType) {
                        if (contextualType.flags & 16384) {
                            var unionProperty = contextualType.getProperty(name_2);
                            if (unionProperty) {
                                return [unionProperty];
                            }
                            else {
                                var result_3 = [];
                                ts.forEach(contextualType.types, function (t) {
                                    var symbol = t.getProperty(name_2);
                                    if (symbol) {
                                        result_3.push(symbol);
                                    }
                                });
                                return result_3;
                            }
                        }
                        else {
                            var symbol_1 = contextualType.getProperty(name_2);
                            if (symbol_1) {
                                return [symbol_1];
                            }
                        }
                    }
                }
                return undefined;
            }
            function getIntersectingMeaningFromDeclarations(meaning, declarations) {
                if (declarations) {
                    var lastIterationMeaning;
                    do {
                        lastIterationMeaning = meaning;
                        for (var _i = 0; _i < declarations.length; _i++) {
                            var declaration = declarations[_i];
                            var declarationMeaning = getMeaningFromDeclaration(declaration);
                            if (declarationMeaning & meaning) {
                                meaning |= declarationMeaning;
                            }
                        }
                    } while (meaning !== lastIterationMeaning);
                }
                return meaning;
            }
        }
        function getReferenceEntryFromNode(node) {
            var start = node.getStart();
            var end = node.getEnd();
            if (node.kind === 8) {
                start += 1;
                end -= 1;
            }
            return {
                fileName: node.getSourceFile().fileName,
                textSpan: ts.createTextSpanFromBounds(start, end),
                isWriteAccess: isWriteAccess(node)
            };
        }
        function isWriteAccess(node) {
            if (node.kind === 65 && ts.isDeclarationName(node)) {
                return true;
            }
            var parent = node.parent;
            if (parent) {
                if (parent.kind === 168 || parent.kind === 167) {
                    return true;
                }
                else if (parent.kind === 169 && parent.left === node) {
                    var operator = parent.operatorToken.kind;
                    return 53 <= operator && operator <= 64;
                }
            }
            return false;
        }
        function getNavigateToItems(searchValue, maxResultCount) {
            synchronizeHostData();
            return ts.NavigateTo.getNavigateToItems(program, cancellationToken, searchValue, maxResultCount);
        }
        function containErrors(diagnostics) {
            return ts.forEach(diagnostics, function (diagnostic) { return diagnostic.category === ts.DiagnosticCategory.Error; });
        }
        function getEmitOutput(fileName) {
            synchronizeHostData();
            var sourceFile = getValidSourceFile(fileName);
            var outputFiles = [];
            function writeFile(fileName, data, writeByteOrderMark) {
                outputFiles.push({
                    name: fileName,
                    writeByteOrderMark: writeByteOrderMark,
                    text: data
                });
            }
            var emitOutput = program.emit(sourceFile, writeFile);
            return {
                outputFiles: outputFiles,
                emitSkipped: emitOutput.emitSkipped
            };
        }
        function getMeaningFromDeclaration(node) {
            switch (node.kind) {
                case 129:
                case 198:
                case 152:
                case 132:
                case 131:
                case 224:
                case 225:
                case 226:
                case 134:
                case 133:
                case 135:
                case 136:
                case 137:
                case 200:
                case 162:
                case 163:
                case 223:
                    return 1;
                case 128:
                case 202:
                case 203:
                case 145:
                    return 2;
                case 201:
                case 204:
                    return 1 | 2;
                case 205:
                    if (node.name.kind === 8) {
                        return 4 | 1;
                    }
                    else if (ts.getModuleInstanceState(node) === 1) {
                        return 4 | 1;
                    }
                    else {
                        return 4;
                    }
                case 212:
                case 213:
                case 208:
                case 209:
                case 214:
                case 215:
                    return 1 | 2 | 4;
                case 227:
                    return 4 | 1;
            }
            return 1 | 2 | 4;
            ts.Debug.fail("Unknown declaration type");
        }
        function isTypeReference(node) {
            if (ts.isRightSideOfQualifiedNameOrPropertyAccess(node)) {
                node = node.parent;
            }
            return node.parent.kind === 141 || node.parent.kind === 177;
        }
        function isNamespaceReference(node) {
            return isQualifiedNameNamespaceReference(node) || isPropertyAccessNamespaceReference(node);
        }
        function isPropertyAccessNamespaceReference(node) {
            var root = node;
            var isLastClause = true;
            if (root.parent.kind === 155) {
                while (root.parent && root.parent.kind === 155) {
                    root = root.parent;
                }
                isLastClause = root.name === node;
            }
            if (!isLastClause && root.parent.kind === 177 && root.parent.parent.kind === 222) {
                var decl = root.parent.parent.parent;
                return (decl.kind === 201 && root.parent.parent.token === 102) ||
                    (decl.kind === 202 && root.parent.parent.token === 79);
            }
            return false;
        }
        function isQualifiedNameNamespaceReference(node) {
            var root = node;
            var isLastClause = true;
            if (root.parent.kind === 126) {
                while (root.parent && root.parent.kind === 126) {
                    root = root.parent;
                }
                isLastClause = root.right === node;
            }
            return root.parent.kind === 141 && !isLastClause;
        }
        function isInRightSideOfImport(node) {
            while (node.parent.kind === 126) {
                node = node.parent;
            }
            return ts.isInternalModuleImportEqualsDeclaration(node.parent) && node.parent.moduleReference === node;
        }
        function getMeaningFromRightHandSideOfImportEquals(node) {
            ts.Debug.assert(node.kind === 65);
            if (node.parent.kind === 126 &&
                node.parent.right === node &&
                node.parent.parent.kind === 208) {
                return 1 | 2 | 4;
            }
            return 4;
        }
        function getMeaningFromLocation(node) {
            if (node.parent.kind === 214) {
                return 1 | 2 | 4;
            }
            else if (isInRightSideOfImport(node)) {
                return getMeaningFromRightHandSideOfImportEquals(node);
            }
            else if (ts.isDeclarationName(node)) {
                return getMeaningFromDeclaration(node.parent);
            }
            else if (isTypeReference(node)) {
                return 2;
            }
            else if (isNamespaceReference(node)) {
                return 4;
            }
            else {
                return 1;
            }
        }
        function getSignatureHelpItems(fileName, position) {
            synchronizeHostData();
            var sourceFile = getValidSourceFile(fileName);
            return ts.SignatureHelp.getSignatureHelpItems(program, sourceFile, position, cancellationToken);
        }
        function getSourceFile(fileName) {
            return syntaxTreeCache.getCurrentSourceFile(fileName);
        }
        function getNameOrDottedNameSpan(fileName, startPos, endPos) {
            var sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            var node = ts.getTouchingPropertyName(sourceFile, startPos);
            if (!node) {
                return;
            }
            switch (node.kind) {
                case 155:
                case 126:
                case 8:
                case 80:
                case 95:
                case 89:
                case 91:
                case 93:
                case 65:
                    break;
                default:
                    return;
            }
            var nodeForStartPos = node;
            while (true) {
                if (isRightSideOfPropertyAccess(nodeForStartPos) || isRightSideOfQualifiedName(nodeForStartPos)) {
                    nodeForStartPos = nodeForStartPos.parent;
                }
                else if (isNameOfModuleDeclaration(nodeForStartPos)) {
                    if (nodeForStartPos.parent.parent.kind === 205 &&
                        nodeForStartPos.parent.parent.body === nodeForStartPos.parent) {
                        nodeForStartPos = nodeForStartPos.parent.parent.name;
                    }
                    else {
                        break;
                    }
                }
                else {
                    break;
                }
            }
            return ts.createTextSpanFromBounds(nodeForStartPos.getStart(), node.getEnd());
        }
        function getBreakpointStatementAtPosition(fileName, position) {
            var sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            return ts.BreakpointResolver.spanInSourceFileAtLocation(sourceFile, position);
        }
        function getNavigationBarItems(fileName) {
            var sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            return ts.NavigationBar.getNavigationBarItems(sourceFile);
        }
        function getSemanticClassifications(fileName, span) {
            synchronizeHostData();
            var sourceFile = getValidSourceFile(fileName);
            var typeChecker = program.getTypeChecker();
            var result = [];
            processNode(sourceFile);
            return result;
            function classifySymbol(symbol, meaningAtPosition) {
                var flags = symbol.getFlags();
                if (flags & 32) {
                    return ClassificationTypeNames.className;
                }
                else if (flags & 384) {
                    return ClassificationTypeNames.enumName;
                }
                else if (flags & 524288) {
                    return ClassificationTypeNames.typeAlias;
                }
                else if (meaningAtPosition & 2) {
                    if (flags & 64) {
                        return ClassificationTypeNames.interfaceName;
                    }
                    else if (flags & 262144) {
                        return ClassificationTypeNames.typeParameterName;
                    }
                }
                else if (flags & 1536) {
                    if (meaningAtPosition & 4 ||
                        (meaningAtPosition & 1 && hasValueSideModule(symbol))) {
                        return ClassificationTypeNames.moduleName;
                    }
                }
                return undefined;
                function hasValueSideModule(symbol) {
                    return ts.forEach(symbol.declarations, function (declaration) {
                        return declaration.kind === 205 && ts.getModuleInstanceState(declaration) == 1;
                    });
                }
            }
            function processNode(node) {
                if (node && ts.textSpanIntersectsWith(span, node.getStart(), node.getWidth())) {
                    if (node.kind === 65 && node.getWidth() > 0) {
                        var symbol = typeChecker.getSymbolAtLocation(node);
                        if (symbol) {
                            var type = classifySymbol(symbol, getMeaningFromLocation(node));
                            if (type) {
                                result.push({
                                    textSpan: ts.createTextSpan(node.getStart(), node.getWidth()),
                                    classificationType: type
                                });
                            }
                        }
                    }
                    ts.forEachChild(node, processNode);
                }
            }
        }
        function getSyntacticClassifications(fileName, span) {
            var sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            var triviaScanner = ts.createScanner(2, false, sourceFile.text);
            var mergeConflictScanner = ts.createScanner(2, false, sourceFile.text);
            var result = [];
            processElement(sourceFile);
            return result;
            function classifyLeadingTrivia(token) {
                var tokenStart = ts.skipTrivia(sourceFile.text, token.pos, false);
                if (tokenStart === token.pos) {
                    return;
                }
                triviaScanner.setTextPos(token.pos);
                while (true) {
                    var start = triviaScanner.getTextPos();
                    var kind = triviaScanner.scan();
                    var end = triviaScanner.getTextPos();
                    var width = end - start;
                    if (ts.textSpanIntersectsWith(span, start, width)) {
                        if (!ts.isTrivia(kind)) {
                            return;
                        }
                        if (ts.isComment(kind)) {
                            result.push({
                                textSpan: ts.createTextSpan(start, width),
                                classificationType: ClassificationTypeNames.comment
                            });
                            continue;
                        }
                        if (kind === 6) {
                            var text = sourceFile.text;
                            var ch = text.charCodeAt(start);
                            if (ch === 60 || ch === 62) {
                                result.push({
                                    textSpan: ts.createTextSpan(start, width),
                                    classificationType: ClassificationTypeNames.comment
                                });
                                continue;
                            }
                            ts.Debug.assert(ch === 61);
                            classifyDisabledMergeCode(text, start, end);
                        }
                    }
                }
            }
            function classifyDisabledMergeCode(text, start, end) {
                for (var i = start; i < end; i++) {
                    if (ts.isLineBreak(text.charCodeAt(i))) {
                        break;
                    }
                }
                result.push({
                    textSpan: ts.createTextSpanFromBounds(start, i),
                    classificationType: ClassificationTypeNames.comment
                });
                mergeConflictScanner.setTextPos(i);
                while (mergeConflictScanner.getTextPos() < end) {
                    classifyDisabledCodeToken();
                }
            }
            function classifyDisabledCodeToken() {
                var start = mergeConflictScanner.getTextPos();
                var tokenKind = mergeConflictScanner.scan();
                var end = mergeConflictScanner.getTextPos();
                var type = classifyTokenType(tokenKind);
                if (type) {
                    result.push({
                        textSpan: ts.createTextSpanFromBounds(start, end),
                        classificationType: type
                    });
                }
            }
            function classifyToken(token) {
                classifyLeadingTrivia(token);
                if (token.getWidth() > 0) {
                    var type = classifyTokenType(token.kind, token);
                    if (type) {
                        result.push({
                            textSpan: ts.createTextSpan(token.getStart(), token.getWidth()),
                            classificationType: type
                        });
                    }
                }
            }
            function classifyTokenType(tokenKind, token) {
                if (ts.isKeyword(tokenKind)) {
                    return ClassificationTypeNames.keyword;
                }
                if (tokenKind === 24 || tokenKind === 25) {
                    if (token && ts.getTypeArgumentOrTypeParameterList(token.parent)) {
                        return ClassificationTypeNames.punctuation;
                    }
                }
                if (ts.isPunctuation(tokenKind)) {
                    if (token) {
                        if (tokenKind === 53) {
                            if (token.parent.kind === 198 ||
                                token.parent.kind === 132 ||
                                token.parent.kind === 129) {
                                return ClassificationTypeNames.operator;
                            }
                        }
                        if (token.parent.kind === 169 ||
                            token.parent.kind === 167 ||
                            token.parent.kind === 168 ||
                            token.parent.kind === 170) {
                            return ClassificationTypeNames.operator;
                        }
                    }
                    return ClassificationTypeNames.punctuation;
                }
                else if (tokenKind === 7) {
                    return ClassificationTypeNames.numericLiteral;
                }
                else if (tokenKind === 8) {
                    return ClassificationTypeNames.stringLiteral;
                }
                else if (tokenKind === 9) {
                    return ClassificationTypeNames.stringLiteral;
                }
                else if (ts.isTemplateLiteralKind(tokenKind)) {
                    return ClassificationTypeNames.stringLiteral;
                }
                else if (tokenKind === 65) {
                    if (token) {
                        switch (token.parent.kind) {
                            case 201:
                                if (token.parent.name === token) {
                                    return ClassificationTypeNames.className;
                                }
                                return;
                            case 128:
                                if (token.parent.name === token) {
                                    return ClassificationTypeNames.typeParameterName;
                                }
                                return;
                            case 202:
                                if (token.parent.name === token) {
                                    return ClassificationTypeNames.interfaceName;
                                }
                                return;
                            case 204:
                                if (token.parent.name === token) {
                                    return ClassificationTypeNames.enumName;
                                }
                                return;
                            case 205:
                                if (token.parent.name === token) {
                                    return ClassificationTypeNames.moduleName;
                                }
                                return;
                        }
                    }
                    return ClassificationTypeNames.text;
                }
            }
            function processElement(element) {
                if (ts.textSpanIntersectsWith(span, element.getFullStart(), element.getFullWidth())) {
                    var children = element.getChildren();
                    for (var _i = 0; _i < children.length; _i++) {
                        var child = children[_i];
                        if (ts.isToken(child)) {
                            classifyToken(child);
                        }
                        else {
                            processElement(child);
                        }
                    }
                }
            }
        }
        function getOutliningSpans(fileName) {
            var sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            return ts.OutliningElementsCollector.collectElements(sourceFile);
        }
        function getBraceMatchingAtPosition(fileName, position) {
            var sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            var result = [];
            var token = ts.getTouchingToken(sourceFile, position);
            if (token.getStart(sourceFile) === position) {
                var matchKind = getMatchingTokenKind(token);
                if (matchKind) {
                    var parentElement = token.parent;
                    var childNodes = parentElement.getChildren(sourceFile);
                    for (var _i = 0; _i < childNodes.length; _i++) {
                        var current = childNodes[_i];
                        if (current.kind === matchKind) {
                            var range1 = ts.createTextSpan(token.getStart(sourceFile), token.getWidth(sourceFile));
                            var range2 = ts.createTextSpan(current.getStart(sourceFile), current.getWidth(sourceFile));
                            if (range1.start < range2.start) {
                                result.push(range1, range2);
                            }
                            else {
                                result.push(range2, range1);
                            }
                            break;
                        }
                    }
                }
            }
            return result;
            function getMatchingTokenKind(token) {
                switch (token.kind) {
                    case 14: return 15;
                    case 16: return 17;
                    case 18: return 19;
                    case 24: return 25;
                    case 15: return 14;
                    case 17: return 16;
                    case 19: return 18;
                    case 25: return 24;
                }
                return undefined;
            }
        }
        function getIndentationAtPosition(fileName, position, editorOptions) {
            var start = new Date().getTime();
            var sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            log("getIndentationAtPosition: getCurrentSourceFile: " + (new Date().getTime() - start));
            start = new Date().getTime();
            var result = ts.formatting.SmartIndenter.getIndentation(position, sourceFile, editorOptions);
            log("getIndentationAtPosition: computeIndentation  : " + (new Date().getTime() - start));
            return result;
        }
        function getFormattingEditsForRange(fileName, start, end, options) {
            var sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            return ts.formatting.formatSelection(start, end, sourceFile, getRuleProvider(options), options);
        }
        function getFormattingEditsForDocument(fileName, options) {
            var sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            return ts.formatting.formatDocument(sourceFile, getRuleProvider(options), options);
        }
        function getFormattingEditsAfterKeystroke(fileName, position, key, options) {
            var sourceFile = syntaxTreeCache.getCurrentSourceFile(fileName);
            if (key === "}") {
                return ts.formatting.formatOnClosingCurly(position, sourceFile, getRuleProvider(options), options);
            }
            else if (key === ";") {
                return ts.formatting.formatOnSemicolon(position, sourceFile, getRuleProvider(options), options);
            }
            else if (key === "\n") {
                return ts.formatting.formatOnEnter(position, sourceFile, getRuleProvider(options), options);
            }
            return [];
        }
        function getTodoComments(fileName, descriptors) {
            synchronizeHostData();
            var sourceFile = getValidSourceFile(fileName);
            cancellationToken.throwIfCancellationRequested();
            var fileContents = sourceFile.text;
            var result = [];
            if (descriptors.length > 0) {
                var regExp = getTodoCommentsRegExp();
                var matchArray;
                while (matchArray = regExp.exec(fileContents)) {
                    cancellationToken.throwIfCancellationRequested();
                    var firstDescriptorCaptureIndex = 3;
                    ts.Debug.assert(matchArray.length === descriptors.length + firstDescriptorCaptureIndex);
                    var preamble = matchArray[1];
                    var matchPosition = matchArray.index + preamble.length;
                    var token = ts.getTokenAtPosition(sourceFile, matchPosition);
                    if (!isInsideComment(sourceFile, token, matchPosition)) {
                        continue;
                    }
                    var descriptor = undefined;
                    for (var i = 0, n = descriptors.length; i < n; i++) {
                        if (matchArray[i + firstDescriptorCaptureIndex]) {
                            descriptor = descriptors[i];
                        }
                    }
                    ts.Debug.assert(descriptor !== undefined);
                    if (isLetterOrDigit(fileContents.charCodeAt(matchPosition + descriptor.text.length))) {
                        continue;
                    }
                    var message = matchArray[2];
                    result.push({
                        descriptor: descriptor,
                        message: message,
                        position: matchPosition
                    });
                }
            }
            return result;
            function escapeRegExp(str) {
                return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
            }
            function getTodoCommentsRegExp() {
                // NOTE: ?:  means 'non-capture group'.  It allows us to have groups without having to
                // filter them out later in the final result array.
                var singleLineCommentStart = /(?:\/\/+\s*)/.source;
                var multiLineCommentStart = /(?:\/\*+\s*)/.source;
                var anyNumberOfSpacesAndAsterixesAtStartOfLine = /(?:^(?:\s|\*)*)/.source;
                var preamble = "(" + anyNumberOfSpacesAndAsterixesAtStartOfLine + "|" + singleLineCommentStart + "|" + multiLineCommentStart + ")";
                var literals = "(?:" + ts.map(descriptors, function (d) { return "(" + escapeRegExp(d.text) + ")"; }).join("|") + ")";
                var endOfLineOrEndOfComment = /(?:$|\*\/)/.source;
                var messageRemainder = /(?:.*?)/.source;
                var messagePortion = "(" + literals + messageRemainder + ")";
                var regExpString = preamble + messagePortion + endOfLineOrEndOfComment;
                return new RegExp(regExpString, "gim");
            }
            function isLetterOrDigit(char) {
                return (char >= 97 && char <= 122) ||
                    (char >= 65 && char <= 90) ||
                    (char >= 48 && char <= 57);
            }
        }
        function getRenameInfo(fileName, position) {
            synchronizeHostData();
            var sourceFile = getValidSourceFile(fileName);
            var typeChecker = program.getTypeChecker();
            var node = ts.getTouchingWord(sourceFile, position);
            if (node && node.kind === 65) {
                var symbol = typeChecker.getSymbolAtLocation(node);
                if (symbol) {
                    var declarations = symbol.getDeclarations();
                    if (declarations && declarations.length > 0) {
                        var defaultLibFileName = host.getDefaultLibFileName(host.getCompilationSettings());
                        if (defaultLibFileName) {
                            for (var _i = 0; _i < declarations.length; _i++) {
                                var current = declarations[_i];
                                var sourceFile_1 = current.getSourceFile();
                                if (sourceFile_1 && getCanonicalFileName(ts.normalizePath(sourceFile_1.fileName)) === getCanonicalFileName(ts.normalizePath(defaultLibFileName))) {
                                    return getRenameInfoError(ts.getLocaleSpecificMessage(ts.Diagnostics.You_cannot_rename_elements_that_are_defined_in_the_standard_TypeScript_library.key));
                                }
                            }
                        }
                        var kind = getSymbolKind(symbol, node);
                        if (kind) {
                            return {
                                canRename: true,
                                localizedErrorMessage: undefined,
                                displayName: symbol.name,
                                fullDisplayName: typeChecker.getFullyQualifiedName(symbol),
                                kind: kind,
                                kindModifiers: getSymbolModifiers(symbol),
                                triggerSpan: ts.createTextSpan(node.getStart(), node.getWidth())
                            };
                        }
                    }
                }
            }
            return getRenameInfoError(ts.getLocaleSpecificMessage(ts.Diagnostics.You_cannot_rename_this_element.key));
            function getRenameInfoError(localizedErrorMessage) {
                return {
                    canRename: false,
                    localizedErrorMessage: localizedErrorMessage,
                    displayName: undefined,
                    fullDisplayName: undefined,
                    kind: undefined,
                    kindModifiers: undefined,
                    triggerSpan: undefined
                };
            }
        }
        return {
            dispose: dispose,
            cleanupSemanticCache: cleanupSemanticCache,
            getSyntacticDiagnostics: getSyntacticDiagnostics,
            getSemanticDiagnostics: getSemanticDiagnostics,
            getCompilerOptionsDiagnostics: getCompilerOptionsDiagnostics,
            getSyntacticClassifications: getSyntacticClassifications,
            getSemanticClassifications: getSemanticClassifications,
            getCompletionsAtPosition: getCompletionsAtPosition,
            getCompletionEntryDetails: getCompletionEntryDetails,
            getSignatureHelpItems: getSignatureHelpItems,
            getQuickInfoAtPosition: getQuickInfoAtPosition,
            getDefinitionAtPosition: getDefinitionAtPosition,
            getReferencesAtPosition: getReferencesAtPosition,
            findReferences: findReferences,
            getOccurrencesAtPosition: getOccurrencesAtPosition,
            getDocumentHighlights: getDocumentHighlights,
            getNameOrDottedNameSpan: getNameOrDottedNameSpan,
            getBreakpointStatementAtPosition: getBreakpointStatementAtPosition,
            getNavigateToItems: getNavigateToItems,
            getRenameInfo: getRenameInfo,
            findRenameLocations: findRenameLocations,
            getNavigationBarItems: getNavigationBarItems,
            getOutliningSpans: getOutliningSpans,
            getTodoComments: getTodoComments,
            getBraceMatchingAtPosition: getBraceMatchingAtPosition,
            getIndentationAtPosition: getIndentationAtPosition,
            getFormattingEditsForRange: getFormattingEditsForRange,
            getFormattingEditsForDocument: getFormattingEditsForDocument,
            getFormattingEditsAfterKeystroke: getFormattingEditsAfterKeystroke,
            getEmitOutput: getEmitOutput,
            getSourceFile: getSourceFile,
            getProgram: getProgram
        };
    }
    ts.createLanguageService = createLanguageService;
    function getNameTable(sourceFile) {
        if (!sourceFile.nameTable) {
            initializeNameTable(sourceFile);
        }
        return sourceFile.nameTable;
    }
    ts.getNameTable = getNameTable;
    function initializeNameTable(sourceFile) {
        var nameTable = {};
        walk(sourceFile);
        sourceFile.nameTable = nameTable;
        function walk(node) {
            switch (node.kind) {
                case 65:
                    nameTable[node.text] = node.text;
                    break;
                case 8:
                case 7:
                    if (ts.isDeclarationName(node) ||
                        node.parent.kind === 219 ||
                        isArgumentOfElementAccessExpression(node)) {
                        nameTable[node.text] = node.text;
                    }
                    break;
                default:
                    ts.forEachChild(node, walk);
            }
        }
    }
    function isArgumentOfElementAccessExpression(node) {
        return node &&
            node.parent &&
            node.parent.kind === 156 &&
            node.parent.argumentExpression === node;
    }
    function createClassifier() {
        var scanner = ts.createScanner(2, false);
        var noRegexTable = [];
        noRegexTable[65] = true;
        noRegexTable[8] = true;
        noRegexTable[7] = true;
        noRegexTable[9] = true;
        noRegexTable[93] = true;
        noRegexTable[38] = true;
        noRegexTable[39] = true;
        noRegexTable[17] = true;
        noRegexTable[19] = true;
        noRegexTable[15] = true;
        noRegexTable[95] = true;
        noRegexTable[80] = true;
        var templateStack = [];
        function canFollow(keyword1, keyword2) {
            if (ts.isAccessibilityModifier(keyword1)) {
                if (keyword2 === 116 ||
                    keyword2 === 120 ||
                    keyword2 === 114 ||
                    keyword2 === 109) {
                    return true;
                }
                return false;
            }
            return true;
        }
        function getClassificationsForLine(text, lexState, syntacticClassifierAbsent) {
            var offset = 0;
            var token = 0;
            var lastNonTriviaToken = 0;
            while (templateStack.length > 0) {
                templateStack.pop();
            }
            switch (lexState) {
                case 3:
                    text = '"\\\n' + text;
                    offset = 3;
                    break;
                case 2:
                    text = "'\\\n" + text;
                    offset = 3;
                    break;
                case 1:
                    text = "/*\n" + text;
                    offset = 3;
                    break;
                case 4:
                    text = "`\n" + text;
                    offset = 2;
                    break;
                case 5:
                    text = "}\n" + text;
                    offset = 2;
                case 6:
                    templateStack.push(11);
                    break;
            }
            scanner.setText(text);
            var result = {
                finalLexState: 0,
                entries: []
            };
            var angleBracketStack = 0;
            do {
                token = scanner.scan();
                if (!ts.isTrivia(token)) {
                    if ((token === 36 || token === 57) && !noRegexTable[lastNonTriviaToken]) {
                        if (scanner.reScanSlashToken() === 9) {
                            token = 9;
                        }
                    }
                    else if (lastNonTriviaToken === 20 && isKeyword(token)) {
                        token = 65;
                    }
                    else if (isKeyword(lastNonTriviaToken) && isKeyword(token) && !canFollow(lastNonTriviaToken, token)) {
                        token = 65;
                    }
                    else if (lastNonTriviaToken === 65 &&
                        token === 24) {
                        angleBracketStack++;
                    }
                    else if (token === 25 && angleBracketStack > 0) {
                        angleBracketStack--;
                    }
                    else if (token === 112 ||
                        token === 121 ||
                        token === 119 ||
                        token === 113 ||
                        token === 122) {
                        if (angleBracketStack > 0 && !syntacticClassifierAbsent) {
                            token = 65;
                        }
                    }
                    else if (token === 11) {
                        templateStack.push(token);
                    }
                    else if (token === 14) {
                        if (templateStack.length > 0) {
                            templateStack.push(token);
                        }
                    }
                    else if (token === 15) {
                        if (templateStack.length > 0) {
                            var lastTemplateStackToken = ts.lastOrUndefined(templateStack);
                            if (lastTemplateStackToken === 11) {
                                token = scanner.reScanTemplateToken();
                                if (token === 13) {
                                    templateStack.pop();
                                }
                                else {
                                    ts.Debug.assert(token === 12, "Should have been a template middle. Was " + token);
                                }
                            }
                            else {
                                ts.Debug.assert(lastTemplateStackToken === 14, "Should have been an open brace. Was: " + token);
                                templateStack.pop();
                            }
                        }
                    }
                    lastNonTriviaToken = token;
                }
                processToken();
            } while (token !== 1);
            return result;
            function processToken() {
                var start = scanner.getTokenPos();
                var end = scanner.getTextPos();
                addResult(end - start, classFromKind(token));
                if (end >= text.length) {
                    if (token === 8) {
                        var tokenText = scanner.getTokenText();
                        if (scanner.isUnterminated()) {
                            var lastCharIndex = tokenText.length - 1;
                            var numBackslashes = 0;
                            while (tokenText.charCodeAt(lastCharIndex - numBackslashes) === 92) {
                                numBackslashes++;
                            }
                            if (numBackslashes & 1) {
                                var quoteChar = tokenText.charCodeAt(0);
                                result.finalLexState = quoteChar === 34
                                    ? 3
                                    : 2;
                            }
                        }
                    }
                    else if (token === 3) {
                        if (scanner.isUnterminated()) {
                            result.finalLexState = 1;
                        }
                    }
                    else if (ts.isTemplateLiteralKind(token)) {
                        if (scanner.isUnterminated()) {
                            if (token === 13) {
                                result.finalLexState = 5;
                            }
                            else if (token === 10) {
                                result.finalLexState = 4;
                            }
                            else {
                                ts.Debug.fail("Only 'NoSubstitutionTemplateLiteral's and 'TemplateTail's can be unterminated; got SyntaxKind #" + token);
                            }
                        }
                    }
                    else if (templateStack.length > 0 && ts.lastOrUndefined(templateStack) === 11) {
                        result.finalLexState = 6;
                    }
                }
            }
            function addResult(length, classification) {
                if (length > 0) {
                    if (result.entries.length === 0) {
                        length -= offset;
                    }
                    result.entries.push({ length: length, classification: classification });
                }
            }
        }
        function isBinaryExpressionOperatorToken(token) {
            switch (token) {
                case 35:
                case 36:
                case 37:
                case 33:
                case 34:
                case 40:
                case 41:
                case 42:
                case 24:
                case 25:
                case 26:
                case 27:
                case 87:
                case 86:
                case 28:
                case 29:
                case 30:
                case 31:
                case 43:
                case 45:
                case 44:
                case 48:
                case 49:
                case 63:
                case 62:
                case 64:
                case 59:
                case 60:
                case 61:
                case 54:
                case 55:
                case 56:
                case 57:
                case 58:
                case 53:
                case 23:
                    return true;
                default:
                    return false;
            }
        }
        function isPrefixUnaryExpressionOperatorToken(token) {
            switch (token) {
                case 33:
                case 34:
                case 47:
                case 46:
                case 38:
                case 39:
                    return true;
                default:
                    return false;
            }
        }
        function isKeyword(token) {
            return token >= 66 && token <= 125;
        }
        function classFromKind(token) {
            if (isKeyword(token)) {
                return TokenClass.Keyword;
            }
            else if (isBinaryExpressionOperatorToken(token) || isPrefixUnaryExpressionOperatorToken(token)) {
                return TokenClass.Operator;
            }
            else if (token >= 14 && token <= 64) {
                return TokenClass.Punctuation;
            }
            switch (token) {
                case 7:
                    return TokenClass.NumberLiteral;
                case 8:
                    return TokenClass.StringLiteral;
                case 9:
                    return TokenClass.RegExpLiteral;
                case 6:
                case 3:
                case 2:
                    return TokenClass.Comment;
                case 5:
                case 4:
                    return TokenClass.Whitespace;
                case 65:
                default:
                    if (ts.isTemplateLiteralKind(token)) {
                        return TokenClass.StringLiteral;
                    }
                    return TokenClass.Identifier;
            }
        }
        return { getClassificationsForLine: getClassificationsForLine };
    }
    ts.createClassifier = createClassifier;
    function getDefaultLibFilePath(options) {
        if (typeof __dirname !== "undefined") {
            return __dirname + ts.directorySeparator + ts.getDefaultLibFileName(options);
        }
        throw new Error("getDefaultLibFilePath is only supported when consumed as a node module. ");
    }
    ts.getDefaultLibFilePath = getDefaultLibFilePath;
    function initializeServices() {
        ts.objectAllocator = {
            getNodeConstructor: function (kind) {
                function Node() {
                }
                var proto = kind === 227 ? new SourceFileObject() : new NodeObject();
                proto.kind = kind;
                proto.pos = 0;
                proto.end = 0;
                proto.flags = 0;
                proto.parent = undefined;
                Node.prototype = proto;
                return Node;
            },
            getSymbolConstructor: function () { return SymbolObject; },
            getTypeConstructor: function () { return TypeObject; },
            getSignatureConstructor: function () { return SignatureObject; },
        };
    }
    initializeServices();
})(ts || (ts = {}));
