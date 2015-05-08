// Copyright (c) Microsoft. All rights reserved. Licensed under the Apache License, Version 2.0. 
// See LICENSE.txt in the project root for complete license information.
/// <reference path='services.ts' />
var ts;
(function (ts) {
    var BreakpointResolver;
    (function (BreakpointResolver) {
        function spanInSourceFileAtLocation(sourceFile, position) {
            if (sourceFile.flags & 2048) {
                return undefined;
            }
            var tokenAtLocation = ts.getTokenAtPosition(sourceFile, position);
            var lineOfPosition = sourceFile.getLineAndCharacterOfPosition(position).line;
            if (sourceFile.getLineAndCharacterOfPosition(tokenAtLocation.getStart()).line > lineOfPosition) {
                tokenAtLocation = ts.findPrecedingToken(tokenAtLocation.pos, sourceFile);
                if (!tokenAtLocation || sourceFile.getLineAndCharacterOfPosition(tokenAtLocation.getEnd()).line !== lineOfPosition) {
                    return undefined;
                }
            }
            if (ts.isInAmbientContext(tokenAtLocation)) {
                return undefined;
            }
            return spanInNode(tokenAtLocation);
            function textSpan(startNode, endNode) {
                return ts.createTextSpanFromBounds(startNode.getStart(), (endNode || startNode).getEnd());
            }
            function spanInNodeIfStartsOnSameLine(node, otherwiseOnNode) {
                if (node && lineOfPosition === sourceFile.getLineAndCharacterOfPosition(node.getStart()).line) {
                    return spanInNode(node);
                }
                return spanInNode(otherwiseOnNode);
            }
            function spanInPreviousNode(node) {
                return spanInNode(ts.findPrecedingToken(node.pos, sourceFile));
            }
            function spanInNextNode(node) {
                return spanInNode(ts.findNextToken(node, node.parent));
            }
            function spanInNode(node) {
                if (node) {
                    if (ts.isExpression(node)) {
                        if (node.parent.kind === 185) {
                            return spanInPreviousNode(node);
                        }
                        if (node.parent.kind === 187) {
                            return textSpan(node);
                        }
                        if (node.parent.kind === 170 && node.parent.operatorToken.kind === 23) {
                            return textSpan(node);
                        }
                        if (node.parent.kind == 164 && node.parent.body == node) {
                            return textSpan(node);
                        }
                    }
                    switch (node.kind) {
                        case 181:
                            return spanInVariableDeclaration(node.declarationList.declarations[0]);
                        case 199:
                        case 133:
                        case 132:
                            return spanInVariableDeclaration(node);
                        case 130:
                            return spanInParameterDeclaration(node);
                        case 201:
                        case 135:
                        case 134:
                        case 137:
                        case 138:
                        case 136:
                        case 163:
                        case 164:
                            return spanInFunctionDeclaration(node);
                        case 180:
                            if (ts.isFunctionBlock(node)) {
                                return spanInFunctionBlock(node);
                            }
                        case 207:
                            return spanInBlock(node);
                        case 224:
                            return spanInBlock(node.block);
                        case 183:
                            return textSpan(node.expression);
                        case 192:
                            return textSpan(node.getChildAt(0), node.expression);
                        case 186:
                            return textSpan(node, ts.findNextToken(node.expression, node));
                        case 185:
                            return spanInNode(node.statement);
                        case 198:
                            return textSpan(node.getChildAt(0));
                        case 184:
                            return textSpan(node, ts.findNextToken(node.expression, node));
                        case 195:
                            return spanInNode(node.statement);
                        case 191:
                        case 190:
                            return textSpan(node.getChildAt(0), node.label);
                        case 187:
                            return spanInForStatement(node);
                        case 188:
                        case 189:
                            return textSpan(node, ts.findNextToken(node.expression, node));
                        case 194:
                            return textSpan(node, ts.findNextToken(node.expression, node));
                        case 221:
                        case 222:
                            return spanInNode(node.statements[0]);
                        case 197:
                            return spanInBlock(node.tryBlock);
                        case 196:
                            return textSpan(node, node.expression);
                        case 215:
                            return textSpan(node, node.expression);
                        case 209:
                            return textSpan(node, node.moduleReference);
                        case 210:
                            return textSpan(node, node.moduleSpecifier);
                        case 216:
                            return textSpan(node, node.moduleSpecifier);
                        case 206:
                            if (ts.getModuleInstanceState(node) !== 1) {
                                return undefined;
                            }
                        case 202:
                        case 205:
                        case 227:
                        case 158:
                        case 159:
                            return textSpan(node);
                        case 193:
                            return spanInNode(node.statement);
                        case 203:
                        case 204:
                            return undefined;
                        case 22:
                        case 1:
                            return spanInNodeIfStartsOnSameLine(ts.findPrecedingToken(node.pos, sourceFile));
                        case 23:
                            return spanInPreviousNode(node);
                        case 14:
                            return spanInOpenBraceToken(node);
                        case 15:
                            return spanInCloseBraceToken(node);
                        case 16:
                            return spanInOpenParenToken(node);
                        case 17:
                            return spanInCloseParenToken(node);
                        case 51:
                            return spanInColonToken(node);
                        case 25:
                        case 24:
                            return spanInGreaterThanOrLessThanToken(node);
                        case 100:
                            return spanInWhileKeyword(node);
                        case 76:
                        case 68:
                        case 81:
                            return spanInNextNode(node);
                        default:
                            if (node.parent.kind === 225 && node.parent.name === node) {
                                return spanInNode(node.parent.initializer);
                            }
                            if (node.parent.kind === 161 && node.parent.type === node) {
                                return spanInNode(node.parent.expression);
                            }
                            if (ts.isFunctionLike(node.parent) && node.parent.type === node) {
                                return spanInPreviousNode(node);
                            }
                            return spanInNode(node.parent);
                    }
                }
                function spanInVariableDeclaration(variableDeclaration) {
                    if (variableDeclaration.parent.parent.kind === 188 ||
                        variableDeclaration.parent.parent.kind === 189) {
                        return spanInNode(variableDeclaration.parent.parent);
                    }
                    var isParentVariableStatement = variableDeclaration.parent.parent.kind === 181;
                    var isDeclarationOfForStatement = variableDeclaration.parent.parent.kind === 187 && ts.contains(variableDeclaration.parent.parent.initializer.declarations, variableDeclaration);
                    var declarations = isParentVariableStatement
                        ? variableDeclaration.parent.parent.declarationList.declarations
                        : isDeclarationOfForStatement
                            ? variableDeclaration.parent.parent.initializer.declarations
                            : undefined;
                    if (variableDeclaration.initializer || (variableDeclaration.flags & 1)) {
                        if (declarations && declarations[0] === variableDeclaration) {
                            if (isParentVariableStatement) {
                                return textSpan(variableDeclaration.parent, variableDeclaration);
                            }
                            else {
                                ts.Debug.assert(isDeclarationOfForStatement);
                                return textSpan(ts.findPrecedingToken(variableDeclaration.pos, sourceFile, variableDeclaration.parent), variableDeclaration);
                            }
                        }
                        else {
                            return textSpan(variableDeclaration);
                        }
                    }
                    else if (declarations && declarations[0] !== variableDeclaration) {
                        var indexOfCurrentDeclaration = ts.indexOf(declarations, variableDeclaration);
                        return spanInVariableDeclaration(declarations[indexOfCurrentDeclaration - 1]);
                    }
                }
                function canHaveSpanInParameterDeclaration(parameter) {
                    return !!parameter.initializer || parameter.dotDotDotToken !== undefined ||
                        !!(parameter.flags & 16) || !!(parameter.flags & 32);
                }
                function spanInParameterDeclaration(parameter) {
                    if (canHaveSpanInParameterDeclaration(parameter)) {
                        return textSpan(parameter);
                    }
                    else {
                        var functionDeclaration = parameter.parent;
                        var indexOfParameter = ts.indexOf(functionDeclaration.parameters, parameter);
                        if (indexOfParameter) {
                            return spanInParameterDeclaration(functionDeclaration.parameters[indexOfParameter - 1]);
                        }
                        else {
                            return spanInNode(functionDeclaration.body);
                        }
                    }
                }
                function canFunctionHaveSpanInWholeDeclaration(functionDeclaration) {
                    return !!(functionDeclaration.flags & 1) ||
                        (functionDeclaration.parent.kind === 202 && functionDeclaration.kind !== 136);
                }
                function spanInFunctionDeclaration(functionDeclaration) {
                    if (!functionDeclaration.body) {
                        return undefined;
                    }
                    if (canFunctionHaveSpanInWholeDeclaration(functionDeclaration)) {
                        return textSpan(functionDeclaration);
                    }
                    return spanInNode(functionDeclaration.body);
                }
                function spanInFunctionBlock(block) {
                    var nodeForSpanInBlock = block.statements.length ? block.statements[0] : block.getLastToken();
                    if (canFunctionHaveSpanInWholeDeclaration(block.parent)) {
                        return spanInNodeIfStartsOnSameLine(block.parent, nodeForSpanInBlock);
                    }
                    return spanInNode(nodeForSpanInBlock);
                }
                function spanInBlock(block) {
                    switch (block.parent.kind) {
                        case 206:
                            if (ts.getModuleInstanceState(block.parent) !== 1) {
                                return undefined;
                            }
                        case 186:
                        case 184:
                        case 188:
                        case 189:
                            return spanInNodeIfStartsOnSameLine(block.parent, block.statements[0]);
                        case 187:
                            return spanInNodeIfStartsOnSameLine(ts.findPrecedingToken(block.pos, sourceFile, block.parent), block.statements[0]);
                    }
                    return spanInNode(block.statements[0]);
                }
                function spanInForStatement(forStatement) {
                    if (forStatement.initializer) {
                        if (forStatement.initializer.kind === 200) {
                            var variableDeclarationList = forStatement.initializer;
                            if (variableDeclarationList.declarations.length > 0) {
                                return spanInNode(variableDeclarationList.declarations[0]);
                            }
                        }
                        else {
                            return spanInNode(forStatement.initializer);
                        }
                    }
                    if (forStatement.condition) {
                        return textSpan(forStatement.condition);
                    }
                    if (forStatement.incrementor) {
                        return textSpan(forStatement.incrementor);
                    }
                }
                function spanInOpenBraceToken(node) {
                    switch (node.parent.kind) {
                        case 205:
                            var enumDeclaration = node.parent;
                            return spanInNodeIfStartsOnSameLine(ts.findPrecedingToken(node.pos, sourceFile, node.parent), enumDeclaration.members.length ? enumDeclaration.members[0] : enumDeclaration.getLastToken(sourceFile));
                        case 202:
                            var classDeclaration = node.parent;
                            return spanInNodeIfStartsOnSameLine(ts.findPrecedingToken(node.pos, sourceFile, node.parent), classDeclaration.members.length ? classDeclaration.members[0] : classDeclaration.getLastToken(sourceFile));
                        case 208:
                            return spanInNodeIfStartsOnSameLine(node.parent.parent, node.parent.clauses[0]);
                    }
                    return spanInNode(node.parent);
                }
                function spanInCloseBraceToken(node) {
                    switch (node.parent.kind) {
                        case 207:
                            if (ts.getModuleInstanceState(node.parent.parent) !== 1) {
                                return undefined;
                            }
                        case 205:
                        case 202:
                            return textSpan(node);
                        case 180:
                            if (ts.isFunctionBlock(node.parent)) {
                                return textSpan(node);
                            }
                        case 224:
                            return spanInNode(ts.lastOrUndefined(node.parent.statements));
                            ;
                        case 208:
                            var caseBlock = node.parent;
                            var lastClause = ts.lastOrUndefined(caseBlock.clauses);
                            if (lastClause) {
                                return spanInNode(ts.lastOrUndefined(lastClause.statements));
                            }
                            return undefined;
                        default:
                            return spanInNode(node.parent);
                    }
                }
                function spanInOpenParenToken(node) {
                    if (node.parent.kind === 185) {
                        return spanInPreviousNode(node);
                    }
                    return spanInNode(node.parent);
                }
                function spanInCloseParenToken(node) {
                    switch (node.parent.kind) {
                        case 163:
                        case 201:
                        case 164:
                        case 135:
                        case 134:
                        case 137:
                        case 138:
                        case 136:
                        case 186:
                        case 185:
                        case 187:
                            return spanInPreviousNode(node);
                        default:
                            return spanInNode(node.parent);
                    }
                    return spanInNode(node.parent);
                }
                function spanInColonToken(node) {
                    if (ts.isFunctionLike(node.parent) || node.parent.kind === 225) {
                        return spanInPreviousNode(node);
                    }
                    return spanInNode(node.parent);
                }
                function spanInGreaterThanOrLessThanToken(node) {
                    if (node.parent.kind === 161) {
                        return spanInNode(node.parent.expression);
                    }
                    return spanInNode(node.parent);
                }
                function spanInWhileKeyword(node) {
                    if (node.parent.kind === 185) {
                        return textSpan(node, ts.findNextToken(node.parent.expression, node.parent));
                    }
                    return spanInNode(node.parent);
                }
            }
        }
        BreakpointResolver.spanInSourceFileAtLocation = spanInSourceFileAtLocation;
    })(BreakpointResolver = ts.BreakpointResolver || (ts.BreakpointResolver = {}));
})(ts || (ts = {}));
