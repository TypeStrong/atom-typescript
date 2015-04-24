/// <reference path="binder.ts" />
var ts;
(function (ts) {
    function getDeclarationOfKind(symbol, kind) {
        var declarations = symbol.declarations;
        for (var _i = 0; _i < declarations.length; _i++) {
            var declaration = declarations[_i];
            if (declaration.kind === kind) {
                return declaration;
            }
        }
        return undefined;
    }
    ts.getDeclarationOfKind = getDeclarationOfKind;
    var stringWriters = [];
    function getSingleLineStringWriter() {
        if (stringWriters.length == 0) {
            var str = "";
            var writeText = function (text) { return str += text; };
            return {
                string: function () { return str; },
                writeKeyword: writeText,
                writeOperator: writeText,
                writePunctuation: writeText,
                writeSpace: writeText,
                writeStringLiteral: writeText,
                writeParameter: writeText,
                writeSymbol: writeText,
                writeLine: function () { return str += " "; },
                increaseIndent: function () { },
                decreaseIndent: function () { },
                clear: function () { return str = ""; },
                trackSymbol: function () { }
            };
        }
        return stringWriters.pop();
    }
    ts.getSingleLineStringWriter = getSingleLineStringWriter;
    function releaseStringWriter(writer) {
        writer.clear();
        stringWriters.push(writer);
    }
    ts.releaseStringWriter = releaseStringWriter;
    function getFullWidth(node) {
        return node.end - node.pos;
    }
    ts.getFullWidth = getFullWidth;
    function containsParseError(node) {
        aggregateChildData(node);
        return (node.parserContextFlags & 64) !== 0;
    }
    ts.containsParseError = containsParseError;
    function aggregateChildData(node) {
        if (!(node.parserContextFlags & 128)) {
            var thisNodeOrAnySubNodesHasError = ((node.parserContextFlags & 32) !== 0) ||
                ts.forEachChild(node, containsParseError);
            if (thisNodeOrAnySubNodesHasError) {
                node.parserContextFlags |= 64;
            }
            node.parserContextFlags |= 128;
        }
    }
    function getSourceFileOfNode(node) {
        while (node && node.kind !== 227) {
            node = node.parent;
        }
        return node;
    }
    ts.getSourceFileOfNode = getSourceFileOfNode;
    function getStartPositionOfLine(line, sourceFile) {
        ts.Debug.assert(line >= 0);
        return ts.getLineStarts(sourceFile)[line];
    }
    ts.getStartPositionOfLine = getStartPositionOfLine;
    function nodePosToString(node) {
        var file = getSourceFileOfNode(node);
        var loc = ts.getLineAndCharacterOfPosition(file, node.pos);
        return file.fileName + "(" + (loc.line + 1) + "," + (loc.character + 1) + ")";
    }
    ts.nodePosToString = nodePosToString;
    function getStartPosOfNode(node) {
        return node.pos;
    }
    ts.getStartPosOfNode = getStartPosOfNode;
    function nodeIsMissing(node) {
        if (!node) {
            return true;
        }
        return node.pos === node.end && node.kind !== 1;
    }
    ts.nodeIsMissing = nodeIsMissing;
    function nodeIsPresent(node) {
        return !nodeIsMissing(node);
    }
    ts.nodeIsPresent = nodeIsPresent;
    function getTokenPosOfNode(node, sourceFile) {
        if (nodeIsMissing(node)) {
            return node.pos;
        }
        return ts.skipTrivia((sourceFile || getSourceFileOfNode(node)).text, node.pos);
    }
    ts.getTokenPosOfNode = getTokenPosOfNode;
    function getNonDecoratorTokenPosOfNode(node, sourceFile) {
        if (nodeIsMissing(node) || !node.decorators) {
            return getTokenPosOfNode(node, sourceFile);
        }
        return ts.skipTrivia((sourceFile || getSourceFileOfNode(node)).text, node.decorators.end);
    }
    ts.getNonDecoratorTokenPosOfNode = getNonDecoratorTokenPosOfNode;
    function getSourceTextOfNodeFromSourceFile(sourceFile, node) {
        if (nodeIsMissing(node)) {
            return "";
        }
        var text = sourceFile.text;
        return text.substring(ts.skipTrivia(text, node.pos), node.end);
    }
    ts.getSourceTextOfNodeFromSourceFile = getSourceTextOfNodeFromSourceFile;
    function getTextOfNodeFromSourceText(sourceText, node) {
        if (nodeIsMissing(node)) {
            return "";
        }
        return sourceText.substring(ts.skipTrivia(sourceText, node.pos), node.end);
    }
    ts.getTextOfNodeFromSourceText = getTextOfNodeFromSourceText;
    function getTextOfNode(node) {
        return getSourceTextOfNodeFromSourceFile(getSourceFileOfNode(node), node);
    }
    ts.getTextOfNode = getTextOfNode;
    function escapeIdentifier(identifier) {
        return identifier.length >= 2 && identifier.charCodeAt(0) === 95 && identifier.charCodeAt(1) === 95 ? "_" + identifier : identifier;
    }
    ts.escapeIdentifier = escapeIdentifier;
    function unescapeIdentifier(identifier) {
        return identifier.length >= 3 && identifier.charCodeAt(0) === 95 && identifier.charCodeAt(1) === 95 && identifier.charCodeAt(2) === 95 ? identifier.substr(1) : identifier;
    }
    ts.unescapeIdentifier = unescapeIdentifier;
    function makeIdentifierFromModuleName(moduleName) {
        return ts.getBaseFileName(moduleName).replace(/\W/g, "_");
    }
    ts.makeIdentifierFromModuleName = makeIdentifierFromModuleName;
    function isBlockOrCatchScoped(declaration) {
        return (getCombinedNodeFlags(declaration) & 12288) !== 0 ||
            isCatchClauseVariableDeclaration(declaration);
    }
    ts.isBlockOrCatchScoped = isBlockOrCatchScoped;
    function getEnclosingBlockScopeContainer(node) {
        var current = node.parent;
        while (current) {
            if (isFunctionLike(current)) {
                return current;
            }
            switch (current.kind) {
                case 227:
                case 207:
                case 223:
                case 205:
                case 186:
                case 187:
                case 188:
                    return current;
                case 179:
                    if (!isFunctionLike(current.parent)) {
                        return current;
                    }
            }
            current = current.parent;
        }
    }
    ts.getEnclosingBlockScopeContainer = getEnclosingBlockScopeContainer;
    function isCatchClauseVariableDeclaration(declaration) {
        return declaration &&
            declaration.kind === 198 &&
            declaration.parent &&
            declaration.parent.kind === 223;
    }
    ts.isCatchClauseVariableDeclaration = isCatchClauseVariableDeclaration;
    function declarationNameToString(name) {
        return getFullWidth(name) === 0 ? "(Missing)" : getTextOfNode(name);
    }
    ts.declarationNameToString = declarationNameToString;
    function createDiagnosticForNode(node, message, arg0, arg1, arg2) {
        var sourceFile = getSourceFileOfNode(node);
        var span = getErrorSpanForNode(sourceFile, node);
        return ts.createFileDiagnostic(sourceFile, span.start, span.length, message, arg0, arg1, arg2);
    }
    ts.createDiagnosticForNode = createDiagnosticForNode;
    function createDiagnosticForNodeFromMessageChain(node, messageChain) {
        var sourceFile = getSourceFileOfNode(node);
        var span = getErrorSpanForNode(sourceFile, node);
        return {
            file: sourceFile,
            start: span.start,
            length: span.length,
            code: messageChain.code,
            category: messageChain.category,
            messageText: messageChain.next ? messageChain : messageChain.messageText
        };
    }
    ts.createDiagnosticForNodeFromMessageChain = createDiagnosticForNodeFromMessageChain;
    function getSpanOfTokenAtPosition(sourceFile, pos) {
        var scanner = ts.createScanner(sourceFile.languageVersion, true, sourceFile.text, undefined, pos);
        scanner.scan();
        var start = scanner.getTokenPos();
        return ts.createTextSpanFromBounds(start, scanner.getTextPos());
    }
    ts.getSpanOfTokenAtPosition = getSpanOfTokenAtPosition;
    function getErrorSpanForNode(sourceFile, node) {
        var errorNode = node;
        switch (node.kind) {
            case 227:
                var pos_1 = ts.skipTrivia(sourceFile.text, 0, false);
                if (pos_1 === sourceFile.text.length) {
                    return ts.createTextSpan(0, 0);
                }
                return getSpanOfTokenAtPosition(sourceFile, pos_1);
            case 198:
            case 152:
            case 201:
            case 174:
            case 202:
            case 205:
            case 204:
            case 226:
            case 200:
            case 162:
                errorNode = node.name;
                break;
        }
        if (errorNode === undefined) {
            return getSpanOfTokenAtPosition(sourceFile, node.pos);
        }
        var pos = nodeIsMissing(errorNode)
            ? errorNode.pos
            : ts.skipTrivia(sourceFile.text, errorNode.pos);
        return ts.createTextSpanFromBounds(pos, errorNode.end);
    }
    ts.getErrorSpanForNode = getErrorSpanForNode;
    function isExternalModule(file) {
        return file.externalModuleIndicator !== undefined;
    }
    ts.isExternalModule = isExternalModule;
    function isDeclarationFile(file) {
        return (file.flags & 2048) !== 0;
    }
    ts.isDeclarationFile = isDeclarationFile;
    function isConstEnumDeclaration(node) {
        return node.kind === 204 && isConst(node);
    }
    ts.isConstEnumDeclaration = isConstEnumDeclaration;
    function walkUpBindingElementsAndPatterns(node) {
        while (node && (node.kind === 152 || isBindingPattern(node))) {
            node = node.parent;
        }
        return node;
    }
    function getCombinedNodeFlags(node) {
        node = walkUpBindingElementsAndPatterns(node);
        var flags = node.flags;
        if (node.kind === 198) {
            node = node.parent;
        }
        if (node && node.kind === 199) {
            flags |= node.flags;
            node = node.parent;
        }
        if (node && node.kind === 180) {
            flags |= node.flags;
        }
        return flags;
    }
    ts.getCombinedNodeFlags = getCombinedNodeFlags;
    function isConst(node) {
        return !!(getCombinedNodeFlags(node) & 8192);
    }
    ts.isConst = isConst;
    function isLet(node) {
        return !!(getCombinedNodeFlags(node) & 4096);
    }
    ts.isLet = isLet;
    function isPrologueDirective(node) {
        return node.kind === 182 && node.expression.kind === 8;
    }
    ts.isPrologueDirective = isPrologueDirective;
    function getLeadingCommentRangesOfNode(node, sourceFileOfNode) {
        if (node.kind === 129 || node.kind === 128) {
            return ts.concatenate(ts.getTrailingCommentRanges(sourceFileOfNode.text, node.pos), ts.getLeadingCommentRanges(sourceFileOfNode.text, node.pos));
        }
        else {
            return ts.getLeadingCommentRanges(sourceFileOfNode.text, node.pos);
        }
    }
    ts.getLeadingCommentRangesOfNode = getLeadingCommentRangesOfNode;
    function getJsDocComments(node, sourceFileOfNode) {
        return ts.filter(getLeadingCommentRangesOfNode(node, sourceFileOfNode), isJsDocComment);
        function isJsDocComment(comment) {
            return sourceFileOfNode.text.charCodeAt(comment.pos + 1) === 42 &&
                sourceFileOfNode.text.charCodeAt(comment.pos + 2) === 42 &&
                sourceFileOfNode.text.charCodeAt(comment.pos + 3) !== 47;
        }
    }
    ts.getJsDocComments = getJsDocComments;
    ts.fullTripleSlashReferencePathRegEx = /^(\/\/\/\s*<reference\s+path\s*=\s*)('|")(.+?)\2.*?\/>/;
    function forEachReturnStatement(body, visitor) {
        return traverse(body);
        function traverse(node) {
            switch (node.kind) {
                case 191:
                    return visitor(node);
                case 207:
                case 179:
                case 183:
                case 184:
                case 185:
                case 186:
                case 187:
                case 188:
                case 192:
                case 193:
                case 220:
                case 221:
                case 194:
                case 196:
                case 223:
                    return ts.forEachChild(node, traverse);
            }
        }
    }
    ts.forEachReturnStatement = forEachReturnStatement;
    function isVariableLike(node) {
        if (node) {
            switch (node.kind) {
                case 152:
                case 226:
                case 129:
                case 224:
                case 132:
                case 131:
                case 225:
                case 198:
                    return true;
            }
        }
        return false;
    }
    ts.isVariableLike = isVariableLike;
    function isAccessor(node) {
        if (node) {
            switch (node.kind) {
                case 136:
                case 137:
                    return true;
            }
        }
        return false;
    }
    ts.isAccessor = isAccessor;
    function isFunctionLike(node) {
        if (node) {
            switch (node.kind) {
                case 135:
                case 162:
                case 200:
                case 163:
                case 134:
                case 133:
                case 136:
                case 137:
                case 138:
                case 139:
                case 140:
                case 142:
                case 143:
                case 162:
                case 163:
                case 200:
                    return true;
            }
        }
        return false;
    }
    ts.isFunctionLike = isFunctionLike;
    function isFunctionBlock(node) {
        return node && node.kind === 179 && isFunctionLike(node.parent);
    }
    ts.isFunctionBlock = isFunctionBlock;
    function isObjectLiteralMethod(node) {
        return node && node.kind === 134 && node.parent.kind === 154;
    }
    ts.isObjectLiteralMethod = isObjectLiteralMethod;
    function getContainingFunction(node) {
        while (true) {
            node = node.parent;
            if (!node || isFunctionLike(node)) {
                return node;
            }
        }
    }
    ts.getContainingFunction = getContainingFunction;
    function getThisContainer(node, includeArrowFunctions) {
        while (true) {
            node = node.parent;
            if (!node) {
                return undefined;
            }
            switch (node.kind) {
                case 127:
                    if (node.parent.parent.kind === 201) {
                        return node;
                    }
                    node = node.parent;
                    break;
                case 130:
                    if (node.parent.kind === 129 && isClassElement(node.parent.parent)) {
                        node = node.parent.parent;
                    }
                    else if (isClassElement(node.parent)) {
                        node = node.parent;
                    }
                    break;
                case 163:
                    if (!includeArrowFunctions) {
                        continue;
                    }
                case 200:
                case 162:
                case 205:
                case 132:
                case 131:
                case 134:
                case 133:
                case 135:
                case 136:
                case 137:
                case 204:
                case 227:
                    return node;
            }
        }
    }
    ts.getThisContainer = getThisContainer;
    function getSuperContainer(node, includeFunctions) {
        while (true) {
            node = node.parent;
            if (!node)
                return node;
            switch (node.kind) {
                case 127:
                    if (node.parent.parent.kind === 201) {
                        return node;
                    }
                    node = node.parent;
                    break;
                case 130:
                    if (node.parent.kind === 129 && isClassElement(node.parent.parent)) {
                        node = node.parent.parent;
                    }
                    else if (isClassElement(node.parent)) {
                        node = node.parent;
                    }
                    break;
                case 200:
                case 162:
                case 163:
                    if (!includeFunctions) {
                        continue;
                    }
                case 132:
                case 131:
                case 134:
                case 133:
                case 135:
                case 136:
                case 137:
                    return node;
            }
        }
    }
    ts.getSuperContainer = getSuperContainer;
    function getInvokedExpression(node) {
        if (node.kind === 159) {
            return node.tag;
        }
        return node.expression;
    }
    ts.getInvokedExpression = getInvokedExpression;
    function nodeCanBeDecorated(node) {
        switch (node.kind) {
            case 201:
                return true;
            case 132:
                return node.parent.kind === 201;
            case 129:
                return node.parent.body && node.parent.parent.kind === 201;
            case 136:
            case 137:
            case 134:
                return node.body && node.parent.kind === 201;
        }
        return false;
    }
    ts.nodeCanBeDecorated = nodeCanBeDecorated;
    function nodeIsDecorated(node) {
        switch (node.kind) {
            case 201:
                if (node.decorators) {
                    return true;
                }
                return false;
            case 132:
            case 129:
                if (node.decorators) {
                    return true;
                }
                return false;
            case 136:
                if (node.body && node.decorators) {
                    return true;
                }
                return false;
            case 134:
            case 137:
                if (node.body && node.decorators) {
                    return true;
                }
                return false;
        }
        return false;
    }
    ts.nodeIsDecorated = nodeIsDecorated;
    function childIsDecorated(node) {
        switch (node.kind) {
            case 201:
                return ts.forEach(node.members, nodeOrChildIsDecorated);
            case 134:
            case 137:
                return ts.forEach(node.parameters, nodeIsDecorated);
        }
        return false;
    }
    ts.childIsDecorated = childIsDecorated;
    function nodeOrChildIsDecorated(node) {
        return nodeIsDecorated(node) || childIsDecorated(node);
    }
    ts.nodeOrChildIsDecorated = nodeOrChildIsDecorated;
    function isExpression(node) {
        switch (node.kind) {
            case 93:
            case 91:
            case 89:
            case 95:
            case 80:
            case 9:
            case 153:
            case 154:
            case 155:
            case 156:
            case 157:
            case 158:
            case 159:
            case 160:
            case 161:
            case 162:
            case 174:
            case 163:
            case 166:
            case 164:
            case 165:
            case 167:
            case 168:
            case 169:
            case 170:
            case 173:
            case 171:
            case 10:
            case 175:
                return true;
            case 126:
                while (node.parent.kind === 126) {
                    node = node.parent;
                }
                return node.parent.kind === 144;
            case 65:
                if (node.parent.kind === 144) {
                    return true;
                }
            case 7:
            case 8:
                var parent_1 = node.parent;
                switch (parent_1.kind) {
                    case 198:
                    case 129:
                    case 132:
                    case 131:
                    case 226:
                    case 224:
                    case 152:
                        return parent_1.initializer === node;
                    case 182:
                    case 183:
                    case 184:
                    case 185:
                    case 191:
                    case 192:
                    case 193:
                    case 220:
                    case 195:
                    case 193:
                        return parent_1.expression === node;
                    case 186:
                        var forStatement = parent_1;
                        return (forStatement.initializer === node && forStatement.initializer.kind !== 199) ||
                            forStatement.condition === node ||
                            forStatement.incrementor === node;
                    case 187:
                    case 188:
                        var forInStatement = parent_1;
                        return (forInStatement.initializer === node && forInStatement.initializer.kind !== 199) ||
                            forInStatement.expression === node;
                    case 160:
                        return node === parent_1.expression;
                    case 176:
                        return node === parent_1.expression;
                    case 127:
                        return node === parent_1.expression;
                    case 130:
                        return true;
                    default:
                        if (isExpression(parent_1)) {
                            return true;
                        }
                }
        }
        return false;
    }
    ts.isExpression = isExpression;
    function isInstantiatedModule(node, preserveConstEnums) {
        var moduleState = ts.getModuleInstanceState(node);
        return moduleState === 1 ||
            (preserveConstEnums && moduleState === 2);
    }
    ts.isInstantiatedModule = isInstantiatedModule;
    function isExternalModuleImportEqualsDeclaration(node) {
        return node.kind === 208 && node.moduleReference.kind === 219;
    }
    ts.isExternalModuleImportEqualsDeclaration = isExternalModuleImportEqualsDeclaration;
    function getExternalModuleImportEqualsDeclarationExpression(node) {
        ts.Debug.assert(isExternalModuleImportEqualsDeclaration(node));
        return node.moduleReference.expression;
    }
    ts.getExternalModuleImportEqualsDeclarationExpression = getExternalModuleImportEqualsDeclarationExpression;
    function isInternalModuleImportEqualsDeclaration(node) {
        return node.kind === 208 && node.moduleReference.kind !== 219;
    }
    ts.isInternalModuleImportEqualsDeclaration = isInternalModuleImportEqualsDeclaration;
    function getExternalModuleName(node) {
        if (node.kind === 209) {
            return node.moduleSpecifier;
        }
        if (node.kind === 208) {
            var reference = node.moduleReference;
            if (reference.kind === 219) {
                return reference.expression;
            }
        }
        if (node.kind === 215) {
            return node.moduleSpecifier;
        }
    }
    ts.getExternalModuleName = getExternalModuleName;
    function hasDotDotDotToken(node) {
        return node && node.kind === 129 && node.dotDotDotToken !== undefined;
    }
    ts.hasDotDotDotToken = hasDotDotDotToken;
    function hasQuestionToken(node) {
        if (node) {
            switch (node.kind) {
                case 129:
                    return node.questionToken !== undefined;
                case 134:
                case 133:
                    return node.questionToken !== undefined;
                case 225:
                case 224:
                case 132:
                case 131:
                    return node.questionToken !== undefined;
            }
        }
        return false;
    }
    ts.hasQuestionToken = hasQuestionToken;
    function hasRestParameters(s) {
        return s.parameters.length > 0 && s.parameters[s.parameters.length - 1].dotDotDotToken !== undefined;
    }
    ts.hasRestParameters = hasRestParameters;
    function isLiteralKind(kind) {
        return 7 <= kind && kind <= 10;
    }
    ts.isLiteralKind = isLiteralKind;
    function isTextualLiteralKind(kind) {
        return kind === 8 || kind === 10;
    }
    ts.isTextualLiteralKind = isTextualLiteralKind;
    function isTemplateLiteralKind(kind) {
        return 10 <= kind && kind <= 13;
    }
    ts.isTemplateLiteralKind = isTemplateLiteralKind;
    function isBindingPattern(node) {
        return !!node && (node.kind === 151 || node.kind === 150);
    }
    ts.isBindingPattern = isBindingPattern;
    function isInAmbientContext(node) {
        while (node) {
            if (node.flags & (2 | 2048)) {
                return true;
            }
            node = node.parent;
        }
        return false;
    }
    ts.isInAmbientContext = isInAmbientContext;
    function isDeclaration(node) {
        switch (node.kind) {
            case 163:
            case 152:
            case 201:
            case 135:
            case 204:
            case 226:
            case 217:
            case 200:
            case 162:
            case 136:
            case 210:
            case 208:
            case 213:
            case 202:
            case 134:
            case 133:
            case 205:
            case 211:
            case 129:
            case 224:
            case 132:
            case 131:
            case 137:
            case 225:
            case 203:
            case 128:
            case 198:
                return true;
        }
        return false;
    }
    ts.isDeclaration = isDeclaration;
    function isStatement(n) {
        switch (n.kind) {
            case 190:
            case 189:
            case 197:
            case 184:
            case 182:
            case 181:
            case 187:
            case 188:
            case 186:
            case 183:
            case 194:
            case 191:
            case 193:
            case 94:
            case 196:
            case 180:
            case 185:
            case 192:
            case 214:
                return true;
            default:
                return false;
        }
    }
    ts.isStatement = isStatement;
    function isClassElement(n) {
        switch (n.kind) {
            case 135:
            case 132:
            case 134:
            case 136:
            case 137:
            case 133:
            case 140:
                return true;
            default:
                return false;
        }
    }
    ts.isClassElement = isClassElement;
    function isDeclarationName(name) {
        if (name.kind !== 65 && name.kind !== 8 && name.kind !== 7) {
            return false;
        }
        var parent = name.parent;
        if (parent.kind === 213 || parent.kind === 217) {
            if (parent.propertyName) {
                return true;
            }
        }
        if (isDeclaration(parent)) {
            return parent.name === name;
        }
        return false;
    }
    ts.isDeclarationName = isDeclarationName;
    function isAliasSymbolDeclaration(node) {
        return node.kind === 208 ||
            node.kind === 210 && !!node.name ||
            node.kind === 211 ||
            node.kind === 213 ||
            node.kind === 217 ||
            node.kind === 214 && node.expression.kind === 65;
    }
    ts.isAliasSymbolDeclaration = isAliasSymbolDeclaration;
    function getClassExtendsHeritageClauseElement(node) {
        var heritageClause = getHeritageClause(node.heritageClauses, 79);
        return heritageClause && heritageClause.types.length > 0 ? heritageClause.types[0] : undefined;
    }
    ts.getClassExtendsHeritageClauseElement = getClassExtendsHeritageClauseElement;
    function getClassImplementsHeritageClauseElements(node) {
        var heritageClause = getHeritageClause(node.heritageClauses, 102);
        return heritageClause ? heritageClause.types : undefined;
    }
    ts.getClassImplementsHeritageClauseElements = getClassImplementsHeritageClauseElements;
    function getInterfaceBaseTypeNodes(node) {
        var heritageClause = getHeritageClause(node.heritageClauses, 79);
        return heritageClause ? heritageClause.types : undefined;
    }
    ts.getInterfaceBaseTypeNodes = getInterfaceBaseTypeNodes;
    function getHeritageClause(clauses, kind) {
        if (clauses) {
            for (var _i = 0; _i < clauses.length; _i++) {
                var clause = clauses[_i];
                if (clause.token === kind) {
                    return clause;
                }
            }
        }
        return undefined;
    }
    ts.getHeritageClause = getHeritageClause;
    function tryResolveScriptReference(host, sourceFile, reference) {
        if (!host.getCompilerOptions().noResolve) {
            var referenceFileName = ts.isRootedDiskPath(reference.fileName) ? reference.fileName : ts.combinePaths(ts.getDirectoryPath(sourceFile.fileName), reference.fileName);
            referenceFileName = ts.getNormalizedAbsolutePath(referenceFileName, host.getCurrentDirectory());
            return host.getSourceFile(referenceFileName);
        }
    }
    ts.tryResolveScriptReference = tryResolveScriptReference;
    function getAncestor(node, kind) {
        while (node) {
            if (node.kind === kind) {
                return node;
            }
            node = node.parent;
        }
        return undefined;
    }
    ts.getAncestor = getAncestor;
    function getFileReferenceFromReferencePath(comment, commentRange) {
        var simpleReferenceRegEx = /^\/\/\/\s*<reference\s+/gim;
        var isNoDefaultLibRegEx = /^(\/\/\/\s*<reference\s+no-default-lib\s*=\s*)('|")(.+?)\2\s*\/>/gim;
        if (simpleReferenceRegEx.exec(comment)) {
            if (isNoDefaultLibRegEx.exec(comment)) {
                return {
                    isNoDefaultLib: true
                };
            }
            else {
                var matchResult = ts.fullTripleSlashReferencePathRegEx.exec(comment);
                if (matchResult) {
                    var start = commentRange.pos;
                    var end = commentRange.end;
                    return {
                        fileReference: {
                            pos: start,
                            end: end,
                            fileName: matchResult[3]
                        },
                        isNoDefaultLib: false
                    };
                }
                else {
                    return {
                        diagnosticMessage: ts.Diagnostics.Invalid_reference_directive_syntax,
                        isNoDefaultLib: false
                    };
                }
            }
        }
        return undefined;
    }
    ts.getFileReferenceFromReferencePath = getFileReferenceFromReferencePath;
    function isKeyword(token) {
        return 66 <= token && token <= 125;
    }
    ts.isKeyword = isKeyword;
    function isTrivia(token) {
        return 2 <= token && token <= 6;
    }
    ts.isTrivia = isTrivia;
    function hasDynamicName(declaration) {
        return declaration.name &&
            declaration.name.kind === 127 &&
            !isWellKnownSymbolSyntactically(declaration.name.expression);
    }
    ts.hasDynamicName = hasDynamicName;
    function isWellKnownSymbolSyntactically(node) {
        return node.kind === 155 && isESSymbolIdentifier(node.expression);
    }
    ts.isWellKnownSymbolSyntactically = isWellKnownSymbolSyntactically;
    function getPropertyNameForPropertyNameNode(name) {
        if (name.kind === 65 || name.kind === 8 || name.kind === 7) {
            return name.text;
        }
        if (name.kind === 127) {
            var nameExpression = name.expression;
            if (isWellKnownSymbolSyntactically(nameExpression)) {
                var rightHandSideName = nameExpression.name.text;
                return getPropertyNameForKnownSymbolName(rightHandSideName);
            }
        }
        return undefined;
    }
    ts.getPropertyNameForPropertyNameNode = getPropertyNameForPropertyNameNode;
    function getPropertyNameForKnownSymbolName(symbolName) {
        return "__@" + symbolName;
    }
    ts.getPropertyNameForKnownSymbolName = getPropertyNameForKnownSymbolName;
    function isESSymbolIdentifier(node) {
        return node.kind === 65 && node.text === "Symbol";
    }
    ts.isESSymbolIdentifier = isESSymbolIdentifier;
    function isModifier(token) {
        switch (token) {
            case 108:
            case 106:
            case 107:
            case 109:
            case 78:
            case 115:
            case 70:
            case 73:
                return true;
        }
        return false;
    }
    ts.isModifier = isModifier;
    function nodeStartsNewLexicalEnvironment(n) {
        return isFunctionLike(n) || n.kind === 205 || n.kind === 227;
    }
    ts.nodeStartsNewLexicalEnvironment = nodeStartsNewLexicalEnvironment;
    function nodeIsSynthesized(node) {
        return node.pos === -1;
    }
    ts.nodeIsSynthesized = nodeIsSynthesized;
    function createSynthesizedNode(kind, startsOnNewLine) {
        var node = ts.createNode(kind);
        node.pos = -1;
        node.end = -1;
        node.startsOnNewLine = startsOnNewLine;
        return node;
    }
    ts.createSynthesizedNode = createSynthesizedNode;
    function createSynthesizedNodeArray() {
        var array = [];
        array.pos = -1;
        array.end = -1;
        return array;
    }
    ts.createSynthesizedNodeArray = createSynthesizedNodeArray;
    function createDiagnosticCollection() {
        var nonFileDiagnostics = [];
        var fileDiagnostics = {};
        var diagnosticsModified = false;
        var modificationCount = 0;
        return {
            add: add,
            getGlobalDiagnostics: getGlobalDiagnostics,
            getDiagnostics: getDiagnostics,
            getModificationCount: getModificationCount
        };
        function getModificationCount() {
            return modificationCount;
        }
        function add(diagnostic) {
            var diagnostics;
            if (diagnostic.file) {
                diagnostics = fileDiagnostics[diagnostic.file.fileName];
                if (!diagnostics) {
                    diagnostics = [];
                    fileDiagnostics[diagnostic.file.fileName] = diagnostics;
                }
            }
            else {
                diagnostics = nonFileDiagnostics;
            }
            diagnostics.push(diagnostic);
            diagnosticsModified = true;
            modificationCount++;
        }
        function getGlobalDiagnostics() {
            sortAndDeduplicate();
            return nonFileDiagnostics;
        }
        function getDiagnostics(fileName) {
            sortAndDeduplicate();
            if (fileName) {
                return fileDiagnostics[fileName] || [];
            }
            var allDiagnostics = [];
            function pushDiagnostic(d) {
                allDiagnostics.push(d);
            }
            ts.forEach(nonFileDiagnostics, pushDiagnostic);
            for (var key in fileDiagnostics) {
                if (ts.hasProperty(fileDiagnostics, key)) {
                    ts.forEach(fileDiagnostics[key], pushDiagnostic);
                }
            }
            return ts.sortAndDeduplicateDiagnostics(allDiagnostics);
        }
        function sortAndDeduplicate() {
            if (!diagnosticsModified) {
                return;
            }
            diagnosticsModified = false;
            nonFileDiagnostics = ts.sortAndDeduplicateDiagnostics(nonFileDiagnostics);
            for (var key in fileDiagnostics) {
                if (ts.hasProperty(fileDiagnostics, key)) {
                    fileDiagnostics[key] = ts.sortAndDeduplicateDiagnostics(fileDiagnostics[key]);
                }
            }
        }
    }
    ts.createDiagnosticCollection = createDiagnosticCollection;
    var escapedCharsRegExp = /[\\\"\u0000-\u001f\t\v\f\b\r\n\u2028\u2029\u0085]/g;
    var escapedCharsMap = {
        "\0": "\\0",
        "\t": "\\t",
        "\v": "\\v",
        "\f": "\\f",
        "\b": "\\b",
        "\r": "\\r",
        "\n": "\\n",
        "\\": "\\\\",
        "\"": "\\\"",
        "\u2028": "\\u2028",
        "\u2029": "\\u2029",
        "\u0085": "\\u0085"
    };
    function escapeString(s) {
        s = escapedCharsRegExp.test(s) ? s.replace(escapedCharsRegExp, getReplacement) : s;
        return s;
        function getReplacement(c) {
            return escapedCharsMap[c] || get16BitUnicodeEscapeSequence(c.charCodeAt(0));
        }
    }
    ts.escapeString = escapeString;
    function get16BitUnicodeEscapeSequence(charCode) {
        var hexCharCode = charCode.toString(16).toUpperCase();
        var paddedHexCode = ("0000" + hexCharCode).slice(-4);
        return "\\u" + paddedHexCode;
    }
    var nonAsciiCharacters = /[^\u0000-\u007F]/g;
    function escapeNonAsciiCharacters(s) {
        return nonAsciiCharacters.test(s) ?
            s.replace(nonAsciiCharacters, function (c) { return get16BitUnicodeEscapeSequence(c.charCodeAt(0)); }) :
            s;
    }
    ts.escapeNonAsciiCharacters = escapeNonAsciiCharacters;
    var indentStrings = ["", "    "];
    function getIndentString(level) {
        if (indentStrings[level] === undefined) {
            indentStrings[level] = getIndentString(level - 1) + indentStrings[1];
        }
        return indentStrings[level];
    }
    ts.getIndentString = getIndentString;
    function getIndentSize() {
        return indentStrings[1].length;
    }
    ts.getIndentSize = getIndentSize;
    function createTextWriter(newLine) {
        var output = "";
        var indent = 0;
        var lineStart = true;
        var lineCount = 0;
        var linePos = 0;
        function write(s) {
            if (s && s.length) {
                if (lineStart) {
                    output += getIndentString(indent);
                    lineStart = false;
                }
                output += s;
            }
        }
        function rawWrite(s) {
            if (s !== undefined) {
                if (lineStart) {
                    lineStart = false;
                }
                output += s;
            }
        }
        function writeLiteral(s) {
            if (s && s.length) {
                write(s);
                var lineStartsOfS = ts.computeLineStarts(s);
                if (lineStartsOfS.length > 1) {
                    lineCount = lineCount + lineStartsOfS.length - 1;
                    linePos = output.length - s.length + lineStartsOfS[lineStartsOfS.length - 1];
                }
            }
        }
        function writeLine() {
            if (!lineStart) {
                output += newLine;
                lineCount++;
                linePos = output.length;
                lineStart = true;
            }
        }
        function writeTextOfNode(sourceFile, node) {
            write(getSourceTextOfNodeFromSourceFile(sourceFile, node));
        }
        return {
            write: write,
            rawWrite: rawWrite,
            writeTextOfNode: writeTextOfNode,
            writeLiteral: writeLiteral,
            writeLine: writeLine,
            increaseIndent: function () { return indent++; },
            decreaseIndent: function () { return indent--; },
            getIndent: function () { return indent; },
            getTextPos: function () { return output.length; },
            getLine: function () { return lineCount + 1; },
            getColumn: function () { return lineStart ? indent * getIndentSize() + 1 : output.length - linePos + 1; },
            getText: function () { return output; },
        };
    }
    ts.createTextWriter = createTextWriter;
    function getOwnEmitOutputFilePath(sourceFile, host, extension) {
        var compilerOptions = host.getCompilerOptions();
        var emitOutputFilePathWithoutExtension;
        if (compilerOptions.outDir) {
            emitOutputFilePathWithoutExtension = ts.removeFileExtension(getSourceFilePathInNewDir(sourceFile, host, compilerOptions.outDir));
        }
        else {
            emitOutputFilePathWithoutExtension = ts.removeFileExtension(sourceFile.fileName);
        }
        return emitOutputFilePathWithoutExtension + extension;
    }
    ts.getOwnEmitOutputFilePath = getOwnEmitOutputFilePath;
    function getSourceFilePathInNewDir(sourceFile, host, newDirPath) {
        var sourceFilePath = ts.getNormalizedAbsolutePath(sourceFile.fileName, host.getCurrentDirectory());
        sourceFilePath = sourceFilePath.replace(host.getCommonSourceDirectory(), "");
        return ts.combinePaths(newDirPath, sourceFilePath);
    }
    ts.getSourceFilePathInNewDir = getSourceFilePathInNewDir;
    function writeFile(host, diagnostics, fileName, data, writeByteOrderMark) {
        host.writeFile(fileName, data, writeByteOrderMark, function (hostErrorMessage) {
            diagnostics.push(ts.createCompilerDiagnostic(ts.Diagnostics.Could_not_write_file_0_Colon_1, fileName, hostErrorMessage));
        });
    }
    ts.writeFile = writeFile;
    function getLineOfLocalPosition(currentSourceFile, pos) {
        return ts.getLineAndCharacterOfPosition(currentSourceFile, pos).line;
    }
    ts.getLineOfLocalPosition = getLineOfLocalPosition;
    function getFirstConstructorWithBody(node) {
        return ts.forEach(node.members, function (member) {
            if (member.kind === 135 && nodeIsPresent(member.body)) {
                return member;
            }
        });
    }
    ts.getFirstConstructorWithBody = getFirstConstructorWithBody;
    function shouldEmitToOwnFile(sourceFile, compilerOptions) {
        if (!isDeclarationFile(sourceFile)) {
            if ((isExternalModule(sourceFile) || !compilerOptions.out) && !ts.fileExtensionIs(sourceFile.fileName, ".js")) {
                return true;
            }
            return false;
        }
        return false;
    }
    ts.shouldEmitToOwnFile = shouldEmitToOwnFile;
    function getAllAccessorDeclarations(declarations, accessor) {
        var firstAccessor;
        var secondAccessor;
        var getAccessor;
        var setAccessor;
        if (hasDynamicName(accessor)) {
            firstAccessor = accessor;
            if (accessor.kind === 136) {
                getAccessor = accessor;
            }
            else if (accessor.kind === 137) {
                setAccessor = accessor;
            }
            else {
                ts.Debug.fail("Accessor has wrong kind");
            }
        }
        else {
            ts.forEach(declarations, function (member) {
                if ((member.kind === 136 || member.kind === 137)
                    && (member.flags & 128) === (accessor.flags & 128)) {
                    var memberName = getPropertyNameForPropertyNameNode(member.name);
                    var accessorName = getPropertyNameForPropertyNameNode(accessor.name);
                    if (memberName === accessorName) {
                        if (!firstAccessor) {
                            firstAccessor = member;
                        }
                        else if (!secondAccessor) {
                            secondAccessor = member;
                        }
                        if (member.kind === 136 && !getAccessor) {
                            getAccessor = member;
                        }
                        if (member.kind === 137 && !setAccessor) {
                            setAccessor = member;
                        }
                    }
                }
            });
        }
        return {
            firstAccessor: firstAccessor,
            secondAccessor: secondAccessor,
            getAccessor: getAccessor,
            setAccessor: setAccessor
        };
    }
    ts.getAllAccessorDeclarations = getAllAccessorDeclarations;
    function emitNewLineBeforeLeadingComments(currentSourceFile, writer, node, leadingComments) {
        if (leadingComments && leadingComments.length && node.pos !== leadingComments[0].pos &&
            getLineOfLocalPosition(currentSourceFile, node.pos) !== getLineOfLocalPosition(currentSourceFile, leadingComments[0].pos)) {
            writer.writeLine();
        }
    }
    ts.emitNewLineBeforeLeadingComments = emitNewLineBeforeLeadingComments;
    function emitComments(currentSourceFile, writer, comments, trailingSeparator, newLine, writeComment) {
        var emitLeadingSpace = !trailingSeparator;
        ts.forEach(comments, function (comment) {
            if (emitLeadingSpace) {
                writer.write(" ");
                emitLeadingSpace = false;
            }
            writeComment(currentSourceFile, writer, comment, newLine);
            if (comment.hasTrailingNewLine) {
                writer.writeLine();
            }
            else if (trailingSeparator) {
                writer.write(" ");
            }
            else {
                emitLeadingSpace = true;
            }
        });
    }
    ts.emitComments = emitComments;
    function writeCommentRange(currentSourceFile, writer, comment, newLine) {
        if (currentSourceFile.text.charCodeAt(comment.pos + 1) === 42) {
            var firstCommentLineAndCharacter = ts.getLineAndCharacterOfPosition(currentSourceFile, comment.pos);
            var lineCount = ts.getLineStarts(currentSourceFile).length;
            var firstCommentLineIndent;
            for (var pos = comment.pos, currentLine = firstCommentLineAndCharacter.line; pos < comment.end; currentLine++) {
                var nextLineStart = (currentLine + 1) === lineCount
                    ? currentSourceFile.text.length + 1
                    : getStartPositionOfLine(currentLine + 1, currentSourceFile);
                if (pos !== comment.pos) {
                    if (firstCommentLineIndent === undefined) {
                        firstCommentLineIndent = calculateIndent(getStartPositionOfLine(firstCommentLineAndCharacter.line, currentSourceFile), comment.pos);
                    }
                    var currentWriterIndentSpacing = writer.getIndent() * getIndentSize();
                    var spacesToEmit = currentWriterIndentSpacing - firstCommentLineIndent + calculateIndent(pos, nextLineStart);
                    if (spacesToEmit > 0) {
                        var numberOfSingleSpacesToEmit = spacesToEmit % getIndentSize();
                        var indentSizeSpaceString = getIndentString((spacesToEmit - numberOfSingleSpacesToEmit) / getIndentSize());
                        writer.rawWrite(indentSizeSpaceString);
                        while (numberOfSingleSpacesToEmit) {
                            writer.rawWrite(" ");
                            numberOfSingleSpacesToEmit--;
                        }
                    }
                    else {
                        writer.rawWrite("");
                    }
                }
                writeTrimmedCurrentLine(pos, nextLineStart);
                pos = nextLineStart;
            }
        }
        else {
            writer.write(currentSourceFile.text.substring(comment.pos, comment.end));
        }
        function writeTrimmedCurrentLine(pos, nextLineStart) {
            var end = Math.min(comment.end, nextLineStart - 1);
            var currentLineText = currentSourceFile.text.substring(pos, end).replace(/^\s+|\s+$/g, '');
            if (currentLineText) {
                writer.write(currentLineText);
                if (end !== comment.end) {
                    writer.writeLine();
                }
            }
            else {
                writer.writeLiteral(newLine);
            }
        }
        function calculateIndent(pos, end) {
            var currentLineIndent = 0;
            for (; pos < end && ts.isWhiteSpace(currentSourceFile.text.charCodeAt(pos)); pos++) {
                if (currentSourceFile.text.charCodeAt(pos) === 9) {
                    currentLineIndent += getIndentSize() - (currentLineIndent % getIndentSize());
                }
                else {
                    currentLineIndent++;
                }
            }
            return currentLineIndent;
        }
    }
    ts.writeCommentRange = writeCommentRange;
    function modifierToFlag(token) {
        switch (token) {
            case 109: return 128;
            case 108: return 16;
            case 107: return 64;
            case 106: return 32;
            case 78: return 1;
            case 115: return 2;
            case 70: return 8192;
            case 73: return 256;
        }
        return 0;
    }
    ts.modifierToFlag = modifierToFlag;
    function isLeftHandSideExpression(expr) {
        if (expr) {
            switch (expr.kind) {
                case 155:
                case 156:
                case 158:
                case 157:
                case 159:
                case 153:
                case 161:
                case 154:
                case 174:
                case 162:
                case 65:
                case 9:
                case 7:
                case 8:
                case 10:
                case 171:
                case 80:
                case 89:
                case 93:
                case 95:
                case 91:
                    return true;
            }
        }
        return false;
    }
    ts.isLeftHandSideExpression = isLeftHandSideExpression;
    function isAssignmentOperator(token) {
        return token >= 53 && token <= 64;
    }
    ts.isAssignmentOperator = isAssignmentOperator;
    function isSupportedHeritageClauseElement(node) {
        return isSupportedHeritageClauseElementExpression(node.expression);
    }
    ts.isSupportedHeritageClauseElement = isSupportedHeritageClauseElement;
    function isSupportedHeritageClauseElementExpression(node) {
        if (node.kind === 65) {
            return true;
        }
        else if (node.kind === 155) {
            return isSupportedHeritageClauseElementExpression(node.expression);
        }
        else {
            return false;
        }
    }
    function isRightSideOfQualifiedNameOrPropertyAccess(node) {
        return (node.parent.kind === 126 && node.parent.right === node) ||
            (node.parent.kind === 155 && node.parent.name === node);
    }
    ts.isRightSideOfQualifiedNameOrPropertyAccess = isRightSideOfQualifiedNameOrPropertyAccess;
    function getLocalSymbolForExportDefault(symbol) {
        return symbol && symbol.valueDeclaration && (symbol.valueDeclaration.flags & 256) ? symbol.valueDeclaration.localSymbol : undefined;
    }
    ts.getLocalSymbolForExportDefault = getLocalSymbolForExportDefault;
})(ts || (ts = {}));
var ts;
(function (ts) {
    function getDefaultLibFileName(options) {
        return options.target === 2 ? "lib.es6.d.ts" : "lib.d.ts";
    }
    ts.getDefaultLibFileName = getDefaultLibFileName;
    function textSpanEnd(span) {
        return span.start + span.length;
    }
    ts.textSpanEnd = textSpanEnd;
    function textSpanIsEmpty(span) {
        return span.length === 0;
    }
    ts.textSpanIsEmpty = textSpanIsEmpty;
    function textSpanContainsPosition(span, position) {
        return position >= span.start && position < textSpanEnd(span);
    }
    ts.textSpanContainsPosition = textSpanContainsPosition;
    function textSpanContainsTextSpan(span, other) {
        return other.start >= span.start && textSpanEnd(other) <= textSpanEnd(span);
    }
    ts.textSpanContainsTextSpan = textSpanContainsTextSpan;
    function textSpanOverlapsWith(span, other) {
        var overlapStart = Math.max(span.start, other.start);
        var overlapEnd = Math.min(textSpanEnd(span), textSpanEnd(other));
        return overlapStart < overlapEnd;
    }
    ts.textSpanOverlapsWith = textSpanOverlapsWith;
    function textSpanOverlap(span1, span2) {
        var overlapStart = Math.max(span1.start, span2.start);
        var overlapEnd = Math.min(textSpanEnd(span1), textSpanEnd(span2));
        if (overlapStart < overlapEnd) {
            return createTextSpanFromBounds(overlapStart, overlapEnd);
        }
        return undefined;
    }
    ts.textSpanOverlap = textSpanOverlap;
    function textSpanIntersectsWithTextSpan(span, other) {
        return other.start <= textSpanEnd(span) && textSpanEnd(other) >= span.start;
    }
    ts.textSpanIntersectsWithTextSpan = textSpanIntersectsWithTextSpan;
    function textSpanIntersectsWith(span, start, length) {
        var end = start + length;
        return start <= textSpanEnd(span) && end >= span.start;
    }
    ts.textSpanIntersectsWith = textSpanIntersectsWith;
    function textSpanIntersectsWithPosition(span, position) {
        return position <= textSpanEnd(span) && position >= span.start;
    }
    ts.textSpanIntersectsWithPosition = textSpanIntersectsWithPosition;
    function textSpanIntersection(span1, span2) {
        var intersectStart = Math.max(span1.start, span2.start);
        var intersectEnd = Math.min(textSpanEnd(span1), textSpanEnd(span2));
        if (intersectStart <= intersectEnd) {
            return createTextSpanFromBounds(intersectStart, intersectEnd);
        }
        return undefined;
    }
    ts.textSpanIntersection = textSpanIntersection;
    function createTextSpan(start, length) {
        if (start < 0) {
            throw new Error("start < 0");
        }
        if (length < 0) {
            throw new Error("length < 0");
        }
        return { start: start, length: length };
    }
    ts.createTextSpan = createTextSpan;
    function createTextSpanFromBounds(start, end) {
        return createTextSpan(start, end - start);
    }
    ts.createTextSpanFromBounds = createTextSpanFromBounds;
    function textChangeRangeNewSpan(range) {
        return createTextSpan(range.span.start, range.newLength);
    }
    ts.textChangeRangeNewSpan = textChangeRangeNewSpan;
    function textChangeRangeIsUnchanged(range) {
        return textSpanIsEmpty(range.span) && range.newLength === 0;
    }
    ts.textChangeRangeIsUnchanged = textChangeRangeIsUnchanged;
    function createTextChangeRange(span, newLength) {
        if (newLength < 0) {
            throw new Error("newLength < 0");
        }
        return { span: span, newLength: newLength };
    }
    ts.createTextChangeRange = createTextChangeRange;
    ts.unchangedTextChangeRange = createTextChangeRange(createTextSpan(0, 0), 0);
    function collapseTextChangeRangesAcrossMultipleVersions(changes) {
        if (changes.length === 0) {
            return ts.unchangedTextChangeRange;
        }
        if (changes.length === 1) {
            return changes[0];
        }
        var change0 = changes[0];
        var oldStartN = change0.span.start;
        var oldEndN = textSpanEnd(change0.span);
        var newEndN = oldStartN + change0.newLength;
        for (var i = 1; i < changes.length; i++) {
            var nextChange = changes[i];
            var oldStart1 = oldStartN;
            var oldEnd1 = oldEndN;
            var newEnd1 = newEndN;
            var oldStart2 = nextChange.span.start;
            var oldEnd2 = textSpanEnd(nextChange.span);
            var newEnd2 = oldStart2 + nextChange.newLength;
            oldStartN = Math.min(oldStart1, oldStart2);
            oldEndN = Math.max(oldEnd1, oldEnd1 + (oldEnd2 - newEnd1));
            newEndN = Math.max(newEnd2, newEnd2 + (newEnd1 - oldEnd2));
        }
        return createTextChangeRange(createTextSpanFromBounds(oldStartN, oldEndN), newEndN - oldStartN);
    }
    ts.collapseTextChangeRangesAcrossMultipleVersions = collapseTextChangeRangesAcrossMultipleVersions;
})(ts || (ts = {}));
