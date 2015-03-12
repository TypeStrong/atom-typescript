var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var ts = require('typescript');
var debug;
(function (debug) {
    function stack() {
        console.error((new Error()).stack);
    }
    debug.stack = stack;
})(debug || (debug = {}));
function createTextSpan(start, length) {
    if (start < 0) {
        throw new Error("start < 0");
    }
    if (length < 0) {
        throw new Error("length < 0");
    }
    return { start: start, length: length };
}
function createTextChangeRange(span, newLength) {
    if (newLength < 0) {
        throw new Error("newLength < 0");
    }
    return { span: span, newLength: newLength };
}
function textSpanEnd(span) {
    return span.start + span.length;
}
function collapseTextChangeRangesAcrossMultipleVersions(changes) {
    if (changes.length === 0) {
        return unchangedTextChangeRange;
    }
    if (changes.length === 1) {
        return changes[0];
    }
    var change0 = changes[0];
    var oldStartN = change0.span.start;
    var oldEndN = textSpanEnd(change0.span);
    var newEndN = oldStartN + change0.newLength;
    for (var i = 1; i < changes.length; i++) {
        var nextChange = changes[i];
        var oldStart1 = oldStartN;
        var oldEnd1 = oldEndN;
        var newEnd1 = newEndN;
        var oldStart2 = nextChange.span.start;
        var oldEnd2 = textSpanEnd(nextChange.span);
        var newEnd2 = oldStart2 + nextChange.newLength;
        oldStartN = Math.min(oldStart1, oldStart2);
        oldEndN = Math.max(oldEnd1, oldEnd1 + (oldEnd2 - newEnd1));
        newEndN = Math.max(newEnd2, newEnd2 + (newEnd1 - oldEnd2));
    }
    return createTextChangeRange(createTextSpanFromBounds(oldStartN, oldEndN), newEndN - oldStartN);
}
function createTextSpanFromBounds(start, end) {
    return createTextSpan(start, end - start);
}
var unchangedTextChangeRange = createTextChangeRange(createTextSpan(0, 0), 0);
var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasProperty(map, key) {
    return hasOwnProperty.call(map, key);
}
function lookUp(map, key) {
    return hasProperty(map, key) ? map[key] : undefined;
}
var _fs = require('fs');
var sys;
(function (sys) {
    function readFile(fileName) {
        if (!_fs.existsSync(fileName)) {
            return undefined;
        }
        var buffer = _fs.readFileSync(fileName);
        var len = buffer.length;
        if (len >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
            len &= ~1;
            for (var i = 0; i < len; i += 2) {
                var temp = buffer[i];
                buffer[i] = buffer[i + 1];
                buffer[i + 1] = temp;
            }
            return buffer.toString("utf16le", 2);
        }
        if (len >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
            return buffer.toString("utf16le", 2);
        }
        if (len >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
            return buffer.toString("utf8", 3);
        }
        return buffer.toString("utf8");
    }
    sys.readFile = readFile;
    function writeFile(fileName, data, writeByteOrderMark) {
        if (writeByteOrderMark) {
            data = '\uFEFF' + data;
        }
        _fs.writeFileSync(fileName, data, "utf8");
    }
    sys.writeFile = writeFile;
})(sys || (sys = {}));
var LineLeaf = (function () {
    function LineLeaf(text) {
        this.text = text;
    }
    LineLeaf.prototype.setUdata = function (data) {
        this.udata = data;
    };
    LineLeaf.prototype.getUdata = function () {
        return this.udata;
    };
    LineLeaf.prototype.isLeaf = function () {
        return true;
    };
    LineLeaf.prototype.walk = function (rangeStart, rangeLength, walkFns) {
        walkFns.leaf(rangeStart, rangeLength, this);
    };
    LineLeaf.prototype.charCount = function () {
        return this.text.length;
    };
    LineLeaf.prototype.lineCount = function () {
        return 1;
    };
    return LineLeaf;
})();
var CharRangeSection;
(function (CharRangeSection) {
    CharRangeSection[CharRangeSection["PreStart"] = 0] = "PreStart";
    CharRangeSection[CharRangeSection["Start"] = 1] = "Start";
    CharRangeSection[CharRangeSection["Entire"] = 2] = "Entire";
    CharRangeSection[CharRangeSection["Mid"] = 3] = "Mid";
    CharRangeSection[CharRangeSection["End"] = 4] = "End";
    CharRangeSection[CharRangeSection["PostEnd"] = 5] = "PostEnd";
})(CharRangeSection || (CharRangeSection = {}));
var lineCollectionCapacity = 4;
var LineNode = (function () {
    function LineNode() {
        this.totalChars = 0;
        this.totalLines = 0;
        this.children = [];
    }
    LineNode.prototype.isLeaf = function () {
        return false;
    };
    LineNode.prototype.updateCounts = function () {
        this.totalChars = 0;
        this.totalLines = 0;
        for (var i = 0, len = this.children.length; i < len; i++) {
            var child = this.children[i];
            this.totalChars += child.charCount();
            this.totalLines += child.lineCount();
        }
    };
    LineNode.prototype.execWalk = function (rangeStart, rangeLength, walkFns, childIndex, nodeType) {
        if (walkFns.pre) {
            walkFns.pre(rangeStart, rangeLength, this.children[childIndex], this, nodeType);
        }
        if (walkFns.goSubtree) {
            this.children[childIndex].walk(rangeStart, rangeLength, walkFns);
            if (walkFns.post) {
                walkFns.post(rangeStart, rangeLength, this.children[childIndex], this, nodeType);
            }
        }
        else {
            walkFns.goSubtree = true;
        }
        return walkFns.done;
    };
    LineNode.prototype.skipChild = function (relativeStart, relativeLength, childIndex, walkFns, nodeType) {
        if (walkFns.pre && (!walkFns.done)) {
            walkFns.pre(relativeStart, relativeLength, this.children[childIndex], this, nodeType);
            walkFns.goSubtree = true;
        }
    };
    LineNode.prototype.walk = function (rangeStart, rangeLength, walkFns) {
        var childIndex = 0;
        var child = this.children[0];
        var childCharCount = child.charCount();
        var adjustedStart = rangeStart;
        while (adjustedStart >= childCharCount) {
            this.skipChild(adjustedStart, rangeLength, childIndex, walkFns, 0);
            adjustedStart -= childCharCount;
            child = this.children[++childIndex];
            childCharCount = child.charCount();
        }
        if ((adjustedStart + rangeLength) <= childCharCount) {
            if (this.execWalk(adjustedStart, rangeLength, walkFns, childIndex, 2)) {
                return;
            }
        }
        else {
            if (this.execWalk(adjustedStart, childCharCount - adjustedStart, walkFns, childIndex, 1)) {
                return;
            }
            var adjustedLength = rangeLength - (childCharCount - adjustedStart);
            child = this.children[++childIndex];
            childCharCount = child.charCount();
            while (adjustedLength > childCharCount) {
                if (this.execWalk(0, childCharCount, walkFns, childIndex, 3)) {
                    return;
                }
                adjustedLength -= childCharCount;
                child = this.children[++childIndex];
                childCharCount = child.charCount();
            }
            if (adjustedLength > 0) {
                if (this.execWalk(0, adjustedLength, walkFns, childIndex, 4)) {
                    return;
                }
            }
        }
        if (walkFns.pre) {
            var clen = this.children.length;
            if (childIndex < (clen - 1)) {
                for (var ej = childIndex + 1; ej < clen; ej++) {
                    this.skipChild(0, 0, ej, walkFns, 5);
                }
            }
        }
    };
    LineNode.prototype.charOffsetToLineNumberAndPos = function (lineNumber, charOffset) {
        var childInfo = this.childFromCharOffset(lineNumber, charOffset);
        if (!childInfo.child) {
            return {
                line: lineNumber,
                col: charOffset,
            };
        }
        else if (childInfo.childIndex < this.children.length) {
            if (childInfo.child.isLeaf()) {
                return {
                    line: childInfo.lineNumber,
                    col: childInfo.charOffset,
                    text: (childInfo.child).text,
                    leaf: (childInfo.child)
                };
            }
            else {
                var lineNode = (childInfo.child);
                return lineNode.charOffsetToLineNumberAndPos(childInfo.lineNumber, childInfo.charOffset);
            }
        }
        else {
            var lineInfo = this.lineNumberToInfo(this.lineCount(), 0);
            return { line: this.lineCount(), col: lineInfo.leaf.charCount() };
        }
    };
    LineNode.prototype.lineNumberToInfo = function (lineNumber, charOffset) {
        var childInfo = this.childFromLineNumber(lineNumber, charOffset);
        if (!childInfo.child) {
            return {
                line: lineNumber,
                col: charOffset
            };
        }
        else if (childInfo.child.isLeaf()) {
            return {
                line: lineNumber,
                col: childInfo.charOffset,
                text: (childInfo.child).text,
                leaf: (childInfo.child)
            };
        }
        else {
            var lineNode = (childInfo.child);
            return lineNode.lineNumberToInfo(childInfo.relativeLineNumber, childInfo.charOffset);
        }
    };
    LineNode.prototype.childFromLineNumber = function (lineNumber, charOffset) {
        var child;
        var relativeLineNumber = lineNumber;
        for (var i = 0, len = this.children.length; i < len; i++) {
            child = this.children[i];
            var childLineCount = child.lineCount();
            if (childLineCount >= relativeLineNumber) {
                break;
            }
            else {
                relativeLineNumber -= childLineCount;
                charOffset += child.charCount();
            }
        }
        return {
            child: child,
            childIndex: i,
            relativeLineNumber: relativeLineNumber,
            charOffset: charOffset
        };
    };
    LineNode.prototype.childFromCharOffset = function (lineNumber, charOffset) {
        var child;
        for (var i = 0, len = this.children.length; i < len; i++) {
            child = this.children[i];
            if (child.charCount() > charOffset) {
                break;
            }
            else {
                charOffset -= child.charCount();
                lineNumber += child.lineCount();
            }
        }
        return {
            child: child,
            childIndex: i,
            charOffset: charOffset,
            lineNumber: lineNumber
        };
    };
    LineNode.prototype.splitAfter = function (childIndex) {
        var splitNode;
        var clen = this.children.length;
        childIndex++;
        var endLength = childIndex;
        if (childIndex < clen) {
            splitNode = new LineNode();
            while (childIndex < clen) {
                splitNode.add(this.children[childIndex++]);
            }
            splitNode.updateCounts();
        }
        this.children.length = endLength;
        return splitNode;
    };
    LineNode.prototype.remove = function (child) {
        var childIndex = this.findChildIndex(child);
        var clen = this.children.length;
        if (childIndex < (clen - 1)) {
            for (var i = childIndex; i < (clen - 1); i++) {
                this.children[i] = this.children[i + 1];
            }
        }
        this.children.length--;
    };
    LineNode.prototype.findChildIndex = function (child) {
        var childIndex = 0;
        var clen = this.children.length;
        while ((this.children[childIndex] != child) && (childIndex < clen))
            childIndex++;
        return childIndex;
    };
    LineNode.prototype.insertAt = function (child, nodes) {
        var childIndex = this.findChildIndex(child);
        var clen = this.children.length;
        var nodeCount = nodes.length;
        if ((clen < lineCollectionCapacity) && (childIndex == (clen - 1)) && (nodeCount == 1)) {
            this.add(nodes[0]);
            this.updateCounts();
            return [];
        }
        else {
            var shiftNode = this.splitAfter(childIndex);
            var nodeIndex = 0;
            childIndex++;
            while ((childIndex < lineCollectionCapacity) && (nodeIndex < nodeCount)) {
                this.children[childIndex++] = nodes[nodeIndex++];
            }
            var splitNodes = [];
            var splitNodeCount = 0;
            if (nodeIndex < nodeCount) {
                splitNodeCount = Math.ceil((nodeCount - nodeIndex) / lineCollectionCapacity);
                splitNodes = new Array(splitNodeCount);
                var splitNodeIndex = 0;
                for (var i = 0; i < splitNodeCount; i++) {
                    splitNodes[i] = new LineNode();
                }
                var splitNode = splitNodes[0];
                while (nodeIndex < nodeCount) {
                    splitNode.add(nodes[nodeIndex++]);
                    if (splitNode.children.length == lineCollectionCapacity) {
                        splitNodeIndex++;
                        splitNode = splitNodes[splitNodeIndex];
                    }
                }
                for (i = splitNodes.length - 1; i >= 0; i--) {
                    if (splitNodes[i].children.length == 0) {
                        splitNodes.length--;
                    }
                }
            }
            if (shiftNode) {
                splitNodes[splitNodes.length] = shiftNode;
            }
            this.updateCounts();
            for (i = 0; i < splitNodeCount; i++) {
                splitNodes[i].updateCounts();
            }
            return splitNodes;
        }
    };
    LineNode.prototype.add = function (collection) {
        this.children[this.children.length] = collection;
        return (this.children.length < lineCollectionCapacity);
    };
    LineNode.prototype.charCount = function () {
        return this.totalChars;
    };
    LineNode.prototype.lineCount = function () {
        return this.totalLines;
    };
    return LineNode;
})();
exports.LineNode = LineNode;
var BaseLineIndexWalker = (function () {
    function BaseLineIndexWalker() {
        this.goSubtree = true;
        this.done = false;
    }
    BaseLineIndexWalker.prototype.leaf = function (rangeStart, rangeLength, ll) {
    };
    return BaseLineIndexWalker;
})();
var EditWalker = (function (_super) {
    __extends(EditWalker, _super);
    function EditWalker() {
        _super.call(this);
        this.lineIndex = new LineIndex();
        this.endBranch = [];
        this.state = 2;
        this.initialText = "";
        this.trailingText = "";
        this.suppressTrailingText = false;
        this.lineIndex.root = new LineNode();
        this.startPath = [this.lineIndex.root];
        this.stack = [this.lineIndex.root];
    }
    EditWalker.prototype.insertLines = function (insertedText) {
        if (this.suppressTrailingText) {
            this.trailingText = "";
        }
        if (insertedText) {
            insertedText = this.initialText + insertedText + this.trailingText;
        }
        else {
            insertedText = this.initialText + this.trailingText;
        }
        var lm = LineIndex.linesFromText(insertedText);
        var lines = lm.lines;
        if (lines.length > 1) {
            if (lines[lines.length - 1] == "") {
                lines.length--;
            }
        }
        var branchParent;
        var lastZeroCount;
        for (var k = this.endBranch.length - 1; k >= 0; k--) {
            this.endBranch[k].updateCounts();
            if (this.endBranch[k].charCount() == 0) {
                lastZeroCount = this.endBranch[k];
                if (k > 0) {
                    branchParent = this.endBranch[k - 1];
                }
                else {
                    branchParent = this.branchNode;
                }
            }
        }
        if (lastZeroCount) {
            branchParent.remove(lastZeroCount);
        }
        var insertionNode = this.startPath[this.startPath.length - 2];
        var leafNode = this.startPath[this.startPath.length - 1];
        var len = lines.length;
        if (len > 0) {
            leafNode.text = lines[0];
            if (len > 1) {
                var insertedNodes = new Array(len - 1);
                var startNode = leafNode;
                for (var i = 1, len = lines.length; i < len; i++) {
                    insertedNodes[i - 1] = new LineLeaf(lines[i]);
                }
                var pathIndex = this.startPath.length - 2;
                while (pathIndex >= 0) {
                    insertionNode = this.startPath[pathIndex];
                    insertedNodes = insertionNode.insertAt(startNode, insertedNodes);
                    pathIndex--;
                    startNode = insertionNode;
                }
                var insertedNodesLen = insertedNodes.length;
                while (insertedNodesLen > 0) {
                    var newRoot = new LineNode();
                    newRoot.add(this.lineIndex.root);
                    insertedNodes = newRoot.insertAt(this.lineIndex.root, insertedNodes);
                    insertedNodesLen = insertedNodes.length;
                    this.lineIndex.root = newRoot;
                }
                this.lineIndex.root.updateCounts();
            }
            else {
                for (var j = this.startPath.length - 2; j >= 0; j--) {
                    this.startPath[j].updateCounts();
                }
            }
        }
        else {
            insertionNode.remove(leafNode);
            for (var j = this.startPath.length - 2; j >= 0; j--) {
                this.startPath[j].updateCounts();
            }
        }
        return this.lineIndex;
    };
    EditWalker.prototype.post = function (relativeStart, relativeLength, lineCollection, parent, nodeType) {
        if (lineCollection == this.lineCollectionAtBranch) {
            this.state = 4;
        }
        this.stack.length--;
        return undefined;
    };
    EditWalker.prototype.pre = function (relativeStart, relativeLength, lineCollection, parent, nodeType) {
        var currentNode = this.stack[this.stack.length - 1];
        if ((this.state == 2) && (nodeType == 1)) {
            this.state = 1;
            this.branchNode = currentNode;
            this.lineCollectionAtBranch = lineCollection;
        }
        var child;
        function fresh(node) {
            if (node.isLeaf()) {
                return new LineLeaf("");
            }
            else
                return new LineNode();
        }
        switch (nodeType) {
            case 0:
                this.goSubtree = false;
                if (this.state != 4) {
                    currentNode.add(lineCollection);
                }
                break;
            case 1:
                if (this.state == 4) {
                    this.goSubtree = false;
                }
                else {
                    child = fresh(lineCollection);
                    currentNode.add(child);
                    this.startPath[this.startPath.length] = child;
                }
                break;
            case 2:
                if (this.state != 4) {
                    child = fresh(lineCollection);
                    currentNode.add(child);
                    this.startPath[this.startPath.length] = child;
                }
                else {
                    if (!lineCollection.isLeaf()) {
                        child = fresh(lineCollection);
                        currentNode.add(child);
                        this.endBranch[this.endBranch.length] = child;
                    }
                }
                break;
            case 3:
                this.goSubtree = false;
                break;
            case 4:
                if (this.state != 4) {
                    this.goSubtree = false;
                }
                else {
                    if (!lineCollection.isLeaf()) {
                        child = fresh(lineCollection);
                        currentNode.add(child);
                        this.endBranch[this.endBranch.length] = child;
                    }
                }
                break;
            case 5:
                this.goSubtree = false;
                if (this.state != 1) {
                    currentNode.add(lineCollection);
                }
                break;
        }
        if (this.goSubtree) {
            this.stack[this.stack.length] = child;
        }
        return lineCollection;
    };
    EditWalker.prototype.leaf = function (relativeStart, relativeLength, ll) {
        if (this.state == 1) {
            this.initialText = ll.text.substring(0, relativeStart);
        }
        else if (this.state == 2) {
            this.initialText = ll.text.substring(0, relativeStart);
            this.trailingText = ll.text.substring(relativeStart + relativeLength);
        }
        else {
            this.trailingText = ll.text.substring(relativeStart + relativeLength);
        }
    };
    return EditWalker;
})(BaseLineIndexWalker);
var LineIndex = (function () {
    function LineIndex() {
        this.checkEdits = false;
    }
    LineIndex.prototype.charOffsetToLineNumberAndPos = function (charOffset) {
        return this.root.charOffsetToLineNumberAndPos(1, charOffset);
    };
    LineIndex.prototype.lineNumberToInfo = function (lineNumber) {
        var lineCount = this.root.lineCount();
        if (lineNumber <= lineCount) {
            var lineInfo = this.root.lineNumberToInfo(lineNumber, 0);
            lineInfo.line = lineNumber;
            return lineInfo;
        }
        else {
            return {
                line: lineNumber,
                col: this.root.charCount()
            };
        }
    };
    LineIndex.prototype.load = function (lines) {
        if (lines.length > 0) {
            var leaves = [];
            for (var i = 0, len = lines.length; i < len; i++) {
                leaves[i] = new LineLeaf(lines[i]);
            }
            this.root = LineIndex.buildTreeFromBottom(leaves);
        }
        else {
            this.root = new LineNode();
        }
    };
    LineIndex.prototype.walk = function (rangeStart, rangeLength, walkFns) {
        this.root.walk(rangeStart, rangeLength, walkFns);
    };
    LineIndex.prototype.getText = function (rangeStart, rangeLength) {
        var accum = "";
        if ((rangeLength > 0) && (rangeStart < this.root.charCount())) {
            this.walk(rangeStart, rangeLength, {
                goSubtree: true,
                done: false,
                leaf: function (relativeStart, relativeLength, ll) {
                    accum = accum.concat(ll.text.substring(relativeStart, relativeStart + relativeLength));
                }
            });
        }
        return accum;
    };
    LineIndex.prototype.every = function (f, rangeStart, rangeEnd) {
        if (!rangeEnd) {
            rangeEnd = this.root.charCount();
        }
        var walkFns = {
            goSubtree: true,
            done: false,
            leaf: function (relativeStart, relativeLength, ll) {
                if (!f(ll, relativeStart, relativeLength)) {
                    this.done = true;
                }
            }
        };
        this.walk(rangeStart, rangeEnd - rangeStart, walkFns);
        return !walkFns.done;
    };
    LineIndex.prototype.edit = function (pos, deleteLength, newText) {
        function editFlat(source, s, dl, nt) {
            if (nt === void 0) { nt = ""; }
            return source.substring(0, s) + nt + source.substring(s + dl, source.length);
        }
        if (this.root.charCount() == 0) {
            if (newText) {
                this.load(LineIndex.linesFromText(newText).lines);
                return this;
            }
        }
        else {
            if (this.checkEdits) {
                var checkText = editFlat(this.getText(0, this.root.charCount()), pos, deleteLength, newText);
            }
            var walker = new EditWalker();
            if (pos >= this.root.charCount()) {
                pos = this.root.charCount() - 1;
                var endString = this.getText(pos, 1);
                if (newText) {
                    newText = endString + newText;
                }
                else {
                    newText = endString;
                }
                deleteLength = 0;
                walker.suppressTrailingText = true;
            }
            else if (deleteLength > 0) {
                var e = pos + deleteLength;
                var lineInfo = this.charOffsetToLineNumberAndPos(e);
                if ((lineInfo && (lineInfo.col == 0))) {
                    deleteLength += lineInfo.text.length;
                    if (newText) {
                        newText = newText + lineInfo.text;
                    }
                    else {
                        newText = lineInfo.text;
                    }
                }
            }
            if (pos < this.root.charCount()) {
                this.root.walk(pos, deleteLength, walker);
                walker.insertLines(newText);
            }
            if (this.checkEdits) {
                var updatedText = this.getText(0, this.root.charCount());
            }
            return walker.lineIndex;
        }
    };
    LineIndex.buildTreeFromBottom = function (nodes) {
        var nodeCount = Math.ceil(nodes.length / lineCollectionCapacity);
        var interiorNodes = [];
        var nodeIndex = 0;
        for (var i = 0; i < nodeCount; i++) {
            interiorNodes[i] = new LineNode();
            var charCount = 0;
            var lineCount = 0;
            for (var j = 0; j < lineCollectionCapacity; j++) {
                if (nodeIndex < nodes.length) {
                    interiorNodes[i].add(nodes[nodeIndex]);
                    charCount += nodes[nodeIndex].charCount();
                    lineCount += nodes[nodeIndex].lineCount();
                }
                else {
                    break;
                }
                nodeIndex++;
            }
            interiorNodes[i].totalChars = charCount;
            interiorNodes[i].totalLines = lineCount;
        }
        if (interiorNodes.length == 1) {
            return interiorNodes[0];
        }
        else {
            return this.buildTreeFromBottom(interiorNodes);
        }
    };
    LineIndex.linesFromText = function (text) {
        var lineStarts = ts.computeLineStarts(text);
        if (lineStarts.length == 0) {
            return { lines: [], lineMap: lineStarts };
        }
        var lines = new Array(lineStarts.length);
        var lc = lineStarts.length - 1;
        for (var lmi = 0; lmi < lc; lmi++) {
            lines[lmi] = text.substring(lineStarts[lmi], lineStarts[lmi + 1]);
        }
        var endText = text.substring(lineStarts[lc]);
        if (endText.length > 0) {
            lines[lc] = endText;
        }
        else {
            lines.length--;
        }
        return { lines: lines, lineMap: lineStarts };
    };
    return LineIndex;
})();
exports.LineIndex = LineIndex;
var LineIndexSnapshot = (function () {
    function LineIndexSnapshot(version, cache) {
        this.version = version;
        this.cache = cache;
        this.changesSincePreviousVersion = [];
    }
    LineIndexSnapshot.prototype.getText = function (rangeStart, rangeEnd) {
        return this.index.getText(rangeStart, rangeEnd - rangeStart);
    };
    LineIndexSnapshot.prototype.getLength = function () {
        return this.index.root.charCount();
    };
    LineIndexSnapshot.prototype.getLineStartPositions = function () {
        var starts = [-1];
        var count = 1;
        var pos = 0;
        this.index.every(function (ll, s, len) {
            starts[count++] = pos;
            pos += ll.text.length;
            return true;
        }, 0);
        return starts;
    };
    LineIndexSnapshot.prototype.getLineMapper = function () {
        var _this = this;
        return (function (line) {
            return _this.index.lineNumberToInfo(line).col;
        });
    };
    LineIndexSnapshot.prototype.getTextChangeRangeSinceVersion = function (scriptVersion) {
        if (this.version <= scriptVersion) {
            return unchangedTextChangeRange;
        }
        else {
            return this.cache.getTextChangesBetweenVersions(scriptVersion, this.version);
        }
    };
    LineIndexSnapshot.prototype.getChangeRange = function (oldSnapshot) {
        var oldSnap = oldSnapshot;
        return this.getTextChangeRangeSinceVersion(oldSnap.version);
    };
    return LineIndexSnapshot;
})();
exports.LineIndexSnapshot = LineIndexSnapshot;
var TextChange = (function () {
    function TextChange(pos, deleteLen, insertedText) {
        this.pos = pos;
        this.deleteLen = deleteLen;
        this.insertedText = insertedText;
    }
    TextChange.prototype.getTextChangeRange = function () {
        return createTextChangeRange(createTextSpan(this.pos, this.deleteLen), this.insertedText ? this.insertedText.length : 0);
    };
    return TextChange;
})();
exports.TextChange = TextChange;
var ScriptVersionCache = (function () {
    function ScriptVersionCache() {
        this.changes = [];
        this.versions = [];
        this.minVersion = 0;
        this.currentVersion = 0;
    }
    ScriptVersionCache.prototype.edit = function (pos, deleteLen, insertedText) {
        this.changes[this.changes.length] = new TextChange(pos, deleteLen, insertedText);
        if ((this.changes.length > ScriptVersionCache.changeNumberThreshold) ||
            (deleteLen > ScriptVersionCache.changeLengthThreshold) ||
            (insertedText && (insertedText.length > ScriptVersionCache.changeLengthThreshold))) {
            this.getSnapshot();
        }
    };
    ScriptVersionCache.prototype.latest = function () {
        return this.versions[this.currentVersion];
    };
    ScriptVersionCache.prototype.latestVersion = function () {
        if (this.changes.length > 0) {
            this.getSnapshot();
        }
        return this.currentVersion;
    };
    ScriptVersionCache.prototype.reloadFromFile = function (filename, cb) {
        var content = sys.readFile(filename);
        this.reload(content);
        if (cb)
            cb();
    };
    ScriptVersionCache.prototype.reload = function (script) {
        this.currentVersion++;
        this.changes = [];
        var snap = new LineIndexSnapshot(this.currentVersion, this);
        this.versions[this.currentVersion] = snap;
        snap.index = new LineIndex();
        var lm = LineIndex.linesFromText(script);
        snap.index.load(lm.lines);
        for (var i = this.minVersion; i < this.currentVersion; i++) {
            this.versions[i] = undefined;
        }
        this.minVersion = this.currentVersion;
    };
    ScriptVersionCache.prototype.getSnapshot = function () {
        var snap = this.versions[this.currentVersion];
        if (this.changes.length > 0) {
            var snapIndex = this.latest().index;
            for (var i = 0, len = this.changes.length; i < len; i++) {
                var change = this.changes[i];
                snapIndex = snapIndex.edit(change.pos, change.deleteLen, change.insertedText);
            }
            snap = new LineIndexSnapshot(this.currentVersion + 1, this);
            snap.index = snapIndex;
            snap.changesSincePreviousVersion = this.changes;
            this.currentVersion = snap.version;
            this.versions[snap.version] = snap;
            this.changes = [];
            if ((this.currentVersion - this.minVersion) >= ScriptVersionCache.maxVersions) {
                var oldMin = this.minVersion;
                this.minVersion = (this.currentVersion - ScriptVersionCache.maxVersions) + 1;
                for (var j = oldMin; j < this.minVersion; j++) {
                    this.versions[j] = undefined;
                }
            }
        }
        return snap;
    };
    ScriptVersionCache.prototype.getTextChangesBetweenVersions = function (oldVersion, newVersion) {
        if (oldVersion < newVersion) {
            if (oldVersion >= this.minVersion) {
                var textChangeRanges = [];
                for (var i = oldVersion + 1; i <= newVersion; i++) {
                    var snap = this.versions[i];
                    for (var j = 0, len = snap.changesSincePreviousVersion.length; j < len; j++) {
                        var textChange = snap.changesSincePreviousVersion[j];
                        textChangeRanges[textChangeRanges.length] = textChange.getTextChangeRange();
                    }
                }
                return collapseTextChangeRangesAcrossMultipleVersions(textChangeRanges);
            }
            else {
                return undefined;
            }
        }
        else {
            return unchangedTextChangeRange;
        }
    };
    ScriptVersionCache.fromString = function (script) {
        var svc = new ScriptVersionCache();
        var snap = new LineIndexSnapshot(0, svc);
        snap.index = new LineIndex();
        var lm = LineIndex.linesFromText(script);
        snap.index.load(lm.lines);
        svc.versions[svc.currentVersion] = snap;
        return svc;
    };
    ScriptVersionCache.changeNumberThreshold = 8;
    ScriptVersionCache.changeLengthThreshold = 256;
    ScriptVersionCache.maxVersions = 8;
    return ScriptVersionCache;
})();
exports.ScriptVersionCache = ScriptVersionCache;
var ScriptInfo = (function () {
    function ScriptInfo(fileName, content, isOpen) {
        if (isOpen === void 0) { isOpen = false; }
        this.fileName = fileName;
        this.content = content;
        this.isOpen = isOpen;
        this.children = [];
        this.svc = ScriptVersionCache.fromString(content);
    }
    ScriptInfo.prototype.close = function () {
        this.isOpen = false;
    };
    ScriptInfo.prototype.open = function () {
        this.isOpen = true;
    };
    ScriptInfo.prototype.getIsOpen = function () {
        return this.isOpen;
    };
    ScriptInfo.prototype.addChild = function (childInfo) {
        this.children.push(childInfo);
    };
    ScriptInfo.prototype.snap = function () {
        return this.svc.getSnapshot();
    };
    ScriptInfo.prototype.getText = function () {
        var snap = this.snap();
        return snap.getText(0, snap.getLength());
    };
    ScriptInfo.prototype.getLineInfo = function (line) {
        var snap = this.snap();
        return snap.index.lineNumberToInfo(line);
    };
    ScriptInfo.prototype.editContent = function (start, end, newText) {
        this.svc.edit(start, end - start, newText);
    };
    ScriptInfo.prototype.getTextChangeRangeBetweenVersions = function (startVersion, endVersion) {
        return this.svc.getTextChangesBetweenVersions(startVersion, endVersion);
    };
    ScriptInfo.prototype.getChangeRange = function (oldSnapshot) {
        return this.snap().getChangeRange(oldSnapshot);
    };
    return ScriptInfo;
})();
exports.ScriptInfo = ScriptInfo;
var path = require('path');
var fs = require('fs');
exports.defaultLibFile = (path.join(path.dirname(require.resolve('typescript')), 'lib.d.ts')).split('\\').join('/');
var LanguageServiceHost = (function () {
    function LanguageServiceHost(config) {
        var _this = this;
        this.config = config;
        this.fileNameToScript = Object.create(null);
        this.addScript = function (fileName, content) {
            try {
                if (!content)
                    content = fs.readFileSync(fileName).toString();
            }
            catch (ex) {
                content = '';
            }
            var script = new ScriptInfo(fileName, content);
            _this.fileNameToScript[fileName] = script;
        };
        this.removeScript = function (fileName) {
            delete _this.fileNameToScript[fileName];
        };
        this.removeAll = function () {
            _this.fileNameToScript = Object.create(null);
        };
        this.updateScript = function (fileName, content) {
            var script = _this.fileNameToScript[fileName];
            if (script) {
                if (script.getText() == content) {
                    return;
                }
                script.editContent(0, script.snap().getLength(), content);
                return;
            }
            else {
                _this.addScript(fileName, content);
            }
        };
        this.editScript = function (fileName, minChar, limChar, newText) {
            var script = _this.fileNameToScript[fileName];
            if (script) {
                script.editContent(minChar, limChar, newText);
                return;
            }
            throw new Error('No script with name \'' + fileName + '\'');
        };
        this.setScriptIsOpen = function (fileName, isOpen) {
            var script = _this.fileNameToScript[fileName];
            if (script) {
                script.open();
                return;
            }
            throw new Error('No script with name \'' + fileName + '\'');
        };
        this.getScriptContent = function (fileName) {
            var script = _this.fileNameToScript[fileName];
            if (script) {
                return script.getText();
            }
            return null;
        };
        this.hasScript = function (fileName) {
            return !!_this.fileNameToScript[fileName];
        };
        this.getPositionFromIndex = function (fileName, index) {
            var result = _this.positionToLineCol(fileName, index);
            return { line: result.line - 1, ch: result.col - 1 };
        };
        this.getIndexFromPosition = function (fileName, position) {
            var newPos = { ch: position.ch + 1, line: position.line + 1 };
            return _this.lineColToPosition(fileName, newPos.line, newPos.ch);
        };
        this.getCompilationSettings = function () { return _this.config.project.compilerOptions; };
        this.getScriptFileNames = function () { return Object.keys(_this.fileNameToScript); };
        this.getScriptVersion = function (fileName) {
            var script = _this.fileNameToScript[fileName];
            if (script) {
                return script.svc.latestVersion().toString();
            }
            return '0';
        };
        this.getScriptIsOpen = function (fileName) {
            var script = _this.fileNameToScript[fileName];
            if (script) {
                return script.getIsOpen();
            }
            return false;
        };
        this.getScriptSnapshot = function (fileName) {
            var script = _this.fileNameToScript[fileName];
            if (script) {
                return script.snap();
            }
            return null;
        };
        this.getCurrentDirectory = function () {
            return _this.config.projectFileDirectory;
        };
        this.getDefaultLibFileName = function () {
            return 'lib.d.ts';
        };
        config.project.files.forEach(function (file) { return _this.addScript(file); });
        this.addScript(exports.defaultLibFile);
    }
    LanguageServiceHost.prototype.lineColToPosition = function (filename, line, col) {
        var script = this.fileNameToScript[filename];
        var index = script.snap().index;
        var lineInfo = index.lineNumberToInfo(line);
        return (lineInfo.col + col - 1);
    };
    LanguageServiceHost.prototype.positionToLineCol = function (filename, position) {
        var script = this.fileNameToScript[filename];
        var index = script.snap().index;
        var lineCol = index.charOffsetToLineNumberAndPos(position);
        return { line: lineCol.line, col: lineCol.col + 1 };
    };
    return LanguageServiceHost;
})();
exports.LanguageServiceHost = LanguageServiceHost;
//# sourceMappingURL=languageServiceHost.js.map