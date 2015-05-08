/// <reference path="parser.ts"/>
var ts;
(function (ts) {
    ts.bindTime = 0;
    (function (ModuleInstanceState) {
        ModuleInstanceState[ModuleInstanceState["NonInstantiated"] = 0] = "NonInstantiated";
        ModuleInstanceState[ModuleInstanceState["Instantiated"] = 1] = "Instantiated";
        ModuleInstanceState[ModuleInstanceState["ConstEnumOnly"] = 2] = "ConstEnumOnly";
    })(ts.ModuleInstanceState || (ts.ModuleInstanceState = {}));
    var ModuleInstanceState = ts.ModuleInstanceState;
    function getModuleInstanceState(node) {
        if (node.kind === 203 || node.kind === 204) {
            return 0;
        }
        else if (ts.isConstEnumDeclaration(node)) {
            return 2;
        }
        else if ((node.kind === 210 || node.kind === 209) && !(node.flags & 1)) {
            return 0;
        }
        else if (node.kind === 207) {
            var state = 0;
            ts.forEachChild(node, function (n) {
                switch (getModuleInstanceState(n)) {
                    case 0:
                        return false;
                    case 2:
                        state = 2;
                        return false;
                    case 1:
                        state = 1;
                        return true;
                }
            });
            return state;
        }
        else if (node.kind === 206) {
            return getModuleInstanceState(node.body);
        }
        else {
            return 1;
        }
    }
    ts.getModuleInstanceState = getModuleInstanceState;
    function bindSourceFile(file) {
        var start = new Date().getTime();
        bindSourceFileWorker(file);
        ts.bindTime += new Date().getTime() - start;
    }
    ts.bindSourceFile = bindSourceFile;
    function bindSourceFileWorker(file) {
        var parent;
        var container;
        var blockScopeContainer;
        var lastContainer;
        var symbolCount = 0;
        var Symbol = ts.objectAllocator.getSymbolConstructor();
        if (!file.locals) {
            file.locals = {};
            container = file;
            setBlockScopeContainer(file, false);
            bind(file);
            file.symbolCount = symbolCount;
        }
        function createSymbol(flags, name) {
            symbolCount++;
            return new Symbol(flags, name);
        }
        function setBlockScopeContainer(node, cleanLocals) {
            blockScopeContainer = node;
            if (cleanLocals) {
                blockScopeContainer.locals = undefined;
            }
        }
        function addDeclarationToSymbol(symbol, node, symbolKind) {
            symbol.flags |= symbolKind;
            if (!symbol.declarations)
                symbol.declarations = [];
            symbol.declarations.push(node);
            if (symbolKind & 1952 && !symbol.exports)
                symbol.exports = {};
            if (symbolKind & 6240 && !symbol.members)
                symbol.members = {};
            node.symbol = symbol;
            if (symbolKind & 107455 && !symbol.valueDeclaration)
                symbol.valueDeclaration = node;
        }
        function getDeclarationName(node) {
            if (node.name) {
                if (node.kind === 206 && node.name.kind === 8) {
                    return '"' + node.name.text + '"';
                }
                if (node.name.kind === 128) {
                    var nameExpression = node.name.expression;
                    ts.Debug.assert(ts.isWellKnownSymbolSyntactically(nameExpression));
                    return ts.getPropertyNameForKnownSymbolName(nameExpression.name.text);
                }
                return node.name.text;
            }
            switch (node.kind) {
                case 144:
                case 136:
                    return "__constructor";
                case 143:
                case 139:
                    return "__call";
                case 140:
                    return "__new";
                case 141:
                    return "__index";
                case 216:
                    return "__export";
                case 215:
                    return node.isExportEquals ? "export=" : "default";
                case 201:
                case 202:
                    return node.flags & 256 ? "default" : undefined;
            }
        }
        function getDisplayName(node) {
            return node.name ? ts.declarationNameToString(node.name) : getDeclarationName(node);
        }
        function declareSymbol(symbols, parent, node, includes, excludes) {
            ts.Debug.assert(!ts.hasDynamicName(node));
            var name = node.flags & 256 && parent ? "default" : getDeclarationName(node);
            var symbol;
            if (name !== undefined) {
                symbol = ts.hasProperty(symbols, name) ? symbols[name] : (symbols[name] = createSymbol(0, name));
                if (symbol.flags & excludes) {
                    if (node.name) {
                        node.name.parent = node;
                    }
                    var message = symbol.flags & 2
                        ? ts.Diagnostics.Cannot_redeclare_block_scoped_variable_0
                        : ts.Diagnostics.Duplicate_identifier_0;
                    ts.forEach(symbol.declarations, function (declaration) {
                        file.bindDiagnostics.push(ts.createDiagnosticForNode(declaration.name || declaration, message, getDisplayName(declaration)));
                    });
                    file.bindDiagnostics.push(ts.createDiagnosticForNode(node.name || node, message, getDisplayName(node)));
                    symbol = createSymbol(0, name);
                }
            }
            else {
                symbol = createSymbol(0, "__missing");
            }
            addDeclarationToSymbol(symbol, node, includes);
            symbol.parent = parent;
            if ((node.kind === 202 || node.kind === 175) && symbol.exports) {
                var prototypeSymbol = createSymbol(4 | 134217728, "prototype");
                if (ts.hasProperty(symbol.exports, prototypeSymbol.name)) {
                    if (node.name) {
                        node.name.parent = node;
                    }
                    file.bindDiagnostics.push(ts.createDiagnosticForNode(symbol.exports[prototypeSymbol.name].declarations[0], ts.Diagnostics.Duplicate_identifier_0, prototypeSymbol.name));
                }
                symbol.exports[prototypeSymbol.name] = prototypeSymbol;
                prototypeSymbol.parent = symbol;
            }
            return symbol;
        }
        function declareModuleMember(node, symbolKind, symbolExcludes) {
            var hasExportModifier = ts.getCombinedNodeFlags(node) & 1;
            if (symbolKind & 8388608) {
                if (node.kind === 218 || (node.kind === 209 && hasExportModifier)) {
                    declareSymbol(container.symbol.exports, container.symbol, node, symbolKind, symbolExcludes);
                }
                else {
                    declareSymbol(container.locals, undefined, node, symbolKind, symbolExcludes);
                }
            }
            else {
                if (hasExportModifier || container.flags & 65536) {
                    var exportKind = (symbolKind & 107455 ? 1048576 : 0) |
                        (symbolKind & 793056 ? 2097152 : 0) |
                        (symbolKind & 1536 ? 4194304 : 0);
                    var local = declareSymbol(container.locals, undefined, node, exportKind, symbolExcludes);
                    local.exportSymbol = declareSymbol(container.symbol.exports, container.symbol, node, symbolKind, symbolExcludes);
                    node.localSymbol = local;
                }
                else {
                    declareSymbol(container.locals, undefined, node, symbolKind, symbolExcludes);
                }
            }
        }
        function bindChildren(node, symbolKind, isBlockScopeContainer) {
            if (symbolKind & 255504) {
                node.locals = {};
            }
            var saveParent = parent;
            var saveContainer = container;
            var savedBlockScopeContainer = blockScopeContainer;
            parent = node;
            if (symbolKind & 262128) {
                container = node;
                addToContainerChain(container);
            }
            if (isBlockScopeContainer) {
                setBlockScopeContainer(node, (symbolKind & 255504) === 0 && node.kind !== 228);
            }
            ts.forEachChild(node, bind);
            container = saveContainer;
            parent = saveParent;
            blockScopeContainer = savedBlockScopeContainer;
        }
        function addToContainerChain(node) {
            if (lastContainer) {
                lastContainer.nextContainer = node;
            }
            lastContainer = node;
        }
        function bindDeclaration(node, symbolKind, symbolExcludes, isBlockScopeContainer) {
            switch (container.kind) {
                case 206:
                    declareModuleMember(node, symbolKind, symbolExcludes);
                    break;
                case 228:
                    if (ts.isExternalModule(container)) {
                        declareModuleMember(node, symbolKind, symbolExcludes);
                        break;
                    }
                case 143:
                case 144:
                case 139:
                case 140:
                case 141:
                case 135:
                case 134:
                case 136:
                case 137:
                case 138:
                case 201:
                case 163:
                case 164:
                    declareSymbol(container.locals, undefined, node, symbolKind, symbolExcludes);
                    break;
                case 175:
                case 202:
                    if (node.flags & 128) {
                        declareSymbol(container.symbol.exports, container.symbol, node, symbolKind, symbolExcludes);
                        break;
                    }
                case 146:
                case 155:
                case 203:
                    declareSymbol(container.symbol.members, container.symbol, node, symbolKind, symbolExcludes);
                    break;
                case 205:
                    declareSymbol(container.symbol.exports, container.symbol, node, symbolKind, symbolExcludes);
                    break;
            }
            bindChildren(node, symbolKind, isBlockScopeContainer);
        }
        function isAmbientContext(node) {
            while (node) {
                if (node.flags & 2)
                    return true;
                node = node.parent;
            }
            return false;
        }
        function hasExportDeclarations(node) {
            var body = node.kind === 228 ? node : node.body;
            if (body.kind === 228 || body.kind === 207) {
                for (var _i = 0, _a = body.statements; _i < _a.length; _i++) {
                    var stat = _a[_i];
                    if (stat.kind === 216 || stat.kind === 215) {
                        return true;
                    }
                }
            }
            return false;
        }
        function setExportContextFlag(node) {
            if (isAmbientContext(node) && !hasExportDeclarations(node)) {
                node.flags |= 65536;
            }
            else {
                node.flags &= ~65536;
            }
        }
        function bindModuleDeclaration(node) {
            setExportContextFlag(node);
            if (node.name.kind === 8) {
                bindDeclaration(node, 512, 106639, true);
            }
            else {
                var state = getModuleInstanceState(node);
                if (state === 0) {
                    bindDeclaration(node, 1024, 0, true);
                }
                else {
                    bindDeclaration(node, 512, 106639, true);
                    var currentModuleIsConstEnumOnly = state === 2;
                    if (node.symbol.constEnumOnlyModule === undefined) {
                        node.symbol.constEnumOnlyModule = currentModuleIsConstEnumOnly;
                    }
                    else {
                        node.symbol.constEnumOnlyModule = node.symbol.constEnumOnlyModule && currentModuleIsConstEnumOnly;
                    }
                }
            }
        }
        function bindFunctionOrConstructorType(node) {
            // For a given function symbol "<...>(...) => T" we want to generate a symbol identical
            // to the one we would get for: { <...>(...): T }
            //
            // We do that by making an anonymous type literal symbol, and then setting the function 
            // symbol as its sole member. To the rest of the system, this symbol will be  indistinguishable 
            // from an actual type literal symbol you would have gotten had you used the long form.
            var symbol = createSymbol(131072, getDeclarationName(node));
            addDeclarationToSymbol(symbol, node, 131072);
            bindChildren(node, 131072, false);
            var typeLiteralSymbol = createSymbol(2048, "__type");
            addDeclarationToSymbol(typeLiteralSymbol, node, 2048);
            typeLiteralSymbol.members = {};
            typeLiteralSymbol.members[node.kind === 143 ? "__call" : "__new"] = symbol;
        }
        function bindAnonymousDeclaration(node, symbolKind, name, isBlockScopeContainer) {
            var symbol = createSymbol(symbolKind, name);
            addDeclarationToSymbol(symbol, node, symbolKind);
            bindChildren(node, symbolKind, isBlockScopeContainer);
        }
        function bindCatchVariableDeclaration(node) {
            bindChildren(node, 0, true);
        }
        function bindBlockScopedDeclaration(node, symbolKind, symbolExcludes) {
            switch (blockScopeContainer.kind) {
                case 206:
                    declareModuleMember(node, symbolKind, symbolExcludes);
                    break;
                case 228:
                    if (ts.isExternalModule(container)) {
                        declareModuleMember(node, symbolKind, symbolExcludes);
                        break;
                    }
                default:
                    if (!blockScopeContainer.locals) {
                        blockScopeContainer.locals = {};
                        addToContainerChain(blockScopeContainer);
                    }
                    declareSymbol(blockScopeContainer.locals, undefined, node, symbolKind, symbolExcludes);
            }
            bindChildren(node, symbolKind, false);
        }
        function bindBlockScopedVariableDeclaration(node) {
            bindBlockScopedDeclaration(node, 2, 107455);
        }
        function getDestructuringParameterName(node) {
            return "__" + ts.indexOf(node.parent.parameters, node);
        }
        function bind(node) {
            node.parent = parent;
            switch (node.kind) {
                case 129:
                    bindDeclaration(node, 262144, 530912, false);
                    break;
                case 130:
                    bindParameter(node);
                    break;
                case 199:
                case 153:
                    if (ts.isBindingPattern(node.name)) {
                        bindChildren(node, 0, false);
                    }
                    else if (ts.isBlockOrCatchScoped(node)) {
                        bindBlockScopedVariableDeclaration(node);
                    }
                    else {
                        bindDeclaration(node, 1, 107454, false);
                    }
                    break;
                case 133:
                case 132:
                    bindPropertyOrMethodOrAccessor(node, 4 | (node.questionToken ? 536870912 : 0), 107455, false);
                    break;
                case 225:
                case 226:
                    bindPropertyOrMethodOrAccessor(node, 4, 107455, false);
                    break;
                case 227:
                    bindPropertyOrMethodOrAccessor(node, 8, 107455, false);
                    break;
                case 139:
                case 140:
                case 141:
                    bindDeclaration(node, 131072, 0, false);
                    break;
                case 135:
                case 134:
                    bindPropertyOrMethodOrAccessor(node, 8192 | (node.questionToken ? 536870912 : 0), ts.isObjectLiteralMethod(node) ? 107455 : 99263, true);
                    break;
                case 201:
                    bindDeclaration(node, 16, 106927, true);
                    break;
                case 136:
                    bindDeclaration(node, 16384, 0, true);
                    break;
                case 137:
                    bindPropertyOrMethodOrAccessor(node, 32768, 41919, true);
                    break;
                case 138:
                    bindPropertyOrMethodOrAccessor(node, 65536, 74687, true);
                    break;
                case 143:
                case 144:
                    bindFunctionOrConstructorType(node);
                    break;
                case 146:
                    bindAnonymousDeclaration(node, 2048, "__type", false);
                    break;
                case 155:
                    bindAnonymousDeclaration(node, 4096, "__object", false);
                    break;
                case 163:
                case 164:
                    bindAnonymousDeclaration(node, 16, "__function", true);
                    break;
                case 175:
                    bindAnonymousDeclaration(node, 32, "__class", false);
                    break;
                case 224:
                    bindCatchVariableDeclaration(node);
                    break;
                case 202:
                    bindBlockScopedDeclaration(node, 32, 899583);
                    break;
                case 203:
                    bindDeclaration(node, 64, 792992, false);
                    break;
                case 204:
                    bindDeclaration(node, 524288, 793056, false);
                    break;
                case 205:
                    if (ts.isConst(node)) {
                        bindDeclaration(node, 128, 899967, false);
                    }
                    else {
                        bindDeclaration(node, 256, 899327, false);
                    }
                    break;
                case 206:
                    bindModuleDeclaration(node);
                    break;
                case 209:
                case 212:
                case 214:
                case 218:
                    bindDeclaration(node, 8388608, 8388608, false);
                    break;
                case 211:
                    if (node.name) {
                        bindDeclaration(node, 8388608, 8388608, false);
                    }
                    else {
                        bindChildren(node, 0, false);
                    }
                    break;
                case 216:
                    if (!node.exportClause) {
                        declareSymbol(container.symbol.exports, container.symbol, node, 1073741824, 0);
                    }
                    bindChildren(node, 0, false);
                    break;
                case 215:
                    if (node.expression.kind === 65) {
                        declareSymbol(container.symbol.exports, container.symbol, node, 8388608, 107455 | 8388608);
                    }
                    else {
                        declareSymbol(container.symbol.exports, container.symbol, node, 4, 107455 | 8388608);
                    }
                    bindChildren(node, 0, false);
                    break;
                case 228:
                    setExportContextFlag(node);
                    if (ts.isExternalModule(node)) {
                        bindAnonymousDeclaration(node, 512, '"' + ts.removeFileExtension(node.fileName) + '"', true);
                        break;
                    }
                case 180:
                    bindChildren(node, 0, !ts.isFunctionLike(node.parent));
                    break;
                case 224:
                case 187:
                case 188:
                case 189:
                case 208:
                    bindChildren(node, 0, true);
                    break;
                default:
                    var saveParent = parent;
                    parent = node;
                    ts.forEachChild(node, bind);
                    parent = saveParent;
            }
        }
        function bindParameter(node) {
            if (ts.isBindingPattern(node.name)) {
                bindAnonymousDeclaration(node, 1, getDestructuringParameterName(node), false);
            }
            else {
                bindDeclaration(node, 1, 107455, false);
            }
            if (node.flags & 112 &&
                node.parent.kind === 136 &&
                (node.parent.parent.kind === 202 || node.parent.parent.kind === 175)) {
                var classDeclaration = node.parent.parent;
                declareSymbol(classDeclaration.symbol.members, classDeclaration.symbol, node, 4, 107455);
            }
        }
        function bindPropertyOrMethodOrAccessor(node, symbolKind, symbolExcludes, isBlockScopeContainer) {
            if (ts.hasDynamicName(node)) {
                bindAnonymousDeclaration(node, symbolKind, "__computed", isBlockScopeContainer);
            }
            else {
                bindDeclaration(node, symbolKind, symbolExcludes, isBlockScopeContainer);
            }
        }
    }
})(ts || (ts = {}));
