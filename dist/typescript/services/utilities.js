var ts;
(function (ts) {
    function getEndLinePosition(line, sourceFile) {
        ts.Debug.assert(line >= 0);
        var lineStarts = sourceFile.getLineStarts();
        var lineIndex = line;
        if (lineIndex + 1 === lineStarts.length) {
            return sourceFile.text.length - 1;
        }
        else {
            var start = lineStarts[lineIndex];
            var pos = lineStarts[lineIndex + 1] - 1;
            ts.Debug.assert(ts.isLineBreak(sourceFile.text.charCodeAt(pos)));
            while (start <= pos && ts.isLineBreak(sourceFile.text.charCodeAt(pos))) {
                pos--;
            }
            return pos;
        }
    }
    ts.getEndLinePosition = getEndLinePosition;
    function getLineStartPositionForPosition(position, sourceFile) {
        var lineStarts = sourceFile.getLineStarts();
        var line = sourceFile.getLineAndCharacterOfPosition(position).line;
        return lineStarts[line];
    }
    ts.getLineStartPositionForPosition = getLineStartPositionForPosition;
    function rangeContainsRange(r1, r2) {
        return startEndContainsRange(r1.pos, r1.end, r2);
    }
    ts.rangeContainsRange = rangeContainsRange;
    function startEndContainsRange(start, end, range) {
        return start <= range.pos && end >= range.end;
    }
    ts.startEndContainsRange = startEndContainsRange;
    function rangeContainsStartEnd(range, start, end) {
        return range.pos <= start && range.end >= end;
    }
    ts.rangeContainsStartEnd = rangeContainsStartEnd;
    function rangeOverlapsWithStartEnd(r1, start, end) {
        return startEndOverlapsWithStartEnd(r1.pos, r1.end, start, end);
    }
    ts.rangeOverlapsWithStartEnd = rangeOverlapsWithStartEnd;
    function startEndOverlapsWithStartEnd(start1, end1, start2, end2) {
        var start = Math.max(start1, start2);
        var end = Math.min(end1, end2);
        return start < end;
    }
    ts.startEndOverlapsWithStartEnd = startEndOverlapsWithStartEnd;
    function positionBelongsToNode(candidate, position, sourceFile) {
        return candidate.end > position || !isCompletedNode(candidate, sourceFile);
    }
    ts.positionBelongsToNode = positionBelongsToNode;
    function isCompletedNode(n, sourceFile) {
        if (ts.nodeIsMissing(n)) {
            return false;
        }
        switch (n.kind) {
            case 201:
            case 202:
            case 204:
            case 154:
            case 150:
            case 145:
            case 179:
            case 206:
            case 207:
                return nodeEndsWith(n, 15, sourceFile);
            case 223:
                return isCompletedNode(n.block, sourceFile);
            case 158:
                if (!n.arguments) {
                    return true;
                }
            case 157:
            case 161:
            case 149:
                return nodeEndsWith(n, 17, sourceFile);
            case 142:
            case 143:
                return isCompletedNode(n.type, sourceFile);
            case 135:
            case 136:
            case 137:
            case 200:
            case 162:
            case 134:
            case 133:
            case 139:
            case 138:
            case 163:
                if (n.body) {
                    return isCompletedNode(n.body, sourceFile);
                }
                if (n.type) {
                    return isCompletedNode(n.type, sourceFile);
                }
                return hasChildOfKind(n, 17, sourceFile);
            case 205:
                return n.body && isCompletedNode(n.body, sourceFile);
            case 183:
                if (n.elseStatement) {
                    return isCompletedNode(n.elseStatement, sourceFile);
                }
                return isCompletedNode(n.thenStatement, sourceFile);
            case 182:
                return isCompletedNode(n.expression, sourceFile);
            case 153:
            case 151:
            case 156:
            case 127:
            case 147:
                return nodeEndsWith(n, 19, sourceFile);
            case 140:
                if (n.type) {
                    return isCompletedNode(n.type, sourceFile);
                }
                return hasChildOfKind(n, 19, sourceFile);
            case 220:
            case 221:
                return false;
            case 186:
            case 187:
            case 188:
            case 185:
                return isCompletedNode(n.statement, sourceFile);
            case 184:
                var hasWhileKeyword = findChildOfKind(n, 100, sourceFile);
                if (hasWhileKeyword) {
                    return nodeEndsWith(n, 17, sourceFile);
                }
                return isCompletedNode(n.statement, sourceFile);
            case 144:
                return isCompletedNode(n.exprName, sourceFile);
            case 165:
            case 164:
            case 166:
            case 172:
            case 173:
                var unaryWordExpression = n;
                return isCompletedNode(unaryWordExpression.expression, sourceFile);
            case 159:
                return isCompletedNode(n.template, sourceFile);
            case 171:
                var lastSpan = ts.lastOrUndefined(n.templateSpans);
                return isCompletedNode(lastSpan, sourceFile);
            case 176:
                return ts.nodeIsPresent(n.literal);
            case 167:
                return isCompletedNode(n.operand, sourceFile);
            case 169:
                return isCompletedNode(n.right, sourceFile);
            case 170:
                return isCompletedNode(n.whenFalse, sourceFile);
            default:
                return true;
        }
    }
    ts.isCompletedNode = isCompletedNode;
    function nodeEndsWith(n, expectedLastToken, sourceFile) {
        var children = n.getChildren(sourceFile);
        if (children.length) {
            var last = children[children.length - 1];
            if (last.kind === expectedLastToken) {
                return true;
            }
            else if (last.kind === 22 && children.length !== 1) {
                return children[children.length - 2].kind === expectedLastToken;
            }
        }
        return false;
    }
    function findListItemInfo(node) {
        var list = findContainingList(node);
        if (!list) {
            return undefined;
        }
        var children = list.getChildren();
        var listItemIndex = ts.indexOf(children, node);
        return {
            listItemIndex: listItemIndex,
            list: list
        };
    }
    ts.findListItemInfo = findListItemInfo;
    function hasChildOfKind(n, kind, sourceFile) {
        return !!findChildOfKind(n, kind, sourceFile);
    }
    ts.hasChildOfKind = hasChildOfKind;
    function findChildOfKind(n, kind, sourceFile) {
        return ts.forEach(n.getChildren(sourceFile), function (c) { return c.kind === kind && c; });
    }
    ts.findChildOfKind = findChildOfKind;
    function findContainingList(node) {
        var syntaxList = ts.forEach(node.parent.getChildren(), function (c) {
            if (c.kind === 228 && c.pos <= node.pos && c.end >= node.end) {
                return c;
            }
        });
        ts.Debug.assert(!syntaxList || ts.contains(syntaxList.getChildren(), node));
        return syntaxList;
    }
    ts.findContainingList = findContainingList;
    function getTouchingWord(sourceFile, position) {
        return getTouchingToken(sourceFile, position, function (n) { return isWord(n.kind); });
    }
    ts.getTouchingWord = getTouchingWord;
    function getTouchingPropertyName(sourceFile, position) {
        return getTouchingToken(sourceFile, position, function (n) { return isPropertyName(n.kind); });
    }
    ts.getTouchingPropertyName = getTouchingPropertyName;
    function getTouchingToken(sourceFile, position, includeItemAtEndPosition) {
        return getTokenAtPositionWorker(sourceFile, position, false, includeItemAtEndPosition);
    }
    ts.getTouchingToken = getTouchingToken;
    function getTokenAtPosition(sourceFile, position) {
        return getTokenAtPositionWorker(sourceFile, position, true, undefined);
    }
    ts.getTokenAtPosition = getTokenAtPosition;
    function getTokenAtPositionWorker(sourceFile, position, allowPositionInLeadingTrivia, includeItemAtEndPosition) {
        var current = sourceFile;
        outer: while (true) {
            if (isToken(current)) {
                return current;
            }
            for (var i = 0, n = current.getChildCount(sourceFile); i < n; i++) {
                var child = current.getChildAt(i);
                var start = allowPositionInLeadingTrivia ? child.getFullStart() : child.getStart(sourceFile);
                if (start <= position) {
                    var end = child.getEnd();
                    if (position < end || (position === end && child.kind === 1)) {
                        current = child;
                        continue outer;
                    }
                    else if (includeItemAtEndPosition && end === position) {
                        var previousToken = findPrecedingToken(position, sourceFile, child);
                        if (previousToken && includeItemAtEndPosition(previousToken)) {
                            return previousToken;
                        }
                    }
                }
            }
            return current;
        }
    }
    function findTokenOnLeftOfPosition(file, position) {
        var tokenAtPosition = getTokenAtPosition(file, position);
        if (isToken(tokenAtPosition) && position > tokenAtPosition.getStart(file) && position < tokenAtPosition.getEnd()) {
            return tokenAtPosition;
        }
        return findPrecedingToken(position, file);
    }
    ts.findTokenOnLeftOfPosition = findTokenOnLeftOfPosition;
    function findNextToken(previousToken, parent) {
        return find(parent);
        function find(n) {
            if (isToken(n) && n.pos === previousToken.end) {
                return n;
            }
            var children = n.getChildren();
            for (var _i = 0; _i < children.length; _i++) {
                var child = children[_i];
                var shouldDiveInChildNode = (child.pos <= previousToken.pos && child.end > previousToken.end) ||
                    (child.pos === previousToken.end);
                if (shouldDiveInChildNode && nodeHasTokens(child)) {
                    return find(child);
                }
            }
            return undefined;
        }
    }
    ts.findNextToken = findNextToken;
    function findPrecedingToken(position, sourceFile, startNode) {
        return find(startNode || sourceFile);
        function findRightmostToken(n) {
            if (isToken(n)) {
                return n;
            }
            var children = n.getChildren();
            var candidate = findRightmostChildNodeWithTokens(children, children.length);
            return candidate && findRightmostToken(candidate);
        }
        function find(n) {
            if (isToken(n)) {
                return n;
            }
            var children = n.getChildren();
            for (var i = 0, len = children.length; i < len; i++) {
                var child = children[i];
                if (nodeHasTokens(child)) {
                    if (position <= child.end) {
                        if (child.getStart(sourceFile) >= position) {
                            var candidate = findRightmostChildNodeWithTokens(children, i);
                            return candidate && findRightmostToken(candidate);
                        }
                        else {
                            return find(child);
                        }
                    }
                }
            }
            ts.Debug.assert(startNode !== undefined || n.kind === 227);
            if (children.length) {
                var candidate = findRightmostChildNodeWithTokens(children, children.length);
                return candidate && findRightmostToken(candidate);
            }
        }
        function findRightmostChildNodeWithTokens(children, exclusiveStartPosition) {
            for (var i = exclusiveStartPosition - 1; i >= 0; --i) {
                if (nodeHasTokens(children[i])) {
                    return children[i];
                }
            }
        }
    }
    ts.findPrecedingToken = findPrecedingToken;
    function nodeHasTokens(n) {
        return n.getWidth() !== 0;
    }
    function getNodeModifiers(node) {
        var flags = ts.getCombinedNodeFlags(node);
        var result = [];
        if (flags & 32)
            result.push(ts.ScriptElementKindModifier.privateMemberModifier);
        if (flags & 64)
            result.push(ts.ScriptElementKindModifier.protectedMemberModifier);
        if (flags & 16)
            result.push(ts.ScriptElementKindModifier.publicMemberModifier);
        if (flags & 128)
            result.push(ts.ScriptElementKindModifier.staticModifier);
        if (flags & 1)
            result.push(ts.ScriptElementKindModifier.exportedModifier);
        if (ts.isInAmbientContext(node))
            result.push(ts.ScriptElementKindModifier.ambientModifier);
        return result.length > 0 ? result.join(',') : ts.ScriptElementKindModifier.none;
    }
    ts.getNodeModifiers = getNodeModifiers;
    function getTypeArgumentOrTypeParameterList(node) {
        if (node.kind === 141 || node.kind === 157) {
            return node.typeArguments;
        }
        if (ts.isFunctionLike(node) || node.kind === 201 || node.kind === 202) {
            return node.typeParameters;
        }
        return undefined;
    }
    ts.getTypeArgumentOrTypeParameterList = getTypeArgumentOrTypeParameterList;
    function isToken(n) {
        return n.kind >= 0 && n.kind <= 125;
    }
    ts.isToken = isToken;
    function isWord(kind) {
        return kind === 65 || ts.isKeyword(kind);
    }
    ts.isWord = isWord;
    function isPropertyName(kind) {
        return kind === 8 || kind === 7 || isWord(kind);
    }
    function isComment(kind) {
        return kind === 2 || kind === 3;
    }
    ts.isComment = isComment;
    function isPunctuation(kind) {
        return 14 <= kind && kind <= 64;
    }
    ts.isPunctuation = isPunctuation;
    function isInsideTemplateLiteral(node, position) {
        return ts.isTemplateLiteralKind(node.kind)
            && (node.getStart() < position && position < node.getEnd()) || (!!node.isUnterminated && position === node.getEnd());
    }
    ts.isInsideTemplateLiteral = isInsideTemplateLiteral;
    function isAccessibilityModifier(kind) {
        switch (kind) {
            case 108:
            case 106:
            case 107:
                return true;
        }
        return false;
    }
    ts.isAccessibilityModifier = isAccessibilityModifier;
    function compareDataObjects(dst, src) {
        for (var e in dst) {
            if (typeof dst[e] === "object") {
                if (!compareDataObjects(dst[e], src[e])) {
                    return false;
                }
            }
            else if (typeof dst[e] !== "function") {
                if (dst[e] !== src[e]) {
                    return false;
                }
            }
        }
        return true;
    }
    ts.compareDataObjects = compareDataObjects;
})(ts || (ts = {}));
var ts;
(function (ts) {
    function isFirstDeclarationOfSymbolParameter(symbol) {
        return symbol.declarations && symbol.declarations.length > 0 && symbol.declarations[0].kind === 129;
    }
    ts.isFirstDeclarationOfSymbolParameter = isFirstDeclarationOfSymbolParameter;
    var displayPartWriter = getDisplayPartWriter();
    function getDisplayPartWriter() {
        var displayParts;
        var lineStart;
        var indent;
        resetWriter();
        return {
            displayParts: function () { return displayParts; },
            writeKeyword: function (text) { return writeKind(text, ts.SymbolDisplayPartKind.keyword); },
            writeOperator: function (text) { return writeKind(text, ts.SymbolDisplayPartKind.operator); },
            writePunctuation: function (text) { return writeKind(text, ts.SymbolDisplayPartKind.punctuation); },
            writeSpace: function (text) { return writeKind(text, ts.SymbolDisplayPartKind.space); },
            writeStringLiteral: function (text) { return writeKind(text, ts.SymbolDisplayPartKind.stringLiteral); },
            writeParameter: function (text) { return writeKind(text, ts.SymbolDisplayPartKind.parameterName); },
            writeSymbol: writeSymbol,
            writeLine: writeLine,
            increaseIndent: function () { indent++; },
            decreaseIndent: function () { indent--; },
            clear: resetWriter,
            trackSymbol: function () { }
        };
        function writeIndent() {
            if (lineStart) {
                var indentString = ts.getIndentString(indent);
                if (indentString) {
                    displayParts.push(displayPart(indentString, ts.SymbolDisplayPartKind.space));
                }
                lineStart = false;
            }
        }
        function writeKind(text, kind) {
            writeIndent();
            displayParts.push(displayPart(text, kind));
        }
        function writeSymbol(text, symbol) {
            writeIndent();
            displayParts.push(symbolPart(text, symbol));
        }
        function writeLine() {
            displayParts.push(lineBreakPart());
            lineStart = true;
        }
        function resetWriter() {
            displayParts = [];
            lineStart = true;
            indent = 0;
        }
    }
    function symbolPart(text, symbol) {
        return displayPart(text, displayPartKind(symbol), symbol);
        function displayPartKind(symbol) {
            var flags = symbol.flags;
            if (flags & 3) {
                return isFirstDeclarationOfSymbolParameter(symbol) ? ts.SymbolDisplayPartKind.parameterName : ts.SymbolDisplayPartKind.localName;
            }
            else if (flags & 4) {
                return ts.SymbolDisplayPartKind.propertyName;
            }
            else if (flags & 32768) {
                return ts.SymbolDisplayPartKind.propertyName;
            }
            else if (flags & 65536) {
                return ts.SymbolDisplayPartKind.propertyName;
            }
            else if (flags & 8) {
                return ts.SymbolDisplayPartKind.enumMemberName;
            }
            else if (flags & 16) {
                return ts.SymbolDisplayPartKind.functionName;
            }
            else if (flags & 32) {
                return ts.SymbolDisplayPartKind.className;
            }
            else if (flags & 64) {
                return ts.SymbolDisplayPartKind.interfaceName;
            }
            else if (flags & 384) {
                return ts.SymbolDisplayPartKind.enumName;
            }
            else if (flags & 1536) {
                return ts.SymbolDisplayPartKind.moduleName;
            }
            else if (flags & 8192) {
                return ts.SymbolDisplayPartKind.methodName;
            }
            else if (flags & 262144) {
                return ts.SymbolDisplayPartKind.typeParameterName;
            }
            else if (flags & 524288) {
                return ts.SymbolDisplayPartKind.aliasName;
            }
            else if (flags & 8388608) {
                return ts.SymbolDisplayPartKind.aliasName;
            }
            return ts.SymbolDisplayPartKind.text;
        }
    }
    ts.symbolPart = symbolPart;
    function displayPart(text, kind, symbol) {
        return {
            text: text,
            kind: ts.SymbolDisplayPartKind[kind]
        };
    }
    ts.displayPart = displayPart;
    function spacePart() {
        return displayPart(" ", ts.SymbolDisplayPartKind.space);
    }
    ts.spacePart = spacePart;
    function keywordPart(kind) {
        return displayPart(ts.tokenToString(kind), ts.SymbolDisplayPartKind.keyword);
    }
    ts.keywordPart = keywordPart;
    function punctuationPart(kind) {
        return displayPart(ts.tokenToString(kind), ts.SymbolDisplayPartKind.punctuation);
    }
    ts.punctuationPart = punctuationPart;
    function operatorPart(kind) {
        return displayPart(ts.tokenToString(kind), ts.SymbolDisplayPartKind.operator);
    }
    ts.operatorPart = operatorPart;
    function textOrKeywordPart(text) {
        var kind = ts.stringToToken(text);
        return kind === undefined
            ? textPart(text)
            : keywordPart(kind);
    }
    ts.textOrKeywordPart = textOrKeywordPart;
    function textPart(text) {
        return displayPart(text, ts.SymbolDisplayPartKind.text);
    }
    ts.textPart = textPart;
    function lineBreakPart() {
        return displayPart("\n", ts.SymbolDisplayPartKind.lineBreak);
    }
    ts.lineBreakPart = lineBreakPart;
    function mapToDisplayParts(writeDisplayParts) {
        writeDisplayParts(displayPartWriter);
        var result = displayPartWriter.displayParts();
        displayPartWriter.clear();
        return result;
    }
    ts.mapToDisplayParts = mapToDisplayParts;
    function typeToDisplayParts(typechecker, type, enclosingDeclaration, flags) {
        return mapToDisplayParts(function (writer) {
            typechecker.getSymbolDisplayBuilder().buildTypeDisplay(type, writer, enclosingDeclaration, flags);
        });
    }
    ts.typeToDisplayParts = typeToDisplayParts;
    function symbolToDisplayParts(typeChecker, symbol, enclosingDeclaration, meaning, flags) {
        return mapToDisplayParts(function (writer) {
            typeChecker.getSymbolDisplayBuilder().buildSymbolDisplay(symbol, writer, enclosingDeclaration, meaning, flags);
        });
    }
    ts.symbolToDisplayParts = symbolToDisplayParts;
    function signatureToDisplayParts(typechecker, signature, enclosingDeclaration, flags) {
        return mapToDisplayParts(function (writer) {
            typechecker.getSymbolDisplayBuilder().buildSignatureDisplay(signature, writer, enclosingDeclaration, flags);
        });
    }
    ts.signatureToDisplayParts = signatureToDisplayParts;
    function isJavaScript(fileName) {
        return ts.fileExtensionIs(fileName, ".js");
    }
    ts.isJavaScript = isJavaScript;
})(ts || (ts = {}));
