/// <reference path="formatting.ts"/>
/// <reference path="..\..\compiler\scanner.ts"/>
var ts;
(function (ts) {
    var formatting;
    (function (formatting) {
        var scanner = ts.createScanner(2, false);
        var ScanAction;
        (function (ScanAction) {
            ScanAction[ScanAction["Scan"] = 0] = "Scan";
            ScanAction[ScanAction["RescanGreaterThanToken"] = 1] = "RescanGreaterThanToken";
            ScanAction[ScanAction["RescanSlashToken"] = 2] = "RescanSlashToken";
            ScanAction[ScanAction["RescanTemplateToken"] = 3] = "RescanTemplateToken";
        })(ScanAction || (ScanAction = {}));
        function getFormattingScanner(sourceFile, startPos, endPos) {
            scanner.setText(sourceFile.text);
            scanner.setTextPos(startPos);
            var wasNewLine = true;
            var leadingTrivia;
            var trailingTrivia;
            var savedPos;
            var lastScanAction;
            var lastTokenInfo;
            return {
                advance: advance,
                readTokenInfo: readTokenInfo,
                isOnToken: isOnToken,
                lastTrailingTriviaWasNewLine: function () { return wasNewLine; },
                close: function () {
                    lastTokenInfo = undefined;
                    scanner.setText(undefined);
                }
            };
            function advance() {
                lastTokenInfo = undefined;
                var isStarted = scanner.getStartPos() !== startPos;
                if (isStarted) {
                    if (trailingTrivia) {
                        ts.Debug.assert(trailingTrivia.length !== 0);
                        wasNewLine = trailingTrivia[trailingTrivia.length - 1].kind === 4;
                    }
                    else {
                        wasNewLine = false;
                    }
                }
                leadingTrivia = undefined;
                trailingTrivia = undefined;
                if (!isStarted) {
                    scanner.scan();
                }
                var t;
                var pos = scanner.getStartPos();
                while (pos < endPos) {
                    var t_1 = scanner.getToken();
                    if (!ts.isTrivia(t_1)) {
                        break;
                    }
                    scanner.scan();
                    var item_1 = {
                        pos: pos,
                        end: scanner.getStartPos(),
                        kind: t_1
                    };
                    pos = scanner.getStartPos();
                    if (!leadingTrivia) {
                        leadingTrivia = [];
                    }
                    leadingTrivia.push(item_1);
                }
                savedPos = scanner.getStartPos();
            }
            function shouldRescanGreaterThanToken(node) {
                if (node) {
                    switch (node.kind) {
                        case 27:
                        case 60:
                        case 61:
                        case 42:
                        case 41:
                            return true;
                    }
                }
                return false;
            }
            function shouldRescanSlashToken(container) {
                return container.kind === 9;
            }
            function shouldRescanTemplateToken(container) {
                return container.kind === 12 ||
                    container.kind === 13;
            }
            function startsWithSlashToken(t) {
                return t === 36 || t === 57;
            }
            function readTokenInfo(n) {
                if (!isOnToken()) {
                    return {
                        leadingTrivia: leadingTrivia,
                        trailingTrivia: undefined,
                        token: undefined
                    };
                }
                var expectedScanAction = shouldRescanGreaterThanToken(n)
                    ? 1
                    : shouldRescanSlashToken(n)
                        ? 2
                        : shouldRescanTemplateToken(n)
                            ? 3
                            : 0;
                if (lastTokenInfo && expectedScanAction === lastScanAction) {
                    return fixTokenKind(lastTokenInfo, n);
                }
                if (scanner.getStartPos() !== savedPos) {
                    ts.Debug.assert(lastTokenInfo !== undefined);
                    scanner.setTextPos(savedPos);
                    scanner.scan();
                }
                var currentToken = scanner.getToken();
                if (expectedScanAction === 1 && currentToken === 25) {
                    currentToken = scanner.reScanGreaterToken();
                    ts.Debug.assert(n.kind === currentToken);
                    lastScanAction = 1;
                }
                else if (expectedScanAction === 2 && startsWithSlashToken(currentToken)) {
                    currentToken = scanner.reScanSlashToken();
                    ts.Debug.assert(n.kind === currentToken);
                    lastScanAction = 2;
                }
                else if (expectedScanAction === 3 && currentToken === 15) {
                    currentToken = scanner.reScanTemplateToken();
                    lastScanAction = 3;
                }
                else {
                    lastScanAction = 0;
                }
                var token = {
                    pos: scanner.getStartPos(),
                    end: scanner.getTextPos(),
                    kind: currentToken
                };
                if (trailingTrivia) {
                    trailingTrivia = undefined;
                }
                while (scanner.getStartPos() < endPos) {
                    currentToken = scanner.scan();
                    if (!ts.isTrivia(currentToken)) {
                        break;
                    }
                    var trivia = {
                        pos: scanner.getStartPos(),
                        end: scanner.getTextPos(),
                        kind: currentToken
                    };
                    if (!trailingTrivia) {
                        trailingTrivia = [];
                    }
                    trailingTrivia.push(trivia);
                    if (currentToken === 4) {
                        scanner.scan();
                        break;
                    }
                }
                lastTokenInfo = {
                    leadingTrivia: leadingTrivia,
                    trailingTrivia: trailingTrivia,
                    token: token
                };
                return fixTokenKind(lastTokenInfo, n);
            }
            function isOnToken() {
                var current = (lastTokenInfo && lastTokenInfo.token.kind) || scanner.getToken();
                var startPos = (lastTokenInfo && lastTokenInfo.token.pos) || scanner.getStartPos();
                return startPos < endPos && current !== 1 && !ts.isTrivia(current);
            }
            function fixTokenKind(tokenInfo, container) {
                if (ts.isToken(container) && tokenInfo.token.kind !== container.kind) {
                    tokenInfo.token.kind = container.kind;
                }
                return tokenInfo;
            }
        }
        formatting.getFormattingScanner = getFormattingScanner;
    })(formatting = ts.formatting || (ts.formatting = {}));
})(ts || (ts = {}));
