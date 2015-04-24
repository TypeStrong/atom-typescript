///<reference path='references.ts' />
var ts;
(function (ts) {
    var formatting;
    (function (formatting) {
        var Rules = (function () {
            function Rules() {
                ///
                /// Common Rules
                ///
                this.IgnoreBeforeComment = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.Any, formatting.Shared.TokenRange.Comments), formatting.RuleOperation.create1(1));
                this.IgnoreAfterLineComment = new formatting.Rule(formatting.RuleDescriptor.create3(2, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create1(1));
                this.NoSpaceBeforeSemicolon = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 22), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.NoSpaceBeforeColon = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 51), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsNotBinaryOpContext), 8));
                this.NoSpaceBeforeQuestionMark = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 50), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsNotBinaryOpContext), 8));
                this.SpaceAfterColon = new formatting.Rule(formatting.RuleDescriptor.create3(51, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsNotBinaryOpContext), 2));
                this.SpaceAfterQuestionMarkInConditionalOperator = new formatting.Rule(formatting.RuleDescriptor.create3(50, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsConditionalOperatorContext), 2));
                this.NoSpaceAfterQuestionMark = new formatting.Rule(formatting.RuleDescriptor.create3(50, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.SpaceAfterSemicolon = new formatting.Rule(formatting.RuleDescriptor.create3(22, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2));
                this.SpaceAfterCloseBrace = new formatting.Rule(formatting.RuleDescriptor.create3(15, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsAfterCodeBlockContext), 2));
                this.SpaceBetweenCloseBraceAndElse = new formatting.Rule(formatting.RuleDescriptor.create1(15, 76), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2));
                this.SpaceBetweenCloseBraceAndWhile = new formatting.Rule(formatting.RuleDescriptor.create1(15, 100), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2));
                this.NoSpaceAfterCloseBrace = new formatting.Rule(formatting.RuleDescriptor.create3(15, formatting.Shared.TokenRange.FromTokens([17, 19, 23, 22])), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.NoSpaceBeforeDot = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 20), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.NoSpaceAfterDot = new formatting.Rule(formatting.RuleDescriptor.create3(20, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.NoSpaceBeforeOpenBracket = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 18), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.NoSpaceAfterOpenBracket = new formatting.Rule(formatting.RuleDescriptor.create3(18, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.NoSpaceBeforeCloseBracket = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 19), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.NoSpaceAfterCloseBracket = new formatting.Rule(formatting.RuleDescriptor.create3(19, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.FunctionOpenBraceLeftTokenRange = formatting.Shared.TokenRange.AnyIncludingMultilineComments;
                this.SpaceBeforeOpenBraceInFunction = new formatting.Rule(formatting.RuleDescriptor.create2(this.FunctionOpenBraceLeftTokenRange, 14), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsFunctionDeclContext, Rules.IsBeforeBlockContext, Rules.IsNotFormatOnEnter, Rules.IsSameLineTokenOrBeforeMultilineBlockContext), 2), 1);
                this.TypeScriptOpenBraceLeftTokenRange = formatting.Shared.TokenRange.FromTokens([65, 3]);
                this.SpaceBeforeOpenBraceInTypeScriptDeclWithBlock = new formatting.Rule(formatting.RuleDescriptor.create2(this.TypeScriptOpenBraceLeftTokenRange, 14), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsTypeScriptDeclWithBlockContext, Rules.IsNotFormatOnEnter, Rules.IsSameLineTokenOrBeforeMultilineBlockContext), 2), 1);
                this.ControlOpenBraceLeftTokenRange = formatting.Shared.TokenRange.FromTokens([17, 3, 75, 96, 81, 76]);
                this.SpaceBeforeOpenBraceInControl = new formatting.Rule(formatting.RuleDescriptor.create2(this.ControlOpenBraceLeftTokenRange, 14), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsControlDeclContext, Rules.IsNotFormatOnEnter, Rules.IsSameLineTokenOrBeforeMultilineBlockContext), 2), 1);
                this.SpaceAfterOpenBrace = new formatting.Rule(formatting.RuleDescriptor.create3(14, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSingleLineBlockContext), 2));
                this.SpaceBeforeCloseBrace = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 15), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSingleLineBlockContext), 2));
                this.NoSpaceBetweenEmptyBraceBrackets = new formatting.Rule(formatting.RuleDescriptor.create1(14, 15), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsObjectContext), 8));
                this.NewLineAfterOpenBraceInBlockContext = new formatting.Rule(formatting.RuleDescriptor.create3(14, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsMultilineBlockContext), 4));
                this.NewLineBeforeCloseBraceInBlockContext = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.AnyIncludingMultilineComments, 15), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsMultilineBlockContext), 4));
                this.NoSpaceAfterUnaryPrefixOperator = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.UnaryPrefixOperators, formatting.Shared.TokenRange.UnaryPrefixExpressions), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsNotBinaryOpContext), 8));
                this.NoSpaceAfterUnaryPreincrementOperator = new formatting.Rule(formatting.RuleDescriptor.create3(38, formatting.Shared.TokenRange.UnaryPreincrementExpressions), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.NoSpaceAfterUnaryPredecrementOperator = new formatting.Rule(formatting.RuleDescriptor.create3(39, formatting.Shared.TokenRange.UnaryPredecrementExpressions), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.NoSpaceBeforeUnaryPostincrementOperator = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.UnaryPostincrementExpressions, 38), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.NoSpaceBeforeUnaryPostdecrementOperator = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.UnaryPostdecrementExpressions, 39), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.SpaceAfterPostincrementWhenFollowedByAdd = new formatting.Rule(formatting.RuleDescriptor.create1(38, 33), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 2));
                this.SpaceAfterAddWhenFollowedByUnaryPlus = new formatting.Rule(formatting.RuleDescriptor.create1(33, 33), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 2));
                this.SpaceAfterAddWhenFollowedByPreincrement = new formatting.Rule(formatting.RuleDescriptor.create1(33, 38), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 2));
                this.SpaceAfterPostdecrementWhenFollowedBySubtract = new formatting.Rule(formatting.RuleDescriptor.create1(39, 34), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 2));
                this.SpaceAfterSubtractWhenFollowedByUnaryMinus = new formatting.Rule(formatting.RuleDescriptor.create1(34, 34), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 2));
                this.SpaceAfterSubtractWhenFollowedByPredecrement = new formatting.Rule(formatting.RuleDescriptor.create1(34, 39), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 2));
                this.NoSpaceBeforeComma = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 23), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.SpaceAfterCertainKeywords = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.FromTokens([98, 94, 88, 74, 90, 97]), formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2));
                this.SpaceAfterLetConstInVariableDeclaration = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.FromTokens([104, 70]), formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsStartOfVariableDeclarationList), 2));
                this.NoSpaceBeforeOpenParenInFuncCall = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 16), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsFunctionCallOrNewContext, Rules.IsPreviousTokenNotComma), 8));
                this.SpaceAfterFunctionInFuncDecl = new formatting.Rule(formatting.RuleDescriptor.create3(83, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsFunctionDeclContext), 2));
                this.NoSpaceBeforeOpenParenInFuncDecl = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 16), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsFunctionDeclContext), 8));
                this.SpaceAfterVoidOperator = new formatting.Rule(formatting.RuleDescriptor.create3(99, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsVoidOpContext), 2));
                this.NoSpaceBetweenReturnAndSemicolon = new formatting.Rule(formatting.RuleDescriptor.create1(90, 22), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.SpaceBetweenStatements = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.FromTokens([17, 75, 76, 67]), formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsNotForContext), 2));
                this.SpaceAfterTryFinally = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.FromTokens([96, 81]), 14), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2));
                this.SpaceAfterGetSetInMember = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.FromTokens([116, 120]), 65), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsFunctionDeclContext), 2));
                this.SpaceBeforeBinaryKeywordOperator = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.Any, formatting.Shared.TokenRange.BinaryKeywordOperators), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 2));
                this.SpaceAfterBinaryKeywordOperator = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.BinaryKeywordOperators, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 2));
                this.NoSpaceAfterConstructor = new formatting.Rule(formatting.RuleDescriptor.create1(114, 16), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.NoSpaceAfterModuleImport = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.FromTokens([117, 118]), 16), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.SpaceAfterCertainTypeScriptKeywords = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.FromTokens([69, 115, 77, 78, 79, 116, 102, 85, 103, 117, 106, 108, 120, 109]), formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2));
                this.SpaceBeforeCertainTypeScriptKeywords = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.Any, formatting.Shared.TokenRange.FromTokens([79, 102])), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2));
                this.SpaceAfterModuleName = new formatting.Rule(formatting.RuleDescriptor.create1(8, 14), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsModuleDeclContext), 2));
                this.SpaceAfterArrow = new formatting.Rule(formatting.RuleDescriptor.create3(32, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2));
                this.NoSpaceAfterEllipsis = new formatting.Rule(formatting.RuleDescriptor.create1(21, 65), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.NoSpaceAfterOptionalParameters = new formatting.Rule(formatting.RuleDescriptor.create3(50, formatting.Shared.TokenRange.FromTokens([17, 23])), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsNotBinaryOpContext), 8));
                this.NoSpaceBeforeOpenAngularBracket = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.TypeNames, 24), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsTypeArgumentOrParameterContext), 8));
                this.NoSpaceBetweenCloseParenAndAngularBracket = new formatting.Rule(formatting.RuleDescriptor.create1(17, 24), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsTypeArgumentOrParameterContext), 8));
                this.NoSpaceAfterOpenAngularBracket = new formatting.Rule(formatting.RuleDescriptor.create3(24, formatting.Shared.TokenRange.TypeNames), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsTypeArgumentOrParameterContext), 8));
                this.NoSpaceBeforeCloseAngularBracket = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 25), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsTypeArgumentOrParameterContext), 8));
                this.NoSpaceAfterCloseAngularBracket = new formatting.Rule(formatting.RuleDescriptor.create3(25, formatting.Shared.TokenRange.FromTokens([16, 18, 25, 23])), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsTypeArgumentOrParameterContext), 8));
                this.NoSpaceBetweenEmptyInterfaceBraceBrackets = new formatting.Rule(formatting.RuleDescriptor.create1(14, 15), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsObjectTypeContext), 8));
                this.SpaceBeforeAt = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 52), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2));
                this.NoSpaceAfterAt = new formatting.Rule(formatting.RuleDescriptor.create3(52, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.SpaceAfterDecorator = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.Any, formatting.Shared.TokenRange.FromTokens([65, 78, 73, 69, 109, 108, 106, 107, 116, 120, 18, 35])), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsEndOfDecoratorContextOnSameLine), 2));
                this.HighPriorityCommonRules =
                    [
                        this.IgnoreBeforeComment, this.IgnoreAfterLineComment,
                        this.NoSpaceBeforeColon, this.SpaceAfterColon, this.NoSpaceBeforeQuestionMark, this.SpaceAfterQuestionMarkInConditionalOperator,
                        this.NoSpaceAfterQuestionMark,
                        this.NoSpaceBeforeDot, this.NoSpaceAfterDot,
                        this.NoSpaceAfterUnaryPrefixOperator,
                        this.NoSpaceAfterUnaryPreincrementOperator, this.NoSpaceAfterUnaryPredecrementOperator,
                        this.NoSpaceBeforeUnaryPostincrementOperator, this.NoSpaceBeforeUnaryPostdecrementOperator,
                        this.SpaceAfterPostincrementWhenFollowedByAdd,
                        this.SpaceAfterAddWhenFollowedByUnaryPlus, this.SpaceAfterAddWhenFollowedByPreincrement,
                        this.SpaceAfterPostdecrementWhenFollowedBySubtract,
                        this.SpaceAfterSubtractWhenFollowedByUnaryMinus, this.SpaceAfterSubtractWhenFollowedByPredecrement,
                        this.NoSpaceAfterCloseBrace,
                        this.SpaceAfterOpenBrace, this.SpaceBeforeCloseBrace, this.NewLineBeforeCloseBraceInBlockContext,
                        this.SpaceAfterCloseBrace, this.SpaceBetweenCloseBraceAndElse, this.SpaceBetweenCloseBraceAndWhile, this.NoSpaceBetweenEmptyBraceBrackets,
                        this.SpaceAfterFunctionInFuncDecl, this.NewLineAfterOpenBraceInBlockContext, this.SpaceAfterGetSetInMember,
                        this.NoSpaceBetweenReturnAndSemicolon,
                        this.SpaceAfterCertainKeywords,
                        this.SpaceAfterLetConstInVariableDeclaration,
                        this.NoSpaceBeforeOpenParenInFuncCall,
                        this.SpaceBeforeBinaryKeywordOperator, this.SpaceAfterBinaryKeywordOperator,
                        this.SpaceAfterVoidOperator,
                        this.NoSpaceAfterConstructor, this.NoSpaceAfterModuleImport,
                        this.SpaceAfterCertainTypeScriptKeywords, this.SpaceBeforeCertainTypeScriptKeywords,
                        this.SpaceAfterModuleName,
                        this.SpaceAfterArrow,
                        this.NoSpaceAfterEllipsis,
                        this.NoSpaceAfterOptionalParameters,
                        this.NoSpaceBetweenEmptyInterfaceBraceBrackets,
                        this.NoSpaceBeforeOpenAngularBracket,
                        this.NoSpaceBetweenCloseParenAndAngularBracket,
                        this.NoSpaceAfterOpenAngularBracket,
                        this.NoSpaceBeforeCloseAngularBracket,
                        this.NoSpaceAfterCloseAngularBracket,
                        this.SpaceBeforeAt,
                        this.NoSpaceAfterAt,
                        this.SpaceAfterDecorator,
                    ];
                this.LowPriorityCommonRules =
                    [
                        this.NoSpaceBeforeSemicolon,
                        this.SpaceBeforeOpenBraceInControl, this.SpaceBeforeOpenBraceInFunction, this.SpaceBeforeOpenBraceInTypeScriptDeclWithBlock,
                        this.NoSpaceBeforeComma,
                        this.NoSpaceBeforeOpenBracket, this.NoSpaceAfterOpenBracket,
                        this.NoSpaceBeforeCloseBracket, this.NoSpaceAfterCloseBracket,
                        this.SpaceAfterSemicolon,
                        this.NoSpaceBeforeOpenParenInFuncDecl,
                        this.SpaceBetweenStatements, this.SpaceAfterTryFinally
                    ];
                this.SpaceAfterComma = new formatting.Rule(formatting.RuleDescriptor.create3(23, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2));
                this.NoSpaceAfterComma = new formatting.Rule(formatting.RuleDescriptor.create3(23, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.SpaceBeforeBinaryOperator = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.Any, formatting.Shared.TokenRange.BinaryOperators), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 2));
                this.SpaceAfterBinaryOperator = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.BinaryOperators, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 2));
                this.NoSpaceBeforeBinaryOperator = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.Any, formatting.Shared.TokenRange.BinaryOperators), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 8));
                this.NoSpaceAfterBinaryOperator = new formatting.Rule(formatting.RuleDescriptor.create4(formatting.Shared.TokenRange.BinaryOperators, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsBinaryOpContext), 8));
                this.SpaceAfterKeywordInControl = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Keywords, 16), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsControlDeclContext), 2));
                this.NoSpaceAfterKeywordInControl = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Keywords, 16), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsControlDeclContext), 8));
                this.NewLineBeforeOpenBraceInFunction = new formatting.Rule(formatting.RuleDescriptor.create2(this.FunctionOpenBraceLeftTokenRange, 14), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsFunctionDeclContext, Rules.IsBeforeMultilineBlockContext), 4), 1);
                this.NewLineBeforeOpenBraceInTypeScriptDeclWithBlock = new formatting.Rule(formatting.RuleDescriptor.create2(this.TypeScriptOpenBraceLeftTokenRange, 14), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsTypeScriptDeclWithBlockContext, Rules.IsBeforeMultilineBlockContext), 4), 1);
                this.NewLineBeforeOpenBraceInControl = new formatting.Rule(formatting.RuleDescriptor.create2(this.ControlOpenBraceLeftTokenRange, 14), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsControlDeclContext, Rules.IsBeforeMultilineBlockContext), 4), 1);
                this.SpaceAfterSemicolonInFor = new formatting.Rule(formatting.RuleDescriptor.create3(22, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsForContext), 2));
                this.NoSpaceAfterSemicolonInFor = new formatting.Rule(formatting.RuleDescriptor.create3(22, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext, Rules.IsForContext), 8));
                this.SpaceAfterOpenParen = new formatting.Rule(formatting.RuleDescriptor.create3(16, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2));
                this.SpaceBeforeCloseParen = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 17), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 2));
                this.NoSpaceBetweenParens = new formatting.Rule(formatting.RuleDescriptor.create1(16, 17), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.NoSpaceAfterOpenParen = new formatting.Rule(formatting.RuleDescriptor.create3(16, formatting.Shared.TokenRange.Any), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.NoSpaceBeforeCloseParen = new formatting.Rule(formatting.RuleDescriptor.create2(formatting.Shared.TokenRange.Any, 17), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsSameLineTokenContext), 8));
                this.SpaceAfterAnonymousFunctionKeyword = new formatting.Rule(formatting.RuleDescriptor.create1(83, 16), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsFunctionDeclContext), 2));
                this.NoSpaceAfterAnonymousFunctionKeyword = new formatting.Rule(formatting.RuleDescriptor.create1(83, 16), formatting.RuleOperation.create2(new formatting.RuleOperationContext(Rules.IsFunctionDeclContext), 8));
            }
            Rules.prototype.getRuleName = function (rule) {
                var o = this;
                for (var name_1 in o) {
                    if (o[name_1] === rule) {
                        return name_1;
                    }
                }
                throw new Error("Unknown rule");
            };
            Rules.IsForContext = function (context) {
                return context.contextNode.kind === 186;
            };
            Rules.IsNotForContext = function (context) {
                return !Rules.IsForContext(context);
            };
            Rules.IsBinaryOpContext = function (context) {
                switch (context.contextNode.kind) {
                    case 169:
                    case 170:
                        return true;
                    case 152:
                    case 203:
                    case 208:
                    case 198:
                    case 129:
                    case 226:
                    case 132:
                    case 131:
                        return context.currentTokenSpan.kind === 53 || context.nextTokenSpan.kind === 53;
                    case 187:
                        return context.currentTokenSpan.kind === 86 || context.nextTokenSpan.kind === 86;
                    case 188:
                        return context.currentTokenSpan.kind === 125 || context.nextTokenSpan.kind === 125;
                }
                return false;
            };
            Rules.IsNotBinaryOpContext = function (context) {
                return !Rules.IsBinaryOpContext(context);
            };
            Rules.IsConditionalOperatorContext = function (context) {
                return context.contextNode.kind === 170;
            };
            Rules.IsSameLineTokenOrBeforeMultilineBlockContext = function (context) {
                //// This check is mainly used inside SpaceBeforeOpenBraceInControl and SpaceBeforeOpenBraceInFunction.
                ////
                //// Ex: 
                //// if (1)     { ....
                ////      * ) and { are on the same line so apply the rule. Here we don't care whether it's same or multi block context
                ////
                //// Ex: 
                //// if (1)
                //// { ... }
                ////      * ) and { are on differnet lines. We only need to format if the block is multiline context. So in this case we don't format.
                ////
                //// Ex:
                //// if (1) 
                //// { ...
                //// }
                ////      * ) and { are on differnet lines. We only need to format if the block is multiline context. So in this case we format.
                return context.TokensAreOnSameLine() || Rules.IsBeforeMultilineBlockContext(context);
            };
            Rules.IsBeforeMultilineBlockContext = function (context) {
                return Rules.IsBeforeBlockContext(context) && !(context.NextNodeAllOnSameLine() || context.NextNodeBlockIsOnOneLine());
            };
            Rules.IsMultilineBlockContext = function (context) {
                return Rules.IsBlockContext(context) && !(context.ContextNodeAllOnSameLine() || context.ContextNodeBlockIsOnOneLine());
            };
            Rules.IsSingleLineBlockContext = function (context) {
                return Rules.IsBlockContext(context) && (context.ContextNodeAllOnSameLine() || context.ContextNodeBlockIsOnOneLine());
            };
            Rules.IsBlockContext = function (context) {
                return Rules.NodeIsBlockContext(context.contextNode);
            };
            Rules.IsBeforeBlockContext = function (context) {
                return Rules.NodeIsBlockContext(context.nextTokenParent);
            };
            Rules.NodeIsBlockContext = function (node) {
                if (Rules.NodeIsTypeScriptDeclWithBlockContext(node)) {
                    return true;
                }
                switch (node.kind) {
                    case 179:
                    case 207:
                    case 154:
                    case 206:
                        return true;
                }
                return false;
            };
            Rules.IsFunctionDeclContext = function (context) {
                switch (context.contextNode.kind) {
                    case 200:
                    case 134:
                    case 133:
                    case 136:
                    case 137:
                    case 138:
                    case 162:
                    case 135:
                    case 163:
                    case 202:
                        return true;
                }
                return false;
            };
            Rules.IsTypeScriptDeclWithBlockContext = function (context) {
                return Rules.NodeIsTypeScriptDeclWithBlockContext(context.contextNode);
            };
            Rules.NodeIsTypeScriptDeclWithBlockContext = function (node) {
                switch (node.kind) {
                    case 201:
                    case 202:
                    case 204:
                    case 145:
                    case 205:
                        return true;
                }
                return false;
            };
            Rules.IsAfterCodeBlockContext = function (context) {
                switch (context.currentTokenParent.kind) {
                    case 201:
                    case 205:
                    case 204:
                    case 179:
                    case 223:
                    case 206:
                    case 193:
                        return true;
                }
                return false;
            };
            Rules.IsControlDeclContext = function (context) {
                switch (context.contextNode.kind) {
                    case 183:
                    case 193:
                    case 186:
                    case 187:
                    case 188:
                    case 185:
                    case 196:
                    case 184:
                    case 192:
                    case 223:
                        return true;
                    default:
                        return false;
                }
            };
            Rules.IsObjectContext = function (context) {
                return context.contextNode.kind === 154;
            };
            Rules.IsFunctionCallContext = function (context) {
                return context.contextNode.kind === 157;
            };
            Rules.IsNewContext = function (context) {
                return context.contextNode.kind === 158;
            };
            Rules.IsFunctionCallOrNewContext = function (context) {
                return Rules.IsFunctionCallContext(context) || Rules.IsNewContext(context);
            };
            Rules.IsPreviousTokenNotComma = function (context) {
                return context.currentTokenSpan.kind !== 23;
            };
            Rules.IsSameLineTokenContext = function (context) {
                return context.TokensAreOnSameLine();
            };
            Rules.IsEndOfDecoratorContextOnSameLine = function (context) {
                return context.TokensAreOnSameLine() &&
                    context.contextNode.decorators &&
                    Rules.NodeIsInDecoratorContext(context.currentTokenParent) &&
                    !Rules.NodeIsInDecoratorContext(context.nextTokenParent);
            };
            Rules.NodeIsInDecoratorContext = function (node) {
                while (ts.isExpression(node)) {
                    node = node.parent;
                }
                return node.kind === 130;
            };
            Rules.IsStartOfVariableDeclarationList = function (context) {
                return context.currentTokenParent.kind === 199 &&
                    context.currentTokenParent.getStart(context.sourceFile) === context.currentTokenSpan.pos;
            };
            Rules.IsNotFormatOnEnter = function (context) {
                return context.formattingRequestKind != 2;
            };
            Rules.IsModuleDeclContext = function (context) {
                return context.contextNode.kind === 205;
            };
            Rules.IsObjectTypeContext = function (context) {
                return context.contextNode.kind === 145;
            };
            Rules.IsTypeArgumentOrParameter = function (token, parent) {
                if (token.kind !== 24 && token.kind !== 25) {
                    return false;
                }
                switch (parent.kind) {
                    case 141:
                    case 201:
                    case 202:
                    case 200:
                    case 162:
                    case 163:
                    case 134:
                    case 133:
                    case 138:
                    case 139:
                    case 157:
                    case 158:
                        return true;
                    default:
                        return false;
                }
            };
            Rules.IsTypeArgumentOrParameterContext = function (context) {
                return Rules.IsTypeArgumentOrParameter(context.currentTokenSpan, context.currentTokenParent) ||
                    Rules.IsTypeArgumentOrParameter(context.nextTokenSpan, context.nextTokenParent);
            };
            Rules.IsVoidOpContext = function (context) {
                return context.currentTokenSpan.kind === 99 && context.currentTokenParent.kind === 166;
            };
            return Rules;
        })();
        formatting.Rules = Rules;
    })(formatting = ts.formatting || (ts.formatting = {}));
})(ts || (ts = {}));
