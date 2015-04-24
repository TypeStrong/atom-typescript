/// <reference path="binder.ts"/>
var ts;
(function (ts) {
    var nextSymbolId = 1;
    var nextNodeId = 1;
    var nextMergeId = 1;
    function getNodeId(node) {
        if (!node.id)
            node.id = nextNodeId++;
        return node.id;
    }
    ts.getNodeId = getNodeId;
    ts.checkTime = 0;
    function getSymbolId(symbol) {
        if (!symbol.id) {
            symbol.id = nextSymbolId++;
        }
        return symbol.id;
    }
    ts.getSymbolId = getSymbolId;
    function createTypeChecker(host, produceDiagnostics) {
        var Symbol = ts.objectAllocator.getSymbolConstructor();
        var Type = ts.objectAllocator.getTypeConstructor();
        var Signature = ts.objectAllocator.getSignatureConstructor();
        var typeCount = 0;
        var emptyArray = [];
        var emptySymbols = {};
        var compilerOptions = host.getCompilerOptions();
        var languageVersion = compilerOptions.target || 0;
        var emitResolver = createResolver();
        var undefinedSymbol = createSymbol(4 | 67108864, "undefined");
        var argumentsSymbol = createSymbol(4 | 67108864, "arguments");
        var checker = {
            getNodeCount: function () { return ts.sum(host.getSourceFiles(), "nodeCount"); },
            getIdentifierCount: function () { return ts.sum(host.getSourceFiles(), "identifierCount"); },
            getSymbolCount: function () { return ts.sum(host.getSourceFiles(), "symbolCount"); },
            getTypeCount: function () { return typeCount; },
            isUndefinedSymbol: function (symbol) { return symbol === undefinedSymbol; },
            isArgumentsSymbol: function (symbol) { return symbol === argumentsSymbol; },
            getDiagnostics: getDiagnostics,
            getGlobalDiagnostics: getGlobalDiagnostics,
            getTypeOfSymbolAtLocation: getTypeOfSymbolAtLocation,
            getDeclaredTypeOfSymbol: getDeclaredTypeOfSymbol,
            getPropertiesOfType: getPropertiesOfType,
            getPropertyOfType: getPropertyOfType,
            getSignaturesOfType: getSignaturesOfType,
            getIndexTypeOfType: getIndexTypeOfType,
            getReturnTypeOfSignature: getReturnTypeOfSignature,
            getSymbolsInScope: getSymbolsInScope,
            getSymbolAtLocation: getSymbolAtLocation,
            getShorthandAssignmentValueSymbol: getShorthandAssignmentValueSymbol,
            getTypeAtLocation: getTypeAtLocation,
            typeToString: typeToString,
            getSymbolDisplayBuilder: getSymbolDisplayBuilder,
            symbolToString: symbolToString,
            getAugmentedPropertiesOfType: getAugmentedPropertiesOfType,
            getRootSymbols: getRootSymbols,
            getContextualType: getContextualType,
            getFullyQualifiedName: getFullyQualifiedName,
            getResolvedSignature: getResolvedSignature,
            getConstantValue: getConstantValue,
            isValidPropertyAccess: isValidPropertyAccess,
            getSignatureFromDeclaration: getSignatureFromDeclaration,
            isImplementationOfOverload: isImplementationOfOverload,
            getAliasedSymbol: resolveAlias,
            getEmitResolver: getEmitResolver,
            getExportsOfModule: getExportsOfModuleAsArray,
        };
        var unknownSymbol = createSymbol(4 | 67108864, "unknown");
        var resolvingSymbol = createSymbol(67108864, "__resolving__");
        var anyType = createIntrinsicType(1, "any");
        var stringType = createIntrinsicType(2, "string");
        var numberType = createIntrinsicType(4, "number");
        var booleanType = createIntrinsicType(8, "boolean");
        var esSymbolType = createIntrinsicType(1048576, "symbol");
        var voidType = createIntrinsicType(16, "void");
        var undefinedType = createIntrinsicType(32 | 262144, "undefined");
        var nullType = createIntrinsicType(64 | 262144, "null");
        var unknownType = createIntrinsicType(1, "unknown");
        var resolvingType = createIntrinsicType(1, "__resolving__");
        var emptyObjectType = createAnonymousType(undefined, emptySymbols, emptyArray, emptyArray, undefined, undefined);
        var anyFunctionType = createAnonymousType(undefined, emptySymbols, emptyArray, emptyArray, undefined, undefined);
        var noConstraintType = createAnonymousType(undefined, emptySymbols, emptyArray, emptyArray, undefined, undefined);
        var anySignature = createSignature(undefined, undefined, emptyArray, anyType, 0, false, false);
        var unknownSignature = createSignature(undefined, undefined, emptyArray, unknownType, 0, false, false);
        var globals = {};
        var globalArraySymbol;
        var globalESSymbolConstructorSymbol;
        var globalObjectType;
        var globalFunctionType;
        var globalArrayType;
        var globalStringType;
        var globalNumberType;
        var globalBooleanType;
        var globalRegExpType;
        var globalTemplateStringsArrayType;
        var globalESSymbolType;
        var globalIterableType;
        var anyArrayType;
        var getGlobalClassDecoratorType;
        var getGlobalParameterDecoratorType;
        var getGlobalPropertyDecoratorType;
        var getGlobalMethodDecoratorType;
        var tupleTypes = {};
        var unionTypes = {};
        var stringLiteralTypes = {};
        var emitExtends = false;
        var emitDecorate = false;
        var emitParam = false;
        var mergedSymbols = [];
        var symbolLinks = [];
        var nodeLinks = [];
        var potentialThisCollisions = [];
        var diagnostics = ts.createDiagnosticCollection();
        var primitiveTypeInfo = {
            "string": {
                type: stringType,
                flags: 258
            },
            "number": {
                type: numberType,
                flags: 132
            },
            "boolean": {
                type: booleanType,
                flags: 8
            },
            "symbol": {
                type: esSymbolType,
                flags: 1048576
            }
        };
        function getEmitResolver(sourceFile) {
            getDiagnostics(sourceFile);
            return emitResolver;
        }
        function error(location, message, arg0, arg1, arg2) {
            var diagnostic = location
                ? ts.createDiagnosticForNode(location, message, arg0, arg1, arg2)
                : ts.createCompilerDiagnostic(message, arg0, arg1, arg2);
            diagnostics.add(diagnostic);
        }
        function createSymbol(flags, name) {
            return new Symbol(flags, name);
        }
        function getExcludedSymbolFlags(flags) {
            var result = 0;
            if (flags & 2)
                result |= 107455;
            if (flags & 1)
                result |= 107454;
            if (flags & 4)
                result |= 107455;
            if (flags & 8)
                result |= 107455;
            if (flags & 16)
                result |= 106927;
            if (flags & 32)
                result |= 899583;
            if (flags & 64)
                result |= 792992;
            if (flags & 256)
                result |= 899327;
            if (flags & 128)
                result |= 899967;
            if (flags & 512)
                result |= 106639;
            if (flags & 8192)
                result |= 99263;
            if (flags & 32768)
                result |= 41919;
            if (flags & 65536)
                result |= 74687;
            if (flags & 262144)
                result |= 530912;
            if (flags & 524288)
                result |= 793056;
            if (flags & 8388608)
                result |= 8388608;
            return result;
        }
        function recordMergedSymbol(target, source) {
            if (!source.mergeId)
                source.mergeId = nextMergeId++;
            mergedSymbols[source.mergeId] = target;
        }
        function cloneSymbol(symbol) {
            var result = createSymbol(symbol.flags | 33554432, symbol.name);
            result.declarations = symbol.declarations.slice(0);
            result.parent = symbol.parent;
            if (symbol.valueDeclaration)
                result.valueDeclaration = symbol.valueDeclaration;
            if (symbol.constEnumOnlyModule)
                result.constEnumOnlyModule = true;
            if (symbol.members)
                result.members = cloneSymbolTable(symbol.members);
            if (symbol.exports)
                result.exports = cloneSymbolTable(symbol.exports);
            recordMergedSymbol(result, symbol);
            return result;
        }
        function mergeSymbol(target, source) {
            if (!(target.flags & getExcludedSymbolFlags(source.flags))) {
                if (source.flags & 512 && target.flags & 512 && target.constEnumOnlyModule && !source.constEnumOnlyModule) {
                    target.constEnumOnlyModule = false;
                }
                target.flags |= source.flags;
                if (!target.valueDeclaration && source.valueDeclaration)
                    target.valueDeclaration = source.valueDeclaration;
                ts.forEach(source.declarations, function (node) {
                    target.declarations.push(node);
                });
                if (source.members) {
                    if (!target.members)
                        target.members = {};
                    mergeSymbolTable(target.members, source.members);
                }
                if (source.exports) {
                    if (!target.exports)
                        target.exports = {};
                    mergeSymbolTable(target.exports, source.exports);
                }
                recordMergedSymbol(target, source);
            }
            else {
                var message = target.flags & 2 || source.flags & 2
                    ? ts.Diagnostics.Cannot_redeclare_block_scoped_variable_0 : ts.Diagnostics.Duplicate_identifier_0;
                ts.forEach(source.declarations, function (node) {
                    error(node.name ? node.name : node, message, symbolToString(source));
                });
                ts.forEach(target.declarations, function (node) {
                    error(node.name ? node.name : node, message, symbolToString(source));
                });
            }
        }
        function cloneSymbolTable(symbolTable) {
            var result = {};
            for (var id in symbolTable) {
                if (ts.hasProperty(symbolTable, id)) {
                    result[id] = symbolTable[id];
                }
            }
            return result;
        }
        function mergeSymbolTable(target, source) {
            for (var id in source) {
                if (ts.hasProperty(source, id)) {
                    if (!ts.hasProperty(target, id)) {
                        target[id] = source[id];
                    }
                    else {
                        var symbol = target[id];
                        if (!(symbol.flags & 33554432)) {
                            target[id] = symbol = cloneSymbol(symbol);
                        }
                        mergeSymbol(symbol, source[id]);
                    }
                }
            }
        }
        function getSymbolLinks(symbol) {
            if (symbol.flags & 67108864)
                return symbol;
            var id = getSymbolId(symbol);
            return symbolLinks[id] || (symbolLinks[id] = {});
        }
        function getNodeLinks(node) {
            var nodeId = getNodeId(node);
            return nodeLinks[nodeId] || (nodeLinks[nodeId] = {});
        }
        function getSourceFile(node) {
            return ts.getAncestor(node, 227);
        }
        function isGlobalSourceFile(node) {
            return node.kind === 227 && !ts.isExternalModule(node);
        }
        function getSymbol(symbols, name, meaning) {
            if (meaning && ts.hasProperty(symbols, name)) {
                var symbol = symbols[name];
                ts.Debug.assert((symbol.flags & 16777216) === 0, "Should never get an instantiated symbol here.");
                if (symbol.flags & meaning) {
                    return symbol;
                }
                if (symbol.flags & 8388608) {
                    var target = resolveAlias(symbol);
                    if (target === unknownSymbol || target.flags & meaning) {
                        return symbol;
                    }
                }
            }
        }
        function isDefinedBefore(node1, node2) {
            var file1 = ts.getSourceFileOfNode(node1);
            var file2 = ts.getSourceFileOfNode(node2);
            if (file1 === file2) {
                return node1.pos <= node2.pos;
            }
            if (!compilerOptions.out) {
                return true;
            }
            var sourceFiles = host.getSourceFiles();
            return sourceFiles.indexOf(file1) <= sourceFiles.indexOf(file2);
        }
        function resolveName(location, name, meaning, nameNotFoundMessage, nameArg) {
            var result;
            var lastLocation;
            var propertyWithInvalidInitializer;
            var errorLocation = location;
            var grandparent;
            loop: while (location) {
                if (location.locals && !isGlobalSourceFile(location)) {
                    if (result = getSymbol(location.locals, name, meaning)) {
                        break loop;
                    }
                }
                switch (location.kind) {
                    case 227:
                        if (!ts.isExternalModule(location))
                            break;
                    case 205:
                        if (result = getSymbol(getSymbolOfNode(location).exports, name, meaning & 8914931)) {
                            if (result.flags & meaning || !(result.flags & 8388608 && getDeclarationOfAliasSymbol(result).kind === 217)) {
                                break loop;
                            }
                            result = undefined;
                        }
                        else if (location.kind === 227 ||
                            (location.kind === 205 && location.name.kind === 8)) {
                            result = getSymbol(getSymbolOfNode(location).exports, "default", meaning & 8914931);
                            var localSymbol = ts.getLocalSymbolForExportDefault(result);
                            if (result && (result.flags & meaning) && localSymbol && localSymbol.name === name) {
                                break loop;
                            }
                            result = undefined;
                        }
                        break;
                    case 204:
                        if (result = getSymbol(getSymbolOfNode(location).exports, name, meaning & 8)) {
                            break loop;
                        }
                        break;
                    case 132:
                    case 131:
                        if (location.parent.kind === 201 && !(location.flags & 128)) {
                            var ctor = findConstructorDeclaration(location.parent);
                            if (ctor && ctor.locals) {
                                if (getSymbol(ctor.locals, name, meaning & 107455)) {
                                    propertyWithInvalidInitializer = location;
                                }
                            }
                        }
                        break;
                    case 201:
                    case 202:
                        if (result = getSymbol(getSymbolOfNode(location).members, name, meaning & 793056)) {
                            if (lastLocation && lastLocation.flags & 128) {
                                error(errorLocation, ts.Diagnostics.Static_members_cannot_reference_class_type_parameters);
                                return undefined;
                            }
                            break loop;
                        }
                        break;
                    case 127:
                        grandparent = location.parent.parent;
                        if (grandparent.kind === 201 || grandparent.kind === 202) {
                            if (result = getSymbol(getSymbolOfNode(grandparent).members, name, meaning & 793056)) {
                                error(errorLocation, ts.Diagnostics.A_computed_property_name_cannot_reference_a_type_parameter_from_its_containing_type);
                                return undefined;
                            }
                        }
                        break;
                    case 134:
                    case 133:
                    case 135:
                    case 136:
                    case 137:
                    case 200:
                    case 163:
                        if (name === "arguments") {
                            result = argumentsSymbol;
                            break loop;
                        }
                        break;
                    case 162:
                        if (name === "arguments") {
                            result = argumentsSymbol;
                            break loop;
                        }
                        var functionName = location.name;
                        if (functionName && name === functionName.text) {
                            result = location.symbol;
                            break loop;
                        }
                        break;
                    case 174:
                        var className = location.name;
                        if (className && name === className.text) {
                            result = location.symbol;
                            break loop;
                        }
                        break;
                    case 130:
                        if (location.parent && location.parent.kind === 129) {
                            location = location.parent;
                        }
                        if (location.parent && ts.isClassElement(location.parent)) {
                            location = location.parent;
                        }
                        break;
                }
                lastLocation = location;
                location = location.parent;
            }
            if (!result) {
                result = getSymbol(globals, name, meaning);
            }
            if (!result) {
                if (nameNotFoundMessage) {
                    error(errorLocation, nameNotFoundMessage, typeof nameArg === "string" ? nameArg : ts.declarationNameToString(nameArg));
                }
                return undefined;
            }
            if (nameNotFoundMessage) {
                if (propertyWithInvalidInitializer) {
                    var propertyName = propertyWithInvalidInitializer.name;
                    error(errorLocation, ts.Diagnostics.Initializer_of_instance_member_variable_0_cannot_reference_identifier_1_declared_in_the_constructor, ts.declarationNameToString(propertyName), typeof nameArg === "string" ? nameArg : ts.declarationNameToString(nameArg));
                    return undefined;
                }
                if (result.flags & 2) {
                    checkResolvedBlockScopedVariable(result, errorLocation);
                }
            }
            return result;
        }
        function checkResolvedBlockScopedVariable(result, errorLocation) {
            ts.Debug.assert((result.flags & 2) !== 0);
            var declaration = ts.forEach(result.declarations, function (d) { return ts.isBlockOrCatchScoped(d) ? d : undefined; });
            ts.Debug.assert(declaration !== undefined, "Block-scoped variable declaration is undefined");
            var isUsedBeforeDeclaration = !isDefinedBefore(declaration, errorLocation);
            if (!isUsedBeforeDeclaration) {
                var variableDeclaration = ts.getAncestor(declaration, 198);
                var container = ts.getEnclosingBlockScopeContainer(variableDeclaration);
                if (variableDeclaration.parent.parent.kind === 180 ||
                    variableDeclaration.parent.parent.kind === 186) {
                    isUsedBeforeDeclaration = isSameScopeDescendentOf(errorLocation, variableDeclaration, container);
                }
                else if (variableDeclaration.parent.parent.kind === 188 ||
                    variableDeclaration.parent.parent.kind === 187) {
                    var expression = variableDeclaration.parent.parent.expression;
                    isUsedBeforeDeclaration = isSameScopeDescendentOf(errorLocation, expression, container);
                }
            }
            if (isUsedBeforeDeclaration) {
                error(errorLocation, ts.Diagnostics.Block_scoped_variable_0_used_before_its_declaration, ts.declarationNameToString(declaration.name));
            }
        }
        function isSameScopeDescendentOf(initial, parent, stopAt) {
            if (!parent) {
                return false;
            }
            for (var current = initial; current && current !== stopAt && !ts.isFunctionLike(current); current = current.parent) {
                if (current === parent) {
                    return true;
                }
            }
            return false;
        }
        function getAnyImportSyntax(node) {
            if (ts.isAliasSymbolDeclaration(node)) {
                if (node.kind === 208) {
                    return node;
                }
                while (node && node.kind !== 209) {
                    node = node.parent;
                }
                return node;
            }
        }
        function getDeclarationOfAliasSymbol(symbol) {
            return ts.forEach(symbol.declarations, function (d) { return ts.isAliasSymbolDeclaration(d) ? d : undefined; });
        }
        function getTargetOfImportEqualsDeclaration(node) {
            if (node.moduleReference.kind === 219) {
                return resolveExternalModuleSymbol(resolveExternalModuleName(node, ts.getExternalModuleImportEqualsDeclarationExpression(node)));
            }
            return getSymbolOfPartOfRightHandSideOfImportEquals(node.moduleReference, node);
        }
        function getTargetOfImportClause(node) {
            var moduleSymbol = resolveExternalModuleName(node, node.parent.moduleSpecifier);
            if (moduleSymbol) {
                var exportDefaultSymbol = resolveSymbol(moduleSymbol.exports["default"]);
                if (!exportDefaultSymbol) {
                    error(node.name, ts.Diagnostics.External_module_0_has_no_default_export, symbolToString(moduleSymbol));
                }
                return exportDefaultSymbol;
            }
        }
        function getTargetOfNamespaceImport(node) {
            var moduleSpecifier = node.parent.parent.moduleSpecifier;
            return resolveESModuleSymbol(resolveExternalModuleName(node, moduleSpecifier), moduleSpecifier);
        }
        function getMemberOfModuleVariable(moduleSymbol, name) {
            if (moduleSymbol.flags & 3) {
                var typeAnnotation = moduleSymbol.valueDeclaration.type;
                if (typeAnnotation) {
                    return getPropertyOfType(getTypeFromTypeNode(typeAnnotation), name);
                }
            }
        }
        function combineValueAndTypeSymbols(valueSymbol, typeSymbol) {
            if (valueSymbol.flags & (793056 | 1536)) {
                return valueSymbol;
            }
            var result = createSymbol(valueSymbol.flags | typeSymbol.flags, valueSymbol.name);
            result.declarations = ts.concatenate(valueSymbol.declarations, typeSymbol.declarations);
            result.parent = valueSymbol.parent || typeSymbol.parent;
            if (valueSymbol.valueDeclaration)
                result.valueDeclaration = valueSymbol.valueDeclaration;
            if (typeSymbol.members)
                result.members = typeSymbol.members;
            if (valueSymbol.exports)
                result.exports = valueSymbol.exports;
            return result;
        }
        function getExportOfModule(symbol, name) {
            if (symbol.flags & 1536) {
                var exports_1 = getExportsOfSymbol(symbol);
                if (ts.hasProperty(exports_1, name)) {
                    return resolveSymbol(exports_1[name]);
                }
            }
        }
        function getPropertyOfVariable(symbol, name) {
            if (symbol.flags & 3) {
                var typeAnnotation = symbol.valueDeclaration.type;
                if (typeAnnotation) {
                    return resolveSymbol(getPropertyOfType(getTypeFromTypeNode(typeAnnotation), name));
                }
            }
        }
        function getExternalModuleMember(node, specifier) {
            var moduleSymbol = resolveExternalModuleName(node, node.moduleSpecifier);
            var targetSymbol = resolveESModuleSymbol(moduleSymbol, node.moduleSpecifier);
            if (targetSymbol) {
                var name_1 = specifier.propertyName || specifier.name;
                if (name_1.text) {
                    var symbolFromModule = getExportOfModule(targetSymbol, name_1.text);
                    var symbolFromVariable = getPropertyOfVariable(targetSymbol, name_1.text);
                    var symbol = symbolFromModule && symbolFromVariable ?
                        combineValueAndTypeSymbols(symbolFromVariable, symbolFromModule) :
                        symbolFromModule || symbolFromVariable;
                    if (!symbol) {
                        error(name_1, ts.Diagnostics.Module_0_has_no_exported_member_1, getFullyQualifiedName(moduleSymbol), ts.declarationNameToString(name_1));
                    }
                    return symbol;
                }
            }
        }
        function getTargetOfImportSpecifier(node) {
            return getExternalModuleMember(node.parent.parent.parent, node);
        }
        function getTargetOfExportSpecifier(node) {
            return node.parent.parent.moduleSpecifier ?
                getExternalModuleMember(node.parent.parent, node) :
                resolveEntityName(node.propertyName || node.name, 107455 | 793056 | 1536);
        }
        function getTargetOfExportAssignment(node) {
            return resolveEntityName(node.expression, 107455 | 793056 | 1536);
        }
        function getTargetOfAliasDeclaration(node) {
            switch (node.kind) {
                case 208:
                    return getTargetOfImportEqualsDeclaration(node);
                case 210:
                    return getTargetOfImportClause(node);
                case 211:
                    return getTargetOfNamespaceImport(node);
                case 213:
                    return getTargetOfImportSpecifier(node);
                case 217:
                    return getTargetOfExportSpecifier(node);
                case 214:
                    return getTargetOfExportAssignment(node);
            }
        }
        function resolveSymbol(symbol) {
            return symbol && symbol.flags & 8388608 && !(symbol.flags & (107455 | 793056 | 1536)) ? resolveAlias(symbol) : symbol;
        }
        function resolveAlias(symbol) {
            ts.Debug.assert((symbol.flags & 8388608) !== 0, "Should only get Alias here.");
            var links = getSymbolLinks(symbol);
            if (!links.target) {
                links.target = resolvingSymbol;
                var node = getDeclarationOfAliasSymbol(symbol);
                var target = getTargetOfAliasDeclaration(node);
                if (links.target === resolvingSymbol) {
                    links.target = target || unknownSymbol;
                }
                else {
                    error(node, ts.Diagnostics.Circular_definition_of_import_alias_0, symbolToString(symbol));
                }
            }
            else if (links.target === resolvingSymbol) {
                links.target = unknownSymbol;
            }
            return links.target;
        }
        function markExportAsReferenced(node) {
            var symbol = getSymbolOfNode(node);
            var target = resolveAlias(symbol);
            if (target) {
                var markAlias = (target === unknownSymbol && compilerOptions.separateCompilation) ||
                    (target !== unknownSymbol && (target.flags & 107455) && !isConstEnumOrConstEnumOnlyModule(target));
                if (markAlias) {
                    markAliasSymbolAsReferenced(symbol);
                }
            }
        }
        function markAliasSymbolAsReferenced(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.referenced) {
                links.referenced = true;
                var node = getDeclarationOfAliasSymbol(symbol);
                if (node.kind === 214) {
                    checkExpressionCached(node.expression);
                }
                else if (node.kind === 217) {
                    checkExpressionCached(node.propertyName || node.name);
                }
                else if (ts.isInternalModuleImportEqualsDeclaration(node)) {
                    checkExpressionCached(node.moduleReference);
                }
            }
        }
        function getSymbolOfPartOfRightHandSideOfImportEquals(entityName, importDeclaration) {
            if (!importDeclaration) {
                importDeclaration = ts.getAncestor(entityName, 208);
                ts.Debug.assert(importDeclaration !== undefined);
            }
            if (entityName.kind === 65 && ts.isRightSideOfQualifiedNameOrPropertyAccess(entityName)) {
                entityName = entityName.parent;
            }
            if (entityName.kind === 65 || entityName.parent.kind === 126) {
                return resolveEntityName(entityName, 1536);
            }
            else {
                ts.Debug.assert(entityName.parent.kind === 208);
                return resolveEntityName(entityName, 107455 | 793056 | 1536);
            }
        }
        function getFullyQualifiedName(symbol) {
            return symbol.parent ? getFullyQualifiedName(symbol.parent) + "." + symbolToString(symbol) : symbolToString(symbol);
        }
        function resolveEntityName(name, meaning) {
            if (ts.nodeIsMissing(name)) {
                return undefined;
            }
            var symbol;
            if (name.kind === 65) {
                symbol = resolveName(name, name.text, meaning, ts.Diagnostics.Cannot_find_name_0, name);
                if (!symbol) {
                    return undefined;
                }
            }
            else if (name.kind === 126 || name.kind === 155) {
                var left = name.kind === 126 ? name.left : name.expression;
                var right = name.kind === 126 ? name.right : name.name;
                var namespace = resolveEntityName(left, 1536);
                if (!namespace || namespace === unknownSymbol || ts.nodeIsMissing(right)) {
                    return undefined;
                }
                symbol = getSymbol(getExportsOfSymbol(namespace), right.text, meaning);
                if (!symbol) {
                    error(right, ts.Diagnostics.Module_0_has_no_exported_member_1, getFullyQualifiedName(namespace), ts.declarationNameToString(right));
                    return undefined;
                }
            }
            else {
                ts.Debug.fail("Unknown entity name kind.");
            }
            ts.Debug.assert((symbol.flags & 16777216) === 0, "Should never get an instantiated symbol here.");
            return symbol.flags & meaning ? symbol : resolveAlias(symbol);
        }
        function isExternalModuleNameRelative(moduleName) {
            return moduleName.substr(0, 2) === "./" || moduleName.substr(0, 3) === "../" || moduleName.substr(0, 2) === ".\\" || moduleName.substr(0, 3) === "..\\";
        }
        function resolveExternalModuleName(location, moduleReferenceExpression) {
            if (moduleReferenceExpression.kind !== 8) {
                return;
            }
            var moduleReferenceLiteral = moduleReferenceExpression;
            var searchPath = ts.getDirectoryPath(getSourceFile(location).fileName);
            var moduleName = ts.escapeIdentifier(moduleReferenceLiteral.text);
            if (!moduleName)
                return;
            var isRelative = isExternalModuleNameRelative(moduleName);
            if (!isRelative) {
                var symbol = getSymbol(globals, '"' + moduleName + '"', 512);
                if (symbol) {
                    return symbol;
                }
            }
            var sourceFile;
            while (true) {
                var fileName = ts.normalizePath(ts.combinePaths(searchPath, moduleName));
                sourceFile = host.getSourceFile(fileName + ".ts") || host.getSourceFile(fileName + ".d.ts");
                if (sourceFile || isRelative) {
                    break;
                }
                var parentPath = ts.getDirectoryPath(searchPath);
                if (parentPath === searchPath) {
                    break;
                }
                searchPath = parentPath;
            }
            if (sourceFile) {
                if (sourceFile.symbol) {
                    return sourceFile.symbol;
                }
                error(moduleReferenceLiteral, ts.Diagnostics.File_0_is_not_an_external_module, sourceFile.fileName);
                return;
            }
            error(moduleReferenceLiteral, ts.Diagnostics.Cannot_find_external_module_0, moduleName);
        }
        function resolveExternalModuleSymbol(moduleSymbol) {
            return moduleSymbol && resolveSymbol(moduleSymbol.exports["export="]) || moduleSymbol;
        }
        function resolveESModuleSymbol(moduleSymbol, moduleReferenceExpression) {
            var symbol = resolveExternalModuleSymbol(moduleSymbol);
            if (symbol && !(symbol.flags & (1536 | 3))) {
                error(moduleReferenceExpression, ts.Diagnostics.External_module_0_resolves_to_a_non_module_entity_and_cannot_be_imported_using_this_construct, symbolToString(moduleSymbol));
                symbol = undefined;
            }
            return symbol;
        }
        function getExportAssignmentSymbol(moduleSymbol) {
            return moduleSymbol.exports["export="];
        }
        function getExportsOfModuleAsArray(moduleSymbol) {
            return symbolsToArray(getExportsOfModule(moduleSymbol));
        }
        function getExportsOfSymbol(symbol) {
            return symbol.flags & 1536 ? getExportsOfModule(symbol) : symbol.exports || emptySymbols;
        }
        function getExportsOfModule(moduleSymbol) {
            var links = getSymbolLinks(moduleSymbol);
            return links.resolvedExports || (links.resolvedExports = getExportsForModule(moduleSymbol));
        }
        function extendExportSymbols(target, source) {
            for (var id in source) {
                if (id !== "default" && !ts.hasProperty(target, id)) {
                    target[id] = source[id];
                }
            }
        }
        function getExportsForModule(moduleSymbol) {
            var result;
            var visitedSymbols = [];
            visit(moduleSymbol);
            return result || moduleSymbol.exports;
            function visit(symbol) {
                if (symbol && symbol.flags & 1952 && !ts.contains(visitedSymbols, symbol)) {
                    visitedSymbols.push(symbol);
                    if (symbol !== moduleSymbol) {
                        if (!result) {
                            result = cloneSymbolTable(moduleSymbol.exports);
                        }
                        extendExportSymbols(result, symbol.exports);
                    }
                    var exportStars = symbol.exports["__export"];
                    if (exportStars) {
                        for (var _i = 0, _a = exportStars.declarations; _i < _a.length; _i++) {
                            var node = _a[_i];
                            visit(resolveExternalModuleName(node, node.moduleSpecifier));
                        }
                    }
                }
            }
        }
        function getMergedSymbol(symbol) {
            var merged;
            return symbol && symbol.mergeId && (merged = mergedSymbols[symbol.mergeId]) ? merged : symbol;
        }
        function getSymbolOfNode(node) {
            return getMergedSymbol(node.symbol);
        }
        function getParentOfSymbol(symbol) {
            return getMergedSymbol(symbol.parent);
        }
        function getExportSymbolOfValueSymbolIfExported(symbol) {
            return symbol && (symbol.flags & 1048576) !== 0
                ? getMergedSymbol(symbol.exportSymbol)
                : symbol;
        }
        function symbolIsValue(symbol) {
            if (symbol.flags & 16777216) {
                return symbolIsValue(getSymbolLinks(symbol).target);
            }
            if (symbol.flags & 107455) {
                return true;
            }
            if (symbol.flags & 8388608) {
                return (resolveAlias(symbol).flags & 107455) !== 0;
            }
            return false;
        }
        function findConstructorDeclaration(node) {
            var members = node.members;
            for (var _i = 0; _i < members.length; _i++) {
                var member = members[_i];
                if (member.kind === 135 && ts.nodeIsPresent(member.body)) {
                    return member;
                }
            }
        }
        function createType(flags) {
            var result = new Type(checker, flags);
            result.id = typeCount++;
            return result;
        }
        function createIntrinsicType(kind, intrinsicName) {
            var type = createType(kind);
            type.intrinsicName = intrinsicName;
            return type;
        }
        function createObjectType(kind, symbol) {
            var type = createType(kind);
            type.symbol = symbol;
            return type;
        }
        function isReservedMemberName(name) {
            return name.charCodeAt(0) === 95 &&
                name.charCodeAt(1) === 95 &&
                name.charCodeAt(2) !== 95 &&
                name.charCodeAt(2) !== 64;
        }
        function getNamedMembers(members) {
            var result;
            for (var id in members) {
                if (ts.hasProperty(members, id)) {
                    if (!isReservedMemberName(id)) {
                        if (!result)
                            result = [];
                        var symbol = members[id];
                        if (symbolIsValue(symbol)) {
                            result.push(symbol);
                        }
                    }
                }
            }
            return result || emptyArray;
        }
        function setObjectTypeMembers(type, members, callSignatures, constructSignatures, stringIndexType, numberIndexType) {
            type.members = members;
            type.properties = getNamedMembers(members);
            type.callSignatures = callSignatures;
            type.constructSignatures = constructSignatures;
            if (stringIndexType)
                type.stringIndexType = stringIndexType;
            if (numberIndexType)
                type.numberIndexType = numberIndexType;
            return type;
        }
        function createAnonymousType(symbol, members, callSignatures, constructSignatures, stringIndexType, numberIndexType) {
            return setObjectTypeMembers(createObjectType(32768, symbol), members, callSignatures, constructSignatures, stringIndexType, numberIndexType);
        }
        function forEachSymbolTableInScope(enclosingDeclaration, callback) {
            var result;
            for (var location_1 = enclosingDeclaration; location_1; location_1 = location_1.parent) {
                if (location_1.locals && !isGlobalSourceFile(location_1)) {
                    if (result = callback(location_1.locals)) {
                        return result;
                    }
                }
                switch (location_1.kind) {
                    case 227:
                        if (!ts.isExternalModule(location_1)) {
                            break;
                        }
                    case 205:
                        if (result = callback(getSymbolOfNode(location_1).exports)) {
                            return result;
                        }
                        break;
                    case 201:
                    case 202:
                        if (result = callback(getSymbolOfNode(location_1).members)) {
                            return result;
                        }
                        break;
                }
            }
            return callback(globals);
        }
        function getQualifiedLeftMeaning(rightMeaning) {
            return rightMeaning === 107455 ? 107455 : 1536;
        }
        function getAccessibleSymbolChain(symbol, enclosingDeclaration, meaning, useOnlyExternalAliasing) {
            function getAccessibleSymbolChainFromSymbolTable(symbols) {
                function canQualifySymbol(symbolFromSymbolTable, meaning) {
                    if (!needsQualification(symbolFromSymbolTable, enclosingDeclaration, meaning)) {
                        return true;
                    }
                    var accessibleParent = getAccessibleSymbolChain(symbolFromSymbolTable.parent, enclosingDeclaration, getQualifiedLeftMeaning(meaning), useOnlyExternalAliasing);
                    return !!accessibleParent;
                }
                function isAccessible(symbolFromSymbolTable, resolvedAliasSymbol) {
                    if (symbol === (resolvedAliasSymbol || symbolFromSymbolTable)) {
                        return !ts.forEach(symbolFromSymbolTable.declarations, hasExternalModuleSymbol) &&
                            canQualifySymbol(symbolFromSymbolTable, meaning);
                    }
                }
                if (isAccessible(ts.lookUp(symbols, symbol.name))) {
                    return [symbol];
                }
                return ts.forEachValue(symbols, function (symbolFromSymbolTable) {
                    if (symbolFromSymbolTable.flags & 8388608 && symbolFromSymbolTable.name !== "export=") {
                        if (!useOnlyExternalAliasing ||
                            ts.forEach(symbolFromSymbolTable.declarations, ts.isExternalModuleImportEqualsDeclaration)) {
                            var resolvedImportedSymbol = resolveAlias(symbolFromSymbolTable);
                            if (isAccessible(symbolFromSymbolTable, resolveAlias(symbolFromSymbolTable))) {
                                return [symbolFromSymbolTable];
                            }
                            var accessibleSymbolsFromExports = resolvedImportedSymbol.exports ? getAccessibleSymbolChainFromSymbolTable(resolvedImportedSymbol.exports) : undefined;
                            if (accessibleSymbolsFromExports && canQualifySymbol(symbolFromSymbolTable, getQualifiedLeftMeaning(meaning))) {
                                return [symbolFromSymbolTable].concat(accessibleSymbolsFromExports);
                            }
                        }
                    }
                });
            }
            if (symbol) {
                return forEachSymbolTableInScope(enclosingDeclaration, getAccessibleSymbolChainFromSymbolTable);
            }
        }
        function needsQualification(symbol, enclosingDeclaration, meaning) {
            var qualify = false;
            forEachSymbolTableInScope(enclosingDeclaration, function (symbolTable) {
                if (!ts.hasProperty(symbolTable, symbol.name)) {
                    return false;
                }
                var symbolFromSymbolTable = symbolTable[symbol.name];
                if (symbolFromSymbolTable === symbol) {
                    return true;
                }
                symbolFromSymbolTable = (symbolFromSymbolTable.flags & 8388608) ? resolveAlias(symbolFromSymbolTable) : symbolFromSymbolTable;
                if (symbolFromSymbolTable.flags & meaning) {
                    qualify = true;
                    return true;
                }
                return false;
            });
            return qualify;
        }
        function isSymbolAccessible(symbol, enclosingDeclaration, meaning) {
            if (symbol && enclosingDeclaration && !(symbol.flags & 262144)) {
                var initialSymbol = symbol;
                var meaningToLook = meaning;
                while (symbol) {
                    var accessibleSymbolChain = getAccessibleSymbolChain(symbol, enclosingDeclaration, meaningToLook, false);
                    if (accessibleSymbolChain) {
                        var hasAccessibleDeclarations = hasVisibleDeclarations(accessibleSymbolChain[0]);
                        if (!hasAccessibleDeclarations) {
                            return {
                                accessibility: 1,
                                errorSymbolName: symbolToString(initialSymbol, enclosingDeclaration, meaning),
                                errorModuleName: symbol !== initialSymbol ? symbolToString(symbol, enclosingDeclaration, 1536) : undefined,
                            };
                        }
                        return hasAccessibleDeclarations;
                    }
                    meaningToLook = getQualifiedLeftMeaning(meaning);
                    symbol = getParentOfSymbol(symbol);
                }
                var symbolExternalModule = ts.forEach(initialSymbol.declarations, getExternalModuleContainer);
                if (symbolExternalModule) {
                    var enclosingExternalModule = getExternalModuleContainer(enclosingDeclaration);
                    if (symbolExternalModule !== enclosingExternalModule) {
                        return {
                            accessibility: 2,
                            errorSymbolName: symbolToString(initialSymbol, enclosingDeclaration, meaning),
                            errorModuleName: symbolToString(symbolExternalModule)
                        };
                    }
                }
                return {
                    accessibility: 1,
                    errorSymbolName: symbolToString(initialSymbol, enclosingDeclaration, meaning),
                };
            }
            return { accessibility: 0 };
            function getExternalModuleContainer(declaration) {
                for (; declaration; declaration = declaration.parent) {
                    if (hasExternalModuleSymbol(declaration)) {
                        return getSymbolOfNode(declaration);
                    }
                }
            }
        }
        function hasExternalModuleSymbol(declaration) {
            return (declaration.kind === 205 && declaration.name.kind === 8) ||
                (declaration.kind === 227 && ts.isExternalModule(declaration));
        }
        function hasVisibleDeclarations(symbol) {
            var aliasesToMakeVisible;
            if (ts.forEach(symbol.declarations, function (declaration) { return !getIsDeclarationVisible(declaration); })) {
                return undefined;
            }
            return { accessibility: 0, aliasesToMakeVisible: aliasesToMakeVisible };
            function getIsDeclarationVisible(declaration) {
                if (!isDeclarationVisible(declaration)) {
                    var anyImportSyntax = getAnyImportSyntax(declaration);
                    if (anyImportSyntax &&
                        !(anyImportSyntax.flags & 1) &&
                        isDeclarationVisible(anyImportSyntax.parent)) {
                        getNodeLinks(declaration).isVisible = true;
                        if (aliasesToMakeVisible) {
                            if (!ts.contains(aliasesToMakeVisible, anyImportSyntax)) {
                                aliasesToMakeVisible.push(anyImportSyntax);
                            }
                        }
                        else {
                            aliasesToMakeVisible = [anyImportSyntax];
                        }
                        return true;
                    }
                    return false;
                }
                return true;
            }
        }
        function isEntityNameVisible(entityName, enclosingDeclaration) {
            var meaning;
            if (entityName.parent.kind === 144) {
                meaning = 107455 | 1048576;
            }
            else if (entityName.kind === 126 || entityName.kind === 155 ||
                entityName.parent.kind === 208) {
                meaning = 1536;
            }
            else {
                meaning = 793056;
            }
            var firstIdentifier = getFirstIdentifier(entityName);
            var symbol = resolveName(enclosingDeclaration, firstIdentifier.text, meaning, undefined, undefined);
            return (symbol && hasVisibleDeclarations(symbol)) || {
                accessibility: 1,
                errorSymbolName: ts.getTextOfNode(firstIdentifier),
                errorNode: firstIdentifier
            };
        }
        function writeKeyword(writer, kind) {
            writer.writeKeyword(ts.tokenToString(kind));
        }
        function writePunctuation(writer, kind) {
            writer.writePunctuation(ts.tokenToString(kind));
        }
        function writeSpace(writer) {
            writer.writeSpace(" ");
        }
        function symbolToString(symbol, enclosingDeclaration, meaning) {
            var writer = ts.getSingleLineStringWriter();
            getSymbolDisplayBuilder().buildSymbolDisplay(symbol, writer, enclosingDeclaration, meaning);
            var result = writer.string();
            ts.releaseStringWriter(writer);
            return result;
        }
        function typeToString(type, enclosingDeclaration, flags) {
            var writer = ts.getSingleLineStringWriter();
            getSymbolDisplayBuilder().buildTypeDisplay(type, writer, enclosingDeclaration, flags);
            var result = writer.string();
            ts.releaseStringWriter(writer);
            var maxLength = compilerOptions.noErrorTruncation || flags & 4 ? undefined : 100;
            if (maxLength && result.length >= maxLength) {
                result = result.substr(0, maxLength - "...".length) + "...";
            }
            return result;
        }
        function getTypeAliasForTypeLiteral(type) {
            if (type.symbol && type.symbol.flags & 2048) {
                var node = type.symbol.declarations[0].parent;
                while (node.kind === 149) {
                    node = node.parent;
                }
                if (node.kind === 203) {
                    return getSymbolOfNode(node);
                }
            }
            return undefined;
        }
        var _displayBuilder;
        function getSymbolDisplayBuilder() {
            function appendSymbolNameOnly(symbol, writer) {
                if (symbol.declarations && symbol.declarations.length > 0) {
                    var declaration = symbol.declarations[0];
                    if (declaration.name) {
                        writer.writeSymbol(ts.declarationNameToString(declaration.name), symbol);
                        return;
                    }
                }
                writer.writeSymbol(symbol.name, symbol);
            }
            function buildSymbolDisplay(symbol, writer, enclosingDeclaration, meaning, flags, typeFlags) {
                var parentSymbol;
                function appendParentTypeArgumentsAndSymbolName(symbol) {
                    if (parentSymbol) {
                        if (flags & 1) {
                            if (symbol.flags & 16777216) {
                                buildDisplayForTypeArgumentsAndDelimiters(getTypeParametersOfClassOrInterface(parentSymbol), symbol.mapper, writer, enclosingDeclaration);
                            }
                            else {
                                buildTypeParameterDisplayFromSymbol(parentSymbol, writer, enclosingDeclaration);
                            }
                        }
                        writePunctuation(writer, 20);
                    }
                    parentSymbol = symbol;
                    appendSymbolNameOnly(symbol, writer);
                }
                writer.trackSymbol(symbol, enclosingDeclaration, meaning);
                function walkSymbol(symbol, meaning) {
                    if (symbol) {
                        var accessibleSymbolChain = getAccessibleSymbolChain(symbol, enclosingDeclaration, meaning, !!(flags & 2));
                        if (!accessibleSymbolChain ||
                            needsQualification(accessibleSymbolChain[0], enclosingDeclaration, accessibleSymbolChain.length === 1 ? meaning : getQualifiedLeftMeaning(meaning))) {
                            walkSymbol(getParentOfSymbol(accessibleSymbolChain ? accessibleSymbolChain[0] : symbol), getQualifiedLeftMeaning(meaning));
                        }
                        if (accessibleSymbolChain) {
                            for (var _i = 0; _i < accessibleSymbolChain.length; _i++) {
                                var accessibleSymbol = accessibleSymbolChain[_i];
                                appendParentTypeArgumentsAndSymbolName(accessibleSymbol);
                            }
                        }
                        else {
                            if (!parentSymbol && ts.forEach(symbol.declarations, hasExternalModuleSymbol)) {
                                return;
                            }
                            if (symbol.flags & 2048 || symbol.flags & 4096) {
                                return;
                            }
                            appendParentTypeArgumentsAndSymbolName(symbol);
                        }
                    }
                }
                var isTypeParameter = symbol.flags & 262144;
                var typeFormatFlag = 128 & typeFlags;
                if (!isTypeParameter && (enclosingDeclaration || typeFormatFlag)) {
                    walkSymbol(symbol, meaning);
                    return;
                }
                return appendParentTypeArgumentsAndSymbolName(symbol);
            }
            function buildTypeDisplay(type, writer, enclosingDeclaration, globalFlags, typeStack) {
                var globalFlagsToPass = globalFlags & 16;
                return writeType(type, globalFlags);
                function writeType(type, flags) {
                    if (type.flags & 1048703) {
                        writer.writeKeyword(!(globalFlags & 16) &&
                            (type.flags & 1) ? "any" : type.intrinsicName);
                    }
                    else if (type.flags & 4096) {
                        writeTypeReference(type, flags);
                    }
                    else if (type.flags & (1024 | 2048 | 128 | 512)) {
                        buildSymbolDisplay(type.symbol, writer, enclosingDeclaration, 793056, 0, flags);
                    }
                    else if (type.flags & 8192) {
                        writeTupleType(type);
                    }
                    else if (type.flags & 16384) {
                        writeUnionType(type, flags);
                    }
                    else if (type.flags & 32768) {
                        writeAnonymousType(type, flags);
                    }
                    else if (type.flags & 256) {
                        writer.writeStringLiteral(type.text);
                    }
                    else {
                        writePunctuation(writer, 14);
                        writeSpace(writer);
                        writePunctuation(writer, 21);
                        writeSpace(writer);
                        writePunctuation(writer, 15);
                    }
                }
                function writeTypeList(types, union) {
                    for (var i = 0; i < types.length; i++) {
                        if (i > 0) {
                            if (union) {
                                writeSpace(writer);
                            }
                            writePunctuation(writer, union ? 44 : 23);
                            writeSpace(writer);
                        }
                        writeType(types[i], union ? 64 : 0);
                    }
                }
                function writeTypeReference(type, flags) {
                    if (type.target === globalArrayType && !(flags & 1)) {
                        writeType(type.typeArguments[0], 64);
                        writePunctuation(writer, 18);
                        writePunctuation(writer, 19);
                    }
                    else {
                        buildSymbolDisplay(type.target.symbol, writer, enclosingDeclaration, 793056);
                        writePunctuation(writer, 24);
                        writeTypeList(type.typeArguments, false);
                        writePunctuation(writer, 25);
                    }
                }
                function writeTupleType(type) {
                    writePunctuation(writer, 18);
                    writeTypeList(type.elementTypes, false);
                    writePunctuation(writer, 19);
                }
                function writeUnionType(type, flags) {
                    if (flags & 64) {
                        writePunctuation(writer, 16);
                    }
                    writeTypeList(type.types, true);
                    if (flags & 64) {
                        writePunctuation(writer, 17);
                    }
                }
                function writeAnonymousType(type, flags) {
                    if (type.symbol && type.symbol.flags & (32 | 384 | 512)) {
                        writeTypeofSymbol(type, flags);
                    }
                    else if (shouldWriteTypeOfFunctionSymbol()) {
                        writeTypeofSymbol(type, flags);
                    }
                    else if (typeStack && ts.contains(typeStack, type)) {
                        var typeAlias = getTypeAliasForTypeLiteral(type);
                        if (typeAlias) {
                            buildSymbolDisplay(typeAlias, writer, enclosingDeclaration, 793056, 0, flags);
                        }
                        else {
                            writeKeyword(writer, 112);
                        }
                    }
                    else {
                        if (!typeStack) {
                            typeStack = [];
                        }
                        typeStack.push(type);
                        writeLiteralType(type, flags);
                        typeStack.pop();
                    }
                    function shouldWriteTypeOfFunctionSymbol() {
                        if (type.symbol) {
                            var isStaticMethodSymbol = !!(type.symbol.flags & 8192 &&
                                ts.forEach(type.symbol.declarations, function (declaration) { return declaration.flags & 128; }));
                            var isNonLocalFunctionSymbol = !!(type.symbol.flags & 16) &&
                                (type.symbol.parent ||
                                    ts.forEach(type.symbol.declarations, function (declaration) {
                                        return declaration.parent.kind === 227 || declaration.parent.kind === 206;
                                    }));
                            if (isStaticMethodSymbol || isNonLocalFunctionSymbol) {
                                return !!(flags & 2) ||
                                    (typeStack && ts.contains(typeStack, type));
                            }
                        }
                    }
                }
                function writeTypeofSymbol(type, typeFormatFlags) {
                    writeKeyword(writer, 97);
                    writeSpace(writer);
                    buildSymbolDisplay(type.symbol, writer, enclosingDeclaration, 107455, 0, typeFormatFlags);
                }
                function getIndexerParameterName(type, indexKind, fallbackName) {
                    var declaration = getIndexDeclarationOfSymbol(type.symbol, indexKind);
                    if (!declaration) {
                        return fallbackName;
                    }
                    ts.Debug.assert(declaration.parameters.length !== 0);
                    return ts.declarationNameToString(declaration.parameters[0].name);
                }
                function writeLiteralType(type, flags) {
                    var resolved = resolveObjectOrUnionTypeMembers(type);
                    if (!resolved.properties.length && !resolved.stringIndexType && !resolved.numberIndexType) {
                        if (!resolved.callSignatures.length && !resolved.constructSignatures.length) {
                            writePunctuation(writer, 14);
                            writePunctuation(writer, 15);
                            return;
                        }
                        if (resolved.callSignatures.length === 1 && !resolved.constructSignatures.length) {
                            if (flags & 64) {
                                writePunctuation(writer, 16);
                            }
                            buildSignatureDisplay(resolved.callSignatures[0], writer, enclosingDeclaration, globalFlagsToPass | 8, typeStack);
                            if (flags & 64) {
                                writePunctuation(writer, 17);
                            }
                            return;
                        }
                        if (resolved.constructSignatures.length === 1 && !resolved.callSignatures.length) {
                            if (flags & 64) {
                                writePunctuation(writer, 16);
                            }
                            writeKeyword(writer, 88);
                            writeSpace(writer);
                            buildSignatureDisplay(resolved.constructSignatures[0], writer, enclosingDeclaration, globalFlagsToPass | 8, typeStack);
                            if (flags & 64) {
                                writePunctuation(writer, 17);
                            }
                            return;
                        }
                    }
                    writePunctuation(writer, 14);
                    writer.writeLine();
                    writer.increaseIndent();
                    for (var _i = 0, _a = resolved.callSignatures; _i < _a.length; _i++) {
                        var signature = _a[_i];
                        buildSignatureDisplay(signature, writer, enclosingDeclaration, globalFlagsToPass, typeStack);
                        writePunctuation(writer, 22);
                        writer.writeLine();
                    }
                    for (var _b = 0, _c = resolved.constructSignatures; _b < _c.length; _b++) {
                        var signature = _c[_b];
                        writeKeyword(writer, 88);
                        writeSpace(writer);
                        buildSignatureDisplay(signature, writer, enclosingDeclaration, globalFlagsToPass, typeStack);
                        writePunctuation(writer, 22);
                        writer.writeLine();
                    }
                    if (resolved.stringIndexType) {
                        writePunctuation(writer, 18);
                        writer.writeParameter(getIndexerParameterName(resolved, 0, "x"));
                        writePunctuation(writer, 51);
                        writeSpace(writer);
                        writeKeyword(writer, 121);
                        writePunctuation(writer, 19);
                        writePunctuation(writer, 51);
                        writeSpace(writer);
                        writeType(resolved.stringIndexType, 0);
                        writePunctuation(writer, 22);
                        writer.writeLine();
                    }
                    if (resolved.numberIndexType) {
                        writePunctuation(writer, 18);
                        writer.writeParameter(getIndexerParameterName(resolved, 1, "x"));
                        writePunctuation(writer, 51);
                        writeSpace(writer);
                        writeKeyword(writer, 119);
                        writePunctuation(writer, 19);
                        writePunctuation(writer, 51);
                        writeSpace(writer);
                        writeType(resolved.numberIndexType, 0);
                        writePunctuation(writer, 22);
                        writer.writeLine();
                    }
                    for (var _d = 0, _e = resolved.properties; _d < _e.length; _d++) {
                        var p = _e[_d];
                        var t = getTypeOfSymbol(p);
                        if (p.flags & (16 | 8192) && !getPropertiesOfObjectType(t).length) {
                            var signatures = getSignaturesOfType(t, 0);
                            for (var _f = 0; _f < signatures.length; _f++) {
                                var signature = signatures[_f];
                                buildSymbolDisplay(p, writer);
                                if (p.flags & 536870912) {
                                    writePunctuation(writer, 50);
                                }
                                buildSignatureDisplay(signature, writer, enclosingDeclaration, globalFlagsToPass, typeStack);
                                writePunctuation(writer, 22);
                                writer.writeLine();
                            }
                        }
                        else {
                            buildSymbolDisplay(p, writer);
                            if (p.flags & 536870912) {
                                writePunctuation(writer, 50);
                            }
                            writePunctuation(writer, 51);
                            writeSpace(writer);
                            writeType(t, 0);
                            writePunctuation(writer, 22);
                            writer.writeLine();
                        }
                    }
                    writer.decreaseIndent();
                    writePunctuation(writer, 15);
                }
            }
            function buildTypeParameterDisplayFromSymbol(symbol, writer, enclosingDeclaraiton, flags) {
                var targetSymbol = getTargetSymbol(symbol);
                if (targetSymbol.flags & 32 || targetSymbol.flags & 64) {
                    buildDisplayForTypeParametersAndDelimiters(getTypeParametersOfClassOrInterface(symbol), writer, enclosingDeclaraiton, flags);
                }
            }
            function buildTypeParameterDisplay(tp, writer, enclosingDeclaration, flags, typeStack) {
                appendSymbolNameOnly(tp.symbol, writer);
                var constraint = getConstraintOfTypeParameter(tp);
                if (constraint) {
                    writeSpace(writer);
                    writeKeyword(writer, 79);
                    writeSpace(writer);
                    buildTypeDisplay(constraint, writer, enclosingDeclaration, flags, typeStack);
                }
            }
            function buildParameterDisplay(p, writer, enclosingDeclaration, flags, typeStack) {
                if (ts.hasDotDotDotToken(p.valueDeclaration)) {
                    writePunctuation(writer, 21);
                }
                appendSymbolNameOnly(p, writer);
                if (ts.hasQuestionToken(p.valueDeclaration) || p.valueDeclaration.initializer) {
                    writePunctuation(writer, 50);
                }
                writePunctuation(writer, 51);
                writeSpace(writer);
                buildTypeDisplay(getTypeOfSymbol(p), writer, enclosingDeclaration, flags, typeStack);
            }
            function buildDisplayForTypeParametersAndDelimiters(typeParameters, writer, enclosingDeclaration, flags, typeStack) {
                if (typeParameters && typeParameters.length) {
                    writePunctuation(writer, 24);
                    for (var i = 0; i < typeParameters.length; i++) {
                        if (i > 0) {
                            writePunctuation(writer, 23);
                            writeSpace(writer);
                        }
                        buildTypeParameterDisplay(typeParameters[i], writer, enclosingDeclaration, flags, typeStack);
                    }
                    writePunctuation(writer, 25);
                }
            }
            function buildDisplayForTypeArgumentsAndDelimiters(typeParameters, mapper, writer, enclosingDeclaration, flags, typeStack) {
                if (typeParameters && typeParameters.length) {
                    writePunctuation(writer, 24);
                    for (var i = 0; i < typeParameters.length; i++) {
                        if (i > 0) {
                            writePunctuation(writer, 23);
                            writeSpace(writer);
                        }
                        buildTypeDisplay(mapper(typeParameters[i]), writer, enclosingDeclaration, 0);
                    }
                    writePunctuation(writer, 25);
                }
            }
            function buildDisplayForParametersAndDelimiters(parameters, writer, enclosingDeclaration, flags, typeStack) {
                writePunctuation(writer, 16);
                for (var i = 0; i < parameters.length; i++) {
                    if (i > 0) {
                        writePunctuation(writer, 23);
                        writeSpace(writer);
                    }
                    buildParameterDisplay(parameters[i], writer, enclosingDeclaration, flags, typeStack);
                }
                writePunctuation(writer, 17);
            }
            function buildReturnTypeDisplay(signature, writer, enclosingDeclaration, flags, typeStack) {
                if (flags & 8) {
                    writeSpace(writer);
                    writePunctuation(writer, 32);
                }
                else {
                    writePunctuation(writer, 51);
                }
                writeSpace(writer);
                buildTypeDisplay(getReturnTypeOfSignature(signature), writer, enclosingDeclaration, flags, typeStack);
            }
            function buildSignatureDisplay(signature, writer, enclosingDeclaration, flags, typeStack) {
                if (signature.target && (flags & 32)) {
                    buildDisplayForTypeArgumentsAndDelimiters(signature.target.typeParameters, signature.mapper, writer, enclosingDeclaration);
                }
                else {
                    buildDisplayForTypeParametersAndDelimiters(signature.typeParameters, writer, enclosingDeclaration, flags, typeStack);
                }
                buildDisplayForParametersAndDelimiters(signature.parameters, writer, enclosingDeclaration, flags, typeStack);
                buildReturnTypeDisplay(signature, writer, enclosingDeclaration, flags, typeStack);
            }
            return _displayBuilder || (_displayBuilder = {
                symbolToString: symbolToString,
                typeToString: typeToString,
                buildSymbolDisplay: buildSymbolDisplay,
                buildTypeDisplay: buildTypeDisplay,
                buildTypeParameterDisplay: buildTypeParameterDisplay,
                buildParameterDisplay: buildParameterDisplay,
                buildDisplayForParametersAndDelimiters: buildDisplayForParametersAndDelimiters,
                buildDisplayForTypeParametersAndDelimiters: buildDisplayForTypeParametersAndDelimiters,
                buildDisplayForTypeArgumentsAndDelimiters: buildDisplayForTypeArgumentsAndDelimiters,
                buildTypeParameterDisplayFromSymbol: buildTypeParameterDisplayFromSymbol,
                buildSignatureDisplay: buildSignatureDisplay,
                buildReturnTypeDisplay: buildReturnTypeDisplay
            });
        }
        function isDeclarationVisible(node) {
            function getContainingExternalModule(node) {
                for (; node; node = node.parent) {
                    if (node.kind === 205) {
                        if (node.name.kind === 8) {
                            return node;
                        }
                    }
                    else if (node.kind === 227) {
                        return ts.isExternalModule(node) ? node : undefined;
                    }
                }
                ts.Debug.fail("getContainingModule cant reach here");
            }
            function isUsedInExportAssignment(node) {
                var externalModule = getContainingExternalModule(node);
                var exportAssignmentSymbol;
                var resolvedExportSymbol;
                if (externalModule) {
                    var externalModuleSymbol = getSymbolOfNode(externalModule);
                    exportAssignmentSymbol = getExportAssignmentSymbol(externalModuleSymbol);
                    var symbolOfNode = getSymbolOfNode(node);
                    if (isSymbolUsedInExportAssignment(symbolOfNode)) {
                        return true;
                    }
                    if (symbolOfNode.flags & 8388608) {
                        return isSymbolUsedInExportAssignment(resolveAlias(symbolOfNode));
                    }
                }
                function isSymbolUsedInExportAssignment(symbol) {
                    if (exportAssignmentSymbol === symbol) {
                        return true;
                    }
                    if (exportAssignmentSymbol && !!(exportAssignmentSymbol.flags & 8388608)) {
                        resolvedExportSymbol = resolvedExportSymbol || resolveAlias(exportAssignmentSymbol);
                        if (resolvedExportSymbol === symbol) {
                            return true;
                        }
                        return ts.forEach(resolvedExportSymbol.declarations, function (current) {
                            while (current) {
                                if (current === node) {
                                    return true;
                                }
                                current = current.parent;
                            }
                        });
                    }
                }
            }
            function determineIfDeclarationIsVisible() {
                switch (node.kind) {
                    case 152:
                        return isDeclarationVisible(node.parent.parent);
                    case 198:
                        if (ts.isBindingPattern(node.name) &&
                            !node.name.elements.length) {
                            return false;
                        }
                    case 205:
                    case 201:
                    case 202:
                    case 203:
                    case 200:
                    case 204:
                    case 208:
                        var parent_1 = getDeclarationContainer(node);
                        if (!(ts.getCombinedNodeFlags(node) & 1) &&
                            !(node.kind !== 208 && parent_1.kind !== 227 && ts.isInAmbientContext(parent_1))) {
                            return isGlobalSourceFile(parent_1);
                        }
                        return isDeclarationVisible(parent_1);
                    case 132:
                    case 131:
                    case 136:
                    case 137:
                    case 134:
                    case 133:
                        if (node.flags & (32 | 64)) {
                            return false;
                        }
                    case 135:
                    case 139:
                    case 138:
                    case 140:
                    case 129:
                    case 206:
                    case 142:
                    case 143:
                    case 145:
                    case 141:
                    case 146:
                    case 147:
                    case 148:
                    case 149:
                        return isDeclarationVisible(node.parent);
                    case 210:
                    case 211:
                    case 213:
                        return false;
                    case 128:
                    case 227:
                        return true;
                    case 214:
                        return false;
                    default:
                        ts.Debug.fail("isDeclarationVisible unknown: SyntaxKind: " + node.kind);
                }
            }
            if (node) {
                var links = getNodeLinks(node);
                if (links.isVisible === undefined) {
                    links.isVisible = !!determineIfDeclarationIsVisible();
                }
                return links.isVisible;
            }
        }
        function collectLinkedAliases(node) {
            var exportSymbol;
            if (node.parent && node.parent.kind === 214) {
                exportSymbol = resolveName(node.parent, node.text, 107455 | 793056 | 1536, ts.Diagnostics.Cannot_find_name_0, node);
            }
            else if (node.parent.kind === 217) {
                exportSymbol = getTargetOfExportSpecifier(node.parent);
            }
            var result = [];
            if (exportSymbol) {
                buildVisibleNodeList(exportSymbol.declarations);
            }
            return result;
            function buildVisibleNodeList(declarations) {
                ts.forEach(declarations, function (declaration) {
                    getNodeLinks(declaration).isVisible = true;
                    var resultNode = getAnyImportSyntax(declaration) || declaration;
                    if (!ts.contains(result, resultNode)) {
                        result.push(resultNode);
                    }
                    if (ts.isInternalModuleImportEqualsDeclaration(declaration)) {
                        var internalModuleReference = declaration.moduleReference;
                        var firstIdentifier = getFirstIdentifier(internalModuleReference);
                        var importSymbol = resolveName(declaration, firstIdentifier.text, 107455 | 793056 | 1536, ts.Diagnostics.Cannot_find_name_0, firstIdentifier);
                        buildVisibleNodeList(importSymbol.declarations);
                    }
                });
            }
        }
        function getRootDeclaration(node) {
            while (node.kind === 152) {
                node = node.parent.parent;
            }
            return node;
        }
        function getDeclarationContainer(node) {
            node = getRootDeclaration(node);
            return node.kind === 198 ? node.parent.parent.parent : node.parent;
        }
        function getTypeOfPrototypeProperty(prototype) {
            var classType = getDeclaredTypeOfSymbol(prototype.parent);
            return classType.typeParameters ? createTypeReference(classType, ts.map(classType.typeParameters, function (_) { return anyType; })) : classType;
        }
        function getTypeOfPropertyOfType(type, name) {
            var prop = getPropertyOfType(type, name);
            return prop ? getTypeOfSymbol(prop) : undefined;
        }
        function getTypeForBindingElement(declaration) {
            var pattern = declaration.parent;
            var parentType = getTypeForVariableLikeDeclaration(pattern.parent);
            if (parentType === unknownType) {
                return unknownType;
            }
            if (!parentType || parentType === anyType) {
                if (declaration.initializer) {
                    return checkExpressionCached(declaration.initializer);
                }
                return parentType;
            }
            var type;
            if (pattern.kind === 150) {
                var name_2 = declaration.propertyName || declaration.name;
                type = getTypeOfPropertyOfType(parentType, name_2.text) ||
                    isNumericLiteralName(name_2.text) && getIndexTypeOfType(parentType, 1) ||
                    getIndexTypeOfType(parentType, 0);
                if (!type) {
                    error(name_2, ts.Diagnostics.Type_0_has_no_property_1_and_no_string_index_signature, typeToString(parentType), ts.declarationNameToString(name_2));
                    return unknownType;
                }
            }
            else {
                var elementType = checkIteratedTypeOrElementType(parentType, pattern, false);
                if (!declaration.dotDotDotToken) {
                    if (elementType.flags & 1) {
                        return elementType;
                    }
                    var propName = "" + ts.indexOf(pattern.elements, declaration);
                    type = isTupleLikeType(parentType)
                        ? getTypeOfPropertyOfType(parentType, propName)
                        : elementType;
                    if (!type) {
                        if (isTupleType(parentType)) {
                            error(declaration, ts.Diagnostics.Tuple_type_0_with_length_1_cannot_be_assigned_to_tuple_with_length_2, typeToString(parentType), parentType.elementTypes.length, pattern.elements.length);
                        }
                        else {
                            error(declaration, ts.Diagnostics.Type_0_has_no_property_1, typeToString(parentType), propName);
                        }
                        return unknownType;
                    }
                }
                else {
                    type = createArrayType(elementType);
                }
            }
            return type;
        }
        function getTypeForVariableLikeDeclaration(declaration) {
            if (declaration.parent.parent.kind === 187) {
                return anyType;
            }
            if (declaration.parent.parent.kind === 188) {
                return checkRightHandSideOfForOf(declaration.parent.parent.expression) || anyType;
            }
            if (ts.isBindingPattern(declaration.parent)) {
                return getTypeForBindingElement(declaration);
            }
            if (declaration.type) {
                return getTypeFromTypeNode(declaration.type);
            }
            if (declaration.kind === 129) {
                var func = declaration.parent;
                if (func.kind === 137 && !ts.hasDynamicName(func)) {
                    var getter = ts.getDeclarationOfKind(declaration.parent.symbol, 136);
                    if (getter) {
                        return getReturnTypeOfSignature(getSignatureFromDeclaration(getter));
                    }
                }
                var type = getContextuallyTypedParameterType(declaration);
                if (type) {
                    return type;
                }
            }
            if (declaration.initializer) {
                return checkExpressionCached(declaration.initializer);
            }
            if (declaration.kind === 225) {
                return checkIdentifier(declaration.name);
            }
            return undefined;
        }
        function getTypeFromBindingElement(element) {
            if (element.initializer) {
                return getWidenedType(checkExpressionCached(element.initializer));
            }
            if (ts.isBindingPattern(element.name)) {
                return getTypeFromBindingPattern(element.name);
            }
            return anyType;
        }
        function getTypeFromObjectBindingPattern(pattern) {
            var members = {};
            ts.forEach(pattern.elements, function (e) {
                var flags = 4 | 67108864 | (e.initializer ? 536870912 : 0);
                var name = e.propertyName || e.name;
                var symbol = createSymbol(flags, name.text);
                symbol.type = getTypeFromBindingElement(e);
                members[symbol.name] = symbol;
            });
            return createAnonymousType(undefined, members, emptyArray, emptyArray, undefined, undefined);
        }
        function getTypeFromArrayBindingPattern(pattern) {
            var hasSpreadElement = false;
            var elementTypes = [];
            ts.forEach(pattern.elements, function (e) {
                elementTypes.push(e.kind === 175 || e.dotDotDotToken ? anyType : getTypeFromBindingElement(e));
                if (e.dotDotDotToken) {
                    hasSpreadElement = true;
                }
            });
            if (!elementTypes.length) {
                return languageVersion >= 2 ? createIterableType(anyType) : anyArrayType;
            }
            else if (hasSpreadElement) {
                var unionOfElements = getUnionType(elementTypes);
                return languageVersion >= 2 ? createIterableType(unionOfElements) : createArrayType(unionOfElements);
            }
            return createTupleType(elementTypes);
        }
        function getTypeFromBindingPattern(pattern) {
            return pattern.kind === 150
                ? getTypeFromObjectBindingPattern(pattern)
                : getTypeFromArrayBindingPattern(pattern);
        }
        function getWidenedTypeForVariableLikeDeclaration(declaration, reportErrors) {
            var type = getTypeForVariableLikeDeclaration(declaration);
            if (type) {
                if (reportErrors) {
                    reportErrorsFromWidening(declaration, type);
                }
                return declaration.kind !== 224 ? getWidenedType(type) : type;
            }
            if (ts.isBindingPattern(declaration.name)) {
                return getTypeFromBindingPattern(declaration.name);
            }
            type = declaration.dotDotDotToken ? anyArrayType : anyType;
            if (reportErrors && compilerOptions.noImplicitAny) {
                var root = getRootDeclaration(declaration);
                if (!isPrivateWithinAmbient(root) && !(root.kind === 129 && isPrivateWithinAmbient(root.parent))) {
                    reportImplicitAnyError(declaration, type);
                }
            }
            return type;
        }
        function getTypeOfVariableOrParameterOrProperty(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.type) {
                if (symbol.flags & 134217728) {
                    return links.type = getTypeOfPrototypeProperty(symbol);
                }
                var declaration = symbol.valueDeclaration;
                if (declaration.parent.kind === 223) {
                    return links.type = anyType;
                }
                if (declaration.kind === 214) {
                    return links.type = checkExpression(declaration.expression);
                }
                links.type = resolvingType;
                var type = getWidenedTypeForVariableLikeDeclaration(declaration, true);
                if (links.type === resolvingType) {
                    links.type = type;
                }
            }
            else if (links.type === resolvingType) {
                links.type = anyType;
                if (compilerOptions.noImplicitAny) {
                    var diagnostic = symbol.valueDeclaration.type ?
                        ts.Diagnostics._0_implicitly_has_type_any_because_it_is_referenced_directly_or_indirectly_in_its_own_type_annotation :
                        ts.Diagnostics._0_implicitly_has_type_any_because_it_is_does_not_have_a_type_annotation_and_is_referenced_directly_or_indirectly_in_its_own_initializer;
                    error(symbol.valueDeclaration, diagnostic, symbolToString(symbol));
                }
            }
            return links.type;
        }
        function getSetAccessorTypeAnnotationNode(accessor) {
            return accessor && accessor.parameters.length > 0 && accessor.parameters[0].type;
        }
        function getAnnotatedAccessorType(accessor) {
            if (accessor) {
                if (accessor.kind === 136) {
                    return accessor.type && getTypeFromTypeNode(accessor.type);
                }
                else {
                    var setterTypeAnnotation = getSetAccessorTypeAnnotationNode(accessor);
                    return setterTypeAnnotation && getTypeFromTypeNode(setterTypeAnnotation);
                }
            }
            return undefined;
        }
        function getTypeOfAccessors(symbol) {
            var links = getSymbolLinks(symbol);
            checkAndStoreTypeOfAccessors(symbol, links);
            return links.type;
        }
        function checkAndStoreTypeOfAccessors(symbol, links) {
            links = links || getSymbolLinks(symbol);
            if (!links.type) {
                links.type = resolvingType;
                var getter = ts.getDeclarationOfKind(symbol, 136);
                var setter = ts.getDeclarationOfKind(symbol, 137);
                var type;
                var getterReturnType = getAnnotatedAccessorType(getter);
                if (getterReturnType) {
                    type = getterReturnType;
                }
                else {
                    var setterParameterType = getAnnotatedAccessorType(setter);
                    if (setterParameterType) {
                        type = setterParameterType;
                    }
                    else {
                        if (getter && getter.body) {
                            type = getReturnTypeFromBody(getter);
                        }
                        else {
                            if (compilerOptions.noImplicitAny) {
                                error(setter, ts.Diagnostics.Property_0_implicitly_has_type_any_because_its_set_accessor_lacks_a_type_annotation, symbolToString(symbol));
                            }
                            type = anyType;
                        }
                    }
                }
                if (links.type === resolvingType) {
                    links.type = type;
                }
            }
            else if (links.type === resolvingType) {
                links.type = anyType;
                if (compilerOptions.noImplicitAny) {
                    var getter = ts.getDeclarationOfKind(symbol, 136);
                    error(getter, ts.Diagnostics._0_implicitly_has_return_type_any_because_it_does_not_have_a_return_type_annotation_and_is_referenced_directly_or_indirectly_in_one_of_its_return_expressions, symbolToString(symbol));
                }
            }
        }
        function getTypeOfFuncClassEnumModule(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.type) {
                links.type = createObjectType(32768, symbol);
            }
            return links.type;
        }
        function getTypeOfEnumMember(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.type) {
                links.type = getDeclaredTypeOfEnum(getParentOfSymbol(symbol));
            }
            return links.type;
        }
        function getTypeOfAlias(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.type) {
                links.type = getTypeOfSymbol(resolveAlias(symbol));
            }
            return links.type;
        }
        function getTypeOfInstantiatedSymbol(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.type) {
                links.type = instantiateType(getTypeOfSymbol(links.target), links.mapper);
            }
            return links.type;
        }
        function getTypeOfSymbol(symbol) {
            if (symbol.flags & 16777216) {
                return getTypeOfInstantiatedSymbol(symbol);
            }
            if (symbol.flags & (3 | 4)) {
                return getTypeOfVariableOrParameterOrProperty(symbol);
            }
            if (symbol.flags & (16 | 8192 | 32 | 384 | 512)) {
                return getTypeOfFuncClassEnumModule(symbol);
            }
            if (symbol.flags & 8) {
                return getTypeOfEnumMember(symbol);
            }
            if (symbol.flags & 98304) {
                return getTypeOfAccessors(symbol);
            }
            if (symbol.flags & 8388608) {
                return getTypeOfAlias(symbol);
            }
            return unknownType;
        }
        function getTargetType(type) {
            return type.flags & 4096 ? type.target : type;
        }
        function hasBaseType(type, checkBase) {
            return check(type);
            function check(type) {
                var target = getTargetType(type);
                return target === checkBase || ts.forEach(getBaseTypes(target), check);
            }
        }
        function getTypeParametersOfClassOrInterface(symbol) {
            var result;
            ts.forEach(symbol.declarations, function (node) {
                if (node.kind === 202 || node.kind === 201) {
                    var declaration = node;
                    if (declaration.typeParameters && declaration.typeParameters.length) {
                        ts.forEach(declaration.typeParameters, function (node) {
                            var tp = getDeclaredTypeOfTypeParameter(getSymbolOfNode(node));
                            if (!result) {
                                result = [tp];
                            }
                            else if (!ts.contains(result, tp)) {
                                result.push(tp);
                            }
                        });
                    }
                }
            });
            return result;
        }
        function getBaseTypes(type) {
            var typeWithBaseTypes = type;
            if (!typeWithBaseTypes.baseTypes) {
                if (type.symbol.flags & 32) {
                    resolveBaseTypesOfClass(typeWithBaseTypes);
                }
                else if (type.symbol.flags & 64) {
                    resolveBaseTypesOfInterface(typeWithBaseTypes);
                }
                else {
                    ts.Debug.fail("type must be class or interface");
                }
            }
            return typeWithBaseTypes.baseTypes;
        }
        function resolveBaseTypesOfClass(type) {
            type.baseTypes = [];
            var declaration = ts.getDeclarationOfKind(type.symbol, 201);
            var baseTypeNode = ts.getClassExtendsHeritageClauseElement(declaration);
            if (baseTypeNode) {
                var baseType = getTypeFromHeritageClauseElement(baseTypeNode);
                if (baseType !== unknownType) {
                    if (getTargetType(baseType).flags & 1024) {
                        if (type !== baseType && !hasBaseType(baseType, type)) {
                            type.baseTypes.push(baseType);
                        }
                        else {
                            error(declaration, ts.Diagnostics.Type_0_recursively_references_itself_as_a_base_type, typeToString(type, undefined, 1));
                        }
                    }
                    else {
                        error(baseTypeNode, ts.Diagnostics.A_class_may_only_extend_another_class);
                    }
                }
            }
        }
        function resolveBaseTypesOfInterface(type) {
            type.baseTypes = [];
            for (var _i = 0, _a = type.symbol.declarations; _i < _a.length; _i++) {
                var declaration = _a[_i];
                if (declaration.kind === 202 && ts.getInterfaceBaseTypeNodes(declaration)) {
                    for (var _b = 0, _c = ts.getInterfaceBaseTypeNodes(declaration); _b < _c.length; _b++) {
                        var node = _c[_b];
                        var baseType = getTypeFromHeritageClauseElement(node);
                        if (baseType !== unknownType) {
                            if (getTargetType(baseType).flags & (1024 | 2048)) {
                                if (type !== baseType && !hasBaseType(baseType, type)) {
                                    type.baseTypes.push(baseType);
                                }
                                else {
                                    error(declaration, ts.Diagnostics.Type_0_recursively_references_itself_as_a_base_type, typeToString(type, undefined, 1));
                                }
                            }
                            else {
                                error(node, ts.Diagnostics.An_interface_may_only_extend_a_class_or_another_interface);
                            }
                        }
                    }
                }
            }
        }
        function getDeclaredTypeOfClassOrInterface(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.declaredType) {
                var kind = symbol.flags & 32 ? 1024 : 2048;
                var type = links.declaredType = createObjectType(kind, symbol);
                var typeParameters = getTypeParametersOfClassOrInterface(symbol);
                if (typeParameters) {
                    type.flags |= 4096;
                    type.typeParameters = typeParameters;
                    type.instantiations = {};
                    type.instantiations[getTypeListId(type.typeParameters)] = type;
                    type.target = type;
                    type.typeArguments = type.typeParameters;
                }
            }
            return links.declaredType;
        }
        function getDeclaredTypeOfTypeAlias(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.declaredType) {
                links.declaredType = resolvingType;
                var declaration = ts.getDeclarationOfKind(symbol, 203);
                var type = getTypeFromTypeNode(declaration.type);
                if (links.declaredType === resolvingType) {
                    links.declaredType = type;
                }
            }
            else if (links.declaredType === resolvingType) {
                links.declaredType = unknownType;
                var declaration = ts.getDeclarationOfKind(symbol, 203);
                error(declaration.name, ts.Diagnostics.Type_alias_0_circularly_references_itself, symbolToString(symbol));
            }
            return links.declaredType;
        }
        function getDeclaredTypeOfEnum(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.declaredType) {
                var type = createType(128);
                type.symbol = symbol;
                links.declaredType = type;
            }
            return links.declaredType;
        }
        function getDeclaredTypeOfTypeParameter(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.declaredType) {
                var type = createType(512);
                type.symbol = symbol;
                if (!ts.getDeclarationOfKind(symbol, 128).constraint) {
                    type.constraint = noConstraintType;
                }
                links.declaredType = type;
            }
            return links.declaredType;
        }
        function getDeclaredTypeOfAlias(symbol) {
            var links = getSymbolLinks(symbol);
            if (!links.declaredType) {
                links.declaredType = getDeclaredTypeOfSymbol(resolveAlias(symbol));
            }
            return links.declaredType;
        }
        function getDeclaredTypeOfSymbol(symbol) {
            ts.Debug.assert((symbol.flags & 16777216) === 0);
            if (symbol.flags & (32 | 64)) {
                return getDeclaredTypeOfClassOrInterface(symbol);
            }
            if (symbol.flags & 524288) {
                return getDeclaredTypeOfTypeAlias(symbol);
            }
            if (symbol.flags & 384) {
                return getDeclaredTypeOfEnum(symbol);
            }
            if (symbol.flags & 262144) {
                return getDeclaredTypeOfTypeParameter(symbol);
            }
            if (symbol.flags & 8388608) {
                return getDeclaredTypeOfAlias(symbol);
            }
            return unknownType;
        }
        function createSymbolTable(symbols) {
            var result = {};
            for (var _i = 0; _i < symbols.length; _i++) {
                var symbol = symbols[_i];
                result[symbol.name] = symbol;
            }
            return result;
        }
        function createInstantiatedSymbolTable(symbols, mapper) {
            var result = {};
            for (var _i = 0; _i < symbols.length; _i++) {
                var symbol = symbols[_i];
                result[symbol.name] = instantiateSymbol(symbol, mapper);
            }
            return result;
        }
        function addInheritedMembers(symbols, baseSymbols) {
            for (var _i = 0; _i < baseSymbols.length; _i++) {
                var s = baseSymbols[_i];
                if (!ts.hasProperty(symbols, s.name)) {
                    symbols[s.name] = s;
                }
            }
        }
        function addInheritedSignatures(signatures, baseSignatures) {
            if (baseSignatures) {
                for (var _i = 0; _i < baseSignatures.length; _i++) {
                    var signature = baseSignatures[_i];
                    signatures.push(signature);
                }
            }
        }
        function resolveDeclaredMembers(type) {
            if (!type.declaredProperties) {
                var symbol = type.symbol;
                type.declaredProperties = getNamedMembers(symbol.members);
                type.declaredCallSignatures = getSignaturesOfSymbol(symbol.members["__call"]);
                type.declaredConstructSignatures = getSignaturesOfSymbol(symbol.members["__new"]);
                type.declaredStringIndexType = getIndexTypeOfSymbol(symbol, 0);
                type.declaredNumberIndexType = getIndexTypeOfSymbol(symbol, 1);
            }
            return type;
        }
        function resolveClassOrInterfaceMembers(type) {
            var target = resolveDeclaredMembers(type);
            var members = target.symbol.members;
            var callSignatures = target.declaredCallSignatures;
            var constructSignatures = target.declaredConstructSignatures;
            var stringIndexType = target.declaredStringIndexType;
            var numberIndexType = target.declaredNumberIndexType;
            var baseTypes = getBaseTypes(target);
            if (baseTypes.length) {
                members = createSymbolTable(target.declaredProperties);
                for (var _i = 0; _i < baseTypes.length; _i++) {
                    var baseType = baseTypes[_i];
                    addInheritedMembers(members, getPropertiesOfObjectType(baseType));
                    callSignatures = ts.concatenate(callSignatures, getSignaturesOfType(baseType, 0));
                    constructSignatures = ts.concatenate(constructSignatures, getSignaturesOfType(baseType, 1));
                    stringIndexType = stringIndexType || getIndexTypeOfType(baseType, 0);
                    numberIndexType = numberIndexType || getIndexTypeOfType(baseType, 1);
                }
            }
            setObjectTypeMembers(type, members, callSignatures, constructSignatures, stringIndexType, numberIndexType);
        }
        function resolveTypeReferenceMembers(type) {
            var target = resolveDeclaredMembers(type.target);
            var mapper = createTypeMapper(target.typeParameters, type.typeArguments);
            var members = createInstantiatedSymbolTable(target.declaredProperties, mapper);
            var callSignatures = instantiateList(target.declaredCallSignatures, mapper, instantiateSignature);
            var constructSignatures = instantiateList(target.declaredConstructSignatures, mapper, instantiateSignature);
            var stringIndexType = target.declaredStringIndexType ? instantiateType(target.declaredStringIndexType, mapper) : undefined;
            var numberIndexType = target.declaredNumberIndexType ? instantiateType(target.declaredNumberIndexType, mapper) : undefined;
            ts.forEach(getBaseTypes(target), function (baseType) {
                var instantiatedBaseType = instantiateType(baseType, mapper);
                addInheritedMembers(members, getPropertiesOfObjectType(instantiatedBaseType));
                callSignatures = ts.concatenate(callSignatures, getSignaturesOfType(instantiatedBaseType, 0));
                constructSignatures = ts.concatenate(constructSignatures, getSignaturesOfType(instantiatedBaseType, 1));
                stringIndexType = stringIndexType || getIndexTypeOfType(instantiatedBaseType, 0);
                numberIndexType = numberIndexType || getIndexTypeOfType(instantiatedBaseType, 1);
            });
            setObjectTypeMembers(type, members, callSignatures, constructSignatures, stringIndexType, numberIndexType);
        }
        function createSignature(declaration, typeParameters, parameters, resolvedReturnType, minArgumentCount, hasRestParameter, hasStringLiterals) {
            var sig = new Signature(checker);
            sig.declaration = declaration;
            sig.typeParameters = typeParameters;
            sig.parameters = parameters;
            sig.resolvedReturnType = resolvedReturnType;
            sig.minArgumentCount = minArgumentCount;
            sig.hasRestParameter = hasRestParameter;
            sig.hasStringLiterals = hasStringLiterals;
            return sig;
        }
        function cloneSignature(sig) {
            return createSignature(sig.declaration, sig.typeParameters, sig.parameters, sig.resolvedReturnType, sig.minArgumentCount, sig.hasRestParameter, sig.hasStringLiterals);
        }
        function getDefaultConstructSignatures(classType) {
            var baseTypes = getBaseTypes(classType);
            if (baseTypes.length) {
                var baseType = baseTypes[0];
                var baseSignatures = getSignaturesOfType(getTypeOfSymbol(baseType.symbol), 1);
                return ts.map(baseSignatures, function (baseSignature) {
                    var signature = baseType.flags & 4096 ?
                        getSignatureInstantiation(baseSignature, baseType.typeArguments) : cloneSignature(baseSignature);
                    signature.typeParameters = classType.typeParameters;
                    signature.resolvedReturnType = classType;
                    return signature;
                });
            }
            return [createSignature(undefined, classType.typeParameters, emptyArray, classType, 0, false, false)];
        }
        function createTupleTypeMemberSymbols(memberTypes) {
            var members = {};
            for (var i = 0; i < memberTypes.length; i++) {
                var symbol = createSymbol(4 | 67108864, "" + i);
                symbol.type = memberTypes[i];
                members[i] = symbol;
            }
            return members;
        }
        function resolveTupleTypeMembers(type) {
            var arrayType = resolveObjectOrUnionTypeMembers(createArrayType(getUnionType(type.elementTypes)));
            var members = createTupleTypeMemberSymbols(type.elementTypes);
            addInheritedMembers(members, arrayType.properties);
            setObjectTypeMembers(type, members, arrayType.callSignatures, arrayType.constructSignatures, arrayType.stringIndexType, arrayType.numberIndexType);
        }
        function signatureListsIdentical(s, t) {
            if (s.length !== t.length) {
                return false;
            }
            for (var i = 0; i < s.length; i++) {
                if (!compareSignatures(s[i], t[i], false, compareTypes)) {
                    return false;
                }
            }
            return true;
        }
        function getUnionSignatures(types, kind) {
            var signatureLists = ts.map(types, function (t) { return getSignaturesOfType(t, kind); });
            var signatures = signatureLists[0];
            for (var _i = 0; _i < signatures.length; _i++) {
                var signature = signatures[_i];
                if (signature.typeParameters) {
                    return emptyArray;
                }
            }
            for (var i_1 = 1; i_1 < signatureLists.length; i_1++) {
                if (!signatureListsIdentical(signatures, signatureLists[i_1])) {
                    return emptyArray;
                }
            }
            var result = ts.map(signatures, cloneSignature);
            for (var i = 0; i < result.length; i++) {
                var s = result[i];
                s.resolvedReturnType = undefined;
                s.unionSignatures = ts.map(signatureLists, function (signatures) { return signatures[i]; });
            }
            return result;
        }
        function getUnionIndexType(types, kind) {
            var indexTypes = [];
            for (var _i = 0; _i < types.length; _i++) {
                var type = types[_i];
                var indexType = getIndexTypeOfType(type, kind);
                if (!indexType) {
                    return undefined;
                }
                indexTypes.push(indexType);
            }
            return getUnionType(indexTypes);
        }
        function resolveUnionTypeMembers(type) {
            var callSignatures = getUnionSignatures(type.types, 0);
            var constructSignatures = getUnionSignatures(type.types, 1);
            var stringIndexType = getUnionIndexType(type.types, 0);
            var numberIndexType = getUnionIndexType(type.types, 1);
            setObjectTypeMembers(type, emptySymbols, callSignatures, constructSignatures, stringIndexType, numberIndexType);
        }
        function resolveAnonymousTypeMembers(type) {
            var symbol = type.symbol;
            var members;
            var callSignatures;
            var constructSignatures;
            var stringIndexType;
            var numberIndexType;
            if (symbol.flags & 2048) {
                members = symbol.members;
                callSignatures = getSignaturesOfSymbol(members["__call"]);
                constructSignatures = getSignaturesOfSymbol(members["__new"]);
                stringIndexType = getIndexTypeOfSymbol(symbol, 0);
                numberIndexType = getIndexTypeOfSymbol(symbol, 1);
            }
            else {
                members = emptySymbols;
                callSignatures = emptyArray;
                constructSignatures = emptyArray;
                if (symbol.flags & 1952) {
                    members = getExportsOfSymbol(symbol);
                }
                if (symbol.flags & (16 | 8192)) {
                    callSignatures = getSignaturesOfSymbol(symbol);
                }
                if (symbol.flags & 32) {
                    var classType = getDeclaredTypeOfClassOrInterface(symbol);
                    constructSignatures = getSignaturesOfSymbol(symbol.members["__constructor"]);
                    if (!constructSignatures.length) {
                        constructSignatures = getDefaultConstructSignatures(classType);
                    }
                    var baseTypes = getBaseTypes(classType);
                    if (baseTypes.length) {
                        members = createSymbolTable(getNamedMembers(members));
                        addInheritedMembers(members, getPropertiesOfObjectType(getTypeOfSymbol(baseTypes[0].symbol)));
                    }
                }
                stringIndexType = undefined;
                numberIndexType = (symbol.flags & 384) ? stringType : undefined;
            }
            setObjectTypeMembers(type, members, callSignatures, constructSignatures, stringIndexType, numberIndexType);
        }
        function resolveObjectOrUnionTypeMembers(type) {
            if (!type.members) {
                if (type.flags & (1024 | 2048)) {
                    resolveClassOrInterfaceMembers(type);
                }
                else if (type.flags & 32768) {
                    resolveAnonymousTypeMembers(type);
                }
                else if (type.flags & 8192) {
                    resolveTupleTypeMembers(type);
                }
                else if (type.flags & 16384) {
                    resolveUnionTypeMembers(type);
                }
                else {
                    resolveTypeReferenceMembers(type);
                }
            }
            return type;
        }
        function getPropertiesOfObjectType(type) {
            if (type.flags & 48128) {
                return resolveObjectOrUnionTypeMembers(type).properties;
            }
            return emptyArray;
        }
        function getPropertyOfObjectType(type, name) {
            if (type.flags & 48128) {
                var resolved = resolveObjectOrUnionTypeMembers(type);
                if (ts.hasProperty(resolved.members, name)) {
                    var symbol = resolved.members[name];
                    if (symbolIsValue(symbol)) {
                        return symbol;
                    }
                }
            }
        }
        function getPropertiesOfUnionType(type) {
            var result = [];
            ts.forEach(getPropertiesOfType(type.types[0]), function (prop) {
                var unionProp = getPropertyOfUnionType(type, prop.name);
                if (unionProp) {
                    result.push(unionProp);
                }
            });
            return result;
        }
        function getPropertiesOfType(type) {
            type = getApparentType(type);
            return type.flags & 16384 ? getPropertiesOfUnionType(type) : getPropertiesOfObjectType(type);
        }
        function getApparentType(type) {
            if (type.flags & 16384) {
                type = getReducedTypeOfUnionType(type);
            }
            if (type.flags & 512) {
                do {
                    type = getConstraintOfTypeParameter(type);
                } while (type && type.flags & 512);
                if (!type) {
                    type = emptyObjectType;
                }
            }
            if (type.flags & 258) {
                type = globalStringType;
            }
            else if (type.flags & 132) {
                type = globalNumberType;
            }
            else if (type.flags & 8) {
                type = globalBooleanType;
            }
            else if (type.flags & 1048576) {
                type = globalESSymbolType;
            }
            return type;
        }
        function createUnionProperty(unionType, name) {
            var types = unionType.types;
            var props;
            for (var _i = 0; _i < types.length; _i++) {
                var current = types[_i];
                var type = getApparentType(current);
                if (type !== unknownType) {
                    var prop = getPropertyOfType(type, name);
                    if (!prop || getDeclarationFlagsFromSymbol(prop) & (32 | 64)) {
                        return undefined;
                    }
                    if (!props) {
                        props = [prop];
                    }
                    else {
                        props.push(prop);
                    }
                }
            }
            var propTypes = [];
            var declarations = [];
            for (var _a = 0; _a < props.length; _a++) {
                var prop = props[_a];
                if (prop.declarations) {
                    declarations.push.apply(declarations, prop.declarations);
                }
                propTypes.push(getTypeOfSymbol(prop));
            }
            var result = createSymbol(4 | 67108864 | 268435456, name);
            result.unionType = unionType;
            result.declarations = declarations;
            result.type = getUnionType(propTypes);
            return result;
        }
        function getPropertyOfUnionType(type, name) {
            var properties = type.resolvedProperties || (type.resolvedProperties = {});
            if (ts.hasProperty(properties, name)) {
                return properties[name];
            }
            var property = createUnionProperty(type, name);
            if (property) {
                properties[name] = property;
            }
            return property;
        }
        function getPropertyOfType(type, name) {
            type = getApparentType(type);
            if (type.flags & 48128) {
                var resolved = resolveObjectOrUnionTypeMembers(type);
                if (ts.hasProperty(resolved.members, name)) {
                    var symbol = resolved.members[name];
                    if (symbolIsValue(symbol)) {
                        return symbol;
                    }
                }
                if (resolved === anyFunctionType || resolved.callSignatures.length || resolved.constructSignatures.length) {
                    var symbol = getPropertyOfObjectType(globalFunctionType, name);
                    if (symbol) {
                        return symbol;
                    }
                }
                return getPropertyOfObjectType(globalObjectType, name);
            }
            if (type.flags & 16384) {
                return getPropertyOfUnionType(type, name);
            }
            return undefined;
        }
        function getSignaturesOfObjectOrUnionType(type, kind) {
            if (type.flags & (48128 | 16384)) {
                var resolved = resolveObjectOrUnionTypeMembers(type);
                return kind === 0 ? resolved.callSignatures : resolved.constructSignatures;
            }
            return emptyArray;
        }
        function getSignaturesOfType(type, kind) {
            return getSignaturesOfObjectOrUnionType(getApparentType(type), kind);
        }
        function typeHasCallOrConstructSignatures(type) {
            var apparentType = getApparentType(type);
            if (apparentType.flags & (48128 | 16384)) {
                var resolved = resolveObjectOrUnionTypeMembers(type);
                return resolved.callSignatures.length > 0
                    || resolved.constructSignatures.length > 0;
            }
            return false;
        }
        function getIndexTypeOfObjectOrUnionType(type, kind) {
            if (type.flags & (48128 | 16384)) {
                var resolved = resolveObjectOrUnionTypeMembers(type);
                return kind === 0 ? resolved.stringIndexType : resolved.numberIndexType;
            }
        }
        function getIndexTypeOfType(type, kind) {
            return getIndexTypeOfObjectOrUnionType(getApparentType(type), kind);
        }
        function getTypeParametersFromDeclaration(typeParameterDeclarations) {
            var result = [];
            ts.forEach(typeParameterDeclarations, function (node) {
                var tp = getDeclaredTypeOfTypeParameter(node.symbol);
                if (!ts.contains(result, tp)) {
                    result.push(tp);
                }
            });
            return result;
        }
        function symbolsToArray(symbols) {
            var result = [];
            for (var id in symbols) {
                if (!isReservedMemberName(id)) {
                    result.push(symbols[id]);
                }
            }
            return result;
        }
        function getSignatureFromDeclaration(declaration) {
            var links = getNodeLinks(declaration);
            if (!links.resolvedSignature) {
                var classType = declaration.kind === 135 ? getDeclaredTypeOfClassOrInterface(declaration.parent.symbol) : undefined;
                var typeParameters = classType ? classType.typeParameters :
                    declaration.typeParameters ? getTypeParametersFromDeclaration(declaration.typeParameters) : undefined;
                var parameters = [];
                var hasStringLiterals = false;
                var minArgumentCount = -1;
                for (var i = 0, n = declaration.parameters.length; i < n; i++) {
                    var param = declaration.parameters[i];
                    parameters.push(param.symbol);
                    if (param.type && param.type.kind === 8) {
                        hasStringLiterals = true;
                    }
                    if (minArgumentCount < 0) {
                        if (param.initializer || param.questionToken || param.dotDotDotToken) {
                            minArgumentCount = i;
                        }
                    }
                }
                if (minArgumentCount < 0) {
                    minArgumentCount = declaration.parameters.length;
                }
                var returnType;
                if (classType) {
                    returnType = classType;
                }
                else if (declaration.type) {
                    returnType = getTypeFromTypeNode(declaration.type);
                }
                else {
                    if (declaration.kind === 136 && !ts.hasDynamicName(declaration)) {
                        var setter = ts.getDeclarationOfKind(declaration.symbol, 137);
                        returnType = getAnnotatedAccessorType(setter);
                    }
                    if (!returnType && ts.nodeIsMissing(declaration.body)) {
                        returnType = anyType;
                    }
                }
                links.resolvedSignature = createSignature(declaration, typeParameters, parameters, returnType, minArgumentCount, ts.hasRestParameters(declaration), hasStringLiterals);
            }
            return links.resolvedSignature;
        }
        function getSignaturesOfSymbol(symbol) {
            if (!symbol)
                return emptyArray;
            var result = [];
            for (var i = 0, len = symbol.declarations.length; i < len; i++) {
                var node = symbol.declarations[i];
                switch (node.kind) {
                    case 142:
                    case 143:
                    case 200:
                    case 134:
                    case 133:
                    case 135:
                    case 138:
                    case 139:
                    case 140:
                    case 136:
                    case 137:
                    case 162:
                    case 163:
                        if (i > 0 && node.body) {
                            var previous = symbol.declarations[i - 1];
                            if (node.parent === previous.parent && node.kind === previous.kind && node.pos === previous.end) {
                                break;
                            }
                        }
                        result.push(getSignatureFromDeclaration(node));
                }
            }
            return result;
        }
        function getReturnTypeOfSignature(signature) {
            if (!signature.resolvedReturnType) {
                signature.resolvedReturnType = resolvingType;
                var type;
                if (signature.target) {
                    type = instantiateType(getReturnTypeOfSignature(signature.target), signature.mapper);
                }
                else if (signature.unionSignatures) {
                    type = getUnionType(ts.map(signature.unionSignatures, getReturnTypeOfSignature));
                }
                else {
                    type = getReturnTypeFromBody(signature.declaration);
                }
                if (signature.resolvedReturnType === resolvingType) {
                    signature.resolvedReturnType = type;
                }
            }
            else if (signature.resolvedReturnType === resolvingType) {
                signature.resolvedReturnType = anyType;
                if (compilerOptions.noImplicitAny) {
                    var declaration = signature.declaration;
                    if (declaration.name) {
                        error(declaration.name, ts.Diagnostics._0_implicitly_has_return_type_any_because_it_does_not_have_a_return_type_annotation_and_is_referenced_directly_or_indirectly_in_one_of_its_return_expressions, ts.declarationNameToString(declaration.name));
                    }
                    else {
                        error(declaration, ts.Diagnostics.Function_implicitly_has_return_type_any_because_it_does_not_have_a_return_type_annotation_and_is_referenced_directly_or_indirectly_in_one_of_its_return_expressions);
                    }
                }
            }
            return signature.resolvedReturnType;
        }
        function getRestTypeOfSignature(signature) {
            if (signature.hasRestParameter) {
                var type = getTypeOfSymbol(signature.parameters[signature.parameters.length - 1]);
                if (type.flags & 4096 && type.target === globalArrayType) {
                    return type.typeArguments[0];
                }
            }
            return anyType;
        }
        function getSignatureInstantiation(signature, typeArguments) {
            return instantiateSignature(signature, createTypeMapper(signature.typeParameters, typeArguments), true);
        }
        function getErasedSignature(signature) {
            if (!signature.typeParameters)
                return signature;
            if (!signature.erasedSignatureCache) {
                if (signature.target) {
                    signature.erasedSignatureCache = instantiateSignature(getErasedSignature(signature.target), signature.mapper);
                }
                else {
                    signature.erasedSignatureCache = instantiateSignature(signature, createTypeEraser(signature.typeParameters), true);
                }
            }
            return signature.erasedSignatureCache;
        }
        function getOrCreateTypeFromSignature(signature) {
            if (!signature.isolatedSignatureType) {
                var isConstructor = signature.declaration.kind === 135 || signature.declaration.kind === 139;
                var type = createObjectType(32768 | 65536);
                type.members = emptySymbols;
                type.properties = emptyArray;
                type.callSignatures = !isConstructor ? [signature] : emptyArray;
                type.constructSignatures = isConstructor ? [signature] : emptyArray;
                signature.isolatedSignatureType = type;
            }
            return signature.isolatedSignatureType;
        }
        function getIndexSymbol(symbol) {
            return symbol.members["__index"];
        }
        function getIndexDeclarationOfSymbol(symbol, kind) {
            var syntaxKind = kind === 1 ? 119 : 121;
            var indexSymbol = getIndexSymbol(symbol);
            if (indexSymbol) {
                var len = indexSymbol.declarations.length;
                for (var _i = 0, _a = indexSymbol.declarations; _i < _a.length; _i++) {
                    var decl = _a[_i];
                    var node = decl;
                    if (node.parameters.length === 1) {
                        var parameter = node.parameters[0];
                        if (parameter && parameter.type && parameter.type.kind === syntaxKind) {
                            return node;
                        }
                    }
                }
            }
            return undefined;
        }
        function getIndexTypeOfSymbol(symbol, kind) {
            var declaration = getIndexDeclarationOfSymbol(symbol, kind);
            return declaration
                ? declaration.type ? getTypeFromTypeNode(declaration.type) : anyType
                : undefined;
        }
        function getConstraintOfTypeParameter(type) {
            if (!type.constraint) {
                if (type.target) {
                    var targetConstraint = getConstraintOfTypeParameter(type.target);
                    type.constraint = targetConstraint ? instantiateType(targetConstraint, type.mapper) : noConstraintType;
                }
                else {
                    type.constraint = getTypeFromTypeNode(ts.getDeclarationOfKind(type.symbol, 128).constraint);
                }
            }
            return type.constraint === noConstraintType ? undefined : type.constraint;
        }
        function getTypeListId(types) {
            switch (types.length) {
                case 1:
                    return "" + types[0].id;
                case 2:
                    return types[0].id + "," + types[1].id;
                default:
                    var result = "";
                    for (var i = 0; i < types.length; i++) {
                        if (i > 0) {
                            result += ",";
                        }
                        result += types[i].id;
                    }
                    return result;
            }
        }
        function getWideningFlagsOfTypes(types) {
            var result = 0;
            for (var _i = 0; _i < types.length; _i++) {
                var type = types[_i];
                result |= type.flags;
            }
            return result & 786432;
        }
        function createTypeReference(target, typeArguments) {
            var id = getTypeListId(typeArguments);
            var type = target.instantiations[id];
            if (!type) {
                var flags = 4096 | getWideningFlagsOfTypes(typeArguments);
                type = target.instantiations[id] = createObjectType(flags, target.symbol);
                type.target = target;
                type.typeArguments = typeArguments;
            }
            return type;
        }
        function isTypeParameterReferenceIllegalInConstraint(typeReferenceNode, typeParameterSymbol) {
            var links = getNodeLinks(typeReferenceNode);
            if (links.isIllegalTypeReferenceInConstraint !== undefined) {
                return links.isIllegalTypeReferenceInConstraint;
            }
            var currentNode = typeReferenceNode;
            while (!ts.forEach(typeParameterSymbol.declarations, function (d) { return d.parent === currentNode.parent; })) {
                currentNode = currentNode.parent;
            }
            links.isIllegalTypeReferenceInConstraint = currentNode.kind === 128;
            return links.isIllegalTypeReferenceInConstraint;
        }
        function checkTypeParameterHasIllegalReferencesInConstraint(typeParameter) {
            var typeParameterSymbol;
            function check(n) {
                if (n.kind === 141 && n.typeName.kind === 65) {
                    var links = getNodeLinks(n);
                    if (links.isIllegalTypeReferenceInConstraint === undefined) {
                        var symbol = resolveName(typeParameter, n.typeName.text, 793056, undefined, undefined);
                        if (symbol && (symbol.flags & 262144)) {
                            links.isIllegalTypeReferenceInConstraint = ts.forEach(symbol.declarations, function (d) { return d.parent == typeParameter.parent; });
                        }
                    }
                    if (links.isIllegalTypeReferenceInConstraint) {
                        error(typeParameter, ts.Diagnostics.Constraint_of_a_type_parameter_cannot_reference_any_type_parameter_from_the_same_type_parameter_list);
                    }
                }
                ts.forEachChild(n, check);
            }
            if (typeParameter.constraint) {
                typeParameterSymbol = getSymbolOfNode(typeParameter);
                check(typeParameter.constraint);
            }
        }
        function getTypeFromTypeReference(node) {
            return getTypeFromTypeReferenceOrHeritageClauseElement(node);
        }
        function getTypeFromHeritageClauseElement(node) {
            return getTypeFromTypeReferenceOrHeritageClauseElement(node);
        }
        function getTypeFromTypeReferenceOrHeritageClauseElement(node) {
            var links = getNodeLinks(node);
            if (!links.resolvedType) {
                var type;
                if (node.kind !== 177 || ts.isSupportedHeritageClauseElement(node)) {
                    var typeNameOrExpression = node.kind === 141
                        ? node.typeName
                        : node.expression;
                    var symbol = resolveEntityName(typeNameOrExpression, 793056);
                    if (symbol) {
                        if ((symbol.flags & 262144) && isTypeParameterReferenceIllegalInConstraint(node, symbol)) {
                            type = unknownType;
                        }
                        else {
                            type = getDeclaredTypeOfSymbol(symbol);
                            if (type.flags & (1024 | 2048) && type.flags & 4096) {
                                var typeParameters = type.typeParameters;
                                if (node.typeArguments && node.typeArguments.length === typeParameters.length) {
                                    type = createTypeReference(type, ts.map(node.typeArguments, getTypeFromTypeNode));
                                }
                                else {
                                    error(node, ts.Diagnostics.Generic_type_0_requires_1_type_argument_s, typeToString(type, undefined, 1), typeParameters.length);
                                    type = undefined;
                                }
                            }
                            else {
                                if (node.typeArguments) {
                                    error(node, ts.Diagnostics.Type_0_is_not_generic, typeToString(type));
                                    type = undefined;
                                }
                            }
                        }
                    }
                }
                links.resolvedType = type || unknownType;
            }
            return links.resolvedType;
        }
        function getTypeFromTypeQueryNode(node) {
            var links = getNodeLinks(node);
            if (!links.resolvedType) {
                links.resolvedType = getWidenedType(checkExpressionOrQualifiedName(node.exprName));
            }
            return links.resolvedType;
        }
        function getTypeOfGlobalSymbol(symbol, arity) {
            function getTypeDeclaration(symbol) {
                var declarations = symbol.declarations;
                for (var _i = 0; _i < declarations.length; _i++) {
                    var declaration = declarations[_i];
                    switch (declaration.kind) {
                        case 201:
                        case 202:
                        case 204:
                            return declaration;
                    }
                }
            }
            if (!symbol) {
                return emptyObjectType;
            }
            var type = getDeclaredTypeOfSymbol(symbol);
            if (!(type.flags & 48128)) {
                error(getTypeDeclaration(symbol), ts.Diagnostics.Global_type_0_must_be_a_class_or_interface_type, symbol.name);
                return emptyObjectType;
            }
            if ((type.typeParameters ? type.typeParameters.length : 0) !== arity) {
                error(getTypeDeclaration(symbol), ts.Diagnostics.Global_type_0_must_have_1_type_parameter_s, symbol.name, arity);
                return emptyObjectType;
            }
            return type;
        }
        function getGlobalValueSymbol(name) {
            return getGlobalSymbol(name, 107455, ts.Diagnostics.Cannot_find_global_value_0);
        }
        function getGlobalTypeSymbol(name) {
            return getGlobalSymbol(name, 793056, ts.Diagnostics.Cannot_find_global_type_0);
        }
        function getGlobalSymbol(name, meaning, diagnostic) {
            return resolveName(undefined, name, meaning, diagnostic, name);
        }
        function getGlobalType(name, arity) {
            if (arity === void 0) { arity = 0; }
            return getTypeOfGlobalSymbol(getGlobalTypeSymbol(name), arity);
        }
        function getGlobalESSymbolConstructorSymbol() {
            return globalESSymbolConstructorSymbol || (globalESSymbolConstructorSymbol = getGlobalValueSymbol("Symbol"));
        }
        function createIterableType(elementType) {
            return globalIterableType !== emptyObjectType ? createTypeReference(globalIterableType, [elementType]) : emptyObjectType;
        }
        function createArrayType(elementType) {
            var arrayType = globalArrayType || getDeclaredTypeOfSymbol(globalArraySymbol);
            return arrayType !== emptyObjectType ? createTypeReference(arrayType, [elementType]) : emptyObjectType;
        }
        function getTypeFromArrayTypeNode(node) {
            var links = getNodeLinks(node);
            if (!links.resolvedType) {
                links.resolvedType = createArrayType(getTypeFromTypeNode(node.elementType));
            }
            return links.resolvedType;
        }
        function createTupleType(elementTypes) {
            var id = getTypeListId(elementTypes);
            var type = tupleTypes[id];
            if (!type) {
                type = tupleTypes[id] = createObjectType(8192);
                type.elementTypes = elementTypes;
            }
            return type;
        }
        function getTypeFromTupleTypeNode(node) {
            var links = getNodeLinks(node);
            if (!links.resolvedType) {
                links.resolvedType = createTupleType(ts.map(node.elementTypes, getTypeFromTypeNode));
            }
            return links.resolvedType;
        }
        function addTypeToSortedSet(sortedSet, type) {
            if (type.flags & 16384) {
                addTypesToSortedSet(sortedSet, type.types);
            }
            else {
                var i = 0;
                var id = type.id;
                while (i < sortedSet.length && sortedSet[i].id < id) {
                    i++;
                }
                if (i === sortedSet.length || sortedSet[i].id !== id) {
                    sortedSet.splice(i, 0, type);
                }
            }
        }
        function addTypesToSortedSet(sortedTypes, types) {
            for (var _i = 0; _i < types.length; _i++) {
                var type = types[_i];
                addTypeToSortedSet(sortedTypes, type);
            }
        }
        function isSubtypeOfAny(candidate, types) {
            for (var _i = 0; _i < types.length; _i++) {
                var type = types[_i];
                if (candidate !== type && isTypeSubtypeOf(candidate, type)) {
                    return true;
                }
            }
            return false;
        }
        function removeSubtypes(types) {
            var i = types.length;
            while (i > 0) {
                i--;
                if (isSubtypeOfAny(types[i], types)) {
                    types.splice(i, 1);
                }
            }
        }
        function containsAnyType(types) {
            for (var _i = 0; _i < types.length; _i++) {
                var type = types[_i];
                if (type.flags & 1) {
                    return true;
                }
            }
            return false;
        }
        function removeAllButLast(types, typeToRemove) {
            var i = types.length;
            while (i > 0 && types.length > 1) {
                i--;
                if (types[i] === typeToRemove) {
                    types.splice(i, 1);
                }
            }
        }
        function getUnionType(types, noSubtypeReduction) {
            if (types.length === 0) {
                return emptyObjectType;
            }
            var sortedTypes = [];
            addTypesToSortedSet(sortedTypes, types);
            if (noSubtypeReduction) {
                if (containsAnyType(sortedTypes)) {
                    return anyType;
                }
                removeAllButLast(sortedTypes, undefinedType);
                removeAllButLast(sortedTypes, nullType);
            }
            else {
                removeSubtypes(sortedTypes);
            }
            if (sortedTypes.length === 1) {
                return sortedTypes[0];
            }
            var id = getTypeListId(sortedTypes);
            var type = unionTypes[id];
            if (!type) {
                type = unionTypes[id] = createObjectType(16384 | getWideningFlagsOfTypes(sortedTypes));
                type.types = sortedTypes;
                type.reducedType = noSubtypeReduction ? undefined : type;
            }
            return type;
        }
        function getReducedTypeOfUnionType(type) {
            if (!type.reducedType) {
                type.reducedType = getUnionType(type.types, false);
            }
            return type.reducedType;
        }
        function getTypeFromUnionTypeNode(node) {
            var links = getNodeLinks(node);
            if (!links.resolvedType) {
                links.resolvedType = getUnionType(ts.map(node.types, getTypeFromTypeNode), true);
            }
            return links.resolvedType;
        }
        function getTypeFromTypeLiteralOrFunctionOrConstructorTypeNode(node) {
            var links = getNodeLinks(node);
            if (!links.resolvedType) {
                links.resolvedType = createObjectType(32768, node.symbol);
            }
            return links.resolvedType;
        }
        function getStringLiteralType(node) {
            if (ts.hasProperty(stringLiteralTypes, node.text)) {
                return stringLiteralTypes[node.text];
            }
            var type = stringLiteralTypes[node.text] = createType(256);
            type.text = ts.getTextOfNode(node);
            return type;
        }
        function getTypeFromStringLiteral(node) {
            var links = getNodeLinks(node);
            if (!links.resolvedType) {
                links.resolvedType = getStringLiteralType(node);
            }
            return links.resolvedType;
        }
        function getTypeFromTypeNode(node) {
            switch (node.kind) {
                case 112:
                    return anyType;
                case 121:
                    return stringType;
                case 119:
                    return numberType;
                case 113:
                    return booleanType;
                case 122:
                    return esSymbolType;
                case 99:
                    return voidType;
                case 8:
                    return getTypeFromStringLiteral(node);
                case 141:
                    return getTypeFromTypeReference(node);
                case 177:
                    return getTypeFromHeritageClauseElement(node);
                case 144:
                    return getTypeFromTypeQueryNode(node);
                case 146:
                    return getTypeFromArrayTypeNode(node);
                case 147:
                    return getTypeFromTupleTypeNode(node);
                case 148:
                    return getTypeFromUnionTypeNode(node);
                case 149:
                    return getTypeFromTypeNode(node.type);
                case 142:
                case 143:
                case 145:
                    return getTypeFromTypeLiteralOrFunctionOrConstructorTypeNode(node);
                case 65:
                case 126:
                    var symbol = getSymbolInfo(node);
                    return symbol && getDeclaredTypeOfSymbol(symbol);
                default:
                    return unknownType;
            }
        }
        function instantiateList(items, mapper, instantiator) {
            if (items && items.length) {
                var result = [];
                for (var _i = 0; _i < items.length; _i++) {
                    var v = items[_i];
                    result.push(instantiator(v, mapper));
                }
                return result;
            }
            return items;
        }
        function createUnaryTypeMapper(source, target) {
            return function (t) { return t === source ? target : t; };
        }
        function createBinaryTypeMapper(source1, target1, source2, target2) {
            return function (t) { return t === source1 ? target1 : t === source2 ? target2 : t; };
        }
        function createTypeMapper(sources, targets) {
            switch (sources.length) {
                case 1: return createUnaryTypeMapper(sources[0], targets[0]);
                case 2: return createBinaryTypeMapper(sources[0], targets[0], sources[1], targets[1]);
            }
            return function (t) {
                for (var i = 0; i < sources.length; i++) {
                    if (t === sources[i]) {
                        return targets[i];
                    }
                }
                return t;
            };
        }
        function createUnaryTypeEraser(source) {
            return function (t) { return t === source ? anyType : t; };
        }
        function createBinaryTypeEraser(source1, source2) {
            return function (t) { return t === source1 || t === source2 ? anyType : t; };
        }
        function createTypeEraser(sources) {
            switch (sources.length) {
                case 1: return createUnaryTypeEraser(sources[0]);
                case 2: return createBinaryTypeEraser(sources[0], sources[1]);
            }
            return function (t) {
                for (var _i = 0; _i < sources.length; _i++) {
                    var source = sources[_i];
                    if (t === source) {
                        return anyType;
                    }
                }
                return t;
            };
        }
        function createInferenceMapper(context) {
            return function (t) {
                for (var i = 0; i < context.typeParameters.length; i++) {
                    if (t === context.typeParameters[i]) {
                        context.inferences[i].isFixed = true;
                        return getInferredType(context, i);
                    }
                }
                return t;
            };
        }
        function identityMapper(type) {
            return type;
        }
        function combineTypeMappers(mapper1, mapper2) {
            return function (t) { return instantiateType(mapper1(t), mapper2); };
        }
        function instantiateTypeParameter(typeParameter, mapper) {
            var result = createType(512);
            result.symbol = typeParameter.symbol;
            if (typeParameter.constraint) {
                result.constraint = instantiateType(typeParameter.constraint, mapper);
            }
            else {
                result.target = typeParameter;
                result.mapper = mapper;
            }
            return result;
        }
        function instantiateSignature(signature, mapper, eraseTypeParameters) {
            var freshTypeParameters;
            if (signature.typeParameters && !eraseTypeParameters) {
                freshTypeParameters = instantiateList(signature.typeParameters, mapper, instantiateTypeParameter);
                mapper = combineTypeMappers(createTypeMapper(signature.typeParameters, freshTypeParameters), mapper);
            }
            var result = createSignature(signature.declaration, freshTypeParameters, instantiateList(signature.parameters, mapper, instantiateSymbol), signature.resolvedReturnType ? instantiateType(signature.resolvedReturnType, mapper) : undefined, signature.minArgumentCount, signature.hasRestParameter, signature.hasStringLiterals);
            result.target = signature;
            result.mapper = mapper;
            return result;
        }
        function instantiateSymbol(symbol, mapper) {
            if (symbol.flags & 16777216) {
                var links = getSymbolLinks(symbol);
                symbol = links.target;
                mapper = combineTypeMappers(links.mapper, mapper);
            }
            var result = createSymbol(16777216 | 67108864 | symbol.flags, symbol.name);
            result.declarations = symbol.declarations;
            result.parent = symbol.parent;
            result.target = symbol;
            result.mapper = mapper;
            if (symbol.valueDeclaration) {
                result.valueDeclaration = symbol.valueDeclaration;
            }
            return result;
        }
        function instantiateAnonymousType(type, mapper) {
            var result = createObjectType(32768, type.symbol);
            result.properties = instantiateList(getPropertiesOfObjectType(type), mapper, instantiateSymbol);
            result.members = createSymbolTable(result.properties);
            result.callSignatures = instantiateList(getSignaturesOfType(type, 0), mapper, instantiateSignature);
            result.constructSignatures = instantiateList(getSignaturesOfType(type, 1), mapper, instantiateSignature);
            var stringIndexType = getIndexTypeOfType(type, 0);
            var numberIndexType = getIndexTypeOfType(type, 1);
            if (stringIndexType)
                result.stringIndexType = instantiateType(stringIndexType, mapper);
            if (numberIndexType)
                result.numberIndexType = instantiateType(numberIndexType, mapper);
            return result;
        }
        function instantiateType(type, mapper) {
            if (mapper !== identityMapper) {
                if (type.flags & 512) {
                    return mapper(type);
                }
                if (type.flags & 32768) {
                    return type.symbol && type.symbol.flags & (16 | 8192 | 2048 | 4096) ?
                        instantiateAnonymousType(type, mapper) : type;
                }
                if (type.flags & 4096) {
                    return createTypeReference(type.target, instantiateList(type.typeArguments, mapper, instantiateType));
                }
                if (type.flags & 8192) {
                    return createTupleType(instantiateList(type.elementTypes, mapper, instantiateType));
                }
                if (type.flags & 16384) {
                    return getUnionType(instantiateList(type.types, mapper, instantiateType), true);
                }
            }
            return type;
        }
        function isContextSensitive(node) {
            ts.Debug.assert(node.kind !== 134 || ts.isObjectLiteralMethod(node));
            switch (node.kind) {
                case 162:
                case 163:
                    return isContextSensitiveFunctionLikeDeclaration(node);
                case 154:
                    return ts.forEach(node.properties, isContextSensitive);
                case 153:
                    return ts.forEach(node.elements, isContextSensitive);
                case 170:
                    return isContextSensitive(node.whenTrue) ||
                        isContextSensitive(node.whenFalse);
                case 169:
                    return node.operatorToken.kind === 49 &&
                        (isContextSensitive(node.left) || isContextSensitive(node.right));
                case 224:
                    return isContextSensitive(node.initializer);
                case 134:
                case 133:
                    return isContextSensitiveFunctionLikeDeclaration(node);
                case 161:
                    return isContextSensitive(node.expression);
            }
            return false;
        }
        function isContextSensitiveFunctionLikeDeclaration(node) {
            return !node.typeParameters && node.parameters.length && !ts.forEach(node.parameters, function (p) { return p.type; });
        }
        function getTypeWithoutConstructors(type) {
            if (type.flags & 48128) {
                var resolved = resolveObjectOrUnionTypeMembers(type);
                if (resolved.constructSignatures.length) {
                    var result = createObjectType(32768, type.symbol);
                    result.members = resolved.members;
                    result.properties = resolved.properties;
                    result.callSignatures = resolved.callSignatures;
                    result.constructSignatures = emptyArray;
                    type = result;
                }
            }
            return type;
        }
        var subtypeRelation = {};
        var assignableRelation = {};
        var identityRelation = {};
        function isTypeIdenticalTo(source, target) {
            return checkTypeRelatedTo(source, target, identityRelation, undefined);
        }
        function compareTypes(source, target) {
            return checkTypeRelatedTo(source, target, identityRelation, undefined) ? -1 : 0;
        }
        function isTypeSubtypeOf(source, target) {
            return checkTypeSubtypeOf(source, target, undefined);
        }
        function isTypeAssignableTo(source, target) {
            return checkTypeAssignableTo(source, target, undefined);
        }
        function checkTypeSubtypeOf(source, target, errorNode, headMessage, containingMessageChain) {
            return checkTypeRelatedTo(source, target, subtypeRelation, errorNode, headMessage, containingMessageChain);
        }
        function checkTypeAssignableTo(source, target, errorNode, headMessage) {
            return checkTypeRelatedTo(source, target, assignableRelation, errorNode, headMessage);
        }
        function isSignatureAssignableTo(source, target) {
            var sourceType = getOrCreateTypeFromSignature(source);
            var targetType = getOrCreateTypeFromSignature(target);
            return checkTypeRelatedTo(sourceType, targetType, assignableRelation, undefined);
        }
        function checkTypeRelatedTo(source, target, relation, errorNode, headMessage, containingMessageChain) {
            var errorInfo;
            var sourceStack;
            var targetStack;
            var maybeStack;
            var expandingFlags;
            var depth = 0;
            var overflow = false;
            var elaborateErrors = false;
            ts.Debug.assert(relation !== identityRelation || !errorNode, "no error reporting in identity checking");
            var result = isRelatedTo(source, target, errorNode !== undefined, headMessage);
            if (overflow) {
                error(errorNode, ts.Diagnostics.Excessive_stack_depth_comparing_types_0_and_1, typeToString(source), typeToString(target));
            }
            else if (errorInfo) {
                if (errorInfo.next === undefined) {
                    errorInfo = undefined;
                    elaborateErrors = true;
                    isRelatedTo(source, target, errorNode !== undefined, headMessage);
                }
                if (containingMessageChain) {
                    errorInfo = ts.concatenateDiagnosticMessageChains(containingMessageChain, errorInfo);
                }
                diagnostics.add(ts.createDiagnosticForNodeFromMessageChain(errorNode, errorInfo));
            }
            return result !== 0;
            function reportError(message, arg0, arg1, arg2) {
                errorInfo = ts.chainDiagnosticMessages(errorInfo, message, arg0, arg1, arg2);
            }
            function isRelatedTo(source, target, reportErrors, headMessage) {
                var result;
                if (source === target)
                    return -1;
                if (relation !== identityRelation) {
                    if (target.flags & 1)
                        return -1;
                    if (source === undefinedType)
                        return -1;
                    if (source === nullType && target !== undefinedType)
                        return -1;
                    if (source.flags & 128 && target === numberType)
                        return -1;
                    if (source.flags & 256 && target === stringType)
                        return -1;
                    if (relation === assignableRelation) {
                        if (source.flags & 1)
                            return -1;
                        if (source === numberType && target.flags & 128)
                            return -1;
                    }
                }
                var saveErrorInfo = errorInfo;
                if (source.flags & 16384 || target.flags & 16384) {
                    if (relation === identityRelation) {
                        if (source.flags & 16384 && target.flags & 16384) {
                            if (result = unionTypeRelatedToUnionType(source, target)) {
                                if (result &= unionTypeRelatedToUnionType(target, source)) {
                                    return result;
                                }
                            }
                        }
                        else if (source.flags & 16384) {
                            if (result = unionTypeRelatedToType(source, target, reportErrors)) {
                                return result;
                            }
                        }
                        else {
                            if (result = unionTypeRelatedToType(target, source, reportErrors)) {
                                return result;
                            }
                        }
                    }
                    else {
                        if (source.flags & 16384) {
                            if (result = unionTypeRelatedToType(source, target, reportErrors)) {
                                return result;
                            }
                        }
                        else {
                            if (result = typeRelatedToUnionType(source, target, reportErrors)) {
                                return result;
                            }
                        }
                    }
                }
                else if (source.flags & 512 && target.flags & 512) {
                    if (result = typeParameterRelatedTo(source, target, reportErrors)) {
                        return result;
                    }
                }
                else if (source.flags & 4096 && target.flags & 4096 && source.target === target.target) {
                    if (result = typesRelatedTo(source.typeArguments, target.typeArguments, reportErrors)) {
                        return result;
                    }
                }
                var reportStructuralErrors = reportErrors && errorInfo === saveErrorInfo;
                var sourceOrApparentType = relation === identityRelation ? source : getApparentType(source);
                if (sourceOrApparentType.flags & 48128 && target.flags & 48128) {
                    if (result = objectTypeRelatedTo(sourceOrApparentType, target, reportStructuralErrors)) {
                        errorInfo = saveErrorInfo;
                        return result;
                    }
                }
                else if (source.flags & 512 && sourceOrApparentType.flags & 16384) {
                    errorInfo = saveErrorInfo;
                    if (result = isRelatedTo(sourceOrApparentType, target, reportErrors)) {
                        return result;
                    }
                }
                if (reportErrors) {
                    headMessage = headMessage || ts.Diagnostics.Type_0_is_not_assignable_to_type_1;
                    var sourceType = typeToString(source);
                    var targetType = typeToString(target);
                    if (sourceType === targetType) {
                        sourceType = typeToString(source, undefined, 128);
                        targetType = typeToString(target, undefined, 128);
                    }
                    reportError(headMessage, sourceType, targetType);
                }
                return 0;
            }
            function unionTypeRelatedToUnionType(source, target) {
                var result = -1;
                var sourceTypes = source.types;
                for (var _i = 0; _i < sourceTypes.length; _i++) {
                    var sourceType = sourceTypes[_i];
                    var related = typeRelatedToUnionType(sourceType, target, false);
                    if (!related) {
                        return 0;
                    }
                    result &= related;
                }
                return result;
            }
            function typeRelatedToUnionType(source, target, reportErrors) {
                var targetTypes = target.types;
                for (var i = 0, len = targetTypes.length; i < len; i++) {
                    var related = isRelatedTo(source, targetTypes[i], reportErrors && i === len - 1);
                    if (related) {
                        return related;
                    }
                }
                return 0;
            }
            function unionTypeRelatedToType(source, target, reportErrors) {
                var result = -1;
                var sourceTypes = source.types;
                for (var _i = 0; _i < sourceTypes.length; _i++) {
                    var sourceType = sourceTypes[_i];
                    var related = isRelatedTo(sourceType, target, reportErrors);
                    if (!related) {
                        return 0;
                    }
                    result &= related;
                }
                return result;
            }
            function typesRelatedTo(sources, targets, reportErrors) {
                var result = -1;
                for (var i = 0, len = sources.length; i < len; i++) {
                    var related = isRelatedTo(sources[i], targets[i], reportErrors);
                    if (!related) {
                        return 0;
                    }
                    result &= related;
                }
                return result;
            }
            function typeParameterRelatedTo(source, target, reportErrors) {
                if (relation === identityRelation) {
                    if (source.symbol.name !== target.symbol.name) {
                        return 0;
                    }
                    if (source.constraint === target.constraint) {
                        return -1;
                    }
                    if (source.constraint === noConstraintType || target.constraint === noConstraintType) {
                        return 0;
                    }
                    return isRelatedTo(source.constraint, target.constraint, reportErrors);
                }
                else {
                    while (true) {
                        var constraint = getConstraintOfTypeParameter(source);
                        if (constraint === target)
                            return -1;
                        if (!(constraint && constraint.flags & 512))
                            break;
                        source = constraint;
                    }
                    return 0;
                }
            }
            function objectTypeRelatedTo(source, target, reportErrors) {
                if (overflow) {
                    return 0;
                }
                var id = relation !== identityRelation || source.id < target.id ? source.id + "," + target.id : target.id + "," + source.id;
                var related = relation[id];
                if (related !== undefined) {
                    if (!elaborateErrors || (related === 3)) {
                        return related === 1 ? -1 : 0;
                    }
                }
                if (depth > 0) {
                    for (var i = 0; i < depth; i++) {
                        if (maybeStack[i][id]) {
                            return 1;
                        }
                    }
                    if (depth === 100) {
                        overflow = true;
                        return 0;
                    }
                }
                else {
                    sourceStack = [];
                    targetStack = [];
                    maybeStack = [];
                    expandingFlags = 0;
                }
                sourceStack[depth] = source;
                targetStack[depth] = target;
                maybeStack[depth] = {};
                maybeStack[depth][id] = 1;
                depth++;
                var saveExpandingFlags = expandingFlags;
                if (!(expandingFlags & 1) && isDeeplyNestedGeneric(source, sourceStack))
                    expandingFlags |= 1;
                if (!(expandingFlags & 2) && isDeeplyNestedGeneric(target, targetStack))
                    expandingFlags |= 2;
                var result;
                if (expandingFlags === 3) {
                    result = 1;
                }
                else {
                    result = propertiesRelatedTo(source, target, reportErrors);
                    if (result) {
                        result &= signaturesRelatedTo(source, target, 0, reportErrors);
                        if (result) {
                            result &= signaturesRelatedTo(source, target, 1, reportErrors);
                            if (result) {
                                result &= stringIndexTypesRelatedTo(source, target, reportErrors);
                                if (result) {
                                    result &= numberIndexTypesRelatedTo(source, target, reportErrors);
                                }
                            }
                        }
                    }
                }
                expandingFlags = saveExpandingFlags;
                depth--;
                if (result) {
                    var maybeCache = maybeStack[depth];
                    var destinationCache = (result === -1 || depth === 0) ? relation : maybeStack[depth - 1];
                    ts.copyMap(maybeCache, destinationCache);
                }
                else {
                    relation[id] = reportErrors ? 3 : 2;
                }
                return result;
            }
            function isDeeplyNestedGeneric(type, stack) {
                if (type.flags & 4096 && depth >= 10) {
                    var target_1 = type.target;
                    var count = 0;
                    for (var i = 0; i < depth; i++) {
                        var t = stack[i];
                        if (t.flags & 4096 && t.target === target_1) {
                            count++;
                            if (count >= 10)
                                return true;
                        }
                    }
                }
                return false;
            }
            function propertiesRelatedTo(source, target, reportErrors) {
                if (relation === identityRelation) {
                    return propertiesIdenticalTo(source, target);
                }
                var result = -1;
                var properties = getPropertiesOfObjectType(target);
                var requireOptionalProperties = relation === subtypeRelation && !(source.flags & 131072);
                for (var _i = 0; _i < properties.length; _i++) {
                    var targetProp = properties[_i];
                    var sourceProp = getPropertyOfType(source, targetProp.name);
                    if (sourceProp !== targetProp) {
                        if (!sourceProp) {
                            if (!(targetProp.flags & 536870912) || requireOptionalProperties) {
                                if (reportErrors) {
                                    reportError(ts.Diagnostics.Property_0_is_missing_in_type_1, symbolToString(targetProp), typeToString(source));
                                }
                                return 0;
                            }
                        }
                        else if (!(targetProp.flags & 134217728)) {
                            var sourceFlags = getDeclarationFlagsFromSymbol(sourceProp);
                            var targetFlags = getDeclarationFlagsFromSymbol(targetProp);
                            if (sourceFlags & 32 || targetFlags & 32) {
                                if (sourceProp.valueDeclaration !== targetProp.valueDeclaration) {
                                    if (reportErrors) {
                                        if (sourceFlags & 32 && targetFlags & 32) {
                                            reportError(ts.Diagnostics.Types_have_separate_declarations_of_a_private_property_0, symbolToString(targetProp));
                                        }
                                        else {
                                            reportError(ts.Diagnostics.Property_0_is_private_in_type_1_but_not_in_type_2, symbolToString(targetProp), typeToString(sourceFlags & 32 ? source : target), typeToString(sourceFlags & 32 ? target : source));
                                        }
                                    }
                                    return 0;
                                }
                            }
                            else if (targetFlags & 64) {
                                var sourceDeclaredInClass = sourceProp.parent && sourceProp.parent.flags & 32;
                                var sourceClass = sourceDeclaredInClass ? getDeclaredTypeOfSymbol(sourceProp.parent) : undefined;
                                var targetClass = getDeclaredTypeOfSymbol(targetProp.parent);
                                if (!sourceClass || !hasBaseType(sourceClass, targetClass)) {
                                    if (reportErrors) {
                                        reportError(ts.Diagnostics.Property_0_is_protected_but_type_1_is_not_a_class_derived_from_2, symbolToString(targetProp), typeToString(sourceClass || source), typeToString(targetClass));
                                    }
                                    return 0;
                                }
                            }
                            else if (sourceFlags & 64) {
                                if (reportErrors) {
                                    reportError(ts.Diagnostics.Property_0_is_protected_in_type_1_but_public_in_type_2, symbolToString(targetProp), typeToString(source), typeToString(target));
                                }
                                return 0;
                            }
                            var related = isRelatedTo(getTypeOfSymbol(sourceProp), getTypeOfSymbol(targetProp), reportErrors);
                            if (!related) {
                                if (reportErrors) {
                                    reportError(ts.Diagnostics.Types_of_property_0_are_incompatible, symbolToString(targetProp));
                                }
                                return 0;
                            }
                            result &= related;
                            if (sourceProp.flags & 536870912 && !(targetProp.flags & 536870912)) {
                                if (reportErrors) {
                                    reportError(ts.Diagnostics.Property_0_is_optional_in_type_1_but_required_in_type_2, symbolToString(targetProp), typeToString(source), typeToString(target));
                                }
                                return 0;
                            }
                        }
                    }
                }
                return result;
            }
            function propertiesIdenticalTo(source, target) {
                var sourceProperties = getPropertiesOfObjectType(source);
                var targetProperties = getPropertiesOfObjectType(target);
                if (sourceProperties.length !== targetProperties.length) {
                    return 0;
                }
                var result = -1;
                for (var _i = 0; _i < sourceProperties.length; _i++) {
                    var sourceProp = sourceProperties[_i];
                    var targetProp = getPropertyOfObjectType(target, sourceProp.name);
                    if (!targetProp) {
                        return 0;
                    }
                    var related = compareProperties(sourceProp, targetProp, isRelatedTo);
                    if (!related) {
                        return 0;
                    }
                    result &= related;
                }
                return result;
            }
            function signaturesRelatedTo(source, target, kind, reportErrors) {
                if (relation === identityRelation) {
                    return signaturesIdenticalTo(source, target, kind);
                }
                if (target === anyFunctionType || source === anyFunctionType) {
                    return -1;
                }
                var sourceSignatures = getSignaturesOfType(source, kind);
                var targetSignatures = getSignaturesOfType(target, kind);
                var result = -1;
                var saveErrorInfo = errorInfo;
                outer: for (var _i = 0; _i < targetSignatures.length; _i++) {
                    var t = targetSignatures[_i];
                    if (!t.hasStringLiterals || target.flags & 65536) {
                        var localErrors = reportErrors;
                        for (var _a = 0; _a < sourceSignatures.length; _a++) {
                            var s = sourceSignatures[_a];
                            if (!s.hasStringLiterals || source.flags & 65536) {
                                var related = signatureRelatedTo(s, t, localErrors);
                                if (related) {
                                    result &= related;
                                    errorInfo = saveErrorInfo;
                                    continue outer;
                                }
                                localErrors = false;
                            }
                        }
                        return 0;
                    }
                }
                return result;
            }
            function signatureRelatedTo(source, target, reportErrors) {
                if (source === target) {
                    return -1;
                }
                if (!target.hasRestParameter && source.minArgumentCount > target.parameters.length) {
                    return 0;
                }
                var sourceMax = source.parameters.length;
                var targetMax = target.parameters.length;
                var checkCount;
                if (source.hasRestParameter && target.hasRestParameter) {
                    checkCount = sourceMax > targetMax ? sourceMax : targetMax;
                    sourceMax--;
                    targetMax--;
                }
                else if (source.hasRestParameter) {
                    sourceMax--;
                    checkCount = targetMax;
                }
                else if (target.hasRestParameter) {
                    targetMax--;
                    checkCount = sourceMax;
                }
                else {
                    checkCount = sourceMax < targetMax ? sourceMax : targetMax;
                }
                source = getErasedSignature(source);
                target = getErasedSignature(target);
                var result = -1;
                for (var i = 0; i < checkCount; i++) {
                    var s_1 = i < sourceMax ? getTypeOfSymbol(source.parameters[i]) : getRestTypeOfSignature(source);
                    var t_1 = i < targetMax ? getTypeOfSymbol(target.parameters[i]) : getRestTypeOfSignature(target);
                    var saveErrorInfo = errorInfo;
                    var related = isRelatedTo(s_1, t_1, reportErrors);
                    if (!related) {
                        related = isRelatedTo(t_1, s_1, false);
                        if (!related) {
                            if (reportErrors) {
                                reportError(ts.Diagnostics.Types_of_parameters_0_and_1_are_incompatible, source.parameters[i < sourceMax ? i : sourceMax].name, target.parameters[i < targetMax ? i : targetMax].name);
                            }
                            return 0;
                        }
                        errorInfo = saveErrorInfo;
                    }
                    result &= related;
                }
                var t = getReturnTypeOfSignature(target);
                if (t === voidType)
                    return result;
                var s = getReturnTypeOfSignature(source);
                return result & isRelatedTo(s, t, reportErrors);
            }
            function signaturesIdenticalTo(source, target, kind) {
                var sourceSignatures = getSignaturesOfType(source, kind);
                var targetSignatures = getSignaturesOfType(target, kind);
                if (sourceSignatures.length !== targetSignatures.length) {
                    return 0;
                }
                var result = -1;
                for (var i = 0, len = sourceSignatures.length; i < len; ++i) {
                    var related = compareSignatures(sourceSignatures[i], targetSignatures[i], true, isRelatedTo);
                    if (!related) {
                        return 0;
                    }
                    result &= related;
                }
                return result;
            }
            function stringIndexTypesRelatedTo(source, target, reportErrors) {
                if (relation === identityRelation) {
                    return indexTypesIdenticalTo(0, source, target);
                }
                var targetType = getIndexTypeOfType(target, 0);
                if (targetType) {
                    var sourceType = getIndexTypeOfType(source, 0);
                    if (!sourceType) {
                        if (reportErrors) {
                            reportError(ts.Diagnostics.Index_signature_is_missing_in_type_0, typeToString(source));
                        }
                        return 0;
                    }
                    var related = isRelatedTo(sourceType, targetType, reportErrors);
                    if (!related) {
                        if (reportErrors) {
                            reportError(ts.Diagnostics.Index_signatures_are_incompatible);
                        }
                        return 0;
                    }
                    return related;
                }
                return -1;
            }
            function numberIndexTypesRelatedTo(source, target, reportErrors) {
                if (relation === identityRelation) {
                    return indexTypesIdenticalTo(1, source, target);
                }
                var targetType = getIndexTypeOfType(target, 1);
                if (targetType) {
                    var sourceStringType = getIndexTypeOfType(source, 0);
                    var sourceNumberType = getIndexTypeOfType(source, 1);
                    if (!(sourceStringType || sourceNumberType)) {
                        if (reportErrors) {
                            reportError(ts.Diagnostics.Index_signature_is_missing_in_type_0, typeToString(source));
                        }
                        return 0;
                    }
                    var related;
                    if (sourceStringType && sourceNumberType) {
                        related = isRelatedTo(sourceStringType, targetType, false) || isRelatedTo(sourceNumberType, targetType, reportErrors);
                    }
                    else {
                        related = isRelatedTo(sourceStringType || sourceNumberType, targetType, reportErrors);
                    }
                    if (!related) {
                        if (reportErrors) {
                            reportError(ts.Diagnostics.Index_signatures_are_incompatible);
                        }
                        return 0;
                    }
                    return related;
                }
                return -1;
            }
            function indexTypesIdenticalTo(indexKind, source, target) {
                var targetType = getIndexTypeOfType(target, indexKind);
                var sourceType = getIndexTypeOfType(source, indexKind);
                if (!sourceType && !targetType) {
                    return -1;
                }
                if (sourceType && targetType) {
                    return isRelatedTo(sourceType, targetType);
                }
                return 0;
            }
        }
        function isPropertyIdenticalTo(sourceProp, targetProp) {
            return compareProperties(sourceProp, targetProp, compareTypes) !== 0;
        }
        function compareProperties(sourceProp, targetProp, compareTypes) {
            if (sourceProp === targetProp) {
                return -1;
            }
            var sourcePropAccessibility = getDeclarationFlagsFromSymbol(sourceProp) & (32 | 64);
            var targetPropAccessibility = getDeclarationFlagsFromSymbol(targetProp) & (32 | 64);
            if (sourcePropAccessibility !== targetPropAccessibility) {
                return 0;
            }
            if (sourcePropAccessibility) {
                if (getTargetSymbol(sourceProp) !== getTargetSymbol(targetProp)) {
                    return 0;
                }
            }
            else {
                if ((sourceProp.flags & 536870912) !== (targetProp.flags & 536870912)) {
                    return 0;
                }
            }
            return compareTypes(getTypeOfSymbol(sourceProp), getTypeOfSymbol(targetProp));
        }
        function compareSignatures(source, target, compareReturnTypes, compareTypes) {
            if (source === target) {
                return -1;
            }
            if (source.parameters.length !== target.parameters.length ||
                source.minArgumentCount !== target.minArgumentCount ||
                source.hasRestParameter !== target.hasRestParameter) {
                return 0;
            }
            var result = -1;
            if (source.typeParameters && target.typeParameters) {
                if (source.typeParameters.length !== target.typeParameters.length) {
                    return 0;
                }
                for (var i = 0, len = source.typeParameters.length; i < len; ++i) {
                    var related = compareTypes(source.typeParameters[i], target.typeParameters[i]);
                    if (!related) {
                        return 0;
                    }
                    result &= related;
                }
            }
            else if (source.typeParameters || target.typeParameters) {
                return 0;
            }
            source = getErasedSignature(source);
            target = getErasedSignature(target);
            for (var i = 0, len = source.parameters.length; i < len; i++) {
                var s = source.hasRestParameter && i === len - 1 ? getRestTypeOfSignature(source) : getTypeOfSymbol(source.parameters[i]);
                var t = target.hasRestParameter && i === len - 1 ? getRestTypeOfSignature(target) : getTypeOfSymbol(target.parameters[i]);
                var related = compareTypes(s, t);
                if (!related) {
                    return 0;
                }
                result &= related;
            }
            if (compareReturnTypes) {
                result &= compareTypes(getReturnTypeOfSignature(source), getReturnTypeOfSignature(target));
            }
            return result;
        }
        function isSupertypeOfEach(candidate, types) {
            for (var _i = 0; _i < types.length; _i++) {
                var type = types[_i];
                if (candidate !== type && !isTypeSubtypeOf(type, candidate))
                    return false;
            }
            return true;
        }
        function getCommonSupertype(types) {
            return ts.forEach(types, function (t) { return isSupertypeOfEach(t, types) ? t : undefined; });
        }
        function reportNoCommonSupertypeError(types, errorLocation, errorMessageChainHead) {
            var bestSupertype;
            var bestSupertypeDownfallType;
            var bestSupertypeScore = 0;
            for (var i = 0; i < types.length; i++) {
                var score = 0;
                var downfallType = undefined;
                for (var j = 0; j < types.length; j++) {
                    if (isTypeSubtypeOf(types[j], types[i])) {
                        score++;
                    }
                    else if (!downfallType) {
                        downfallType = types[j];
                    }
                }
                ts.Debug.assert(!!downfallType, "If there is no common supertype, each type should have a downfallType");
                if (score > bestSupertypeScore) {
                    bestSupertype = types[i];
                    bestSupertypeDownfallType = downfallType;
                    bestSupertypeScore = score;
                }
                if (bestSupertypeScore === types.length - 1) {
                    break;
                }
            }
            checkTypeSubtypeOf(bestSupertypeDownfallType, bestSupertype, errorLocation, ts.Diagnostics.Type_argument_candidate_1_is_not_a_valid_type_argument_because_it_is_not_a_supertype_of_candidate_0, errorMessageChainHead);
        }
        function isArrayType(type) {
            return type.flags & 4096 && type.target === globalArrayType;
        }
        function isArrayLikeType(type) {
            return !(type.flags & (32 | 64)) && isTypeAssignableTo(type, anyArrayType);
        }
        function isTupleLikeType(type) {
            return !!getPropertyOfType(type, "0");
        }
        function isTupleType(type) {
            return (type.flags & 8192) && !!type.elementTypes;
        }
        function getWidenedTypeOfObjectLiteral(type) {
            var properties = getPropertiesOfObjectType(type);
            var members = {};
            ts.forEach(properties, function (p) {
                var propType = getTypeOfSymbol(p);
                var widenedType = getWidenedType(propType);
                if (propType !== widenedType) {
                    var symbol = createSymbol(p.flags | 67108864, p.name);
                    symbol.declarations = p.declarations;
                    symbol.parent = p.parent;
                    symbol.type = widenedType;
                    symbol.target = p;
                    if (p.valueDeclaration)
                        symbol.valueDeclaration = p.valueDeclaration;
                    p = symbol;
                }
                members[p.name] = p;
            });
            var stringIndexType = getIndexTypeOfType(type, 0);
            var numberIndexType = getIndexTypeOfType(type, 1);
            if (stringIndexType)
                stringIndexType = getWidenedType(stringIndexType);
            if (numberIndexType)
                numberIndexType = getWidenedType(numberIndexType);
            return createAnonymousType(type.symbol, members, emptyArray, emptyArray, stringIndexType, numberIndexType);
        }
        function getWidenedType(type) {
            if (type.flags & 786432) {
                if (type.flags & (32 | 64)) {
                    return anyType;
                }
                if (type.flags & 131072) {
                    return getWidenedTypeOfObjectLiteral(type);
                }
                if (type.flags & 16384) {
                    return getUnionType(ts.map(type.types, getWidenedType));
                }
                if (isArrayType(type)) {
                    return createArrayType(getWidenedType(type.typeArguments[0]));
                }
            }
            return type;
        }
        function reportWideningErrorsInType(type) {
            if (type.flags & 16384) {
                var errorReported = false;
                ts.forEach(type.types, function (t) {
                    if (reportWideningErrorsInType(t)) {
                        errorReported = true;
                    }
                });
                return errorReported;
            }
            if (isArrayType(type)) {
                return reportWideningErrorsInType(type.typeArguments[0]);
            }
            if (type.flags & 131072) {
                var errorReported = false;
                ts.forEach(getPropertiesOfObjectType(type), function (p) {
                    var t = getTypeOfSymbol(p);
                    if (t.flags & 262144) {
                        if (!reportWideningErrorsInType(t)) {
                            error(p.valueDeclaration, ts.Diagnostics.Object_literal_s_property_0_implicitly_has_an_1_type, p.name, typeToString(getWidenedType(t)));
                        }
                        errorReported = true;
                    }
                });
                return errorReported;
            }
            return false;
        }
        function reportImplicitAnyError(declaration, type) {
            var typeAsString = typeToString(getWidenedType(type));
            var diagnostic;
            switch (declaration.kind) {
                case 132:
                case 131:
                    diagnostic = ts.Diagnostics.Member_0_implicitly_has_an_1_type;
                    break;
                case 129:
                    diagnostic = declaration.dotDotDotToken ?
                        ts.Diagnostics.Rest_parameter_0_implicitly_has_an_any_type :
                        ts.Diagnostics.Parameter_0_implicitly_has_an_1_type;
                    break;
                case 200:
                case 134:
                case 133:
                case 136:
                case 137:
                case 162:
                case 163:
                    if (!declaration.name) {
                        error(declaration, ts.Diagnostics.Function_expression_which_lacks_return_type_annotation_implicitly_has_an_0_return_type, typeAsString);
                        return;
                    }
                    diagnostic = ts.Diagnostics._0_which_lacks_return_type_annotation_implicitly_has_an_1_return_type;
                    break;
                default:
                    diagnostic = ts.Diagnostics.Variable_0_implicitly_has_an_1_type;
            }
            error(declaration, diagnostic, ts.declarationNameToString(declaration.name), typeAsString);
        }
        function reportErrorsFromWidening(declaration, type) {
            if (produceDiagnostics && compilerOptions.noImplicitAny && type.flags & 262144) {
                if (!reportWideningErrorsInType(type)) {
                    reportImplicitAnyError(declaration, type);
                }
            }
        }
        function forEachMatchingParameterType(source, target, callback) {
            var sourceMax = source.parameters.length;
            var targetMax = target.parameters.length;
            var count;
            if (source.hasRestParameter && target.hasRestParameter) {
                count = sourceMax > targetMax ? sourceMax : targetMax;
                sourceMax--;
                targetMax--;
            }
            else if (source.hasRestParameter) {
                sourceMax--;
                count = targetMax;
            }
            else if (target.hasRestParameter) {
                targetMax--;
                count = sourceMax;
            }
            else {
                count = sourceMax < targetMax ? sourceMax : targetMax;
            }
            for (var i = 0; i < count; i++) {
                var s = i < sourceMax ? getTypeOfSymbol(source.parameters[i]) : getRestTypeOfSignature(source);
                var t = i < targetMax ? getTypeOfSymbol(target.parameters[i]) : getRestTypeOfSignature(target);
                callback(s, t);
            }
        }
        function createInferenceContext(typeParameters, inferUnionTypes) {
            var inferences = [];
            for (var _i = 0; _i < typeParameters.length; _i++) {
                var unused = typeParameters[_i];
                inferences.push({ primary: undefined, secondary: undefined, isFixed: false });
            }
            return {
                typeParameters: typeParameters,
                inferUnionTypes: inferUnionTypes,
                inferences: inferences,
                inferredTypes: new Array(typeParameters.length),
            };
        }
        function inferTypes(context, source, target) {
            var sourceStack;
            var targetStack;
            var depth = 0;
            var inferiority = 0;
            inferFromTypes(source, target);
            function isInProcess(source, target) {
                for (var i = 0; i < depth; i++) {
                    if (source === sourceStack[i] && target === targetStack[i]) {
                        return true;
                    }
                }
                return false;
            }
            function isWithinDepthLimit(type, stack) {
                if (depth >= 5) {
                    var target_2 = type.target;
                    var count = 0;
                    for (var i = 0; i < depth; i++) {
                        var t = stack[i];
                        if (t.flags & 4096 && t.target === target_2) {
                            count++;
                        }
                    }
                    return count < 5;
                }
                return true;
            }
            function inferFromTypes(source, target) {
                if (source === anyFunctionType) {
                    return;
                }
                if (target.flags & 512) {
                    var typeParameters = context.typeParameters;
                    for (var i = 0; i < typeParameters.length; i++) {
                        if (target === typeParameters[i]) {
                            var inferences = context.inferences[i];
                            if (!inferences.isFixed) {
                                var candidates = inferiority ?
                                    inferences.secondary || (inferences.secondary = []) :
                                    inferences.primary || (inferences.primary = []);
                                if (!ts.contains(candidates, source)) {
                                    candidates.push(source);
                                }
                            }
                            return;
                        }
                    }
                }
                else if (source.flags & 4096 && target.flags & 4096 && source.target === target.target) {
                    var sourceTypes = source.typeArguments;
                    var targetTypes = target.typeArguments;
                    for (var i = 0; i < sourceTypes.length; i++) {
                        inferFromTypes(sourceTypes[i], targetTypes[i]);
                    }
                }
                else if (target.flags & 16384) {
                    var targetTypes = target.types;
                    var typeParameterCount = 0;
                    var typeParameter;
                    for (var _i = 0; _i < targetTypes.length; _i++) {
                        var t = targetTypes[_i];
                        if (t.flags & 512 && ts.contains(context.typeParameters, t)) {
                            typeParameter = t;
                            typeParameterCount++;
                        }
                        else {
                            inferFromTypes(source, t);
                        }
                    }
                    if (typeParameterCount === 1) {
                        inferiority++;
                        inferFromTypes(source, typeParameter);
                        inferiority--;
                    }
                }
                else if (source.flags & 16384) {
                    var sourceTypes = source.types;
                    for (var _a = 0; _a < sourceTypes.length; _a++) {
                        var sourceType = sourceTypes[_a];
                        inferFromTypes(sourceType, target);
                    }
                }
                else if (source.flags & 48128 && (target.flags & (4096 | 8192) ||
                    (target.flags & 32768) && target.symbol && target.symbol.flags & (8192 | 2048))) {
                    if (!isInProcess(source, target) && isWithinDepthLimit(source, sourceStack) && isWithinDepthLimit(target, targetStack)) {
                        if (depth === 0) {
                            sourceStack = [];
                            targetStack = [];
                        }
                        sourceStack[depth] = source;
                        targetStack[depth] = target;
                        depth++;
                        inferFromProperties(source, target);
                        inferFromSignatures(source, target, 0);
                        inferFromSignatures(source, target, 1);
                        inferFromIndexTypes(source, target, 0, 0);
                        inferFromIndexTypes(source, target, 1, 1);
                        inferFromIndexTypes(source, target, 0, 1);
                        depth--;
                    }
                }
            }
            function inferFromProperties(source, target) {
                var properties = getPropertiesOfObjectType(target);
                for (var _i = 0; _i < properties.length; _i++) {
                    var targetProp = properties[_i];
                    var sourceProp = getPropertyOfObjectType(source, targetProp.name);
                    if (sourceProp) {
                        inferFromTypes(getTypeOfSymbol(sourceProp), getTypeOfSymbol(targetProp));
                    }
                }
            }
            function inferFromSignatures(source, target, kind) {
                var sourceSignatures = getSignaturesOfType(source, kind);
                var targetSignatures = getSignaturesOfType(target, kind);
                var sourceLen = sourceSignatures.length;
                var targetLen = targetSignatures.length;
                var len = sourceLen < targetLen ? sourceLen : targetLen;
                for (var i = 0; i < len; i++) {
                    inferFromSignature(getErasedSignature(sourceSignatures[sourceLen - len + i]), getErasedSignature(targetSignatures[targetLen - len + i]));
                }
            }
            function inferFromSignature(source, target) {
                forEachMatchingParameterType(source, target, inferFromTypes);
                inferFromTypes(getReturnTypeOfSignature(source), getReturnTypeOfSignature(target));
            }
            function inferFromIndexTypes(source, target, sourceKind, targetKind) {
                var targetIndexType = getIndexTypeOfType(target, targetKind);
                if (targetIndexType) {
                    var sourceIndexType = getIndexTypeOfType(source, sourceKind);
                    if (sourceIndexType) {
                        inferFromTypes(sourceIndexType, targetIndexType);
                    }
                }
            }
        }
        function getInferenceCandidates(context, index) {
            var inferences = context.inferences[index];
            return inferences.primary || inferences.secondary || emptyArray;
        }
        function getInferredType(context, index) {
            var inferredType = context.inferredTypes[index];
            var inferenceSucceeded;
            if (!inferredType) {
                var inferences = getInferenceCandidates(context, index);
                if (inferences.length) {
                    var unionOrSuperType = context.inferUnionTypes ? getUnionType(inferences) : getCommonSupertype(inferences);
                    inferredType = unionOrSuperType ? getWidenedType(unionOrSuperType) : unknownType;
                    inferenceSucceeded = !!unionOrSuperType;
                }
                else {
                    inferredType = emptyObjectType;
                    inferenceSucceeded = true;
                }
                if (inferenceSucceeded) {
                    var constraint = getConstraintOfTypeParameter(context.typeParameters[index]);
                    inferredType = constraint && !isTypeAssignableTo(inferredType, constraint) ? constraint : inferredType;
                }
                else if (context.failedTypeParameterIndex === undefined || context.failedTypeParameterIndex > index) {
                    context.failedTypeParameterIndex = index;
                }
                context.inferredTypes[index] = inferredType;
            }
            return inferredType;
        }
        function getInferredTypes(context) {
            for (var i = 0; i < context.inferredTypes.length; i++) {
                getInferredType(context, i);
            }
            return context.inferredTypes;
        }
        function hasAncestor(node, kind) {
            return ts.getAncestor(node, kind) !== undefined;
        }
        function getResolvedSymbol(node) {
            var links = getNodeLinks(node);
            if (!links.resolvedSymbol) {
                links.resolvedSymbol = (!ts.nodeIsMissing(node) && resolveName(node, node.text, 107455 | 1048576, ts.Diagnostics.Cannot_find_name_0, node)) || unknownSymbol;
            }
            return links.resolvedSymbol;
        }
        function isInTypeQuery(node) {
            while (node) {
                switch (node.kind) {
                    case 144:
                        return true;
                    case 65:
                    case 126:
                        node = node.parent;
                        continue;
                    default:
                        return false;
                }
            }
            ts.Debug.fail("should not get here");
        }
        function removeTypesFromUnionType(type, typeKind, isOfTypeKind, allowEmptyUnionResult) {
            if (type.flags & 16384) {
                var types = type.types;
                if (ts.forEach(types, function (t) { return !!(t.flags & typeKind) === isOfTypeKind; })) {
                    var narrowedType = getUnionType(ts.filter(types, function (t) { return !(t.flags & typeKind) === isOfTypeKind; }));
                    if (allowEmptyUnionResult || narrowedType !== emptyObjectType) {
                        return narrowedType;
                    }
                }
            }
            else if (allowEmptyUnionResult && !!(type.flags & typeKind) === isOfTypeKind) {
                return getUnionType(emptyArray);
            }
            return type;
        }
        function hasInitializer(node) {
            return !!(node.initializer || ts.isBindingPattern(node.parent) && hasInitializer(node.parent.parent));
        }
        function isVariableAssignedWithin(symbol, node) {
            var links = getNodeLinks(node);
            if (links.assignmentChecks) {
                var cachedResult = links.assignmentChecks[symbol.id];
                if (cachedResult !== undefined) {
                    return cachedResult;
                }
            }
            else {
                links.assignmentChecks = {};
            }
            return links.assignmentChecks[symbol.id] = isAssignedIn(node);
            function isAssignedInBinaryExpression(node) {
                if (node.operatorToken.kind >= 53 && node.operatorToken.kind <= 64) {
                    var n = node.left;
                    while (n.kind === 161) {
                        n = n.expression;
                    }
                    if (n.kind === 65 && getResolvedSymbol(n) === symbol) {
                        return true;
                    }
                }
                return ts.forEachChild(node, isAssignedIn);
            }
            function isAssignedInVariableDeclaration(node) {
                if (!ts.isBindingPattern(node.name) && getSymbolOfNode(node) === symbol && hasInitializer(node)) {
                    return true;
                }
                return ts.forEachChild(node, isAssignedIn);
            }
            function isAssignedIn(node) {
                switch (node.kind) {
                    case 169:
                        return isAssignedInBinaryExpression(node);
                    case 198:
                    case 152:
                        return isAssignedInVariableDeclaration(node);
                    case 150:
                    case 151:
                    case 153:
                    case 154:
                    case 155:
                    case 156:
                    case 157:
                    case 158:
                    case 160:
                    case 161:
                    case 167:
                    case 164:
                    case 165:
                    case 166:
                    case 168:
                    case 170:
                    case 173:
                    case 179:
                    case 180:
                    case 182:
                    case 183:
                    case 184:
                    case 185:
                    case 186:
                    case 187:
                    case 188:
                    case 191:
                    case 192:
                    case 193:
                    case 220:
                    case 221:
                    case 194:
                    case 195:
                    case 196:
                    case 223:
                        return ts.forEachChild(node, isAssignedIn);
                }
                return false;
            }
        }
        function resolveLocation(node) {
            var containerNodes = [];
            for (var parent_2 = node.parent; parent_2; parent_2 = parent_2.parent) {
                if ((ts.isExpression(parent_2) || ts.isObjectLiteralMethod(node)) &&
                    isContextSensitive(parent_2)) {
                    containerNodes.unshift(parent_2);
                }
            }
            ts.forEach(containerNodes, function (node) { getTypeOfNode(node); });
        }
        function getSymbolAtLocation(node) {
            resolveLocation(node);
            return getSymbolInfo(node);
        }
        function getTypeAtLocation(node) {
            resolveLocation(node);
            return getTypeOfNode(node);
        }
        function getTypeOfSymbolAtLocation(symbol, node) {
            resolveLocation(node);
            return getNarrowedTypeOfSymbol(symbol, node);
        }
        function getNarrowedTypeOfSymbol(symbol, node) {
            var type = getTypeOfSymbol(symbol);
            if (node && symbol.flags & 3 && type.flags & (1 | 48128 | 16384 | 512)) {
                loop: while (node.parent) {
                    var child = node;
                    node = node.parent;
                    var narrowedType = type;
                    switch (node.kind) {
                        case 183:
                            if (child !== node.expression) {
                                narrowedType = narrowType(type, node.expression, child === node.thenStatement);
                            }
                            break;
                        case 170:
                            if (child !== node.condition) {
                                narrowedType = narrowType(type, node.condition, child === node.whenTrue);
                            }
                            break;
                        case 169:
                            if (child === node.right) {
                                if (node.operatorToken.kind === 48) {
                                    narrowedType = narrowType(type, node.left, true);
                                }
                                else if (node.operatorToken.kind === 49) {
                                    narrowedType = narrowType(type, node.left, false);
                                }
                            }
                            break;
                        case 227:
                        case 205:
                        case 200:
                        case 134:
                        case 133:
                        case 136:
                        case 137:
                        case 135:
                            break loop;
                    }
                    if (narrowedType !== type) {
                        if (isVariableAssignedWithin(symbol, node)) {
                            break;
                        }
                        type = narrowedType;
                    }
                }
            }
            return type;
            function narrowTypeByEquality(type, expr, assumeTrue) {
                if (expr.left.kind !== 165 || expr.right.kind !== 8) {
                    return type;
                }
                var left = expr.left;
                var right = expr.right;
                if (left.expression.kind !== 65 || getResolvedSymbol(left.expression) !== symbol) {
                    return type;
                }
                var typeInfo = primitiveTypeInfo[right.text];
                if (expr.operatorToken.kind === 31) {
                    assumeTrue = !assumeTrue;
                }
                if (assumeTrue) {
                    if (!typeInfo) {
                        return removeTypesFromUnionType(type, 258 | 132 | 8 | 1048576, true, false);
                    }
                    if (isTypeSubtypeOf(typeInfo.type, type)) {
                        return typeInfo.type;
                    }
                    return removeTypesFromUnionType(type, typeInfo.flags, false, false);
                }
                else {
                    if (typeInfo) {
                        return removeTypesFromUnionType(type, typeInfo.flags, true, false);
                    }
                    return type;
                }
            }
            function narrowTypeByAnd(type, expr, assumeTrue) {
                if (assumeTrue) {
                    return narrowType(narrowType(type, expr.left, true), expr.right, true);
                }
                else {
                    return getUnionType([
                        narrowType(type, expr.left, false),
                        narrowType(narrowType(type, expr.left, true), expr.right, false)
                    ]);
                }
            }
            function narrowTypeByOr(type, expr, assumeTrue) {
                if (assumeTrue) {
                    return getUnionType([
                        narrowType(type, expr.left, true),
                        narrowType(narrowType(type, expr.left, false), expr.right, true)
                    ]);
                }
                else {
                    return narrowType(narrowType(type, expr.left, false), expr.right, false);
                }
            }
            function narrowTypeByInstanceof(type, expr, assumeTrue) {
                if (type.flags & 1 || !assumeTrue || expr.left.kind !== 65 || getResolvedSymbol(expr.left) !== symbol) {
                    return type;
                }
                var rightType = checkExpression(expr.right);
                if (!isTypeSubtypeOf(rightType, globalFunctionType)) {
                    return type;
                }
                var prototypeProperty = getPropertyOfType(rightType, "prototype");
                if (!prototypeProperty) {
                    return type;
                }
                var targetType = getTypeOfSymbol(prototypeProperty);
                if (isTypeSubtypeOf(targetType, type)) {
                    return targetType;
                }
                if (type.flags & 16384) {
                    return getUnionType(ts.filter(type.types, function (t) { return isTypeSubtypeOf(t, targetType); }));
                }
                return type;
            }
            function narrowType(type, expr, assumeTrue) {
                switch (expr.kind) {
                    case 161:
                        return narrowType(type, expr.expression, assumeTrue);
                    case 169:
                        var operator = expr.operatorToken.kind;
                        if (operator === 30 || operator === 31) {
                            return narrowTypeByEquality(type, expr, assumeTrue);
                        }
                        else if (operator === 48) {
                            return narrowTypeByAnd(type, expr, assumeTrue);
                        }
                        else if (operator === 49) {
                            return narrowTypeByOr(type, expr, assumeTrue);
                        }
                        else if (operator === 87) {
                            return narrowTypeByInstanceof(type, expr, assumeTrue);
                        }
                        break;
                    case 167:
                        if (expr.operator === 46) {
                            return narrowType(type, expr.operand, !assumeTrue);
                        }
                        break;
                }
                return type;
            }
        }
        function checkIdentifier(node) {
            var symbol = getResolvedSymbol(node);
            if (symbol === argumentsSymbol && ts.getContainingFunction(node).kind === 163 && languageVersion < 2) {
                error(node, ts.Diagnostics.The_arguments_object_cannot_be_referenced_in_an_arrow_function_in_ES3_and_ES5_Consider_using_a_standard_function_expression);
            }
            if (symbol.flags & 8388608 && !isInTypeQuery(node) && !isConstEnumOrConstEnumOnlyModule(resolveAlias(symbol))) {
                markAliasSymbolAsReferenced(symbol);
            }
            checkCollisionWithCapturedSuperVariable(node, node);
            checkCollisionWithCapturedThisVariable(node, node);
            checkBlockScopedBindingCapturedInLoop(node, symbol);
            return getNarrowedTypeOfSymbol(getExportSymbolOfValueSymbolIfExported(symbol), node);
        }
        function isInsideFunction(node, threshold) {
            var current = node;
            while (current && current !== threshold) {
                if (ts.isFunctionLike(current)) {
                    return true;
                }
                current = current.parent;
            }
            return false;
        }
        function checkBlockScopedBindingCapturedInLoop(node, symbol) {
            if (languageVersion >= 2 ||
                (symbol.flags & 2) === 0 ||
                symbol.valueDeclaration.parent.kind === 223) {
                return;
            }
            var container = symbol.valueDeclaration;
            while (container.kind !== 199) {
                container = container.parent;
            }
            container = container.parent;
            if (container.kind === 180) {
                container = container.parent;
            }
            var inFunction = isInsideFunction(node.parent, container);
            var current = container;
            while (current && !ts.nodeStartsNewLexicalEnvironment(current)) {
                if (isIterationStatement(current, false)) {
                    if (inFunction) {
                        grammarErrorOnFirstToken(current, ts.Diagnostics.Loop_contains_block_scoped_variable_0_referenced_by_a_function_in_the_loop_This_is_only_supported_in_ECMAScript_6_or_higher, ts.declarationNameToString(node));
                    }
                    getNodeLinks(symbol.valueDeclaration).flags |= 256;
                    break;
                }
                current = current.parent;
            }
        }
        function captureLexicalThis(node, container) {
            var classNode = container.parent && container.parent.kind === 201 ? container.parent : undefined;
            getNodeLinks(node).flags |= 2;
            if (container.kind === 132 || container.kind === 135) {
                getNodeLinks(classNode).flags |= 4;
            }
            else {
                getNodeLinks(container).flags |= 4;
            }
        }
        function checkThisExpression(node) {
            var container = ts.getThisContainer(node, true);
            var needToCaptureLexicalThis = false;
            if (container.kind === 163) {
                container = ts.getThisContainer(container, false);
                needToCaptureLexicalThis = (languageVersion < 2);
            }
            switch (container.kind) {
                case 205:
                    error(node, ts.Diagnostics.this_cannot_be_referenced_in_a_module_body);
                    break;
                case 204:
                    error(node, ts.Diagnostics.this_cannot_be_referenced_in_current_location);
                    break;
                case 135:
                    if (isInConstructorArgumentInitializer(node, container)) {
                        error(node, ts.Diagnostics.this_cannot_be_referenced_in_constructor_arguments);
                    }
                    break;
                case 132:
                case 131:
                    if (container.flags & 128) {
                        error(node, ts.Diagnostics.this_cannot_be_referenced_in_a_static_property_initializer);
                    }
                    break;
                case 127:
                    error(node, ts.Diagnostics.this_cannot_be_referenced_in_a_computed_property_name);
                    break;
            }
            if (needToCaptureLexicalThis) {
                captureLexicalThis(node, container);
            }
            var classNode = container.parent && container.parent.kind === 201 ? container.parent : undefined;
            if (classNode) {
                var symbol = getSymbolOfNode(classNode);
                return container.flags & 128 ? getTypeOfSymbol(symbol) : getDeclaredTypeOfSymbol(symbol);
            }
            return anyType;
        }
        function isInConstructorArgumentInitializer(node, constructorDecl) {
            for (var n = node; n && n !== constructorDecl; n = n.parent) {
                if (n.kind === 129) {
                    return true;
                }
            }
            return false;
        }
        function checkSuperExpression(node) {
            var isCallExpression = node.parent.kind === 157 && node.parent.expression === node;
            var enclosingClass = ts.getAncestor(node, 201);
            var baseClass;
            if (enclosingClass && ts.getClassExtendsHeritageClauseElement(enclosingClass)) {
                var classType = getDeclaredTypeOfSymbol(getSymbolOfNode(enclosingClass));
                var baseTypes = getBaseTypes(classType);
                baseClass = baseTypes.length && baseTypes[0];
            }
            if (!baseClass) {
                error(node, ts.Diagnostics.super_can_only_be_referenced_in_a_derived_class);
                return unknownType;
            }
            var container = ts.getSuperContainer(node, true);
            if (container) {
                var canUseSuperExpression = false;
                var needToCaptureLexicalThis;
                if (isCallExpression) {
                    canUseSuperExpression = container.kind === 135;
                }
                else {
                    needToCaptureLexicalThis = false;
                    while (container && container.kind === 163) {
                        container = ts.getSuperContainer(container, true);
                        needToCaptureLexicalThis = languageVersion < 2;
                    }
                    if (container && container.parent && container.parent.kind === 201) {
                        if (container.flags & 128) {
                            canUseSuperExpression =
                                container.kind === 134 ||
                                    container.kind === 133 ||
                                    container.kind === 136 ||
                                    container.kind === 137;
                        }
                        else {
                            canUseSuperExpression =
                                container.kind === 134 ||
                                    container.kind === 133 ||
                                    container.kind === 136 ||
                                    container.kind === 137 ||
                                    container.kind === 132 ||
                                    container.kind === 131 ||
                                    container.kind === 135;
                        }
                    }
                }
                if (canUseSuperExpression) {
                    var returnType;
                    if ((container.flags & 128) || isCallExpression) {
                        getNodeLinks(node).flags |= 32;
                        returnType = getTypeOfSymbol(baseClass.symbol);
                    }
                    else {
                        getNodeLinks(node).flags |= 16;
                        returnType = baseClass;
                    }
                    if (container.kind === 135 && isInConstructorArgumentInitializer(node, container)) {
                        error(node, ts.Diagnostics.super_cannot_be_referenced_in_constructor_arguments);
                        returnType = unknownType;
                    }
                    if (!isCallExpression && needToCaptureLexicalThis) {
                        captureLexicalThis(node.parent, container);
                    }
                    return returnType;
                }
            }
            if (container && container.kind === 127) {
                error(node, ts.Diagnostics.super_cannot_be_referenced_in_a_computed_property_name);
            }
            else if (isCallExpression) {
                error(node, ts.Diagnostics.Super_calls_are_not_permitted_outside_constructors_or_in_nested_functions_inside_constructors);
            }
            else {
                error(node, ts.Diagnostics.super_property_access_is_permitted_only_in_a_constructor_member_function_or_member_accessor_of_a_derived_class);
            }
            return unknownType;
        }
        function getContextuallyTypedParameterType(parameter) {
            if (isFunctionExpressionOrArrowFunction(parameter.parent)) {
                var func = parameter.parent;
                if (isContextSensitive(func)) {
                    var contextualSignature = getContextualSignature(func);
                    if (contextualSignature) {
                        var funcHasRestParameters = ts.hasRestParameters(func);
                        var len = func.parameters.length - (funcHasRestParameters ? 1 : 0);
                        var indexOfParameter = ts.indexOf(func.parameters, parameter);
                        if (indexOfParameter < len) {
                            return getTypeAtPosition(contextualSignature, indexOfParameter);
                        }
                        if (indexOfParameter === (func.parameters.length - 1) &&
                            funcHasRestParameters && contextualSignature.hasRestParameter && func.parameters.length >= contextualSignature.parameters.length) {
                            return getTypeOfSymbol(contextualSignature.parameters[contextualSignature.parameters.length - 1]);
                        }
                    }
                }
            }
            return undefined;
        }
        function getContextualTypeForInitializerExpression(node) {
            var declaration = node.parent;
            if (node === declaration.initializer) {
                if (declaration.type) {
                    return getTypeFromTypeNode(declaration.type);
                }
                if (declaration.kind === 129) {
                    var type = getContextuallyTypedParameterType(declaration);
                    if (type) {
                        return type;
                    }
                }
                if (ts.isBindingPattern(declaration.name)) {
                    return getTypeFromBindingPattern(declaration.name);
                }
            }
            return undefined;
        }
        function getContextualTypeForReturnExpression(node) {
            var func = ts.getContainingFunction(node);
            if (func) {
                if (func.type || func.kind === 135 || func.kind === 136 && getSetAccessorTypeAnnotationNode(ts.getDeclarationOfKind(func.symbol, 137))) {
                    return getReturnTypeOfSignature(getSignatureFromDeclaration(func));
                }
                var signature = getContextualSignatureForFunctionLikeDeclaration(func);
                if (signature) {
                    return getReturnTypeOfSignature(signature);
                }
            }
            return undefined;
        }
        function getContextualTypeForArgument(callTarget, arg) {
            var args = getEffectiveCallArguments(callTarget);
            var argIndex = ts.indexOf(args, arg);
            if (argIndex >= 0) {
                var signature = getResolvedSignature(callTarget);
                return getTypeAtPosition(signature, argIndex);
            }
            return undefined;
        }
        function getContextualTypeForSubstitutionExpression(template, substitutionExpression) {
            if (template.parent.kind === 159) {
                return getContextualTypeForArgument(template.parent, substitutionExpression);
            }
            return undefined;
        }
        function getContextualTypeForBinaryOperand(node) {
            var binaryExpression = node.parent;
            var operator = binaryExpression.operatorToken.kind;
            if (operator >= 53 && operator <= 64) {
                if (node === binaryExpression.right) {
                    return checkExpression(binaryExpression.left);
                }
            }
            else if (operator === 49) {
                var type = getContextualType(binaryExpression);
                if (!type && node === binaryExpression.right) {
                    type = checkExpression(binaryExpression.left);
                }
                return type;
            }
            return undefined;
        }
        function applyToContextualType(type, mapper) {
            if (!(type.flags & 16384)) {
                return mapper(type);
            }
            var types = type.types;
            var mappedType;
            var mappedTypes;
            for (var _i = 0; _i < types.length; _i++) {
                var current = types[_i];
                var t = mapper(current);
                if (t) {
                    if (!mappedType) {
                        mappedType = t;
                    }
                    else if (!mappedTypes) {
                        mappedTypes = [mappedType, t];
                    }
                    else {
                        mappedTypes.push(t);
                    }
                }
            }
            return mappedTypes ? getUnionType(mappedTypes) : mappedType;
        }
        function getTypeOfPropertyOfContextualType(type, name) {
            return applyToContextualType(type, function (t) {
                var prop = getPropertyOfObjectType(t, name);
                return prop ? getTypeOfSymbol(prop) : undefined;
            });
        }
        function getIndexTypeOfContextualType(type, kind) {
            return applyToContextualType(type, function (t) { return getIndexTypeOfObjectOrUnionType(t, kind); });
        }
        function contextualTypeIsTupleLikeType(type) {
            return !!(type.flags & 16384 ? ts.forEach(type.types, isTupleLikeType) : isTupleLikeType(type));
        }
        function contextualTypeHasIndexSignature(type, kind) {
            return !!(type.flags & 16384 ? ts.forEach(type.types, function (t) { return getIndexTypeOfObjectOrUnionType(t, kind); }) : getIndexTypeOfObjectOrUnionType(type, kind));
        }
        function getContextualTypeForObjectLiteralMethod(node) {
            ts.Debug.assert(ts.isObjectLiteralMethod(node));
            if (isInsideWithStatementBody(node)) {
                return undefined;
            }
            return getContextualTypeForObjectLiteralElement(node);
        }
        function getContextualTypeForObjectLiteralElement(element) {
            var objectLiteral = element.parent;
            var type = getContextualType(objectLiteral);
            if (type) {
                if (!ts.hasDynamicName(element)) {
                    var symbolName = getSymbolOfNode(element).name;
                    var propertyType = getTypeOfPropertyOfContextualType(type, symbolName);
                    if (propertyType) {
                        return propertyType;
                    }
                }
                return isNumericName(element.name) && getIndexTypeOfContextualType(type, 1) ||
                    getIndexTypeOfContextualType(type, 0);
            }
            return undefined;
        }
        function getContextualTypeForElementExpression(node) {
            var arrayLiteral = node.parent;
            var type = getContextualType(arrayLiteral);
            if (type) {
                var index = ts.indexOf(arrayLiteral.elements, node);
                return getTypeOfPropertyOfContextualType(type, "" + index)
                    || getIndexTypeOfContextualType(type, 1)
                    || (languageVersion >= 2 ? checkIteratedType(type, undefined) : undefined);
            }
            return undefined;
        }
        function getContextualTypeForConditionalOperand(node) {
            var conditional = node.parent;
            return node === conditional.whenTrue || node === conditional.whenFalse ? getContextualType(conditional) : undefined;
        }
        function getContextualType(node) {
            if (isInsideWithStatementBody(node)) {
                return undefined;
            }
            if (node.contextualType) {
                return node.contextualType;
            }
            var parent = node.parent;
            switch (parent.kind) {
                case 198:
                case 129:
                case 132:
                case 131:
                case 152:
                    return getContextualTypeForInitializerExpression(node);
                case 163:
                case 191:
                    return getContextualTypeForReturnExpression(node);
                case 157:
                case 158:
                    return getContextualTypeForArgument(parent, node);
                case 160:
                    return getTypeFromTypeNode(parent.type);
                case 169:
                    return getContextualTypeForBinaryOperand(node);
                case 224:
                    return getContextualTypeForObjectLiteralElement(parent);
                case 153:
                    return getContextualTypeForElementExpression(node);
                case 170:
                    return getContextualTypeForConditionalOperand(node);
                case 176:
                    ts.Debug.assert(parent.parent.kind === 171);
                    return getContextualTypeForSubstitutionExpression(parent.parent, node);
                case 161:
                    return getContextualType(parent);
            }
            return undefined;
        }
        function getNonGenericSignature(type) {
            var signatures = getSignaturesOfObjectOrUnionType(type, 0);
            if (signatures.length === 1) {
                var signature = signatures[0];
                if (!signature.typeParameters) {
                    return signature;
                }
            }
        }
        function isFunctionExpressionOrArrowFunction(node) {
            return node.kind === 162 || node.kind === 163;
        }
        function getContextualSignatureForFunctionLikeDeclaration(node) {
            return isFunctionExpressionOrArrowFunction(node) ? getContextualSignature(node) : undefined;
        }
        function getContextualSignature(node) {
            ts.Debug.assert(node.kind !== 134 || ts.isObjectLiteralMethod(node));
            var type = ts.isObjectLiteralMethod(node)
                ? getContextualTypeForObjectLiteralMethod(node)
                : getContextualType(node);
            if (!type) {
                return undefined;
            }
            if (!(type.flags & 16384)) {
                return getNonGenericSignature(type);
            }
            var signatureList;
            var types = type.types;
            for (var _i = 0; _i < types.length; _i++) {
                var current = types[_i];
                if (signatureList &&
                    getSignaturesOfObjectOrUnionType(current, 0).length > 1) {
                    return undefined;
                }
                var signature = getNonGenericSignature(current);
                if (signature) {
                    if (!signatureList) {
                        signatureList = [signature];
                    }
                    else if (!compareSignatures(signatureList[0], signature, false, compareTypes)) {
                        return undefined;
                    }
                    else {
                        signatureList.push(signature);
                    }
                }
            }
            var result;
            if (signatureList) {
                result = cloneSignature(signatureList[0]);
                result.resolvedReturnType = undefined;
                result.unionSignatures = signatureList;
            }
            return result;
        }
        function isInferentialContext(mapper) {
            return mapper && mapper !== identityMapper;
        }
        function isAssignmentTarget(node) {
            var parent = node.parent;
            if (parent.kind === 169 && parent.operatorToken.kind === 53 && parent.left === node) {
                return true;
            }
            if (parent.kind === 224) {
                return isAssignmentTarget(parent.parent);
            }
            if (parent.kind === 153) {
                return isAssignmentTarget(parent);
            }
            return false;
        }
        function checkSpreadElementExpression(node, contextualMapper) {
            var arrayOrIterableType = checkExpressionCached(node.expression, contextualMapper);
            return checkIteratedTypeOrElementType(arrayOrIterableType, node.expression, false);
        }
        function checkArrayLiteral(node, contextualMapper) {
            var elements = node.elements;
            if (!elements.length) {
                return createArrayType(undefinedType);
            }
            var hasSpreadElement = false;
            var elementTypes = [];
            var inDestructuringPattern = isAssignmentTarget(node);
            for (var _i = 0; _i < elements.length; _i++) {
                var e = elements[_i];
                if (inDestructuringPattern && e.kind === 173) {
                    var restArrayType = checkExpression(e.expression, contextualMapper);
                    var restElementType = getIndexTypeOfType(restArrayType, 1) ||
                        (languageVersion >= 2 ? checkIteratedType(restArrayType, undefined) : undefined);
                    if (restElementType) {
                        elementTypes.push(restElementType);
                    }
                }
                else {
                    var type = checkExpression(e, contextualMapper);
                    elementTypes.push(type);
                }
                hasSpreadElement = hasSpreadElement || e.kind === 173;
            }
            if (!hasSpreadElement) {
                var contextualType = getContextualType(node);
                if (contextualType && contextualTypeIsTupleLikeType(contextualType) || inDestructuringPattern) {
                    return createTupleType(elementTypes);
                }
            }
            return createArrayType(getUnionType(elementTypes));
        }
        function isNumericName(name) {
            return name.kind === 127 ? isNumericComputedName(name) : isNumericLiteralName(name.text);
        }
        function isNumericComputedName(name) {
            return allConstituentTypesHaveKind(checkComputedPropertyName(name), 1 | 132);
        }
        function isNumericLiteralName(name) {
            return (+name).toString() === name;
        }
        function checkComputedPropertyName(node) {
            var links = getNodeLinks(node.expression);
            if (!links.resolvedType) {
                links.resolvedType = checkExpression(node.expression);
                if (!allConstituentTypesHaveKind(links.resolvedType, 1 | 132 | 258 | 1048576)) {
                    error(node, ts.Diagnostics.A_computed_property_name_must_be_of_type_string_number_symbol_or_any);
                }
                else {
                    checkThatExpressionIsProperSymbolReference(node.expression, links.resolvedType, true);
                }
            }
            return links.resolvedType;
        }
        function checkObjectLiteral(node, contextualMapper) {
            checkGrammarObjectLiteralExpression(node);
            var propertiesTable = {};
            var propertiesArray = [];
            var contextualType = getContextualType(node);
            var typeFlags;
            for (var _i = 0, _a = node.properties; _i < _a.length; _i++) {
                var memberDecl = _a[_i];
                var member = memberDecl.symbol;
                if (memberDecl.kind === 224 ||
                    memberDecl.kind === 225 ||
                    ts.isObjectLiteralMethod(memberDecl)) {
                    var type = void 0;
                    if (memberDecl.kind === 224) {
                        type = checkPropertyAssignment(memberDecl, contextualMapper);
                    }
                    else if (memberDecl.kind === 134) {
                        type = checkObjectLiteralMethod(memberDecl, contextualMapper);
                    }
                    else {
                        ts.Debug.assert(memberDecl.kind === 225);
                        type = checkExpression(memberDecl.name, contextualMapper);
                    }
                    typeFlags |= type.flags;
                    var prop = createSymbol(4 | 67108864 | member.flags, member.name);
                    prop.declarations = member.declarations;
                    prop.parent = member.parent;
                    if (member.valueDeclaration) {
                        prop.valueDeclaration = member.valueDeclaration;
                    }
                    prop.type = type;
                    prop.target = member;
                    member = prop;
                }
                else {
                    ts.Debug.assert(memberDecl.kind === 136 || memberDecl.kind === 137);
                    checkAccessorDeclaration(memberDecl);
                }
                if (!ts.hasDynamicName(memberDecl)) {
                    propertiesTable[member.name] = member;
                }
                propertiesArray.push(member);
            }
            var stringIndexType = getIndexType(0);
            var numberIndexType = getIndexType(1);
            var result = createAnonymousType(node.symbol, propertiesTable, emptyArray, emptyArray, stringIndexType, numberIndexType);
            result.flags |= 131072 | 524288 | (typeFlags & 262144);
            return result;
            function getIndexType(kind) {
                if (contextualType && contextualTypeHasIndexSignature(contextualType, kind)) {
                    var propTypes = [];
                    for (var i = 0; i < propertiesArray.length; i++) {
                        var propertyDecl = node.properties[i];
                        if (kind === 0 || isNumericName(propertyDecl.name)) {
                            var type = getTypeOfSymbol(propertiesArray[i]);
                            if (!ts.contains(propTypes, type)) {
                                propTypes.push(type);
                            }
                        }
                    }
                    var result_1 = propTypes.length ? getUnionType(propTypes) : undefinedType;
                    typeFlags |= result_1.flags;
                    return result_1;
                }
                return undefined;
            }
        }
        function getDeclarationKindFromSymbol(s) {
            return s.valueDeclaration ? s.valueDeclaration.kind : 132;
        }
        function getDeclarationFlagsFromSymbol(s) {
            return s.valueDeclaration ? ts.getCombinedNodeFlags(s.valueDeclaration) : s.flags & 134217728 ? 16 | 128 : 0;
        }
        function checkClassPropertyAccess(node, left, type, prop) {
            var flags = getDeclarationFlagsFromSymbol(prop);
            if (!(flags & (32 | 64))) {
                return;
            }
            var enclosingClassDeclaration = ts.getAncestor(node, 201);
            var enclosingClass = enclosingClassDeclaration ? getDeclaredTypeOfSymbol(getSymbolOfNode(enclosingClassDeclaration)) : undefined;
            var declaringClass = getDeclaredTypeOfSymbol(prop.parent);
            if (flags & 32) {
                if (declaringClass !== enclosingClass) {
                    error(node, ts.Diagnostics.Property_0_is_private_and_only_accessible_within_class_1, symbolToString(prop), typeToString(declaringClass));
                }
                return;
            }
            if (left.kind === 91) {
                return;
            }
            if (!enclosingClass || !hasBaseType(enclosingClass, declaringClass)) {
                error(node, ts.Diagnostics.Property_0_is_protected_and_only_accessible_within_class_1_and_its_subclasses, symbolToString(prop), typeToString(declaringClass));
                return;
            }
            if (flags & 128) {
                return;
            }
            if (!(getTargetType(type).flags & (1024 | 2048) && hasBaseType(type, enclosingClass))) {
                error(node, ts.Diagnostics.Property_0_is_protected_and_only_accessible_through_an_instance_of_class_1, symbolToString(prop), typeToString(enclosingClass));
            }
        }
        function checkPropertyAccessExpression(node) {
            return checkPropertyAccessExpressionOrQualifiedName(node, node.expression, node.name);
        }
        function checkQualifiedName(node) {
            return checkPropertyAccessExpressionOrQualifiedName(node, node.left, node.right);
        }
        function checkPropertyAccessExpressionOrQualifiedName(node, left, right) {
            var type = checkExpressionOrQualifiedName(left);
            if (type === unknownType)
                return type;
            if (type !== anyType) {
                var apparentType = getApparentType(getWidenedType(type));
                if (apparentType === unknownType) {
                    return unknownType;
                }
                var prop = getPropertyOfType(apparentType, right.text);
                if (!prop) {
                    if (right.text) {
                        error(right, ts.Diagnostics.Property_0_does_not_exist_on_type_1, ts.declarationNameToString(right), typeToString(type));
                    }
                    return unknownType;
                }
                getNodeLinks(node).resolvedSymbol = prop;
                if (prop.parent && prop.parent.flags & 32) {
                    if (left.kind === 91 && getDeclarationKindFromSymbol(prop) !== 134) {
                        error(right, ts.Diagnostics.Only_public_and_protected_methods_of_the_base_class_are_accessible_via_the_super_keyword);
                    }
                    else {
                        checkClassPropertyAccess(node, left, type, prop);
                    }
                }
                return getTypeOfSymbol(prop);
            }
            return anyType;
        }
        function isValidPropertyAccess(node, propertyName) {
            var left = node.kind === 155
                ? node.expression
                : node.left;
            var type = checkExpressionOrQualifiedName(left);
            if (type !== unknownType && type !== anyType) {
                var prop = getPropertyOfType(getWidenedType(type), propertyName);
                if (prop && prop.parent && prop.parent.flags & 32) {
                    if (left.kind === 91 && getDeclarationKindFromSymbol(prop) !== 134) {
                        return false;
                    }
                    else {
                        var modificationCount = diagnostics.getModificationCount();
                        checkClassPropertyAccess(node, left, type, prop);
                        return diagnostics.getModificationCount() === modificationCount;
                    }
                }
            }
            return true;
        }
        function checkIndexedAccess(node) {
            if (!node.argumentExpression) {
                var sourceFile = getSourceFile(node);
                if (node.parent.kind === 158 && node.parent.expression === node) {
                    var start = ts.skipTrivia(sourceFile.text, node.expression.end);
                    var end = node.end;
                    grammarErrorAtPos(sourceFile, start, end - start, ts.Diagnostics.new_T_cannot_be_used_to_create_an_array_Use_new_Array_T_instead);
                }
                else {
                    var start = node.end - "]".length;
                    var end = node.end;
                    grammarErrorAtPos(sourceFile, start, end - start, ts.Diagnostics.Expression_expected);
                }
            }
            var objectType = getApparentType(checkExpression(node.expression));
            var indexType = node.argumentExpression ? checkExpression(node.argumentExpression) : unknownType;
            if (objectType === unknownType) {
                return unknownType;
            }
            var isConstEnum = isConstEnumObjectType(objectType);
            if (isConstEnum &&
                (!node.argumentExpression || node.argumentExpression.kind !== 8)) {
                error(node.argumentExpression, ts.Diagnostics.A_const_enum_member_can_only_be_accessed_using_a_string_literal);
                return unknownType;
            }
            if (node.argumentExpression) {
                var name_3 = getPropertyNameForIndexedAccess(node.argumentExpression, indexType);
                if (name_3 !== undefined) {
                    var prop = getPropertyOfType(objectType, name_3);
                    if (prop) {
                        getNodeLinks(node).resolvedSymbol = prop;
                        return getTypeOfSymbol(prop);
                    }
                    else if (isConstEnum) {
                        error(node.argumentExpression, ts.Diagnostics.Property_0_does_not_exist_on_const_enum_1, name_3, symbolToString(objectType.symbol));
                        return unknownType;
                    }
                }
            }
            if (allConstituentTypesHaveKind(indexType, 1 | 258 | 132 | 1048576)) {
                if (allConstituentTypesHaveKind(indexType, 1 | 132)) {
                    var numberIndexType = getIndexTypeOfType(objectType, 1);
                    if (numberIndexType) {
                        return numberIndexType;
                    }
                }
                var stringIndexType = getIndexTypeOfType(objectType, 0);
                if (stringIndexType) {
                    return stringIndexType;
                }
                if (compilerOptions.noImplicitAny && !compilerOptions.suppressImplicitAnyIndexErrors && objectType !== anyType) {
                    error(node, ts.Diagnostics.Index_signature_of_object_type_implicitly_has_an_any_type);
                }
                return anyType;
            }
            error(node, ts.Diagnostics.An_index_expression_argument_must_be_of_type_string_number_symbol_or_any);
            return unknownType;
        }
        function getPropertyNameForIndexedAccess(indexArgumentExpression, indexArgumentType) {
            if (indexArgumentExpression.kind === 8 || indexArgumentExpression.kind === 7) {
                return indexArgumentExpression.text;
            }
            if (checkThatExpressionIsProperSymbolReference(indexArgumentExpression, indexArgumentType, false)) {
                var rightHandSideName = indexArgumentExpression.name.text;
                return ts.getPropertyNameForKnownSymbolName(rightHandSideName);
            }
            return undefined;
        }
        function checkThatExpressionIsProperSymbolReference(expression, expressionType, reportError) {
            if (expressionType === unknownType) {
                return false;
            }
            if (!ts.isWellKnownSymbolSyntactically(expression)) {
                return false;
            }
            if ((expressionType.flags & 1048576) === 0) {
                if (reportError) {
                    error(expression, ts.Diagnostics.A_computed_property_name_of_the_form_0_must_be_of_type_symbol, ts.getTextOfNode(expression));
                }
                return false;
            }
            var leftHandSide = expression.expression;
            var leftHandSideSymbol = getResolvedSymbol(leftHandSide);
            if (!leftHandSideSymbol) {
                return false;
            }
            var globalESSymbol = getGlobalESSymbolConstructorSymbol();
            if (!globalESSymbol) {
                return false;
            }
            if (leftHandSideSymbol !== globalESSymbol) {
                if (reportError) {
                    error(leftHandSide, ts.Diagnostics.Symbol_reference_does_not_refer_to_the_global_Symbol_constructor_object);
                }
                return false;
            }
            return true;
        }
        function resolveUntypedCall(node) {
            if (node.kind === 159) {
                checkExpression(node.template);
            }
            else {
                ts.forEach(node.arguments, function (argument) {
                    checkExpression(argument);
                });
            }
            return anySignature;
        }
        function resolveErrorCall(node) {
            resolveUntypedCall(node);
            return unknownSignature;
        }
        function reorderCandidates(signatures, result) {
            var lastParent;
            var lastSymbol;
            var cutoffIndex = 0;
            var index;
            var specializedIndex = -1;
            var spliceIndex;
            ts.Debug.assert(!result.length);
            for (var _i = 0; _i < signatures.length; _i++) {
                var signature = signatures[_i];
                var symbol = signature.declaration && getSymbolOfNode(signature.declaration);
                var parent_3 = signature.declaration && signature.declaration.parent;
                if (!lastSymbol || symbol === lastSymbol) {
                    if (lastParent && parent_3 === lastParent) {
                        index++;
                    }
                    else {
                        lastParent = parent_3;
                        index = cutoffIndex;
                    }
                }
                else {
                    index = cutoffIndex = result.length;
                    lastParent = parent_3;
                }
                lastSymbol = symbol;
                if (signature.hasStringLiterals) {
                    specializedIndex++;
                    spliceIndex = specializedIndex;
                    cutoffIndex++;
                }
                else {
                    spliceIndex = index;
                }
                result.splice(spliceIndex, 0, signature);
            }
        }
        function getSpreadArgumentIndex(args) {
            for (var i = 0; i < args.length; i++) {
                if (args[i].kind === 173) {
                    return i;
                }
            }
            return -1;
        }
        function hasCorrectArity(node, args, signature) {
            var adjustedArgCount;
            var typeArguments;
            var callIsIncomplete;
            if (node.kind === 159) {
                var tagExpression = node;
                adjustedArgCount = args.length;
                typeArguments = undefined;
                if (tagExpression.template.kind === 171) {
                    var templateExpression = tagExpression.template;
                    var lastSpan = ts.lastOrUndefined(templateExpression.templateSpans);
                    ts.Debug.assert(lastSpan !== undefined);
                    callIsIncomplete = ts.nodeIsMissing(lastSpan.literal) || !!lastSpan.literal.isUnterminated;
                }
                else {
                    var templateLiteral = tagExpression.template;
                    ts.Debug.assert(templateLiteral.kind === 10);
                    callIsIncomplete = !!templateLiteral.isUnterminated;
                }
            }
            else {
                var callExpression = node;
                if (!callExpression.arguments) {
                    ts.Debug.assert(callExpression.kind === 158);
                    return signature.minArgumentCount === 0;
                }
                adjustedArgCount = callExpression.arguments.hasTrailingComma ? args.length + 1 : args.length;
                callIsIncomplete = callExpression.arguments.end === callExpression.end;
                typeArguments = callExpression.typeArguments;
            }
            var hasRightNumberOfTypeArgs = !typeArguments ||
                (signature.typeParameters && typeArguments.length === signature.typeParameters.length);
            if (!hasRightNumberOfTypeArgs) {
                return false;
            }
            var spreadArgIndex = getSpreadArgumentIndex(args);
            if (spreadArgIndex >= 0) {
                return signature.hasRestParameter && spreadArgIndex >= signature.parameters.length - 1;
            }
            if (!signature.hasRestParameter && adjustedArgCount > signature.parameters.length) {
                return false;
            }
            var hasEnoughArguments = adjustedArgCount >= signature.minArgumentCount;
            return callIsIncomplete || hasEnoughArguments;
        }
        function getSingleCallSignature(type) {
            if (type.flags & 48128) {
                var resolved = resolveObjectOrUnionTypeMembers(type);
                if (resolved.callSignatures.length === 1 && resolved.constructSignatures.length === 0 &&
                    resolved.properties.length === 0 && !resolved.stringIndexType && !resolved.numberIndexType) {
                    return resolved.callSignatures[0];
                }
            }
            return undefined;
        }
        function instantiateSignatureInContextOf(signature, contextualSignature, contextualMapper) {
            var context = createInferenceContext(signature.typeParameters, true);
            forEachMatchingParameterType(contextualSignature, signature, function (source, target) {
                inferTypes(context, instantiateType(source, contextualMapper), target);
            });
            return getSignatureInstantiation(signature, getInferredTypes(context));
        }
        function inferTypeArguments(signature, args, excludeArgument, context) {
            var typeParameters = signature.typeParameters;
            var inferenceMapper = createInferenceMapper(context);
            for (var i = 0; i < typeParameters.length; i++) {
                if (!context.inferences[i].isFixed) {
                    context.inferredTypes[i] = undefined;
                }
            }
            if (context.failedTypeParameterIndex !== undefined && !context.inferences[context.failedTypeParameterIndex].isFixed) {
                context.failedTypeParameterIndex = undefined;
            }
            for (var i = 0; i < args.length; i++) {
                var arg = args[i];
                if (arg.kind !== 175) {
                    var paramType = getTypeAtPosition(signature, i);
                    var argType = void 0;
                    if (i === 0 && args[i].parent.kind === 159) {
                        argType = globalTemplateStringsArrayType;
                    }
                    else {
                        var mapper = excludeArgument && excludeArgument[i] !== undefined ? identityMapper : inferenceMapper;
                        argType = checkExpressionWithContextualType(arg, paramType, mapper);
                    }
                    inferTypes(context, argType, paramType);
                }
            }
            if (excludeArgument) {
                for (var i = 0; i < args.length; i++) {
                    if (excludeArgument[i] === false) {
                        var arg = args[i];
                        var paramType = getTypeAtPosition(signature, i);
                        inferTypes(context, checkExpressionWithContextualType(arg, paramType, inferenceMapper), paramType);
                    }
                }
            }
            getInferredTypes(context);
        }
        function checkTypeArguments(signature, typeArguments, typeArgumentResultTypes, reportErrors) {
            var typeParameters = signature.typeParameters;
            var typeArgumentsAreAssignable = true;
            for (var i = 0; i < typeParameters.length; i++) {
                var typeArgNode = typeArguments[i];
                var typeArgument = getTypeFromTypeNode(typeArgNode);
                typeArgumentResultTypes[i] = typeArgument;
                if (typeArgumentsAreAssignable) {
                    var constraint = getConstraintOfTypeParameter(typeParameters[i]);
                    if (constraint) {
                        typeArgumentsAreAssignable = checkTypeAssignableTo(typeArgument, constraint, reportErrors ? typeArgNode : undefined, ts.Diagnostics.Type_0_does_not_satisfy_the_constraint_1);
                    }
                }
            }
            return typeArgumentsAreAssignable;
        }
        function checkApplicableSignature(node, args, signature, relation, excludeArgument, reportErrors) {
            for (var i = 0; i < args.length; i++) {
                var arg = args[i];
                if (arg.kind !== 175) {
                    var paramType = getTypeAtPosition(signature, i);
                    var argType = i === 0 && node.kind === 159
                        ? globalTemplateStringsArrayType
                        : arg.kind === 8 && !reportErrors
                            ? getStringLiteralType(arg)
                            : checkExpressionWithContextualType(arg, paramType, excludeArgument && excludeArgument[i] ? identityMapper : undefined);
                    if (!checkTypeRelatedTo(argType, paramType, relation, reportErrors ? arg : undefined, ts.Diagnostics.Argument_of_type_0_is_not_assignable_to_parameter_of_type_1)) {
                        return false;
                    }
                }
            }
            return true;
        }
        function getEffectiveCallArguments(node) {
            var args;
            if (node.kind === 159) {
                var template = node.template;
                args = [template];
                if (template.kind === 171) {
                    ts.forEach(template.templateSpans, function (span) {
                        args.push(span.expression);
                    });
                }
            }
            else {
                args = node.arguments || emptyArray;
            }
            return args;
        }
        function getEffectiveTypeArguments(callExpression) {
            if (callExpression.expression.kind === 91) {
                var containingClass = ts.getAncestor(callExpression, 201);
                var baseClassTypeNode = containingClass && ts.getClassExtendsHeritageClauseElement(containingClass);
                return baseClassTypeNode && baseClassTypeNode.typeArguments;
            }
            else {
                return callExpression.typeArguments;
            }
        }
        function resolveCall(node, signatures, candidatesOutArray) {
            var isTaggedTemplate = node.kind === 159;
            var typeArguments;
            if (!isTaggedTemplate) {
                typeArguments = getEffectiveTypeArguments(node);
                if (node.expression.kind !== 91) {
                    ts.forEach(typeArguments, checkSourceElement);
                }
            }
            var candidates = candidatesOutArray || [];
            reorderCandidates(signatures, candidates);
            if (!candidates.length) {
                error(node, ts.Diagnostics.Supplied_parameters_do_not_match_any_signature_of_call_target);
                return resolveErrorCall(node);
            }
            var args = getEffectiveCallArguments(node);
            var excludeArgument;
            for (var i = isTaggedTemplate ? 1 : 0; i < args.length; i++) {
                if (isContextSensitive(args[i])) {
                    if (!excludeArgument) {
                        excludeArgument = new Array(args.length);
                    }
                    excludeArgument[i] = true;
                }
            }
            var candidateForArgumentError;
            var candidateForTypeArgumentError;
            var resultOfFailedInference;
            var result;
            if (candidates.length > 1) {
                result = chooseOverload(candidates, subtypeRelation);
            }
            if (!result) {
                candidateForArgumentError = undefined;
                candidateForTypeArgumentError = undefined;
                resultOfFailedInference = undefined;
                result = chooseOverload(candidates, assignableRelation);
            }
            if (result) {
                return result;
            }
            if (candidateForArgumentError) {
                checkApplicableSignature(node, args, candidateForArgumentError, assignableRelation, undefined, true);
            }
            else if (candidateForTypeArgumentError) {
                if (!isTaggedTemplate && node.typeArguments) {
                    checkTypeArguments(candidateForTypeArgumentError, node.typeArguments, [], true);
                }
                else {
                    ts.Debug.assert(resultOfFailedInference.failedTypeParameterIndex >= 0);
                    var failedTypeParameter = candidateForTypeArgumentError.typeParameters[resultOfFailedInference.failedTypeParameterIndex];
                    var inferenceCandidates = getInferenceCandidates(resultOfFailedInference, resultOfFailedInference.failedTypeParameterIndex);
                    var diagnosticChainHead = ts.chainDiagnosticMessages(undefined, ts.Diagnostics.The_type_argument_for_type_parameter_0_cannot_be_inferred_from_the_usage_Consider_specifying_the_type_arguments_explicitly, typeToString(failedTypeParameter));
                    reportNoCommonSupertypeError(inferenceCandidates, node.expression || node.tag, diagnosticChainHead);
                }
            }
            else {
                error(node, ts.Diagnostics.Supplied_parameters_do_not_match_any_signature_of_call_target);
            }
            if (!produceDiagnostics) {
                for (var _i = 0; _i < candidates.length; _i++) {
                    var candidate = candidates[_i];
                    if (hasCorrectArity(node, args, candidate)) {
                        return candidate;
                    }
                }
            }
            return resolveErrorCall(node);
            function chooseOverload(candidates, relation) {
                for (var _i = 0; _i < candidates.length; _i++) {
                    var originalCandidate = candidates[_i];
                    if (!hasCorrectArity(node, args, originalCandidate)) {
                        continue;
                    }
                    var candidate = void 0;
                    var typeArgumentsAreValid = void 0;
                    var inferenceContext = originalCandidate.typeParameters
                        ? createInferenceContext(originalCandidate.typeParameters, false)
                        : undefined;
                    while (true) {
                        candidate = originalCandidate;
                        if (candidate.typeParameters) {
                            var typeArgumentTypes = void 0;
                            if (typeArguments) {
                                typeArgumentTypes = new Array(candidate.typeParameters.length);
                                typeArgumentsAreValid = checkTypeArguments(candidate, typeArguments, typeArgumentTypes, false);
                            }
                            else {
                                inferTypeArguments(candidate, args, excludeArgument, inferenceContext);
                                typeArgumentsAreValid = inferenceContext.failedTypeParameterIndex === undefined;
                                typeArgumentTypes = inferenceContext.inferredTypes;
                            }
                            if (!typeArgumentsAreValid) {
                                break;
                            }
                            candidate = getSignatureInstantiation(candidate, typeArgumentTypes);
                        }
                        if (!checkApplicableSignature(node, args, candidate, relation, excludeArgument, false)) {
                            break;
                        }
                        var index = excludeArgument ? ts.indexOf(excludeArgument, true) : -1;
                        if (index < 0) {
                            return candidate;
                        }
                        excludeArgument[index] = false;
                    }
                    if (originalCandidate.typeParameters) {
                        var instantiatedCandidate = candidate;
                        if (typeArgumentsAreValid) {
                            candidateForArgumentError = instantiatedCandidate;
                        }
                        else {
                            candidateForTypeArgumentError = originalCandidate;
                            if (!typeArguments) {
                                resultOfFailedInference = inferenceContext;
                            }
                        }
                    }
                    else {
                        ts.Debug.assert(originalCandidate === candidate);
                        candidateForArgumentError = originalCandidate;
                    }
                }
                return undefined;
            }
        }
        function resolveCallExpression(node, candidatesOutArray) {
            if (node.expression.kind === 91) {
                var superType = checkSuperExpression(node.expression);
                if (superType !== unknownType) {
                    return resolveCall(node, getSignaturesOfType(superType, 1), candidatesOutArray);
                }
                return resolveUntypedCall(node);
            }
            var funcType = checkExpression(node.expression);
            var apparentType = getApparentType(funcType);
            if (apparentType === unknownType) {
                return resolveErrorCall(node);
            }
            var callSignatures = getSignaturesOfType(apparentType, 0);
            var constructSignatures = getSignaturesOfType(apparentType, 1);
            if (funcType === anyType || (!callSignatures.length && !constructSignatures.length && !(funcType.flags & 16384) && isTypeAssignableTo(funcType, globalFunctionType))) {
                if (node.typeArguments) {
                    error(node, ts.Diagnostics.Untyped_function_calls_may_not_accept_type_arguments);
                }
                return resolveUntypedCall(node);
            }
            if (!callSignatures.length) {
                if (constructSignatures.length) {
                    error(node, ts.Diagnostics.Value_of_type_0_is_not_callable_Did_you_mean_to_include_new, typeToString(funcType));
                }
                else {
                    error(node, ts.Diagnostics.Cannot_invoke_an_expression_whose_type_lacks_a_call_signature);
                }
                return resolveErrorCall(node);
            }
            return resolveCall(node, callSignatures, candidatesOutArray);
        }
        function resolveNewExpression(node, candidatesOutArray) {
            if (node.arguments && languageVersion < 2) {
                var spreadIndex = getSpreadArgumentIndex(node.arguments);
                if (spreadIndex >= 0) {
                    error(node.arguments[spreadIndex], ts.Diagnostics.Spread_operator_in_new_expressions_is_only_available_when_targeting_ECMAScript_6_and_higher);
                }
            }
            var expressionType = checkExpression(node.expression);
            if (expressionType === anyType) {
                if (node.typeArguments) {
                    error(node, ts.Diagnostics.Untyped_function_calls_may_not_accept_type_arguments);
                }
                return resolveUntypedCall(node);
            }
            expressionType = getApparentType(expressionType);
            if (expressionType === unknownType) {
                return resolveErrorCall(node);
            }
            var constructSignatures = getSignaturesOfType(expressionType, 1);
            if (constructSignatures.length) {
                return resolveCall(node, constructSignatures, candidatesOutArray);
            }
            var callSignatures = getSignaturesOfType(expressionType, 0);
            if (callSignatures.length) {
                var signature = resolveCall(node, callSignatures, candidatesOutArray);
                if (getReturnTypeOfSignature(signature) !== voidType) {
                    error(node, ts.Diagnostics.Only_a_void_function_can_be_called_with_the_new_keyword);
                }
                return signature;
            }
            error(node, ts.Diagnostics.Cannot_use_new_with_an_expression_whose_type_lacks_a_call_or_construct_signature);
            return resolveErrorCall(node);
        }
        function resolveTaggedTemplateExpression(node, candidatesOutArray) {
            var tagType = checkExpression(node.tag);
            var apparentType = getApparentType(tagType);
            if (apparentType === unknownType) {
                return resolveErrorCall(node);
            }
            var callSignatures = getSignaturesOfType(apparentType, 0);
            if (tagType === anyType || (!callSignatures.length && !(tagType.flags & 16384) && isTypeAssignableTo(tagType, globalFunctionType))) {
                return resolveUntypedCall(node);
            }
            if (!callSignatures.length) {
                error(node, ts.Diagnostics.Cannot_invoke_an_expression_whose_type_lacks_a_call_signature);
                return resolveErrorCall(node);
            }
            return resolveCall(node, callSignatures, candidatesOutArray);
        }
        function getResolvedSignature(node, candidatesOutArray) {
            var links = getNodeLinks(node);
            if (!links.resolvedSignature || candidatesOutArray) {
                links.resolvedSignature = anySignature;
                if (node.kind === 157) {
                    links.resolvedSignature = resolveCallExpression(node, candidatesOutArray);
                }
                else if (node.kind === 158) {
                    links.resolvedSignature = resolveNewExpression(node, candidatesOutArray);
                }
                else if (node.kind === 159) {
                    links.resolvedSignature = resolveTaggedTemplateExpression(node, candidatesOutArray);
                }
                else {
                    ts.Debug.fail("Branch in 'getResolvedSignature' should be unreachable.");
                }
            }
            return links.resolvedSignature;
        }
        function checkCallExpression(node) {
            checkGrammarTypeArguments(node, node.typeArguments) || checkGrammarArguments(node, node.arguments);
            var signature = getResolvedSignature(node);
            if (node.expression.kind === 91) {
                return voidType;
            }
            if (node.kind === 158) {
                var declaration = signature.declaration;
                if (declaration &&
                    declaration.kind !== 135 &&
                    declaration.kind !== 139 &&
                    declaration.kind !== 143) {
                    if (compilerOptions.noImplicitAny) {
                        error(node, ts.Diagnostics.new_expression_whose_target_lacks_a_construct_signature_implicitly_has_an_any_type);
                    }
                    return anyType;
                }
            }
            return getReturnTypeOfSignature(signature);
        }
        function checkTaggedTemplateExpression(node) {
            return getReturnTypeOfSignature(getResolvedSignature(node));
        }
        function checkTypeAssertion(node) {
            var exprType = checkExpression(node.expression);
            var targetType = getTypeFromTypeNode(node.type);
            if (produceDiagnostics && targetType !== unknownType) {
                var widenedType = getWidenedType(exprType);
                if (!(isTypeAssignableTo(targetType, widenedType))) {
                    checkTypeAssignableTo(exprType, targetType, node, ts.Diagnostics.Neither_type_0_nor_type_1_is_assignable_to_the_other);
                }
            }
            return targetType;
        }
        function getTypeAtPosition(signature, pos) {
            return signature.hasRestParameter ?
                pos < signature.parameters.length - 1 ? getTypeOfSymbol(signature.parameters[pos]) : getRestTypeOfSignature(signature) :
                pos < signature.parameters.length ? getTypeOfSymbol(signature.parameters[pos]) : anyType;
        }
        function assignContextualParameterTypes(signature, context, mapper) {
            var len = signature.parameters.length - (signature.hasRestParameter ? 1 : 0);
            for (var i = 0; i < len; i++) {
                var parameter = signature.parameters[i];
                var links = getSymbolLinks(parameter);
                links.type = instantiateType(getTypeAtPosition(context, i), mapper);
            }
            if (signature.hasRestParameter && context.hasRestParameter && signature.parameters.length >= context.parameters.length) {
                var parameter = signature.parameters[signature.parameters.length - 1];
                var links = getSymbolLinks(parameter);
                links.type = instantiateType(getTypeOfSymbol(context.parameters[context.parameters.length - 1]), mapper);
            }
        }
        function getReturnTypeFromBody(func, contextualMapper) {
            var contextualSignature = getContextualSignatureForFunctionLikeDeclaration(func);
            if (!func.body) {
                return unknownType;
            }
            var type;
            if (func.body.kind !== 179) {
                type = checkExpressionCached(func.body, contextualMapper);
            }
            else {
                var types = checkAndAggregateReturnExpressionTypes(func.body, contextualMapper);
                if (types.length === 0) {
                    return voidType;
                }
                type = contextualSignature ? getUnionType(types) : getCommonSupertype(types);
                if (!type) {
                    error(func, ts.Diagnostics.No_best_common_type_exists_among_return_expressions);
                    return unknownType;
                }
            }
            if (!contextualSignature) {
                reportErrorsFromWidening(func, type);
            }
            return getWidenedType(type);
        }
        function checkAndAggregateReturnExpressionTypes(body, contextualMapper) {
            var aggregatedTypes = [];
            ts.forEachReturnStatement(body, function (returnStatement) {
                var expr = returnStatement.expression;
                if (expr) {
                    var type = checkExpressionCached(expr, contextualMapper);
                    if (!ts.contains(aggregatedTypes, type)) {
                        aggregatedTypes.push(type);
                    }
                }
            });
            return aggregatedTypes;
        }
        function bodyContainsAReturnStatement(funcBody) {
            return ts.forEachReturnStatement(funcBody, function (returnStatement) {
                return true;
            });
        }
        function bodyContainsSingleThrowStatement(body) {
            return (body.statements.length === 1) && (body.statements[0].kind === 195);
        }
        function checkIfNonVoidFunctionHasReturnExpressionsOrSingleThrowStatment(func, returnType) {
            if (!produceDiagnostics) {
                return;
            }
            if (returnType === voidType || returnType === anyType) {
                return;
            }
            if (ts.nodeIsMissing(func.body) || func.body.kind !== 179) {
                return;
            }
            var bodyBlock = func.body;
            if (bodyContainsAReturnStatement(bodyBlock)) {
                return;
            }
            if (bodyContainsSingleThrowStatement(bodyBlock)) {
                return;
            }
            error(func.type, ts.Diagnostics.A_function_whose_declared_type_is_neither_void_nor_any_must_return_a_value_or_consist_of_a_single_throw_statement);
        }
        function checkFunctionExpressionOrObjectLiteralMethod(node, contextualMapper) {
            ts.Debug.assert(node.kind !== 134 || ts.isObjectLiteralMethod(node));
            var hasGrammarError = checkGrammarDeclarationNameInStrictMode(node) || checkGrammarFunctionLikeDeclaration(node);
            if (!hasGrammarError && node.kind === 162) {
                checkGrammarFunctionName(node.name) || checkGrammarForGenerator(node);
            }
            if (contextualMapper === identityMapper && isContextSensitive(node)) {
                return anyFunctionType;
            }
            var links = getNodeLinks(node);
            var type = getTypeOfSymbol(node.symbol);
            if (!(links.flags & 64)) {
                var contextualSignature = getContextualSignature(node);
                if (!(links.flags & 64)) {
                    links.flags |= 64;
                    if (contextualSignature) {
                        var signature = getSignaturesOfType(type, 0)[0];
                        if (isContextSensitive(node)) {
                            assignContextualParameterTypes(signature, contextualSignature, contextualMapper || identityMapper);
                        }
                        if (!node.type) {
                            signature.resolvedReturnType = resolvingType;
                            var returnType = getReturnTypeFromBody(node, contextualMapper);
                            if (signature.resolvedReturnType === resolvingType) {
                                signature.resolvedReturnType = returnType;
                            }
                        }
                    }
                    checkSignatureDeclaration(node);
                }
            }
            if (produceDiagnostics && node.kind !== 134 && node.kind !== 133) {
                checkCollisionWithCapturedSuperVariable(node, node.name);
                checkCollisionWithCapturedThisVariable(node, node.name);
            }
            return type;
        }
        function checkFunctionExpressionOrObjectLiteralMethodBody(node) {
            ts.Debug.assert(node.kind !== 134 || ts.isObjectLiteralMethod(node));
            if (node.type && !node.asteriskToken) {
                checkIfNonVoidFunctionHasReturnExpressionsOrSingleThrowStatment(node, getTypeFromTypeNode(node.type));
            }
            if (node.body) {
                if (node.body.kind === 179) {
                    checkSourceElement(node.body);
                }
                else {
                    var exprType = checkExpression(node.body);
                    if (node.type) {
                        checkTypeAssignableTo(exprType, getTypeFromTypeNode(node.type), node.body, undefined);
                    }
                    checkFunctionExpressionBodies(node.body);
                }
            }
        }
        function checkArithmeticOperandType(operand, type, diagnostic) {
            if (!allConstituentTypesHaveKind(type, 1 | 132)) {
                error(operand, diagnostic);
                return false;
            }
            return true;
        }
        function checkReferenceExpression(n, invalidReferenceMessage, constantVariableMessage) {
            function findSymbol(n) {
                var symbol = getNodeLinks(n).resolvedSymbol;
                return symbol && getExportSymbolOfValueSymbolIfExported(symbol);
            }
            function isReferenceOrErrorExpression(n) {
                switch (n.kind) {
                    case 65: {
                        var symbol = findSymbol(n);
                        return !symbol || symbol === unknownSymbol || symbol === argumentsSymbol || (symbol.flags & 3) !== 0;
                    }
                    case 155: {
                        var symbol = findSymbol(n);
                        return !symbol || symbol === unknownSymbol || (symbol.flags & ~8) !== 0;
                    }
                    case 156:
                        return true;
                    case 161:
                        return isReferenceOrErrorExpression(n.expression);
                    default:
                        return false;
                }
            }
            function isConstVariableReference(n) {
                switch (n.kind) {
                    case 65:
                    case 155: {
                        var symbol = findSymbol(n);
                        return symbol && (symbol.flags & 3) !== 0 && (getDeclarationFlagsFromSymbol(symbol) & 8192) !== 0;
                    }
                    case 156: {
                        var index = n.argumentExpression;
                        var symbol = findSymbol(n.expression);
                        if (symbol && index && index.kind === 8) {
                            var name_4 = index.text;
                            var prop = getPropertyOfType(getTypeOfSymbol(symbol), name_4);
                            return prop && (prop.flags & 3) !== 0 && (getDeclarationFlagsFromSymbol(prop) & 8192) !== 0;
                        }
                        return false;
                    }
                    case 161:
                        return isConstVariableReference(n.expression);
                    default:
                        return false;
                }
            }
            if (!isReferenceOrErrorExpression(n)) {
                error(n, invalidReferenceMessage);
                return false;
            }
            if (isConstVariableReference(n)) {
                error(n, constantVariableMessage);
                return false;
            }
            return true;
        }
        function checkDeleteExpression(node) {
            if (node.parserContextFlags & 1 && node.expression.kind === 65) {
                grammarErrorOnNode(node.expression, ts.Diagnostics.delete_cannot_be_called_on_an_identifier_in_strict_mode);
            }
            var operandType = checkExpression(node.expression);
            return booleanType;
        }
        function checkTypeOfExpression(node) {
            var operandType = checkExpression(node.expression);
            return stringType;
        }
        function checkVoidExpression(node) {
            var operandType = checkExpression(node.expression);
            return undefinedType;
        }
        function checkPrefixUnaryExpression(node) {
            if ((node.operator === 38 || node.operator === 39)) {
                checkGrammarEvalOrArgumentsInStrictMode(node, node.operand);
            }
            var operandType = checkExpression(node.operand);
            switch (node.operator) {
                case 33:
                case 34:
                case 47:
                    if (someConstituentTypeHasKind(operandType, 1048576)) {
                        error(node.operand, ts.Diagnostics.The_0_operator_cannot_be_applied_to_type_symbol, ts.tokenToString(node.operator));
                    }
                    return numberType;
                case 46:
                    return booleanType;
                case 38:
                case 39:
                    var ok = checkArithmeticOperandType(node.operand, operandType, ts.Diagnostics.An_arithmetic_operand_must_be_of_type_any_number_or_an_enum_type);
                    if (ok) {
                        checkReferenceExpression(node.operand, ts.Diagnostics.The_operand_of_an_increment_or_decrement_operator_must_be_a_variable_property_or_indexer, ts.Diagnostics.The_operand_of_an_increment_or_decrement_operator_cannot_be_a_constant);
                    }
                    return numberType;
            }
            return unknownType;
        }
        function checkPostfixUnaryExpression(node) {
            checkGrammarEvalOrArgumentsInStrictMode(node, node.operand);
            var operandType = checkExpression(node.operand);
            var ok = checkArithmeticOperandType(node.operand, operandType, ts.Diagnostics.An_arithmetic_operand_must_be_of_type_any_number_or_an_enum_type);
            if (ok) {
                checkReferenceExpression(node.operand, ts.Diagnostics.The_operand_of_an_increment_or_decrement_operator_must_be_a_variable_property_or_indexer, ts.Diagnostics.The_operand_of_an_increment_or_decrement_operator_cannot_be_a_constant);
            }
            return numberType;
        }
        function someConstituentTypeHasKind(type, kind) {
            if (type.flags & kind) {
                return true;
            }
            if (type.flags & 16384) {
                var types = type.types;
                for (var _i = 0; _i < types.length; _i++) {
                    var current = types[_i];
                    if (current.flags & kind) {
                        return true;
                    }
                }
                return false;
            }
            return false;
        }
        function allConstituentTypesHaveKind(type, kind) {
            if (type.flags & kind) {
                return true;
            }
            if (type.flags & 16384) {
                var types = type.types;
                for (var _i = 0; _i < types.length; _i++) {
                    var current = types[_i];
                    if (!(current.flags & kind)) {
                        return false;
                    }
                }
                return true;
            }
            return false;
        }
        function isConstEnumObjectType(type) {
            return type.flags & (48128 | 32768) && type.symbol && isConstEnumSymbol(type.symbol);
        }
        function isConstEnumSymbol(symbol) {
            return (symbol.flags & 128) !== 0;
        }
        function checkInstanceOfExpression(node, leftType, rightType) {
            if (allConstituentTypesHaveKind(leftType, 1049086)) {
                error(node.left, ts.Diagnostics.The_left_hand_side_of_an_instanceof_expression_must_be_of_type_any_an_object_type_or_a_type_parameter);
            }
            if (!(rightType.flags & 1 || isTypeSubtypeOf(rightType, globalFunctionType))) {
                error(node.right, ts.Diagnostics.The_right_hand_side_of_an_instanceof_expression_must_be_of_type_any_or_of_a_type_assignable_to_the_Function_interface_type);
            }
            return booleanType;
        }
        function checkInExpression(node, leftType, rightType) {
            if (!allConstituentTypesHaveKind(leftType, 1 | 258 | 132 | 1048576)) {
                error(node.left, ts.Diagnostics.The_left_hand_side_of_an_in_expression_must_be_of_type_any_string_number_or_symbol);
            }
            if (!allConstituentTypesHaveKind(rightType, 1 | 48128 | 512)) {
                error(node.right, ts.Diagnostics.The_right_hand_side_of_an_in_expression_must_be_of_type_any_an_object_type_or_a_type_parameter);
            }
            return booleanType;
        }
        function checkObjectLiteralAssignment(node, sourceType, contextualMapper) {
            var properties = node.properties;
            for (var _i = 0; _i < properties.length; _i++) {
                var p = properties[_i];
                if (p.kind === 224 || p.kind === 225) {
                    var name_5 = p.name;
                    var type = sourceType.flags & 1 ? sourceType :
                        getTypeOfPropertyOfType(sourceType, name_5.text) ||
                            isNumericLiteralName(name_5.text) && getIndexTypeOfType(sourceType, 1) ||
                            getIndexTypeOfType(sourceType, 0);
                    if (type) {
                        checkDestructuringAssignment(p.initializer || name_5, type);
                    }
                    else {
                        error(name_5, ts.Diagnostics.Type_0_has_no_property_1_and_no_string_index_signature, typeToString(sourceType), ts.declarationNameToString(name_5));
                    }
                }
                else {
                    error(p, ts.Diagnostics.Property_assignment_expected);
                }
            }
            return sourceType;
        }
        function checkArrayLiteralAssignment(node, sourceType, contextualMapper) {
            var elementType = checkIteratedTypeOrElementType(sourceType, node, false) || unknownType;
            var elements = node.elements;
            for (var i = 0; i < elements.length; i++) {
                var e = elements[i];
                if (e.kind !== 175) {
                    if (e.kind !== 173) {
                        var propName = "" + i;
                        var type = sourceType.flags & 1 ? sourceType :
                            isTupleLikeType(sourceType)
                                ? getTypeOfPropertyOfType(sourceType, propName)
                                : elementType;
                        if (type) {
                            checkDestructuringAssignment(e, type, contextualMapper);
                        }
                        else {
                            if (isTupleType(sourceType)) {
                                error(e, ts.Diagnostics.Tuple_type_0_with_length_1_cannot_be_assigned_to_tuple_with_length_2, typeToString(sourceType), sourceType.elementTypes.length, elements.length);
                            }
                            else {
                                error(e, ts.Diagnostics.Type_0_has_no_property_1, typeToString(sourceType), propName);
                            }
                        }
                    }
                    else {
                        if (i < elements.length - 1) {
                            error(e, ts.Diagnostics.A_rest_element_must_be_last_in_an_array_destructuring_pattern);
                        }
                        else {
                            var restExpression = e.expression;
                            if (restExpression.kind === 169 && restExpression.operatorToken.kind === 53) {
                                error(restExpression.operatorToken, ts.Diagnostics.A_rest_element_cannot_have_an_initializer);
                            }
                            else {
                                checkDestructuringAssignment(restExpression, createArrayType(elementType), contextualMapper);
                            }
                        }
                    }
                }
            }
            return sourceType;
        }
        function checkDestructuringAssignment(target, sourceType, contextualMapper) {
            if (target.kind === 169 && target.operatorToken.kind === 53) {
                checkBinaryExpression(target, contextualMapper);
                target = target.left;
            }
            if (target.kind === 154) {
                return checkObjectLiteralAssignment(target, sourceType, contextualMapper);
            }
            if (target.kind === 153) {
                return checkArrayLiteralAssignment(target, sourceType, contextualMapper);
            }
            return checkReferenceAssignment(target, sourceType, contextualMapper);
        }
        function checkReferenceAssignment(target, sourceType, contextualMapper) {
            var targetType = checkExpression(target, contextualMapper);
            if (checkReferenceExpression(target, ts.Diagnostics.Invalid_left_hand_side_of_assignment_expression, ts.Diagnostics.Left_hand_side_of_assignment_expression_cannot_be_a_constant)) {
                checkTypeAssignableTo(sourceType, targetType, target, undefined);
            }
            return sourceType;
        }
        function checkBinaryExpression(node, contextualMapper) {
            if (ts.isLeftHandSideExpression(node.left) && ts.isAssignmentOperator(node.operatorToken.kind)) {
                checkGrammarEvalOrArgumentsInStrictMode(node, node.left);
            }
            var operator = node.operatorToken.kind;
            if (operator === 53 && (node.left.kind === 154 || node.left.kind === 153)) {
                return checkDestructuringAssignment(node.left, checkExpression(node.right, contextualMapper), contextualMapper);
            }
            var leftType = checkExpression(node.left, contextualMapper);
            var rightType = checkExpression(node.right, contextualMapper);
            switch (operator) {
                case 35:
                case 56:
                case 36:
                case 57:
                case 37:
                case 58:
                case 34:
                case 55:
                case 40:
                case 59:
                case 41:
                case 60:
                case 42:
                case 61:
                case 44:
                case 63:
                case 45:
                case 64:
                case 43:
                case 62:
                    if (leftType.flags & (32 | 64))
                        leftType = rightType;
                    if (rightType.flags & (32 | 64))
                        rightType = leftType;
                    var suggestedOperator;
                    if ((leftType.flags & 8) &&
                        (rightType.flags & 8) &&
                        (suggestedOperator = getSuggestedBooleanOperator(node.operatorToken.kind)) !== undefined) {
                        error(node, ts.Diagnostics.The_0_operator_is_not_allowed_for_boolean_types_Consider_using_1_instead, ts.tokenToString(node.operatorToken.kind), ts.tokenToString(suggestedOperator));
                    }
                    else {
                        var leftOk = checkArithmeticOperandType(node.left, leftType, ts.Diagnostics.The_left_hand_side_of_an_arithmetic_operation_must_be_of_type_any_number_or_an_enum_type);
                        var rightOk = checkArithmeticOperandType(node.right, rightType, ts.Diagnostics.The_right_hand_side_of_an_arithmetic_operation_must_be_of_type_any_number_or_an_enum_type);
                        if (leftOk && rightOk) {
                            checkAssignmentOperator(numberType);
                        }
                    }
                    return numberType;
                case 33:
                case 54:
                    if (leftType.flags & (32 | 64))
                        leftType = rightType;
                    if (rightType.flags & (32 | 64))
                        rightType = leftType;
                    var resultType;
                    if (allConstituentTypesHaveKind(leftType, 132) && allConstituentTypesHaveKind(rightType, 132)) {
                        resultType = numberType;
                    }
                    else {
                        if (allConstituentTypesHaveKind(leftType, 258) || allConstituentTypesHaveKind(rightType, 258)) {
                            resultType = stringType;
                        }
                        else if (leftType.flags & 1 || rightType.flags & 1) {
                            resultType = anyType;
                        }
                        if (resultType && !checkForDisallowedESSymbolOperand(operator)) {
                            return resultType;
                        }
                    }
                    if (!resultType) {
                        reportOperatorError();
                        return anyType;
                    }
                    if (operator === 54) {
                        checkAssignmentOperator(resultType);
                    }
                    return resultType;
                case 24:
                case 25:
                case 26:
                case 27:
                    if (!checkForDisallowedESSymbolOperand(operator)) {
                        return booleanType;
                    }
                case 28:
                case 29:
                case 30:
                case 31:
                    if (!isTypeAssignableTo(leftType, rightType) && !isTypeAssignableTo(rightType, leftType)) {
                        reportOperatorError();
                    }
                    return booleanType;
                case 87:
                    return checkInstanceOfExpression(node, leftType, rightType);
                case 86:
                    return checkInExpression(node, leftType, rightType);
                case 48:
                    return rightType;
                case 49:
                    return getUnionType([leftType, rightType]);
                case 53:
                    checkAssignmentOperator(rightType);
                    return rightType;
                case 23:
                    return rightType;
            }
            function checkForDisallowedESSymbolOperand(operator) {
                var offendingSymbolOperand = someConstituentTypeHasKind(leftType, 1048576) ? node.left :
                    someConstituentTypeHasKind(rightType, 1048576) ? node.right :
                        undefined;
                if (offendingSymbolOperand) {
                    error(offendingSymbolOperand, ts.Diagnostics.The_0_operator_cannot_be_applied_to_type_symbol, ts.tokenToString(operator));
                    return false;
                }
                return true;
            }
            function getSuggestedBooleanOperator(operator) {
                switch (operator) {
                    case 44:
                    case 63:
                        return 49;
                    case 45:
                    case 64:
                        return 31;
                    case 43:
                    case 62:
                        return 48;
                    default:
                        return undefined;
                }
            }
            function checkAssignmentOperator(valueType) {
                if (produceDiagnostics && operator >= 53 && operator <= 64) {
                    var ok = checkReferenceExpression(node.left, ts.Diagnostics.Invalid_left_hand_side_of_assignment_expression, ts.Diagnostics.Left_hand_side_of_assignment_expression_cannot_be_a_constant);
                    if (ok) {
                        checkTypeAssignableTo(valueType, leftType, node.left, undefined);
                    }
                }
            }
            function reportOperatorError() {
                error(node, ts.Diagnostics.Operator_0_cannot_be_applied_to_types_1_and_2, ts.tokenToString(node.operatorToken.kind), typeToString(leftType), typeToString(rightType));
            }
        }
        function checkYieldExpression(node) {
            if (!(node.parserContextFlags & 4)) {
                grammarErrorOnFirstToken(node, ts.Diagnostics.yield_expression_must_be_contained_within_a_generator_declaration);
            }
            else {
                grammarErrorOnFirstToken(node, ts.Diagnostics.yield_expressions_are_not_currently_supported);
            }
        }
        function checkConditionalExpression(node, contextualMapper) {
            checkExpression(node.condition);
            var type1 = checkExpression(node.whenTrue, contextualMapper);
            var type2 = checkExpression(node.whenFalse, contextualMapper);
            return getUnionType([type1, type2]);
        }
        function checkTemplateExpression(node) {
            ts.forEach(node.templateSpans, function (templateSpan) {
                checkExpression(templateSpan.expression);
            });
            return stringType;
        }
        function checkExpressionWithContextualType(node, contextualType, contextualMapper) {
            var saveContextualType = node.contextualType;
            node.contextualType = contextualType;
            var result = checkExpression(node, contextualMapper);
            node.contextualType = saveContextualType;
            return result;
        }
        function checkExpressionCached(node, contextualMapper) {
            var links = getNodeLinks(node);
            if (!links.resolvedType) {
                links.resolvedType = checkExpression(node, contextualMapper);
            }
            return links.resolvedType;
        }
        function checkPropertyAssignment(node, contextualMapper) {
            if (node.name.kind === 127) {
                checkComputedPropertyName(node.name);
            }
            return checkExpression(node.initializer, contextualMapper);
        }
        function checkObjectLiteralMethod(node, contextualMapper) {
            checkGrammarMethod(node);
            if (node.name.kind === 127) {
                checkComputedPropertyName(node.name);
            }
            var uninstantiatedType = checkFunctionExpressionOrObjectLiteralMethod(node, contextualMapper);
            return instantiateTypeWithSingleGenericCallSignature(node, uninstantiatedType, contextualMapper);
        }
        function instantiateTypeWithSingleGenericCallSignature(node, type, contextualMapper) {
            if (contextualMapper && contextualMapper !== identityMapper) {
                var signature = getSingleCallSignature(type);
                if (signature && signature.typeParameters) {
                    var contextualType = getContextualType(node);
                    if (contextualType) {
                        var contextualSignature = getSingleCallSignature(contextualType);
                        if (contextualSignature && !contextualSignature.typeParameters) {
                            return getOrCreateTypeFromSignature(instantiateSignatureInContextOf(signature, contextualSignature, contextualMapper));
                        }
                    }
                }
            }
            return type;
        }
        function checkExpression(node, contextualMapper) {
            checkGrammarIdentifierInStrictMode(node);
            return checkExpressionOrQualifiedName(node, contextualMapper);
        }
        function checkExpressionOrQualifiedName(node, contextualMapper) {
            var type;
            if (node.kind == 126) {
                type = checkQualifiedName(node);
            }
            else {
                var uninstantiatedType = checkExpressionWorker(node, contextualMapper);
                type = instantiateTypeWithSingleGenericCallSignature(node, uninstantiatedType, contextualMapper);
            }
            if (isConstEnumObjectType(type)) {
                var ok = (node.parent.kind === 155 && node.parent.expression === node) ||
                    (node.parent.kind === 156 && node.parent.expression === node) ||
                    ((node.kind === 65 || node.kind === 126) && isInRightSideOfImportOrExportAssignment(node));
                if (!ok) {
                    error(node, ts.Diagnostics.const_enums_can_only_be_used_in_property_or_index_access_expressions_or_the_right_hand_side_of_an_import_declaration_or_export_assignment);
                }
            }
            return type;
        }
        function checkNumericLiteral(node) {
            checkGrammarNumericLiteral(node);
            return numberType;
        }
        function checkExpressionWorker(node, contextualMapper) {
            switch (node.kind) {
                case 65:
                    return checkIdentifier(node);
                case 93:
                    return checkThisExpression(node);
                case 91:
                    return checkSuperExpression(node);
                case 89:
                    return nullType;
                case 95:
                case 80:
                    return booleanType;
                case 7:
                    return checkNumericLiteral(node);
                case 171:
                    return checkTemplateExpression(node);
                case 8:
                case 10:
                    return stringType;
                case 9:
                    return globalRegExpType;
                case 153:
                    return checkArrayLiteral(node, contextualMapper);
                case 154:
                    return checkObjectLiteral(node, contextualMapper);
                case 155:
                    return checkPropertyAccessExpression(node);
                case 156:
                    return checkIndexedAccess(node);
                case 157:
                case 158:
                    return checkCallExpression(node);
                case 159:
                    return checkTaggedTemplateExpression(node);
                case 160:
                    return checkTypeAssertion(node);
                case 161:
                    return checkExpression(node.expression, contextualMapper);
                case 174:
                    return checkClassExpression(node);
                case 162:
                case 163:
                    return checkFunctionExpressionOrObjectLiteralMethod(node, contextualMapper);
                case 165:
                    return checkTypeOfExpression(node);
                case 164:
                    return checkDeleteExpression(node);
                case 166:
                    return checkVoidExpression(node);
                case 167:
                    return checkPrefixUnaryExpression(node);
                case 168:
                    return checkPostfixUnaryExpression(node);
                case 169:
                    return checkBinaryExpression(node, contextualMapper);
                case 170:
                    return checkConditionalExpression(node, contextualMapper);
                case 173:
                    return checkSpreadElementExpression(node, contextualMapper);
                case 175:
                    return undefinedType;
                case 172:
                    checkYieldExpression(node);
                    return unknownType;
            }
            return unknownType;
        }
        function checkTypeParameter(node) {
            checkGrammarDeclarationNameInStrictMode(node);
            if (node.expression) {
                grammarErrorOnFirstToken(node.expression, ts.Diagnostics.Type_expected);
            }
            checkSourceElement(node.constraint);
            if (produceDiagnostics) {
                checkTypeParameterHasIllegalReferencesInConstraint(node);
                checkTypeNameIsReserved(node.name, ts.Diagnostics.Type_parameter_name_cannot_be_0);
            }
        }
        function checkParameter(node) {
            // Grammar checking
            // It is a SyntaxError if the Identifier "eval" or the Identifier "arguments" occurs as the
            // Identifier in a PropertySetParameterList of a PropertyAssignment that is contained in strict code
            // or if its FunctionBody is strict code(11.1.5).
            // It is a SyntaxError if the identifier eval or arguments appears within a FormalParameterList of a
            // strict mode FunctionLikeDeclaration or FunctionExpression(13.1)
            checkGrammarDecorators(node) || checkGrammarModifiers(node) || checkGrammarEvalOrArgumentsInStrictMode(node, node.name);
            checkVariableLikeDeclaration(node);
            var func = ts.getContainingFunction(node);
            if (node.flags & 112) {
                func = ts.getContainingFunction(node);
                if (!(func.kind === 135 && ts.nodeIsPresent(func.body))) {
                    error(node, ts.Diagnostics.A_parameter_property_is_only_allowed_in_a_constructor_implementation);
                }
            }
            if (node.questionToken && ts.isBindingPattern(node.name) && func.body) {
                error(node, ts.Diagnostics.A_binding_pattern_parameter_cannot_be_optional_in_an_implementation_signature);
            }
            if (node.dotDotDotToken && !ts.isBindingPattern(node.name) && !isArrayType(getTypeOfSymbol(node.symbol))) {
                error(node, ts.Diagnostics.A_rest_parameter_must_be_of_an_array_type);
            }
        }
        function checkSignatureDeclaration(node) {
            if (node.kind === 140) {
                checkGrammarIndexSignature(node);
            }
            else if (node.kind === 142 || node.kind === 200 || node.kind === 143 ||
                node.kind === 138 || node.kind === 135 ||
                node.kind === 139) {
                checkGrammarFunctionLikeDeclaration(node);
            }
            checkTypeParameters(node.typeParameters);
            ts.forEach(node.parameters, checkParameter);
            if (node.type) {
                checkSourceElement(node.type);
            }
            if (produceDiagnostics) {
                checkCollisionWithArgumentsInGeneratedCode(node);
                if (compilerOptions.noImplicitAny && !node.type) {
                    switch (node.kind) {
                        case 139:
                            error(node, ts.Diagnostics.Construct_signature_which_lacks_return_type_annotation_implicitly_has_an_any_return_type);
                            break;
                        case 138:
                            error(node, ts.Diagnostics.Call_signature_which_lacks_return_type_annotation_implicitly_has_an_any_return_type);
                            break;
                    }
                }
            }
            checkSpecializedSignatureDeclaration(node);
        }
        function checkTypeForDuplicateIndexSignatures(node) {
            if (node.kind === 202) {
                var nodeSymbol = getSymbolOfNode(node);
                if (nodeSymbol.declarations.length > 0 && nodeSymbol.declarations[0] !== node) {
                    return;
                }
            }
            var indexSymbol = getIndexSymbol(getSymbolOfNode(node));
            if (indexSymbol) {
                var seenNumericIndexer = false;
                var seenStringIndexer = false;
                for (var _i = 0, _a = indexSymbol.declarations; _i < _a.length; _i++) {
                    var decl = _a[_i];
                    var declaration = decl;
                    if (declaration.parameters.length === 1 && declaration.parameters[0].type) {
                        switch (declaration.parameters[0].type.kind) {
                            case 121:
                                if (!seenStringIndexer) {
                                    seenStringIndexer = true;
                                }
                                else {
                                    error(declaration, ts.Diagnostics.Duplicate_string_index_signature);
                                }
                                break;
                            case 119:
                                if (!seenNumericIndexer) {
                                    seenNumericIndexer = true;
                                }
                                else {
                                    error(declaration, ts.Diagnostics.Duplicate_number_index_signature);
                                }
                                break;
                        }
                    }
                }
            }
        }
        function checkPropertyDeclaration(node) {
            checkGrammarDecorators(node) || checkGrammarModifiers(node) || checkGrammarProperty(node) || checkGrammarComputedPropertyName(node.name);
            checkVariableLikeDeclaration(node);
        }
        function checkMethodDeclaration(node) {
            checkGrammarMethod(node) || checkGrammarComputedPropertyName(node.name);
            checkFunctionLikeDeclaration(node);
        }
        function checkConstructorDeclaration(node) {
            checkSignatureDeclaration(node);
            checkGrammarConstructorTypeParameters(node) || checkGrammarConstructorTypeAnnotation(node);
            checkSourceElement(node.body);
            var symbol = getSymbolOfNode(node);
            var firstDeclaration = ts.getDeclarationOfKind(symbol, node.kind);
            if (node === firstDeclaration) {
                checkFunctionOrConstructorSymbol(symbol);
            }
            if (ts.nodeIsMissing(node.body)) {
                return;
            }
            if (!produceDiagnostics) {
                return;
            }
            function isSuperCallExpression(n) {
                return n.kind === 157 && n.expression.kind === 91;
            }
            function containsSuperCall(n) {
                if (isSuperCallExpression(n)) {
                    return true;
                }
                switch (n.kind) {
                    case 162:
                    case 200:
                    case 163:
                    case 154: return false;
                    default: return ts.forEachChild(n, containsSuperCall);
                }
            }
            function markThisReferencesAsErrors(n) {
                if (n.kind === 93) {
                    error(n, ts.Diagnostics.this_cannot_be_referenced_in_current_location);
                }
                else if (n.kind !== 162 && n.kind !== 200) {
                    ts.forEachChild(n, markThisReferencesAsErrors);
                }
            }
            function isInstancePropertyWithInitializer(n) {
                return n.kind === 132 &&
                    !(n.flags & 128) &&
                    !!n.initializer;
            }
            if (ts.getClassExtendsHeritageClauseElement(node.parent)) {
                if (containsSuperCall(node.body)) {
                    var superCallShouldBeFirst = ts.forEach(node.parent.members, isInstancePropertyWithInitializer) ||
                        ts.forEach(node.parameters, function (p) { return p.flags & (16 | 32 | 64); });
                    if (superCallShouldBeFirst) {
                        var statements = node.body.statements;
                        if (!statements.length || statements[0].kind !== 182 || !isSuperCallExpression(statements[0].expression)) {
                            error(node, ts.Diagnostics.A_super_call_must_be_the_first_statement_in_the_constructor_when_a_class_contains_initialized_properties_or_has_parameter_properties);
                        }
                        else {
                            markThisReferencesAsErrors(statements[0].expression);
                        }
                    }
                }
                else {
                    error(node, ts.Diagnostics.Constructors_for_derived_classes_must_contain_a_super_call);
                }
            }
        }
        function checkAccessorDeclaration(node) {
            if (produceDiagnostics) {
                checkGrammarFunctionLikeDeclaration(node) || checkGrammarAccessor(node) || checkGrammarComputedPropertyName(node.name);
                if (node.kind === 136) {
                    if (!ts.isInAmbientContext(node) && ts.nodeIsPresent(node.body) && !(bodyContainsAReturnStatement(node.body) || bodyContainsSingleThrowStatement(node.body))) {
                        error(node.name, ts.Diagnostics.A_get_accessor_must_return_a_value_or_consist_of_a_single_throw_statement);
                    }
                }
                if (!ts.hasDynamicName(node)) {
                    var otherKind = node.kind === 136 ? 137 : 136;
                    var otherAccessor = ts.getDeclarationOfKind(node.symbol, otherKind);
                    if (otherAccessor) {
                        if (((node.flags & 112) !== (otherAccessor.flags & 112))) {
                            error(node.name, ts.Diagnostics.Getter_and_setter_accessors_do_not_agree_in_visibility);
                        }
                        var currentAccessorType = getAnnotatedAccessorType(node);
                        var otherAccessorType = getAnnotatedAccessorType(otherAccessor);
                        if (currentAccessorType && otherAccessorType) {
                            if (!isTypeIdenticalTo(currentAccessorType, otherAccessorType)) {
                                error(node, ts.Diagnostics.get_and_set_accessor_must_have_the_same_type);
                            }
                        }
                    }
                }
                checkAndStoreTypeOfAccessors(getSymbolOfNode(node));
            }
            checkFunctionLikeDeclaration(node);
        }
        function checkMissingDeclaration(node) {
            checkDecorators(node);
        }
        function checkTypeReferenceNode(node) {
            checkGrammarTypeReferenceInStrictMode(node.typeName);
            return checkTypeReferenceOrHeritageClauseElement(node);
        }
        function checkHeritageClauseElement(node) {
            checkGrammarHeritageClauseElementInStrictMode(node.expression);
            return checkTypeReferenceOrHeritageClauseElement(node);
        }
        function checkTypeReferenceOrHeritageClauseElement(node) {
            checkGrammarTypeArguments(node, node.typeArguments);
            var type = getTypeFromTypeReferenceOrHeritageClauseElement(node);
            if (type !== unknownType && node.typeArguments) {
                var len = node.typeArguments.length;
                for (var i = 0; i < len; i++) {
                    checkSourceElement(node.typeArguments[i]);
                    var constraint = getConstraintOfTypeParameter(type.target.typeParameters[i]);
                    if (produceDiagnostics && constraint) {
                        var typeArgument = type.typeArguments[i];
                        checkTypeAssignableTo(typeArgument, constraint, node, ts.Diagnostics.Type_0_does_not_satisfy_the_constraint_1);
                    }
                }
            }
        }
        function checkTypeQuery(node) {
            getTypeFromTypeQueryNode(node);
        }
        function checkTypeLiteral(node) {
            ts.forEach(node.members, checkSourceElement);
            if (produceDiagnostics) {
                var type = getTypeFromTypeLiteralOrFunctionOrConstructorTypeNode(node);
                checkIndexConstraints(type);
                checkTypeForDuplicateIndexSignatures(node);
            }
        }
        function checkArrayType(node) {
            checkSourceElement(node.elementType);
        }
        function checkTupleType(node) {
            var hasErrorFromDisallowedTrailingComma = checkGrammarForDisallowedTrailingComma(node.elementTypes);
            if (!hasErrorFromDisallowedTrailingComma && node.elementTypes.length === 0) {
                grammarErrorOnNode(node, ts.Diagnostics.A_tuple_type_element_list_cannot_be_empty);
            }
            ts.forEach(node.elementTypes, checkSourceElement);
        }
        function checkUnionType(node) {
            ts.forEach(node.types, checkSourceElement);
        }
        function isPrivateWithinAmbient(node) {
            return (node.flags & 32) && ts.isInAmbientContext(node);
        }
        function checkSpecializedSignatureDeclaration(signatureDeclarationNode) {
            if (!produceDiagnostics) {
                return;
            }
            var signature = getSignatureFromDeclaration(signatureDeclarationNode);
            if (!signature.hasStringLiterals) {
                return;
            }
            if (ts.nodeIsPresent(signatureDeclarationNode.body)) {
                error(signatureDeclarationNode, ts.Diagnostics.A_signature_with_an_implementation_cannot_use_a_string_literal_type);
                return;
            }
            var signaturesToCheck;
            if (!signatureDeclarationNode.name && signatureDeclarationNode.parent && signatureDeclarationNode.parent.kind === 202) {
                ts.Debug.assert(signatureDeclarationNode.kind === 138 || signatureDeclarationNode.kind === 139);
                var signatureKind = signatureDeclarationNode.kind === 138 ? 0 : 1;
                var containingSymbol = getSymbolOfNode(signatureDeclarationNode.parent);
                var containingType = getDeclaredTypeOfSymbol(containingSymbol);
                signaturesToCheck = getSignaturesOfType(containingType, signatureKind);
            }
            else {
                signaturesToCheck = getSignaturesOfSymbol(getSymbolOfNode(signatureDeclarationNode));
            }
            for (var _i = 0; _i < signaturesToCheck.length; _i++) {
                var otherSignature = signaturesToCheck[_i];
                if (!otherSignature.hasStringLiterals && isSignatureAssignableTo(signature, otherSignature)) {
                    return;
                }
            }
            error(signatureDeclarationNode, ts.Diagnostics.Specialized_overload_signature_is_not_assignable_to_any_non_specialized_signature);
        }
        function getEffectiveDeclarationFlags(n, flagsToCheck) {
            var flags = ts.getCombinedNodeFlags(n);
            if (n.parent.kind !== 202 && ts.isInAmbientContext(n)) {
                if (!(flags & 2)) {
                    flags |= 1;
                }
                flags |= 2;
            }
            return flags & flagsToCheck;
        }
        function checkFunctionOrConstructorSymbol(symbol) {
            if (!produceDiagnostics) {
                return;
            }
            function getCanonicalOverload(overloads, implementation) {
                var implementationSharesContainerWithFirstOverload = implementation !== undefined && implementation.parent === overloads[0].parent;
                return implementationSharesContainerWithFirstOverload ? implementation : overloads[0];
            }
            function checkFlagAgreementBetweenOverloads(overloads, implementation, flagsToCheck, someOverloadFlags, allOverloadFlags) {
                var someButNotAllOverloadFlags = someOverloadFlags ^ allOverloadFlags;
                if (someButNotAllOverloadFlags !== 0) {
                    var canonicalFlags = getEffectiveDeclarationFlags(getCanonicalOverload(overloads, implementation), flagsToCheck);
                    ts.forEach(overloads, function (o) {
                        var deviation = getEffectiveDeclarationFlags(o, flagsToCheck) ^ canonicalFlags;
                        if (deviation & 1) {
                            error(o.name, ts.Diagnostics.Overload_signatures_must_all_be_exported_or_not_exported);
                        }
                        else if (deviation & 2) {
                            error(o.name, ts.Diagnostics.Overload_signatures_must_all_be_ambient_or_non_ambient);
                        }
                        else if (deviation & (32 | 64)) {
                            error(o.name, ts.Diagnostics.Overload_signatures_must_all_be_public_private_or_protected);
                        }
                    });
                }
            }
            function checkQuestionTokenAgreementBetweenOverloads(overloads, implementation, someHaveQuestionToken, allHaveQuestionToken) {
                if (someHaveQuestionToken !== allHaveQuestionToken) {
                    var canonicalHasQuestionToken = ts.hasQuestionToken(getCanonicalOverload(overloads, implementation));
                    ts.forEach(overloads, function (o) {
                        var deviation = ts.hasQuestionToken(o) !== canonicalHasQuestionToken;
                        if (deviation) {
                            error(o.name, ts.Diagnostics.Overload_signatures_must_all_be_optional_or_required);
                        }
                    });
                }
            }
            var flagsToCheck = 1 | 2 | 32 | 64;
            var someNodeFlags = 0;
            var allNodeFlags = flagsToCheck;
            var someHaveQuestionToken = false;
            var allHaveQuestionToken = true;
            var hasOverloads = false;
            var bodyDeclaration;
            var lastSeenNonAmbientDeclaration;
            var previousDeclaration;
            var declarations = symbol.declarations;
            var isConstructor = (symbol.flags & 16384) !== 0;
            function reportImplementationExpectedError(node) {
                if (node.name && ts.nodeIsMissing(node.name)) {
                    return;
                }
                var seen = false;
                var subsequentNode = ts.forEachChild(node.parent, function (c) {
                    if (seen) {
                        return c;
                    }
                    else {
                        seen = c === node;
                    }
                });
                if (subsequentNode) {
                    if (subsequentNode.kind === node.kind) {
                        var errorNode_1 = subsequentNode.name || subsequentNode;
                        if (node.name && subsequentNode.name && node.name.text === subsequentNode.name.text) {
                            ts.Debug.assert(node.kind === 134 || node.kind === 133);
                            ts.Debug.assert((node.flags & 128) !== (subsequentNode.flags & 128));
                            var diagnostic = node.flags & 128 ? ts.Diagnostics.Function_overload_must_be_static : ts.Diagnostics.Function_overload_must_not_be_static;
                            error(errorNode_1, diagnostic);
                            return;
                        }
                        else if (ts.nodeIsPresent(subsequentNode.body)) {
                            error(errorNode_1, ts.Diagnostics.Function_implementation_name_must_be_0, ts.declarationNameToString(node.name));
                            return;
                        }
                    }
                }
                var errorNode = node.name || node;
                if (isConstructor) {
                    error(errorNode, ts.Diagnostics.Constructor_implementation_is_missing);
                }
                else {
                    error(errorNode, ts.Diagnostics.Function_implementation_is_missing_or_not_immediately_following_the_declaration);
                }
            }
            var isExportSymbolInsideModule = symbol.parent && symbol.parent.flags & 1536;
            var duplicateFunctionDeclaration = false;
            var multipleConstructorImplementation = false;
            for (var _i = 0; _i < declarations.length; _i++) {
                var current = declarations[_i];
                var node = current;
                var inAmbientContext = ts.isInAmbientContext(node);
                var inAmbientContextOrInterface = node.parent.kind === 202 || node.parent.kind === 145 || inAmbientContext;
                if (inAmbientContextOrInterface) {
                    previousDeclaration = undefined;
                }
                if (node.kind === 200 || node.kind === 134 || node.kind === 133 || node.kind === 135) {
                    var currentNodeFlags = getEffectiveDeclarationFlags(node, flagsToCheck);
                    someNodeFlags |= currentNodeFlags;
                    allNodeFlags &= currentNodeFlags;
                    someHaveQuestionToken = someHaveQuestionToken || ts.hasQuestionToken(node);
                    allHaveQuestionToken = allHaveQuestionToken && ts.hasQuestionToken(node);
                    if (ts.nodeIsPresent(node.body) && bodyDeclaration) {
                        if (isConstructor) {
                            multipleConstructorImplementation = true;
                        }
                        else {
                            duplicateFunctionDeclaration = true;
                        }
                    }
                    else if (!isExportSymbolInsideModule && previousDeclaration && previousDeclaration.parent === node.parent && previousDeclaration.end !== node.pos) {
                        reportImplementationExpectedError(previousDeclaration);
                    }
                    if (ts.nodeIsPresent(node.body)) {
                        if (!bodyDeclaration) {
                            bodyDeclaration = node;
                        }
                    }
                    else {
                        hasOverloads = true;
                    }
                    previousDeclaration = node;
                    if (!inAmbientContextOrInterface) {
                        lastSeenNonAmbientDeclaration = node;
                    }
                }
            }
            if (multipleConstructorImplementation) {
                ts.forEach(declarations, function (declaration) {
                    error(declaration, ts.Diagnostics.Multiple_constructor_implementations_are_not_allowed);
                });
            }
            if (duplicateFunctionDeclaration) {
                ts.forEach(declarations, function (declaration) {
                    error(declaration.name, ts.Diagnostics.Duplicate_function_implementation);
                });
            }
            if (!isExportSymbolInsideModule && lastSeenNonAmbientDeclaration && !lastSeenNonAmbientDeclaration.body) {
                reportImplementationExpectedError(lastSeenNonAmbientDeclaration);
            }
            if (hasOverloads) {
                checkFlagAgreementBetweenOverloads(declarations, bodyDeclaration, flagsToCheck, someNodeFlags, allNodeFlags);
                checkQuestionTokenAgreementBetweenOverloads(declarations, bodyDeclaration, someHaveQuestionToken, allHaveQuestionToken);
                if (bodyDeclaration) {
                    var signatures = getSignaturesOfSymbol(symbol);
                    var bodySignature = getSignatureFromDeclaration(bodyDeclaration);
                    if (!bodySignature.hasStringLiterals) {
                        for (var _a = 0; _a < signatures.length; _a++) {
                            var signature = signatures[_a];
                            if (!signature.hasStringLiterals && !isSignatureAssignableTo(bodySignature, signature)) {
                                error(signature.declaration, ts.Diagnostics.Overload_signature_is_not_compatible_with_function_implementation);
                                break;
                            }
                        }
                    }
                }
            }
        }
        function checkExportsOnMergedDeclarations(node) {
            if (!produceDiagnostics) {
                return;
            }
            var symbol = node.localSymbol;
            if (!symbol) {
                symbol = getSymbolOfNode(node);
                if (!(symbol.flags & 7340032)) {
                    return;
                }
            }
            if (ts.getDeclarationOfKind(symbol, node.kind) !== node) {
                return;
            }
            var exportedDeclarationSpaces = 0;
            var nonExportedDeclarationSpaces = 0;
            ts.forEach(symbol.declarations, function (d) {
                var declarationSpaces = getDeclarationSpaces(d);
                if (getEffectiveDeclarationFlags(d, 1)) {
                    exportedDeclarationSpaces |= declarationSpaces;
                }
                else {
                    nonExportedDeclarationSpaces |= declarationSpaces;
                }
            });
            var commonDeclarationSpace = exportedDeclarationSpaces & nonExportedDeclarationSpaces;
            if (commonDeclarationSpace) {
                ts.forEach(symbol.declarations, function (d) {
                    if (getDeclarationSpaces(d) & commonDeclarationSpace) {
                        error(d.name, ts.Diagnostics.Individual_declarations_in_merged_declaration_0_must_be_all_exported_or_all_local, ts.declarationNameToString(d.name));
                    }
                });
            }
            function getDeclarationSpaces(d) {
                switch (d.kind) {
                    case 202:
                        return 2097152;
                    case 205:
                        return d.name.kind === 8 || ts.getModuleInstanceState(d) !== 0
                            ? 4194304 | 1048576
                            : 4194304;
                    case 201:
                    case 204:
                        return 2097152 | 1048576;
                    case 208:
                        var result = 0;
                        var target = resolveAlias(getSymbolOfNode(d));
                        ts.forEach(target.declarations, function (d) { result |= getDeclarationSpaces(d); });
                        return result;
                    default:
                        return 1048576;
                }
            }
        }
        function checkDecorator(node) {
            var expression = node.expression;
            var exprType = checkExpression(expression);
            switch (node.parent.kind) {
                case 201:
                    var classSymbol = getSymbolOfNode(node.parent);
                    var classConstructorType = getTypeOfSymbol(classSymbol);
                    var classDecoratorType = instantiateSingleCallFunctionType(getGlobalClassDecoratorType(), [classConstructorType]);
                    checkTypeAssignableTo(exprType, classDecoratorType, node);
                    break;
                case 132:
                    checkTypeAssignableTo(exprType, getGlobalPropertyDecoratorType(), node);
                    break;
                case 134:
                case 136:
                case 137:
                    var methodType = getTypeOfNode(node.parent);
                    var methodDecoratorType = instantiateSingleCallFunctionType(getGlobalMethodDecoratorType(), [methodType]);
                    checkTypeAssignableTo(exprType, methodDecoratorType, node);
                    break;
                case 129:
                    checkTypeAssignableTo(exprType, getGlobalParameterDecoratorType(), node);
                    break;
            }
        }
        function checkTypeNodeAsExpression(node) {
            if (node && node.kind === 141) {
                var type = getTypeFromTypeNode(node);
                var shouldCheckIfUnknownType = type === unknownType && compilerOptions.separateCompilation;
                if (!type || (!shouldCheckIfUnknownType && type.flags & (1048703 | 132 | 258))) {
                    return;
                }
                if (shouldCheckIfUnknownType || type.symbol.valueDeclaration) {
                    checkExpressionOrQualifiedName(node.typeName);
                }
            }
        }
        function checkTypeAnnotationAsExpression(node) {
            switch (node.kind) {
                case 132:
                    checkTypeNodeAsExpression(node.type);
                    break;
                case 129:
                    checkTypeNodeAsExpression(node.type);
                    break;
                case 134:
                    checkTypeNodeAsExpression(node.type);
                    break;
                case 136:
                    checkTypeNodeAsExpression(node.type);
                    break;
                case 137:
                    checkTypeNodeAsExpression(getSetAccessorTypeAnnotationNode(node));
                    break;
            }
        }
        function checkParameterTypeAnnotationsAsExpressions(node) {
            for (var _i = 0, _a = node.parameters; _i < _a.length; _i++) {
                var parameter = _a[_i];
                checkTypeAnnotationAsExpression(parameter);
            }
        }
        function checkDecorators(node) {
            if (!node.decorators) {
                return;
            }
            if (!ts.nodeCanBeDecorated(node)) {
                return;
            }
            if (compilerOptions.emitDecoratorMetadata) {
                switch (node.kind) {
                    case 201:
                        var constructor = ts.getFirstConstructorWithBody(node);
                        if (constructor) {
                            checkParameterTypeAnnotationsAsExpressions(constructor);
                        }
                        break;
                    case 134:
                        checkParameterTypeAnnotationsAsExpressions(node);
                    case 137:
                    case 136:
                    case 132:
                    case 129:
                        checkTypeAnnotationAsExpression(node);
                        break;
                }
            }
            emitDecorate = true;
            if (node.kind === 129) {
                emitParam = true;
            }
            ts.forEach(node.decorators, checkDecorator);
        }
        function checkFunctionDeclaration(node) {
            if (produceDiagnostics) {
                checkFunctionLikeDeclaration(node) ||
                    checkGrammarDisallowedModifiersInBlockOrObjectLiteralExpression(node) ||
                    checkGrammarFunctionName(node.name) ||
                    checkGrammarForGenerator(node);
                checkCollisionWithCapturedSuperVariable(node, node.name);
                checkCollisionWithCapturedThisVariable(node, node.name);
                checkCollisionWithRequireExportsInGeneratedCode(node, node.name);
            }
        }
        function checkFunctionLikeDeclaration(node) {
            checkGrammarDeclarationNameInStrictMode(node);
            checkDecorators(node);
            checkSignatureDeclaration(node);
            if (node.name && node.name.kind === 127) {
                checkComputedPropertyName(node.name);
            }
            if (!ts.hasDynamicName(node)) {
                var symbol = getSymbolOfNode(node);
                var localSymbol = node.localSymbol || symbol;
                var firstDeclaration = ts.getDeclarationOfKind(localSymbol, node.kind);
                if (node === firstDeclaration) {
                    checkFunctionOrConstructorSymbol(localSymbol);
                }
                if (symbol.parent) {
                    if (ts.getDeclarationOfKind(symbol, node.kind) === node) {
                        checkFunctionOrConstructorSymbol(symbol);
                    }
                }
            }
            checkSourceElement(node.body);
            if (node.type && !isAccessor(node.kind) && !node.asteriskToken) {
                checkIfNonVoidFunctionHasReturnExpressionsOrSingleThrowStatment(node, getTypeFromTypeNode(node.type));
            }
            if (compilerOptions.noImplicitAny && ts.nodeIsMissing(node.body) && !node.type && !isPrivateWithinAmbient(node)) {
                reportImplicitAnyError(node, anyType);
            }
        }
        function checkBlock(node) {
            if (node.kind === 179) {
                checkGrammarStatementInAmbientContext(node);
            }
            ts.forEach(node.statements, checkSourceElement);
            if (ts.isFunctionBlock(node) || node.kind === 206) {
                checkFunctionExpressionBodies(node);
            }
        }
        function checkCollisionWithArgumentsInGeneratedCode(node) {
            if (!ts.hasRestParameters(node) || ts.isInAmbientContext(node) || ts.nodeIsMissing(node.body)) {
                return;
            }
            ts.forEach(node.parameters, function (p) {
                if (p.name && !ts.isBindingPattern(p.name) && p.name.text === argumentsSymbol.name) {
                    error(p, ts.Diagnostics.Duplicate_identifier_arguments_Compiler_uses_arguments_to_initialize_rest_parameters);
                }
            });
        }
        function needCollisionCheckForIdentifier(node, identifier, name) {
            if (!(identifier && identifier.text === name)) {
                return false;
            }
            if (node.kind === 132 ||
                node.kind === 131 ||
                node.kind === 134 ||
                node.kind === 133 ||
                node.kind === 136 ||
                node.kind === 137) {
                return false;
            }
            if (ts.isInAmbientContext(node)) {
                return false;
            }
            var root = getRootDeclaration(node);
            if (root.kind === 129 && ts.nodeIsMissing(root.parent.body)) {
                return false;
            }
            return true;
        }
        function checkCollisionWithCapturedThisVariable(node, name) {
            if (needCollisionCheckForIdentifier(node, name, "_this")) {
                potentialThisCollisions.push(node);
            }
        }
        function checkIfThisIsCapturedInEnclosingScope(node) {
            var current = node;
            while (current) {
                if (getNodeCheckFlags(current) & 4) {
                    var isDeclaration_1 = node.kind !== 65;
                    if (isDeclaration_1) {
                        error(node.name, ts.Diagnostics.Duplicate_identifier_this_Compiler_uses_variable_declaration_this_to_capture_this_reference);
                    }
                    else {
                        error(node, ts.Diagnostics.Expression_resolves_to_variable_declaration_this_that_compiler_uses_to_capture_this_reference);
                    }
                    return;
                }
                current = current.parent;
            }
        }
        function checkCollisionWithCapturedSuperVariable(node, name) {
            if (!needCollisionCheckForIdentifier(node, name, "_super")) {
                return;
            }
            var enclosingClass = ts.getAncestor(node, 201);
            if (!enclosingClass || ts.isInAmbientContext(enclosingClass)) {
                return;
            }
            if (ts.getClassExtendsHeritageClauseElement(enclosingClass)) {
                var isDeclaration_2 = node.kind !== 65;
                if (isDeclaration_2) {
                    error(node, ts.Diagnostics.Duplicate_identifier_super_Compiler_uses_super_to_capture_base_class_reference);
                }
                else {
                    error(node, ts.Diagnostics.Expression_resolves_to_super_that_compiler_uses_to_capture_base_class_reference);
                }
            }
        }
        function checkCollisionWithRequireExportsInGeneratedCode(node, name) {
            if (!needCollisionCheckForIdentifier(node, name, "require") && !needCollisionCheckForIdentifier(node, name, "exports")) {
                return;
            }
            if (node.kind === 205 && ts.getModuleInstanceState(node) !== 1) {
                return;
            }
            var parent = getDeclarationContainer(node);
            if (parent.kind === 227 && ts.isExternalModule(parent)) {
                error(name, ts.Diagnostics.Duplicate_identifier_0_Compiler_reserves_name_1_in_top_level_scope_of_an_external_module, ts.declarationNameToString(name), ts.declarationNameToString(name));
            }
        }
        function checkVarDeclaredNamesNotShadowed(node) {
            // - ScriptBody : StatementList
            // It is a Syntax Error if any element of the LexicallyDeclaredNames of StatementList
            // also occurs in the VarDeclaredNames of StatementList.
            if ((ts.getCombinedNodeFlags(node) & 12288) !== 0 || isParameterDeclaration(node)) {
                return;
            }
            if (node.kind === 198 && !node.initializer) {
                return;
            }
            var symbol = getSymbolOfNode(node);
            if (symbol.flags & 1) {
                var localDeclarationSymbol = resolveName(node, node.name.text, 3, undefined, undefined);
                if (localDeclarationSymbol &&
                    localDeclarationSymbol !== symbol &&
                    localDeclarationSymbol.flags & 2) {
                    if (getDeclarationFlagsFromSymbol(localDeclarationSymbol) & 12288) {
                        var varDeclList = ts.getAncestor(localDeclarationSymbol.valueDeclaration, 199);
                        var container = varDeclList.parent.kind === 180 && varDeclList.parent.parent
                            ? varDeclList.parent.parent
                            : undefined;
                        var namesShareScope = container &&
                            (container.kind === 179 && ts.isFunctionLike(container.parent) ||
                                container.kind === 206 ||
                                container.kind === 205 ||
                                container.kind === 227);
                        if (!namesShareScope) {
                            var name_6 = symbolToString(localDeclarationSymbol);
                            error(node, ts.Diagnostics.Cannot_initialize_outer_scoped_variable_0_in_the_same_scope_as_block_scoped_declaration_1, name_6, name_6);
                        }
                    }
                }
            }
        }
        function isParameterDeclaration(node) {
            while (node.kind === 152) {
                node = node.parent.parent;
            }
            return node.kind === 129;
        }
        function checkParameterInitializer(node) {
            if (getRootDeclaration(node).kind !== 129) {
                return;
            }
            var func = ts.getContainingFunction(node);
            visit(node.initializer);
            function visit(n) {
                if (n.kind === 65) {
                    var referencedSymbol = getNodeLinks(n).resolvedSymbol;
                    if (referencedSymbol && referencedSymbol !== unknownSymbol && getSymbol(func.locals, referencedSymbol.name, 107455) === referencedSymbol) {
                        if (referencedSymbol.valueDeclaration.kind === 129) {
                            if (referencedSymbol.valueDeclaration === node) {
                                error(n, ts.Diagnostics.Parameter_0_cannot_be_referenced_in_its_initializer, ts.declarationNameToString(node.name));
                                return;
                            }
                            if (referencedSymbol.valueDeclaration.pos < node.pos) {
                                return;
                            }
                        }
                        error(n, ts.Diagnostics.Initializer_of_parameter_0_cannot_reference_identifier_1_declared_after_it, ts.declarationNameToString(node.name), ts.declarationNameToString(n));
                    }
                }
                else {
                    ts.forEachChild(n, visit);
                }
            }
        }
        function checkVariableLikeDeclaration(node) {
            checkGrammarDeclarationNameInStrictMode(node);
            checkDecorators(node);
            checkSourceElement(node.type);
            if (node.name.kind === 127) {
                checkComputedPropertyName(node.name);
                if (node.initializer) {
                    checkExpressionCached(node.initializer);
                }
            }
            if (ts.isBindingPattern(node.name)) {
                ts.forEach(node.name.elements, checkSourceElement);
            }
            if (node.initializer && getRootDeclaration(node).kind === 129 && ts.nodeIsMissing(ts.getContainingFunction(node).body)) {
                error(node, ts.Diagnostics.A_parameter_initializer_is_only_allowed_in_a_function_or_constructor_implementation);
                return;
            }
            if (ts.isBindingPattern(node.name)) {
                if (node.initializer) {
                    checkTypeAssignableTo(checkExpressionCached(node.initializer), getWidenedTypeForVariableLikeDeclaration(node), node, undefined);
                    checkParameterInitializer(node);
                }
                return;
            }
            var symbol = getSymbolOfNode(node);
            var type = getTypeOfVariableOrParameterOrProperty(symbol);
            if (node === symbol.valueDeclaration) {
                if (node.initializer) {
                    checkTypeAssignableTo(checkExpressionCached(node.initializer), type, node, undefined);
                    checkParameterInitializer(node);
                }
            }
            else {
                var declarationType = getWidenedTypeForVariableLikeDeclaration(node);
                if (type !== unknownType && declarationType !== unknownType && !isTypeIdenticalTo(type, declarationType)) {
                    error(node.name, ts.Diagnostics.Subsequent_variable_declarations_must_have_the_same_type_Variable_0_must_be_of_type_1_but_here_has_type_2, ts.declarationNameToString(node.name), typeToString(type), typeToString(declarationType));
                }
                if (node.initializer) {
                    checkTypeAssignableTo(checkExpressionCached(node.initializer), declarationType, node, undefined);
                }
            }
            if (node.kind !== 132 && node.kind !== 131) {
                checkExportsOnMergedDeclarations(node);
                if (node.kind === 198 || node.kind === 152) {
                    checkVarDeclaredNamesNotShadowed(node);
                }
                checkCollisionWithCapturedSuperVariable(node, node.name);
                checkCollisionWithCapturedThisVariable(node, node.name);
                checkCollisionWithRequireExportsInGeneratedCode(node, node.name);
            }
        }
        function checkVariableDeclaration(node) {
            checkGrammarVariableDeclaration(node);
            return checkVariableLikeDeclaration(node);
        }
        function checkBindingElement(node) {
            checkGrammarBindingElement(node);
            return checkVariableLikeDeclaration(node);
        }
        function checkVariableStatement(node) {
            checkGrammarDecorators(node) || checkGrammarDisallowedModifiersInBlockOrObjectLiteralExpression(node) || checkGrammarModifiers(node) || checkGrammarVariableDeclarationList(node.declarationList) || checkGrammarForDisallowedLetOrConstStatement(node);
            ts.forEach(node.declarationList.declarations, checkSourceElement);
        }
        function checkGrammarDisallowedModifiersInBlockOrObjectLiteralExpression(node) {
            if (node.modifiers) {
                if (inBlockOrObjectLiteralExpression(node)) {
                    return grammarErrorOnFirstToken(node, ts.Diagnostics.Modifiers_cannot_appear_here);
                }
            }
        }
        function inBlockOrObjectLiteralExpression(node) {
            while (node) {
                if (node.kind === 179 || node.kind === 154) {
                    return true;
                }
                node = node.parent;
            }
        }
        function checkExpressionStatement(node) {
            checkGrammarStatementInAmbientContext(node);
            checkExpression(node.expression);
        }
        function checkIfStatement(node) {
            checkGrammarStatementInAmbientContext(node);
            checkExpression(node.expression);
            checkSourceElement(node.thenStatement);
            checkSourceElement(node.elseStatement);
        }
        function checkDoStatement(node) {
            checkGrammarStatementInAmbientContext(node);
            checkSourceElement(node.statement);
            checkExpression(node.expression);
        }
        function checkWhileStatement(node) {
            checkGrammarStatementInAmbientContext(node);
            checkExpression(node.expression);
            checkSourceElement(node.statement);
        }
        function checkForStatement(node) {
            if (!checkGrammarStatementInAmbientContext(node)) {
                if (node.initializer && node.initializer.kind == 199) {
                    checkGrammarVariableDeclarationList(node.initializer);
                }
            }
            if (node.initializer) {
                if (node.initializer.kind === 199) {
                    ts.forEach(node.initializer.declarations, checkVariableDeclaration);
                }
                else {
                    checkExpression(node.initializer);
                }
            }
            if (node.condition)
                checkExpression(node.condition);
            if (node.incrementor)
                checkExpression(node.incrementor);
            checkSourceElement(node.statement);
        }
        function checkForOfStatement(node) {
            checkGrammarForInOrForOfStatement(node);
            if (node.initializer.kind === 199) {
                checkForInOrForOfVariableDeclaration(node);
            }
            else {
                var varExpr = node.initializer;
                var iteratedType = checkRightHandSideOfForOf(node.expression);
                if (varExpr.kind === 153 || varExpr.kind === 154) {
                    checkDestructuringAssignment(varExpr, iteratedType || unknownType);
                }
                else {
                    var leftType = checkExpression(varExpr);
                    checkReferenceExpression(varExpr, ts.Diagnostics.Invalid_left_hand_side_in_for_of_statement, ts.Diagnostics.The_left_hand_side_of_a_for_of_statement_cannot_be_a_previously_defined_constant);
                    if (iteratedType) {
                        checkTypeAssignableTo(iteratedType, leftType, varExpr, undefined);
                    }
                }
            }
            checkSourceElement(node.statement);
        }
        function checkForInStatement(node) {
            checkGrammarForInOrForOfStatement(node);
            if (node.initializer.kind === 199) {
                var variable = node.initializer.declarations[0];
                if (variable && ts.isBindingPattern(variable.name)) {
                    error(variable.name, ts.Diagnostics.The_left_hand_side_of_a_for_in_statement_cannot_be_a_destructuring_pattern);
                }
                checkForInOrForOfVariableDeclaration(node);
            }
            else {
                var varExpr = node.initializer;
                var leftType = checkExpression(varExpr);
                if (varExpr.kind === 153 || varExpr.kind === 154) {
                    error(varExpr, ts.Diagnostics.The_left_hand_side_of_a_for_in_statement_cannot_be_a_destructuring_pattern);
                }
                else if (!allConstituentTypesHaveKind(leftType, 1 | 258)) {
                    error(varExpr, ts.Diagnostics.The_left_hand_side_of_a_for_in_statement_must_be_of_type_string_or_any);
                }
                else {
                    checkReferenceExpression(varExpr, ts.Diagnostics.Invalid_left_hand_side_in_for_in_statement, ts.Diagnostics.The_left_hand_side_of_a_for_in_statement_cannot_be_a_previously_defined_constant);
                }
            }
            var rightType = checkExpression(node.expression);
            if (!allConstituentTypesHaveKind(rightType, 1 | 48128 | 512)) {
                error(node.expression, ts.Diagnostics.The_right_hand_side_of_a_for_in_statement_must_be_of_type_any_an_object_type_or_a_type_parameter);
            }
            checkSourceElement(node.statement);
        }
        function checkForInOrForOfVariableDeclaration(iterationStatement) {
            var variableDeclarationList = iterationStatement.initializer;
            if (variableDeclarationList.declarations.length >= 1) {
                var decl = variableDeclarationList.declarations[0];
                checkVariableDeclaration(decl);
            }
        }
        function checkRightHandSideOfForOf(rhsExpression) {
            var expressionType = getTypeOfExpression(rhsExpression);
            return checkIteratedTypeOrElementType(expressionType, rhsExpression, true);
        }
        function checkIteratedTypeOrElementType(inputType, errorNode, allowStringInput) {
            if (inputType.flags & 1) {
                return inputType;
            }
            if (languageVersion >= 2) {
                return checkIteratedType(inputType, errorNode) || anyType;
            }
            if (allowStringInput) {
                return checkElementTypeOfArrayOrString(inputType, errorNode);
            }
            if (isArrayLikeType(inputType)) {
                var indexType = getIndexTypeOfType(inputType, 1);
                if (indexType) {
                    return indexType;
                }
            }
            error(errorNode, ts.Diagnostics.Type_0_is_not_an_array_type, typeToString(inputType));
            return unknownType;
        }
        function checkIteratedType(iterable, errorNode) {
            ts.Debug.assert(languageVersion >= 2);
            var iteratedType = getIteratedType(iterable, errorNode);
            if (errorNode && iteratedType) {
                checkTypeAssignableTo(iterable, createIterableType(iteratedType), errorNode);
            }
            return iteratedType;
            function getIteratedType(iterable, errorNode) {
                // We want to treat type as an iterable, and get the type it is an iterable of. The iterable
                // must have the following structure (annotated with the names of the variables below):
                //
                // { // iterable
                //     [Symbol.iterator]: { // iteratorFunction
                //         (): { // iterator
                //             next: { // iteratorNextFunction
                //                 (): { // iteratorNextResult
                //                     value: T // iteratorNextValue
                //                 }
                //             }
                //         }
                //     }
                // }
                //
                // T is the type we are after. At every level that involves analyzing return types
                // of signatures, we union the return types of all the signatures.
                //
                // Another thing to note is that at any step of this process, we could run into a dead end,
                // meaning either the property is missing, or we run into the anyType. If either of these things
                // happens, we return undefined to signal that we could not find the iterated type. If a property
                // is missing, and the previous step did not result in 'any', then we also give an error if the
                // caller requested it. Then the caller can decide what to do in the case where there is no iterated
                // type. This is different from returning anyType, because that would signify that we have matched the
                // whole pattern and that T (above) is 'any'.
                if (allConstituentTypesHaveKind(iterable, 1)) {
                    return undefined;
                }
                if ((iterable.flags & 4096) && iterable.target === globalIterableType) {
                    return iterable.typeArguments[0];
                }
                var iteratorFunction = getTypeOfPropertyOfType(iterable, ts.getPropertyNameForKnownSymbolName("iterator"));
                if (iteratorFunction && allConstituentTypesHaveKind(iteratorFunction, 1)) {
                    return undefined;
                }
                var iteratorFunctionSignatures = iteratorFunction ? getSignaturesOfType(iteratorFunction, 0) : emptyArray;
                if (iteratorFunctionSignatures.length === 0) {
                    if (errorNode) {
                        error(errorNode, ts.Diagnostics.Type_must_have_a_Symbol_iterator_method_that_returns_an_iterator);
                    }
                    return undefined;
                }
                var iterator = getUnionType(ts.map(iteratorFunctionSignatures, getReturnTypeOfSignature));
                if (allConstituentTypesHaveKind(iterator, 1)) {
                    return undefined;
                }
                var iteratorNextFunction = getTypeOfPropertyOfType(iterator, "next");
                if (iteratorNextFunction && allConstituentTypesHaveKind(iteratorNextFunction, 1)) {
                    return undefined;
                }
                var iteratorNextFunctionSignatures = iteratorNextFunction ? getSignaturesOfType(iteratorNextFunction, 0) : emptyArray;
                if (iteratorNextFunctionSignatures.length === 0) {
                    if (errorNode) {
                        error(errorNode, ts.Diagnostics.An_iterator_must_have_a_next_method);
                    }
                    return undefined;
                }
                var iteratorNextResult = getUnionType(ts.map(iteratorNextFunctionSignatures, getReturnTypeOfSignature));
                if (allConstituentTypesHaveKind(iteratorNextResult, 1)) {
                    return undefined;
                }
                var iteratorNextValue = getTypeOfPropertyOfType(iteratorNextResult, "value");
                if (!iteratorNextValue) {
                    if (errorNode) {
                        error(errorNode, ts.Diagnostics.The_type_returned_by_the_next_method_of_an_iterator_must_have_a_value_property);
                    }
                    return undefined;
                }
                return iteratorNextValue;
            }
        }
        function checkElementTypeOfArrayOrString(arrayOrStringType, errorNode) {
            ts.Debug.assert(languageVersion < 2);
            var arrayType = removeTypesFromUnionType(arrayOrStringType, 258, true, true);
            var hasStringConstituent = arrayOrStringType !== arrayType;
            var reportedError = false;
            if (hasStringConstituent) {
                if (languageVersion < 1) {
                    error(errorNode, ts.Diagnostics.Using_a_string_in_a_for_of_statement_is_only_supported_in_ECMAScript_5_and_higher);
                    reportedError = true;
                }
                if (arrayType === emptyObjectType) {
                    return stringType;
                }
            }
            if (!isArrayLikeType(arrayType)) {
                if (!reportedError) {
                    var diagnostic = hasStringConstituent
                        ? ts.Diagnostics.Type_0_is_not_an_array_type
                        : ts.Diagnostics.Type_0_is_not_an_array_type_or_a_string_type;
                    error(errorNode, diagnostic, typeToString(arrayType));
                }
                return hasStringConstituent ? stringType : unknownType;
            }
            var arrayElementType = getIndexTypeOfType(arrayType, 1) || unknownType;
            if (hasStringConstituent) {
                if (arrayElementType.flags & 258) {
                    return stringType;
                }
                return getUnionType([arrayElementType, stringType]);
            }
            return arrayElementType;
        }
        function checkBreakOrContinueStatement(node) {
            checkGrammarStatementInAmbientContext(node) || checkGrammarBreakOrContinueStatement(node);
        }
        function isGetAccessorWithAnnotatatedSetAccessor(node) {
            return !!(node.kind === 136 && getSetAccessorTypeAnnotationNode(ts.getDeclarationOfKind(node.symbol, 137)));
        }
        function checkReturnStatement(node) {
            if (!checkGrammarStatementInAmbientContext(node)) {
                var functionBlock = ts.getContainingFunction(node);
                if (!functionBlock) {
                    grammarErrorOnFirstToken(node, ts.Diagnostics.A_return_statement_can_only_be_used_within_a_function_body);
                }
            }
            if (node.expression) {
                var func = ts.getContainingFunction(node);
                if (func) {
                    var returnType = getReturnTypeOfSignature(getSignatureFromDeclaration(func));
                    var exprType = checkExpressionCached(node.expression);
                    if (func.kind === 137) {
                        error(node.expression, ts.Diagnostics.Setters_cannot_return_a_value);
                    }
                    else {
                        if (func.kind === 135) {
                            if (!isTypeAssignableTo(exprType, returnType)) {
                                error(node.expression, ts.Diagnostics.Return_type_of_constructor_signature_must_be_assignable_to_the_instance_type_of_the_class);
                            }
                        }
                        else if (func.type || isGetAccessorWithAnnotatatedSetAccessor(func)) {
                            checkTypeAssignableTo(exprType, returnType, node.expression, undefined);
                        }
                    }
                }
            }
        }
        function checkWithStatement(node) {
            if (!checkGrammarStatementInAmbientContext(node)) {
                if (node.parserContextFlags & 1) {
                    grammarErrorOnFirstToken(node, ts.Diagnostics.with_statements_are_not_allowed_in_strict_mode);
                }
            }
            checkExpression(node.expression);
            error(node.expression, ts.Diagnostics.All_symbols_within_a_with_block_will_be_resolved_to_any);
        }
        function checkSwitchStatement(node) {
            checkGrammarStatementInAmbientContext(node);
            var firstDefaultClause;
            var hasDuplicateDefaultClause = false;
            var expressionType = checkExpression(node.expression);
            ts.forEach(node.caseBlock.clauses, function (clause) {
                if (clause.kind === 221 && !hasDuplicateDefaultClause) {
                    if (firstDefaultClause === undefined) {
                        firstDefaultClause = clause;
                    }
                    else {
                        var sourceFile = ts.getSourceFileOfNode(node);
                        var start = ts.skipTrivia(sourceFile.text, clause.pos);
                        var end = clause.statements.length > 0 ? clause.statements[0].pos : clause.end;
                        grammarErrorAtPos(sourceFile, start, end - start, ts.Diagnostics.A_default_clause_cannot_appear_more_than_once_in_a_switch_statement);
                        hasDuplicateDefaultClause = true;
                    }
                }
                if (produceDiagnostics && clause.kind === 220) {
                    var caseClause = clause;
                    var caseType = checkExpression(caseClause.expression);
                    if (!isTypeAssignableTo(expressionType, caseType)) {
                        checkTypeAssignableTo(caseType, expressionType, caseClause.expression, undefined);
                    }
                }
                ts.forEach(clause.statements, checkSourceElement);
            });
        }
        function checkLabeledStatement(node) {
            if (!checkGrammarStatementInAmbientContext(node)) {
                var current = node.parent;
                while (current) {
                    if (ts.isFunctionLike(current)) {
                        break;
                    }
                    if (current.kind === 194 && current.label.text === node.label.text) {
                        var sourceFile = ts.getSourceFileOfNode(node);
                        grammarErrorOnNode(node.label, ts.Diagnostics.Duplicate_label_0, ts.getTextOfNodeFromSourceText(sourceFile.text, node.label));
                        break;
                    }
                    current = current.parent;
                }
            }
            checkSourceElement(node.statement);
        }
        function checkThrowStatement(node) {
            if (!checkGrammarStatementInAmbientContext(node)) {
                if (node.expression === undefined) {
                    grammarErrorAfterFirstToken(node, ts.Diagnostics.Line_break_not_permitted_here);
                }
            }
            if (node.expression) {
                checkExpression(node.expression);
            }
        }
        function checkTryStatement(node) {
            checkGrammarStatementInAmbientContext(node);
            checkBlock(node.tryBlock);
            var catchClause = node.catchClause;
            if (catchClause) {
                if (catchClause.variableDeclaration) {
                    if (catchClause.variableDeclaration.name.kind !== 65) {
                        grammarErrorOnFirstToken(catchClause.variableDeclaration.name, ts.Diagnostics.Catch_clause_variable_name_must_be_an_identifier);
                    }
                    else if (catchClause.variableDeclaration.type) {
                        grammarErrorOnFirstToken(catchClause.variableDeclaration.type, ts.Diagnostics.Catch_clause_variable_cannot_have_a_type_annotation);
                    }
                    else if (catchClause.variableDeclaration.initializer) {
                        grammarErrorOnFirstToken(catchClause.variableDeclaration.initializer, ts.Diagnostics.Catch_clause_variable_cannot_have_an_initializer);
                    }
                    else {
                        var identifierName = catchClause.variableDeclaration.name.text;
                        var locals = catchClause.block.locals;
                        if (locals && ts.hasProperty(locals, identifierName)) {
                            var localSymbol = locals[identifierName];
                            if (localSymbol && (localSymbol.flags & 2) !== 0) {
                                grammarErrorOnNode(localSymbol.valueDeclaration, ts.Diagnostics.Cannot_redeclare_identifier_0_in_catch_clause, identifierName);
                            }
                        }
                        checkGrammarEvalOrArgumentsInStrictMode(node, catchClause.variableDeclaration.name);
                    }
                }
                checkBlock(catchClause.block);
            }
            if (node.finallyBlock) {
                checkBlock(node.finallyBlock);
            }
        }
        function checkIndexConstraints(type) {
            var declaredNumberIndexer = getIndexDeclarationOfSymbol(type.symbol, 1);
            var declaredStringIndexer = getIndexDeclarationOfSymbol(type.symbol, 0);
            var stringIndexType = getIndexTypeOfType(type, 0);
            var numberIndexType = getIndexTypeOfType(type, 1);
            if (stringIndexType || numberIndexType) {
                ts.forEach(getPropertiesOfObjectType(type), function (prop) {
                    var propType = getTypeOfSymbol(prop);
                    checkIndexConstraintForProperty(prop, propType, type, declaredStringIndexer, stringIndexType, 0);
                    checkIndexConstraintForProperty(prop, propType, type, declaredNumberIndexer, numberIndexType, 1);
                });
                if (type.flags & 1024 && type.symbol.valueDeclaration.kind === 201) {
                    var classDeclaration = type.symbol.valueDeclaration;
                    for (var _i = 0, _a = classDeclaration.members; _i < _a.length; _i++) {
                        var member = _a[_i];
                        if (!(member.flags & 128) && ts.hasDynamicName(member)) {
                            var propType = getTypeOfSymbol(member.symbol);
                            checkIndexConstraintForProperty(member.symbol, propType, type, declaredStringIndexer, stringIndexType, 0);
                            checkIndexConstraintForProperty(member.symbol, propType, type, declaredNumberIndexer, numberIndexType, 1);
                        }
                    }
                }
            }
            var errorNode;
            if (stringIndexType && numberIndexType) {
                errorNode = declaredNumberIndexer || declaredStringIndexer;
                if (!errorNode && (type.flags & 2048)) {
                    var someBaseTypeHasBothIndexers = ts.forEach(getBaseTypes(type), function (base) { return getIndexTypeOfType(base, 0) && getIndexTypeOfType(base, 1); });
                    errorNode = someBaseTypeHasBothIndexers ? undefined : type.symbol.declarations[0];
                }
            }
            if (errorNode && !isTypeAssignableTo(numberIndexType, stringIndexType)) {
                error(errorNode, ts.Diagnostics.Numeric_index_type_0_is_not_assignable_to_string_index_type_1, typeToString(numberIndexType), typeToString(stringIndexType));
            }
            function checkIndexConstraintForProperty(prop, propertyType, containingType, indexDeclaration, indexType, indexKind) {
                if (!indexType) {
                    return;
                }
                if (indexKind === 1 && !isNumericName(prop.valueDeclaration.name)) {
                    return;
                }
                var errorNode;
                if (prop.valueDeclaration.name.kind === 127 || prop.parent === containingType.symbol) {
                    errorNode = prop.valueDeclaration;
                }
                else if (indexDeclaration) {
                    errorNode = indexDeclaration;
                }
                else if (containingType.flags & 2048) {
                    var someBaseClassHasBothPropertyAndIndexer = ts.forEach(getBaseTypes(containingType), function (base) { return getPropertyOfObjectType(base, prop.name) && getIndexTypeOfType(base, indexKind); });
                    errorNode = someBaseClassHasBothPropertyAndIndexer ? undefined : containingType.symbol.declarations[0];
                }
                if (errorNode && !isTypeAssignableTo(propertyType, indexType)) {
                    var errorMessage = indexKind === 0
                        ? ts.Diagnostics.Property_0_of_type_1_is_not_assignable_to_string_index_type_2
                        : ts.Diagnostics.Property_0_of_type_1_is_not_assignable_to_numeric_index_type_2;
                    error(errorNode, errorMessage, symbolToString(prop), typeToString(propertyType), typeToString(indexType));
                }
            }
        }
        function checkTypeNameIsReserved(name, message) {
            switch (name.text) {
                case "any":
                case "number":
                case "boolean":
                case "string":
                case "symbol":
                case "void":
                    error(name, message, name.text);
            }
        }
        function checkTypeParameters(typeParameterDeclarations) {
            if (typeParameterDeclarations) {
                for (var i = 0, n = typeParameterDeclarations.length; i < n; i++) {
                    var node = typeParameterDeclarations[i];
                    checkTypeParameter(node);
                    if (produceDiagnostics) {
                        for (var j = 0; j < i; j++) {
                            if (typeParameterDeclarations[j].symbol === node.symbol) {
                                error(node.name, ts.Diagnostics.Duplicate_identifier_0, ts.declarationNameToString(node.name));
                            }
                        }
                    }
                }
            }
        }
        function checkClassExpression(node) {
            grammarErrorOnNode(node, ts.Diagnostics.class_expressions_are_not_currently_supported);
            ts.forEach(node.members, checkSourceElement);
            return unknownType;
        }
        function checkClassDeclaration(node) {
            checkGrammarDeclarationNameInStrictMode(node);
            if (node.parent.kind !== 206 && node.parent.kind !== 227) {
                grammarErrorOnNode(node, ts.Diagnostics.class_declarations_are_only_supported_directly_inside_a_module_or_as_a_top_level_declaration);
            }
            if (!node.name && !(node.flags & 256)) {
                grammarErrorOnFirstToken(node, ts.Diagnostics.A_class_declaration_without_the_default_modifier_must_have_a_name);
            }
            checkGrammarClassDeclarationHeritageClauses(node);
            checkDecorators(node);
            if (node.name) {
                checkTypeNameIsReserved(node.name, ts.Diagnostics.Class_name_cannot_be_0);
                checkCollisionWithCapturedThisVariable(node, node.name);
                checkCollisionWithRequireExportsInGeneratedCode(node, node.name);
            }
            checkTypeParameters(node.typeParameters);
            checkExportsOnMergedDeclarations(node);
            var symbol = getSymbolOfNode(node);
            var type = getDeclaredTypeOfSymbol(symbol);
            var staticType = getTypeOfSymbol(symbol);
            var baseTypeNode = ts.getClassExtendsHeritageClauseElement(node);
            if (baseTypeNode) {
                if (!ts.isSupportedHeritageClauseElement(baseTypeNode)) {
                    error(baseTypeNode.expression, ts.Diagnostics.Only_identifiers_Slashqualified_names_with_optional_type_arguments_are_currently_supported_in_a_class_extends_clauses);
                }
                emitExtends = emitExtends || !ts.isInAmbientContext(node);
                checkHeritageClauseElement(baseTypeNode);
            }
            var baseTypes = getBaseTypes(type);
            if (baseTypes.length) {
                if (produceDiagnostics) {
                    var baseType = baseTypes[0];
                    checkTypeAssignableTo(type, baseType, node.name || node, ts.Diagnostics.Class_0_incorrectly_extends_base_class_1);
                    var staticBaseType = getTypeOfSymbol(baseType.symbol);
                    checkTypeAssignableTo(staticType, getTypeWithoutConstructors(staticBaseType), node.name || node, ts.Diagnostics.Class_static_side_0_incorrectly_extends_base_class_static_side_1);
                    if (baseType.symbol !== resolveEntityName(baseTypeNode.expression, 107455)) {
                        error(baseTypeNode, ts.Diagnostics.Type_name_0_in_extends_clause_does_not_reference_constructor_function_for_0, typeToString(baseType));
                    }
                    checkKindsOfPropertyMemberOverrides(type, baseType);
                }
            }
            if (baseTypes.length || (baseTypeNode && compilerOptions.separateCompilation)) {
                checkExpressionOrQualifiedName(baseTypeNode.expression);
            }
            var implementedTypeNodes = ts.getClassImplementsHeritageClauseElements(node);
            if (implementedTypeNodes) {
                ts.forEach(implementedTypeNodes, function (typeRefNode) {
                    if (!ts.isSupportedHeritageClauseElement(typeRefNode)) {
                        error(typeRefNode.expression, ts.Diagnostics.A_class_can_only_implement_an_identifier_Slashqualified_name_with_optional_type_arguments);
                    }
                    checkHeritageClauseElement(typeRefNode);
                    if (produceDiagnostics) {
                        var t = getTypeFromHeritageClauseElement(typeRefNode);
                        if (t !== unknownType) {
                            var declaredType = (t.flags & 4096) ? t.target : t;
                            if (declaredType.flags & (1024 | 2048)) {
                                checkTypeAssignableTo(type, t, node.name || node, ts.Diagnostics.Class_0_incorrectly_implements_interface_1);
                            }
                            else {
                                error(typeRefNode, ts.Diagnostics.A_class_may_only_implement_another_class_or_interface);
                            }
                        }
                    }
                });
            }
            ts.forEach(node.members, checkSourceElement);
            if (produceDiagnostics) {
                checkIndexConstraints(type);
                checkTypeForDuplicateIndexSignatures(node);
            }
        }
        function getTargetSymbol(s) {
            return s.flags & 16777216 ? getSymbolLinks(s).target : s;
        }
        function checkKindsOfPropertyMemberOverrides(type, baseType) {
            // TypeScript 1.0 spec (April 2014): 8.2.3
            // A derived class inherits all members from its base class it doesn't override.
            // Inheritance means that a derived class implicitly contains all non - overridden members of the base class.
            // Both public and private property members are inherited, but only public property members can be overridden.
            // A property member in a derived class is said to override a property member in a base class
            // when the derived class property member has the same name and kind(instance or static)
            // as the base class property member.
            // The type of an overriding property member must be assignable(section 3.8.4)
            // to the type of the overridden property member, or otherwise a compile - time error occurs.
            // Base class instance member functions can be overridden by derived class instance member functions,
            // but not by other kinds of members.
            // Base class instance member variables and accessors can be overridden by
            // derived class instance member variables and accessors, but not by other kinds of members.
            var baseProperties = getPropertiesOfObjectType(baseType);
            for (var _i = 0; _i < baseProperties.length; _i++) {
                var baseProperty = baseProperties[_i];
                var base = getTargetSymbol(baseProperty);
                if (base.flags & 134217728) {
                    continue;
                }
                var derived = getTargetSymbol(getPropertyOfObjectType(type, base.name));
                if (derived) {
                    var baseDeclarationFlags = getDeclarationFlagsFromSymbol(base);
                    var derivedDeclarationFlags = getDeclarationFlagsFromSymbol(derived);
                    if ((baseDeclarationFlags & 32) || (derivedDeclarationFlags & 32)) {
                        continue;
                    }
                    if ((baseDeclarationFlags & 128) !== (derivedDeclarationFlags & 128)) {
                        continue;
                    }
                    if ((base.flags & derived.flags & 8192) || ((base.flags & 98308) && (derived.flags & 98308))) {
                        continue;
                    }
                    var errorMessage = void 0;
                    if (base.flags & 8192) {
                        if (derived.flags & 98304) {
                            errorMessage = ts.Diagnostics.Class_0_defines_instance_member_function_1_but_extended_class_2_defines_it_as_instance_member_accessor;
                        }
                        else {
                            ts.Debug.assert((derived.flags & 4) !== 0);
                            errorMessage = ts.Diagnostics.Class_0_defines_instance_member_function_1_but_extended_class_2_defines_it_as_instance_member_property;
                        }
                    }
                    else if (base.flags & 4) {
                        ts.Debug.assert((derived.flags & 8192) !== 0);
                        errorMessage = ts.Diagnostics.Class_0_defines_instance_member_property_1_but_extended_class_2_defines_it_as_instance_member_function;
                    }
                    else {
                        ts.Debug.assert((base.flags & 98304) !== 0);
                        ts.Debug.assert((derived.flags & 8192) !== 0);
                        errorMessage = ts.Diagnostics.Class_0_defines_instance_member_accessor_1_but_extended_class_2_defines_it_as_instance_member_function;
                    }
                    error(derived.valueDeclaration.name, errorMessage, typeToString(baseType), symbolToString(base), typeToString(type));
                }
            }
        }
        function isAccessor(kind) {
            return kind === 136 || kind === 137;
        }
        function areTypeParametersIdentical(list1, list2) {
            if (!list1 && !list2) {
                return true;
            }
            if (!list1 || !list2 || list1.length !== list2.length) {
                return false;
            }
            for (var i = 0, len = list1.length; i < len; i++) {
                var tp1 = list1[i];
                var tp2 = list2[i];
                if (tp1.name.text !== tp2.name.text) {
                    return false;
                }
                if (!tp1.constraint && !tp2.constraint) {
                    continue;
                }
                if (!tp1.constraint || !tp2.constraint) {
                    return false;
                }
                if (!isTypeIdenticalTo(getTypeFromTypeNode(tp1.constraint), getTypeFromTypeNode(tp2.constraint))) {
                    return false;
                }
            }
            return true;
        }
        function checkInheritedPropertiesAreIdentical(type, typeNode) {
            var baseTypes = getBaseTypes(type);
            if (baseTypes.length < 2) {
                return true;
            }
            var seen = {};
            ts.forEach(resolveDeclaredMembers(type).declaredProperties, function (p) { seen[p.name] = { prop: p, containingType: type }; });
            var ok = true;
            for (var _i = 0; _i < baseTypes.length; _i++) {
                var base = baseTypes[_i];
                var properties = getPropertiesOfObjectType(base);
                for (var _a = 0; _a < properties.length; _a++) {
                    var prop = properties[_a];
                    if (!ts.hasProperty(seen, prop.name)) {
                        seen[prop.name] = { prop: prop, containingType: base };
                    }
                    else {
                        var existing = seen[prop.name];
                        var isInheritedProperty = existing.containingType !== type;
                        if (isInheritedProperty && !isPropertyIdenticalTo(existing.prop, prop)) {
                            ok = false;
                            var typeName1 = typeToString(existing.containingType);
                            var typeName2 = typeToString(base);
                            var errorInfo = ts.chainDiagnosticMessages(undefined, ts.Diagnostics.Named_property_0_of_types_1_and_2_are_not_identical, symbolToString(prop), typeName1, typeName2);
                            errorInfo = ts.chainDiagnosticMessages(errorInfo, ts.Diagnostics.Interface_0_cannot_simultaneously_extend_types_1_and_2, typeToString(type), typeName1, typeName2);
                            diagnostics.add(ts.createDiagnosticForNodeFromMessageChain(typeNode, errorInfo));
                        }
                    }
                }
            }
            return ok;
        }
        function checkInterfaceDeclaration(node) {
            checkGrammarDeclarationNameInStrictMode(node) || checkGrammarDecorators(node) || checkGrammarModifiers(node) || checkGrammarInterfaceDeclaration(node);
            checkTypeParameters(node.typeParameters);
            if (produceDiagnostics) {
                checkTypeNameIsReserved(node.name, ts.Diagnostics.Interface_name_cannot_be_0);
                checkExportsOnMergedDeclarations(node);
                var symbol = getSymbolOfNode(node);
                var firstInterfaceDecl = ts.getDeclarationOfKind(symbol, 202);
                if (symbol.declarations.length > 1) {
                    if (node !== firstInterfaceDecl && !areTypeParametersIdentical(firstInterfaceDecl.typeParameters, node.typeParameters)) {
                        error(node.name, ts.Diagnostics.All_declarations_of_an_interface_must_have_identical_type_parameters);
                    }
                }
                if (node === firstInterfaceDecl) {
                    var type = getDeclaredTypeOfSymbol(symbol);
                    if (checkInheritedPropertiesAreIdentical(type, node.name)) {
                        ts.forEach(getBaseTypes(type), function (baseType) {
                            checkTypeAssignableTo(type, baseType, node.name, ts.Diagnostics.Interface_0_incorrectly_extends_interface_1);
                        });
                        checkIndexConstraints(type);
                    }
                }
            }
            ts.forEach(ts.getInterfaceBaseTypeNodes(node), function (heritageElement) {
                if (!ts.isSupportedHeritageClauseElement(heritageElement)) {
                    error(heritageElement.expression, ts.Diagnostics.An_interface_can_only_extend_an_identifier_Slashqualified_name_with_optional_type_arguments);
                }
                checkHeritageClauseElement(heritageElement);
            });
            ts.forEach(node.members, checkSourceElement);
            if (produceDiagnostics) {
                checkTypeForDuplicateIndexSignatures(node);
            }
        }
        function checkTypeAliasDeclaration(node) {
            checkGrammarDecorators(node) || checkGrammarModifiers(node);
            checkTypeNameIsReserved(node.name, ts.Diagnostics.Type_alias_name_cannot_be_0);
            checkSourceElement(node.type);
        }
        function computeEnumMemberValues(node) {
            var nodeLinks = getNodeLinks(node);
            if (!(nodeLinks.flags & 128)) {
                var enumSymbol = getSymbolOfNode(node);
                var enumType = getDeclaredTypeOfSymbol(enumSymbol);
                var autoValue = 0;
                var ambient = ts.isInAmbientContext(node);
                var enumIsConst = ts.isConst(node);
                ts.forEach(node.members, function (member) {
                    if (member.name.kind !== 127 && isNumericLiteralName(member.name.text)) {
                        error(member.name, ts.Diagnostics.An_enum_member_cannot_have_a_numeric_name);
                    }
                    var initializer = member.initializer;
                    if (initializer) {
                        autoValue = getConstantValueForEnumMemberInitializer(initializer);
                        if (autoValue === undefined) {
                            if (enumIsConst) {
                                error(initializer, ts.Diagnostics.In_const_enum_declarations_member_initializer_must_be_constant_expression);
                            }
                            else if (!ambient) {
                                checkTypeAssignableTo(checkExpression(initializer), enumType, initializer, undefined);
                            }
                        }
                        else if (enumIsConst) {
                            if (isNaN(autoValue)) {
                                error(initializer, ts.Diagnostics.const_enum_member_initializer_was_evaluated_to_disallowed_value_NaN);
                            }
                            else if (!isFinite(autoValue)) {
                                error(initializer, ts.Diagnostics.const_enum_member_initializer_was_evaluated_to_a_non_finite_value);
                            }
                        }
                    }
                    else if (ambient && !enumIsConst) {
                        autoValue = undefined;
                    }
                    if (autoValue !== undefined) {
                        getNodeLinks(member).enumMemberValue = autoValue++;
                    }
                });
                nodeLinks.flags |= 128;
            }
            function getConstantValueForEnumMemberInitializer(initializer) {
                return evalConstant(initializer);
                function evalConstant(e) {
                    switch (e.kind) {
                        case 167:
                            var value = evalConstant(e.operand);
                            if (value === undefined) {
                                return undefined;
                            }
                            switch (e.operator) {
                                case 33: return value;
                                case 34: return -value;
                                case 47: return ~value;
                            }
                            return undefined;
                        case 169:
                            var left = evalConstant(e.left);
                            if (left === undefined) {
                                return undefined;
                            }
                            var right = evalConstant(e.right);
                            if (right === undefined) {
                                return undefined;
                            }
                            switch (e.operatorToken.kind) {
                                case 44: return left | right;
                                case 43: return left & right;
                                case 41: return left >> right;
                                case 42: return left >>> right;
                                case 40: return left << right;
                                case 45: return left ^ right;
                                case 35: return left * right;
                                case 36: return left / right;
                                case 33: return left + right;
                                case 34: return left - right;
                                case 37: return left % right;
                            }
                            return undefined;
                        case 7:
                            return +e.text;
                        case 161:
                            return evalConstant(e.expression);
                        case 65:
                        case 156:
                        case 155:
                            var member = initializer.parent;
                            var currentType = getTypeOfSymbol(getSymbolOfNode(member.parent));
                            var enumType;
                            var propertyName;
                            if (e.kind === 65) {
                                enumType = currentType;
                                propertyName = e.text;
                            }
                            else {
                                var expression;
                                if (e.kind === 156) {
                                    if (e.argumentExpression === undefined ||
                                        e.argumentExpression.kind !== 8) {
                                        return undefined;
                                    }
                                    expression = e.expression;
                                    propertyName = e.argumentExpression.text;
                                }
                                else {
                                    expression = e.expression;
                                    propertyName = e.name.text;
                                }
                                var current = expression;
                                while (current) {
                                    if (current.kind === 65) {
                                        break;
                                    }
                                    else if (current.kind === 155) {
                                        current = current.expression;
                                    }
                                    else {
                                        return undefined;
                                    }
                                }
                                enumType = checkExpression(expression);
                                if (!(enumType.symbol && (enumType.symbol.flags & 384))) {
                                    return undefined;
                                }
                            }
                            if (propertyName === undefined) {
                                return undefined;
                            }
                            var property = getPropertyOfObjectType(enumType, propertyName);
                            if (!property || !(property.flags & 8)) {
                                return undefined;
                            }
                            var propertyDecl = property.valueDeclaration;
                            if (member === propertyDecl) {
                                return undefined;
                            }
                            if (!isDefinedBefore(propertyDecl, member)) {
                                return undefined;
                            }
                            return getNodeLinks(propertyDecl).enumMemberValue;
                    }
                }
            }
        }
        function checkEnumDeclaration(node) {
            if (!produceDiagnostics) {
                return;
            }
            checkGrammarDeclarationNameInStrictMode(node) || checkGrammarDecorators(node) || checkGrammarModifiers(node) || checkGrammarEnumDeclaration(node);
            checkTypeNameIsReserved(node.name, ts.Diagnostics.Enum_name_cannot_be_0);
            checkCollisionWithCapturedThisVariable(node, node.name);
            checkCollisionWithRequireExportsInGeneratedCode(node, node.name);
            checkExportsOnMergedDeclarations(node);
            computeEnumMemberValues(node);
            var enumIsConst = ts.isConst(node);
            if (compilerOptions.separateCompilation && enumIsConst && ts.isInAmbientContext(node)) {
                error(node.name, ts.Diagnostics.Ambient_const_enums_are_not_allowed_when_the_separateCompilation_flag_is_provided);
            }
            var enumSymbol = getSymbolOfNode(node);
            var firstDeclaration = ts.getDeclarationOfKind(enumSymbol, node.kind);
            if (node === firstDeclaration) {
                if (enumSymbol.declarations.length > 1) {
                    ts.forEach(enumSymbol.declarations, function (decl) {
                        if (ts.isConstEnumDeclaration(decl) !== enumIsConst) {
                            error(decl.name, ts.Diagnostics.Enum_declarations_must_all_be_const_or_non_const);
                        }
                    });
                }
                var seenEnumMissingInitialInitializer = false;
                ts.forEach(enumSymbol.declarations, function (declaration) {
                    if (declaration.kind !== 204) {
                        return false;
                    }
                    var enumDeclaration = declaration;
                    if (!enumDeclaration.members.length) {
                        return false;
                    }
                    var firstEnumMember = enumDeclaration.members[0];
                    if (!firstEnumMember.initializer) {
                        if (seenEnumMissingInitialInitializer) {
                            error(firstEnumMember.name, ts.Diagnostics.In_an_enum_with_multiple_declarations_only_one_declaration_can_omit_an_initializer_for_its_first_enum_element);
                        }
                        else {
                            seenEnumMissingInitialInitializer = true;
                        }
                    }
                });
            }
        }
        function getFirstNonAmbientClassOrFunctionDeclaration(symbol) {
            var declarations = symbol.declarations;
            for (var _i = 0; _i < declarations.length; _i++) {
                var declaration = declarations[_i];
                if ((declaration.kind === 201 ||
                    (declaration.kind === 200 && ts.nodeIsPresent(declaration.body))) &&
                    !ts.isInAmbientContext(declaration)) {
                    return declaration;
                }
            }
            return undefined;
        }
        function inSameLexicalScope(node1, node2) {
            var container1 = ts.getEnclosingBlockScopeContainer(node1);
            var container2 = ts.getEnclosingBlockScopeContainer(node2);
            if (isGlobalSourceFile(container1)) {
                return isGlobalSourceFile(container2);
            }
            else if (isGlobalSourceFile(container2)) {
                return false;
            }
            else {
                return container1 === container2;
            }
        }
        function checkModuleDeclaration(node) {
            if (produceDiagnostics) {
                if (!checkGrammarDeclarationNameInStrictMode(node) && !checkGrammarDecorators(node) && !checkGrammarModifiers(node)) {
                    if (!ts.isInAmbientContext(node) && node.name.kind === 8) {
                        grammarErrorOnNode(node.name, ts.Diagnostics.Only_ambient_modules_can_use_quoted_names);
                    }
                }
                checkCollisionWithCapturedThisVariable(node, node.name);
                checkCollisionWithRequireExportsInGeneratedCode(node, node.name);
                checkExportsOnMergedDeclarations(node);
                var symbol = getSymbolOfNode(node);
                if (symbol.flags & 512
                    && symbol.declarations.length > 1
                    && !ts.isInAmbientContext(node)
                    && ts.isInstantiatedModule(node, compilerOptions.preserveConstEnums || compilerOptions.separateCompilation)) {
                    var firstNonAmbientClassOrFunc = getFirstNonAmbientClassOrFunctionDeclaration(symbol);
                    if (firstNonAmbientClassOrFunc) {
                        if (ts.getSourceFileOfNode(node) !== ts.getSourceFileOfNode(firstNonAmbientClassOrFunc)) {
                            error(node.name, ts.Diagnostics.A_module_declaration_cannot_be_in_a_different_file_from_a_class_or_function_with_which_it_is_merged);
                        }
                        else if (node.pos < firstNonAmbientClassOrFunc.pos) {
                            error(node.name, ts.Diagnostics.A_module_declaration_cannot_be_located_prior_to_a_class_or_function_with_which_it_is_merged);
                        }
                    }
                    var mergedClass = ts.getDeclarationOfKind(symbol, 201);
                    if (mergedClass &&
                        inSameLexicalScope(node, mergedClass)) {
                        getNodeLinks(node).flags |= 2048;
                    }
                }
                if (node.name.kind === 8) {
                    if (!isGlobalSourceFile(node.parent)) {
                        error(node.name, ts.Diagnostics.Ambient_external_modules_cannot_be_nested_in_other_modules);
                    }
                    if (isExternalModuleNameRelative(node.name.text)) {
                        error(node.name, ts.Diagnostics.Ambient_external_module_declaration_cannot_specify_relative_module_name);
                    }
                }
            }
            checkSourceElement(node.body);
        }
        function getFirstIdentifier(node) {
            while (true) {
                if (node.kind === 126) {
                    node = node.left;
                }
                else if (node.kind === 155) {
                    node = node.expression;
                }
                else {
                    break;
                }
            }
            ts.Debug.assert(node.kind === 65);
            return node;
        }
        function checkExternalImportOrExportDeclaration(node) {
            var moduleName = ts.getExternalModuleName(node);
            if (!ts.nodeIsMissing(moduleName) && moduleName.kind !== 8) {
                error(moduleName, ts.Diagnostics.String_literal_expected);
                return false;
            }
            var inAmbientExternalModule = node.parent.kind === 206 && node.parent.parent.name.kind === 8;
            if (node.parent.kind !== 227 && !inAmbientExternalModule) {
                error(moduleName, node.kind === 215 ?
                    ts.Diagnostics.Export_declarations_are_not_permitted_in_an_internal_module :
                    ts.Diagnostics.Import_declarations_in_an_internal_module_cannot_reference_an_external_module);
                return false;
            }
            if (inAmbientExternalModule && isExternalModuleNameRelative(moduleName.text)) {
                error(node, ts.Diagnostics.Import_or_export_declaration_in_an_ambient_external_module_declaration_cannot_reference_external_module_through_relative_external_module_name);
                return false;
            }
            return true;
        }
        function checkAliasSymbol(node) {
            var symbol = getSymbolOfNode(node);
            var target = resolveAlias(symbol);
            if (target !== unknownSymbol) {
                var excludedMeanings = (symbol.flags & 107455 ? 107455 : 0) |
                    (symbol.flags & 793056 ? 793056 : 0) |
                    (symbol.flags & 1536 ? 1536 : 0);
                if (target.flags & excludedMeanings) {
                    var message = node.kind === 217 ?
                        ts.Diagnostics.Export_declaration_conflicts_with_exported_declaration_of_0 :
                        ts.Diagnostics.Import_declaration_conflicts_with_local_declaration_of_0;
                    error(node, message, symbolToString(symbol));
                }
            }
        }
        function checkImportBinding(node) {
            checkCollisionWithCapturedThisVariable(node, node.name);
            checkCollisionWithRequireExportsInGeneratedCode(node, node.name);
            checkAliasSymbol(node);
        }
        function checkImportDeclaration(node) {
            if (!checkGrammarImportDeclarationNameInStrictMode(node) && !checkGrammarDecorators(node) && !checkGrammarModifiers(node) && (node.flags & 499)) {
                grammarErrorOnFirstToken(node, ts.Diagnostics.An_import_declaration_cannot_have_modifiers);
            }
            if (checkExternalImportOrExportDeclaration(node)) {
                var importClause = node.importClause;
                if (importClause) {
                    if (importClause.name) {
                        checkImportBinding(importClause);
                    }
                    if (importClause.namedBindings) {
                        if (importClause.namedBindings.kind === 211) {
                            checkImportBinding(importClause.namedBindings);
                        }
                        else {
                            ts.forEach(importClause.namedBindings.elements, checkImportBinding);
                        }
                    }
                }
            }
        }
        function checkImportEqualsDeclaration(node) {
            checkGrammarDeclarationNameInStrictMode(node) || checkGrammarDecorators(node) || checkGrammarModifiers(node);
            if (ts.isInternalModuleImportEqualsDeclaration(node) || checkExternalImportOrExportDeclaration(node)) {
                checkImportBinding(node);
                if (node.flags & 1) {
                    markExportAsReferenced(node);
                }
                if (ts.isInternalModuleImportEqualsDeclaration(node)) {
                    var target = resolveAlias(getSymbolOfNode(node));
                    if (target !== unknownSymbol) {
                        if (target.flags & 107455) {
                            var moduleName = getFirstIdentifier(node.moduleReference);
                            if (!(resolveEntityName(moduleName, 107455 | 1536).flags & 1536)) {
                                error(moduleName, ts.Diagnostics.Module_0_is_hidden_by_a_local_declaration_with_the_same_name, ts.declarationNameToString(moduleName));
                            }
                        }
                        if (target.flags & 793056) {
                            checkTypeNameIsReserved(node.name, ts.Diagnostics.Import_name_cannot_be_0);
                        }
                    }
                }
                else {
                    if (languageVersion >= 2) {
                        grammarErrorOnNode(node, ts.Diagnostics.Import_assignment_cannot_be_used_when_targeting_ECMAScript_6_or_higher_Consider_using_import_Asterisk_as_ns_from_mod_import_a_from_mod_or_import_d_from_mod_instead);
                    }
                }
            }
        }
        function checkExportDeclaration(node) {
            if (!checkGrammarDecorators(node) && !checkGrammarModifiers(node) && (node.flags & 499)) {
                grammarErrorOnFirstToken(node, ts.Diagnostics.An_export_declaration_cannot_have_modifiers);
            }
            if (!node.moduleSpecifier || checkExternalImportOrExportDeclaration(node)) {
                if (node.exportClause) {
                    ts.forEach(node.exportClause.elements, checkExportSpecifier);
                    var inAmbientExternalModule = node.parent.kind === 206 && node.parent.parent.name.kind === 8;
                    if (node.parent.kind !== 227 && !inAmbientExternalModule) {
                        error(node, ts.Diagnostics.Export_declarations_are_not_permitted_in_an_internal_module);
                    }
                }
                else {
                    var moduleSymbol = resolveExternalModuleName(node, node.moduleSpecifier);
                    if (moduleSymbol && moduleSymbol.exports["export="]) {
                        error(node.moduleSpecifier, ts.Diagnostics.External_module_0_uses_export_and_cannot_be_used_with_export_Asterisk, symbolToString(moduleSymbol));
                    }
                }
            }
        }
        function checkExportSpecifier(node) {
            checkAliasSymbol(node);
            if (!node.parent.parent.moduleSpecifier) {
                markExportAsReferenced(node);
            }
        }
        function checkExportAssignment(node) {
            var container = node.parent.kind === 227 ? node.parent : node.parent.parent;
            if (container.kind === 205 && container.name.kind === 65) {
                error(node, ts.Diagnostics.An_export_assignment_cannot_be_used_in_an_internal_module);
                return;
            }
            if (!checkGrammarDecorators(node) && !checkGrammarModifiers(node) && (node.flags & 499)) {
                grammarErrorOnFirstToken(node, ts.Diagnostics.An_export_assignment_cannot_have_modifiers);
            }
            if (node.expression.kind === 65) {
                markExportAsReferenced(node);
            }
            else {
                checkExpressionCached(node.expression);
            }
            checkExternalModuleExports(container);
            if (node.isExportEquals && languageVersion >= 2) {
                grammarErrorOnNode(node, ts.Diagnostics.Export_assignment_cannot_be_used_when_targeting_ECMAScript_6_or_higher_Consider_using_export_default_instead);
            }
        }
        function getModuleStatements(node) {
            if (node.kind === 227) {
                return node.statements;
            }
            if (node.kind === 205 && node.body.kind === 206) {
                return node.body.statements;
            }
            return emptyArray;
        }
        function hasExportedMembers(moduleSymbol) {
            for (var id in moduleSymbol.exports) {
                if (id !== "export=") {
                    return true;
                }
            }
            return false;
        }
        function checkExternalModuleExports(node) {
            var moduleSymbol = getSymbolOfNode(node);
            var links = getSymbolLinks(moduleSymbol);
            if (!links.exportsChecked) {
                var exportEqualsSymbol = moduleSymbol.exports["export="];
                if (exportEqualsSymbol && hasExportedMembers(moduleSymbol)) {
                    var declaration = getDeclarationOfAliasSymbol(exportEqualsSymbol) || exportEqualsSymbol.valueDeclaration;
                    error(declaration, ts.Diagnostics.An_export_assignment_cannot_be_used_in_a_module_with_other_exported_elements);
                }
                links.exportsChecked = true;
            }
        }
        function checkSourceElement(node) {
            if (!node)
                return;
            switch (node.kind) {
                case 128:
                    return checkTypeParameter(node);
                case 129:
                    return checkParameter(node);
                case 132:
                case 131:
                    return checkPropertyDeclaration(node);
                case 142:
                case 143:
                case 138:
                case 139:
                    return checkSignatureDeclaration(node);
                case 140:
                    return checkSignatureDeclaration(node);
                case 134:
                case 133:
                    return checkMethodDeclaration(node);
                case 135:
                    return checkConstructorDeclaration(node);
                case 136:
                case 137:
                    return checkAccessorDeclaration(node);
                case 141:
                    return checkTypeReferenceNode(node);
                case 144:
                    return checkTypeQuery(node);
                case 145:
                    return checkTypeLiteral(node);
                case 146:
                    return checkArrayType(node);
                case 147:
                    return checkTupleType(node);
                case 148:
                    return checkUnionType(node);
                case 149:
                    return checkSourceElement(node.type);
                case 200:
                    return checkFunctionDeclaration(node);
                case 179:
                case 206:
                    return checkBlock(node);
                case 180:
                    return checkVariableStatement(node);
                case 182:
                    return checkExpressionStatement(node);
                case 183:
                    return checkIfStatement(node);
                case 184:
                    return checkDoStatement(node);
                case 185:
                    return checkWhileStatement(node);
                case 186:
                    return checkForStatement(node);
                case 187:
                    return checkForInStatement(node);
                case 188:
                    return checkForOfStatement(node);
                case 189:
                case 190:
                    return checkBreakOrContinueStatement(node);
                case 191:
                    return checkReturnStatement(node);
                case 192:
                    return checkWithStatement(node);
                case 193:
                    return checkSwitchStatement(node);
                case 194:
                    return checkLabeledStatement(node);
                case 195:
                    return checkThrowStatement(node);
                case 196:
                    return checkTryStatement(node);
                case 198:
                    return checkVariableDeclaration(node);
                case 152:
                    return checkBindingElement(node);
                case 201:
                    return checkClassDeclaration(node);
                case 202:
                    return checkInterfaceDeclaration(node);
                case 203:
                    return checkTypeAliasDeclaration(node);
                case 204:
                    return checkEnumDeclaration(node);
                case 205:
                    return checkModuleDeclaration(node);
                case 209:
                    return checkImportDeclaration(node);
                case 208:
                    return checkImportEqualsDeclaration(node);
                case 215:
                    return checkExportDeclaration(node);
                case 214:
                    return checkExportAssignment(node);
                case 181:
                    checkGrammarStatementInAmbientContext(node);
                    return;
                case 197:
                    checkGrammarStatementInAmbientContext(node);
                    return;
                case 218:
                    return checkMissingDeclaration(node);
            }
        }
        function checkFunctionExpressionBodies(node) {
            switch (node.kind) {
                case 162:
                case 163:
                    ts.forEach(node.parameters, checkFunctionExpressionBodies);
                    checkFunctionExpressionOrObjectLiteralMethodBody(node);
                    break;
                case 134:
                case 133:
                    ts.forEach(node.parameters, checkFunctionExpressionBodies);
                    if (ts.isObjectLiteralMethod(node)) {
                        checkFunctionExpressionOrObjectLiteralMethodBody(node);
                    }
                    break;
                case 135:
                case 136:
                case 137:
                case 200:
                    ts.forEach(node.parameters, checkFunctionExpressionBodies);
                    break;
                case 192:
                    checkFunctionExpressionBodies(node.expression);
                    break;
                case 129:
                case 132:
                case 131:
                case 150:
                case 151:
                case 152:
                case 153:
                case 154:
                case 224:
                case 155:
                case 156:
                case 157:
                case 158:
                case 159:
                case 171:
                case 176:
                case 160:
                case 161:
                case 165:
                case 166:
                case 164:
                case 167:
                case 168:
                case 169:
                case 170:
                case 173:
                case 179:
                case 206:
                case 180:
                case 182:
                case 183:
                case 184:
                case 185:
                case 186:
                case 187:
                case 188:
                case 189:
                case 190:
                case 191:
                case 193:
                case 207:
                case 220:
                case 221:
                case 194:
                case 195:
                case 196:
                case 223:
                case 198:
                case 199:
                case 201:
                case 204:
                case 226:
                case 214:
                case 227:
                    ts.forEachChild(node, checkFunctionExpressionBodies);
                    break;
            }
        }
        function checkSourceFile(node) {
            var start = new Date().getTime();
            checkSourceFileWorker(node);
            ts.checkTime += new Date().getTime() - start;
        }
        function checkSourceFileWorker(node) {
            var links = getNodeLinks(node);
            if (!(links.flags & 1)) {
                checkGrammarSourceFile(node);
                emitExtends = false;
                emitDecorate = false;
                emitParam = false;
                potentialThisCollisions.length = 0;
                ts.forEach(node.statements, checkSourceElement);
                checkFunctionExpressionBodies(node);
                if (ts.isExternalModule(node)) {
                    checkExternalModuleExports(node);
                }
                if (potentialThisCollisions.length) {
                    ts.forEach(potentialThisCollisions, checkIfThisIsCapturedInEnclosingScope);
                    potentialThisCollisions.length = 0;
                }
                if (emitExtends) {
                    links.flags |= 8;
                }
                if (emitDecorate) {
                    links.flags |= 512;
                }
                if (emitParam) {
                    links.flags |= 1024;
                }
                links.flags |= 1;
            }
        }
        function getDiagnostics(sourceFile) {
            throwIfNonDiagnosticsProducing();
            if (sourceFile) {
                checkSourceFile(sourceFile);
                return diagnostics.getDiagnostics(sourceFile.fileName);
            }
            ts.forEach(host.getSourceFiles(), checkSourceFile);
            return diagnostics.getDiagnostics();
        }
        function getGlobalDiagnostics() {
            throwIfNonDiagnosticsProducing();
            return diagnostics.getGlobalDiagnostics();
        }
        function throwIfNonDiagnosticsProducing() {
            if (!produceDiagnostics) {
                throw new Error("Trying to get diagnostics from a type checker that does not produce them.");
            }
        }
        function isInsideWithStatementBody(node) {
            if (node) {
                while (node.parent) {
                    if (node.parent.kind === 192 && node.parent.statement === node) {
                        return true;
                    }
                    node = node.parent;
                }
            }
            return false;
        }
        function getSymbolsInScope(location, meaning) {
            var symbols = {};
            var memberFlags = 0;
            if (isInsideWithStatementBody(location)) {
                return [];
            }
            populateSymbols();
            return symbolsToArray(symbols);
            function populateSymbols() {
                while (location) {
                    if (location.locals && !isGlobalSourceFile(location)) {
                        copySymbols(location.locals, meaning);
                    }
                    switch (location.kind) {
                        case 227:
                            if (!ts.isExternalModule(location)) {
                                break;
                            }
                        case 205:
                            copySymbols(getSymbolOfNode(location).exports, meaning & 8914931);
                            break;
                        case 204:
                            copySymbols(getSymbolOfNode(location).exports, meaning & 8);
                            break;
                        case 201:
                        case 202:
                            if (!(memberFlags & 128)) {
                                copySymbols(getSymbolOfNode(location).members, meaning & 793056);
                            }
                            break;
                        case 162:
                            if (location.name) {
                                copySymbol(location.symbol, meaning);
                            }
                            break;
                    }
                    memberFlags = location.flags;
                    location = location.parent;
                }
                copySymbols(globals, meaning);
            }
            function copySymbol(symbol, meaning) {
                if (symbol.flags & meaning) {
                    var id = symbol.name;
                    if (!isReservedMemberName(id) && !ts.hasProperty(symbols, id)) {
                        symbols[id] = symbol;
                    }
                }
            }
            function copySymbols(source, meaning) {
                if (meaning) {
                    for (var id in source) {
                        if (ts.hasProperty(source, id)) {
                            copySymbol(source[id], meaning);
                        }
                    }
                }
            }
            if (isInsideWithStatementBody(location)) {
                return [];
            }
            while (location) {
                if (location.locals && !isGlobalSourceFile(location)) {
                    copySymbols(location.locals, meaning);
                }
                switch (location.kind) {
                    case 227:
                        if (!ts.isExternalModule(location))
                            break;
                    case 205:
                        copySymbols(getSymbolOfNode(location).exports, meaning & 8914931);
                        break;
                    case 204:
                        copySymbols(getSymbolOfNode(location).exports, meaning & 8);
                        break;
                    case 201:
                    case 202:
                        if (!(memberFlags & 128)) {
                            copySymbols(getSymbolOfNode(location).members, meaning & 793056);
                        }
                        break;
                    case 162:
                        if (location.name) {
                            copySymbol(location.symbol, meaning);
                        }
                        break;
                }
                memberFlags = location.flags;
                location = location.parent;
            }
            copySymbols(globals, meaning);
            return symbolsToArray(symbols);
        }
        function isTypeDeclarationName(name) {
            return name.kind == 65 &&
                isTypeDeclaration(name.parent) &&
                name.parent.name === name;
        }
        function isTypeDeclaration(node) {
            switch (node.kind) {
                case 128:
                case 201:
                case 202:
                case 203:
                case 204:
                    return true;
            }
        }
        function isTypeReferenceIdentifier(entityName) {
            var node = entityName;
            while (node.parent && node.parent.kind === 126) {
                node = node.parent;
            }
            return node.parent && node.parent.kind === 141;
        }
        function isHeritageClauseElementIdentifier(entityName) {
            var node = entityName;
            while (node.parent && node.parent.kind === 155) {
                node = node.parent;
            }
            return node.parent && node.parent.kind === 177;
        }
        function isTypeNode(node) {
            if (141 <= node.kind && node.kind <= 149) {
                return true;
            }
            switch (node.kind) {
                case 112:
                case 119:
                case 121:
                case 113:
                case 122:
                    return true;
                case 99:
                    return node.parent.kind !== 166;
                case 8:
                    return node.parent.kind === 129;
                case 177:
                    return true;
                case 65:
                    if (node.parent.kind === 126 && node.parent.right === node) {
                        node = node.parent;
                    }
                    else if (node.parent.kind === 155 && node.parent.name === node) {
                        node = node.parent;
                    }
                case 126:
                case 155:
                    ts.Debug.assert(node.kind === 65 || node.kind === 126 || node.kind === 155, "'node' was expected to be a qualified name, identifier or property access in 'isTypeNode'.");
                    var parent_4 = node.parent;
                    if (parent_4.kind === 144) {
                        return false;
                    }
                    if (141 <= parent_4.kind && parent_4.kind <= 149) {
                        return true;
                    }
                    switch (parent_4.kind) {
                        case 177:
                            return true;
                        case 128:
                            return node === parent_4.constraint;
                        case 132:
                        case 131:
                        case 129:
                        case 198:
                            return node === parent_4.type;
                        case 200:
                        case 162:
                        case 163:
                        case 135:
                        case 134:
                        case 133:
                        case 136:
                        case 137:
                            return node === parent_4.type;
                        case 138:
                        case 139:
                        case 140:
                            return node === parent_4.type;
                        case 160:
                            return node === parent_4.type;
                        case 157:
                        case 158:
                            return parent_4.typeArguments && ts.indexOf(parent_4.typeArguments, node) >= 0;
                        case 159:
                            return false;
                    }
            }
            return false;
        }
        function getLeftSideOfImportEqualsOrExportAssignment(nodeOnRightSide) {
            while (nodeOnRightSide.parent.kind === 126) {
                nodeOnRightSide = nodeOnRightSide.parent;
            }
            if (nodeOnRightSide.parent.kind === 208) {
                return nodeOnRightSide.parent.moduleReference === nodeOnRightSide && nodeOnRightSide.parent;
            }
            if (nodeOnRightSide.parent.kind === 214) {
                return nodeOnRightSide.parent.expression === nodeOnRightSide && nodeOnRightSide.parent;
            }
            return undefined;
        }
        function isInRightSideOfImportOrExportAssignment(node) {
            return getLeftSideOfImportEqualsOrExportAssignment(node) !== undefined;
        }
        function getSymbolOfEntityNameOrPropertyAccessExpression(entityName) {
            if (ts.isDeclarationName(entityName)) {
                return getSymbolOfNode(entityName.parent);
            }
            if (entityName.parent.kind === 214) {
                return resolveEntityName(entityName, 107455 | 793056 | 1536 | 8388608);
            }
            if (entityName.kind !== 155) {
                if (isInRightSideOfImportOrExportAssignment(entityName)) {
                    return getSymbolOfPartOfRightHandSideOfImportEquals(entityName);
                }
            }
            if (ts.isRightSideOfQualifiedNameOrPropertyAccess(entityName)) {
                entityName = entityName.parent;
            }
            if (isHeritageClauseElementIdentifier(entityName)) {
                var meaning = entityName.parent.kind === 177 ? 793056 : 1536;
                meaning |= 8388608;
                return resolveEntityName(entityName, meaning);
            }
            else if (ts.isExpression(entityName)) {
                if (ts.nodeIsMissing(entityName)) {
                    return undefined;
                }
                if (entityName.kind === 65) {
                    var meaning = 107455 | 8388608;
                    return resolveEntityName(entityName, meaning);
                }
                else if (entityName.kind === 155) {
                    var symbol = getNodeLinks(entityName).resolvedSymbol;
                    if (!symbol) {
                        checkPropertyAccessExpression(entityName);
                    }
                    return getNodeLinks(entityName).resolvedSymbol;
                }
                else if (entityName.kind === 126) {
                    var symbol = getNodeLinks(entityName).resolvedSymbol;
                    if (!symbol) {
                        checkQualifiedName(entityName);
                    }
                    return getNodeLinks(entityName).resolvedSymbol;
                }
            }
            else if (isTypeReferenceIdentifier(entityName)) {
                var meaning = entityName.parent.kind === 141 ? 793056 : 1536;
                meaning |= 8388608;
                return resolveEntityName(entityName, meaning);
            }
            return undefined;
        }
        function getSymbolInfo(node) {
            if (isInsideWithStatementBody(node)) {
                return undefined;
            }
            if (ts.isDeclarationName(node)) {
                return getSymbolOfNode(node.parent);
            }
            if (node.kind === 65 && isInRightSideOfImportOrExportAssignment(node)) {
                return node.parent.kind === 214
                    ? getSymbolOfEntityNameOrPropertyAccessExpression(node)
                    : getSymbolOfPartOfRightHandSideOfImportEquals(node);
            }
            switch (node.kind) {
                case 65:
                case 155:
                case 126:
                    return getSymbolOfEntityNameOrPropertyAccessExpression(node);
                case 93:
                case 91:
                    var type = checkExpression(node);
                    return type.symbol;
                case 114:
                    var constructorDeclaration = node.parent;
                    if (constructorDeclaration && constructorDeclaration.kind === 135) {
                        return constructorDeclaration.parent.symbol;
                    }
                    return undefined;
                case 8:
                    var moduleName;
                    if ((ts.isExternalModuleImportEqualsDeclaration(node.parent.parent) &&
                        ts.getExternalModuleImportEqualsDeclarationExpression(node.parent.parent) === node) ||
                        ((node.parent.kind === 209 || node.parent.kind === 215) &&
                            node.parent.moduleSpecifier === node)) {
                        return resolveExternalModuleName(node, node);
                    }
                case 7:
                    if (node.parent.kind == 156 && node.parent.argumentExpression === node) {
                        var objectType = checkExpression(node.parent.expression);
                        if (objectType === unknownType)
                            return undefined;
                        var apparentType = getApparentType(objectType);
                        if (apparentType === unknownType)
                            return undefined;
                        return getPropertyOfType(apparentType, node.text);
                    }
                    break;
            }
            return undefined;
        }
        function getShorthandAssignmentValueSymbol(location) {
            if (location && location.kind === 225) {
                return resolveEntityName(location.name, 107455);
            }
            return undefined;
        }
        function getTypeOfNode(node) {
            if (isInsideWithStatementBody(node)) {
                return unknownType;
            }
            if (isTypeNode(node)) {
                return getTypeFromTypeNode(node);
            }
            if (ts.isExpression(node)) {
                return getTypeOfExpression(node);
            }
            if (isTypeDeclaration(node)) {
                var symbol = getSymbolOfNode(node);
                return getDeclaredTypeOfSymbol(symbol);
            }
            if (isTypeDeclarationName(node)) {
                var symbol = getSymbolInfo(node);
                return symbol && getDeclaredTypeOfSymbol(symbol);
            }
            if (ts.isDeclaration(node)) {
                var symbol = getSymbolOfNode(node);
                return getTypeOfSymbol(symbol);
            }
            if (ts.isDeclarationName(node)) {
                var symbol = getSymbolInfo(node);
                return symbol && getTypeOfSymbol(symbol);
            }
            if (isInRightSideOfImportOrExportAssignment(node)) {
                var symbol = getSymbolInfo(node);
                var declaredType = symbol && getDeclaredTypeOfSymbol(symbol);
                return declaredType !== unknownType ? declaredType : getTypeOfSymbol(symbol);
            }
            return unknownType;
        }
        function getTypeOfExpression(expr) {
            if (ts.isRightSideOfQualifiedNameOrPropertyAccess(expr)) {
                expr = expr.parent;
            }
            return checkExpression(expr);
        }
        function getAugmentedPropertiesOfType(type) {
            type = getApparentType(type);
            var propsByName = createSymbolTable(getPropertiesOfType(type));
            if (getSignaturesOfType(type, 0).length || getSignaturesOfType(type, 1).length) {
                ts.forEach(getPropertiesOfType(globalFunctionType), function (p) {
                    if (!ts.hasProperty(propsByName, p.name)) {
                        propsByName[p.name] = p;
                    }
                });
            }
            return getNamedMembers(propsByName);
        }
        function getRootSymbols(symbol) {
            if (symbol.flags & 268435456) {
                var symbols = [];
                var name_7 = symbol.name;
                ts.forEach(getSymbolLinks(symbol).unionType.types, function (t) {
                    symbols.push(getPropertyOfType(t, name_7));
                });
                return symbols;
            }
            else if (symbol.flags & 67108864) {
                var target = getSymbolLinks(symbol).target;
                if (target) {
                    return [target];
                }
            }
            return [symbol];
        }
        function isExternalModuleSymbol(symbol) {
            return symbol.flags & 512 && symbol.declarations.length === 1 && symbol.declarations[0].kind === 227;
        }
        function getAliasNameSubstitution(symbol, getGeneratedNameForNode) {
            if (languageVersion >= 2) {
                return undefined;
            }
            var node = getDeclarationOfAliasSymbol(symbol);
            if (node) {
                if (node.kind === 210) {
                    var defaultKeyword;
                    if (languageVersion === 0) {
                        defaultKeyword = "[\"default\"]";
                    }
                    else {
                        defaultKeyword = ".default";
                    }
                    return getGeneratedNameForNode(node.parent) + defaultKeyword;
                }
                if (node.kind === 213) {
                    var moduleName = getGeneratedNameForNode(node.parent.parent.parent);
                    var propertyName = node.propertyName || node.name;
                    return moduleName + "." + ts.unescapeIdentifier(propertyName.text);
                }
            }
        }
        function getExportNameSubstitution(symbol, location, getGeneratedNameForNode) {
            if (isExternalModuleSymbol(symbol.parent)) {
                if (languageVersion >= 2) {
                    return undefined;
                }
                return "exports." + ts.unescapeIdentifier(symbol.name);
            }
            var node = location;
            var containerSymbol = getParentOfSymbol(symbol);
            while (node) {
                if ((node.kind === 205 || node.kind === 204) && getSymbolOfNode(node) === containerSymbol) {
                    return getGeneratedNameForNode(node) + "." + ts.unescapeIdentifier(symbol.name);
                }
                node = node.parent;
            }
        }
        function getExpressionNameSubstitution(node, getGeneratedNameForNode) {
            var symbol = getNodeLinks(node).resolvedSymbol || (ts.isDeclarationName(node) ? getSymbolOfNode(node.parent) : undefined);
            if (symbol) {
                if (symbol.parent) {
                    return getExportNameSubstitution(symbol, node.parent, getGeneratedNameForNode);
                }
                var exportSymbol = getExportSymbolOfValueSymbolIfExported(symbol);
                if (symbol !== exportSymbol && !(exportSymbol.flags & 944)) {
                    return getExportNameSubstitution(exportSymbol, node.parent, getGeneratedNameForNode);
                }
                if (symbol.flags & 8388608) {
                    return getAliasNameSubstitution(symbol, getGeneratedNameForNode);
                }
            }
        }
        function isValueAliasDeclaration(node) {
            switch (node.kind) {
                case 208:
                case 210:
                case 211:
                case 213:
                case 217:
                    return isAliasResolvedToValue(getSymbolOfNode(node));
                case 215:
                    var exportClause = node.exportClause;
                    return exportClause && ts.forEach(exportClause.elements, isValueAliasDeclaration);
                case 214:
                    return node.expression && node.expression.kind === 65 ? isAliasResolvedToValue(getSymbolOfNode(node)) : true;
            }
            return false;
        }
        function isTopLevelValueImportEqualsWithEntityName(node) {
            if (node.parent.kind !== 227 || !ts.isInternalModuleImportEqualsDeclaration(node)) {
                return false;
            }
            var isValue = isAliasResolvedToValue(getSymbolOfNode(node));
            return isValue && node.moduleReference && !ts.nodeIsMissing(node.moduleReference);
        }
        function isAliasResolvedToValue(symbol) {
            var target = resolveAlias(symbol);
            if (target === unknownSymbol && compilerOptions.separateCompilation) {
                return true;
            }
            return target !== unknownSymbol && target && target.flags & 107455 && !isConstEnumOrConstEnumOnlyModule(target);
        }
        function isConstEnumOrConstEnumOnlyModule(s) {
            return isConstEnumSymbol(s) || s.constEnumOnlyModule;
        }
        function isReferencedAliasDeclaration(node, checkChildren) {
            if (ts.isAliasSymbolDeclaration(node)) {
                var symbol = getSymbolOfNode(node);
                if (getSymbolLinks(symbol).referenced) {
                    return true;
                }
            }
            if (checkChildren) {
                return ts.forEachChild(node, function (node) { return isReferencedAliasDeclaration(node, checkChildren); });
            }
            return false;
        }
        function isImplementationOfOverload(node) {
            if (ts.nodeIsPresent(node.body)) {
                var symbol = getSymbolOfNode(node);
                var signaturesOfSymbol = getSignaturesOfSymbol(symbol);
                return signaturesOfSymbol.length > 1 ||
                    (signaturesOfSymbol.length === 1 && signaturesOfSymbol[0].declaration !== node);
            }
            return false;
        }
        function getNodeCheckFlags(node) {
            return getNodeLinks(node).flags;
        }
        function getEnumMemberValue(node) {
            computeEnumMemberValues(node.parent);
            return getNodeLinks(node).enumMemberValue;
        }
        function getConstantValue(node) {
            if (node.kind === 226) {
                return getEnumMemberValue(node);
            }
            var symbol = getNodeLinks(node).resolvedSymbol;
            if (symbol && (symbol.flags & 8)) {
                if (ts.isConstEnumDeclaration(symbol.valueDeclaration.parent)) {
                    return getEnumMemberValue(symbol.valueDeclaration);
                }
            }
            return undefined;
        }
        function serializeEntityName(node, getGeneratedNameForNode, fallbackPath) {
            if (node.kind === 65) {
                var substitution = getExpressionNameSubstitution(node, getGeneratedNameForNode);
                var text = substitution || node.text;
                if (fallbackPath) {
                    fallbackPath.push(text);
                }
                else {
                    return text;
                }
            }
            else {
                var left = serializeEntityName(node.left, getGeneratedNameForNode, fallbackPath);
                var right = serializeEntityName(node.right, getGeneratedNameForNode, fallbackPath);
                if (!fallbackPath) {
                    return left + "." + right;
                }
            }
        }
        function serializeTypeReferenceNode(node, getGeneratedNameForNode) {
            var type = getTypeFromTypeReference(node);
            if (type.flags & 16) {
                return "void 0";
            }
            else if (type.flags & 8) {
                return "Boolean";
            }
            else if (type.flags & 132) {
                return "Number";
            }
            else if (type.flags & 258) {
                return "String";
            }
            else if (type.flags & 8192) {
                return "Array";
            }
            else if (type.flags & 1048576) {
                return "Symbol";
            }
            else if (type === unknownType) {
                var fallbackPath = [];
                serializeEntityName(node.typeName, getGeneratedNameForNode, fallbackPath);
                return fallbackPath;
            }
            else if (type.symbol && type.symbol.valueDeclaration) {
                return serializeEntityName(node.typeName, getGeneratedNameForNode);
            }
            else if (typeHasCallOrConstructSignatures(type)) {
                return "Function";
            }
            return "Object";
        }
        function serializeTypeNode(node, getGeneratedNameForNode) {
            if (node) {
                switch (node.kind) {
                    case 99:
                        return "void 0";
                    case 149:
                        return serializeTypeNode(node.type, getGeneratedNameForNode);
                    case 142:
                    case 143:
                        return "Function";
                    case 146:
                    case 147:
                        return "Array";
                    case 113:
                        return "Boolean";
                    case 121:
                    case 8:
                        return "String";
                    case 119:
                        return "Number";
                    case 141:
                        return serializeTypeReferenceNode(node, getGeneratedNameForNode);
                    case 144:
                    case 145:
                    case 148:
                    case 112:
                        break;
                    default:
                        ts.Debug.fail("Cannot serialize unexpected type node.");
                        break;
                }
            }
            return "Object";
        }
        function serializeTypeOfNode(node, getGeneratedNameForNode) {
            switch (node.kind) {
                case 201: return "Function";
                case 132: return serializeTypeNode(node.type, getGeneratedNameForNode);
                case 129: return serializeTypeNode(node.type, getGeneratedNameForNode);
                case 136: return serializeTypeNode(node.type, getGeneratedNameForNode);
                case 137: return serializeTypeNode(getSetAccessorTypeAnnotationNode(node), getGeneratedNameForNode);
            }
            if (ts.isFunctionLike(node)) {
                return "Function";
            }
            return "void 0";
        }
        function serializeParameterTypesOfNode(node, getGeneratedNameForNode) {
            if (node) {
                var valueDeclaration;
                if (node.kind === 201) {
                    valueDeclaration = ts.getFirstConstructorWithBody(node);
                }
                else if (ts.isFunctionLike(node) && ts.nodeIsPresent(node.body)) {
                    valueDeclaration = node;
                }
                if (valueDeclaration) {
                    var result;
                    var parameters = valueDeclaration.parameters;
                    var parameterCount = parameters.length;
                    if (parameterCount > 0) {
                        result = new Array(parameterCount);
                        for (var i = 0; i < parameterCount; i++) {
                            if (parameters[i].dotDotDotToken) {
                                var parameterType = parameters[i].type;
                                if (parameterType.kind === 146) {
                                    parameterType = parameterType.elementType;
                                }
                                else if (parameterType.kind === 141 && parameterType.typeArguments && parameterType.typeArguments.length === 1) {
                                    parameterType = parameterType.typeArguments[0];
                                }
                                else {
                                    parameterType = undefined;
                                }
                                result[i] = serializeTypeNode(parameterType, getGeneratedNameForNode);
                            }
                            else {
                                result[i] = serializeTypeOfNode(parameters[i], getGeneratedNameForNode);
                            }
                        }
                        return result;
                    }
                }
            }
            return emptyArray;
        }
        function serializeReturnTypeOfNode(node, getGeneratedNameForNode) {
            if (node && ts.isFunctionLike(node)) {
                return serializeTypeNode(node.type, getGeneratedNameForNode);
            }
            return "void 0";
        }
        function writeTypeOfDeclaration(declaration, enclosingDeclaration, flags, writer) {
            var symbol = getSymbolOfNode(declaration);
            var type = symbol && !(symbol.flags & (2048 | 131072))
                ? getTypeOfSymbol(symbol)
                : unknownType;
            getSymbolDisplayBuilder().buildTypeDisplay(type, writer, enclosingDeclaration, flags);
        }
        function writeReturnTypeOfSignatureDeclaration(signatureDeclaration, enclosingDeclaration, flags, writer) {
            var signature = getSignatureFromDeclaration(signatureDeclaration);
            getSymbolDisplayBuilder().buildTypeDisplay(getReturnTypeOfSignature(signature), writer, enclosingDeclaration, flags);
        }
        function writeTypeOfExpression(expr, enclosingDeclaration, flags, writer) {
            var type = getTypeOfExpression(expr);
            getSymbolDisplayBuilder().buildTypeDisplay(type, writer, enclosingDeclaration, flags);
        }
        function hasGlobalName(name) {
            return ts.hasProperty(globals, name);
        }
        function resolvesToSomeValue(location, name) {
            ts.Debug.assert(!ts.nodeIsSynthesized(location), "resolvesToSomeValue called with a synthesized location");
            return !!resolveName(location, name, 107455, undefined, undefined);
        }
        function getBlockScopedVariableId(n) {
            ts.Debug.assert(!ts.nodeIsSynthesized(n));
            var isVariableDeclarationOrBindingElement = n.parent.kind === 152 || (n.parent.kind === 198 && n.parent.name === n);
            var symbol = (isVariableDeclarationOrBindingElement ? getSymbolOfNode(n.parent) : undefined) ||
                getNodeLinks(n).resolvedSymbol ||
                resolveName(n, n.text, 107455 | 8388608, undefined, undefined);
            var isLetOrConst = symbol &&
                (symbol.flags & 2) &&
                symbol.valueDeclaration.parent.kind !== 223;
            if (isLetOrConst) {
                getSymbolLinks(symbol);
                return symbol.id;
            }
            return undefined;
        }
        function instantiateSingleCallFunctionType(functionType, typeArguments) {
            if (functionType === unknownType) {
                return unknownType;
            }
            var signature = getSingleCallSignature(functionType);
            if (!signature) {
                return unknownType;
            }
            var instantiatedSignature = getSignatureInstantiation(signature, typeArguments);
            return getOrCreateTypeFromSignature(instantiatedSignature);
        }
        function createResolver() {
            return {
                getExpressionNameSubstitution: getExpressionNameSubstitution,
                isValueAliasDeclaration: isValueAliasDeclaration,
                hasGlobalName: hasGlobalName,
                isReferencedAliasDeclaration: isReferencedAliasDeclaration,
                getNodeCheckFlags: getNodeCheckFlags,
                isTopLevelValueImportEqualsWithEntityName: isTopLevelValueImportEqualsWithEntityName,
                isDeclarationVisible: isDeclarationVisible,
                isImplementationOfOverload: isImplementationOfOverload,
                writeTypeOfDeclaration: writeTypeOfDeclaration,
                writeReturnTypeOfSignatureDeclaration: writeReturnTypeOfSignatureDeclaration,
                writeTypeOfExpression: writeTypeOfExpression,
                isSymbolAccessible: isSymbolAccessible,
                isEntityNameVisible: isEntityNameVisible,
                getConstantValue: getConstantValue,
                resolvesToSomeValue: resolvesToSomeValue,
                collectLinkedAliases: collectLinkedAliases,
                getBlockScopedVariableId: getBlockScopedVariableId,
                serializeTypeOfNode: serializeTypeOfNode,
                serializeParameterTypesOfNode: serializeParameterTypesOfNode,
                serializeReturnTypeOfNode: serializeReturnTypeOfNode,
            };
        }
        function initializeTypeChecker() {
            ts.forEach(host.getSourceFiles(), function (file) {
                ts.bindSourceFile(file);
            });
            ts.forEach(host.getSourceFiles(), function (file) {
                if (!ts.isExternalModule(file)) {
                    mergeSymbolTable(globals, file.locals);
                }
            });
            getSymbolLinks(undefinedSymbol).type = undefinedType;
            getSymbolLinks(argumentsSymbol).type = getGlobalType("IArguments");
            getSymbolLinks(unknownSymbol).type = unknownType;
            globals[undefinedSymbol.name] = undefinedSymbol;
            globalArraySymbol = getGlobalTypeSymbol("Array");
            globalArrayType = getTypeOfGlobalSymbol(globalArraySymbol, 1);
            globalObjectType = getGlobalType("Object");
            globalFunctionType = getGlobalType("Function");
            globalStringType = getGlobalType("String");
            globalNumberType = getGlobalType("Number");
            globalBooleanType = getGlobalType("Boolean");
            globalRegExpType = getGlobalType("RegExp");
            getGlobalClassDecoratorType = ts.memoize(function () { return getGlobalType("ClassDecorator"); });
            getGlobalPropertyDecoratorType = ts.memoize(function () { return getGlobalType("PropertyDecorator"); });
            getGlobalMethodDecoratorType = ts.memoize(function () { return getGlobalType("MethodDecorator"); });
            getGlobalParameterDecoratorType = ts.memoize(function () { return getGlobalType("ParameterDecorator"); });
            if (languageVersion >= 2) {
                globalTemplateStringsArrayType = getGlobalType("TemplateStringsArray");
                globalESSymbolType = getGlobalType("Symbol");
                globalESSymbolConstructorSymbol = getGlobalValueSymbol("Symbol");
                globalIterableType = getGlobalType("Iterable", 1);
            }
            else {
                globalTemplateStringsArrayType = unknownType;
                globalESSymbolType = createAnonymousType(undefined, emptySymbols, emptyArray, emptyArray, undefined, undefined);
                globalESSymbolConstructorSymbol = undefined;
            }
            anyArrayType = createArrayType(anyType);
        }
        function isReservedWordInStrictMode(node) {
            return (node.parserContextFlags & 1) &&
                (102 <= node.originalKeywordKind && node.originalKeywordKind <= 110);
        }
        function reportStrictModeGrammarErrorInClassDeclaration(identifier, message, arg0, arg1, arg2) {
            if (ts.getAncestor(identifier, 201) || ts.getAncestor(identifier, 174)) {
                return grammarErrorOnNode(identifier, message, arg0);
            }
            return false;
        }
        function checkGrammarImportDeclarationNameInStrictMode(node) {
            if (node.importClause) {
                var impotClause = node.importClause;
                if (impotClause.namedBindings) {
                    var nameBindings = impotClause.namedBindings;
                    if (nameBindings.kind === 211) {
                        var name_8 = nameBindings.name;
                        if (isReservedWordInStrictMode(name_8)) {
                            var nameText = ts.declarationNameToString(name_8);
                            return grammarErrorOnNode(name_8, ts.Diagnostics.Identifier_expected_0_is_a_reserved_word_in_strict_mode, nameText);
                        }
                    }
                    else if (nameBindings.kind === 212) {
                        var reportError = false;
                        for (var _i = 0, _a = nameBindings.elements; _i < _a.length; _i++) {
                            var element = _a[_i];
                            var name_9 = element.name;
                            if (isReservedWordInStrictMode(name_9)) {
                                var nameText = ts.declarationNameToString(name_9);
                                reportError = reportError || grammarErrorOnNode(name_9, ts.Diagnostics.Identifier_expected_0_is_a_reserved_word_in_strict_mode, nameText);
                            }
                        }
                        return reportError;
                    }
                }
            }
            return false;
        }
        function checkGrammarDeclarationNameInStrictMode(node) {
            var name = node.name;
            if (name && name.kind === 65 && isReservedWordInStrictMode(name)) {
                var nameText = ts.declarationNameToString(name);
                switch (node.kind) {
                    case 129:
                    case 198:
                    case 200:
                    case 128:
                    case 152:
                    case 202:
                    case 203:
                    case 204:
                        return checkGrammarIdentifierInStrictMode(name);
                    case 201:
                        return grammarErrorOnNode(name, ts.Diagnostics.Identifier_expected_0_is_a_reserved_word_in_strict_mode_Class_definitions_are_automatically_in_strict_mode, nameText);
                    case 205:
                        return grammarErrorOnNode(name, ts.Diagnostics.Identifier_expected_0_is_a_reserved_word_in_strict_mode, nameText);
                    case 208:
                        return grammarErrorOnNode(name, ts.Diagnostics.Identifier_expected_0_is_a_reserved_word_in_strict_mode, nameText);
                }
            }
            return false;
        }
        function checkGrammarTypeReferenceInStrictMode(typeName) {
            if (typeName.kind === 65) {
                checkGrammarTypeNameInStrictMode(typeName);
            }
            else if (typeName.kind === 126) {
                checkGrammarTypeNameInStrictMode(typeName.right);
                checkGrammarTypeReferenceInStrictMode(typeName.left);
            }
        }
        function checkGrammarHeritageClauseElementInStrictMode(expression) {
            if (expression && expression.kind === 65) {
                return checkGrammarIdentifierInStrictMode(expression);
            }
            else if (expression && expression.kind === 155) {
                checkGrammarHeritageClauseElementInStrictMode(expression.expression);
            }
        }
        function checkGrammarIdentifierInStrictMode(node, nameText) {
            if (node && node.kind === 65 && isReservedWordInStrictMode(node)) {
                if (!nameText) {
                    nameText = ts.declarationNameToString(node);
                }
                var errorReport = reportStrictModeGrammarErrorInClassDeclaration(node, ts.Diagnostics.Identifier_expected_0_is_a_reserved_word_in_strict_mode_Class_definitions_are_automatically_in_strict_mode, nameText) ||
                    grammarErrorOnNode(node, ts.Diagnostics.Identifier_expected_0_is_a_reserved_word_in_strict_mode, nameText);
                return errorReport;
            }
            return false;
        }
        function checkGrammarTypeNameInStrictMode(node) {
            if (node && node.kind === 65 && isReservedWordInStrictMode(node)) {
                var nameText = ts.declarationNameToString(node);
                var errorReport = reportStrictModeGrammarErrorInClassDeclaration(node, ts.Diagnostics.Type_expected_0_is_a_reserved_word_in_strict_mode_Class_definitions_are_automatically_in_strict_mode, nameText) ||
                    grammarErrorOnNode(node, ts.Diagnostics.Type_expected_0_is_a_reserved_word_in_strict_mode, nameText);
                return errorReport;
            }
            return false;
        }
        function checkGrammarDecorators(node) {
            if (!node.decorators) {
                return false;
            }
            if (!ts.nodeCanBeDecorated(node)) {
                return grammarErrorOnFirstToken(node, ts.Diagnostics.Decorators_are_not_valid_here);
            }
            else if (languageVersion < 1) {
                return grammarErrorOnFirstToken(node, ts.Diagnostics.Decorators_are_only_available_when_targeting_ECMAScript_5_and_higher);
            }
            else if (node.kind === 136 || node.kind === 137) {
                var accessors = ts.getAllAccessorDeclarations(node.parent.members, node);
                if (accessors.firstAccessor.decorators && node === accessors.secondAccessor) {
                    return grammarErrorOnFirstToken(node, ts.Diagnostics.Decorators_cannot_be_applied_to_multiple_get_Slashset_accessors_of_the_same_name);
                }
            }
            return false;
        }
        function checkGrammarModifiers(node) {
            switch (node.kind) {
                case 136:
                case 137:
                case 135:
                case 132:
                case 131:
                case 134:
                case 133:
                case 140:
                case 201:
                case 202:
                case 205:
                case 204:
                case 180:
                case 200:
                case 203:
                case 209:
                case 208:
                case 215:
                case 214:
                case 129:
                    break;
                default:
                    return false;
            }
            if (!node.modifiers) {
                return;
            }
            var lastStatic, lastPrivate, lastProtected, lastDeclare;
            var flags = 0;
            for (var _i = 0, _a = node.modifiers; _i < _a.length; _i++) {
                var modifier = _a[_i];
                switch (modifier.kind) {
                    case 108:
                    case 107:
                    case 106:
                        var text = void 0;
                        if (modifier.kind === 108) {
                            text = "public";
                        }
                        else if (modifier.kind === 107) {
                            text = "protected";
                            lastProtected = modifier;
                        }
                        else {
                            text = "private";
                            lastPrivate = modifier;
                        }
                        if (flags & 112) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics.Accessibility_modifier_already_seen);
                        }
                        else if (flags & 128) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_must_precede_1_modifier, text, "static");
                        }
                        else if (node.parent.kind === 206 || node.parent.kind === 227) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_cannot_appear_on_a_module_element, text);
                        }
                        flags |= ts.modifierToFlag(modifier.kind);
                        break;
                    case 109:
                        if (flags & 128) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_already_seen, "static");
                        }
                        else if (node.parent.kind === 206 || node.parent.kind === 227) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_cannot_appear_on_a_module_element, "static");
                        }
                        else if (node.kind === 129) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_cannot_appear_on_a_parameter, "static");
                        }
                        flags |= 128;
                        lastStatic = modifier;
                        break;
                    case 78:
                        if (flags & 1) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_already_seen, "export");
                        }
                        else if (flags & 2) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_must_precede_1_modifier, "export", "declare");
                        }
                        else if (node.parent.kind === 201) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_cannot_appear_on_a_class_element, "export");
                        }
                        else if (node.kind === 129) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_cannot_appear_on_a_parameter, "export");
                        }
                        flags |= 1;
                        break;
                    case 115:
                        if (flags & 2) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_already_seen, "declare");
                        }
                        else if (node.parent.kind === 201) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_cannot_appear_on_a_class_element, "declare");
                        }
                        else if (node.kind === 129) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics._0_modifier_cannot_appear_on_a_parameter, "declare");
                        }
                        else if (ts.isInAmbientContext(node.parent) && node.parent.kind === 206) {
                            return grammarErrorOnNode(modifier, ts.Diagnostics.A_declare_modifier_cannot_be_used_in_an_already_ambient_context);
                        }
                        flags |= 2;
                        lastDeclare = modifier;
                        break;
                }
            }
            if (node.kind === 135) {
                if (flags & 128) {
                    return grammarErrorOnNode(lastStatic, ts.Diagnostics._0_modifier_cannot_appear_on_a_constructor_declaration, "static");
                }
                else if (flags & 64) {
                    return grammarErrorOnNode(lastProtected, ts.Diagnostics._0_modifier_cannot_appear_on_a_constructor_declaration, "protected");
                }
                else if (flags & 32) {
                    return grammarErrorOnNode(lastPrivate, ts.Diagnostics._0_modifier_cannot_appear_on_a_constructor_declaration, "private");
                }
            }
            else if ((node.kind === 209 || node.kind === 208) && flags & 2) {
                return grammarErrorOnNode(lastDeclare, ts.Diagnostics.A_declare_modifier_cannot_be_used_with_an_import_declaration, "declare");
            }
            else if (node.kind === 202 && flags & 2) {
                return grammarErrorOnNode(lastDeclare, ts.Diagnostics.A_declare_modifier_cannot_be_used_with_an_interface_declaration, "declare");
            }
            else if (node.kind === 129 && (flags & 112) && ts.isBindingPattern(node.name)) {
                return grammarErrorOnNode(node, ts.Diagnostics.A_parameter_property_may_not_be_a_binding_pattern);
            }
        }
        function checkGrammarForDisallowedTrailingComma(list) {
            if (list && list.hasTrailingComma) {
                var start = list.end - ",".length;
                var end = list.end;
                var sourceFile = ts.getSourceFileOfNode(list[0]);
                return grammarErrorAtPos(sourceFile, start, end - start, ts.Diagnostics.Trailing_comma_not_allowed);
            }
        }
        function checkGrammarTypeParameterList(node, typeParameters, file) {
            if (checkGrammarForDisallowedTrailingComma(typeParameters)) {
                return true;
            }
            if (typeParameters && typeParameters.length === 0) {
                var start = typeParameters.pos - "<".length;
                var end = ts.skipTrivia(file.text, typeParameters.end) + ">".length;
                return grammarErrorAtPos(file, start, end - start, ts.Diagnostics.Type_parameter_list_cannot_be_empty);
            }
        }
        function checkGrammarParameterList(parameters) {
            if (checkGrammarForDisallowedTrailingComma(parameters)) {
                return true;
            }
            var seenOptionalParameter = false;
            var parameterCount = parameters.length;
            for (var i = 0; i < parameterCount; i++) {
                var parameter = parameters[i];
                if (parameter.dotDotDotToken) {
                    if (i !== (parameterCount - 1)) {
                        return grammarErrorOnNode(parameter.dotDotDotToken, ts.Diagnostics.A_rest_parameter_must_be_last_in_a_parameter_list);
                    }
                    if (ts.isBindingPattern(parameter.name)) {
                        return grammarErrorOnNode(parameter.name, ts.Diagnostics.A_rest_element_cannot_contain_a_binding_pattern);
                    }
                    if (parameter.questionToken) {
                        return grammarErrorOnNode(parameter.questionToken, ts.Diagnostics.A_rest_parameter_cannot_be_optional);
                    }
                    if (parameter.initializer) {
                        return grammarErrorOnNode(parameter.name, ts.Diagnostics.A_rest_parameter_cannot_have_an_initializer);
                    }
                }
                else if (parameter.questionToken || parameter.initializer) {
                    seenOptionalParameter = true;
                    if (parameter.questionToken && parameter.initializer) {
                        return grammarErrorOnNode(parameter.name, ts.Diagnostics.Parameter_cannot_have_question_mark_and_initializer);
                    }
                }
                else {
                    if (seenOptionalParameter) {
                        return grammarErrorOnNode(parameter.name, ts.Diagnostics.A_required_parameter_cannot_follow_an_optional_parameter);
                    }
                }
            }
        }
        function checkGrammarFunctionLikeDeclaration(node) {
            var file = ts.getSourceFileOfNode(node);
            return checkGrammarDecorators(node) || checkGrammarModifiers(node) || checkGrammarTypeParameterList(node, node.typeParameters, file) ||
                checkGrammarParameterList(node.parameters) || checkGrammarArrowFunction(node, file);
        }
        function checkGrammarArrowFunction(node, file) {
            if (node.kind === 163) {
                var arrowFunction = node;
                var startLine = ts.getLineAndCharacterOfPosition(file, arrowFunction.equalsGreaterThanToken.pos).line;
                var endLine = ts.getLineAndCharacterOfPosition(file, arrowFunction.equalsGreaterThanToken.end).line;
                if (startLine !== endLine) {
                    return grammarErrorOnNode(arrowFunction.equalsGreaterThanToken, ts.Diagnostics.Line_terminator_not_permitted_before_arrow);
                }
            }
            return false;
        }
        function checkGrammarIndexSignatureParameters(node) {
            var parameter = node.parameters[0];
            if (node.parameters.length !== 1) {
                if (parameter) {
                    return grammarErrorOnNode(parameter.name, ts.Diagnostics.An_index_signature_must_have_exactly_one_parameter);
                }
                else {
                    return grammarErrorOnNode(node, ts.Diagnostics.An_index_signature_must_have_exactly_one_parameter);
                }
            }
            if (parameter.dotDotDotToken) {
                return grammarErrorOnNode(parameter.dotDotDotToken, ts.Diagnostics.An_index_signature_cannot_have_a_rest_parameter);
            }
            if (parameter.flags & 499) {
                return grammarErrorOnNode(parameter.name, ts.Diagnostics.An_index_signature_parameter_cannot_have_an_accessibility_modifier);
            }
            if (parameter.questionToken) {
                return grammarErrorOnNode(parameter.questionToken, ts.Diagnostics.An_index_signature_parameter_cannot_have_a_question_mark);
            }
            if (parameter.initializer) {
                return grammarErrorOnNode(parameter.name, ts.Diagnostics.An_index_signature_parameter_cannot_have_an_initializer);
            }
            if (!parameter.type) {
                return grammarErrorOnNode(parameter.name, ts.Diagnostics.An_index_signature_parameter_must_have_a_type_annotation);
            }
            if (parameter.type.kind !== 121 && parameter.type.kind !== 119) {
                return grammarErrorOnNode(parameter.name, ts.Diagnostics.An_index_signature_parameter_type_must_be_string_or_number);
            }
            if (!node.type) {
                return grammarErrorOnNode(node, ts.Diagnostics.An_index_signature_must_have_a_type_annotation);
            }
        }
        function checkGrammarForIndexSignatureModifier(node) {
            if (node.flags & 499) {
                grammarErrorOnFirstToken(node, ts.Diagnostics.Modifiers_not_permitted_on_index_signature_members);
            }
        }
        function checkGrammarIndexSignature(node) {
            return checkGrammarDecorators(node) || checkGrammarModifiers(node) || checkGrammarIndexSignatureParameters(node) || checkGrammarForIndexSignatureModifier(node);
        }
        function checkGrammarForAtLeastOneTypeArgument(node, typeArguments) {
            if (typeArguments && typeArguments.length === 0) {
                var sourceFile = ts.getSourceFileOfNode(node);
                var start = typeArguments.pos - "<".length;
                var end = ts.skipTrivia(sourceFile.text, typeArguments.end) + ">".length;
                return grammarErrorAtPos(sourceFile, start, end - start, ts.Diagnostics.Type_argument_list_cannot_be_empty);
            }
        }
        function checkGrammarTypeArguments(node, typeArguments) {
            return checkGrammarForDisallowedTrailingComma(typeArguments) ||
                checkGrammarForAtLeastOneTypeArgument(node, typeArguments);
        }
        function checkGrammarForOmittedArgument(node, arguments) {
            if (arguments) {
                var sourceFile = ts.getSourceFileOfNode(node);
                for (var _i = 0; _i < arguments.length; _i++) {
                    var arg = arguments[_i];
                    if (arg.kind === 175) {
                        return grammarErrorAtPos(sourceFile, arg.pos, 0, ts.Diagnostics.Argument_expression_expected);
                    }
                }
            }
        }
        function checkGrammarArguments(node, arguments) {
            return checkGrammarForDisallowedTrailingComma(arguments) ||
                checkGrammarForOmittedArgument(node, arguments);
        }
        function checkGrammarHeritageClause(node) {
            var types = node.types;
            if (checkGrammarForDisallowedTrailingComma(types)) {
                return true;
            }
            if (types && types.length === 0) {
                var listType = ts.tokenToString(node.token);
                var sourceFile = ts.getSourceFileOfNode(node);
                return grammarErrorAtPos(sourceFile, types.pos, 0, ts.Diagnostics._0_list_cannot_be_empty, listType);
            }
        }
        function checkGrammarClassDeclarationHeritageClauses(node) {
            var seenExtendsClause = false;
            var seenImplementsClause = false;
            if (!checkGrammarDecorators(node) && !checkGrammarModifiers(node) && node.heritageClauses) {
                for (var _i = 0, _a = node.heritageClauses; _i < _a.length; _i++) {
                    var heritageClause = _a[_i];
                    if (heritageClause.token === 79) {
                        if (seenExtendsClause) {
                            return grammarErrorOnFirstToken(heritageClause, ts.Diagnostics.extends_clause_already_seen);
                        }
                        if (seenImplementsClause) {
                            return grammarErrorOnFirstToken(heritageClause, ts.Diagnostics.extends_clause_must_precede_implements_clause);
                        }
                        if (heritageClause.types.length > 1) {
                            return grammarErrorOnFirstToken(heritageClause.types[1], ts.Diagnostics.Classes_can_only_extend_a_single_class);
                        }
                        seenExtendsClause = true;
                    }
                    else {
                        ts.Debug.assert(heritageClause.token === 102);
                        if (seenImplementsClause) {
                            return grammarErrorOnFirstToken(heritageClause, ts.Diagnostics.implements_clause_already_seen);
                        }
                        seenImplementsClause = true;
                    }
                    checkGrammarHeritageClause(heritageClause);
                }
            }
        }
        function checkGrammarInterfaceDeclaration(node) {
            var seenExtendsClause = false;
            if (node.heritageClauses) {
                for (var _i = 0, _a = node.heritageClauses; _i < _a.length; _i++) {
                    var heritageClause = _a[_i];
                    if (heritageClause.token === 79) {
                        if (seenExtendsClause) {
                            return grammarErrorOnFirstToken(heritageClause, ts.Diagnostics.extends_clause_already_seen);
                        }
                        seenExtendsClause = true;
                    }
                    else {
                        ts.Debug.assert(heritageClause.token === 102);
                        return grammarErrorOnFirstToken(heritageClause, ts.Diagnostics.Interface_declaration_cannot_have_implements_clause);
                    }
                    checkGrammarHeritageClause(heritageClause);
                }
            }
            return false;
        }
        function checkGrammarComputedPropertyName(node) {
            if (node.kind !== 127) {
                return false;
            }
            var computedPropertyName = node;
            if (computedPropertyName.expression.kind === 169 && computedPropertyName.expression.operatorToken.kind === 23) {
                return grammarErrorOnNode(computedPropertyName.expression, ts.Diagnostics.A_comma_expression_is_not_allowed_in_a_computed_property_name);
            }
        }
        function checkGrammarForGenerator(node) {
            if (node.asteriskToken) {
                return grammarErrorOnNode(node.asteriskToken, ts.Diagnostics.Generators_are_not_currently_supported);
            }
        }
        function checkGrammarFunctionName(name) {
            return checkGrammarEvalOrArgumentsInStrictMode(name, name);
        }
        function checkGrammarForInvalidQuestionMark(node, questionToken, message) {
            if (questionToken) {
                return grammarErrorOnNode(questionToken, message);
            }
        }
        function checkGrammarObjectLiteralExpression(node) {
            var seen = {};
            var Property = 1;
            var GetAccessor = 2;
            var SetAccesor = 4;
            var GetOrSetAccessor = GetAccessor | SetAccesor;
            var inStrictMode = (node.parserContextFlags & 1) !== 0;
            for (var _i = 0, _a = node.properties; _i < _a.length; _i++) {
                var prop = _a[_i];
                var name_10 = prop.name;
                if (prop.kind === 175 ||
                    name_10.kind === 127) {
                    checkGrammarComputedPropertyName(name_10);
                    continue;
                }
                var currentKind = void 0;
                if (prop.kind === 224 || prop.kind === 225) {
                    checkGrammarForInvalidQuestionMark(prop, prop.questionToken, ts.Diagnostics.An_object_member_cannot_be_declared_optional);
                    if (name_10.kind === 7) {
                        checkGrammarNumericLiteral(name_10);
                    }
                    currentKind = Property;
                }
                else if (prop.kind === 134) {
                    currentKind = Property;
                }
                else if (prop.kind === 136) {
                    currentKind = GetAccessor;
                }
                else if (prop.kind === 137) {
                    currentKind = SetAccesor;
                }
                else {
                    ts.Debug.fail("Unexpected syntax kind:" + prop.kind);
                }
                if (!ts.hasProperty(seen, name_10.text)) {
                    seen[name_10.text] = currentKind;
                }
                else {
                    var existingKind = seen[name_10.text];
                    if (currentKind === Property && existingKind === Property) {
                        if (inStrictMode) {
                            grammarErrorOnNode(name_10, ts.Diagnostics.An_object_literal_cannot_have_multiple_properties_with_the_same_name_in_strict_mode);
                        }
                    }
                    else if ((currentKind & GetOrSetAccessor) && (existingKind & GetOrSetAccessor)) {
                        if (existingKind !== GetOrSetAccessor && currentKind !== existingKind) {
                            seen[name_10.text] = currentKind | existingKind;
                        }
                        else {
                            return grammarErrorOnNode(name_10, ts.Diagnostics.An_object_literal_cannot_have_multiple_get_Slashset_accessors_with_the_same_name);
                        }
                    }
                    else {
                        return grammarErrorOnNode(name_10, ts.Diagnostics.An_object_literal_cannot_have_property_and_accessor_with_the_same_name);
                    }
                }
            }
        }
        function checkGrammarForInOrForOfStatement(forInOrOfStatement) {
            if (checkGrammarStatementInAmbientContext(forInOrOfStatement)) {
                return true;
            }
            if (forInOrOfStatement.initializer.kind === 199) {
                var variableList = forInOrOfStatement.initializer;
                if (!checkGrammarVariableDeclarationList(variableList)) {
                    if (variableList.declarations.length > 1) {
                        var diagnostic = forInOrOfStatement.kind === 187
                            ? ts.Diagnostics.Only_a_single_variable_declaration_is_allowed_in_a_for_in_statement
                            : ts.Diagnostics.Only_a_single_variable_declaration_is_allowed_in_a_for_of_statement;
                        return grammarErrorOnFirstToken(variableList.declarations[1], diagnostic);
                    }
                    var firstDeclaration = variableList.declarations[0];
                    if (firstDeclaration.initializer) {
                        var diagnostic = forInOrOfStatement.kind === 187
                            ? ts.Diagnostics.The_variable_declaration_of_a_for_in_statement_cannot_have_an_initializer
                            : ts.Diagnostics.The_variable_declaration_of_a_for_of_statement_cannot_have_an_initializer;
                        return grammarErrorOnNode(firstDeclaration.name, diagnostic);
                    }
                    if (firstDeclaration.type) {
                        var diagnostic = forInOrOfStatement.kind === 187
                            ? ts.Diagnostics.The_left_hand_side_of_a_for_in_statement_cannot_use_a_type_annotation
                            : ts.Diagnostics.The_left_hand_side_of_a_for_of_statement_cannot_use_a_type_annotation;
                        return grammarErrorOnNode(firstDeclaration, diagnostic);
                    }
                }
            }
            return false;
        }
        function checkGrammarAccessor(accessor) {
            var kind = accessor.kind;
            if (languageVersion < 1) {
                return grammarErrorOnNode(accessor.name, ts.Diagnostics.Accessors_are_only_available_when_targeting_ECMAScript_5_and_higher);
            }
            else if (ts.isInAmbientContext(accessor)) {
                return grammarErrorOnNode(accessor.name, ts.Diagnostics.An_accessor_cannot_be_declared_in_an_ambient_context);
            }
            else if (accessor.body === undefined) {
                return grammarErrorAtPos(ts.getSourceFileOfNode(accessor), accessor.end - 1, ";".length, ts.Diagnostics._0_expected, "{");
            }
            else if (accessor.typeParameters) {
                return grammarErrorOnNode(accessor.name, ts.Diagnostics.An_accessor_cannot_have_type_parameters);
            }
            else if (kind === 136 && accessor.parameters.length) {
                return grammarErrorOnNode(accessor.name, ts.Diagnostics.A_get_accessor_cannot_have_parameters);
            }
            else if (kind === 137) {
                if (accessor.type) {
                    return grammarErrorOnNode(accessor.name, ts.Diagnostics.A_set_accessor_cannot_have_a_return_type_annotation);
                }
                else if (accessor.parameters.length !== 1) {
                    return grammarErrorOnNode(accessor.name, ts.Diagnostics.A_set_accessor_must_have_exactly_one_parameter);
                }
                else {
                    var parameter = accessor.parameters[0];
                    if (parameter.dotDotDotToken) {
                        return grammarErrorOnNode(parameter.dotDotDotToken, ts.Diagnostics.A_set_accessor_cannot_have_rest_parameter);
                    }
                    else if (parameter.flags & 499) {
                        return grammarErrorOnNode(accessor.name, ts.Diagnostics.A_parameter_property_is_only_allowed_in_a_constructor_implementation);
                    }
                    else if (parameter.questionToken) {
                        return grammarErrorOnNode(parameter.questionToken, ts.Diagnostics.A_set_accessor_cannot_have_an_optional_parameter);
                    }
                    else if (parameter.initializer) {
                        return grammarErrorOnNode(accessor.name, ts.Diagnostics.A_set_accessor_parameter_cannot_have_an_initializer);
                    }
                }
            }
        }
        function checkGrammarForNonSymbolComputedProperty(node, message) {
            if (node.kind === 127 && !ts.isWellKnownSymbolSyntactically(node.expression)) {
                return grammarErrorOnNode(node, message);
            }
        }
        function checkGrammarMethod(node) {
            if (checkGrammarDisallowedModifiersInBlockOrObjectLiteralExpression(node) ||
                checkGrammarFunctionLikeDeclaration(node) ||
                checkGrammarForGenerator(node)) {
                return true;
            }
            if (node.parent.kind === 154) {
                if (checkGrammarForInvalidQuestionMark(node, node.questionToken, ts.Diagnostics.A_class_member_cannot_be_declared_optional)) {
                    return true;
                }
                else if (node.body === undefined) {
                    return grammarErrorAtPos(getSourceFile(node), node.end - 1, ";".length, ts.Diagnostics._0_expected, "{");
                }
            }
            if (node.parent.kind === 201) {
                if (checkGrammarForInvalidQuestionMark(node, node.questionToken, ts.Diagnostics.A_class_member_cannot_be_declared_optional)) {
                    return true;
                }
                if (ts.isInAmbientContext(node)) {
                    return checkGrammarForNonSymbolComputedProperty(node.name, ts.Diagnostics.A_computed_property_name_in_an_ambient_context_must_directly_refer_to_a_built_in_symbol);
                }
                else if (!node.body) {
                    return checkGrammarForNonSymbolComputedProperty(node.name, ts.Diagnostics.A_computed_property_name_in_a_method_overload_must_directly_refer_to_a_built_in_symbol);
                }
            }
            else if (node.parent.kind === 202) {
                return checkGrammarForNonSymbolComputedProperty(node.name, ts.Diagnostics.A_computed_property_name_in_an_interface_must_directly_refer_to_a_built_in_symbol);
            }
            else if (node.parent.kind === 145) {
                return checkGrammarForNonSymbolComputedProperty(node.name, ts.Diagnostics.A_computed_property_name_in_a_type_literal_must_directly_refer_to_a_built_in_symbol);
            }
        }
        function isIterationStatement(node, lookInLabeledStatements) {
            switch (node.kind) {
                case 186:
                case 187:
                case 188:
                case 184:
                case 185:
                    return true;
                case 194:
                    return lookInLabeledStatements && isIterationStatement(node.statement, lookInLabeledStatements);
            }
            return false;
        }
        function checkGrammarBreakOrContinueStatement(node) {
            var current = node;
            while (current) {
                if (ts.isFunctionLike(current)) {
                    return grammarErrorOnNode(node, ts.Diagnostics.Jump_target_cannot_cross_function_boundary);
                }
                switch (current.kind) {
                    case 194:
                        if (node.label && current.label.text === node.label.text) {
                            var isMisplacedContinueLabel = node.kind === 189
                                && !isIterationStatement(current.statement, true);
                            if (isMisplacedContinueLabel) {
                                return grammarErrorOnNode(node, ts.Diagnostics.A_continue_statement_can_only_jump_to_a_label_of_an_enclosing_iteration_statement);
                            }
                            return false;
                        }
                        break;
                    case 193:
                        if (node.kind === 190 && !node.label) {
                            return false;
                        }
                        break;
                    default:
                        if (isIterationStatement(current, false) && !node.label) {
                            return false;
                        }
                        break;
                }
                current = current.parent;
            }
            if (node.label) {
                var message = node.kind === 190
                    ? ts.Diagnostics.A_break_statement_can_only_jump_to_a_label_of_an_enclosing_statement
                    : ts.Diagnostics.A_continue_statement_can_only_jump_to_a_label_of_an_enclosing_iteration_statement;
                return grammarErrorOnNode(node, message);
            }
            else {
                var message = node.kind === 190
                    ? ts.Diagnostics.A_break_statement_can_only_be_used_within_an_enclosing_iteration_or_switch_statement
                    : ts.Diagnostics.A_continue_statement_can_only_be_used_within_an_enclosing_iteration_statement;
                return grammarErrorOnNode(node, message);
            }
        }
        function checkGrammarBindingElement(node) {
            if (node.dotDotDotToken) {
                var elements = node.parent.elements;
                if (node !== elements[elements.length - 1]) {
                    return grammarErrorOnNode(node, ts.Diagnostics.A_rest_element_must_be_last_in_an_array_destructuring_pattern);
                }
                if (node.name.kind === 151 || node.name.kind === 150) {
                    return grammarErrorOnNode(node.name, ts.Diagnostics.A_rest_element_cannot_contain_a_binding_pattern);
                }
                if (node.initializer) {
                    return grammarErrorAtPos(ts.getSourceFileOfNode(node), node.initializer.pos - 1, 1, ts.Diagnostics.A_rest_element_cannot_have_an_initializer);
                }
            }
            return checkGrammarEvalOrArgumentsInStrictMode(node, node.name);
        }
        function checkGrammarVariableDeclaration(node) {
            if (node.parent.parent.kind !== 187 && node.parent.parent.kind !== 188) {
                if (ts.isInAmbientContext(node)) {
                    if (node.initializer) {
                        var equalsTokenLength = "=".length;
                        return grammarErrorAtPos(ts.getSourceFileOfNode(node), node.initializer.pos - equalsTokenLength, equalsTokenLength, ts.Diagnostics.Initializers_are_not_allowed_in_ambient_contexts);
                    }
                }
                else if (!node.initializer) {
                    if (ts.isBindingPattern(node.name) && !ts.isBindingPattern(node.parent)) {
                        return grammarErrorOnNode(node, ts.Diagnostics.A_destructuring_declaration_must_have_an_initializer);
                    }
                    if (ts.isConst(node)) {
                        return grammarErrorOnNode(node, ts.Diagnostics.const_declarations_must_be_initialized);
                    }
                }
            }
            var checkLetConstNames = languageVersion >= 2 && (ts.isLet(node) || ts.isConst(node));
            return (checkLetConstNames && checkGrammarNameInLetOrConstDeclarations(node.name)) ||
                checkGrammarEvalOrArgumentsInStrictMode(node, node.name);
        }
        function checkGrammarNameInLetOrConstDeclarations(name) {
            if (name.kind === 65) {
                if (name.text === "let") {
                    return grammarErrorOnNode(name, ts.Diagnostics.let_is_not_allowed_to_be_used_as_a_name_in_let_or_const_declarations);
                }
            }
            else {
                var elements = name.elements;
                for (var _i = 0; _i < elements.length; _i++) {
                    var element = elements[_i];
                    if (element.kind !== 175) {
                        checkGrammarNameInLetOrConstDeclarations(element.name);
                    }
                }
            }
        }
        function checkGrammarVariableDeclarationList(declarationList) {
            var declarations = declarationList.declarations;
            if (checkGrammarForDisallowedTrailingComma(declarationList.declarations)) {
                return true;
            }
            if (!declarationList.declarations.length) {
                return grammarErrorAtPos(ts.getSourceFileOfNode(declarationList), declarations.pos, declarations.end - declarations.pos, ts.Diagnostics.Variable_declaration_list_cannot_be_empty);
            }
        }
        function allowLetAndConstDeclarations(parent) {
            switch (parent.kind) {
                case 183:
                case 184:
                case 185:
                case 192:
                case 186:
                case 187:
                case 188:
                    return false;
                case 194:
                    return allowLetAndConstDeclarations(parent.parent);
            }
            return true;
        }
        function checkGrammarForDisallowedLetOrConstStatement(node) {
            if (!allowLetAndConstDeclarations(node.parent)) {
                if (ts.isLet(node.declarationList)) {
                    return grammarErrorOnNode(node, ts.Diagnostics.let_declarations_can_only_be_declared_inside_a_block);
                }
                else if (ts.isConst(node.declarationList)) {
                    return grammarErrorOnNode(node, ts.Diagnostics.const_declarations_can_only_be_declared_inside_a_block);
                }
            }
        }
        function isIntegerLiteral(expression) {
            if (expression.kind === 167) {
                var unaryExpression = expression;
                if (unaryExpression.operator === 33 || unaryExpression.operator === 34) {
                    expression = unaryExpression.operand;
                }
            }
            if (expression.kind === 7) {
                return /^[0-9]+([eE]\+?[0-9]+)?$/.test(expression.text);
            }
            return false;
        }
        function checkGrammarEnumDeclaration(enumDecl) {
            var enumIsConst = (enumDecl.flags & 8192) !== 0;
            var hasError = false;
            if (!enumIsConst) {
                var inConstantEnumMemberSection = true;
                var inAmbientContext = ts.isInAmbientContext(enumDecl);
                for (var _i = 0, _a = enumDecl.members; _i < _a.length; _i++) {
                    var node = _a[_i];
                    if (node.name.kind === 127) {
                        hasError = grammarErrorOnNode(node.name, ts.Diagnostics.Computed_property_names_are_not_allowed_in_enums);
                    }
                    else if (inAmbientContext) {
                        if (node.initializer && !isIntegerLiteral(node.initializer)) {
                            hasError = grammarErrorOnNode(node.name, ts.Diagnostics.Ambient_enum_elements_can_only_have_integer_literal_initializers) || hasError;
                        }
                    }
                    else if (node.initializer) {
                        inConstantEnumMemberSection = isIntegerLiteral(node.initializer);
                    }
                    else if (!inConstantEnumMemberSection) {
                        hasError = grammarErrorOnNode(node.name, ts.Diagnostics.Enum_member_must_have_initializer) || hasError;
                    }
                }
            }
            return hasError;
        }
        function hasParseDiagnostics(sourceFile) {
            return sourceFile.parseDiagnostics.length > 0;
        }
        function grammarErrorOnFirstToken(node, message, arg0, arg1, arg2) {
            var sourceFile = ts.getSourceFileOfNode(node);
            if (!hasParseDiagnostics(sourceFile)) {
                var span = ts.getSpanOfTokenAtPosition(sourceFile, node.pos);
                diagnostics.add(ts.createFileDiagnostic(sourceFile, span.start, span.length, message, arg0, arg1, arg2));
                return true;
            }
        }
        function grammarErrorAtPos(sourceFile, start, length, message, arg0, arg1, arg2) {
            if (!hasParseDiagnostics(sourceFile)) {
                diagnostics.add(ts.createFileDiagnostic(sourceFile, start, length, message, arg0, arg1, arg2));
                return true;
            }
        }
        function grammarErrorOnNode(node, message, arg0, arg1, arg2) {
            var sourceFile = ts.getSourceFileOfNode(node);
            if (!hasParseDiagnostics(sourceFile)) {
                diagnostics.add(ts.createDiagnosticForNode(node, message, arg0, arg1, arg2));
                return true;
            }
        }
        function checkGrammarEvalOrArgumentsInStrictMode(contextNode, name) {
            if (name && name.kind === 65) {
                var identifier = name;
                if (contextNode && (contextNode.parserContextFlags & 1) && isEvalOrArgumentsIdentifier(identifier)) {
                    var nameText = ts.declarationNameToString(identifier);
                    var reportErrorInClassDeclaration = reportStrictModeGrammarErrorInClassDeclaration(identifier, ts.Diagnostics.Invalid_use_of_0_Class_definitions_are_automatically_in_strict_mode, nameText);
                    if (!reportErrorInClassDeclaration) {
                        return grammarErrorOnNode(identifier, ts.Diagnostics.Invalid_use_of_0_in_strict_mode, nameText);
                    }
                    return reportErrorInClassDeclaration;
                }
            }
        }
        function isEvalOrArgumentsIdentifier(node) {
            return node.kind === 65 &&
                (node.text === "eval" || node.text === "arguments");
        }
        function checkGrammarConstructorTypeParameters(node) {
            if (node.typeParameters) {
                return grammarErrorAtPos(ts.getSourceFileOfNode(node), node.typeParameters.pos, node.typeParameters.end - node.typeParameters.pos, ts.Diagnostics.Type_parameters_cannot_appear_on_a_constructor_declaration);
            }
        }
        function checkGrammarConstructorTypeAnnotation(node) {
            if (node.type) {
                return grammarErrorOnNode(node.type, ts.Diagnostics.Type_annotation_cannot_appear_on_a_constructor_declaration);
            }
        }
        function checkGrammarProperty(node) {
            if (node.parent.kind === 201) {
                if (checkGrammarForInvalidQuestionMark(node, node.questionToken, ts.Diagnostics.A_class_member_cannot_be_declared_optional) ||
                    checkGrammarForNonSymbolComputedProperty(node.name, ts.Diagnostics.A_computed_property_name_in_a_class_property_declaration_must_directly_refer_to_a_built_in_symbol)) {
                    return true;
                }
            }
            else if (node.parent.kind === 202) {
                if (checkGrammarForNonSymbolComputedProperty(node.name, ts.Diagnostics.A_computed_property_name_in_an_interface_must_directly_refer_to_a_built_in_symbol)) {
                    return true;
                }
            }
            else if (node.parent.kind === 145) {
                if (checkGrammarForNonSymbolComputedProperty(node.name, ts.Diagnostics.A_computed_property_name_in_a_type_literal_must_directly_refer_to_a_built_in_symbol)) {
                    return true;
                }
            }
            if (ts.isInAmbientContext(node) && node.initializer) {
                return grammarErrorOnFirstToken(node.initializer, ts.Diagnostics.Initializers_are_not_allowed_in_ambient_contexts);
            }
        }
        function checkGrammarTopLevelElementForRequiredDeclareModifier(node) {
            if (node.kind === 202 ||
                node.kind === 209 ||
                node.kind === 208 ||
                node.kind === 215 ||
                node.kind === 214 ||
                (node.flags & 2) ||
                (node.flags & (1 | 256))) {
                return false;
            }
            return grammarErrorOnFirstToken(node, ts.Diagnostics.A_declare_modifier_is_required_for_a_top_level_declaration_in_a_d_ts_file);
        }
        function checkGrammarTopLevelElementsForRequiredDeclareModifier(file) {
            for (var _i = 0, _a = file.statements; _i < _a.length; _i++) {
                var decl = _a[_i];
                if (ts.isDeclaration(decl) || decl.kind === 180) {
                    if (checkGrammarTopLevelElementForRequiredDeclareModifier(decl)) {
                        return true;
                    }
                }
            }
        }
        function checkGrammarSourceFile(node) {
            return ts.isInAmbientContext(node) && checkGrammarTopLevelElementsForRequiredDeclareModifier(node);
        }
        function checkGrammarStatementInAmbientContext(node) {
            if (ts.isInAmbientContext(node)) {
                if (isAccessor(node.parent.kind)) {
                    return getNodeLinks(node).hasReportedStatementInAmbientContext = true;
                }
                var links = getNodeLinks(node);
                if (!links.hasReportedStatementInAmbientContext && ts.isFunctionLike(node.parent)) {
                    return getNodeLinks(node).hasReportedStatementInAmbientContext = grammarErrorOnFirstToken(node, ts.Diagnostics.An_implementation_cannot_be_declared_in_ambient_contexts);
                }
                if (node.parent.kind === 179 || node.parent.kind === 206 || node.parent.kind === 227) {
                    var links_1 = getNodeLinks(node.parent);
                    if (!links_1.hasReportedStatementInAmbientContext) {
                        return links_1.hasReportedStatementInAmbientContext = grammarErrorOnFirstToken(node, ts.Diagnostics.Statements_are_not_allowed_in_ambient_contexts);
                    }
                }
                else {
                }
            }
        }
        function checkGrammarNumericLiteral(node) {
            if (node.flags & 16384) {
                if (node.parserContextFlags & 1) {
                    return grammarErrorOnNode(node, ts.Diagnostics.Octal_literals_are_not_allowed_in_strict_mode);
                }
                else if (languageVersion >= 1) {
                    return grammarErrorOnNode(node, ts.Diagnostics.Octal_literals_are_not_available_when_targeting_ECMAScript_5_and_higher);
                }
            }
        }
        function grammarErrorAfterFirstToken(node, message, arg0, arg1, arg2) {
            var sourceFile = ts.getSourceFileOfNode(node);
            if (!hasParseDiagnostics(sourceFile)) {
                var span = ts.getSpanOfTokenAtPosition(sourceFile, node.pos);
                diagnostics.add(ts.createFileDiagnostic(sourceFile, ts.textSpanEnd(span), 0, message, arg0, arg1, arg2));
                return true;
            }
        }
        initializeTypeChecker();
        return checker;
    }
    ts.createTypeChecker = createTypeChecker;
})(ts || (ts = {}));
