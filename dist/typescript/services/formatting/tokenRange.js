///<reference path='references.ts' />
var ts;
(function (ts) {
    var formatting;
    (function (formatting) {
        var Shared;
        (function (Shared) {
            var TokenRangeAccess = (function () {
                function TokenRangeAccess(from, to, except) {
                    this.tokens = [];
                    for (var token = from; token <= to; token++) {
                        if (except.indexOf(token) < 0) {
                            this.tokens.push(token);
                        }
                    }
                }
                TokenRangeAccess.prototype.GetTokens = function () {
                    return this.tokens;
                };
                TokenRangeAccess.prototype.Contains = function (token) {
                    return this.tokens.indexOf(token) >= 0;
                };
                return TokenRangeAccess;
            })();
            Shared.TokenRangeAccess = TokenRangeAccess;
            var TokenValuesAccess = (function () {
                function TokenValuesAccess(tks) {
                    this.tokens = tks && tks.length ? tks : [];
                }
                TokenValuesAccess.prototype.GetTokens = function () {
                    return this.tokens;
                };
                TokenValuesAccess.prototype.Contains = function (token) {
                    return this.tokens.indexOf(token) >= 0;
                };
                return TokenValuesAccess;
            })();
            Shared.TokenValuesAccess = TokenValuesAccess;
            var TokenSingleValueAccess = (function () {
                function TokenSingleValueAccess(token) {
                    this.token = token;
                }
                TokenSingleValueAccess.prototype.GetTokens = function () {
                    return [this.token];
                };
                TokenSingleValueAccess.prototype.Contains = function (tokenValue) {
                    return tokenValue == this.token;
                };
                return TokenSingleValueAccess;
            })();
            Shared.TokenSingleValueAccess = TokenSingleValueAccess;
            var TokenAllAccess = (function () {
                function TokenAllAccess() {
                }
                TokenAllAccess.prototype.GetTokens = function () {
                    var result = [];
                    for (var token = 0; token <= 125; token++) {
                        result.push(token);
                    }
                    return result;
                };
                TokenAllAccess.prototype.Contains = function (tokenValue) {
                    return true;
                };
                TokenAllAccess.prototype.toString = function () {
                    return "[allTokens]";
                };
                return TokenAllAccess;
            })();
            Shared.TokenAllAccess = TokenAllAccess;
            var TokenRange = (function () {
                function TokenRange(tokenAccess) {
                    this.tokenAccess = tokenAccess;
                }
                TokenRange.FromToken = function (token) {
                    return new TokenRange(new TokenSingleValueAccess(token));
                };
                TokenRange.FromTokens = function (tokens) {
                    return new TokenRange(new TokenValuesAccess(tokens));
                };
                TokenRange.FromRange = function (f, to, except) {
                    if (except === void 0) { except = []; }
                    return new TokenRange(new TokenRangeAccess(f, to, except));
                };
                TokenRange.AllTokens = function () {
                    return new TokenRange(new TokenAllAccess());
                };
                TokenRange.prototype.GetTokens = function () {
                    return this.tokenAccess.GetTokens();
                };
                TokenRange.prototype.Contains = function (token) {
                    return this.tokenAccess.Contains(token);
                };
                TokenRange.prototype.toString = function () {
                    return this.tokenAccess.toString();
                };
                TokenRange.Any = TokenRange.AllTokens();
                TokenRange.AnyIncludingMultilineComments = TokenRange.FromTokens(TokenRange.Any.GetTokens().concat([3]));
                TokenRange.Keywords = TokenRange.FromRange(66, 125);
                TokenRange.BinaryOperators = TokenRange.FromRange(24, 64);
                TokenRange.BinaryKeywordOperators = TokenRange.FromTokens([86, 87, 125]);
                TokenRange.UnaryPrefixOperators = TokenRange.FromTokens([38, 39, 47, 46]);
                TokenRange.UnaryPrefixExpressions = TokenRange.FromTokens([7, 65, 16, 18, 14, 93, 88]);
                TokenRange.UnaryPreincrementExpressions = TokenRange.FromTokens([65, 16, 93, 88]);
                TokenRange.UnaryPostincrementExpressions = TokenRange.FromTokens([65, 17, 19, 88]);
                TokenRange.UnaryPredecrementExpressions = TokenRange.FromTokens([65, 16, 93, 88]);
                TokenRange.UnaryPostdecrementExpressions = TokenRange.FromTokens([65, 17, 19, 88]);
                TokenRange.Comments = TokenRange.FromTokens([2, 3]);
                TokenRange.TypeNames = TokenRange.FromTokens([65, 119, 121, 113, 122, 99, 112]);
                return TokenRange;
            })();
            Shared.TokenRange = TokenRange;
        })(Shared = formatting.Shared || (formatting.Shared = {}));
    })(formatting = ts.formatting || (ts.formatting = {}));
})(ts || (ts = {}));
