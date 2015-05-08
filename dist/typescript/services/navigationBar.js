/// <reference path='services.ts' />
var ts;
(function (ts) {
    var NavigationBar;
    (function (NavigationBar) {
        function getNavigationBarItems(sourceFile) {
            var hasGlobalNode = false;
            return getItemsWorker(getTopLevelNodes(sourceFile), createTopLevelItem);
            function getIndent(node) {
                var indent = hasGlobalNode ? 1 : 0;
                var current = node.parent;
                while (current) {
                    switch (current.kind) {
                        case 206:
                            do {
                                current = current.parent;
                            } while (current.kind === 206);
                        case 202:
                        case 205:
                        case 203:
                        case 201:
                            indent++;
                    }
                    current = current.parent;
                }
                return indent;
            }
            function getChildNodes(nodes) {
                var childNodes = [];
                function visit(node) {
                    switch (node.kind) {
                        case 181:
                            ts.forEach(node.declarationList.declarations, visit);
                            break;
                        case 151:
                        case 152:
                            ts.forEach(node.elements, visit);
                            break;
                        case 216:
                            if (node.exportClause) {
                                ts.forEach(node.exportClause.elements, visit);
                            }
                            break;
                        case 210:
                            var importClause = node.importClause;
                            if (importClause) {
                                if (importClause.name) {
                                    childNodes.push(importClause);
                                }
                                if (importClause.namedBindings) {
                                    if (importClause.namedBindings.kind === 212) {
                                        childNodes.push(importClause.namedBindings);
                                    }
                                    else {
                                        ts.forEach(importClause.namedBindings.elements, visit);
                                    }
                                }
                            }
                            break;
                        case 153:
                        case 199:
                            if (ts.isBindingPattern(node.name)) {
                                visit(node.name);
                                break;
                            }
                        case 202:
                        case 205:
                        case 203:
                        case 206:
                        case 201:
                        case 209:
                        case 214:
                        case 218:
                            childNodes.push(node);
                            break;
                    }
                }
                ts.forEach(nodes, visit);
                return sortNodes(childNodes);
            }
            function getTopLevelNodes(node) {
                var topLevelNodes = [];
                topLevelNodes.push(node);
                addTopLevelNodes(node.statements, topLevelNodes);
                return topLevelNodes;
            }
            function sortNodes(nodes) {
                return nodes.slice(0).sort(function (n1, n2) {
                    if (n1.name && n2.name) {
                        return ts.getPropertyNameForPropertyNameNode(n1.name).localeCompare(ts.getPropertyNameForPropertyNameNode(n2.name));
                    }
                    else if (n1.name) {
                        return 1;
                    }
                    else if (n2.name) {
                        return -1;
                    }
                    else {
                        return n1.kind - n2.kind;
                    }
                });
            }
            function addTopLevelNodes(nodes, topLevelNodes) {
                nodes = sortNodes(nodes);
                for (var _i = 0; _i < nodes.length; _i++) {
                    var node = nodes[_i];
                    switch (node.kind) {
                        case 202:
                        case 205:
                        case 203:
                            topLevelNodes.push(node);
                            break;
                        case 206:
                            var moduleDeclaration = node;
                            topLevelNodes.push(node);
                            addTopLevelNodes(getInnermostModule(moduleDeclaration).body.statements, topLevelNodes);
                            break;
                        case 201:
                            var functionDeclaration = node;
                            if (isTopLevelFunctionDeclaration(functionDeclaration)) {
                                topLevelNodes.push(node);
                                addTopLevelNodes(functionDeclaration.body.statements, topLevelNodes);
                            }
                            break;
                    }
                }
            }
            function isTopLevelFunctionDeclaration(functionDeclaration) {
                if (functionDeclaration.kind === 201) {
                    if (functionDeclaration.body && functionDeclaration.body.kind === 180) {
                        if (ts.forEach(functionDeclaration.body.statements, function (s) { return s.kind === 201 && !isEmpty(s.name.text); })) {
                            return true;
                        }
                        if (!ts.isFunctionBlock(functionDeclaration.parent)) {
                            return true;
                        }
                    }
                }
                return false;
            }
            function getItemsWorker(nodes, createItem) {
                var items = [];
                var keyToItem = {};
                for (var _i = 0; _i < nodes.length; _i++) {
                    var child = nodes[_i];
                    var item = createItem(child);
                    if (item !== undefined) {
                        if (item.text.length > 0) {
                            var key = item.text + "-" + item.kind + "-" + item.indent;
                            var itemWithSameName = keyToItem[key];
                            if (itemWithSameName) {
                                merge(itemWithSameName, item);
                            }
                            else {
                                keyToItem[key] = item;
                                items.push(item);
                            }
                        }
                    }
                }
                return items;
            }
            function merge(target, source) {
                target.spans.push.apply(target.spans, source.spans);
                if (source.childItems) {
                    if (!target.childItems) {
                        target.childItems = [];
                    }
                    outer: for (var _i = 0, _a = source.childItems; _i < _a.length; _i++) {
                        var sourceChild = _a[_i];
                        for (var _b = 0, _c = target.childItems; _b < _c.length; _b++) {
                            var targetChild = _c[_b];
                            if (targetChild.text === sourceChild.text && targetChild.kind === sourceChild.kind) {
                                merge(targetChild, sourceChild);
                                continue outer;
                            }
                        }
                        target.childItems.push(sourceChild);
                    }
                }
            }
            function createChildItem(node) {
                switch (node.kind) {
                    case 130:
                        if (ts.isBindingPattern(node.name)) {
                            break;
                        }
                        if ((node.flags & 499) === 0) {
                            return undefined;
                        }
                        return createItem(node, getTextOfNode(node.name), ts.ScriptElementKind.memberVariableElement);
                    case 135:
                    case 134:
                        return createItem(node, getTextOfNode(node.name), ts.ScriptElementKind.memberFunctionElement);
                    case 137:
                        return createItem(node, getTextOfNode(node.name), ts.ScriptElementKind.memberGetAccessorElement);
                    case 138:
                        return createItem(node, getTextOfNode(node.name), ts.ScriptElementKind.memberSetAccessorElement);
                    case 141:
                        return createItem(node, "[]", ts.ScriptElementKind.indexSignatureElement);
                    case 227:
                        return createItem(node, getTextOfNode(node.name), ts.ScriptElementKind.memberVariableElement);
                    case 139:
                        return createItem(node, "()", ts.ScriptElementKind.callSignatureElement);
                    case 140:
                        return createItem(node, "new()", ts.ScriptElementKind.constructSignatureElement);
                    case 133:
                    case 132:
                        return createItem(node, getTextOfNode(node.name), ts.ScriptElementKind.memberVariableElement);
                    case 201:
                        return createItem(node, getTextOfNode(node.name), ts.ScriptElementKind.functionElement);
                    case 199:
                    case 153:
                        var variableDeclarationNode;
                        var name_1;
                        if (node.kind === 153) {
                            name_1 = node.name;
                            variableDeclarationNode = node;
                            while (variableDeclarationNode && variableDeclarationNode.kind !== 199) {
                                variableDeclarationNode = variableDeclarationNode.parent;
                            }
                            ts.Debug.assert(variableDeclarationNode !== undefined);
                        }
                        else {
                            ts.Debug.assert(!ts.isBindingPattern(node.name));
                            variableDeclarationNode = node;
                            name_1 = node.name;
                        }
                        if (ts.isConst(variableDeclarationNode)) {
                            return createItem(node, getTextOfNode(name_1), ts.ScriptElementKind.constElement);
                        }
                        else if (ts.isLet(variableDeclarationNode)) {
                            return createItem(node, getTextOfNode(name_1), ts.ScriptElementKind.letElement);
                        }
                        else {
                            return createItem(node, getTextOfNode(name_1), ts.ScriptElementKind.variableElement);
                        }
                    case 136:
                        return createItem(node, "constructor", ts.ScriptElementKind.constructorImplementationElement);
                    case 218:
                    case 214:
                    case 209:
                    case 211:
                    case 212:
                        return createItem(node, getTextOfNode(node.name), ts.ScriptElementKind.alias);
                }
                return undefined;
                function createItem(node, name, scriptElementKind) {
                    return getNavigationBarItem(name, scriptElementKind, ts.getNodeModifiers(node), [getNodeSpan(node)]);
                }
            }
            function isEmpty(text) {
                return !text || text.trim() === "";
            }
            function getNavigationBarItem(text, kind, kindModifiers, spans, childItems, indent) {
                if (childItems === void 0) { childItems = []; }
                if (indent === void 0) { indent = 0; }
                if (isEmpty(text)) {
                    return undefined;
                }
                return {
                    text: text,
                    kind: kind,
                    kindModifiers: kindModifiers,
                    spans: spans,
                    childItems: childItems,
                    indent: indent,
                    bolded: false,
                    grayed: false
                };
            }
            function createTopLevelItem(node) {
                switch (node.kind) {
                    case 228:
                        return createSourceFileItem(node);
                    case 202:
                        return createClassItem(node);
                    case 205:
                        return createEnumItem(node);
                    case 203:
                        return createIterfaceItem(node);
                    case 206:
                        return createModuleItem(node);
                    case 201:
                        return createFunctionItem(node);
                }
                return undefined;
                function getModuleName(moduleDeclaration) {
                    if (moduleDeclaration.name.kind === 8) {
                        return getTextOfNode(moduleDeclaration.name);
                    }
                    var result = [];
                    result.push(moduleDeclaration.name.text);
                    while (moduleDeclaration.body && moduleDeclaration.body.kind === 206) {
                        moduleDeclaration = moduleDeclaration.body;
                        result.push(moduleDeclaration.name.text);
                    }
                    return result.join(".");
                }
                function createModuleItem(node) {
                    var moduleName = getModuleName(node);
                    var childItems = getItemsWorker(getChildNodes(getInnermostModule(node).body.statements), createChildItem);
                    return getNavigationBarItem(moduleName, ts.ScriptElementKind.moduleElement, ts.getNodeModifiers(node), [getNodeSpan(node)], childItems, getIndent(node));
                }
                function createFunctionItem(node) {
                    if (node.body && node.body.kind === 180) {
                        var childItems = getItemsWorker(sortNodes(node.body.statements), createChildItem);
                        return getNavigationBarItem(!node.name ? "default" : node.name.text, ts.ScriptElementKind.functionElement, ts.getNodeModifiers(node), [getNodeSpan(node)], childItems, getIndent(node));
                    }
                    return undefined;
                }
                function createSourceFileItem(node) {
                    var childItems = getItemsWorker(getChildNodes(node.statements), createChildItem);
                    if (childItems === undefined || childItems.length === 0) {
                        return undefined;
                    }
                    hasGlobalNode = true;
                    var rootName = ts.isExternalModule(node)
                        ? "\"" + ts.escapeString(ts.getBaseFileName(ts.removeFileExtension(ts.normalizePath(node.fileName)))) + "\""
                        : "<global>";
                    return getNavigationBarItem(rootName, ts.ScriptElementKind.moduleElement, ts.ScriptElementKindModifier.none, [getNodeSpan(node)], childItems);
                }
                function createClassItem(node) {
                    var childItems;
                    if (node.members) {
                        var constructor = ts.forEach(node.members, function (member) {
                            return member.kind === 136 && member;
                        });
                        var nodes = removeDynamicallyNamedProperties(node);
                        if (constructor) {
                            nodes.push.apply(nodes, ts.filter(constructor.parameters, function (p) { return !ts.isBindingPattern(p.name); }));
                        }
                        childItems = getItemsWorker(sortNodes(nodes), createChildItem);
                    }
                    var nodeName = !node.name ? "default" : node.name.text;
                    return getNavigationBarItem(nodeName, ts.ScriptElementKind.classElement, ts.getNodeModifiers(node), [getNodeSpan(node)], childItems, getIndent(node));
                }
                function createEnumItem(node) {
                    var childItems = getItemsWorker(sortNodes(removeComputedProperties(node)), createChildItem);
                    return getNavigationBarItem(node.name.text, ts.ScriptElementKind.enumElement, ts.getNodeModifiers(node), [getNodeSpan(node)], childItems, getIndent(node));
                }
                function createIterfaceItem(node) {
                    var childItems = getItemsWorker(sortNodes(removeDynamicallyNamedProperties(node)), createChildItem);
                    return getNavigationBarItem(node.name.text, ts.ScriptElementKind.interfaceElement, ts.getNodeModifiers(node), [getNodeSpan(node)], childItems, getIndent(node));
                }
            }
            function removeComputedProperties(node) {
                return ts.filter(node.members, function (member) { return member.name === undefined || member.name.kind !== 128; });
            }
            function removeDynamicallyNamedProperties(node) {
                return ts.filter(node.members, function (member) { return !ts.hasDynamicName(member); });
            }
            function getInnermostModule(node) {
                while (node.body.kind === 206) {
                    node = node.body;
                }
                return node;
            }
            function getNodeSpan(node) {
                return node.kind === 228
                    ? ts.createTextSpanFromBounds(node.getFullStart(), node.getEnd())
                    : ts.createTextSpanFromBounds(node.getStart(), node.getEnd());
            }
            function getTextOfNode(node) {
                return ts.getTextOfNodeFromSourceText(sourceFile.text, node);
            }
        }
        NavigationBar.getNavigationBarItems = getNavigationBarItems;
    })(NavigationBar = ts.NavigationBar || (ts.NavigationBar = {}));
})(ts || (ts = {}));
