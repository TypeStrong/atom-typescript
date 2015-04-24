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
                        if (node.parent.kind === 184) {
                            return spanInPreviousNode(node);
                        }
                        if (node.parent.kind === 186) {
                            return textSpan(node);
                        }
                        if (node.parent.kind === 169 && node.parent.operatorToken.kind === 23) {
                            return textSpan(node);
                        }
                        if (node.parent.kind == 163 && node.parent.body == node) {
                            return textSpan(node);
                        }
                    }
                    switch (node.kind) {
                        case 180:
                            return spanInVariableDeclaration(node.declarationList.declarations[0]);
                        case 198:
                        case 132:
                        case 131:
                            return spanInVariableDeclaration(node);
                        case 129:
                            return spanInParameterDeclaration(node);
                        case 200:
                        case 134:
                        case 133:
                        case 136:
                        case 137:
                        case 135:
                        case 162:
                        case 163:
                            return spanInFunctionDeclaration(node);
                        case 179:
                            if (ts.isFunctionBlock(node)) {
                                return spanInFunctionBlock(node);
                            }
                        case 206:
                            return spanInBlock(node);
                        case 223:
                            return spanInBlock(node.block);
                        case 182:
                            return textSpan(node.expression);
                        case 191:
                            return textSpan(node.getChildAt(0), node.expression);
                        case 185:
                            return textSpan(node, ts.findNextToken(node.expression, node));
                        case 184:
                            return spanInNode(node.statement);
                        case 197:
                            return textSpan(node.getChildAt(0));
                        case 183:
                            return textSpan(node, ts.findNextToken(node.expression, node));
                        case 194:
                            return spanInNode(node.statement);
                        case 190:
                        case 189:
                            return textSpan(node.getChildAt(0), node.label);
                        case 186:
                            return spanInForStatement(node);
                        case 187:
                        case 188:
                            return textSpan(node, ts.findNextToken(node.expression, node));
                        case 193:
                            return textSpan(node, ts.findNextToken(node.expression, node));
                        case 220:
                        case 221:
                            return spanInNode(node.statements[0]);
                        case 196:
                            return spanInBlock(node.tryBlock);
                        case 195:
                            return textSpan(node, node.expression);
                        case 214:
                            return textSpan(node, node.expression);
                        case 208:
                            return textSpan(node, node.moduleReference);
                        case 209:
                            return textSpan(node, node.moduleSpecifier);
                        case 215:
                            return textSpan(node, node.moduleSpecifier);
                        case 205:
                            if (ts.getModuleInstanceState(node) !== 1) {
                                return undefined;
                            }
                        case 201:
                        case 204:
                        case 226:
                        case 157:
                        case 158:
                            return textSpan(node);
                        case 192:
                            return spanInNode(node.statement);
                        case 202:
                        case 203:
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
                            if (node.parent.kind === 224 && node.parent.name === node) {
                                return spanInNode(node.parent.initializer);
                            }
                            if (node.parent.kind === 160 && node.parent.type === node) {
                                return spanInNode(node.parent.expression);
                            }
                            if (ts.isFunctionLike(node.parent) && node.parent.type === node) {
                                return spanInPreviousNode(node);
                            }
                            return spanInNode(node.parent);
                    }
                }
                function spanInVariableDeclaration(variableDeclaration) {
                    if (variableDeclaration.parent.parent.kind === 187 ||
                        variableDeclaration.parent.parent.kind === 188) {
                        return spanInNode(variableDeclaration.parent.parent);
                    }
                    var isParentVariableStatement = variableDeclaration.parent.parent.kind === 180;
                    var isDeclarationOfForStatement = variableDeclaration.parent.parent.kind === 186 && ts.contains(variableDeclaration.parent.parent.initializer.declarations, variableDeclaration);
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
                        (functionDeclaration.parent.kind === 201 && functionDeclaration.kind !== 135);
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
                        case 205:
                            if (ts.getModuleInstanceState(block.parent) !== 1) {
                                return undefined;
                            }
                        case 185:
                        case 183:
                        case 187:
                        case 188:
                            return spanInNodeIfStartsOnSameLine(block.parent, block.statements[0]);
                        case 186:
                            return spanInNodeIfStartsOnSameLine(ts.findPrecedingToken(block.pos, sourceFile, block.parent), block.statements[0]);
                    }
                    return spanInNode(block.statements[0]);
                }
                function spanInForStatement(forStatement) {
                    if (forStatement.initializer) {
                        if (forStatement.initializer.kind === 199) {
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
                        case 204:
                            var enumDeclaration = node.parent;
                            return spanInNodeIfStartsOnSameLine(ts.findPrecedingToken(node.pos, sourceFile, node.parent), enumDeclaration.members.length ? enumDeclaration.members[0] : enumDeclaration.getLastToken(sourceFile));
                        case 201:
                            var classDeclaration = node.parent;
                            return spanInNodeIfStartsOnSameLine(ts.findPrecedingToken(node.pos, sourceFile, node.parent), classDeclaration.members.length ? classDeclaration.members[0] : classDeclaration.getLastToken(sourceFile));
                        case 207:
                            return spanInNodeIfStartsOnSameLine(node.parent.parent, node.parent.clauses[0]);
                    }
                    return spanInNode(node.parent);
                }
                function spanInCloseBraceToken(node) {
                    switch (node.parent.kind) {
                        case 206:
                            if (ts.getModuleInstanceState(node.parent.parent) !== 1) {
                                return undefined;
                            }
                        case 204:
                        case 201:
                            return textSpan(node);
                        case 179:
                            if (ts.isFunctionBlock(node.parent)) {
                                return textSpan(node);
                            }
                        case 223:
                            return spanInNode(node.parent.statements[node.parent.statements.length - 1]);
                            ;
                        case 207:
                            var caseBlock = node.parent;
                            var lastClause = caseBlock.clauses[caseBlock.clauses.length - 1];
                            if (lastClause) {
                                return spanInNode(lastClause.statements[lastClause.statements.length - 1]);
                            }
                            return undefined;
                        default:
                            return spanInNode(node.parent);
                    }
                }
                function spanInOpenParenToken(node) {
                    if (node.parent.kind === 184) {
                        return spanInPreviousNode(node);
                    }
                    return spanInNode(node.parent);
                }
                function spanInCloseParenToken(node) {
                    switch (node.parent.kind) {
                        case 162:
                        case 200:
                        case 163:
                        case 134:
                        case 133:
                        case 136:
                        case 137:
                        case 135:
                        case 185:
                        case 184:
                        case 186:
                            return spanInPreviousNode(node);
                        default:
                            return spanInNode(node.parent);
                    }
                    return spanInNode(node.parent);
                }
                function spanInColonToken(node) {
                    if (ts.isFunctionLike(node.parent) || node.parent.kind === 224) {
                        return spanInPreviousNode(node);
                    }
                    return spanInNode(node.parent);
                }
                function spanInGreaterThanOrLessThanToken(node) {
                    if (node.parent.kind === 160) {
                        return spanInNode(node.parent.expression);
                    }
                    return spanInNode(node.parent);
                }
                function spanInWhileKeyword(node) {
                    if (node.parent.kind === 184) {
                        return textSpan(node, ts.findNextToken(node.parent.expression, node.parent));
                    }
                    return spanInNode(node.parent);
                }
            }
        }
        BreakpointResolver.spanInSourceFileAtLocation = spanInSourceFileAtLocation;
    })(BreakpointResolver = ts.BreakpointResolver || (ts.BreakpointResolver = {}));
})(ts || (ts = {}));
