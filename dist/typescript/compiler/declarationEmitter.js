/// <reference path="checker.ts"/>
var ts;
(function (ts) {
    function getDeclarationDiagnostics(host, resolver, targetSourceFile) {
        var diagnostics = [];
        var jsFilePath = ts.getOwnEmitOutputFilePath(targetSourceFile, host, ".js");
        emitDeclarations(host, resolver, diagnostics, jsFilePath, targetSourceFile);
        return diagnostics;
    }
    ts.getDeclarationDiagnostics = getDeclarationDiagnostics;
    function emitDeclarations(host, resolver, diagnostics, jsFilePath, root) {
        var newLine = host.getNewLine();
        var compilerOptions = host.getCompilerOptions();
        var languageVersion = compilerOptions.target || 0;
        var write;
        var writeLine;
        var increaseIndent;
        var decreaseIndent;
        var writeTextOfNode;
        var writer = createAndSetNewTextWriterWithSymbolWriter();
        var enclosingDeclaration;
        var currentSourceFile;
        var reportedDeclarationError = false;
        var emitJsDocComments = compilerOptions.removeComments ? function (declaration) { } : writeJsDocComments;
        var emit = compilerOptions.stripInternal ? stripInternal : emitNode;
        var moduleElementDeclarationEmitInfo = [];
        var asynchronousSubModuleDeclarationEmitInfo;
        var referencePathsOutput = "";
        if (root) {
            if (!compilerOptions.noResolve) {
                var addedGlobalFileReference = false;
                ts.forEach(root.referencedFiles, function (fileReference) {
                    var referencedFile = ts.tryResolveScriptReference(host, root, fileReference);
                    if (referencedFile && ((referencedFile.flags & 2048) ||
                        ts.shouldEmitToOwnFile(referencedFile, compilerOptions) ||
                        !addedGlobalFileReference)) {
                        writeReferencePath(referencedFile);
                        if (!ts.isExternalModuleOrDeclarationFile(referencedFile)) {
                            addedGlobalFileReference = true;
                        }
                    }
                });
            }
            emitSourceFile(root);
            if (moduleElementDeclarationEmitInfo.length) {
                var oldWriter = writer;
                ts.forEach(moduleElementDeclarationEmitInfo, function (aliasEmitInfo) {
                    if (aliasEmitInfo.isVisible) {
                        ts.Debug.assert(aliasEmitInfo.node.kind === 209);
                        createAndSetNewTextWriterWithSymbolWriter();
                        ts.Debug.assert(aliasEmitInfo.indent === 0);
                        writeImportDeclaration(aliasEmitInfo.node);
                        aliasEmitInfo.asynchronousOutput = writer.getText();
                    }
                });
                setWriter(oldWriter);
            }
        }
        else {
            var emittedReferencedFiles = [];
            ts.forEach(host.getSourceFiles(), function (sourceFile) {
                if (!ts.isExternalModuleOrDeclarationFile(sourceFile)) {
                    if (!compilerOptions.noResolve) {
                        ts.forEach(sourceFile.referencedFiles, function (fileReference) {
                            var referencedFile = ts.tryResolveScriptReference(host, sourceFile, fileReference);
                            if (referencedFile && (ts.isExternalModuleOrDeclarationFile(referencedFile) &&
                                !ts.contains(emittedReferencedFiles, referencedFile))) {
                                writeReferencePath(referencedFile);
                                emittedReferencedFiles.push(referencedFile);
                            }
                        });
                    }
                    emitSourceFile(sourceFile);
                }
            });
        }
        return {
            reportedDeclarationError: reportedDeclarationError,
            moduleElementDeclarationEmitInfo: moduleElementDeclarationEmitInfo,
            synchronousDeclarationOutput: writer.getText(),
            referencePathsOutput: referencePathsOutput,
        };
        function hasInternalAnnotation(range) {
            var text = currentSourceFile.text;
            var comment = text.substring(range.pos, range.end);
            return comment.indexOf("@internal") >= 0;
        }
        function stripInternal(node) {
            if (node) {
                var leadingCommentRanges = ts.getLeadingCommentRanges(currentSourceFile.text, node.pos);
                if (ts.forEach(leadingCommentRanges, hasInternalAnnotation)) {
                    return;
                }
                emitNode(node);
            }
        }
        function createAndSetNewTextWriterWithSymbolWriter() {
            var writer = ts.createTextWriter(newLine);
            writer.trackSymbol = trackSymbol;
            writer.writeKeyword = writer.write;
            writer.writeOperator = writer.write;
            writer.writePunctuation = writer.write;
            writer.writeSpace = writer.write;
            writer.writeStringLiteral = writer.writeLiteral;
            writer.writeParameter = writer.write;
            writer.writeSymbol = writer.write;
            setWriter(writer);
            return writer;
        }
        function setWriter(newWriter) {
            writer = newWriter;
            write = newWriter.write;
            writeTextOfNode = newWriter.writeTextOfNode;
            writeLine = newWriter.writeLine;
            increaseIndent = newWriter.increaseIndent;
            decreaseIndent = newWriter.decreaseIndent;
        }
        function writeAsynchronousModuleElements(nodes) {
            var oldWriter = writer;
            ts.forEach(nodes, function (declaration) {
                var nodeToCheck;
                if (declaration.kind === 198) {
                    nodeToCheck = declaration.parent.parent;
                }
                else if (declaration.kind === 212 || declaration.kind === 213 || declaration.kind === 210) {
                    ts.Debug.fail("We should be getting ImportDeclaration instead to write");
                }
                else {
                    nodeToCheck = declaration;
                }
                var moduleElementEmitInfo = ts.forEach(moduleElementDeclarationEmitInfo, function (declEmitInfo) { return declEmitInfo.node === nodeToCheck ? declEmitInfo : undefined; });
                if (!moduleElementEmitInfo && asynchronousSubModuleDeclarationEmitInfo) {
                    moduleElementEmitInfo = ts.forEach(asynchronousSubModuleDeclarationEmitInfo, function (declEmitInfo) { return declEmitInfo.node === nodeToCheck ? declEmitInfo : undefined; });
                }
                if (moduleElementEmitInfo) {
                    if (moduleElementEmitInfo.node.kind === 209) {
                        moduleElementEmitInfo.isVisible = true;
                    }
                    else {
                        createAndSetNewTextWriterWithSymbolWriter();
                        for (var declarationIndent = moduleElementEmitInfo.indent; declarationIndent; declarationIndent--) {
                            increaseIndent();
                        }
                        if (nodeToCheck.kind === 205) {
                            ts.Debug.assert(asynchronousSubModuleDeclarationEmitInfo === undefined);
                            asynchronousSubModuleDeclarationEmitInfo = [];
                        }
                        writeModuleElement(nodeToCheck);
                        if (nodeToCheck.kind === 205) {
                            moduleElementEmitInfo.subModuleElementDeclarationEmitInfo = asynchronousSubModuleDeclarationEmitInfo;
                            asynchronousSubModuleDeclarationEmitInfo = undefined;
                        }
                        moduleElementEmitInfo.asynchronousOutput = writer.getText();
                    }
                }
            });
            setWriter(oldWriter);
        }
        function handleSymbolAccessibilityError(symbolAccesibilityResult) {
            if (symbolAccesibilityResult.accessibility === 0) {
                if (symbolAccesibilityResult && symbolAccesibilityResult.aliasesToMakeVisible) {
                    writeAsynchronousModuleElements(symbolAccesibilityResult.aliasesToMakeVisible);
                }
            }
            else {
                reportedDeclarationError = true;
                var errorInfo = writer.getSymbolAccessibilityDiagnostic(symbolAccesibilityResult);
                if (errorInfo) {
                    if (errorInfo.typeName) {
                        diagnostics.push(ts.createDiagnosticForNode(symbolAccesibilityResult.errorNode || errorInfo.errorNode, errorInfo.diagnosticMessage, ts.getSourceTextOfNodeFromSourceFile(currentSourceFile, errorInfo.typeName), symbolAccesibilityResult.errorSymbolName, symbolAccesibilityResult.errorModuleName));
                    }
                    else {
                        diagnostics.push(ts.createDiagnosticForNode(symbolAccesibilityResult.errorNode || errorInfo.errorNode, errorInfo.diagnosticMessage, symbolAccesibilityResult.errorSymbolName, symbolAccesibilityResult.errorModuleName));
                    }
                }
            }
        }
        function trackSymbol(symbol, enclosingDeclaration, meaning) {
            handleSymbolAccessibilityError(resolver.isSymbolAccessible(symbol, enclosingDeclaration, meaning));
        }
        function writeTypeOfDeclaration(declaration, type, getSymbolAccessibilityDiagnostic) {
            writer.getSymbolAccessibilityDiagnostic = getSymbolAccessibilityDiagnostic;
            write(": ");
            if (type) {
                emitType(type);
            }
            else {
                resolver.writeTypeOfDeclaration(declaration, enclosingDeclaration, 2, writer);
            }
        }
        function writeReturnTypeAtSignature(signature, getSymbolAccessibilityDiagnostic) {
            writer.getSymbolAccessibilityDiagnostic = getSymbolAccessibilityDiagnostic;
            write(": ");
            if (signature.type) {
                emitType(signature.type);
            }
            else {
                resolver.writeReturnTypeOfSignatureDeclaration(signature, enclosingDeclaration, 2, writer);
            }
        }
        function emitLines(nodes) {
            for (var _i = 0; _i < nodes.length; _i++) {
                var node = nodes[_i];
                emit(node);
            }
        }
        function emitSeparatedList(nodes, separator, eachNodeEmitFn, canEmitFn) {
            var currentWriterPos = writer.getTextPos();
            for (var _i = 0; _i < nodes.length; _i++) {
                var node = nodes[_i];
                if (!canEmitFn || canEmitFn(node)) {
                    if (currentWriterPos !== writer.getTextPos()) {
                        write(separator);
                    }
                    currentWriterPos = writer.getTextPos();
                    eachNodeEmitFn(node);
                }
            }
        }
        function emitCommaList(nodes, eachNodeEmitFn, canEmitFn) {
            emitSeparatedList(nodes, ", ", eachNodeEmitFn, canEmitFn);
        }
        function writeJsDocComments(declaration) {
            if (declaration) {
                var jsDocComments = ts.getJsDocComments(declaration, currentSourceFile);
                ts.emitNewLineBeforeLeadingComments(currentSourceFile, writer, declaration, jsDocComments);
                ts.emitComments(currentSourceFile, writer, jsDocComments, true, newLine, ts.writeCommentRange);
            }
        }
        function emitTypeWithNewGetSymbolAccessibilityDiagnostic(type, getSymbolAccessibilityDiagnostic) {
            writer.getSymbolAccessibilityDiagnostic = getSymbolAccessibilityDiagnostic;
            emitType(type);
        }
        function emitType(type) {
            switch (type.kind) {
                case 112:
                case 121:
                case 119:
                case 113:
                case 122:
                case 99:
                case 8:
                    return writeTextOfNode(currentSourceFile, type);
                case 177:
                    return emitHeritageClauseElement(type);
                case 141:
                    return emitTypeReference(type);
                case 144:
                    return emitTypeQuery(type);
                case 146:
                    return emitArrayType(type);
                case 147:
                    return emitTupleType(type);
                case 148:
                    return emitUnionType(type);
                case 149:
                    return emitParenType(type);
                case 142:
                case 143:
                    return emitSignatureDeclarationWithJsDocComments(type);
                case 145:
                    return emitTypeLiteral(type);
                case 65:
                    return emitEntityName(type);
                case 126:
                    return emitEntityName(type);
            }
            function emitEntityName(entityName) {
                var visibilityResult = resolver.isEntityNameVisible(entityName, entityName.parent.kind === 208 ? entityName.parent : enclosingDeclaration);
                handleSymbolAccessibilityError(visibilityResult);
                writeEntityName(entityName);
                function writeEntityName(entityName) {
                    if (entityName.kind === 65) {
                        writeTextOfNode(currentSourceFile, entityName);
                    }
                    else {
                        var left = entityName.kind === 126 ? entityName.left : entityName.expression;
                        var right = entityName.kind === 126 ? entityName.right : entityName.name;
                        writeEntityName(left);
                        write(".");
                        writeTextOfNode(currentSourceFile, right);
                    }
                }
            }
            function emitHeritageClauseElement(node) {
                if (ts.isSupportedHeritageClauseElement(node)) {
                    ts.Debug.assert(node.expression.kind === 65 || node.expression.kind === 155);
                    emitEntityName(node.expression);
                    if (node.typeArguments) {
                        write("<");
                        emitCommaList(node.typeArguments, emitType);
                        write(">");
                    }
                }
            }
            function emitTypeReference(type) {
                emitEntityName(type.typeName);
                if (type.typeArguments) {
                    write("<");
                    emitCommaList(type.typeArguments, emitType);
                    write(">");
                }
            }
            function emitTypeQuery(type) {
                write("typeof ");
                emitEntityName(type.exprName);
            }
            function emitArrayType(type) {
                emitType(type.elementType);
                write("[]");
            }
            function emitTupleType(type) {
                write("[");
                emitCommaList(type.elementTypes, emitType);
                write("]");
            }
            function emitUnionType(type) {
                emitSeparatedList(type.types, " | ", emitType);
            }
            function emitParenType(type) {
                write("(");
                emitType(type.type);
                write(")");
            }
            function emitTypeLiteral(type) {
                write("{");
                if (type.members.length) {
                    writeLine();
                    increaseIndent();
                    emitLines(type.members);
                    decreaseIndent();
                }
                write("}");
            }
        }
        function emitSourceFile(node) {
            currentSourceFile = node;
            enclosingDeclaration = node;
            emitLines(node.statements);
        }
        function getExportDefaultTempVariableName() {
            var baseName = "_default";
            if (!ts.hasProperty(currentSourceFile.identifiers, baseName)) {
                return baseName;
            }
            var count = 0;
            while (true) {
                var name_1 = baseName + "_" + (++count);
                if (!ts.hasProperty(currentSourceFile.identifiers, name_1)) {
                    return name_1;
                }
            }
        }
        function emitExportAssignment(node) {
            if (node.expression.kind === 65) {
                write(node.isExportEquals ? "export = " : "export default ");
                writeTextOfNode(currentSourceFile, node.expression);
            }
            else {
                var tempVarName = getExportDefaultTempVariableName();
                write("declare var ");
                write(tempVarName);
                write(": ");
                writer.getSymbolAccessibilityDiagnostic = getDefaultExportAccessibilityDiagnostic;
                resolver.writeTypeOfExpression(node.expression, enclosingDeclaration, 2, writer);
                write(";");
                writeLine();
                write(node.isExportEquals ? "export = " : "export default ");
                write(tempVarName);
            }
            write(";");
            writeLine();
            if (node.expression.kind === 65) {
                var nodes = resolver.collectLinkedAliases(node.expression);
                writeAsynchronousModuleElements(nodes);
            }
            function getDefaultExportAccessibilityDiagnostic(diagnostic) {
                return {
                    diagnosticMessage: ts.Diagnostics.Default_export_of_the_module_has_or_is_using_private_name_0,
                    errorNode: node
                };
            }
        }
        function isModuleElementVisible(node) {
            return resolver.isDeclarationVisible(node);
        }
        function emitModuleElement(node, isModuleElementVisible) {
            if (isModuleElementVisible) {
                writeModuleElement(node);
            }
            else if (node.kind === 208 ||
                (node.parent.kind === 227 && ts.isExternalModule(currentSourceFile))) {
                var isVisible;
                if (asynchronousSubModuleDeclarationEmitInfo && node.parent.kind !== 227) {
                    asynchronousSubModuleDeclarationEmitInfo.push({
                        node: node,
                        outputPos: writer.getTextPos(),
                        indent: writer.getIndent(),
                        isVisible: isVisible
                    });
                }
                else {
                    if (node.kind === 209) {
                        var importDeclaration = node;
                        if (importDeclaration.importClause) {
                            isVisible = (importDeclaration.importClause.name && resolver.isDeclarationVisible(importDeclaration.importClause)) ||
                                isVisibleNamedBinding(importDeclaration.importClause.namedBindings);
                        }
                    }
                    moduleElementDeclarationEmitInfo.push({
                        node: node,
                        outputPos: writer.getTextPos(),
                        indent: writer.getIndent(),
                        isVisible: isVisible
                    });
                }
            }
        }
        function writeModuleElement(node) {
            switch (node.kind) {
                case 200:
                    return writeFunctionDeclaration(node);
                case 180:
                    return writeVariableStatement(node);
                case 202:
                    return writeInterfaceDeclaration(node);
                case 201:
                    return writeClassDeclaration(node);
                case 203:
                    return writeTypeAliasDeclaration(node);
                case 204:
                    return writeEnumDeclaration(node);
                case 205:
                    return writeModuleDeclaration(node);
                case 208:
                    return writeImportEqualsDeclaration(node);
                case 209:
                    return writeImportDeclaration(node);
                default:
                    ts.Debug.fail("Unknown symbol kind");
            }
        }
        function emitModuleElementDeclarationFlags(node) {
            if (node.parent === currentSourceFile) {
                if (node.flags & 1) {
                    write("export ");
                }
                if (node.flags & 256) {
                    write("default ");
                }
                else if (node.kind !== 202) {
                    write("declare ");
                }
            }
        }
        function emitClassMemberDeclarationFlags(node) {
            if (node.flags & 32) {
                write("private ");
            }
            else if (node.flags & 64) {
                write("protected ");
            }
            if (node.flags & 128) {
                write("static ");
            }
        }
        function writeImportEqualsDeclaration(node) {
            emitJsDocComments(node);
            if (node.flags & 1) {
                write("export ");
            }
            write("import ");
            writeTextOfNode(currentSourceFile, node.name);
            write(" = ");
            if (ts.isInternalModuleImportEqualsDeclaration(node)) {
                emitTypeWithNewGetSymbolAccessibilityDiagnostic(node.moduleReference, getImportEntityNameVisibilityError);
                write(";");
            }
            else {
                write("require(");
                writeTextOfNode(currentSourceFile, ts.getExternalModuleImportEqualsDeclarationExpression(node));
                write(");");
            }
            writer.writeLine();
            function getImportEntityNameVisibilityError(symbolAccesibilityResult) {
                return {
                    diagnosticMessage: ts.Diagnostics.Import_declaration_0_is_using_private_name_1,
                    errorNode: node,
                    typeName: node.name
                };
            }
        }
        function isVisibleNamedBinding(namedBindings) {
            if (namedBindings) {
                if (namedBindings.kind === 211) {
                    return resolver.isDeclarationVisible(namedBindings);
                }
                else {
                    return ts.forEach(namedBindings.elements, function (namedImport) { return resolver.isDeclarationVisible(namedImport); });
                }
            }
        }
        function writeImportDeclaration(node) {
            if (!node.importClause && !(node.flags & 1)) {
                return;
            }
            emitJsDocComments(node);
            if (node.flags & 1) {
                write("export ");
            }
            write("import ");
            if (node.importClause) {
                var currentWriterPos = writer.getTextPos();
                if (node.importClause.name && resolver.isDeclarationVisible(node.importClause)) {
                    writeTextOfNode(currentSourceFile, node.importClause.name);
                }
                if (node.importClause.namedBindings && isVisibleNamedBinding(node.importClause.namedBindings)) {
                    if (currentWriterPos !== writer.getTextPos()) {
                        write(", ");
                    }
                    if (node.importClause.namedBindings.kind === 211) {
                        write("* as ");
                        writeTextOfNode(currentSourceFile, node.importClause.namedBindings.name);
                    }
                    else {
                        write("{ ");
                        emitCommaList(node.importClause.namedBindings.elements, emitImportOrExportSpecifier, resolver.isDeclarationVisible);
                        write(" }");
                    }
                }
                write(" from ");
            }
            writeTextOfNode(currentSourceFile, node.moduleSpecifier);
            write(";");
            writer.writeLine();
        }
        function emitImportOrExportSpecifier(node) {
            if (node.propertyName) {
                writeTextOfNode(currentSourceFile, node.propertyName);
                write(" as ");
            }
            writeTextOfNode(currentSourceFile, node.name);
        }
        function emitExportSpecifier(node) {
            emitImportOrExportSpecifier(node);
            var nodes = resolver.collectLinkedAliases(node.propertyName || node.name);
            writeAsynchronousModuleElements(nodes);
        }
        function emitExportDeclaration(node) {
            emitJsDocComments(node);
            write("export ");
            if (node.exportClause) {
                write("{ ");
                emitCommaList(node.exportClause.elements, emitExportSpecifier);
                write(" }");
            }
            else {
                write("*");
            }
            if (node.moduleSpecifier) {
                write(" from ");
                writeTextOfNode(currentSourceFile, node.moduleSpecifier);
            }
            write(";");
            writer.writeLine();
        }
        function writeModuleDeclaration(node) {
            emitJsDocComments(node);
            emitModuleElementDeclarationFlags(node);
            write("module ");
            writeTextOfNode(currentSourceFile, node.name);
            while (node.body.kind !== 206) {
                node = node.body;
                write(".");
                writeTextOfNode(currentSourceFile, node.name);
            }
            var prevEnclosingDeclaration = enclosingDeclaration;
            enclosingDeclaration = node;
            write(" {");
            writeLine();
            increaseIndent();
            emitLines(node.body.statements);
            decreaseIndent();
            write("}");
            writeLine();
            enclosingDeclaration = prevEnclosingDeclaration;
        }
        function writeTypeAliasDeclaration(node) {
            emitJsDocComments(node);
            emitModuleElementDeclarationFlags(node);
            write("type ");
            writeTextOfNode(currentSourceFile, node.name);
            write(" = ");
            emitTypeWithNewGetSymbolAccessibilityDiagnostic(node.type, getTypeAliasDeclarationVisibilityError);
            write(";");
            writeLine();
            function getTypeAliasDeclarationVisibilityError(symbolAccesibilityResult) {
                return {
                    diagnosticMessage: ts.Diagnostics.Exported_type_alias_0_has_or_is_using_private_name_1,
                    errorNode: node.type,
                    typeName: node.name
                };
            }
        }
        function writeEnumDeclaration(node) {
            emitJsDocComments(node);
            emitModuleElementDeclarationFlags(node);
            if (ts.isConst(node)) {
                write("const ");
            }
            write("enum ");
            writeTextOfNode(currentSourceFile, node.name);
            write(" {");
            writeLine();
            increaseIndent();
            emitLines(node.members);
            decreaseIndent();
            write("}");
            writeLine();
        }
        function emitEnumMemberDeclaration(node) {
            emitJsDocComments(node);
            writeTextOfNode(currentSourceFile, node.name);
            var enumMemberValue = resolver.getConstantValue(node);
            if (enumMemberValue !== undefined) {
                write(" = ");
                write(enumMemberValue.toString());
            }
            write(",");
            writeLine();
        }
        function isPrivateMethodTypeParameter(node) {
            return node.parent.kind === 134 && (node.parent.flags & 32);
        }
        function emitTypeParameters(typeParameters) {
            function emitTypeParameter(node) {
                increaseIndent();
                emitJsDocComments(node);
                decreaseIndent();
                writeTextOfNode(currentSourceFile, node.name);
                if (node.constraint && !isPrivateMethodTypeParameter(node)) {
                    write(" extends ");
                    if (node.parent.kind === 142 ||
                        node.parent.kind === 143 ||
                        (node.parent.parent && node.parent.parent.kind === 145)) {
                        ts.Debug.assert(node.parent.kind === 134 ||
                            node.parent.kind === 133 ||
                            node.parent.kind === 142 ||
                            node.parent.kind === 143 ||
                            node.parent.kind === 138 ||
                            node.parent.kind === 139);
                        emitType(node.constraint);
                    }
                    else {
                        emitTypeWithNewGetSymbolAccessibilityDiagnostic(node.constraint, getTypeParameterConstraintVisibilityError);
                    }
                }
                function getTypeParameterConstraintVisibilityError(symbolAccesibilityResult) {
                    var diagnosticMessage;
                    switch (node.parent.kind) {
                        case 201:
                            diagnosticMessage = ts.Diagnostics.Type_parameter_0_of_exported_class_has_or_is_using_private_name_1;
                            break;
                        case 202:
                            diagnosticMessage = ts.Diagnostics.Type_parameter_0_of_exported_interface_has_or_is_using_private_name_1;
                            break;
                        case 139:
                            diagnosticMessage = ts.Diagnostics.Type_parameter_0_of_constructor_signature_from_exported_interface_has_or_is_using_private_name_1;
                            break;
                        case 138:
                            diagnosticMessage = ts.Diagnostics.Type_parameter_0_of_call_signature_from_exported_interface_has_or_is_using_private_name_1;
                            break;
                        case 134:
                        case 133:
                            if (node.parent.flags & 128) {
                                diagnosticMessage = ts.Diagnostics.Type_parameter_0_of_public_static_method_from_exported_class_has_or_is_using_private_name_1;
                            }
                            else if (node.parent.parent.kind === 201) {
                                diagnosticMessage = ts.Diagnostics.Type_parameter_0_of_public_method_from_exported_class_has_or_is_using_private_name_1;
                            }
                            else {
                                diagnosticMessage = ts.Diagnostics.Type_parameter_0_of_method_from_exported_interface_has_or_is_using_private_name_1;
                            }
                            break;
                        case 200:
                            diagnosticMessage = ts.Diagnostics.Type_parameter_0_of_exported_function_has_or_is_using_private_name_1;
                            break;
                        default:
                            ts.Debug.fail("This is unknown parent for type parameter: " + node.parent.kind);
                    }
                    return {
                        diagnosticMessage: diagnosticMessage,
                        errorNode: node,
                        typeName: node.name
                    };
                }
            }
            if (typeParameters) {
                write("<");
                emitCommaList(typeParameters, emitTypeParameter);
                write(">");
            }
        }
        function emitHeritageClause(typeReferences, isImplementsList) {
            if (typeReferences) {
                write(isImplementsList ? " implements " : " extends ");
                emitCommaList(typeReferences, emitTypeOfTypeReference);
            }
            function emitTypeOfTypeReference(node) {
                if (ts.isSupportedHeritageClauseElement(node)) {
                    emitTypeWithNewGetSymbolAccessibilityDiagnostic(node, getHeritageClauseVisibilityError);
                }
                function getHeritageClauseVisibilityError(symbolAccesibilityResult) {
                    var diagnosticMessage;
                    if (node.parent.parent.kind === 201) {
                        diagnosticMessage = isImplementsList ?
                            ts.Diagnostics.Implements_clause_of_exported_class_0_has_or_is_using_private_name_1 :
                            ts.Diagnostics.Extends_clause_of_exported_class_0_has_or_is_using_private_name_1;
                    }
                    else {
                        diagnosticMessage = ts.Diagnostics.Extends_clause_of_exported_interface_0_has_or_is_using_private_name_1;
                    }
                    return {
                        diagnosticMessage: diagnosticMessage,
                        errorNode: node,
                        typeName: node.parent.parent.name
                    };
                }
            }
        }
        function writeClassDeclaration(node) {
            function emitParameterProperties(constructorDeclaration) {
                if (constructorDeclaration) {
                    ts.forEach(constructorDeclaration.parameters, function (param) {
                        if (param.flags & 112) {
                            emitPropertyDeclaration(param);
                        }
                    });
                }
            }
            emitJsDocComments(node);
            emitModuleElementDeclarationFlags(node);
            write("class ");
            writeTextOfNode(currentSourceFile, node.name);
            var prevEnclosingDeclaration = enclosingDeclaration;
            enclosingDeclaration = node;
            emitTypeParameters(node.typeParameters);
            var baseTypeNode = ts.getClassExtendsHeritageClauseElement(node);
            if (baseTypeNode) {
                emitHeritageClause([baseTypeNode], false);
            }
            emitHeritageClause(ts.getClassImplementsHeritageClauseElements(node), true);
            write(" {");
            writeLine();
            increaseIndent();
            emitParameterProperties(ts.getFirstConstructorWithBody(node));
            emitLines(node.members);
            decreaseIndent();
            write("}");
            writeLine();
            enclosingDeclaration = prevEnclosingDeclaration;
        }
        function writeInterfaceDeclaration(node) {
            emitJsDocComments(node);
            emitModuleElementDeclarationFlags(node);
            write("interface ");
            writeTextOfNode(currentSourceFile, node.name);
            var prevEnclosingDeclaration = enclosingDeclaration;
            enclosingDeclaration = node;
            emitTypeParameters(node.typeParameters);
            emitHeritageClause(ts.getInterfaceBaseTypeNodes(node), false);
            write(" {");
            writeLine();
            increaseIndent();
            emitLines(node.members);
            decreaseIndent();
            write("}");
            writeLine();
            enclosingDeclaration = prevEnclosingDeclaration;
        }
        function emitPropertyDeclaration(node) {
            if (ts.hasDynamicName(node)) {
                return;
            }
            emitJsDocComments(node);
            emitClassMemberDeclarationFlags(node);
            emitVariableDeclaration(node);
            write(";");
            writeLine();
        }
        function emitVariableDeclaration(node) {
            if (node.kind !== 198 || resolver.isDeclarationVisible(node)) {
                if (ts.isBindingPattern(node.name)) {
                    emitBindingPattern(node.name);
                }
                else {
                    writeTextOfNode(currentSourceFile, node.name);
                    if ((node.kind === 132 || node.kind === 131) && ts.hasQuestionToken(node)) {
                        write("?");
                    }
                    if ((node.kind === 132 || node.kind === 131) && node.parent.kind === 145) {
                        emitTypeOfVariableDeclarationFromTypeLiteral(node);
                    }
                    else if (!(node.flags & 32)) {
                        writeTypeOfDeclaration(node, node.type, getVariableDeclarationTypeVisibilityError);
                    }
                }
            }
            function getVariableDeclarationTypeVisibilityDiagnosticMessage(symbolAccesibilityResult) {
                if (node.kind === 198) {
                    return symbolAccesibilityResult.errorModuleName ?
                        symbolAccesibilityResult.accessibility === 2 ?
                            ts.Diagnostics.Exported_variable_0_has_or_is_using_name_1_from_external_module_2_but_cannot_be_named :
                            ts.Diagnostics.Exported_variable_0_has_or_is_using_name_1_from_private_module_2 :
                        ts.Diagnostics.Exported_variable_0_has_or_is_using_private_name_1;
                }
                else if (node.kind === 132 || node.kind === 131) {
                    if (node.flags & 128) {
                        return symbolAccesibilityResult.errorModuleName ?
                            symbolAccesibilityResult.accessibility === 2 ?
                                ts.Diagnostics.Public_static_property_0_of_exported_class_has_or_is_using_name_1_from_external_module_2_but_cannot_be_named :
                                ts.Diagnostics.Public_static_property_0_of_exported_class_has_or_is_using_name_1_from_private_module_2 :
                            ts.Diagnostics.Public_static_property_0_of_exported_class_has_or_is_using_private_name_1;
                    }
                    else if (node.parent.kind === 201) {
                        return symbolAccesibilityResult.errorModuleName ?
                            symbolAccesibilityResult.accessibility === 2 ?
                                ts.Diagnostics.Public_property_0_of_exported_class_has_or_is_using_name_1_from_external_module_2_but_cannot_be_named :
                                ts.Diagnostics.Public_property_0_of_exported_class_has_or_is_using_name_1_from_private_module_2 :
                            ts.Diagnostics.Public_property_0_of_exported_class_has_or_is_using_private_name_1;
                    }
                    else {
                        return symbolAccesibilityResult.errorModuleName ?
                            ts.Diagnostics.Property_0_of_exported_interface_has_or_is_using_name_1_from_private_module_2 :
                            ts.Diagnostics.Property_0_of_exported_interface_has_or_is_using_private_name_1;
                    }
                }
            }
            function getVariableDeclarationTypeVisibilityError(symbolAccesibilityResult) {
                var diagnosticMessage = getVariableDeclarationTypeVisibilityDiagnosticMessage(symbolAccesibilityResult);
                return diagnosticMessage !== undefined ? {
                    diagnosticMessage: diagnosticMessage,
                    errorNode: node,
                    typeName: node.name
                } : undefined;
            }
            function emitBindingPattern(bindingPattern) {
                var elements = [];
                for (var _i = 0, _a = bindingPattern.elements; _i < _a.length; _i++) {
                    var element = _a[_i];
                    if (element.kind !== 175) {
                        elements.push(element);
                    }
                }
                emitCommaList(elements, emitBindingElement);
            }
            function emitBindingElement(bindingElement) {
                function getBindingElementTypeVisibilityError(symbolAccesibilityResult) {
                    var diagnosticMessage = getVariableDeclarationTypeVisibilityDiagnosticMessage(symbolAccesibilityResult);
                    return diagnosticMessage !== undefined ? {
                        diagnosticMessage: diagnosticMessage,
                        errorNode: bindingElement,
                        typeName: bindingElement.name
                    } : undefined;
                }
                if (bindingElement.name) {
                    if (ts.isBindingPattern(bindingElement.name)) {
                        emitBindingPattern(bindingElement.name);
                    }
                    else {
                        writeTextOfNode(currentSourceFile, bindingElement.name);
                        writeTypeOfDeclaration(bindingElement, undefined, getBindingElementTypeVisibilityError);
                    }
                }
            }
        }
        function emitTypeOfVariableDeclarationFromTypeLiteral(node) {
            if (node.type) {
                write(": ");
                emitType(node.type);
            }
        }
        function isVariableStatementVisible(node) {
            return ts.forEach(node.declarationList.declarations, function (varDeclaration) { return resolver.isDeclarationVisible(varDeclaration); });
        }
        function writeVariableStatement(node) {
            emitJsDocComments(node);
            emitModuleElementDeclarationFlags(node);
            if (ts.isLet(node.declarationList)) {
                write("let ");
            }
            else if (ts.isConst(node.declarationList)) {
                write("const ");
            }
            else {
                write("var ");
            }
            emitCommaList(node.declarationList.declarations, emitVariableDeclaration, resolver.isDeclarationVisible);
            write(";");
            writeLine();
        }
        function emitAccessorDeclaration(node) {
            if (ts.hasDynamicName(node)) {
                return;
            }
            var accessors = ts.getAllAccessorDeclarations(node.parent.members, node);
            var accessorWithTypeAnnotation;
            if (node === accessors.firstAccessor) {
                emitJsDocComments(accessors.getAccessor);
                emitJsDocComments(accessors.setAccessor);
                emitClassMemberDeclarationFlags(node);
                writeTextOfNode(currentSourceFile, node.name);
                if (!(node.flags & 32)) {
                    accessorWithTypeAnnotation = node;
                    var type = getTypeAnnotationFromAccessor(node);
                    if (!type) {
                        var anotherAccessor = node.kind === 136 ? accessors.setAccessor : accessors.getAccessor;
                        type = getTypeAnnotationFromAccessor(anotherAccessor);
                        if (type) {
                            accessorWithTypeAnnotation = anotherAccessor;
                        }
                    }
                    writeTypeOfDeclaration(node, type, getAccessorDeclarationTypeVisibilityError);
                }
                write(";");
                writeLine();
            }
            function getTypeAnnotationFromAccessor(accessor) {
                if (accessor) {
                    return accessor.kind === 136
                        ? accessor.type
                        : accessor.parameters.length > 0
                            ? accessor.parameters[0].type
                            : undefined;
                }
            }
            function getAccessorDeclarationTypeVisibilityError(symbolAccesibilityResult) {
                var diagnosticMessage;
                if (accessorWithTypeAnnotation.kind === 137) {
                    if (accessorWithTypeAnnotation.parent.flags & 128) {
                        diagnosticMessage = symbolAccesibilityResult.errorModuleName ?
                            ts.Diagnostics.Parameter_0_of_public_static_property_setter_from_exported_class_has_or_is_using_name_1_from_private_module_2 :
                            ts.Diagnostics.Parameter_0_of_public_static_property_setter_from_exported_class_has_or_is_using_private_name_1;
                    }
                    else {
                        diagnosticMessage = symbolAccesibilityResult.errorModuleName ?
                            ts.Diagnostics.Parameter_0_of_public_property_setter_from_exported_class_has_or_is_using_name_1_from_private_module_2 :
                            ts.Diagnostics.Parameter_0_of_public_property_setter_from_exported_class_has_or_is_using_private_name_1;
                    }
                    return {
                        diagnosticMessage: diagnosticMessage,
                        errorNode: accessorWithTypeAnnotation.parameters[0],
                        typeName: accessorWithTypeAnnotation.name
                    };
                }
                else {
                    if (accessorWithTypeAnnotation.flags & 128) {
                        diagnosticMessage = symbolAccesibilityResult.errorModuleName ?
                            symbolAccesibilityResult.accessibility === 2 ?
                                ts.Diagnostics.Return_type_of_public_static_property_getter_from_exported_class_has_or_is_using_name_0_from_external_module_1_but_cannot_be_named :
                                ts.Diagnostics.Return_type_of_public_static_property_getter_from_exported_class_has_or_is_using_name_0_from_private_module_1 :
                            ts.Diagnostics.Return_type_of_public_static_property_getter_from_exported_class_has_or_is_using_private_name_0;
                    }
                    else {
                        diagnosticMessage = symbolAccesibilityResult.errorModuleName ?
                            symbolAccesibilityResult.accessibility === 2 ?
                                ts.Diagnostics.Return_type_of_public_property_getter_from_exported_class_has_or_is_using_name_0_from_external_module_1_but_cannot_be_named :
                                ts.Diagnostics.Return_type_of_public_property_getter_from_exported_class_has_or_is_using_name_0_from_private_module_1 :
                            ts.Diagnostics.Return_type_of_public_property_getter_from_exported_class_has_or_is_using_private_name_0;
                    }
                    return {
                        diagnosticMessage: diagnosticMessage,
                        errorNode: accessorWithTypeAnnotation.name,
                        typeName: undefined
                    };
                }
            }
        }
        function writeFunctionDeclaration(node) {
            if (ts.hasDynamicName(node)) {
                return;
            }
            if (!resolver.isImplementationOfOverload(node)) {
                emitJsDocComments(node);
                if (node.kind === 200) {
                    emitModuleElementDeclarationFlags(node);
                }
                else if (node.kind === 134) {
                    emitClassMemberDeclarationFlags(node);
                }
                if (node.kind === 200) {
                    write("function ");
                    writeTextOfNode(currentSourceFile, node.name);
                }
                else if (node.kind === 135) {
                    write("constructor");
                }
                else {
                    writeTextOfNode(currentSourceFile, node.name);
                    if (ts.hasQuestionToken(node)) {
                        write("?");
                    }
                }
                emitSignatureDeclaration(node);
            }
        }
        function emitSignatureDeclarationWithJsDocComments(node) {
            emitJsDocComments(node);
            emitSignatureDeclaration(node);
        }
        function emitSignatureDeclaration(node) {
            if (node.kind === 139 || node.kind === 143) {
                write("new ");
            }
            emitTypeParameters(node.typeParameters);
            if (node.kind === 140) {
                write("[");
            }
            else {
                write("(");
            }
            var prevEnclosingDeclaration = enclosingDeclaration;
            enclosingDeclaration = node;
            emitCommaList(node.parameters, emitParameterDeclaration);
            if (node.kind === 140) {
                write("]");
            }
            else {
                write(")");
            }
            var isFunctionTypeOrConstructorType = node.kind === 142 || node.kind === 143;
            if (isFunctionTypeOrConstructorType || node.parent.kind === 145) {
                if (node.type) {
                    write(isFunctionTypeOrConstructorType ? " => " : ": ");
                    emitType(node.type);
                }
            }
            else if (node.kind !== 135 && !(node.flags & 32)) {
                writeReturnTypeAtSignature(node, getReturnTypeVisibilityError);
            }
            enclosingDeclaration = prevEnclosingDeclaration;
            if (!isFunctionTypeOrConstructorType) {
                write(";");
                writeLine();
            }
            function getReturnTypeVisibilityError(symbolAccesibilityResult) {
                var diagnosticMessage;
                switch (node.kind) {
                    case 139:
                        diagnosticMessage = symbolAccesibilityResult.errorModuleName ?
                            ts.Diagnostics.Return_type_of_constructor_signature_from_exported_interface_has_or_is_using_name_0_from_private_module_1 :
                            ts.Diagnostics.Return_type_of_constructor_signature_from_exported_interface_has_or_is_using_private_name_0;
                        break;
                    case 138:
                        diagnosticMessage = symbolAccesibilityResult.errorModuleName ?
                            ts.Diagnostics.Return_type_of_call_signature_from_exported_interface_has_or_is_using_name_0_from_private_module_1 :
                            ts.Diagnostics.Return_type_of_call_signature_from_exported_interface_has_or_is_using_private_name_0;
                        break;
                    case 140:
                        diagnosticMessage = symbolAccesibilityResult.errorModuleName ?
                            ts.Diagnostics.Return_type_of_index_signature_from_exported_interface_has_or_is_using_name_0_from_private_module_1 :
                            ts.Diagnostics.Return_type_of_index_signature_from_exported_interface_has_or_is_using_private_name_0;
                        break;
                    case 134:
                    case 133:
                        if (node.flags & 128) {
                            diagnosticMessage = symbolAccesibilityResult.errorModuleName ?
                                symbolAccesibilityResult.accessibility === 2 ?
                                    ts.Diagnostics.Return_type_of_public_static_method_from_exported_class_has_or_is_using_name_0_from_external_module_1_but_cannot_be_named :
                                    ts.Diagnostics.Return_type_of_public_static_method_from_exported_class_has_or_is_using_name_0_from_private_module_1 :
                                ts.Diagnostics.Return_type_of_public_static_method_from_exported_class_has_or_is_using_private_name_0;
                        }
                        else if (node.parent.kind === 201) {
                            diagnosticMessage = symbolAccesibilityResult.errorModuleName ?
                                symbolAccesibilityResult.accessibility === 2 ?
                                    ts.Diagnostics.Return_type_of_public_method_from_exported_class_has_or_is_using_name_0_from_external_module_1_but_cannot_be_named :
                                    ts.Diagnostics.Return_type_of_public_method_from_exported_class_has_or_is_using_name_0_from_private_module_1 :
                                ts.Diagnostics.Return_type_of_public_method_from_exported_class_has_or_is_using_private_name_0;
                        }
                        else {
                            diagnosticMessage = symbolAccesibilityResult.errorModuleName ?
                                ts.Diagnostics.Return_type_of_method_from_exported_interface_has_or_is_using_name_0_from_private_module_1 :
                                ts.Diagnostics.Return_type_of_method_from_exported_interface_has_or_is_using_private_name_0;
                        }
                        break;
                    case 200:
                        diagnosticMessage = symbolAccesibilityResult.errorModuleName ?
                            symbolAccesibilityResult.accessibility === 2 ?
                                ts.Diagnostics.Return_type_of_exported_function_has_or_is_using_name_0_from_external_module_1_but_cannot_be_named :
                                ts.Diagnostics.Return_type_of_exported_function_has_or_is_using_name_0_from_private_module_1 :
                            ts.Diagnostics.Return_type_of_exported_function_has_or_is_using_private_name_0;
                        break;
                    default:
                        ts.Debug.fail("This is unknown kind for signature: " + node.kind);
                }
                return {
                    diagnosticMessage: diagnosticMessage,
                    errorNode: node.name || node,
                };
            }
        }
        function emitParameterDeclaration(node) {
            increaseIndent();
            emitJsDocComments(node);
            if (node.dotDotDotToken) {
                write("...");
            }
            if (ts.isBindingPattern(node.name)) {
                emitBindingPattern(node.name);
            }
            else {
                writeTextOfNode(currentSourceFile, node.name);
            }
            if (node.initializer || ts.hasQuestionToken(node)) {
                write("?");
            }
            decreaseIndent();
            if (node.parent.kind === 142 ||
                node.parent.kind === 143 ||
                node.parent.parent.kind === 145) {
                emitTypeOfVariableDeclarationFromTypeLiteral(node);
            }
            else if (!(node.parent.flags & 32)) {
                writeTypeOfDeclaration(node, node.type, getParameterDeclarationTypeVisibilityError);
            }
            function getParameterDeclarationTypeVisibilityError(symbolAccesibilityResult) {
                var diagnosticMessage = getParameterDeclarationTypeVisibilityDiagnosticMessage(symbolAccesibilityResult);
                return diagnosticMessage !== undefined ? {
                    diagnosticMessage: diagnosticMessage,
                    errorNode: node,
                    typeName: node.name
                } : undefined;
            }
            function getParameterDeclarationTypeVisibilityDiagnosticMessage(symbolAccesibilityResult) {
                switch (node.parent.kind) {
                    case 135:
                        return symbolAccesibilityResult.errorModuleName ?
                            symbolAccesibilityResult.accessibility === 2 ?
                                ts.Diagnostics.Parameter_0_of_constructor_from_exported_class_has_or_is_using_name_1_from_external_module_2_but_cannot_be_named :
                                ts.Diagnostics.Parameter_0_of_constructor_from_exported_class_has_or_is_using_name_1_from_private_module_2 :
                            ts.Diagnostics.Parameter_0_of_constructor_from_exported_class_has_or_is_using_private_name_1;
                    case 139:
                        return symbolAccesibilityResult.errorModuleName ?
                            ts.Diagnostics.Parameter_0_of_constructor_signature_from_exported_interface_has_or_is_using_name_1_from_private_module_2 :
                            ts.Diagnostics.Parameter_0_of_constructor_signature_from_exported_interface_has_or_is_using_private_name_1;
                    case 138:
                        return symbolAccesibilityResult.errorModuleName ?
                            ts.Diagnostics.Parameter_0_of_call_signature_from_exported_interface_has_or_is_using_name_1_from_private_module_2 :
                            ts.Diagnostics.Parameter_0_of_call_signature_from_exported_interface_has_or_is_using_private_name_1;
                    case 134:
                    case 133:
                        if (node.parent.flags & 128) {
                            return symbolAccesibilityResult.errorModuleName ?
                                symbolAccesibilityResult.accessibility === 2 ?
                                    ts.Diagnostics.Parameter_0_of_public_static_method_from_exported_class_has_or_is_using_name_1_from_external_module_2_but_cannot_be_named :
                                    ts.Diagnostics.Parameter_0_of_public_static_method_from_exported_class_has_or_is_using_name_1_from_private_module_2 :
                                ts.Diagnostics.Parameter_0_of_public_static_method_from_exported_class_has_or_is_using_private_name_1;
                        }
                        else if (node.parent.parent.kind === 201) {
                            return symbolAccesibilityResult.errorModuleName ?
                                symbolAccesibilityResult.accessibility === 2 ?
                                    ts.Diagnostics.Parameter_0_of_public_method_from_exported_class_has_or_is_using_name_1_from_external_module_2_but_cannot_be_named :
                                    ts.Diagnostics.Parameter_0_of_public_method_from_exported_class_has_or_is_using_name_1_from_private_module_2 :
                                ts.Diagnostics.Parameter_0_of_public_method_from_exported_class_has_or_is_using_private_name_1;
                        }
                        else {
                            return symbolAccesibilityResult.errorModuleName ?
                                ts.Diagnostics.Parameter_0_of_method_from_exported_interface_has_or_is_using_name_1_from_private_module_2 :
                                ts.Diagnostics.Parameter_0_of_method_from_exported_interface_has_or_is_using_private_name_1;
                        }
                    case 200:
                        return symbolAccesibilityResult.errorModuleName ?
                            symbolAccesibilityResult.accessibility === 2 ?
                                ts.Diagnostics.Parameter_0_of_exported_function_has_or_is_using_name_1_from_external_module_2_but_cannot_be_named :
                                ts.Diagnostics.Parameter_0_of_exported_function_has_or_is_using_name_1_from_private_module_2 :
                            ts.Diagnostics.Parameter_0_of_exported_function_has_or_is_using_private_name_1;
                    default:
                        ts.Debug.fail("This is unknown parent for parameter: " + node.parent.kind);
                }
            }
            function emitBindingPattern(bindingPattern) {
                if (bindingPattern.kind === 150) {
                    write("{");
                    emitCommaList(bindingPattern.elements, emitBindingElement);
                    write("}");
                }
                else if (bindingPattern.kind === 151) {
                    write("[");
                    var elements = bindingPattern.elements;
                    emitCommaList(elements, emitBindingElement);
                    if (elements && elements.hasTrailingComma) {
                        write(", ");
                    }
                    write("]");
                }
            }
            function emitBindingElement(bindingElement) {
                function getBindingElementTypeVisibilityError(symbolAccesibilityResult) {
                    var diagnosticMessage = getParameterDeclarationTypeVisibilityDiagnosticMessage(symbolAccesibilityResult);
                    return diagnosticMessage !== undefined ? {
                        diagnosticMessage: diagnosticMessage,
                        errorNode: bindingElement,
                        typeName: bindingElement.name
                    } : undefined;
                }
                if (bindingElement.kind === 175) {
                    write(" ");
                }
                else if (bindingElement.kind === 152) {
                    if (bindingElement.propertyName) {
                        writeTextOfNode(currentSourceFile, bindingElement.propertyName);
                        write(": ");
                        emitBindingPattern(bindingElement.name);
                    }
                    else if (bindingElement.name) {
                        if (ts.isBindingPattern(bindingElement.name)) {
                            emitBindingPattern(bindingElement.name);
                        }
                        else {
                            ts.Debug.assert(bindingElement.name.kind === 65);
                            if (bindingElement.dotDotDotToken) {
                                write("...");
                            }
                            writeTextOfNode(currentSourceFile, bindingElement.name);
                        }
                    }
                }
            }
        }
        function emitNode(node) {
            switch (node.kind) {
                case 200:
                case 205:
                case 208:
                case 202:
                case 201:
                case 203:
                case 204:
                    return emitModuleElement(node, isModuleElementVisible(node));
                case 180:
                    return emitModuleElement(node, isVariableStatementVisible(node));
                case 209:
                    return emitModuleElement(node, !node.importClause);
                case 215:
                    return emitExportDeclaration(node);
                case 135:
                case 134:
                case 133:
                    return writeFunctionDeclaration(node);
                case 139:
                case 138:
                case 140:
                    return emitSignatureDeclarationWithJsDocComments(node);
                case 136:
                case 137:
                    return emitAccessorDeclaration(node);
                case 132:
                case 131:
                    return emitPropertyDeclaration(node);
                case 226:
                    return emitEnumMemberDeclaration(node);
                case 214:
                    return emitExportAssignment(node);
                case 227:
                    return emitSourceFile(node);
            }
        }
        function writeReferencePath(referencedFile) {
            var declFileName = referencedFile.flags & 2048
                ? referencedFile.fileName
                : ts.shouldEmitToOwnFile(referencedFile, compilerOptions)
                    ? ts.getOwnEmitOutputFilePath(referencedFile, host, ".d.ts")
                    : ts.removeFileExtension(compilerOptions.out) + ".d.ts";
            declFileName = ts.getRelativePathToDirectoryOrUrl(ts.getDirectoryPath(ts.normalizeSlashes(jsFilePath)), declFileName, host.getCurrentDirectory(), host.getCanonicalFileName, false);
            referencePathsOutput += "/// <reference path=\"" + declFileName + "\" />" + newLine;
        }
    }
    function writeDeclarationFile(jsFilePath, sourceFile, host, resolver, diagnostics) {
        var emitDeclarationResult = emitDeclarations(host, resolver, diagnostics, jsFilePath, sourceFile);
        if (!emitDeclarationResult.reportedDeclarationError) {
            var declarationOutput = emitDeclarationResult.referencePathsOutput
                + getDeclarationOutput(emitDeclarationResult.synchronousDeclarationOutput, emitDeclarationResult.moduleElementDeclarationEmitInfo);
            ts.writeFile(host, diagnostics, ts.removeFileExtension(jsFilePath) + ".d.ts", declarationOutput, host.getCompilerOptions().emitBOM);
        }
        function getDeclarationOutput(synchronousDeclarationOutput, moduleElementDeclarationEmitInfo) {
            var appliedSyncOutputPos = 0;
            var declarationOutput = "";
            ts.forEach(moduleElementDeclarationEmitInfo, function (aliasEmitInfo) {
                if (aliasEmitInfo.asynchronousOutput) {
                    declarationOutput += synchronousDeclarationOutput.substring(appliedSyncOutputPos, aliasEmitInfo.outputPos);
                    declarationOutput += getDeclarationOutput(aliasEmitInfo.asynchronousOutput, aliasEmitInfo.subModuleElementDeclarationEmitInfo);
                    appliedSyncOutputPos = aliasEmitInfo.outputPos;
                }
            });
            declarationOutput += synchronousDeclarationOutput.substring(appliedSyncOutputPos);
            return declarationOutput;
        }
    }
    ts.writeDeclarationFile = writeDeclarationFile;
})(ts || (ts = {}));
