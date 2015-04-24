var ts;
(function (ts) {
    (function (PatternMatchKind) {
        PatternMatchKind[PatternMatchKind["exact"] = 0] = "exact";
        PatternMatchKind[PatternMatchKind["prefix"] = 1] = "prefix";
        PatternMatchKind[PatternMatchKind["substring"] = 2] = "substring";
        PatternMatchKind[PatternMatchKind["camelCase"] = 3] = "camelCase";
    })(ts.PatternMatchKind || (ts.PatternMatchKind = {}));
    var PatternMatchKind = ts.PatternMatchKind;
    function createPatternMatch(kind, punctuationStripped, isCaseSensitive, camelCaseWeight) {
        return {
            kind: kind,
            punctuationStripped: punctuationStripped,
            isCaseSensitive: isCaseSensitive,
            camelCaseWeight: camelCaseWeight
        };
    }
    function createPatternMatcher(pattern) {
        var stringToWordSpans = {};
        pattern = pattern.trim();
        var fullPatternSegment = createSegment(pattern);
        var dotSeparatedSegments = pattern.split(".").map(function (p) { return createSegment(p.trim()); });
        var invalidPattern = dotSeparatedSegments.length === 0 || ts.forEach(dotSeparatedSegments, segmentIsInvalid);
        return {
            getMatches: getMatches,
            getMatchesForLastSegmentOfPattern: getMatchesForLastSegmentOfPattern,
            patternContainsDots: dotSeparatedSegments.length > 1
        };
        function skipMatch(candidate) {
            return invalidPattern || !candidate;
        }
        function getMatchesForLastSegmentOfPattern(candidate) {
            if (skipMatch(candidate)) {
                return undefined;
            }
            return matchSegment(candidate, ts.lastOrUndefined(dotSeparatedSegments));
        }
        function getMatches(candidateContainers, candidate) {
            if (skipMatch(candidate)) {
                return undefined;
            }
            var candidateMatch = matchSegment(candidate, ts.lastOrUndefined(dotSeparatedSegments));
            if (!candidateMatch) {
                return undefined;
            }
            candidateContainers = candidateContainers || [];
            if (dotSeparatedSegments.length - 1 > candidateContainers.length) {
                return undefined;
            }
            var totalMatch = candidateMatch;
            for (var i = dotSeparatedSegments.length - 2, j = candidateContainers.length - 1; i >= 0; i--, j--) {
                var segment = dotSeparatedSegments[i];
                var containerName = candidateContainers[j];
                var containerMatch = matchSegment(containerName, segment);
                if (!containerMatch) {
                    return undefined;
                }
                ts.addRange(totalMatch, containerMatch);
            }
            return totalMatch;
        }
        function getWordSpans(word) {
            if (!ts.hasProperty(stringToWordSpans, word)) {
                stringToWordSpans[word] = breakIntoWordSpans(word);
            }
            return stringToWordSpans[word];
        }
        function matchTextChunk(candidate, chunk, punctuationStripped) {
            var index = indexOfIgnoringCase(candidate, chunk.textLowerCase);
            if (index === 0) {
                if (chunk.text.length === candidate.length) {
                    return createPatternMatch(PatternMatchKind.exact, punctuationStripped, candidate === chunk.text);
                }
                else {
                    return createPatternMatch(PatternMatchKind.prefix, punctuationStripped, startsWith(candidate, chunk.text));
                }
            }
            var isLowercase = chunk.isLowerCase;
            if (isLowercase) {
                if (index > 0) {
                    var wordSpans = getWordSpans(candidate);
                    for (var _i = 0; _i < wordSpans.length; _i++) {
                        var span = wordSpans[_i];
                        if (partStartsWith(candidate, span, chunk.text, true)) {
                            return createPatternMatch(PatternMatchKind.substring, punctuationStripped, partStartsWith(candidate, span, chunk.text, false));
                        }
                    }
                }
            }
            else {
                if (candidate.indexOf(chunk.text) > 0) {
                    return createPatternMatch(PatternMatchKind.substring, punctuationStripped, true);
                }
            }
            if (!isLowercase) {
                if (chunk.characterSpans.length > 0) {
                    var candidateParts = getWordSpans(candidate);
                    var camelCaseWeight = tryCamelCaseMatch(candidate, candidateParts, chunk, false);
                    if (camelCaseWeight !== undefined) {
                        return createPatternMatch(PatternMatchKind.camelCase, punctuationStripped, true, camelCaseWeight);
                    }
                    camelCaseWeight = tryCamelCaseMatch(candidate, candidateParts, chunk, true);
                    if (camelCaseWeight !== undefined) {
                        return createPatternMatch(PatternMatchKind.camelCase, punctuationStripped, false, camelCaseWeight);
                    }
                }
            }
            if (isLowercase) {
                if (chunk.text.length < candidate.length) {
                    if (index > 0 && isUpperCaseLetter(candidate.charCodeAt(index))) {
                        return createPatternMatch(PatternMatchKind.substring, punctuationStripped, false);
                    }
                }
            }
            return undefined;
        }
        function containsSpaceOrAsterisk(text) {
            for (var i = 0; i < text.length; i++) {
                var ch = text.charCodeAt(i);
                if (ch === 32 || ch === 42) {
                    return true;
                }
            }
            return false;
        }
        function matchSegment(candidate, segment) {
            if (!containsSpaceOrAsterisk(segment.totalTextChunk.text)) {
                var match = matchTextChunk(candidate, segment.totalTextChunk, false);
                if (match) {
                    return [match];
                }
            }
            var subWordTextChunks = segment.subWordTextChunks;
            var matches = undefined;
            for (var _i = 0; _i < subWordTextChunks.length; _i++) {
                var subWordTextChunk = subWordTextChunks[_i];
                var result = matchTextChunk(candidate, subWordTextChunk, true);
                if (!result) {
                    return undefined;
                }
                matches = matches || [];
                matches.push(result);
            }
            return matches;
        }
        function partStartsWith(candidate, candidateSpan, pattern, ignoreCase, patternSpan) {
            var patternPartStart = patternSpan ? patternSpan.start : 0;
            var patternPartLength = patternSpan ? patternSpan.length : pattern.length;
            if (patternPartLength > candidateSpan.length) {
                return false;
            }
            if (ignoreCase) {
                for (var i = 0; i < patternPartLength; i++) {
                    var ch1 = pattern.charCodeAt(patternPartStart + i);
                    var ch2 = candidate.charCodeAt(candidateSpan.start + i);
                    if (toLowerCase(ch1) !== toLowerCase(ch2)) {
                        return false;
                    }
                }
            }
            else {
                for (var i = 0; i < patternPartLength; i++) {
                    var ch1 = pattern.charCodeAt(patternPartStart + i);
                    var ch2 = candidate.charCodeAt(candidateSpan.start + i);
                    if (ch1 !== ch2) {
                        return false;
                    }
                }
            }
            return true;
        }
        function tryCamelCaseMatch(candidate, candidateParts, chunk, ignoreCase) {
            var chunkCharacterSpans = chunk.characterSpans;
            var currentCandidate = 0;
            var currentChunkSpan = 0;
            var firstMatch = undefined;
            var contiguous = undefined;
            while (true) {
                if (currentChunkSpan === chunkCharacterSpans.length) {
                    var weight = 0;
                    if (contiguous) {
                        weight += 1;
                    }
                    if (firstMatch === 0) {
                        weight += 2;
                    }
                    return weight;
                }
                else if (currentCandidate === candidateParts.length) {
                    return undefined;
                }
                var candidatePart = candidateParts[currentCandidate];
                var gotOneMatchThisCandidate = false;
                for (; currentChunkSpan < chunkCharacterSpans.length; currentChunkSpan++) {
                    var chunkCharacterSpan = chunkCharacterSpans[currentChunkSpan];
                    if (gotOneMatchThisCandidate) {
                        if (!isUpperCaseLetter(chunk.text.charCodeAt(chunkCharacterSpans[currentChunkSpan - 1].start)) ||
                            !isUpperCaseLetter(chunk.text.charCodeAt(chunkCharacterSpans[currentChunkSpan].start))) {
                            break;
                        }
                    }
                    if (!partStartsWith(candidate, candidatePart, chunk.text, ignoreCase, chunkCharacterSpan)) {
                        break;
                    }
                    gotOneMatchThisCandidate = true;
                    firstMatch = firstMatch === undefined ? currentCandidate : firstMatch;
                    contiguous = contiguous === undefined ? true : contiguous;
                    candidatePart = ts.createTextSpan(candidatePart.start + chunkCharacterSpan.length, candidatePart.length - chunkCharacterSpan.length);
                }
                if (!gotOneMatchThisCandidate && contiguous !== undefined) {
                    contiguous = false;
                }
                currentCandidate++;
            }
        }
    }
    ts.createPatternMatcher = createPatternMatcher;
    function patternMatchCompareTo(match1, match2) {
        return compareType(match1, match2) ||
            compareCamelCase(match1, match2) ||
            compareCase(match1, match2) ||
            comparePunctuation(match1, match2);
    }
    function comparePunctuation(result1, result2) {
        if (result1.punctuationStripped !== result2.punctuationStripped) {
            return result1.punctuationStripped ? 1 : -1;
        }
        return 0;
    }
    function compareCase(result1, result2) {
        if (result1.isCaseSensitive !== result2.isCaseSensitive) {
            return result1.isCaseSensitive ? -1 : 1;
        }
        return 0;
    }
    function compareType(result1, result2) {
        return result1.kind - result2.kind;
    }
    function compareCamelCase(result1, result2) {
        if (result1.kind === PatternMatchKind.camelCase && result2.kind === PatternMatchKind.camelCase) {
            return result2.camelCaseWeight - result1.camelCaseWeight;
        }
        return 0;
    }
    function createSegment(text) {
        return {
            totalTextChunk: createTextChunk(text),
            subWordTextChunks: breakPatternIntoTextChunks(text)
        };
    }
    function segmentIsInvalid(segment) {
        return segment.subWordTextChunks.length === 0;
    }
    function isUpperCaseLetter(ch) {
        if (ch >= 65 && ch <= 90) {
            return true;
        }
        if (ch < 127 || !ts.isUnicodeIdentifierStart(ch, 2)) {
            return false;
        }
        var str = String.fromCharCode(ch);
        return str === str.toUpperCase();
    }
    function isLowerCaseLetter(ch) {
        if (ch >= 97 && ch <= 122) {
            return true;
        }
        if (ch < 127 || !ts.isUnicodeIdentifierStart(ch, 2)) {
            return false;
        }
        var str = String.fromCharCode(ch);
        return str === str.toLowerCase();
    }
    function containsUpperCaseLetter(string) {
        for (var i = 0, n = string.length; i < n; i++) {
            if (isUpperCaseLetter(string.charCodeAt(i))) {
                return true;
            }
        }
        return false;
    }
    function startsWith(string, search) {
        for (var i = 0, n = search.length; i < n; i++) {
            if (string.charCodeAt(i) !== search.charCodeAt(i)) {
                return false;
            }
        }
        return true;
    }
    function indexOfIgnoringCase(string, value) {
        for (var i = 0, n = string.length - value.length; i <= n; i++) {
            if (startsWithIgnoringCase(string, value, i)) {
                return i;
            }
        }
        return -1;
    }
    function startsWithIgnoringCase(string, value, start) {
        for (var i = 0, n = value.length; i < n; i++) {
            var ch1 = toLowerCase(string.charCodeAt(i + start));
            var ch2 = value.charCodeAt(i);
            if (ch1 !== ch2) {
                return false;
            }
        }
        return true;
    }
    function toLowerCase(ch) {
        if (ch >= 65 && ch <= 90) {
            return 97 + (ch - 65);
        }
        if (ch < 127) {
            return ch;
        }
        return String.fromCharCode(ch).toLowerCase().charCodeAt(0);
    }
    function isDigit(ch) {
        return ch >= 48 && ch <= 57;
    }
    function isWordChar(ch) {
        return isUpperCaseLetter(ch) || isLowerCaseLetter(ch) || isDigit(ch) || ch === 95 || ch === 36;
    }
    function breakPatternIntoTextChunks(pattern) {
        var result = [];
        var wordStart = 0;
        var wordLength = 0;
        for (var i = 0; i < pattern.length; i++) {
            var ch = pattern.charCodeAt(i);
            if (isWordChar(ch)) {
                if (wordLength++ === 0) {
                    wordStart = i;
                }
            }
            else {
                if (wordLength > 0) {
                    result.push(createTextChunk(pattern.substr(wordStart, wordLength)));
                    wordLength = 0;
                }
            }
        }
        if (wordLength > 0) {
            result.push(createTextChunk(pattern.substr(wordStart, wordLength)));
        }
        return result;
    }
    function createTextChunk(text) {
        var textLowerCase = text.toLowerCase();
        return {
            text: text,
            textLowerCase: textLowerCase,
            isLowerCase: text === textLowerCase,
            characterSpans: breakIntoCharacterSpans(text)
        };
    }
    function breakIntoCharacterSpans(identifier) {
        return breakIntoSpans(identifier, false);
    }
    ts.breakIntoCharacterSpans = breakIntoCharacterSpans;
    function breakIntoWordSpans(identifier) {
        return breakIntoSpans(identifier, true);
    }
    ts.breakIntoWordSpans = breakIntoWordSpans;
    function breakIntoSpans(identifier, word) {
        var result = [];
        var wordStart = 0;
        for (var i = 1, n = identifier.length; i < n; i++) {
            var lastIsDigit = isDigit(identifier.charCodeAt(i - 1));
            var currentIsDigit = isDigit(identifier.charCodeAt(i));
            var hasTransitionFromLowerToUpper = transitionFromLowerToUpper(identifier, word, i);
            var hasTransitionFromUpperToLower = transitionFromUpperToLower(identifier, word, i, wordStart);
            if (charIsPunctuation(identifier.charCodeAt(i - 1)) ||
                charIsPunctuation(identifier.charCodeAt(i)) ||
                lastIsDigit != currentIsDigit ||
                hasTransitionFromLowerToUpper ||
                hasTransitionFromUpperToLower) {
                if (!isAllPunctuation(identifier, wordStart, i)) {
                    result.push(ts.createTextSpan(wordStart, i - wordStart));
                }
                wordStart = i;
            }
        }
        if (!isAllPunctuation(identifier, wordStart, identifier.length)) {
            result.push(ts.createTextSpan(wordStart, identifier.length - wordStart));
        }
        return result;
    }
    function charIsPunctuation(ch) {
        switch (ch) {
            case 33:
            case 34:
            case 35:
            case 37:
            case 38:
            case 39:
            case 40:
            case 41:
            case 42:
            case 44:
            case 45:
            case 46:
            case 47:
            case 58:
            case 59:
            case 63:
            case 64:
            case 91:
            case 92:
            case 93:
            case 95:
            case 123:
            case 125:
                return true;
        }
        return false;
    }
    function isAllPunctuation(identifier, start, end) {
        for (var i = start; i < end; i++) {
            var ch = identifier.charCodeAt(i);
            if (!charIsPunctuation(ch) || ch === 95 || ch === 36) {
                return false;
            }
        }
        return true;
    }
    function transitionFromUpperToLower(identifier, word, index, wordStart) {
        if (word) {
            if (index != wordStart &&
                index + 1 < identifier.length) {
                var currentIsUpper = isUpperCaseLetter(identifier.charCodeAt(index));
                var nextIsLower = isLowerCaseLetter(identifier.charCodeAt(index + 1));
                if (currentIsUpper && nextIsLower) {
                    for (var i = wordStart; i < index; i++) {
                        if (!isUpperCaseLetter(identifier.charCodeAt(i))) {
                            return false;
                        }
                    }
                    return true;
                }
            }
        }
        return false;
    }
    function transitionFromLowerToUpper(identifier, word, index) {
        var lastIsUpper = isUpperCaseLetter(identifier.charCodeAt(index - 1));
        var currentIsUpper = isUpperCaseLetter(identifier.charCodeAt(index));
        var transition = word
            ? (currentIsUpper && !lastIsUpper)
            : currentIsUpper;
        return transition;
    }
})(ts || (ts = {}));
