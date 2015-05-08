/// <reference path="checker.ts"/>
/// <reference path="declarationEmitter.ts"/>
var ts;
(function (ts) {
    function isExternalModuleOrDeclarationFile(sourceFile) {
        return ts.isExternalModule(sourceFile) || ts.isDeclarationFile(sourceFile);
    }
    ts.isExternalModuleOrDeclarationFile = isExternalModuleOrDeclarationFile;
    var TempFlags;
    (function (TempFlags) {
        TempFlags[TempFlags["Auto"] = 0] = "Auto";
        TempFlags[TempFlags["CountMask"] = 268435455] = "CountMask";
        TempFlags[TempFlags["_i"] = 268435456] = "_i";
    })(TempFlags || (TempFlags = {}));
    function emitFiles(resolver, host, targetSourceFile) {
        var extendsHelper = "\nvar __extends = (this && this.__extends) || function (d, b) {\n    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];\n    function __() { this.constructor = d; }\n    __.prototype = b.prototype;\n    d.prototype = new __();\n};";
        var decorateHelper = "\nvar __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {\n    if (typeof Reflect === \"object\" && typeof Reflect.decorate === \"function\") return Reflect.decorate(decorators, target, key, desc);\n    switch (arguments.length) {\n        case 2: return decorators.reduceRight(function(o, d) { return (d && d(o)) || o; }, target);\n        case 3: return decorators.reduceRight(function(o, d) { return (d && d(target, key)), void 0; }, void 0);\n        case 4: return decorators.reduceRight(function(o, d) { return (d && d(target, key, o)) || o; }, desc);\n    }\n};";
        var metadataHelper = "\nvar __metadata = (this && this.__metadata) || function (k, v) {\n    if (typeof Reflect === \"object\" && typeof Reflect.metadata === \"function\") return Reflect.metadata(k, v);\n};";
        var paramHelper = "\nvar __param = (this && this.__param) || function (paramIndex, decorator) {\n    return function (target, key) { decorator(target, key, paramIndex); }\n};";
        var compilerOptions = host.getCompilerOptions();
        var languageVersion = compilerOptions.target || 0;
        var sourceMapDataList = compilerOptions.sourceMap || compilerOptions.inlineSourceMap ? [] : undefined;
        var diagnostics = [];
        var newLine = host.getNewLine();
        if (targetSourceFile === undefined) {
            ts.forEach(host.getSourceFiles(), function (sourceFile) {
                if (ts.shouldEmitToOwnFile(sourceFile, compilerOptions)) {
                    var jsFilePath = ts.getOwnEmitOutputFilePath(sourceFile, host, ".js");
                    emitFile(jsFilePath, sourceFile);
                }
            });
            if (compilerOptions.out) {
                emitFile(compilerOptions.out);
            }
        }
        else {
            if (ts.shouldEmitToOwnFile(targetSourceFile, compilerOptions)) {
                var jsFilePath = ts.getOwnEmitOutputFilePath(targetSourceFile, host, ".js");
                emitFile(jsFilePath, targetSourceFile);
            }
            else if (!ts.isDeclarationFile(targetSourceFile) && compilerOptions.out) {
                emitFile(compilerOptions.out);
            }
        }
        diagnostics = ts.sortAndDeduplicateDiagnostics(diagnostics);
        return {
            emitSkipped: false,
            diagnostics: diagnostics,
            sourceMaps: sourceMapDataList
        };
        function isNodeDescendentOf(node, ancestor) {
            while (node) {
                if (node === ancestor)
                    return true;
                node = node.parent;
            }
            return false;
        }
        function isUniqueLocalName(name, container) {
            for (var node = container; isNodeDescendentOf(node, container); node = node.nextContainer) {
                if (node.locals && ts.hasProperty(node.locals, name)) {
                    if (node.locals[name].flags & (107455 | 1048576 | 8388608)) {
                        return false;
                    }
                }
            }
            return true;
        }
        function emitJavaScript(jsFilePath, root) {
            var writer = ts.createTextWriter(newLine);
            var write = writer.write;
            var writeTextOfNode = writer.writeTextOfNode;
            var writeLine = writer.writeLine;
            var increaseIndent = writer.increaseIndent;
            var decreaseIndent = writer.decreaseIndent;
            var currentSourceFile;
            var exportFunctionForFile;
            var generatedNameSet = {};
            var nodeToGeneratedName = [];
            var blockScopedVariableToGeneratedName;
            var computedPropertyNamesToGeneratedNames;
            var extendsEmitted = false;
            var decorateEmitted = false;
            var paramEmitted = false;
            var tempFlags = 0;
            var tempVariables;
            var tempParameters;
            var externalImports;
            var exportSpecifiers;
            var exportEquals;
            var hasExportStars;
            var writeEmittedFiles = writeJavaScriptFile;
            var detachedCommentsInfo;
            var writeComment = ts.writeCommentRange;
            var emit = emitNodeWithoutSourceMap;
            var emitStart = function (node) { };
            var emitEnd = function (node) { };
            var emitToken = emitTokenText;
            var scopeEmitStart = function (scopeDeclaration, scopeName) { };
            var scopeEmitEnd = function () { };
            var sourceMapData;
            if (compilerOptions.sourceMap || compilerOptions.inlineSourceMap) {
                initializeEmitterWithSourceMaps();
            }
            if (root) {
                emitSourceFile(root);
            }
            else {
                ts.forEach(host.getSourceFiles(), function (sourceFile) {
                    if (!isExternalModuleOrDeclarationFile(sourceFile)) {
                        emitSourceFile(sourceFile);
                    }
                });
            }
            writeLine();
            writeEmittedFiles(writer.getText(), compilerOptions.emitBOM);
            return;
            function emitSourceFile(sourceFile) {
                currentSourceFile = sourceFile;
                exportFunctionForFile = undefined;
                emit(sourceFile);
            }
            function isUniqueName(name) {
                return !resolver.hasGlobalName(name) &&
                    !ts.hasProperty(currentSourceFile.identifiers, name) &&
                    !ts.hasProperty(generatedNameSet, name);
            }
            function makeTempVariableName(flags) {
                if (flags && !(tempFlags & flags)) {
                    var name = flags === 268435456 ? "_i" : "_n";
                    if (isUniqueName(name)) {
                        tempFlags |= flags;
                        return name;
                    }
                }
                while (true) {
                    var count = tempFlags & 268435455;
                    tempFlags++;
                    if (count !== 8 && count !== 13) {
                        var name_1 = count < 26 ? "_" + String.fromCharCode(97 + count) : "_" + (count - 26);
                        if (isUniqueName(name_1)) {
                            return name_1;
                        }
                    }
                }
            }
            function makeUniqueName(baseName) {
                if (baseName.charCodeAt(baseName.length - 1) !== 95) {
                    baseName += "_";
                }
                var i = 1;
                while (true) {
                    var generatedName = baseName + i;
                    if (isUniqueName(generatedName)) {
                        return generatedNameSet[generatedName] = generatedName;
                    }
                    i++;
                }
            }
            function assignGeneratedName(node, name) {
                nodeToGeneratedName[ts.getNodeId(node)] = ts.unescapeIdentifier(name);
            }
            function generateNameForFunctionOrClassDeclaration(node) {
                if (!node.name) {
                    assignGeneratedName(node, makeUniqueName("default"));
                }
            }
            function generateNameForModuleOrEnum(node) {
                if (node.name.kind === 65) {
                    var name_2 = node.name.text;
                    assignGeneratedName(node, isUniqueLocalName(name_2, node) ? name_2 : makeUniqueName(name_2));
                }
            }
            function generateNameForImportOrExportDeclaration(node) {
                var expr = ts.getExternalModuleName(node);
                var baseName = expr.kind === 8 ?
                    ts.escapeIdentifier(ts.makeIdentifierFromModuleName(expr.text)) : "module";
                assignGeneratedName(node, makeUniqueName(baseName));
            }
            function generateNameForImportDeclaration(node) {
                if (node.importClause) {
                    generateNameForImportOrExportDeclaration(node);
                }
            }
            function generateNameForExportDeclaration(node) {
                if (node.moduleSpecifier) {
                    generateNameForImportOrExportDeclaration(node);
                }
            }
            function generateNameForExportAssignment(node) {
                if (node.expression && node.expression.kind !== 65) {
                    assignGeneratedName(node, makeUniqueName("default"));
                }
            }
            function generateNameForNode(node) {
                switch (node.kind) {
                    case 201:
                    case 202:
                    case 175:
                        generateNameForFunctionOrClassDeclaration(node);
                        break;
                    case 206:
                        generateNameForModuleOrEnum(node);
                        generateNameForNode(node.body);
                        break;
                    case 205:
                        generateNameForModuleOrEnum(node);
                        break;
                    case 210:
                        generateNameForImportDeclaration(node);
                        break;
                    case 216:
                        generateNameForExportDeclaration(node);
                        break;
                    case 215:
                        generateNameForExportAssignment(node);
                        break;
                }
            }
            function getGeneratedNameForNode(node) {
                var nodeId = ts.getNodeId(node);
                if (!nodeToGeneratedName[nodeId]) {
                    generateNameForNode(node);
                }
                return nodeToGeneratedName[nodeId];
            }
            function initializeEmitterWithSourceMaps() {
                var sourceMapDir;
                var sourceMapSourceIndex = -1;
                var sourceMapNameIndexMap = {};
                var sourceMapNameIndices = [];
                function getSourceMapNameIndex() {
                    return sourceMapNameIndices.length ? ts.lastOrUndefined(sourceMapNameIndices) : -1;
                }
                var lastRecordedSourceMapSpan;
                var lastEncodedSourceMapSpan = {
                    emittedLine: 1,
                    emittedColumn: 1,
                    sourceLine: 1,
                    sourceColumn: 1,
                    sourceIndex: 0
                };
                var lastEncodedNameIndex = 0;
                function encodeLastRecordedSourceMapSpan() {
                    if (!lastRecordedSourceMapSpan || lastRecordedSourceMapSpan === lastEncodedSourceMapSpan) {
                        return;
                    }
                    var prevEncodedEmittedColumn = lastEncodedSourceMapSpan.emittedColumn;
                    if (lastEncodedSourceMapSpan.emittedLine == lastRecordedSourceMapSpan.emittedLine) {
                        if (sourceMapData.sourceMapMappings) {
                            sourceMapData.sourceMapMappings += ",";
                        }
                    }
                    else {
                        for (var encodedLine = lastEncodedSourceMapSpan.emittedLine; encodedLine < lastRecordedSourceMapSpan.emittedLine; encodedLine++) {
                            sourceMapData.sourceMapMappings += ";";
                        }
                        prevEncodedEmittedColumn = 1;
                    }
                    sourceMapData.sourceMapMappings += base64VLQFormatEncode(lastRecordedSourceMapSpan.emittedColumn - prevEncodedEmittedColumn);
                    sourceMapData.sourceMapMappings += base64VLQFormatEncode(lastRecordedSourceMapSpan.sourceIndex - lastEncodedSourceMapSpan.sourceIndex);
                    sourceMapData.sourceMapMappings += base64VLQFormatEncode(lastRecordedSourceMapSpan.sourceLine - lastEncodedSourceMapSpan.sourceLine);
                    sourceMapData.sourceMapMappings += base64VLQFormatEncode(lastRecordedSourceMapSpan.sourceColumn - lastEncodedSourceMapSpan.sourceColumn);
                    if (lastRecordedSourceMapSpan.nameIndex >= 0) {
                        sourceMapData.sourceMapMappings += base64VLQFormatEncode(lastRecordedSourceMapSpan.nameIndex - lastEncodedNameIndex);
                        lastEncodedNameIndex = lastRecordedSourceMapSpan.nameIndex;
                    }
                    lastEncodedSourceMapSpan = lastRecordedSourceMapSpan;
                    sourceMapData.sourceMapDecodedMappings.push(lastEncodedSourceMapSpan);
                    function base64VLQFormatEncode(inValue) {
                        function base64FormatEncode(inValue) {
                            if (inValue < 64) {
                                return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.charAt(inValue);
                            }
                            throw TypeError(inValue + ": not a 64 based value");
                        }
                        if (inValue < 0) {
                            inValue = ((-inValue) << 1) + 1;
                        }
                        else {
                            inValue = inValue << 1;
                        }
                        var encodedStr = "";
                        do {
                            var currentDigit = inValue & 31;
                            inValue = inValue >> 5;
                            if (inValue > 0) {
                                currentDigit = currentDigit | 32;
                            }
                            encodedStr = encodedStr + base64FormatEncode(currentDigit);
                        } while (inValue > 0);
                        return encodedStr;
                    }
                }
                function recordSourceMapSpan(pos) {
                    var sourceLinePos = ts.getLineAndCharacterOfPosition(currentSourceFile, pos);
                    sourceLinePos.line++;
                    sourceLinePos.character++;
                    var emittedLine = writer.getLine();
                    var emittedColumn = writer.getColumn();
                    if (!lastRecordedSourceMapSpan ||
                        lastRecordedSourceMapSpan.emittedLine != emittedLine ||
                        lastRecordedSourceMapSpan.emittedColumn != emittedColumn ||
                        (lastRecordedSourceMapSpan.sourceIndex === sourceMapSourceIndex &&
                            (lastRecordedSourceMapSpan.sourceLine > sourceLinePos.line ||
                                (lastRecordedSourceMapSpan.sourceLine === sourceLinePos.line && lastRecordedSourceMapSpan.sourceColumn > sourceLinePos.character)))) {
                        encodeLastRecordedSourceMapSpan();
                        lastRecordedSourceMapSpan = {
                            emittedLine: emittedLine,
                            emittedColumn: emittedColumn,
                            sourceLine: sourceLinePos.line,
                            sourceColumn: sourceLinePos.character,
                            nameIndex: getSourceMapNameIndex(),
                            sourceIndex: sourceMapSourceIndex
                        };
                    }
                    else {
                        lastRecordedSourceMapSpan.sourceLine = sourceLinePos.line;
                        lastRecordedSourceMapSpan.sourceColumn = sourceLinePos.character;
                        lastRecordedSourceMapSpan.sourceIndex = sourceMapSourceIndex;
                    }
                }
                function recordEmitNodeStartSpan(node) {
                    recordSourceMapSpan(ts.skipTrivia(currentSourceFile.text, node.pos));
                }
                function recordEmitNodeEndSpan(node) {
                    recordSourceMapSpan(node.end);
                }
                function writeTextWithSpanRecord(tokenKind, startPos, emitFn) {
                    var tokenStartPos = ts.skipTrivia(currentSourceFile.text, startPos);
                    recordSourceMapSpan(tokenStartPos);
                    var tokenEndPos = emitTokenText(tokenKind, tokenStartPos, emitFn);
                    recordSourceMapSpan(tokenEndPos);
                    return tokenEndPos;
                }
                function recordNewSourceFileStart(node) {
                    var sourcesDirectoryPath = compilerOptions.sourceRoot ? host.getCommonSourceDirectory() : sourceMapDir;
                    sourceMapData.sourceMapSources.push(ts.getRelativePathToDirectoryOrUrl(sourcesDirectoryPath, node.fileName, host.getCurrentDirectory(), host.getCanonicalFileName, true));
                    sourceMapSourceIndex = sourceMapData.sourceMapSources.length - 1;
                    sourceMapData.inputSourceFileNames.push(node.fileName);
                    if (compilerOptions.inlineSources) {
                        if (!sourceMapData.sourceMapSourcesContent) {
                            sourceMapData.sourceMapSourcesContent = [];
                        }
                        sourceMapData.sourceMapSourcesContent.push(node.text);
                    }
                }
                function recordScopeNameOfNode(node, scopeName) {
                    function recordScopeNameIndex(scopeNameIndex) {
                        sourceMapNameIndices.push(scopeNameIndex);
                    }
                    function recordScopeNameStart(scopeName) {
                        var scopeNameIndex = -1;
                        if (scopeName) {
                            var parentIndex = getSourceMapNameIndex();
                            if (parentIndex !== -1) {
                                var name_3 = node.name;
                                if (!name_3 || name_3.kind !== 128) {
                                    scopeName = "." + scopeName;
                                }
                                scopeName = sourceMapData.sourceMapNames[parentIndex] + scopeName;
                            }
                            scopeNameIndex = ts.getProperty(sourceMapNameIndexMap, scopeName);
                            if (scopeNameIndex === undefined) {
                                scopeNameIndex = sourceMapData.sourceMapNames.length;
                                sourceMapData.sourceMapNames.push(scopeName);
                                sourceMapNameIndexMap[scopeName] = scopeNameIndex;
                            }
                        }
                        recordScopeNameIndex(scopeNameIndex);
                    }
                    if (scopeName) {
                        recordScopeNameStart(scopeName);
                    }
                    else if (node.kind === 201 ||
                        node.kind === 163 ||
                        node.kind === 135 ||
                        node.kind === 134 ||
                        node.kind === 137 ||
                        node.kind === 138 ||
                        node.kind === 206 ||
                        node.kind === 202 ||
                        node.kind === 205) {
                        if (node.name) {
                            var name_4 = node.name;
                            scopeName = name_4.kind === 128
                                ? ts.getTextOfNode(name_4)
                                : node.name.text;
                        }
                        recordScopeNameStart(scopeName);
                    }
                    else {
                        recordScopeNameIndex(getSourceMapNameIndex());
                    }
                }
                function recordScopeNameEnd() {
                    sourceMapNameIndices.pop();
                }
                ;
                function writeCommentRangeWithMap(curentSourceFile, writer, comment, newLine) {
                    recordSourceMapSpan(comment.pos);
                    ts.writeCommentRange(currentSourceFile, writer, comment, newLine);
                    recordSourceMapSpan(comment.end);
                }
                function serializeSourceMapContents(version, file, sourceRoot, sources, names, mappings, sourcesContent) {
                    if (typeof JSON !== "undefined") {
                        var map_1 = {
                            version: version,
                            file: file,
                            sourceRoot: sourceRoot,
                            sources: sources,
                            names: names,
                            mappings: mappings
                        };
                        if (sourcesContent !== undefined) {
                            map_1.sourcesContent = sourcesContent;
                        }
                        return JSON.stringify(map_1);
                    }
                    return "{\"version\":" + version + ",\"file\":\"" + ts.escapeString(file) + "\",\"sourceRoot\":\"" + ts.escapeString(sourceRoot) + "\",\"sources\":[" + serializeStringArray(sources) + "],\"names\":[" + serializeStringArray(names) + "],\"mappings\":\"" + ts.escapeString(mappings) + "\" " + (sourcesContent !== undefined ? ",\"sourcesContent\":[" + serializeStringArray(sourcesContent) + "]" : "") + "}";
                    function serializeStringArray(list) {
                        var output = "";
                        for (var i = 0, n = list.length; i < n; i++) {
                            if (i) {
                                output += ",";
                            }
                            output += "\"" + ts.escapeString(list[i]) + "\"";
                        }
                        return output;
                    }
                }
                function writeJavaScriptAndSourceMapFile(emitOutput, writeByteOrderMark) {
                    encodeLastRecordedSourceMapSpan();
                    var sourceMapText = serializeSourceMapContents(3, sourceMapData.sourceMapFile, sourceMapData.sourceMapSourceRoot, sourceMapData.sourceMapSources, sourceMapData.sourceMapNames, sourceMapData.sourceMapMappings, sourceMapData.sourceMapSourcesContent);
                    sourceMapDataList.push(sourceMapData);
                    var sourceMapUrl;
                    if (compilerOptions.inlineSourceMap) {
                        var base64SourceMapText = ts.convertToBase64(sourceMapText);
                        sourceMapUrl = "//# sourceMappingURL=data:application/json;base64," + base64SourceMapText;
                    }
                    else {
                        ts.writeFile(host, diagnostics, sourceMapData.sourceMapFilePath, sourceMapText, false);
                        sourceMapUrl = "//# sourceMappingURL=" + sourceMapData.jsSourceMappingURL;
                    }
                    writeJavaScriptFile(emitOutput + sourceMapUrl, writeByteOrderMark);
                }
                var sourceMapJsFile = ts.getBaseFileName(ts.normalizeSlashes(jsFilePath));
                sourceMapData = {
                    sourceMapFilePath: jsFilePath + ".map",
                    jsSourceMappingURL: sourceMapJsFile + ".map",
                    sourceMapFile: sourceMapJsFile,
                    sourceMapSourceRoot: compilerOptions.sourceRoot || "",
                    sourceMapSources: [],
                    inputSourceFileNames: [],
                    sourceMapNames: [],
                    sourceMapMappings: "",
                    sourceMapSourcesContent: undefined,
                    sourceMapDecodedMappings: []
                };
                sourceMapData.sourceMapSourceRoot = ts.normalizeSlashes(sourceMapData.sourceMapSourceRoot);
                if (sourceMapData.sourceMapSourceRoot.length && sourceMapData.sourceMapSourceRoot.charCodeAt(sourceMapData.sourceMapSourceRoot.length - 1) !== 47) {
                    sourceMapData.sourceMapSourceRoot += ts.directorySeparator;
                }
                if (compilerOptions.mapRoot) {
                    sourceMapDir = ts.normalizeSlashes(compilerOptions.mapRoot);
                    if (root) {
                        sourceMapDir = ts.getDirectoryPath(ts.getSourceFilePathInNewDir(root, host, sourceMapDir));
                    }
                    if (!ts.isRootedDiskPath(sourceMapDir) && !ts.isUrl(sourceMapDir)) {
                        sourceMapDir = ts.combinePaths(host.getCommonSourceDirectory(), sourceMapDir);
                        sourceMapData.jsSourceMappingURL = ts.getRelativePathToDirectoryOrUrl(ts.getDirectoryPath(ts.normalizePath(jsFilePath)), ts.combinePaths(sourceMapDir, sourceMapData.jsSourceMappingURL), host.getCurrentDirectory(), host.getCanonicalFileName, true);
                    }
                    else {
                        sourceMapData.jsSourceMappingURL = ts.combinePaths(sourceMapDir, sourceMapData.jsSourceMappingURL);
                    }
                }
                else {
                    sourceMapDir = ts.getDirectoryPath(ts.normalizePath(jsFilePath));
                }
                function emitNodeWithSourceMap(node, allowGeneratedIdentifiers) {
                    if (node) {
                        if (ts.nodeIsSynthesized(node)) {
                            return emitNodeWithoutSourceMap(node, false);
                        }
                        if (node.kind != 228) {
                            recordEmitNodeStartSpan(node);
                            emitNodeWithoutSourceMap(node, allowGeneratedIdentifiers);
                            recordEmitNodeEndSpan(node);
                        }
                        else {
                            recordNewSourceFileStart(node);
                            emitNodeWithoutSourceMap(node, false);
                        }
                    }
                }
                writeEmittedFiles = writeJavaScriptAndSourceMapFile;
                emit = emitNodeWithSourceMap;
                emitStart = recordEmitNodeStartSpan;
                emitEnd = recordEmitNodeEndSpan;
                emitToken = writeTextWithSpanRecord;
                scopeEmitStart = recordScopeNameOfNode;
                scopeEmitEnd = recordScopeNameEnd;
                writeComment = writeCommentRangeWithMap;
            }
            function writeJavaScriptFile(emitOutput, writeByteOrderMark) {
                ts.writeFile(host, diagnostics, jsFilePath, emitOutput, writeByteOrderMark);
            }
            function createTempVariable(flags) {
                var result = ts.createSynthesizedNode(65);
                result.text = makeTempVariableName(flags);
                return result;
            }
            function recordTempDeclaration(name) {
                if (!tempVariables) {
                    tempVariables = [];
                }
                tempVariables.push(name);
            }
            function createAndRecordTempVariable(flags) {
                var temp = createTempVariable(flags);
                recordTempDeclaration(temp);
                return temp;
            }
            function emitTempDeclarations(newLine) {
                if (tempVariables) {
                    if (newLine) {
                        writeLine();
                    }
                    else {
                        write(" ");
                    }
                    write("var ");
                    emitCommaList(tempVariables);
                    write(";");
                }
            }
            function emitTokenText(tokenKind, startPos, emitFn) {
                var tokenString = ts.tokenToString(tokenKind);
                if (emitFn) {
                    emitFn();
                }
                else {
                    write(tokenString);
                }
                return startPos + tokenString.length;
            }
            function emitOptional(prefix, node) {
                if (node) {
                    write(prefix);
                    emit(node);
                }
            }
            function emitParenthesizedIf(node, parenthesized) {
                if (parenthesized) {
                    write("(");
                }
                emit(node);
                if (parenthesized) {
                    write(")");
                }
            }
            function emitTrailingCommaIfPresent(nodeList) {
                if (nodeList.hasTrailingComma) {
                    write(",");
                }
            }
            function emitLinePreservingList(parent, nodes, allowTrailingComma, spacesBetweenBraces) {
                ts.Debug.assert(nodes.length > 0);
                increaseIndent();
                if (nodeStartPositionsAreOnSameLine(parent, nodes[0])) {
                    if (spacesBetweenBraces) {
                        write(" ");
                    }
                }
                else {
                    writeLine();
                }
                for (var i = 0, n = nodes.length; i < n; i++) {
                    if (i) {
                        if (nodeEndIsOnSameLineAsNodeStart(nodes[i - 1], nodes[i])) {
                            write(", ");
                        }
                        else {
                            write(",");
                            writeLine();
                        }
                    }
                    emit(nodes[i]);
                }
                if (nodes.hasTrailingComma && allowTrailingComma) {
                    write(",");
                }
                decreaseIndent();
                if (nodeEndPositionsAreOnSameLine(parent, ts.lastOrUndefined(nodes))) {
                    if (spacesBetweenBraces) {
                        write(" ");
                    }
                }
                else {
                    writeLine();
                }
            }
            function emitList(nodes, start, count, multiLine, trailingComma, leadingComma, noTrailingNewLine, emitNode) {
                if (!emitNode) {
                    emitNode = emit;
                }
                for (var i = 0; i < count; i++) {
                    if (multiLine) {
                        if (i || leadingComma) {
                            write(",");
                        }
                        writeLine();
                    }
                    else {
                        if (i || leadingComma) {
                            write(", ");
                        }
                    }
                    emitNode(nodes[start + i]);
                    leadingComma = true;
                }
                if (trailingComma) {
                    write(",");
                }
                if (multiLine && !noTrailingNewLine) {
                    writeLine();
                }
                return count;
            }
            function emitCommaList(nodes) {
                if (nodes) {
                    emitList(nodes, 0, nodes.length, false, false);
                }
            }
            function emitLines(nodes) {
                emitLinesStartingAt(nodes, 0);
            }
            function emitLinesStartingAt(nodes, startIndex) {
                for (var i = startIndex; i < nodes.length; i++) {
                    writeLine();
                    emit(nodes[i]);
                }
            }
            function isBinaryOrOctalIntegerLiteral(node, text) {
                if (node.kind === 7 && text.length > 1) {
                    switch (text.charCodeAt(1)) {
                        case 98:
                        case 66:
                        case 111:
                        case 79:
                            return true;
                    }
                }
                return false;
            }
            function emitLiteral(node) {
                var text = getLiteralText(node);
                if ((compilerOptions.sourceMap || compilerOptions.inlineSourceMap) && (node.kind === 8 || ts.isTemplateLiteralKind(node.kind))) {
                    writer.writeLiteral(text);
                }
                else if (languageVersion < 2 && isBinaryOrOctalIntegerLiteral(node, text)) {
                    write(node.text);
                }
                else {
                    write(text);
                }
            }
            function getLiteralText(node) {
                if (languageVersion < 2 && (ts.isTemplateLiteralKind(node.kind) || node.hasExtendedUnicodeEscape)) {
                    return getQuotedEscapedLiteralText('"', node.text, '"');
                }
                if (node.parent) {
                    return ts.getSourceTextOfNodeFromSourceFile(currentSourceFile, node);
                }
                switch (node.kind) {
                    case 8:
                        return getQuotedEscapedLiteralText('"', node.text, '"');
                    case 10:
                        return getQuotedEscapedLiteralText('`', node.text, '`');
                    case 11:
                        return getQuotedEscapedLiteralText('`', node.text, '${');
                    case 12:
                        return getQuotedEscapedLiteralText('}', node.text, '${');
                    case 13:
                        return getQuotedEscapedLiteralText('}', node.text, '`');
                    case 7:
                        return node.text;
                }
                ts.Debug.fail("Literal kind '" + node.kind + "' not accounted for.");
            }
            function getQuotedEscapedLiteralText(leftQuote, text, rightQuote) {
                return leftQuote + ts.escapeNonAsciiCharacters(ts.escapeString(text)) + rightQuote;
            }
            function emitDownlevelRawTemplateLiteral(node) {
                var text = ts.getSourceTextOfNodeFromSourceFile(currentSourceFile, node);
                var isLast = node.kind === 10 || node.kind === 13;
                text = text.substring(1, text.length - (isLast ? 1 : 2));
                text = text.replace(/\r\n?/g, "\n");
                text = ts.escapeString(text);
                write('"' + text + '"');
            }
            function emitDownlevelTaggedTemplateArray(node, literalEmitter) {
                write("[");
                if (node.template.kind === 10) {
                    literalEmitter(node.template);
                }
                else {
                    literalEmitter(node.template.head);
                    ts.forEach(node.template.templateSpans, function (child) {
                        write(", ");
                        literalEmitter(child.literal);
                    });
                }
                write("]");
            }
            function emitDownlevelTaggedTemplate(node) {
                var tempVariable = createAndRecordTempVariable(0);
                write("(");
                emit(tempVariable);
                write(" = ");
                emitDownlevelTaggedTemplateArray(node, emit);
                write(", ");
                emit(tempVariable);
                write(".raw = ");
                emitDownlevelTaggedTemplateArray(node, emitDownlevelRawTemplateLiteral);
                write(", ");
                emitParenthesizedIf(node.tag, needsParenthesisForPropertyAccessOrInvocation(node.tag));
                write("(");
                emit(tempVariable);
                if (node.template.kind === 172) {
                    ts.forEach(node.template.templateSpans, function (templateSpan) {
                        write(", ");
                        var needsParens = templateSpan.expression.kind === 170
                            && templateSpan.expression.operatorToken.kind === 23;
                        emitParenthesizedIf(templateSpan.expression, needsParens);
                    });
                }
                write("))");
            }
            function emitTemplateExpression(node) {
                if (languageVersion >= 2) {
                    ts.forEachChild(node, emit);
                    return;
                }
                var emitOuterParens = ts.isExpression(node.parent)
                    && templateNeedsParens(node, node.parent);
                if (emitOuterParens) {
                    write("(");
                }
                var headEmitted = false;
                if (shouldEmitTemplateHead()) {
                    emitLiteral(node.head);
                    headEmitted = true;
                }
                for (var i = 0, n = node.templateSpans.length; i < n; i++) {
                    var templateSpan = node.templateSpans[i];
                    var needsParens = templateSpan.expression.kind !== 162
                        && comparePrecedenceToBinaryPlus(templateSpan.expression) !== 1;
                    if (i > 0 || headEmitted) {
                        write(" + ");
                    }
                    emitParenthesizedIf(templateSpan.expression, needsParens);
                    if (templateSpan.literal.text.length !== 0) {
                        write(" + ");
                        emitLiteral(templateSpan.literal);
                    }
                }
                if (emitOuterParens) {
                    write(")");
                }
                function shouldEmitTemplateHead() {
                    // If this expression has an empty head literal and the first template span has a non-empty
                    // literal, then emitting the empty head literal is not necessary.
                    //     `${ foo } and ${ bar }`
                    // can be emitted as
                    //     foo + " and " + bar
                    // This is because it is only required that one of the first two operands in the emit
                    // output must be a string literal, so that the other operand and all following operands
                    // are forced into strings.
                    //
                    // If the first template span has an empty literal, then the head must still be emitted.
                    //     `${ foo }${ bar }`
                    // must still be emitted as
                    //     "" + foo + bar
                    ts.Debug.assert(node.templateSpans.length !== 0);
                    return node.head.text.length !== 0 || node.templateSpans[0].literal.text.length === 0;
                }
                function templateNeedsParens(template, parent) {
                    switch (parent.kind) {
                        case 158:
                        case 159:
                            return parent.expression === template;
                        case 160:
                        case 162:
                            return false;
                        default:
                            return comparePrecedenceToBinaryPlus(parent) !== -1;
                    }
                }
                function comparePrecedenceToBinaryPlus(expression) {
                    switch (expression.kind) {
                        case 170:
                            switch (expression.operatorToken.kind) {
                                case 35:
                                case 36:
                                case 37:
                                    return 1;
                                case 33:
                                case 34:
                                    return 0;
                                default:
                                    return -1;
                            }
                        case 173:
                        case 171:
                            return -1;
                        default:
                            return 1;
                    }
                }
            }
            function emitTemplateSpan(span) {
                emit(span.expression);
                emit(span.literal);
            }
            function emitExpressionForPropertyName(node) {
                ts.Debug.assert(node.kind !== 153);
                if (node.kind === 8) {
                    emitLiteral(node);
                }
                else if (node.kind === 128) {
                    if (ts.nodeIsDecorated(node.parent)) {
                        if (!computedPropertyNamesToGeneratedNames) {
                            computedPropertyNamesToGeneratedNames = [];
                        }
                        var generatedName = computedPropertyNamesToGeneratedNames[ts.getNodeId(node)];
                        if (generatedName) {
                            write(generatedName);
                            return;
                        }
                        generatedName = createAndRecordTempVariable(0).text;
                        computedPropertyNamesToGeneratedNames[ts.getNodeId(node)] = generatedName;
                        write(generatedName);
                        write(" = ");
                    }
                    emit(node.expression);
                }
                else {
                    write("\"");
                    if (node.kind === 7) {
                        write(node.text);
                    }
                    else {
                        writeTextOfNode(currentSourceFile, node);
                    }
                    write("\"");
                }
            }
            function isNotExpressionIdentifier(node) {
                var parent = node.parent;
                switch (parent.kind) {
                    case 130:
                    case 199:
                    case 153:
                    case 133:
                    case 132:
                    case 225:
                    case 226:
                    case 227:
                    case 135:
                    case 134:
                    case 201:
                    case 137:
                    case 138:
                    case 163:
                    case 202:
                    case 203:
                    case 205:
                    case 206:
                    case 209:
                    case 211:
                    case 212:
                        return parent.name === node;
                    case 214:
                    case 218:
                        return parent.name === node || parent.propertyName === node;
                    case 191:
                    case 190:
                    case 215:
                        return false;
                    case 195:
                        return node.parent.label === node;
                }
            }
            function emitExpressionIdentifier(node) {
                var substitution = resolver.getExpressionNameSubstitution(node, getGeneratedNameForNode);
                if (substitution) {
                    write(substitution);
                }
                else {
                    writeTextOfNode(currentSourceFile, node);
                }
            }
            function getGeneratedNameForIdentifier(node) {
                if (ts.nodeIsSynthesized(node) || !blockScopedVariableToGeneratedName) {
                    return undefined;
                }
                var variableId = resolver.getBlockScopedVariableId(node);
                if (variableId === undefined) {
                    return undefined;
                }
                return blockScopedVariableToGeneratedName[variableId];
            }
            function emitIdentifier(node, allowGeneratedIdentifiers) {
                if (allowGeneratedIdentifiers) {
                    var generatedName = getGeneratedNameForIdentifier(node);
                    if (generatedName) {
                        write(generatedName);
                        return;
                    }
                }
                if (!node.parent) {
                    write(node.text);
                }
                else if (!isNotExpressionIdentifier(node)) {
                    emitExpressionIdentifier(node);
                }
                else {
                    writeTextOfNode(currentSourceFile, node);
                }
            }
            function emitThis(node) {
                if (resolver.getNodeCheckFlags(node) & 2) {
                    write("_this");
                }
                else {
                    write("this");
                }
            }
            function emitSuper(node) {
                if (languageVersion >= 2) {
                    write("super");
                }
                else {
                    var flags = resolver.getNodeCheckFlags(node);
                    if (flags & 16) {
                        write("_super.prototype");
                    }
                    else {
                        write("_super");
                    }
                }
            }
            function emitObjectBindingPattern(node) {
                write("{ ");
                var elements = node.elements;
                emitList(elements, 0, elements.length, false, elements.hasTrailingComma);
                write(" }");
            }
            function emitArrayBindingPattern(node) {
                write("[");
                var elements = node.elements;
                emitList(elements, 0, elements.length, false, elements.hasTrailingComma);
                write("]");
            }
            function emitBindingElement(node) {
                if (node.propertyName) {
                    emit(node.propertyName, false);
                    write(": ");
                }
                if (node.dotDotDotToken) {
                    write("...");
                }
                if (ts.isBindingPattern(node.name)) {
                    emit(node.name);
                }
                else {
                    emitModuleMemberName(node);
                }
                emitOptional(" = ", node.initializer);
            }
            function emitSpreadElementExpression(node) {
                write("...");
                emit(node.expression);
            }
            function emitYieldExpression(node) {
                write(ts.tokenToString(110));
                if (node.asteriskToken) {
                    write("*");
                }
                if (node.expression) {
                    write(" ");
                    emit(node.expression);
                }
            }
            function needsParenthesisForPropertyAccessOrInvocation(node) {
                switch (node.kind) {
                    case 65:
                    case 154:
                    case 156:
                    case 157:
                    case 158:
                    case 162:
                        return false;
                }
                return true;
            }
            function emitListWithSpread(elements, multiLine, trailingComma) {
                var pos = 0;
                var group = 0;
                var length = elements.length;
                while (pos < length) {
                    if (group === 1) {
                        write(".concat(");
                    }
                    else if (group > 1) {
                        write(", ");
                    }
                    var e = elements[pos];
                    if (e.kind === 174) {
                        e = e.expression;
                        emitParenthesizedIf(e, group === 0 && needsParenthesisForPropertyAccessOrInvocation(e));
                        pos++;
                    }
                    else {
                        var i = pos;
                        while (i < length && elements[i].kind !== 174) {
                            i++;
                        }
                        write("[");
                        if (multiLine) {
                            increaseIndent();
                        }
                        emitList(elements, pos, i - pos, multiLine, trailingComma && i === length);
                        if (multiLine) {
                            decreaseIndent();
                        }
                        write("]");
                        pos = i;
                    }
                    group++;
                }
                if (group > 1) {
                    write(")");
                }
            }
            function isSpreadElementExpression(node) {
                return node.kind === 174;
            }
            function emitArrayLiteral(node) {
                var elements = node.elements;
                if (elements.length === 0) {
                    write("[]");
                }
                else if (languageVersion >= 2 || !ts.forEach(elements, isSpreadElementExpression)) {
                    write("[");
                    emitLinePreservingList(node, node.elements, elements.hasTrailingComma, false);
                    write("]");
                }
                else {
                    emitListWithSpread(elements, (node.flags & 512) !== 0, elements.hasTrailingComma);
                }
            }
            function emitObjectLiteralBody(node, numElements) {
                if (numElements === 0) {
                    write("{}");
                    return;
                }
                write("{");
                if (numElements > 0) {
                    var properties = node.properties;
                    if (numElements === properties.length) {
                        emitLinePreservingList(node, properties, languageVersion >= 1, true);
                    }
                    else {
                        var multiLine = (node.flags & 512) !== 0;
                        if (!multiLine) {
                            write(" ");
                        }
                        else {
                            increaseIndent();
                        }
                        emitList(properties, 0, numElements, multiLine, false);
                        if (!multiLine) {
                            write(" ");
                        }
                        else {
                            decreaseIndent();
                        }
                    }
                }
                write("}");
            }
            function emitDownlevelObjectLiteralWithComputedProperties(node, firstComputedPropertyIndex) {
                var multiLine = (node.flags & 512) !== 0;
                var properties = node.properties;
                write("(");
                if (multiLine) {
                    increaseIndent();
                }
                var tempVar = createAndRecordTempVariable(0);
                emit(tempVar);
                write(" = ");
                emitObjectLiteralBody(node, firstComputedPropertyIndex);
                for (var i = firstComputedPropertyIndex, n = properties.length; i < n; i++) {
                    writeComma();
                    var property = properties[i];
                    emitStart(property);
                    if (property.kind === 137 || property.kind === 138) {
                        var accessors = ts.getAllAccessorDeclarations(node.properties, property);
                        if (property !== accessors.firstAccessor) {
                            continue;
                        }
                        write("Object.defineProperty(");
                        emit(tempVar);
                        write(", ");
                        emitStart(node.name);
                        emitExpressionForPropertyName(property.name);
                        emitEnd(property.name);
                        write(", {");
                        increaseIndent();
                        if (accessors.getAccessor) {
                            writeLine();
                            emitLeadingComments(accessors.getAccessor);
                            write("get: ");
                            emitStart(accessors.getAccessor);
                            write("function ");
                            emitSignatureAndBody(accessors.getAccessor);
                            emitEnd(accessors.getAccessor);
                            emitTrailingComments(accessors.getAccessor);
                            write(",");
                        }
                        if (accessors.setAccessor) {
                            writeLine();
                            emitLeadingComments(accessors.setAccessor);
                            write("set: ");
                            emitStart(accessors.setAccessor);
                            write("function ");
                            emitSignatureAndBody(accessors.setAccessor);
                            emitEnd(accessors.setAccessor);
                            emitTrailingComments(accessors.setAccessor);
                            write(",");
                        }
                        writeLine();
                        write("enumerable: true,");
                        writeLine();
                        write("configurable: true");
                        decreaseIndent();
                        writeLine();
                        write("})");
                        emitEnd(property);
                    }
                    else {
                        emitLeadingComments(property);
                        emitStart(property.name);
                        emit(tempVar);
                        emitMemberAccessForPropertyName(property.name);
                        emitEnd(property.name);
                        write(" = ");
                        if (property.kind === 225) {
                            emit(property.initializer);
                        }
                        else if (property.kind === 226) {
                            emitExpressionIdentifier(property.name);
                        }
                        else if (property.kind === 135) {
                            emitFunctionDeclaration(property);
                        }
                        else {
                            ts.Debug.fail("ObjectLiteralElement type not accounted for: " + property.kind);
                        }
                    }
                    emitEnd(property);
                }
                writeComma();
                emit(tempVar);
                if (multiLine) {
                    decreaseIndent();
                    writeLine();
                }
                write(")");
                function writeComma() {
                    if (multiLine) {
                        write(",");
                        writeLine();
                    }
                    else {
                        write(", ");
                    }
                }
            }
            function emitObjectLiteral(node) {
                var properties = node.properties;
                if (languageVersion < 2) {
                    var numProperties = properties.length;
                    var numInitialNonComputedProperties = numProperties;
                    for (var i = 0, n = properties.length; i < n; i++) {
                        if (properties[i].name.kind === 128) {
                            numInitialNonComputedProperties = i;
                            break;
                        }
                    }
                    var hasComputedProperty = numInitialNonComputedProperties !== properties.length;
                    if (hasComputedProperty) {
                        emitDownlevelObjectLiteralWithComputedProperties(node, numInitialNonComputedProperties);
                        return;
                    }
                }
                emitObjectLiteralBody(node, properties.length);
            }
            function createBinaryExpression(left, operator, right, startsOnNewLine) {
                var result = ts.createSynthesizedNode(170, startsOnNewLine);
                result.operatorToken = ts.createSynthesizedNode(operator);
                result.left = left;
                result.right = right;
                return result;
            }
            function createPropertyAccessExpression(expression, name) {
                var result = ts.createSynthesizedNode(156);
                result.expression = parenthesizeForAccess(expression);
                result.dotToken = ts.createSynthesizedNode(20);
                result.name = name;
                return result;
            }
            function createElementAccessExpression(expression, argumentExpression) {
                var result = ts.createSynthesizedNode(157);
                result.expression = parenthesizeForAccess(expression);
                result.argumentExpression = argumentExpression;
                return result;
            }
            function parenthesizeForAccess(expr) {
                if (ts.isLeftHandSideExpression(expr) && expr.kind !== 159 && expr.kind !== 7) {
                    return expr;
                }
                var node = ts.createSynthesizedNode(162);
                node.expression = expr;
                return node;
            }
            function emitComputedPropertyName(node) {
                write("[");
                emitExpressionForPropertyName(node);
                write("]");
            }
            function emitMethod(node) {
                if (languageVersion >= 2 && node.asteriskToken) {
                    write("*");
                }
                emit(node.name, false);
                if (languageVersion < 2) {
                    write(": function ");
                }
                emitSignatureAndBody(node);
            }
            function emitPropertyAssignment(node) {
                emit(node.name, false);
                write(": ");
                emit(node.initializer);
            }
            function emitShorthandPropertyAssignment(node) {
                emit(node.name, false);
                if (languageVersion < 2) {
                    write(": ");
                    var generatedName = getGeneratedNameForIdentifier(node.name);
                    if (generatedName) {
                        write(generatedName);
                    }
                    else {
                        emitExpressionIdentifier(node.name);
                    }
                }
                else if (resolver.getExpressionNameSubstitution(node.name, getGeneratedNameForNode)) {
                    write(": ");
                    emitExpressionIdentifier(node.name);
                }
            }
            function tryEmitConstantValue(node) {
                if (compilerOptions.separateCompilation) {
                    return false;
                }
                var constantValue = resolver.getConstantValue(node);
                if (constantValue !== undefined) {
                    write(constantValue.toString());
                    if (!compilerOptions.removeComments) {
                        var propertyName = node.kind === 156 ? ts.declarationNameToString(node.name) : ts.getTextOfNode(node.argumentExpression);
                        write(" /* " + propertyName + " */");
                    }
                    return true;
                }
                return false;
            }
            function indentIfOnDifferentLines(parent, node1, node2, valueToWriteWhenNotIndenting) {
                var realNodesAreOnDifferentLines = !ts.nodeIsSynthesized(parent) && !nodeEndIsOnSameLineAsNodeStart(node1, node2);
                var synthesizedNodeIsOnDifferentLine = synthesizedNodeStartsOnNewLine(node2);
                if (realNodesAreOnDifferentLines || synthesizedNodeIsOnDifferentLine) {
                    increaseIndent();
                    writeLine();
                    return true;
                }
                else {
                    if (valueToWriteWhenNotIndenting) {
                        write(valueToWriteWhenNotIndenting);
                    }
                    return false;
                }
            }
            function emitPropertyAccess(node) {
                if (tryEmitConstantValue(node)) {
                    return;
                }
                emit(node.expression);
                var indentedBeforeDot = indentIfOnDifferentLines(node, node.expression, node.dotToken);
                write(".");
                var indentedAfterDot = indentIfOnDifferentLines(node, node.dotToken, node.name);
                emit(node.name, false);
                decreaseIndentIf(indentedBeforeDot, indentedAfterDot);
            }
            function emitQualifiedName(node) {
                emit(node.left);
                write(".");
                emit(node.right);
            }
            function emitIndexedAccess(node) {
                if (tryEmitConstantValue(node)) {
                    return;
                }
                emit(node.expression);
                write("[");
                emit(node.argumentExpression);
                write("]");
            }
            function hasSpreadElement(elements) {
                return ts.forEach(elements, function (e) { return e.kind === 174; });
            }
            function skipParentheses(node) {
                while (node.kind === 162 || node.kind === 161) {
                    node = node.expression;
                }
                return node;
            }
            function emitCallTarget(node) {
                if (node.kind === 65 || node.kind === 93 || node.kind === 91) {
                    emit(node);
                    return node;
                }
                var temp = createAndRecordTempVariable(0);
                write("(");
                emit(temp);
                write(" = ");
                emit(node);
                write(")");
                return temp;
            }
            function emitCallWithSpread(node) {
                var target;
                var expr = skipParentheses(node.expression);
                if (expr.kind === 156) {
                    target = emitCallTarget(expr.expression);
                    write(".");
                    emit(expr.name);
                }
                else if (expr.kind === 157) {
                    target = emitCallTarget(expr.expression);
                    write("[");
                    emit(expr.argumentExpression);
                    write("]");
                }
                else if (expr.kind === 91) {
                    target = expr;
                    write("_super");
                }
                else {
                    emit(node.expression);
                }
                write(".apply(");
                if (target) {
                    if (target.kind === 91) {
                        emitThis(target);
                    }
                    else {
                        emit(target);
                    }
                }
                else {
                    write("void 0");
                }
                write(", ");
                emitListWithSpread(node.arguments, false, false);
                write(")");
            }
            function emitCallExpression(node) {
                if (languageVersion < 2 && hasSpreadElement(node.arguments)) {
                    emitCallWithSpread(node);
                    return;
                }
                var superCall = false;
                if (node.expression.kind === 91) {
                    emitSuper(node.expression);
                    superCall = true;
                }
                else {
                    emit(node.expression);
                    superCall = node.expression.kind === 156 && node.expression.expression.kind === 91;
                }
                if (superCall && languageVersion < 2) {
                    write(".call(");
                    emitThis(node.expression);
                    if (node.arguments.length) {
                        write(", ");
                        emitCommaList(node.arguments);
                    }
                    write(")");
                }
                else {
                    write("(");
                    emitCommaList(node.arguments);
                    write(")");
                }
            }
            function emitNewExpression(node) {
                write("new ");
                emit(node.expression);
                if (node.arguments) {
                    write("(");
                    emitCommaList(node.arguments);
                    write(")");
                }
            }
            function emitTaggedTemplateExpression(node) {
                if (languageVersion >= 2) {
                    emit(node.tag);
                    write(" ");
                    emit(node.template);
                }
                else {
                    emitDownlevelTaggedTemplate(node);
                }
            }
            function emitParenExpression(node) {
                if (!node.parent || node.parent.kind !== 164) {
                    if (node.expression.kind === 161) {
                        var operand = node.expression.expression;
                        while (operand.kind == 161) {
                            operand = operand.expression;
                        }
                        if (operand.kind !== 168 &&
                            operand.kind !== 167 &&
                            operand.kind !== 166 &&
                            operand.kind !== 165 &&
                            operand.kind !== 169 &&
                            operand.kind !== 159 &&
                            !(operand.kind === 158 && node.parent.kind === 159) &&
                            !(operand.kind === 163 && node.parent.kind === 158)) {
                            emit(operand);
                            return;
                        }
                    }
                }
                write("(");
                emit(node.expression);
                write(")");
            }
            function emitDeleteExpression(node) {
                write(ts.tokenToString(74));
                write(" ");
                emit(node.expression);
            }
            function emitVoidExpression(node) {
                write(ts.tokenToString(99));
                write(" ");
                emit(node.expression);
            }
            function emitTypeOfExpression(node) {
                write(ts.tokenToString(97));
                write(" ");
                emit(node.expression);
            }
            function isNameOfExportedSourceLevelDeclarationInSystemExternalModule(node) {
                if (!isCurrentFileSystemExternalModule() || node.kind !== 65 || ts.nodeIsSynthesized(node)) {
                    return false;
                }
                var isVariableDeclarationOrBindingElement = node.parent && (node.parent.kind === 199 || node.parent.kind === 153);
                var targetDeclaration = isVariableDeclarationOrBindingElement
                    ? node.parent
                    : resolver.getReferencedValueDeclaration(node);
                return isSourceFileLevelDeclarationInSystemJsModule(targetDeclaration, true);
            }
            function emitPrefixUnaryExpression(node) {
                var exportChanged = isNameOfExportedSourceLevelDeclarationInSystemExternalModule(node.operand);
                if (exportChanged) {
                    write(exportFunctionForFile + "(\"");
                    emitNodeWithoutSourceMap(node.operand);
                    write("\", ");
                }
                write(ts.tokenToString(node.operator));
                if (node.operand.kind === 168) {
                    var operand = node.operand;
                    if (node.operator === 33 && (operand.operator === 33 || operand.operator === 38)) {
                        write(" ");
                    }
                    else if (node.operator === 34 && (operand.operator === 34 || operand.operator === 39)) {
                        write(" ");
                    }
                }
                emit(node.operand);
                if (exportChanged) {
                    write(")");
                }
            }
            function emitPostfixUnaryExpression(node) {
                var exportChanged = isNameOfExportedSourceLevelDeclarationInSystemExternalModule(node.operand);
                if (exportChanged) {
                    write("(" + exportFunctionForFile + "(\"");
                    emitNodeWithoutSourceMap(node.operand);
                    write("\", ");
                    write(ts.tokenToString(node.operator));
                    emit(node.operand);
                    if (node.operator === 38) {
                        write(") - 1)");
                    }
                    else {
                        write(") + 1)");
                    }
                }
                else {
                    emit(node.operand);
                    write(ts.tokenToString(node.operator));
                }
            }
            function shouldHoistDeclarationInSystemJsModule(node) {
                return isSourceFileLevelDeclarationInSystemJsModule(node, false);
            }
            function isSourceFileLevelDeclarationInSystemJsModule(node, isExported) {
                if (!node || languageVersion >= 2 || !isCurrentFileSystemExternalModule()) {
                    return false;
                }
                var current = node;
                while (current) {
                    if (current.kind === 228) {
                        return !isExported || ((ts.getCombinedNodeFlags(node) & 1) !== 0);
                    }
                    else if (ts.isFunctionLike(current) || current.kind === 207) {
                        return false;
                    }
                    else {
                        current = current.parent;
                    }
                }
            }
            function emitBinaryExpression(node) {
                if (languageVersion < 2 && node.operatorToken.kind === 53 &&
                    (node.left.kind === 155 || node.left.kind === 154)) {
                    emitDestructuring(node, node.parent.kind === 183);
                }
                else {
                    var exportChanged = node.operatorToken.kind >= 53 &&
                        node.operatorToken.kind <= 64 &&
                        isNameOfExportedSourceLevelDeclarationInSystemExternalModule(node.left);
                    if (exportChanged) {
                        write(exportFunctionForFile + "(\"");
                        emitNodeWithoutSourceMap(node.left);
                        write("\", ");
                    }
                    emit(node.left);
                    var indentedBeforeOperator = indentIfOnDifferentLines(node, node.left, node.operatorToken, node.operatorToken.kind !== 23 ? " " : undefined);
                    write(ts.tokenToString(node.operatorToken.kind));
                    var indentedAfterOperator = indentIfOnDifferentLines(node, node.operatorToken, node.right, " ");
                    emit(node.right);
                    decreaseIndentIf(indentedBeforeOperator, indentedAfterOperator);
                    if (exportChanged) {
                        write(")");
                    }
                }
            }
            function synthesizedNodeStartsOnNewLine(node) {
                return ts.nodeIsSynthesized(node) && node.startsOnNewLine;
            }
            function emitConditionalExpression(node) {
                emit(node.condition);
                var indentedBeforeQuestion = indentIfOnDifferentLines(node, node.condition, node.questionToken, " ");
                write("?");
                var indentedAfterQuestion = indentIfOnDifferentLines(node, node.questionToken, node.whenTrue, " ");
                emit(node.whenTrue);
                decreaseIndentIf(indentedBeforeQuestion, indentedAfterQuestion);
                var indentedBeforeColon = indentIfOnDifferentLines(node, node.whenTrue, node.colonToken, " ");
                write(":");
                var indentedAfterColon = indentIfOnDifferentLines(node, node.colonToken, node.whenFalse, " ");
                emit(node.whenFalse);
                decreaseIndentIf(indentedBeforeColon, indentedAfterColon);
            }
            function decreaseIndentIf(value1, value2) {
                if (value1) {
                    decreaseIndent();
                }
                if (value2) {
                    decreaseIndent();
                }
            }
            function isSingleLineEmptyBlock(node) {
                if (node && node.kind === 180) {
                    var block = node;
                    return block.statements.length === 0 && nodeEndIsOnSameLineAsNodeStart(block, block);
                }
            }
            function emitBlock(node) {
                if (isSingleLineEmptyBlock(node)) {
                    emitToken(14, node.pos);
                    write(" ");
                    emitToken(15, node.statements.end);
                    return;
                }
                emitToken(14, node.pos);
                increaseIndent();
                scopeEmitStart(node.parent);
                if (node.kind === 207) {
                    ts.Debug.assert(node.parent.kind === 206);
                    emitCaptureThisForNodeIfNecessary(node.parent);
                }
                emitLines(node.statements);
                if (node.kind === 207) {
                    emitTempDeclarations(true);
                }
                decreaseIndent();
                writeLine();
                emitToken(15, node.statements.end);
                scopeEmitEnd();
            }
            function emitEmbeddedStatement(node) {
                if (node.kind === 180) {
                    write(" ");
                    emit(node);
                }
                else {
                    increaseIndent();
                    writeLine();
                    emit(node);
                    decreaseIndent();
                }
            }
            function emitExpressionStatement(node) {
                emitParenthesizedIf(node.expression, node.expression.kind === 164);
                write(";");
            }
            function emitIfStatement(node) {
                var endPos = emitToken(84, node.pos);
                write(" ");
                endPos = emitToken(16, endPos);
                emit(node.expression);
                emitToken(17, node.expression.end);
                emitEmbeddedStatement(node.thenStatement);
                if (node.elseStatement) {
                    writeLine();
                    emitToken(76, node.thenStatement.end);
                    if (node.elseStatement.kind === 184) {
                        write(" ");
                        emit(node.elseStatement);
                    }
                    else {
                        emitEmbeddedStatement(node.elseStatement);
                    }
                }
            }
            function emitDoStatement(node) {
                write("do");
                emitEmbeddedStatement(node.statement);
                if (node.statement.kind === 180) {
                    write(" ");
                }
                else {
                    writeLine();
                }
                write("while (");
                emit(node.expression);
                write(");");
            }
            function emitWhileStatement(node) {
                write("while (");
                emit(node.expression);
                write(")");
                emitEmbeddedStatement(node.statement);
            }
            function tryEmitStartOfVariableDeclarationList(decl, startPos) {
                if (shouldHoistVariable(decl, true)) {
                    return false;
                }
                var tokenKind = 98;
                if (decl && languageVersion >= 2) {
                    if (ts.isLet(decl)) {
                        tokenKind = 104;
                    }
                    else if (ts.isConst(decl)) {
                        tokenKind = 70;
                    }
                }
                if (startPos !== undefined) {
                    emitToken(tokenKind, startPos);
                    write(" ");
                }
                else {
                    switch (tokenKind) {
                        case 98:
                            write("var ");
                            break;
                        case 104:
                            write("let ");
                            break;
                        case 70:
                            write("const ");
                            break;
                    }
                }
                return true;
            }
            function emitVariableDeclarationListSkippingUninitializedEntries(list) {
                var started = false;
                for (var _a = 0, _b = list.declarations; _a < _b.length; _a++) {
                    var decl = _b[_a];
                    if (!decl.initializer) {
                        continue;
                    }
                    if (!started) {
                        started = true;
                    }
                    else {
                        write(", ");
                    }
                    emit(decl);
                }
                return started;
            }
            function emitForStatement(node) {
                var endPos = emitToken(82, node.pos);
                write(" ");
                endPos = emitToken(16, endPos);
                if (node.initializer && node.initializer.kind === 200) {
                    var variableDeclarationList = node.initializer;
                    var startIsEmitted = tryEmitStartOfVariableDeclarationList(variableDeclarationList, endPos);
                    if (startIsEmitted) {
                        emitCommaList(variableDeclarationList.declarations);
                    }
                    else {
                        emitVariableDeclarationListSkippingUninitializedEntries(variableDeclarationList);
                    }
                }
                else if (node.initializer) {
                    emit(node.initializer);
                }
                write(";");
                emitOptional(" ", node.condition);
                write(";");
                emitOptional(" ", node.incrementor);
                write(")");
                emitEmbeddedStatement(node.statement);
            }
            function emitForInOrForOfStatement(node) {
                if (languageVersion < 2 && node.kind === 189) {
                    return emitDownLevelForOfStatement(node);
                }
                var endPos = emitToken(82, node.pos);
                write(" ");
                endPos = emitToken(16, endPos);
                if (node.initializer.kind === 200) {
                    var variableDeclarationList = node.initializer;
                    if (variableDeclarationList.declarations.length >= 1) {
                        tryEmitStartOfVariableDeclarationList(variableDeclarationList, endPos);
                        emit(variableDeclarationList.declarations[0]);
                    }
                }
                else {
                    emit(node.initializer);
                }
                if (node.kind === 188) {
                    write(" in ");
                }
                else {
                    write(" of ");
                }
                emit(node.expression);
                emitToken(17, node.expression.end);
                emitEmbeddedStatement(node.statement);
            }
            function emitDownLevelForOfStatement(node) {
                // The following ES6 code:
                //
                //    for (let v of expr) { }
                //
                // should be emitted as
                //
                //    for (let _i = 0, _a = expr; _i < _a.length; _i++) {
                //        let v = _a[_i];
                //    }
                //
                // where _a and _i are temps emitted to capture the RHS and the counter,
                // respectively.
                // When the left hand side is an expression instead of a let declaration,
                // the "let v" is not emitted.
                // When the left hand side is a let/const, the v is renamed if there is
                // another v in scope.
                // Note that all assignments to the LHS are emitted in the body, including
                // all destructuring.
                // Note also that because an extra statement is needed to assign to the LHS,
                // for-of bodies are always emitted as blocks.
                var endPos = emitToken(82, node.pos);
                write(" ");
                endPos = emitToken(16, endPos);
                var rhsIsIdentifier = node.expression.kind === 65;
                var counter = createTempVariable(268435456);
                var rhsReference = rhsIsIdentifier ? node.expression : createTempVariable(0);
                emitStart(node.expression);
                write("var ");
                emitNodeWithoutSourceMap(counter);
                write(" = 0");
                emitEnd(node.expression);
                if (!rhsIsIdentifier) {
                    write(", ");
                    emitStart(node.expression);
                    emitNodeWithoutSourceMap(rhsReference);
                    write(" = ");
                    emitNodeWithoutSourceMap(node.expression);
                    emitEnd(node.expression);
                }
                write("; ");
                emitStart(node.initializer);
                emitNodeWithoutSourceMap(counter);
                write(" < ");
                emitNodeWithoutSourceMap(rhsReference);
                write(".length");
                emitEnd(node.initializer);
                write("; ");
                emitStart(node.initializer);
                emitNodeWithoutSourceMap(counter);
                write("++");
                emitEnd(node.initializer);
                emitToken(17, node.expression.end);
                write(" {");
                writeLine();
                increaseIndent();
                var rhsIterationValue = createElementAccessExpression(rhsReference, counter);
                emitStart(node.initializer);
                if (node.initializer.kind === 200) {
                    write("var ");
                    var variableDeclarationList = node.initializer;
                    if (variableDeclarationList.declarations.length > 0) {
                        var declaration = variableDeclarationList.declarations[0];
                        if (ts.isBindingPattern(declaration.name)) {
                            emitDestructuring(declaration, false, rhsIterationValue);
                        }
                        else {
                            emitNodeWithoutSourceMap(declaration);
                            write(" = ");
                            emitNodeWithoutSourceMap(rhsIterationValue);
                        }
                    }
                    else {
                        emitNodeWithoutSourceMap(createTempVariable(0));
                        write(" = ");
                        emitNodeWithoutSourceMap(rhsIterationValue);
                    }
                }
                else {
                    var assignmentExpression = createBinaryExpression(node.initializer, 53, rhsIterationValue, false);
                    if (node.initializer.kind === 154 || node.initializer.kind === 155) {
                        emitDestructuring(assignmentExpression, true, undefined);
                    }
                    else {
                        emitNodeWithoutSourceMap(assignmentExpression);
                    }
                }
                emitEnd(node.initializer);
                write(";");
                if (node.statement.kind === 180) {
                    emitLines(node.statement.statements);
                }
                else {
                    writeLine();
                    emit(node.statement);
                }
                writeLine();
                decreaseIndent();
                write("}");
            }
            function emitBreakOrContinueStatement(node) {
                emitToken(node.kind === 191 ? 66 : 71, node.pos);
                emitOptional(" ", node.label);
                write(";");
            }
            function emitReturnStatement(node) {
                emitToken(90, node.pos);
                emitOptional(" ", node.expression);
                write(";");
            }
            function emitWithStatement(node) {
                write("with (");
                emit(node.expression);
                write(")");
                emitEmbeddedStatement(node.statement);
            }
            function emitSwitchStatement(node) {
                var endPos = emitToken(92, node.pos);
                write(" ");
                emitToken(16, endPos);
                emit(node.expression);
                endPos = emitToken(17, node.expression.end);
                write(" ");
                emitCaseBlock(node.caseBlock, endPos);
            }
            function emitCaseBlock(node, startPos) {
                emitToken(14, startPos);
                increaseIndent();
                emitLines(node.clauses);
                decreaseIndent();
                writeLine();
                emitToken(15, node.clauses.end);
            }
            function nodeStartPositionsAreOnSameLine(node1, node2) {
                return ts.getLineOfLocalPosition(currentSourceFile, ts.skipTrivia(currentSourceFile.text, node1.pos)) ===
                    ts.getLineOfLocalPosition(currentSourceFile, ts.skipTrivia(currentSourceFile.text, node2.pos));
            }
            function nodeEndPositionsAreOnSameLine(node1, node2) {
                return ts.getLineOfLocalPosition(currentSourceFile, node1.end) ===
                    ts.getLineOfLocalPosition(currentSourceFile, node2.end);
            }
            function nodeEndIsOnSameLineAsNodeStart(node1, node2) {
                return ts.getLineOfLocalPosition(currentSourceFile, node1.end) ===
                    ts.getLineOfLocalPosition(currentSourceFile, ts.skipTrivia(currentSourceFile.text, node2.pos));
            }
            function emitCaseOrDefaultClause(node) {
                if (node.kind === 221) {
                    write("case ");
                    emit(node.expression);
                    write(":");
                }
                else {
                    write("default:");
                }
                if (node.statements.length === 1 && nodeStartPositionsAreOnSameLine(node, node.statements[0])) {
                    write(" ");
                    emit(node.statements[0]);
                }
                else {
                    increaseIndent();
                    emitLines(node.statements);
                    decreaseIndent();
                }
            }
            function emitThrowStatement(node) {
                write("throw ");
                emit(node.expression);
                write(";");
            }
            function emitTryStatement(node) {
                write("try ");
                emit(node.tryBlock);
                emit(node.catchClause);
                if (node.finallyBlock) {
                    writeLine();
                    write("finally ");
                    emit(node.finallyBlock);
                }
            }
            function emitCatchClause(node) {
                writeLine();
                var endPos = emitToken(68, node.pos);
                write(" ");
                emitToken(16, endPos);
                emit(node.variableDeclaration);
                emitToken(17, node.variableDeclaration ? node.variableDeclaration.end : endPos);
                write(" ");
                emitBlock(node.block);
            }
            function emitDebuggerStatement(node) {
                emitToken(72, node.pos);
                write(";");
            }
            function emitLabelledStatement(node) {
                emit(node.label);
                write(": ");
                emit(node.statement);
            }
            function getContainingModule(node) {
                do {
                    node = node.parent;
                } while (node && node.kind !== 206);
                return node;
            }
            function emitContainingModuleName(node) {
                var container = getContainingModule(node);
                write(container ? getGeneratedNameForNode(container) : "exports");
            }
            function emitModuleMemberName(node) {
                emitStart(node.name);
                if (ts.getCombinedNodeFlags(node) & 1) {
                    var container = getContainingModule(node);
                    if (container) {
                        write(getGeneratedNameForNode(container));
                        write(".");
                    }
                    else if (languageVersion < 2 && compilerOptions.module !== 4) {
                        write("exports.");
                    }
                }
                emitNodeWithoutSourceMap(node.name);
                emitEnd(node.name);
            }
            function createVoidZero() {
                var zero = ts.createSynthesizedNode(7);
                zero.text = "0";
                var result = ts.createSynthesizedNode(167);
                result.expression = zero;
                return result;
            }
            function emitExportMemberAssignment(node) {
                if (node.flags & 1) {
                    writeLine();
                    emitStart(node);
                    if (compilerOptions.module === 4) {
                        write(exportFunctionForFile + "(\"");
                        if (node.flags & 256) {
                            write("default");
                        }
                        else {
                            emitNodeWithoutSourceMap(node.name);
                        }
                        write("\", ");
                        emitDeclarationName(node);
                        write(")");
                    }
                    else {
                        if (node.flags & 256) {
                            if (languageVersion === 0) {
                                write("exports[\"default\"]");
                            }
                            else {
                                write("exports.default");
                            }
                        }
                        else {
                            emitModuleMemberName(node);
                        }
                        write(" = ");
                        emitDeclarationName(node);
                    }
                    emitEnd(node);
                    write(";");
                }
            }
            function emitExportMemberAssignments(name) {
                if (!exportEquals && exportSpecifiers && ts.hasProperty(exportSpecifiers, name.text)) {
                    for (var _a = 0, _b = exportSpecifiers[name.text]; _a < _b.length; _a++) {
                        var specifier = _b[_a];
                        writeLine();
                        if (compilerOptions.module === 4) {
                            emitStart(specifier.name);
                            write(exportFunctionForFile + "(\"");
                            emitNodeWithoutSourceMap(specifier.name);
                            write("\", ");
                            emitExpressionIdentifier(name);
                            write(")");
                            emitEnd(specifier.name);
                        }
                        else {
                            emitStart(specifier.name);
                            emitContainingModuleName(specifier);
                            write(".");
                            emitNodeWithoutSourceMap(specifier.name);
                            emitEnd(specifier.name);
                            write(" = ");
                            emitExpressionIdentifier(name);
                        }
                        write(";");
                    }
                }
            }
            function emitDestructuring(root, isAssignmentExpressionStatement, value) {
                var emitCount = 0;
                var canDefineTempVariablesInPlace = false;
                if (root.kind === 199) {
                    var isExported = ts.getCombinedNodeFlags(root) & 1;
                    var isSourceLevelForSystemModuleKind = shouldHoistDeclarationInSystemJsModule(root);
                    canDefineTempVariablesInPlace = !isExported && !isSourceLevelForSystemModuleKind;
                }
                else if (root.kind === 130) {
                    canDefineTempVariablesInPlace = true;
                }
                if (root.kind === 170) {
                    emitAssignmentExpression(root);
                }
                else {
                    ts.Debug.assert(!isAssignmentExpressionStatement);
                    emitBindingElement(root, value);
                }
                function emitAssignment(name, value) {
                    if (emitCount++) {
                        write(", ");
                    }
                    renameNonTopLevelLetAndConst(name);
                    var isVariableDeclarationOrBindingElement = name.parent && (name.parent.kind === 199 || name.parent.kind === 153);
                    var exportChanged = isNameOfExportedSourceLevelDeclarationInSystemExternalModule(name);
                    if (exportChanged) {
                        write(exportFunctionForFile + "(\"");
                        emitNodeWithoutSourceMap(name);
                        write("\", ");
                    }
                    if (isVariableDeclarationOrBindingElement) {
                        emitModuleMemberName(name.parent);
                    }
                    else {
                        emit(name);
                    }
                    write(" = ");
                    emit(value);
                    if (exportChanged) {
                        write(")");
                    }
                }
                function ensureIdentifier(expr) {
                    if (expr.kind !== 65) {
                        var identifier = createTempVariable(0);
                        if (!canDefineTempVariablesInPlace) {
                            recordTempDeclaration(identifier);
                        }
                        emitAssignment(identifier, expr);
                        expr = identifier;
                    }
                    return expr;
                }
                function createDefaultValueCheck(value, defaultValue) {
                    value = ensureIdentifier(value);
                    var equals = ts.createSynthesizedNode(170);
                    equals.left = value;
                    equals.operatorToken = ts.createSynthesizedNode(30);
                    equals.right = createVoidZero();
                    return createConditionalExpression(equals, defaultValue, value);
                }
                function createConditionalExpression(condition, whenTrue, whenFalse) {
                    var cond = ts.createSynthesizedNode(171);
                    cond.condition = condition;
                    cond.questionToken = ts.createSynthesizedNode(50);
                    cond.whenTrue = whenTrue;
                    cond.colonToken = ts.createSynthesizedNode(51);
                    cond.whenFalse = whenFalse;
                    return cond;
                }
                function createNumericLiteral(value) {
                    var node = ts.createSynthesizedNode(7);
                    node.text = "" + value;
                    return node;
                }
                function createPropertyAccessForDestructuringProperty(object, propName) {
                    if (propName.kind !== 65) {
                        return createElementAccessExpression(object, propName);
                    }
                    return createPropertyAccessExpression(object, propName);
                }
                function createSliceCall(value, sliceIndex) {
                    var call = ts.createSynthesizedNode(158);
                    var sliceIdentifier = ts.createSynthesizedNode(65);
                    sliceIdentifier.text = "slice";
                    call.expression = createPropertyAccessExpression(value, sliceIdentifier);
                    call.arguments = ts.createSynthesizedNodeArray();
                    call.arguments[0] = createNumericLiteral(sliceIndex);
                    return call;
                }
                function emitObjectLiteralAssignment(target, value) {
                    var properties = target.properties;
                    if (properties.length !== 1) {
                        value = ensureIdentifier(value);
                    }
                    for (var _a = 0; _a < properties.length; _a++) {
                        var p = properties[_a];
                        if (p.kind === 225 || p.kind === 226) {
                            var propName = (p.name);
                            emitDestructuringAssignment(p.initializer || propName, createPropertyAccessForDestructuringProperty(value, propName));
                        }
                    }
                }
                function emitArrayLiteralAssignment(target, value) {
                    var elements = target.elements;
                    if (elements.length !== 1) {
                        value = ensureIdentifier(value);
                    }
                    for (var i = 0; i < elements.length; i++) {
                        var e = elements[i];
                        if (e.kind !== 176) {
                            if (e.kind !== 174) {
                                emitDestructuringAssignment(e, createElementAccessExpression(value, createNumericLiteral(i)));
                            }
                            else if (i === elements.length - 1) {
                                emitDestructuringAssignment(e.expression, createSliceCall(value, i));
                            }
                        }
                    }
                }
                function emitDestructuringAssignment(target, value) {
                    if (target.kind === 170 && target.operatorToken.kind === 53) {
                        value = createDefaultValueCheck(value, target.right);
                        target = target.left;
                    }
                    if (target.kind === 155) {
                        emitObjectLiteralAssignment(target, value);
                    }
                    else if (target.kind === 154) {
                        emitArrayLiteralAssignment(target, value);
                    }
                    else {
                        emitAssignment(target, value);
                    }
                }
                function emitAssignmentExpression(root) {
                    var target = root.left;
                    var value = root.right;
                    if (isAssignmentExpressionStatement) {
                        emitDestructuringAssignment(target, value);
                    }
                    else {
                        if (root.parent.kind !== 162) {
                            write("(");
                        }
                        value = ensureIdentifier(value);
                        emitDestructuringAssignment(target, value);
                        write(", ");
                        emit(value);
                        if (root.parent.kind !== 162) {
                            write(")");
                        }
                    }
                }
                function emitBindingElement(target, value) {
                    if (target.initializer) {
                        value = value ? createDefaultValueCheck(value, target.initializer) : target.initializer;
                    }
                    else if (!value) {
                        value = createVoidZero();
                    }
                    if (ts.isBindingPattern(target.name)) {
                        var pattern = target.name;
                        var elements = pattern.elements;
                        if (elements.length !== 1) {
                            value = ensureIdentifier(value);
                        }
                        for (var i = 0; i < elements.length; i++) {
                            var element = elements[i];
                            if (pattern.kind === 151) {
                                var propName = element.propertyName || element.name;
                                emitBindingElement(element, createPropertyAccessForDestructuringProperty(value, propName));
                            }
                            else if (element.kind !== 176) {
                                if (!element.dotDotDotToken) {
                                    emitBindingElement(element, createElementAccessExpression(value, createNumericLiteral(i)));
                                }
                                else if (i === elements.length - 1) {
                                    emitBindingElement(element, createSliceCall(value, i));
                                }
                            }
                        }
                    }
                    else {
                        emitAssignment(target.name, value);
                    }
                }
            }
            function emitVariableDeclaration(node) {
                if (ts.isBindingPattern(node.name)) {
                    if (languageVersion < 2) {
                        emitDestructuring(node, false);
                    }
                    else {
                        emit(node.name);
                        emitOptional(" = ", node.initializer);
                    }
                }
                else {
                    renameNonTopLevelLetAndConst(node.name);
                    var initializer = node.initializer;
                    if (!initializer && languageVersion < 2) {
                        var isUninitializedLet = (resolver.getNodeCheckFlags(node) & 256) &&
                            (getCombinedFlagsForIdentifier(node.name) & 4096);
                        if (isUninitializedLet &&
                            node.parent.parent.kind !== 188 &&
                            node.parent.parent.kind !== 189) {
                            initializer = createVoidZero();
                        }
                    }
                    var exportChanged = isNameOfExportedSourceLevelDeclarationInSystemExternalModule(node.name);
                    if (exportChanged) {
                        write(exportFunctionForFile + "(\"");
                        emitNodeWithoutSourceMap(node.name);
                        write("\", ");
                    }
                    emitModuleMemberName(node);
                    emitOptional(" = ", initializer);
                    if (exportChanged) {
                        write(")");
                    }
                }
            }
            function emitExportVariableAssignments(node) {
                if (node.kind === 176) {
                    return;
                }
                var name = node.name;
                if (name.kind === 65) {
                    emitExportMemberAssignments(name);
                }
                else if (ts.isBindingPattern(name)) {
                    ts.forEach(name.elements, emitExportVariableAssignments);
                }
            }
            function getCombinedFlagsForIdentifier(node) {
                if (!node.parent || (node.parent.kind !== 199 && node.parent.kind !== 153)) {
                    return 0;
                }
                return ts.getCombinedNodeFlags(node.parent);
            }
            function renameNonTopLevelLetAndConst(node) {
                if (languageVersion >= 2 ||
                    ts.nodeIsSynthesized(node) ||
                    node.kind !== 65 ||
                    (node.parent.kind !== 199 && node.parent.kind !== 153)) {
                    return;
                }
                var combinedFlags = getCombinedFlagsForIdentifier(node);
                if (((combinedFlags & 12288) === 0) || combinedFlags & 1) {
                    return;
                }
                var list = ts.getAncestor(node, 200);
                if (list.parent.kind === 181) {
                    var isSourceFileLevelBinding = list.parent.parent.kind === 228;
                    var isModuleLevelBinding = list.parent.parent.kind === 207;
                    var isFunctionLevelBinding = list.parent.parent.kind === 180 && ts.isFunctionLike(list.parent.parent.parent);
                    if (isSourceFileLevelBinding || isModuleLevelBinding || isFunctionLevelBinding) {
                        return;
                    }
                }
                var blockScopeContainer = ts.getEnclosingBlockScopeContainer(node);
                var parent = blockScopeContainer.kind === 228
                    ? blockScopeContainer
                    : blockScopeContainer.parent;
                if (resolver.resolvesToSomeValue(parent, node.text)) {
                    var variableId = resolver.getBlockScopedVariableId(node);
                    if (!blockScopedVariableToGeneratedName) {
                        blockScopedVariableToGeneratedName = [];
                    }
                    var generatedName = makeUniqueName(node.text);
                    blockScopedVariableToGeneratedName[variableId] = generatedName;
                }
            }
            function isES6ExportedDeclaration(node) {
                return !!(node.flags & 1) &&
                    languageVersion >= 2 &&
                    node.parent.kind === 228;
            }
            function emitVariableStatement(node) {
                var startIsEmitted = true;
                if (!(node.flags & 1)) {
                    startIsEmitted = tryEmitStartOfVariableDeclarationList(node.declarationList);
                }
                else if (isES6ExportedDeclaration(node)) {
                    write("export ");
                    startIsEmitted = tryEmitStartOfVariableDeclarationList(node.declarationList);
                }
                if (startIsEmitted) {
                    emitCommaList(node.declarationList.declarations);
                    write(";");
                }
                else {
                    var atLeastOneItem = emitVariableDeclarationListSkippingUninitializedEntries(node.declarationList);
                    if (atLeastOneItem) {
                        write(";");
                    }
                }
                if (languageVersion < 2 && node.parent === currentSourceFile) {
                    ts.forEach(node.declarationList.declarations, emitExportVariableAssignments);
                }
            }
            function emitParameter(node) {
                if (languageVersion < 2) {
                    if (ts.isBindingPattern(node.name)) {
                        var name_5 = createTempVariable(0);
                        if (!tempParameters) {
                            tempParameters = [];
                        }
                        tempParameters.push(name_5);
                        emit(name_5);
                    }
                    else {
                        emit(node.name);
                    }
                }
                else {
                    if (node.dotDotDotToken) {
                        write("...");
                    }
                    emit(node.name);
                    emitOptional(" = ", node.initializer);
                }
            }
            function emitDefaultValueAssignments(node) {
                if (languageVersion < 2) {
                    var tempIndex = 0;
                    ts.forEach(node.parameters, function (p) {
                        if (p.dotDotDotToken) {
                            return;
                        }
                        if (ts.isBindingPattern(p.name)) {
                            writeLine();
                            write("var ");
                            emitDestructuring(p, false, tempParameters[tempIndex]);
                            write(";");
                            tempIndex++;
                        }
                        else if (p.initializer) {
                            writeLine();
                            emitStart(p);
                            write("if (");
                            emitNodeWithoutSourceMap(p.name);
                            write(" === void 0)");
                            emitEnd(p);
                            write(" { ");
                            emitStart(p);
                            emitNodeWithoutSourceMap(p.name);
                            write(" = ");
                            emitNodeWithoutSourceMap(p.initializer);
                            emitEnd(p);
                            write("; }");
                        }
                    });
                }
            }
            function emitRestParameter(node) {
                if (languageVersion < 2 && ts.hasRestParameters(node)) {
                    var restIndex = node.parameters.length - 1;
                    var restParam = node.parameters[restIndex];
                    if (ts.isBindingPattern(restParam.name)) {
                        return;
                    }
                    var tempName = createTempVariable(268435456).text;
                    writeLine();
                    emitLeadingComments(restParam);
                    emitStart(restParam);
                    write("var ");
                    emitNodeWithoutSourceMap(restParam.name);
                    write(" = [];");
                    emitEnd(restParam);
                    emitTrailingComments(restParam);
                    writeLine();
                    write("for (");
                    emitStart(restParam);
                    write("var " + tempName + " = " + restIndex + ";");
                    emitEnd(restParam);
                    write(" ");
                    emitStart(restParam);
                    write(tempName + " < arguments.length;");
                    emitEnd(restParam);
                    write(" ");
                    emitStart(restParam);
                    write(tempName + "++");
                    emitEnd(restParam);
                    write(") {");
                    increaseIndent();
                    writeLine();
                    emitStart(restParam);
                    emitNodeWithoutSourceMap(restParam.name);
                    write("[" + tempName + " - " + restIndex + "] = arguments[" + tempName + "];");
                    emitEnd(restParam);
                    decreaseIndent();
                    writeLine();
                    write("}");
                }
            }
            function emitAccessor(node) {
                write(node.kind === 137 ? "get " : "set ");
                emit(node.name, false);
                emitSignatureAndBody(node);
            }
            function shouldEmitAsArrowFunction(node) {
                return node.kind === 164 && languageVersion >= 2;
            }
            function emitDeclarationName(node) {
                if (node.name) {
                    emitNodeWithoutSourceMap(node.name);
                }
                else {
                    write(getGeneratedNameForNode(node));
                }
            }
            function shouldEmitFunctionName(node) {
                if (node.kind === 163) {
                    return !!node.name;
                }
                if (node.kind === 201) {
                    return !!node.name || languageVersion < 2;
                }
            }
            function emitFunctionDeclaration(node) {
                if (ts.nodeIsMissing(node.body)) {
                    return emitOnlyPinnedOrTripleSlashComments(node);
                }
                if (node.kind !== 135 && node.kind !== 134) {
                    emitLeadingComments(node);
                }
                if (!shouldEmitAsArrowFunction(node)) {
                    if (isES6ExportedDeclaration(node)) {
                        write("export ");
                        if (node.flags & 256) {
                            write("default ");
                        }
                    }
                    write("function");
                    if (languageVersion >= 2 && node.asteriskToken) {
                        write("*");
                    }
                    write(" ");
                }
                if (shouldEmitFunctionName(node)) {
                    emitDeclarationName(node);
                }
                emitSignatureAndBody(node);
                if (languageVersion < 2 && node.kind === 201 && node.parent === currentSourceFile && node.name) {
                    emitExportMemberAssignments(node.name);
                }
                if (node.kind !== 135 && node.kind !== 134) {
                    emitTrailingComments(node);
                }
            }
            function emitCaptureThisForNodeIfNecessary(node) {
                if (resolver.getNodeCheckFlags(node) & 4) {
                    writeLine();
                    emitStart(node);
                    write("var _this = this;");
                    emitEnd(node);
                }
            }
            function emitSignatureParameters(node) {
                increaseIndent();
                write("(");
                if (node) {
                    var parameters = node.parameters;
                    var omitCount = languageVersion < 2 && ts.hasRestParameters(node) ? 1 : 0;
                    emitList(parameters, 0, parameters.length - omitCount, false, false);
                }
                write(")");
                decreaseIndent();
            }
            function emitSignatureParametersForArrow(node) {
                if (node.parameters.length === 1 && node.pos === node.parameters[0].pos) {
                    emit(node.parameters[0]);
                    return;
                }
                emitSignatureParameters(node);
            }
            function emitSignatureAndBody(node) {
                var saveTempFlags = tempFlags;
                var saveTempVariables = tempVariables;
                var saveTempParameters = tempParameters;
                tempFlags = 0;
                tempVariables = undefined;
                tempParameters = undefined;
                if (shouldEmitAsArrowFunction(node)) {
                    emitSignatureParametersForArrow(node);
                    write(" =>");
                }
                else {
                    emitSignatureParameters(node);
                }
                if (!node.body) {
                    write(" { }");
                }
                else if (node.body.kind === 180) {
                    emitBlockFunctionBody(node, node.body);
                }
                else {
                    emitExpressionFunctionBody(node, node.body);
                }
                if (!isES6ExportedDeclaration(node)) {
                    emitExportMemberAssignment(node);
                }
                tempFlags = saveTempFlags;
                tempVariables = saveTempVariables;
                tempParameters = saveTempParameters;
            }
            function emitFunctionBodyPreamble(node) {
                emitCaptureThisForNodeIfNecessary(node);
                emitDefaultValueAssignments(node);
                emitRestParameter(node);
            }
            function emitExpressionFunctionBody(node, body) {
                if (languageVersion < 2) {
                    emitDownLevelExpressionFunctionBody(node, body);
                    return;
                }
                write(" ");
                var current = body;
                while (current.kind === 161) {
                    current = current.expression;
                }
                emitParenthesizedIf(body, current.kind === 155);
            }
            function emitDownLevelExpressionFunctionBody(node, body) {
                write(" {");
                scopeEmitStart(node);
                increaseIndent();
                var outPos = writer.getTextPos();
                emitDetachedComments(node.body);
                emitFunctionBodyPreamble(node);
                var preambleEmitted = writer.getTextPos() !== outPos;
                decreaseIndent();
                if (!preambleEmitted && nodeStartPositionsAreOnSameLine(node, body)) {
                    write(" ");
                    emitStart(body);
                    write("return ");
                    emit(body);
                    emitEnd(body);
                    write(";");
                    emitTempDeclarations(false);
                    write(" ");
                }
                else {
                    increaseIndent();
                    writeLine();
                    emitLeadingComments(node.body);
                    write("return ");
                    emit(body);
                    write(";");
                    emitTrailingComments(node.body);
                    emitTempDeclarations(true);
                    decreaseIndent();
                    writeLine();
                }
                emitStart(node.body);
                write("}");
                emitEnd(node.body);
                scopeEmitEnd();
            }
            function emitBlockFunctionBody(node, body) {
                write(" {");
                scopeEmitStart(node);
                var initialTextPos = writer.getTextPos();
                increaseIndent();
                emitDetachedComments(body.statements);
                var startIndex = emitDirectivePrologues(body.statements, true);
                emitFunctionBodyPreamble(node);
                decreaseIndent();
                var preambleEmitted = writer.getTextPos() !== initialTextPos;
                if (!preambleEmitted && nodeEndIsOnSameLineAsNodeStart(body, body)) {
                    for (var _a = 0, _b = body.statements; _a < _b.length; _a++) {
                        var statement = _b[_a];
                        write(" ");
                        emit(statement);
                    }
                    emitTempDeclarations(false);
                    write(" ");
                    emitLeadingCommentsOfPosition(body.statements.end);
                }
                else {
                    increaseIndent();
                    emitLinesStartingAt(body.statements, startIndex);
                    emitTempDeclarations(true);
                    writeLine();
                    emitLeadingCommentsOfPosition(body.statements.end);
                    decreaseIndent();
                }
                emitToken(15, body.statements.end);
                scopeEmitEnd();
            }
            function findInitialSuperCall(ctor) {
                if (ctor.body) {
                    var statement = ctor.body.statements[0];
                    if (statement && statement.kind === 183) {
                        var expr = statement.expression;
                        if (expr && expr.kind === 158) {
                            var func = expr.expression;
                            if (func && func.kind === 91) {
                                return statement;
                            }
                        }
                    }
                }
            }
            function emitParameterPropertyAssignments(node) {
                ts.forEach(node.parameters, function (param) {
                    if (param.flags & 112) {
                        writeLine();
                        emitStart(param);
                        emitStart(param.name);
                        write("this.");
                        emitNodeWithoutSourceMap(param.name);
                        emitEnd(param.name);
                        write(" = ");
                        emit(param.name);
                        write(";");
                        emitEnd(param);
                    }
                });
            }
            function emitMemberAccessForPropertyName(memberName) {
                if (memberName.kind === 8 || memberName.kind === 7) {
                    write("[");
                    emitNodeWithoutSourceMap(memberName);
                    write("]");
                }
                else if (memberName.kind === 128) {
                    emitComputedPropertyName(memberName);
                }
                else {
                    write(".");
                    emitNodeWithoutSourceMap(memberName);
                }
            }
            function getInitializedProperties(node, isStatic) {
                var properties = [];
                for (var _a = 0, _b = node.members; _a < _b.length; _a++) {
                    var member = _b[_a];
                    if (member.kind === 133 && isStatic === ((member.flags & 128) !== 0) && member.initializer) {
                        properties.push(member);
                    }
                }
                return properties;
            }
            function emitPropertyDeclarations(node, properties) {
                for (var _a = 0; _a < properties.length; _a++) {
                    var property = properties[_a];
                    emitPropertyDeclaration(node, property);
                }
            }
            function emitPropertyDeclaration(node, property, receiver, isExpression) {
                writeLine();
                emitLeadingComments(property);
                emitStart(property);
                emitStart(property.name);
                if (receiver) {
                    emit(receiver);
                }
                else {
                    if (property.flags & 128) {
                        emitDeclarationName(node);
                    }
                    else {
                        write("this");
                    }
                }
                emitMemberAccessForPropertyName(property.name);
                emitEnd(property.name);
                write(" = ");
                emit(property.initializer);
                if (!isExpression) {
                    write(";");
                }
                emitEnd(property);
                emitTrailingComments(property);
            }
            function emitMemberFunctionsForES5AndLower(node) {
                ts.forEach(node.members, function (member) {
                    if (member.kind === 179) {
                        writeLine();
                        write(";");
                    }
                    else if (member.kind === 135 || node.kind === 134) {
                        if (!member.body) {
                            return emitOnlyPinnedOrTripleSlashComments(member);
                        }
                        writeLine();
                        emitLeadingComments(member);
                        emitStart(member);
                        emitStart(member.name);
                        emitClassMemberPrefix(node, member);
                        emitMemberAccessForPropertyName(member.name);
                        emitEnd(member.name);
                        write(" = ");
                        emitStart(member);
                        emitFunctionDeclaration(member);
                        emitEnd(member);
                        emitEnd(member);
                        write(";");
                        emitTrailingComments(member);
                    }
                    else if (member.kind === 137 || member.kind === 138) {
                        var accessors = ts.getAllAccessorDeclarations(node.members, member);
                        if (member === accessors.firstAccessor) {
                            writeLine();
                            emitStart(member);
                            write("Object.defineProperty(");
                            emitStart(member.name);
                            emitClassMemberPrefix(node, member);
                            write(", ");
                            emitExpressionForPropertyName(member.name);
                            emitEnd(member.name);
                            write(", {");
                            increaseIndent();
                            if (accessors.getAccessor) {
                                writeLine();
                                emitLeadingComments(accessors.getAccessor);
                                write("get: ");
                                emitStart(accessors.getAccessor);
                                write("function ");
                                emitSignatureAndBody(accessors.getAccessor);
                                emitEnd(accessors.getAccessor);
                                emitTrailingComments(accessors.getAccessor);
                                write(",");
                            }
                            if (accessors.setAccessor) {
                                writeLine();
                                emitLeadingComments(accessors.setAccessor);
                                write("set: ");
                                emitStart(accessors.setAccessor);
                                write("function ");
                                emitSignatureAndBody(accessors.setAccessor);
                                emitEnd(accessors.setAccessor);
                                emitTrailingComments(accessors.setAccessor);
                                write(",");
                            }
                            writeLine();
                            write("enumerable: true,");
                            writeLine();
                            write("configurable: true");
                            decreaseIndent();
                            writeLine();
                            write("});");
                            emitEnd(member);
                        }
                    }
                });
            }
            function emitMemberFunctionsForES6AndHigher(node) {
                for (var _a = 0, _b = node.members; _a < _b.length; _a++) {
                    var member = _b[_a];
                    if ((member.kind === 135 || node.kind === 134) && !member.body) {
                        emitOnlyPinnedOrTripleSlashComments(member);
                    }
                    else if (member.kind === 135 ||
                        member.kind === 137 ||
                        member.kind === 138) {
                        writeLine();
                        emitLeadingComments(member);
                        emitStart(member);
                        if (member.flags & 128) {
                            write("static ");
                        }
                        if (member.kind === 137) {
                            write("get ");
                        }
                        else if (member.kind === 138) {
                            write("set ");
                        }
                        if (member.asteriskToken) {
                            write("*");
                        }
                        emit(member.name);
                        emitSignatureAndBody(member);
                        emitEnd(member);
                        emitTrailingComments(member);
                    }
                    else if (member.kind === 179) {
                        writeLine();
                        write(";");
                    }
                }
            }
            function emitConstructor(node, baseTypeElement) {
                var saveTempFlags = tempFlags;
                var saveTempVariables = tempVariables;
                var saveTempParameters = tempParameters;
                tempFlags = 0;
                tempVariables = undefined;
                tempParameters = undefined;
                emitConstructorWorker(node, baseTypeElement);
                tempFlags = saveTempFlags;
                tempVariables = saveTempVariables;
                tempParameters = saveTempParameters;
            }
            function emitConstructorWorker(node, baseTypeElement) {
                var hasInstancePropertyWithInitializer = false;
                ts.forEach(node.members, function (member) {
                    if (member.kind === 136 && !member.body) {
                        emitOnlyPinnedOrTripleSlashComments(member);
                    }
                    if (member.kind === 133 && member.initializer && (member.flags & 128) === 0) {
                        hasInstancePropertyWithInitializer = true;
                    }
                });
                var ctor = ts.getFirstConstructorWithBody(node);
                if (languageVersion >= 2 && !ctor && !hasInstancePropertyWithInitializer) {
                    return;
                }
                if (ctor) {
                    emitLeadingComments(ctor);
                }
                emitStart(ctor || node);
                if (languageVersion < 2) {
                    write("function ");
                    emitDeclarationName(node);
                    emitSignatureParameters(ctor);
                }
                else {
                    write("constructor");
                    if (ctor) {
                        emitSignatureParameters(ctor);
                    }
                    else {
                        if (baseTypeElement) {
                            write("(...args)");
                        }
                        else {
                            write("()");
                        }
                    }
                }
                write(" {");
                scopeEmitStart(node, "constructor");
                increaseIndent();
                if (ctor) {
                    emitDetachedComments(ctor.body.statements);
                }
                emitCaptureThisForNodeIfNecessary(node);
                if (ctor) {
                    emitDefaultValueAssignments(ctor);
                    emitRestParameter(ctor);
                    if (baseTypeElement) {
                        var superCall = findInitialSuperCall(ctor);
                        if (superCall) {
                            writeLine();
                            emit(superCall);
                        }
                    }
                    emitParameterPropertyAssignments(ctor);
                }
                else {
                    if (baseTypeElement) {
                        writeLine();
                        emitStart(baseTypeElement);
                        if (languageVersion < 2) {
                            write("_super.apply(this, arguments);");
                        }
                        else {
                            write("super(...args);");
                        }
                        emitEnd(baseTypeElement);
                    }
                }
                emitPropertyDeclarations(node, getInitializedProperties(node, false));
                if (ctor) {
                    var statements = ctor.body.statements;
                    if (superCall) {
                        statements = statements.slice(1);
                    }
                    emitLines(statements);
                }
                emitTempDeclarations(true);
                writeLine();
                if (ctor) {
                    emitLeadingCommentsOfPosition(ctor.body.statements.end);
                }
                decreaseIndent();
                emitToken(15, ctor ? ctor.body.statements.end : node.members.end);
                scopeEmitEnd();
                emitEnd(ctor || node);
                if (ctor) {
                    emitTrailingComments(ctor);
                }
            }
            function emitClassExpression(node) {
                return emitClassLikeDeclaration(node);
            }
            function emitClassDeclaration(node) {
                return emitClassLikeDeclaration(node);
            }
            function emitClassLikeDeclaration(node) {
                if (languageVersion < 2) {
                    emitClassLikeDeclarationBelowES6(node);
                }
                else {
                    emitClassLikeDeclarationForES6AndHigher(node);
                }
            }
            function emitClassLikeDeclarationForES6AndHigher(node) {
                var thisNodeIsDecorated = ts.nodeIsDecorated(node);
                if (node.kind === 202) {
                    if (thisNodeIsDecorated) {
                        if (isES6ExportedDeclaration(node) && !(node.flags & 256)) {
                            write("export ");
                        }
                        write("let ");
                        emitDeclarationName(node);
                        write(" = ");
                    }
                    else if (isES6ExportedDeclaration(node)) {
                        write("export ");
                        if (node.flags & 256) {
                            write("default ");
                        }
                    }
                }
                var staticProperties = getInitializedProperties(node, true);
                var isClassExpressionWithStaticProperties = staticProperties.length > 0 && node.kind === 175;
                var tempVariable;
                if (isClassExpressionWithStaticProperties) {
                    tempVariable = createAndRecordTempVariable(0);
                    write("(");
                    increaseIndent();
                    emit(tempVariable);
                    write(" = ");
                }
                write("class");
                if ((node.name || !(node.flags & 256)) && !thisNodeIsDecorated) {
                    write(" ");
                    emitDeclarationName(node);
                }
                var baseTypeNode = ts.getClassExtendsHeritageClauseElement(node);
                if (baseTypeNode) {
                    write(" extends ");
                    emit(baseTypeNode.expression);
                }
                write(" {");
                increaseIndent();
                scopeEmitStart(node);
                writeLine();
                emitConstructor(node, baseTypeNode);
                emitMemberFunctionsForES6AndHigher(node);
                decreaseIndent();
                writeLine();
                emitToken(15, node.members.end);
                scopeEmitEnd();
                if (thisNodeIsDecorated) {
                    write(";");
                }
                if (isClassExpressionWithStaticProperties) {
                    for (var _a = 0; _a < staticProperties.length; _a++) {
                        var property = staticProperties[_a];
                        write(",");
                        writeLine();
                        emitPropertyDeclaration(node, property, tempVariable, true);
                    }
                    write(",");
                    writeLine();
                    emit(tempVariable);
                    decreaseIndent();
                    write(")");
                }
                else {
                    writeLine();
                    emitPropertyDeclarations(node, staticProperties);
                    emitDecoratorsOfClass(node);
                }
                if (!isES6ExportedDeclaration(node) && (node.flags & 1)) {
                    writeLine();
                    emitStart(node);
                    emitModuleMemberName(node);
                    write(" = ");
                    emitDeclarationName(node);
                    emitEnd(node);
                    write(";");
                }
                else if (isES6ExportedDeclaration(node) && (node.flags & 256) && thisNodeIsDecorated) {
                    writeLine();
                    write("export default ");
                    emitDeclarationName(node);
                    write(";");
                }
            }
            function emitClassLikeDeclarationBelowES6(node) {
                if (node.kind === 202) {
                    if (!shouldHoistDeclarationInSystemJsModule(node)) {
                        write("var ");
                    }
                    emitDeclarationName(node);
                    write(" = ");
                }
                write("(function (");
                var baseTypeNode = ts.getClassExtendsHeritageClauseElement(node);
                if (baseTypeNode) {
                    write("_super");
                }
                write(") {");
                var saveTempFlags = tempFlags;
                var saveTempVariables = tempVariables;
                var saveTempParameters = tempParameters;
                var saveComputedPropertyNamesToGeneratedNames = computedPropertyNamesToGeneratedNames;
                tempFlags = 0;
                tempVariables = undefined;
                tempParameters = undefined;
                computedPropertyNamesToGeneratedNames = undefined;
                increaseIndent();
                scopeEmitStart(node);
                if (baseTypeNode) {
                    writeLine();
                    emitStart(baseTypeNode);
                    write("__extends(");
                    emitDeclarationName(node);
                    write(", _super);");
                    emitEnd(baseTypeNode);
                }
                writeLine();
                emitConstructor(node, baseTypeNode);
                emitMemberFunctionsForES5AndLower(node);
                emitPropertyDeclarations(node, getInitializedProperties(node, true));
                writeLine();
                emitDecoratorsOfClass(node);
                writeLine();
                emitToken(15, node.members.end, function () {
                    write("return ");
                    emitDeclarationName(node);
                });
                write(";");
                emitTempDeclarations(true);
                tempFlags = saveTempFlags;
                tempVariables = saveTempVariables;
                tempParameters = saveTempParameters;
                computedPropertyNamesToGeneratedNames = saveComputedPropertyNamesToGeneratedNames;
                decreaseIndent();
                writeLine();
                emitToken(15, node.members.end);
                scopeEmitEnd();
                emitStart(node);
                write(")(");
                if (baseTypeNode) {
                    emit(baseTypeNode.expression);
                }
                write(")");
                if (node.kind === 202) {
                    write(";");
                }
                emitEnd(node);
                if (node.kind === 202) {
                    emitExportMemberAssignment(node);
                }
                if (languageVersion < 2 && node.parent === currentSourceFile && node.name) {
                    emitExportMemberAssignments(node.name);
                }
            }
            function emitClassMemberPrefix(node, member) {
                emitDeclarationName(node);
                if (!(member.flags & 128)) {
                    write(".prototype");
                }
            }
            function emitDecoratorsOfClass(node) {
                emitDecoratorsOfMembers(node, 0);
                emitDecoratorsOfMembers(node, 128);
                emitDecoratorsOfConstructor(node);
            }
            function emitDecoratorsOfConstructor(node) {
                var decorators = node.decorators;
                var constructor = ts.getFirstConstructorWithBody(node);
                var hasDecoratedParameters = constructor && ts.forEach(constructor.parameters, ts.nodeIsDecorated);
                if (!decorators && !hasDecoratedParameters) {
                    return;
                }
                writeLine();
                emitStart(node);
                emitDeclarationName(node);
                write(" = __decorate([");
                increaseIndent();
                writeLine();
                var decoratorCount = decorators ? decorators.length : 0;
                var argumentsWritten = emitList(decorators, 0, decoratorCount, true, false, false, true, function (decorator) {
                    emitStart(decorator);
                    emit(decorator.expression);
                    emitEnd(decorator);
                });
                argumentsWritten += emitDecoratorsOfParameters(constructor, argumentsWritten > 0);
                emitSerializedTypeMetadata(node, argumentsWritten >= 0);
                decreaseIndent();
                writeLine();
                write("], ");
                emitDeclarationName(node);
                write(");");
                emitEnd(node);
                writeLine();
            }
            function emitDecoratorsOfMembers(node, staticFlag) {
                for (var _a = 0, _b = node.members; _a < _b.length; _a++) {
                    var member = _b[_a];
                    if ((member.flags & 128) !== staticFlag) {
                        continue;
                    }
                    if (!ts.nodeCanBeDecorated(member)) {
                        continue;
                    }
                    if (!ts.nodeOrChildIsDecorated(member)) {
                        continue;
                    }
                    var decorators = void 0;
                    var functionLikeMember = void 0;
                    if (ts.isAccessor(member)) {
                        var accessors = ts.getAllAccessorDeclarations(node.members, member);
                        if (member !== accessors.firstAccessor) {
                            continue;
                        }
                        decorators = accessors.firstAccessor.decorators;
                        if (!decorators && accessors.secondAccessor) {
                            decorators = accessors.secondAccessor.decorators;
                        }
                        functionLikeMember = accessors.setAccessor;
                    }
                    else {
                        decorators = member.decorators;
                        if (member.kind === 135) {
                            functionLikeMember = member;
                        }
                    }
                    writeLine();
                    emitStart(member);
                    if (member.kind !== 133) {
                        write("Object.defineProperty(");
                        emitStart(member.name);
                        emitClassMemberPrefix(node, member);
                        write(", ");
                        emitExpressionForPropertyName(member.name);
                        emitEnd(member.name);
                        write(",");
                        increaseIndent();
                        writeLine();
                    }
                    write("__decorate([");
                    increaseIndent();
                    writeLine();
                    var decoratorCount = decorators ? decorators.length : 0;
                    var argumentsWritten = emitList(decorators, 0, decoratorCount, true, false, false, true, function (decorator) {
                        emitStart(decorator);
                        emit(decorator.expression);
                        emitEnd(decorator);
                    });
                    argumentsWritten += emitDecoratorsOfParameters(functionLikeMember, argumentsWritten > 0);
                    emitSerializedTypeMetadata(member, argumentsWritten > 0);
                    decreaseIndent();
                    writeLine();
                    write("], ");
                    emitStart(member.name);
                    emitClassMemberPrefix(node, member);
                    write(", ");
                    emitExpressionForPropertyName(member.name);
                    emitEnd(member.name);
                    if (member.kind !== 133) {
                        write(", Object.getOwnPropertyDescriptor(");
                        emitStart(member.name);
                        emitClassMemberPrefix(node, member);
                        write(", ");
                        emitExpressionForPropertyName(member.name);
                        emitEnd(member.name);
                        write("))");
                        decreaseIndent();
                    }
                    write(");");
                    emitEnd(member);
                    writeLine();
                }
            }
            function emitDecoratorsOfParameters(node, leadingComma) {
                var argumentsWritten = 0;
                if (node) {
                    var parameterIndex = 0;
                    for (var _a = 0, _b = node.parameters; _a < _b.length; _a++) {
                        var parameter = _b[_a];
                        if (ts.nodeIsDecorated(parameter)) {
                            var decorators = parameter.decorators;
                            argumentsWritten += emitList(decorators, 0, decorators.length, true, false, leadingComma, true, function (decorator) {
                                emitStart(decorator);
                                write("__param(" + parameterIndex + ", ");
                                emit(decorator.expression);
                                write(")");
                                emitEnd(decorator);
                            });
                            leadingComma = true;
                        }
                        ++parameterIndex;
                    }
                }
                return argumentsWritten;
            }
            function shouldEmitTypeMetadata(node) {
                switch (node.kind) {
                    case 135:
                    case 137:
                    case 138:
                    case 133:
                        return true;
                }
                return false;
            }
            function shouldEmitReturnTypeMetadata(node) {
                switch (node.kind) {
                    case 135:
                        return true;
                }
                return false;
            }
            function shouldEmitParamTypesMetadata(node) {
                switch (node.kind) {
                    case 202:
                    case 135:
                    case 138:
                        return true;
                }
                return false;
            }
            function emitSerializedTypeMetadata(node, writeComma) {
                var argumentsWritten = 0;
                if (compilerOptions.emitDecoratorMetadata) {
                    if (shouldEmitTypeMetadata(node)) {
                        var serializedType = resolver.serializeTypeOfNode(node, getGeneratedNameForNode);
                        if (serializedType) {
                            if (writeComma) {
                                write(", ");
                            }
                            writeLine();
                            write("__metadata('design:type', ");
                            emitSerializedType(node, serializedType);
                            write(")");
                            argumentsWritten++;
                        }
                    }
                    if (shouldEmitParamTypesMetadata(node)) {
                        var serializedTypes = resolver.serializeParameterTypesOfNode(node, getGeneratedNameForNode);
                        if (serializedTypes) {
                            if (writeComma || argumentsWritten) {
                                write(", ");
                            }
                            writeLine();
                            write("__metadata('design:paramtypes', [");
                            for (var i = 0; i < serializedTypes.length; ++i) {
                                if (i > 0) {
                                    write(", ");
                                }
                                emitSerializedType(node, serializedTypes[i]);
                            }
                            write("])");
                            argumentsWritten++;
                        }
                    }
                    if (shouldEmitReturnTypeMetadata(node)) {
                        var serializedType = resolver.serializeReturnTypeOfNode(node, getGeneratedNameForNode);
                        if (serializedType) {
                            if (writeComma || argumentsWritten) {
                                write(", ");
                            }
                            writeLine();
                            write("__metadata('design:returntype', ");
                            emitSerializedType(node, serializedType);
                            write(")");
                            argumentsWritten++;
                        }
                    }
                }
                return argumentsWritten;
            }
            function serializeTypeNameSegment(location, path, index) {
                switch (index) {
                    case 0:
                        return "typeof " + path[index] + " !== 'undefined' && " + path[index];
                    case 1:
                        return serializeTypeNameSegment(location, path, index - 1) + "." + path[index];
                    default:
                        var temp = createAndRecordTempVariable(0).text;
                        return "(" + temp + " = " + serializeTypeNameSegment(location, path, index - 1) + ") && " + temp + "." + path[index];
                }
            }
            function emitSerializedType(location, name) {
                if (typeof name === "string") {
                    write(name);
                    return;
                }
                else {
                    ts.Debug.assert(name.length > 0, "Invalid serialized type name");
                    write("(" + serializeTypeNameSegment(location, name, name.length - 1) + ") || Object");
                }
            }
            function emitInterfaceDeclaration(node) {
                emitOnlyPinnedOrTripleSlashComments(node);
            }
            function shouldEmitEnumDeclaration(node) {
                var isConstEnum = ts.isConst(node);
                return !isConstEnum || compilerOptions.preserveConstEnums || compilerOptions.separateCompilation;
            }
            function emitEnumDeclaration(node) {
                if (!shouldEmitEnumDeclaration(node)) {
                    return;
                }
                if (!(node.flags & 1) || isES6ExportedDeclaration(node)) {
                    emitStart(node);
                    if (isES6ExportedDeclaration(node)) {
                        write("export ");
                    }
                    write("var ");
                    emit(node.name);
                    emitEnd(node);
                    write(";");
                }
                writeLine();
                emitStart(node);
                write("(function (");
                emitStart(node.name);
                write(getGeneratedNameForNode(node));
                emitEnd(node.name);
                write(") {");
                increaseIndent();
                scopeEmitStart(node);
                emitLines(node.members);
                decreaseIndent();
                writeLine();
                emitToken(15, node.members.end);
                scopeEmitEnd();
                write(")(");
                emitModuleMemberName(node);
                write(" || (");
                emitModuleMemberName(node);
                write(" = {}));");
                emitEnd(node);
                if (!isES6ExportedDeclaration(node) && node.flags & 1) {
                    writeLine();
                    emitStart(node);
                    write("var ");
                    emit(node.name);
                    write(" = ");
                    emitModuleMemberName(node);
                    emitEnd(node);
                    write(";");
                }
                if (languageVersion < 2 && node.parent === currentSourceFile) {
                    emitExportMemberAssignments(node.name);
                }
            }
            function emitEnumMember(node) {
                var enumParent = node.parent;
                emitStart(node);
                write(getGeneratedNameForNode(enumParent));
                write("[");
                write(getGeneratedNameForNode(enumParent));
                write("[");
                emitExpressionForPropertyName(node.name);
                write("] = ");
                writeEnumMemberDeclarationValue(node);
                write("] = ");
                emitExpressionForPropertyName(node.name);
                emitEnd(node);
                write(";");
            }
            function writeEnumMemberDeclarationValue(member) {
                var value = resolver.getConstantValue(member);
                if (value !== undefined) {
                    write(value.toString());
                    return;
                }
                else if (member.initializer) {
                    emit(member.initializer);
                }
                else {
                    write("undefined");
                }
            }
            function getInnerMostModuleDeclarationFromDottedModule(moduleDeclaration) {
                if (moduleDeclaration.body.kind === 206) {
                    var recursiveInnerModule = getInnerMostModuleDeclarationFromDottedModule(moduleDeclaration.body);
                    return recursiveInnerModule || moduleDeclaration.body;
                }
            }
            function shouldEmitModuleDeclaration(node) {
                return ts.isInstantiatedModule(node, compilerOptions.preserveConstEnums || compilerOptions.separateCompilation);
            }
            function isModuleMergedWithES6Class(node) {
                return languageVersion === 2 && !!(resolver.getNodeCheckFlags(node) & 2048);
            }
            function emitModuleDeclaration(node) {
                var shouldEmit = shouldEmitModuleDeclaration(node);
                if (!shouldEmit) {
                    return emitOnlyPinnedOrTripleSlashComments(node);
                }
                var hoistedInDeclarationScope = shouldHoistDeclarationInSystemJsModule(node);
                var emitVarForModule = !hoistedInDeclarationScope && !isModuleMergedWithES6Class(node);
                if (emitVarForModule) {
                    emitStart(node);
                    if (isES6ExportedDeclaration(node)) {
                        write("export ");
                    }
                    write("var ");
                    emit(node.name);
                    write(";");
                    emitEnd(node);
                    writeLine();
                }
                emitStart(node);
                write("(function (");
                emitStart(node.name);
                write(getGeneratedNameForNode(node));
                emitEnd(node.name);
                write(") ");
                if (node.body.kind === 207) {
                    var saveTempFlags = tempFlags;
                    var saveTempVariables = tempVariables;
                    tempFlags = 0;
                    tempVariables = undefined;
                    emit(node.body);
                    tempFlags = saveTempFlags;
                    tempVariables = saveTempVariables;
                }
                else {
                    write("{");
                    increaseIndent();
                    scopeEmitStart(node);
                    emitCaptureThisForNodeIfNecessary(node);
                    writeLine();
                    emit(node.body);
                    decreaseIndent();
                    writeLine();
                    var moduleBlock = getInnerMostModuleDeclarationFromDottedModule(node).body;
                    emitToken(15, moduleBlock.statements.end);
                    scopeEmitEnd();
                }
                write(")(");
                if ((node.flags & 1) && !isES6ExportedDeclaration(node)) {
                    emit(node.name);
                    write(" = ");
                }
                emitModuleMemberName(node);
                write(" || (");
                emitModuleMemberName(node);
                write(" = {}));");
                emitEnd(node);
                if (!isES6ExportedDeclaration(node) && node.name.kind === 65 && node.parent === currentSourceFile) {
                    if (compilerOptions.module === 4 && (node.flags & 1)) {
                        writeLine();
                        write(exportFunctionForFile + "(\"");
                        emitDeclarationName(node);
                        write("\", ");
                        emitDeclarationName(node);
                        write(")");
                    }
                    emitExportMemberAssignments(node.name);
                }
            }
            function emitRequire(moduleName) {
                if (moduleName.kind === 8) {
                    write("require(");
                    emitStart(moduleName);
                    emitLiteral(moduleName);
                    emitEnd(moduleName);
                    emitToken(17, moduleName.end);
                }
                else {
                    write("require()");
                }
            }
            function getNamespaceDeclarationNode(node) {
                if (node.kind === 209) {
                    return node;
                }
                var importClause = node.importClause;
                if (importClause && importClause.namedBindings && importClause.namedBindings.kind === 212) {
                    return importClause.namedBindings;
                }
            }
            function isDefaultImport(node) {
                return node.kind === 210 && node.importClause && !!node.importClause.name;
            }
            function emitExportImportAssignments(node) {
                if (ts.isAliasSymbolDeclaration(node) && resolver.isValueAliasDeclaration(node)) {
                    emitExportMemberAssignments(node.name);
                }
                ts.forEachChild(node, emitExportImportAssignments);
            }
            function emitImportDeclaration(node) {
                if (languageVersion < 2) {
                    return emitExternalImportDeclaration(node);
                }
                if (node.importClause) {
                    var shouldEmitDefaultBindings = resolver.isReferencedAliasDeclaration(node.importClause);
                    var shouldEmitNamedBindings = node.importClause.namedBindings && resolver.isReferencedAliasDeclaration(node.importClause.namedBindings, true);
                    if (shouldEmitDefaultBindings || shouldEmitNamedBindings) {
                        write("import ");
                        emitStart(node.importClause);
                        if (shouldEmitDefaultBindings) {
                            emit(node.importClause.name);
                            if (shouldEmitNamedBindings) {
                                write(", ");
                            }
                        }
                        if (shouldEmitNamedBindings) {
                            emitLeadingComments(node.importClause.namedBindings);
                            emitStart(node.importClause.namedBindings);
                            if (node.importClause.namedBindings.kind === 212) {
                                write("* as ");
                                emit(node.importClause.namedBindings.name);
                            }
                            else {
                                write("{ ");
                                emitExportOrImportSpecifierList(node.importClause.namedBindings.elements, resolver.isReferencedAliasDeclaration);
                                write(" }");
                            }
                            emitEnd(node.importClause.namedBindings);
                            emitTrailingComments(node.importClause.namedBindings);
                        }
                        emitEnd(node.importClause);
                        write(" from ");
                        emit(node.moduleSpecifier);
                        write(";");
                    }
                }
                else {
                    write("import ");
                    emit(node.moduleSpecifier);
                    write(";");
                }
            }
            function emitExternalImportDeclaration(node) {
                if (ts.contains(externalImports, node)) {
                    var isExportedImport = node.kind === 209 && (node.flags & 1) !== 0;
                    var namespaceDeclaration = getNamespaceDeclarationNode(node);
                    if (compilerOptions.module !== 2) {
                        emitLeadingComments(node);
                        emitStart(node);
                        if (namespaceDeclaration && !isDefaultImport(node)) {
                            if (!isExportedImport)
                                write("var ");
                            emitModuleMemberName(namespaceDeclaration);
                            write(" = ");
                        }
                        else {
                            var isNakedImport = 210 && !node.importClause;
                            if (!isNakedImport) {
                                write("var ");
                                write(getGeneratedNameForNode(node));
                                write(" = ");
                            }
                        }
                        emitRequire(ts.getExternalModuleName(node));
                        if (namespaceDeclaration && isDefaultImport(node)) {
                            write(", ");
                            emitModuleMemberName(namespaceDeclaration);
                            write(" = ");
                            write(getGeneratedNameForNode(node));
                        }
                        write(";");
                        emitEnd(node);
                        emitExportImportAssignments(node);
                        emitTrailingComments(node);
                    }
                    else {
                        if (isExportedImport) {
                            emitModuleMemberName(namespaceDeclaration);
                            write(" = ");
                            emit(namespaceDeclaration.name);
                            write(";");
                        }
                        else if (namespaceDeclaration && isDefaultImport(node)) {
                            write("var ");
                            emitModuleMemberName(namespaceDeclaration);
                            write(" = ");
                            write(getGeneratedNameForNode(node));
                            write(";");
                        }
                        emitExportImportAssignments(node);
                    }
                }
            }
            function emitImportEqualsDeclaration(node) {
                if (ts.isExternalModuleImportEqualsDeclaration(node)) {
                    emitExternalImportDeclaration(node);
                    return;
                }
                if (resolver.isReferencedAliasDeclaration(node) ||
                    (!ts.isExternalModule(currentSourceFile) && resolver.isTopLevelValueImportEqualsWithEntityName(node))) {
                    emitLeadingComments(node);
                    emitStart(node);
                    if (isES6ExportedDeclaration(node)) {
                        write("export ");
                        write("var ");
                    }
                    else if (!(node.flags & 1)) {
                        write("var ");
                    }
                    emitModuleMemberName(node);
                    write(" = ");
                    emit(node.moduleReference);
                    write(";");
                    emitEnd(node);
                    emitExportImportAssignments(node);
                    emitTrailingComments(node);
                }
            }
            function emitExportDeclaration(node) {
                ts.Debug.assert(compilerOptions.module !== 4);
                if (languageVersion < 2) {
                    if (node.moduleSpecifier && (!node.exportClause || resolver.isValueAliasDeclaration(node))) {
                        emitStart(node);
                        var generatedName = getGeneratedNameForNode(node);
                        if (node.exportClause) {
                            if (compilerOptions.module !== 2) {
                                write("var ");
                                write(generatedName);
                                write(" = ");
                                emitRequire(ts.getExternalModuleName(node));
                                write(";");
                            }
                            for (var _a = 0, _b = node.exportClause.elements; _a < _b.length; _a++) {
                                var specifier = _b[_a];
                                if (resolver.isValueAliasDeclaration(specifier)) {
                                    writeLine();
                                    emitStart(specifier);
                                    emitContainingModuleName(specifier);
                                    write(".");
                                    emitNodeWithoutSourceMap(specifier.name);
                                    write(" = ");
                                    write(generatedName);
                                    write(".");
                                    emitNodeWithoutSourceMap(specifier.propertyName || specifier.name);
                                    write(";");
                                    emitEnd(specifier);
                                }
                            }
                        }
                        else {
                            writeLine();
                            write("__export(");
                            if (compilerOptions.module !== 2) {
                                emitRequire(ts.getExternalModuleName(node));
                            }
                            else {
                                write(generatedName);
                            }
                            write(");");
                        }
                        emitEnd(node);
                    }
                }
                else {
                    if (!node.exportClause || resolver.isValueAliasDeclaration(node)) {
                        emitStart(node);
                        write("export ");
                        if (node.exportClause) {
                            write("{ ");
                            emitExportOrImportSpecifierList(node.exportClause.elements, resolver.isValueAliasDeclaration);
                            write(" }");
                        }
                        else {
                            write("*");
                        }
                        if (node.moduleSpecifier) {
                            write(" from ");
                            emitNodeWithoutSourceMap(node.moduleSpecifier);
                        }
                        write(";");
                        emitEnd(node);
                    }
                }
            }
            function emitExportOrImportSpecifierList(specifiers, shouldEmit) {
                ts.Debug.assert(languageVersion >= 2);
                var needsComma = false;
                for (var _a = 0; _a < specifiers.length; _a++) {
                    var specifier = specifiers[_a];
                    if (shouldEmit(specifier)) {
                        if (needsComma) {
                            write(", ");
                        }
                        emitStart(specifier);
                        if (specifier.propertyName) {
                            emitNodeWithoutSourceMap(specifier.propertyName);
                            write(" as ");
                        }
                        emitNodeWithoutSourceMap(specifier.name);
                        emitEnd(specifier);
                        needsComma = true;
                    }
                }
            }
            function emitExportAssignment(node) {
                if (!node.isExportEquals && resolver.isValueAliasDeclaration(node)) {
                    if (languageVersion >= 2) {
                        writeLine();
                        emitStart(node);
                        write("export default ");
                        var expression = node.expression;
                        emit(expression);
                        if (expression.kind !== 201 &&
                            expression.kind !== 202) {
                            write(";");
                        }
                        emitEnd(node);
                    }
                    else {
                        writeLine();
                        emitStart(node);
                        if (compilerOptions.module === 4) {
                            write(exportFunctionForFile + "(\"default\",");
                            emit(node.expression);
                            write(")");
                        }
                        else {
                            emitContainingModuleName(node);
                            if (languageVersion === 0) {
                                write("[\"default\"] = ");
                            }
                            else {
                                write(".default = ");
                            }
                            emit(node.expression);
                        }
                        write(";");
                        emitEnd(node);
                    }
                }
            }
            function collectExternalModuleInfo(sourceFile) {
                externalImports = [];
                exportSpecifiers = {};
                exportEquals = undefined;
                hasExportStars = false;
                for (var _a = 0, _b = sourceFile.statements; _a < _b.length; _a++) {
                    var node = _b[_a];
                    switch (node.kind) {
                        case 210:
                            if (!node.importClause ||
                                resolver.isReferencedAliasDeclaration(node.importClause, true)) {
                                externalImports.push(node);
                            }
                            break;
                        case 209:
                            if (node.moduleReference.kind === 220 && resolver.isReferencedAliasDeclaration(node)) {
                                externalImports.push(node);
                            }
                            break;
                        case 216:
                            if (node.moduleSpecifier) {
                                if (!node.exportClause) {
                                    externalImports.push(node);
                                    hasExportStars = true;
                                }
                                else if (resolver.isValueAliasDeclaration(node)) {
                                    externalImports.push(node);
                                }
                            }
                            else {
                                for (var _c = 0, _d = node.exportClause.elements; _c < _d.length; _c++) {
                                    var specifier = _d[_c];
                                    var name_6 = (specifier.propertyName || specifier.name).text;
                                    (exportSpecifiers[name_6] || (exportSpecifiers[name_6] = [])).push(specifier);
                                }
                            }
                            break;
                        case 215:
                            if (node.isExportEquals && !exportEquals) {
                                exportEquals = node;
                            }
                            break;
                    }
                }
            }
            function emitExportStarHelper() {
                if (hasExportStars) {
                    writeLine();
                    write("function __export(m) {");
                    increaseIndent();
                    writeLine();
                    write("for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];");
                    decreaseIndent();
                    writeLine();
                    write("}");
                }
            }
            function getLocalNameForExternalImport(importNode) {
                var namespaceDeclaration = getNamespaceDeclarationNode(importNode);
                if (namespaceDeclaration && !isDefaultImport(importNode)) {
                    return ts.getSourceTextOfNodeFromSourceFile(currentSourceFile, namespaceDeclaration.name);
                }
                else {
                    return getGeneratedNameForNode(importNode);
                }
            }
            function getExternalModuleNameText(importNode) {
                var moduleName = ts.getExternalModuleName(importNode);
                if (moduleName.kind === 8) {
                    return getLiteralText(moduleName);
                }
                return undefined;
            }
            function emitVariableDeclarationsForImports() {
                if (externalImports.length === 0) {
                    return;
                }
                writeLine();
                var started = false;
                for (var _a = 0; _a < externalImports.length; _a++) {
                    var importNode = externalImports[_a];
                    var skipNode = importNode.kind === 216 ||
                        (importNode.kind === 210 && !importNode.importClause);
                    if (skipNode) {
                        continue;
                    }
                    if (!started) {
                        write("var ");
                        started = true;
                    }
                    else {
                        write(", ");
                    }
                    write(getLocalNameForExternalImport(importNode));
                }
                if (started) {
                    write(";");
                }
            }
            function emitLocalStorageForExportedNamesIfNecessary(exportedDeclarations) {
                if (!hasExportStars) {
                    return undefined;
                }
                if (!exportedDeclarations && ts.isEmpty(exportSpecifiers)) {
                    var hasExportDeclarationWithExportClause = false;
                    for (var _a = 0; _a < externalImports.length; _a++) {
                        var externalImport = externalImports[_a];
                        if (externalImport.kind === 216 && externalImport.exportClause) {
                            hasExportDeclarationWithExportClause = true;
                            break;
                        }
                    }
                    if (!hasExportDeclarationWithExportClause) {
                        return emitExportStarFunction(undefined);
                    }
                }
                var exportedNamesStorageRef = makeUniqueName("exportedNames");
                writeLine();
                write("var " + exportedNamesStorageRef + " = {");
                increaseIndent();
                var started = false;
                if (exportedDeclarations) {
                    for (var i = 0; i < exportedDeclarations.length; ++i) {
                        writeExportedName(exportedDeclarations[i]);
                    }
                }
                if (exportSpecifiers) {
                    for (var n in exportSpecifiers) {
                        for (var _b = 0, _c = exportSpecifiers[n]; _b < _c.length; _b++) {
                            var specifier = _c[_b];
                            writeExportedName(specifier.name);
                        }
                    }
                }
                for (var _d = 0; _d < externalImports.length; _d++) {
                    var externalImport = externalImports[_d];
                    if (externalImport.kind !== 216) {
                        continue;
                    }
                    var exportDecl = externalImport;
                    if (!exportDecl.exportClause) {
                        continue;
                    }
                    for (var _e = 0, _f = exportDecl.exportClause.elements; _e < _f.length; _e++) {
                        var element = _f[_e];
                        writeExportedName(element.name || element.propertyName);
                    }
                }
                decreaseIndent();
                writeLine();
                write("};");
                return emitExportStarFunction(exportedNamesStorageRef);
                function emitExportStarFunction(localNames) {
                    var exportStarFunction = makeUniqueName("exportStar");
                    writeLine();
                    write("function " + exportStarFunction + "(m) {");
                    increaseIndent();
                    writeLine();
                    write("for(var n in m) {");
                    increaseIndent();
                    writeLine();
                    write("if (n !== \"default\"");
                    if (localNames) {
                        write("&& !" + localNames + ".hasOwnProperty(n)");
                    }
                    write(") " + exportFunctionForFile + "(n, m[n]);");
                    decreaseIndent();
                    writeLine();
                    write("}");
                    decreaseIndent();
                    writeLine();
                    write("}");
                    return exportStarFunction;
                }
                function writeExportedName(node) {
                    if (node.kind !== 65 && node.flags & 256) {
                        return;
                    }
                    if (started) {
                        write(",");
                    }
                    else {
                        started = true;
                    }
                    writeLine();
                    write("'");
                    if (node.kind === 65) {
                        emitNodeWithoutSourceMap(node);
                    }
                    else {
                        emitDeclarationName(node);
                    }
                    write("': true");
                }
            }
            function processTopLevelVariableAndFunctionDeclarations(node) {
                var hoistedVars;
                var hoistedFunctionDeclarations;
                var exportedDeclarations;
                visit(node);
                if (hoistedVars) {
                    writeLine();
                    write("var ");
                    for (var i = 0; i < hoistedVars.length; ++i) {
                        var local = hoistedVars[i];
                        if (i !== 0) {
                            write(", ");
                        }
                        if (local.kind === 202 || local.kind === 206) {
                            emitDeclarationName(local);
                        }
                        else {
                            emit(local);
                        }
                        var flags = ts.getCombinedNodeFlags(local.kind === 65 ? local.parent : local);
                        if (flags & 1) {
                            if (!exportedDeclarations) {
                                exportedDeclarations = [];
                            }
                            exportedDeclarations.push(local);
                        }
                    }
                    write(";");
                }
                if (hoistedFunctionDeclarations) {
                    for (var _a = 0; _a < hoistedFunctionDeclarations.length; _a++) {
                        var f = hoistedFunctionDeclarations[_a];
                        writeLine();
                        emit(f);
                        if (f.flags & 1) {
                            if (!exportedDeclarations) {
                                exportedDeclarations = [];
                            }
                            exportedDeclarations.push(f);
                        }
                    }
                }
                return exportedDeclarations;
                function visit(node) {
                    if (node.kind === 201) {
                        if (!hoistedFunctionDeclarations) {
                            hoistedFunctionDeclarations = [];
                        }
                        hoistedFunctionDeclarations.push(node);
                        return;
                    }
                    if (node.kind === 202) {
                        if (!hoistedVars) {
                            hoistedVars = [];
                        }
                        hoistedVars.push(node);
                        return;
                    }
                    if (node.kind === 206 && shouldEmitModuleDeclaration(node)) {
                        if (!hoistedVars) {
                            hoistedVars = [];
                        }
                        hoistedVars.push(node);
                        return;
                    }
                    if (node.kind === 199 || node.kind === 153) {
                        if (shouldHoistVariable(node, false)) {
                            var name_7 = node.name;
                            if (name_7.kind === 65) {
                                if (!hoistedVars) {
                                    hoistedVars = [];
                                }
                                hoistedVars.push(name_7);
                            }
                            else {
                                ts.forEachChild(name_7, visit);
                            }
                        }
                        return;
                    }
                    if (ts.isBindingPattern(node)) {
                        ts.forEach(node.elements, visit);
                        return;
                    }
                    if (!ts.isDeclaration(node)) {
                        ts.forEachChild(node, visit);
                    }
                }
            }
            function shouldHoistVariable(node, checkIfSourceFileLevelDecl) {
                if (checkIfSourceFileLevelDecl && !shouldHoistDeclarationInSystemJsModule(node)) {
                    return false;
                }
                return (ts.getCombinedNodeFlags(node) & 12288) === 0 ||
                    ts.getEnclosingBlockScopeContainer(node).kind === 228;
            }
            function isCurrentFileSystemExternalModule() {
                return compilerOptions.module === 4 && ts.isExternalModule(currentSourceFile);
            }
            function emitSystemModuleBody(node, startIndex) {
                emitVariableDeclarationsForImports();
                writeLine();
                var exportedDeclarations = processTopLevelVariableAndFunctionDeclarations(node);
                var exportStarFunction = emitLocalStorageForExportedNamesIfNecessary(exportedDeclarations);
                writeLine();
                write("return {");
                increaseIndent();
                writeLine();
                emitSetters(exportStarFunction);
                writeLine();
                emitExecute(node, startIndex);
                emitTempDeclarations(true);
                decreaseIndent();
                writeLine();
                write("}");
            }
            function emitSetters(exportStarFunction) {
                write("setters:[");
                for (var i = 0; i < externalImports.length; ++i) {
                    if (i !== 0) {
                        write(",");
                    }
                    writeLine();
                    increaseIndent();
                    var importNode = externalImports[i];
                    var importVariableName = getLocalNameForExternalImport(importNode) || "";
                    var parameterName = "_" + importVariableName;
                    write("function (" + parameterName + ") {");
                    switch (importNode.kind) {
                        case 210:
                            if (!importNode.importClause) {
                                break;
                            }
                        case 209:
                            ts.Debug.assert(importVariableName !== "");
                            increaseIndent();
                            writeLine();
                            write(importVariableName + " = " + parameterName + ";");
                            writeLine();
                            var defaultName = importNode.kind === 210
                                ? importNode.importClause.name
                                : importNode.name;
                            if (defaultName) {
                                emitExportMemberAssignments(defaultName);
                                writeLine();
                            }
                            if (importNode.kind === 210 &&
                                importNode.importClause.namedBindings) {
                                var namedBindings = importNode.importClause.namedBindings;
                                if (namedBindings.kind === 212) {
                                    emitExportMemberAssignments(namedBindings.name);
                                    writeLine();
                                }
                                else {
                                    for (var _a = 0, _b = namedBindings.elements; _a < _b.length; _a++) {
                                        var element = _b[_a];
                                        emitExportMemberAssignments(element.name || element.propertyName);
                                        writeLine();
                                    }
                                }
                            }
                            decreaseIndent();
                            break;
                        case 216:
                            ts.Debug.assert(importVariableName !== "");
                            increaseIndent();
                            if (importNode.exportClause) {
                                for (var _c = 0, _d = importNode.exportClause.elements; _c < _d.length; _c++) {
                                    var e = _d[_c];
                                    writeLine();
                                    write(exportFunctionForFile + "(\"");
                                    emitNodeWithoutSourceMap(e.name);
                                    write("\", " + parameterName + "[\"");
                                    emitNodeWithoutSourceMap(e.propertyName || e.name);
                                    write("\"]);");
                                }
                            }
                            else {
                                writeLine();
                                write(exportStarFunction + "(" + parameterName + ");");
                            }
                            writeLine();
                            decreaseIndent();
                            break;
                    }
                    write("}");
                    decreaseIndent();
                }
                write("],");
            }
            function emitExecute(node, startIndex) {
                write("execute: function() {");
                increaseIndent();
                writeLine();
                for (var i = startIndex; i < node.statements.length; ++i) {
                    var statement = node.statements[i];
                    switch (statement.kind) {
                        case 216:
                        case 210:
                        case 209:
                        case 201:
                            continue;
                    }
                    writeLine();
                    emit(statement);
                }
                decreaseIndent();
                writeLine();
                write("}");
            }
            function emitSystemModule(node, startIndex) {
                collectExternalModuleInfo(node);
                ts.Debug.assert(!exportFunctionForFile);
                exportFunctionForFile = makeUniqueName("exports");
                write("System.register([");
                for (var i = 0; i < externalImports.length; ++i) {
                    var text = getExternalModuleNameText(externalImports[i]);
                    if (i !== 0) {
                        write(", ");
                    }
                    write(text);
                }
                write("], function(" + exportFunctionForFile + ") {");
                writeLine();
                increaseIndent();
                emitCaptureThisForNodeIfNecessary(node);
                emitSystemModuleBody(node, startIndex);
                decreaseIndent();
                writeLine();
                write("});");
            }
            function emitAMDDependencies(node, includeNonAmdDependencies) {
                // An AMD define function has the following shape:
                //     define(id?, dependencies?, factory);
                //
                // This has the shape of
                //     define(name, ["module1", "module2"], function (module1Alias) {
                // The location of the alias in the parameter list in the factory function needs to
                // match the position of the module name in the dependency list.
                //
                // To ensure this is true in cases of modules with no aliases, e.g.:
                // `import "module"` or `<amd-dependency path= "a.css" />`
                // we need to add modules without alias names to the end of the dependencies list
                var aliasedModuleNames = [];
                var unaliasedModuleNames = [];
                var importAliasNames = [];
                for (var _a = 0, _b = node.amdDependencies; _a < _b.length; _a++) {
                    var amdDependency = _b[_a];
                    if (amdDependency.name) {
                        aliasedModuleNames.push("\"" + amdDependency.path + "\"");
                        importAliasNames.push(amdDependency.name);
                    }
                    else {
                        unaliasedModuleNames.push("\"" + amdDependency.path + "\"");
                    }
                }
                for (var _c = 0; _c < externalImports.length; _c++) {
                    var importNode = externalImports[_c];
                    var externalModuleName = getExternalModuleNameText(importNode);
                    var importAliasName = getLocalNameForExternalImport(importNode);
                    if (includeNonAmdDependencies && importAliasName) {
                        aliasedModuleNames.push(externalModuleName);
                        importAliasNames.push(importAliasName);
                    }
                    else {
                        unaliasedModuleNames.push(externalModuleName);
                    }
                }
                write("[\"require\", \"exports\"");
                if (aliasedModuleNames.length) {
                    write(", ");
                    write(aliasedModuleNames.join(", "));
                }
                if (unaliasedModuleNames.length) {
                    write(", ");
                    write(unaliasedModuleNames.join(", "));
                }
                write("], function (require, exports");
                if (importAliasNames.length) {
                    write(", ");
                    write(importAliasNames.join(", "));
                }
            }
            function emitAMDModule(node, startIndex) {
                collectExternalModuleInfo(node);
                writeLine();
                write("define(");
                if (node.amdModuleName) {
                    write("\"" + node.amdModuleName + "\", ");
                }
                emitAMDDependencies(node, true);
                write(") {");
                increaseIndent();
                emitExportStarHelper();
                emitCaptureThisForNodeIfNecessary(node);
                emitLinesStartingAt(node.statements, startIndex);
                emitTempDeclarations(true);
                emitExportEquals(true);
                decreaseIndent();
                writeLine();
                write("});");
            }
            function emitCommonJSModule(node, startIndex) {
                collectExternalModuleInfo(node);
                emitExportStarHelper();
                emitCaptureThisForNodeIfNecessary(node);
                emitLinesStartingAt(node.statements, startIndex);
                emitTempDeclarations(true);
                emitExportEquals(false);
            }
            function emitUMDModule(node, startIndex) {
                collectExternalModuleInfo(node);
                writeLines("(function (deps, factory) {\n    if (typeof module === 'object' && typeof module.exports === 'object') {\n        var v = factory(require, exports); if (v !== undefined) module.exports = v;\n    }\n    else if (typeof define === 'function' && define.amd) {\n        define(deps, factory);\n    }\n})(");
                emitAMDDependencies(node, false);
                write(") {");
                increaseIndent();
                emitExportStarHelper();
                emitCaptureThisForNodeIfNecessary(node);
                emitLinesStartingAt(node.statements, startIndex);
                emitTempDeclarations(true);
                emitExportEquals(true);
                decreaseIndent();
                writeLine();
                write("});");
            }
            function emitES6Module(node, startIndex) {
                externalImports = undefined;
                exportSpecifiers = undefined;
                exportEquals = undefined;
                hasExportStars = false;
                emitCaptureThisForNodeIfNecessary(node);
                emitLinesStartingAt(node.statements, startIndex);
                emitTempDeclarations(true);
            }
            function emitExportEquals(emitAsReturn) {
                if (exportEquals && resolver.isValueAliasDeclaration(exportEquals)) {
                    writeLine();
                    emitStart(exportEquals);
                    write(emitAsReturn ? "return " : "module.exports = ");
                    emit(exportEquals.expression);
                    write(";");
                    emitEnd(exportEquals);
                }
            }
            function emitDirectivePrologues(statements, startWithNewLine) {
                for (var i = 0; i < statements.length; ++i) {
                    if (ts.isPrologueDirective(statements[i])) {
                        if (startWithNewLine || i > 0) {
                            writeLine();
                        }
                        emit(statements[i]);
                    }
                    else {
                        return i;
                    }
                }
                return statements.length;
            }
            function writeLines(text) {
                var lines = text.split(/\r\n|\r|\n/g);
                for (var i = 0; i < lines.length; ++i) {
                    var line = lines[i];
                    if (line.length) {
                        writeLine();
                        write(line);
                    }
                }
            }
            function emitSourceFileNode(node) {
                writeLine();
                emitDetachedComments(node);
                var startIndex = emitDirectivePrologues(node.statements, false);
                if (!compilerOptions.noEmitHelpers) {
                    if ((languageVersion < 2) && (!extendsEmitted && resolver.getNodeCheckFlags(node) & 8)) {
                        writeLines(extendsHelper);
                        extendsEmitted = true;
                    }
                    if (!decorateEmitted && resolver.getNodeCheckFlags(node) & 512) {
                        writeLines(decorateHelper);
                        if (compilerOptions.emitDecoratorMetadata) {
                            writeLines(metadataHelper);
                        }
                        decorateEmitted = true;
                    }
                    if (!paramEmitted && resolver.getNodeCheckFlags(node) & 1024) {
                        writeLines(paramHelper);
                        paramEmitted = true;
                    }
                }
                if (ts.isExternalModule(node) || compilerOptions.separateCompilation) {
                    if (languageVersion >= 2) {
                        emitES6Module(node, startIndex);
                    }
                    else if (compilerOptions.module === 2) {
                        emitAMDModule(node, startIndex);
                    }
                    else if (compilerOptions.module === 4) {
                        emitSystemModule(node, startIndex);
                    }
                    else if (compilerOptions.module === 3) {
                        emitUMDModule(node, startIndex);
                    }
                    else {
                        emitCommonJSModule(node, startIndex);
                    }
                }
                else {
                    externalImports = undefined;
                    exportSpecifiers = undefined;
                    exportEquals = undefined;
                    hasExportStars = false;
                    emitCaptureThisForNodeIfNecessary(node);
                    emitLinesStartingAt(node.statements, startIndex);
                    emitTempDeclarations(true);
                }
                emitLeadingComments(node.endOfFileToken);
            }
            function emitNodeWithoutSourceMap(node, allowGeneratedIdentifiers) {
                if (!node) {
                    return;
                }
                if (node.flags & 2) {
                    return emitOnlyPinnedOrTripleSlashComments(node);
                }
                var emitComments = shouldEmitLeadingAndTrailingComments(node);
                if (emitComments) {
                    emitLeadingComments(node);
                }
                emitJavaScriptWorker(node, allowGeneratedIdentifiers);
                if (emitComments) {
                    emitTrailingComments(node);
                }
            }
            function shouldEmitLeadingAndTrailingComments(node) {
                switch (node.kind) {
                    case 203:
                    case 201:
                    case 210:
                    case 209:
                    case 204:
                    case 215:
                        return false;
                    case 206:
                        return shouldEmitModuleDeclaration(node);
                    case 205:
                        return shouldEmitEnumDeclaration(node);
                }
                if (node.kind !== 180 &&
                    node.parent &&
                    node.parent.kind === 164 &&
                    node.parent.body === node &&
                    compilerOptions.target <= 1) {
                    return false;
                }
                return true;
            }
            function emitJavaScriptWorker(node, allowGeneratedIdentifiers) {
                if (allowGeneratedIdentifiers === void 0) { allowGeneratedIdentifiers = true; }
                switch (node.kind) {
                    case 65:
                        return emitIdentifier(node, allowGeneratedIdentifiers);
                    case 130:
                        return emitParameter(node);
                    case 135:
                    case 134:
                        return emitMethod(node);
                    case 137:
                    case 138:
                        return emitAccessor(node);
                    case 93:
                        return emitThis(node);
                    case 91:
                        return emitSuper(node);
                    case 89:
                        return write("null");
                    case 95:
                        return write("true");
                    case 80:
                        return write("false");
                    case 7:
                    case 8:
                    case 9:
                    case 10:
                    case 11:
                    case 12:
                    case 13:
                        return emitLiteral(node);
                    case 172:
                        return emitTemplateExpression(node);
                    case 178:
                        return emitTemplateSpan(node);
                    case 127:
                        return emitQualifiedName(node);
                    case 151:
                        return emitObjectBindingPattern(node);
                    case 152:
                        return emitArrayBindingPattern(node);
                    case 153:
                        return emitBindingElement(node);
                    case 154:
                        return emitArrayLiteral(node);
                    case 155:
                        return emitObjectLiteral(node);
                    case 225:
                        return emitPropertyAssignment(node);
                    case 226:
                        return emitShorthandPropertyAssignment(node);
                    case 128:
                        return emitComputedPropertyName(node);
                    case 156:
                        return emitPropertyAccess(node);
                    case 157:
                        return emitIndexedAccess(node);
                    case 158:
                        return emitCallExpression(node);
                    case 159:
                        return emitNewExpression(node);
                    case 160:
                        return emitTaggedTemplateExpression(node);
                    case 161:
                        return emit(node.expression);
                    case 162:
                        return emitParenExpression(node);
                    case 201:
                    case 163:
                    case 164:
                        return emitFunctionDeclaration(node);
                    case 165:
                        return emitDeleteExpression(node);
                    case 166:
                        return emitTypeOfExpression(node);
                    case 167:
                        return emitVoidExpression(node);
                    case 168:
                        return emitPrefixUnaryExpression(node);
                    case 169:
                        return emitPostfixUnaryExpression(node);
                    case 170:
                        return emitBinaryExpression(node);
                    case 171:
                        return emitConditionalExpression(node);
                    case 174:
                        return emitSpreadElementExpression(node);
                    case 173:
                        return emitYieldExpression(node);
                    case 176:
                        return;
                    case 180:
                    case 207:
                        return emitBlock(node);
                    case 181:
                        return emitVariableStatement(node);
                    case 182:
                        return write(";");
                    case 183:
                        return emitExpressionStatement(node);
                    case 184:
                        return emitIfStatement(node);
                    case 185:
                        return emitDoStatement(node);
                    case 186:
                        return emitWhileStatement(node);
                    case 187:
                        return emitForStatement(node);
                    case 189:
                    case 188:
                        return emitForInOrForOfStatement(node);
                    case 190:
                    case 191:
                        return emitBreakOrContinueStatement(node);
                    case 192:
                        return emitReturnStatement(node);
                    case 193:
                        return emitWithStatement(node);
                    case 194:
                        return emitSwitchStatement(node);
                    case 221:
                    case 222:
                        return emitCaseOrDefaultClause(node);
                    case 195:
                        return emitLabelledStatement(node);
                    case 196:
                        return emitThrowStatement(node);
                    case 197:
                        return emitTryStatement(node);
                    case 224:
                        return emitCatchClause(node);
                    case 198:
                        return emitDebuggerStatement(node);
                    case 199:
                        return emitVariableDeclaration(node);
                    case 175:
                        return emitClassExpression(node);
                    case 202:
                        return emitClassDeclaration(node);
                    case 203:
                        return emitInterfaceDeclaration(node);
                    case 205:
                        return emitEnumDeclaration(node);
                    case 227:
                        return emitEnumMember(node);
                    case 206:
                        return emitModuleDeclaration(node);
                    case 210:
                        return emitImportDeclaration(node);
                    case 209:
                        return emitImportEqualsDeclaration(node);
                    case 216:
                        return emitExportDeclaration(node);
                    case 215:
                        return emitExportAssignment(node);
                    case 228:
                        return emitSourceFileNode(node);
                }
            }
            function hasDetachedComments(pos) {
                return detachedCommentsInfo !== undefined && ts.lastOrUndefined(detachedCommentsInfo).nodePos === pos;
            }
            function getLeadingCommentsWithoutDetachedComments() {
                var leadingComments = ts.getLeadingCommentRanges(currentSourceFile.text, ts.lastOrUndefined(detachedCommentsInfo).detachedCommentEndPos);
                if (detachedCommentsInfo.length - 1) {
                    detachedCommentsInfo.pop();
                }
                else {
                    detachedCommentsInfo = undefined;
                }
                return leadingComments;
            }
            function filterComments(ranges, onlyPinnedOrTripleSlashComments) {
                if (ranges && onlyPinnedOrTripleSlashComments) {
                    ranges = ts.filter(ranges, isPinnedOrTripleSlashComment);
                    if (ranges.length === 0) {
                        return undefined;
                    }
                }
                return ranges;
            }
            function getLeadingCommentsToEmit(node) {
                if (node.parent) {
                    if (node.parent.kind === 228 || node.pos !== node.parent.pos) {
                        if (hasDetachedComments(node.pos)) {
                            return getLeadingCommentsWithoutDetachedComments();
                        }
                        else {
                            return ts.getLeadingCommentRangesOfNode(node, currentSourceFile);
                        }
                    }
                }
            }
            function getTrailingCommentsToEmit(node) {
                if (node.parent) {
                    if (node.parent.kind === 228 || node.end !== node.parent.end) {
                        return ts.getTrailingCommentRanges(currentSourceFile.text, node.end);
                    }
                }
            }
            function emitOnlyPinnedOrTripleSlashComments(node) {
                emitLeadingCommentsWorker(node, true);
            }
            function emitLeadingComments(node) {
                return emitLeadingCommentsWorker(node, compilerOptions.removeComments);
            }
            function emitLeadingCommentsWorker(node, onlyPinnedOrTripleSlashComments) {
                var leadingComments = filterComments(getLeadingCommentsToEmit(node), onlyPinnedOrTripleSlashComments);
                ts.emitNewLineBeforeLeadingComments(currentSourceFile, writer, node, leadingComments);
                ts.emitComments(currentSourceFile, writer, leadingComments, true, newLine, writeComment);
            }
            function emitTrailingComments(node) {
                var trailingComments = filterComments(getTrailingCommentsToEmit(node), compilerOptions.removeComments);
                ts.emitComments(currentSourceFile, writer, trailingComments, false, newLine, writeComment);
            }
            function emitLeadingCommentsOfPosition(pos) {
                var leadingComments;
                if (hasDetachedComments(pos)) {
                    leadingComments = getLeadingCommentsWithoutDetachedComments();
                }
                else {
                    leadingComments = ts.getLeadingCommentRanges(currentSourceFile.text, pos);
                }
                leadingComments = filterComments(leadingComments, compilerOptions.removeComments);
                ts.emitNewLineBeforeLeadingComments(currentSourceFile, writer, { pos: pos, end: pos }, leadingComments);
                ts.emitComments(currentSourceFile, writer, leadingComments, true, newLine, writeComment);
            }
            function emitDetachedComments(node) {
                var leadingComments = ts.getLeadingCommentRanges(currentSourceFile.text, node.pos);
                if (leadingComments) {
                    var detachedComments = [];
                    var lastComment;
                    ts.forEach(leadingComments, function (comment) {
                        if (lastComment) {
                            var lastCommentLine = ts.getLineOfLocalPosition(currentSourceFile, lastComment.end);
                            var commentLine = ts.getLineOfLocalPosition(currentSourceFile, comment.pos);
                            if (commentLine >= lastCommentLine + 2) {
                                return detachedComments;
                            }
                        }
                        detachedComments.push(comment);
                        lastComment = comment;
                    });
                    if (detachedComments.length) {
                        var lastCommentLine = ts.getLineOfLocalPosition(currentSourceFile, ts.lastOrUndefined(detachedComments).end);
                        var nodeLine = ts.getLineOfLocalPosition(currentSourceFile, ts.skipTrivia(currentSourceFile.text, node.pos));
                        if (nodeLine >= lastCommentLine + 2) {
                            ts.emitNewLineBeforeLeadingComments(currentSourceFile, writer, node, leadingComments);
                            ts.emitComments(currentSourceFile, writer, detachedComments, true, newLine, writeComment);
                            var currentDetachedCommentInfo = { nodePos: node.pos, detachedCommentEndPos: ts.lastOrUndefined(detachedComments).end };
                            if (detachedCommentsInfo) {
                                detachedCommentsInfo.push(currentDetachedCommentInfo);
                            }
                            else {
                                detachedCommentsInfo = [currentDetachedCommentInfo];
                            }
                        }
                    }
                }
            }
            function isPinnedOrTripleSlashComment(comment) {
                if (currentSourceFile.text.charCodeAt(comment.pos + 1) === 42) {
                    return currentSourceFile.text.charCodeAt(comment.pos + 2) === 33;
                }
                else if (currentSourceFile.text.charCodeAt(comment.pos + 1) === 47 &&
                    comment.pos + 2 < comment.end &&
                    currentSourceFile.text.charCodeAt(comment.pos + 2) === 47 &&
                    currentSourceFile.text.substring(comment.pos, comment.end).match(ts.fullTripleSlashReferencePathRegEx)) {
                    return true;
                }
            }
        }
        function emitFile(jsFilePath, sourceFile) {
            emitJavaScript(jsFilePath, sourceFile);
            if (compilerOptions.declaration) {
                ts.writeDeclarationFile(jsFilePath, sourceFile, host, resolver, diagnostics);
            }
        }
    }
    ts.emitFiles = emitFiles;
})(ts || (ts = {}));
