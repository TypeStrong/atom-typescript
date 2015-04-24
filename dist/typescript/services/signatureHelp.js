///<reference path='services.ts' />
var ts;
(function (ts) {
    var SignatureHelp;
    (function (SignatureHelp) {
        var emptyArray = [];
        var ArgumentListKind;
        (function (ArgumentListKind) {
            ArgumentListKind[ArgumentListKind["TypeArguments"] = 0] = "TypeArguments";
            ArgumentListKind[ArgumentListKind["CallArguments"] = 1] = "CallArguments";
            ArgumentListKind[ArgumentListKind["TaggedTemplateArguments"] = 2] = "TaggedTemplateArguments";
        })(ArgumentListKind || (ArgumentListKind = {}));
        function getSignatureHelpItems(program, sourceFile, position, cancellationToken) {
            var typeChecker = program.getTypeChecker();
            var startingToken = ts.findTokenOnLeftOfPosition(sourceFile, position);
            if (!startingToken) {
                return undefined;
            }
            var argumentInfo = getContainingArgumentInfo(startingToken);
            cancellationToken.throwIfCancellationRequested();
            if (!argumentInfo) {
                return undefined;
            }
            var call = argumentInfo.invocation;
            var candidates = [];
            var resolvedSignature = typeChecker.getResolvedSignature(call, candidates);
            cancellationToken.throwIfCancellationRequested();
            if (!candidates.length) {
                if (ts.isJavaScript(sourceFile.fileName)) {
                    return createJavaScriptSignatureHelpItems(argumentInfo);
                }
                return undefined;
            }
            return createSignatureHelpItems(candidates, resolvedSignature, argumentInfo);
            function createJavaScriptSignatureHelpItems(argumentInfo) {
                if (argumentInfo.invocation.kind !== 157) {
                    return undefined;
                }
                var callExpression = argumentInfo.invocation;
                var expression = callExpression.expression;
                var name = expression.kind === 65
                    ? expression
                    : expression.kind === 155
                        ? expression.name
                        : undefined;
                if (!name || !name.text) {
                    return undefined;
                }
                var typeChecker = program.getTypeChecker();
                for (var _i = 0, _a = program.getSourceFiles(); _i < _a.length; _i++) {
                    var sourceFile_1 = _a[_i];
                    var nameToDeclarations = sourceFile_1.getNamedDeclarations();
                    var declarations = ts.getProperty(nameToDeclarations, name.text);
                    if (declarations) {
                        for (var _b = 0; _b < declarations.length; _b++) {
                            var declaration = declarations[_b];
                            var symbol = declaration.symbol;
                            if (symbol) {
                                var type = typeChecker.getTypeOfSymbolAtLocation(symbol, declaration);
                                if (type) {
                                    var callSignatures = type.getCallSignatures();
                                    if (callSignatures && callSignatures.length) {
                                        return createSignatureHelpItems(callSignatures, callSignatures[0], argumentInfo);
                                    }
                                }
                            }
                        }
                    }
                }
            }
            function getImmediatelyContainingArgumentInfo(node) {
                if (node.parent.kind === 157 || node.parent.kind === 158) {
                    var callExpression = node.parent;
                    if (node.kind === 24 ||
                        node.kind === 16) {
                        var list = getChildListThatStartsWithOpenerToken(callExpression, node, sourceFile);
                        var isTypeArgList = callExpression.typeArguments && callExpression.typeArguments.pos === list.pos;
                        ts.Debug.assert(list !== undefined);
                        return {
                            kind: isTypeArgList ? 0 : 1,
                            invocation: callExpression,
                            argumentsSpan: getApplicableSpanForArguments(list),
                            argumentIndex: 0,
                            argumentCount: getArgumentCount(list)
                        };
                    }
                    var listItemInfo = ts.findListItemInfo(node);
                    if (listItemInfo) {
                        var list = listItemInfo.list;
                        var isTypeArgList = callExpression.typeArguments && callExpression.typeArguments.pos === list.pos;
                        var argumentIndex = getArgumentIndex(list, node);
                        var argumentCount = getArgumentCount(list);
                        ts.Debug.assert(argumentIndex === 0 || argumentIndex < argumentCount, "argumentCount < argumentIndex, " + argumentCount + " < " + argumentIndex);
                        return {
                            kind: isTypeArgList ? 0 : 1,
                            invocation: callExpression,
                            argumentsSpan: getApplicableSpanForArguments(list),
                            argumentIndex: argumentIndex,
                            argumentCount: argumentCount
                        };
                    }
                }
                else if (node.kind === 10 && node.parent.kind === 159) {
                    if (ts.isInsideTemplateLiteral(node, position)) {
                        return getArgumentListInfoForTemplate(node.parent, 0);
                    }
                }
                else if (node.kind === 11 && node.parent.parent.kind === 159) {
                    var templateExpression = node.parent;
                    var tagExpression = templateExpression.parent;
                    ts.Debug.assert(templateExpression.kind === 171);
                    var argumentIndex = ts.isInsideTemplateLiteral(node, position) ? 0 : 1;
                    return getArgumentListInfoForTemplate(tagExpression, argumentIndex);
                }
                else if (node.parent.kind === 176 && node.parent.parent.parent.kind === 159) {
                    var templateSpan = node.parent;
                    var templateExpression = templateSpan.parent;
                    var tagExpression = templateExpression.parent;
                    ts.Debug.assert(templateExpression.kind === 171);
                    if (node.kind === 13 && !ts.isInsideTemplateLiteral(node, position)) {
                        return undefined;
                    }
                    var spanIndex = templateExpression.templateSpans.indexOf(templateSpan);
                    var argumentIndex = getArgumentIndexForTemplatePiece(spanIndex, node);
                    return getArgumentListInfoForTemplate(tagExpression, argumentIndex);
                }
                return undefined;
            }
            function getArgumentIndex(argumentsList, node) {
                var argumentIndex = 0;
                var listChildren = argumentsList.getChildren();
                for (var _i = 0; _i < listChildren.length; _i++) {
                    var child = listChildren[_i];
                    if (child === node) {
                        break;
                    }
                    if (child.kind !== 23) {
                        argumentIndex++;
                    }
                }
                return argumentIndex;
            }
            function getArgumentCount(argumentsList) {
                var listChildren = argumentsList.getChildren();
                var argumentCount = ts.countWhere(listChildren, function (arg) { return arg.kind !== 23; });
                if (listChildren.length > 0 && ts.lastOrUndefined(listChildren).kind === 23) {
                    argumentCount++;
                }
                return argumentCount;
            }
            function getArgumentIndexForTemplatePiece(spanIndex, node) {
                ts.Debug.assert(position >= node.getStart(), "Assumed 'position' could not occur before node.");
                if (ts.isTemplateLiteralKind(node.kind)) {
                    if (ts.isInsideTemplateLiteral(node, position)) {
                        return 0;
                    }
                    return spanIndex + 2;
                }
                return spanIndex + 1;
            }
            function getArgumentListInfoForTemplate(tagExpression, argumentIndex) {
                var argumentCount = tagExpression.template.kind === 10
                    ? 1
                    : tagExpression.template.templateSpans.length + 1;
                ts.Debug.assert(argumentIndex === 0 || argumentIndex < argumentCount, "argumentCount < argumentIndex, " + argumentCount + " < " + argumentIndex);
                return {
                    kind: 2,
                    invocation: tagExpression,
                    argumentsSpan: getApplicableSpanForTaggedTemplate(tagExpression),
                    argumentIndex: argumentIndex,
                    argumentCount: argumentCount
                };
            }
            function getApplicableSpanForArguments(argumentsList) {
                var applicableSpanStart = argumentsList.getFullStart();
                var applicableSpanEnd = ts.skipTrivia(sourceFile.text, argumentsList.getEnd(), false);
                return ts.createTextSpan(applicableSpanStart, applicableSpanEnd - applicableSpanStart);
            }
            function getApplicableSpanForTaggedTemplate(taggedTemplate) {
                var template = taggedTemplate.template;
                var applicableSpanStart = template.getStart();
                var applicableSpanEnd = template.getEnd();
                if (template.kind === 171) {
                    var lastSpan = ts.lastOrUndefined(template.templateSpans);
                    if (lastSpan.literal.getFullWidth() === 0) {
                        applicableSpanEnd = ts.skipTrivia(sourceFile.text, applicableSpanEnd, false);
                    }
                }
                return ts.createTextSpan(applicableSpanStart, applicableSpanEnd - applicableSpanStart);
            }
            function getContainingArgumentInfo(node) {
                for (var n = node; n.kind !== 227; n = n.parent) {
                    if (ts.isFunctionBlock(n)) {
                        return undefined;
                    }
                    if (n.pos < n.parent.pos || n.end > n.parent.end) {
                        ts.Debug.fail("Node of kind " + n.kind + " is not a subspan of its parent of kind " + n.parent.kind);
                    }
                    var argumentInfo_1 = getImmediatelyContainingArgumentInfo(n);
                    if (argumentInfo_1) {
                        return argumentInfo_1;
                    }
                }
                return undefined;
            }
            function getChildListThatStartsWithOpenerToken(parent, openerToken, sourceFile) {
                var children = parent.getChildren(sourceFile);
                var indexOfOpenerToken = children.indexOf(openerToken);
                ts.Debug.assert(indexOfOpenerToken >= 0 && children.length > indexOfOpenerToken + 1);
                return children[indexOfOpenerToken + 1];
            }
            function selectBestInvalidOverloadIndex(candidates, argumentCount) {
                var maxParamsSignatureIndex = -1;
                var maxParams = -1;
                for (var i = 0; i < candidates.length; i++) {
                    var candidate = candidates[i];
                    if (candidate.hasRestParameter || candidate.parameters.length >= argumentCount) {
                        return i;
                    }
                    if (candidate.parameters.length > maxParams) {
                        maxParams = candidate.parameters.length;
                        maxParamsSignatureIndex = i;
                    }
                }
                return maxParamsSignatureIndex;
            }
            function createSignatureHelpItems(candidates, bestSignature, argumentListInfo) {
                var applicableSpan = argumentListInfo.argumentsSpan;
                var isTypeParameterList = argumentListInfo.kind === 0;
                var invocation = argumentListInfo.invocation;
                var callTarget = ts.getInvokedExpression(invocation);
                var callTargetSymbol = typeChecker.getSymbolAtLocation(callTarget);
                var callTargetDisplayParts = callTargetSymbol && ts.symbolToDisplayParts(typeChecker, callTargetSymbol, undefined, undefined);
                var items = ts.map(candidates, function (candidateSignature) {
                    var signatureHelpParameters;
                    var prefixDisplayParts = [];
                    var suffixDisplayParts = [];
                    if (callTargetDisplayParts) {
                        prefixDisplayParts.push.apply(prefixDisplayParts, callTargetDisplayParts);
                    }
                    if (isTypeParameterList) {
                        prefixDisplayParts.push(ts.punctuationPart(24));
                        var typeParameters = candidateSignature.typeParameters;
                        signatureHelpParameters = typeParameters && typeParameters.length > 0 ? ts.map(typeParameters, createSignatureHelpParameterForTypeParameter) : emptyArray;
                        suffixDisplayParts.push(ts.punctuationPart(25));
                        var parameterParts = ts.mapToDisplayParts(function (writer) {
                            return typeChecker.getSymbolDisplayBuilder().buildDisplayForParametersAndDelimiters(candidateSignature.parameters, writer, invocation);
                        });
                        suffixDisplayParts.push.apply(suffixDisplayParts, parameterParts);
                    }
                    else {
                        var typeParameterParts = ts.mapToDisplayParts(function (writer) {
                            return typeChecker.getSymbolDisplayBuilder().buildDisplayForTypeParametersAndDelimiters(candidateSignature.typeParameters, writer, invocation);
                        });
                        prefixDisplayParts.push.apply(prefixDisplayParts, typeParameterParts);
                        prefixDisplayParts.push(ts.punctuationPart(16));
                        var parameters = candidateSignature.parameters;
                        signatureHelpParameters = parameters.length > 0 ? ts.map(parameters, createSignatureHelpParameterForParameter) : emptyArray;
                        suffixDisplayParts.push(ts.punctuationPart(17));
                    }
                    var returnTypeParts = ts.mapToDisplayParts(function (writer) {
                        return typeChecker.getSymbolDisplayBuilder().buildReturnTypeDisplay(candidateSignature, writer, invocation);
                    });
                    suffixDisplayParts.push.apply(suffixDisplayParts, returnTypeParts);
                    return {
                        isVariadic: candidateSignature.hasRestParameter,
                        prefixDisplayParts: prefixDisplayParts,
                        suffixDisplayParts: suffixDisplayParts,
                        separatorDisplayParts: [ts.punctuationPart(23), ts.spacePart()],
                        parameters: signatureHelpParameters,
                        documentation: candidateSignature.getDocumentationComment()
                    };
                });
                var argumentIndex = argumentListInfo.argumentIndex;
                var argumentCount = argumentListInfo.argumentCount;
                var selectedItemIndex = candidates.indexOf(bestSignature);
                if (selectedItemIndex < 0) {
                    selectedItemIndex = selectBestInvalidOverloadIndex(candidates, argumentCount);
                }
                ts.Debug.assert(argumentIndex === 0 || argumentIndex < argumentCount, "argumentCount < argumentIndex, " + argumentCount + " < " + argumentIndex);
                return {
                    items: items,
                    applicableSpan: applicableSpan,
                    selectedItemIndex: selectedItemIndex,
                    argumentIndex: argumentIndex,
                    argumentCount: argumentCount
                };
                function createSignatureHelpParameterForParameter(parameter) {
                    var displayParts = ts.mapToDisplayParts(function (writer) {
                        return typeChecker.getSymbolDisplayBuilder().buildParameterDisplay(parameter, writer, invocation);
                    });
                    var isOptional = ts.hasQuestionToken(parameter.valueDeclaration);
                    return {
                        name: parameter.name,
                        documentation: parameter.getDocumentationComment(),
                        displayParts: displayParts,
                        isOptional: isOptional
                    };
                }
                function createSignatureHelpParameterForTypeParameter(typeParameter) {
                    var displayParts = ts.mapToDisplayParts(function (writer) {
                        return typeChecker.getSymbolDisplayBuilder().buildTypeParameterDisplay(typeParameter, writer, invocation);
                    });
                    return {
                        name: typeParameter.symbol.name,
                        documentation: emptyArray,
                        displayParts: displayParts,
                        isOptional: false
                    };
                }
            }
        }
        SignatureHelp.getSignatureHelpItems = getSignatureHelpItems;
    })(SignatureHelp = ts.SignatureHelp || (ts.SignatureHelp = {}));
})(ts || (ts = {}));
