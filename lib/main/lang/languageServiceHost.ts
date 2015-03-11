import ts = require('typescript');

module debug{
    export function stack(){
        console.error((<any>(new Error())).stack);
    }
}

// For additional fixes we needed to do, look for
// atom

////////////////// STUFF FROM TS NOT EXPORTED
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

// Map stuff
var hasOwnProperty = Object.prototype.hasOwnProperty;
function hasProperty(map, key) {
    return hasOwnProperty.call(map, key);
}
function lookUp(map, key) {
    return hasProperty(map, key) ? map[key] : undefined;
}
////////////////// END STUFF FROM TS

////////////////// STUFF FROM SYS
import _fs = require('fs');
module sys{
    export function readFile(fileName) {
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
    export function writeFile(fileName, data, writeByteOrderMark) {
        if (writeByteOrderMark) {
            data = '\uFEFF' + data;
        }
        _fs.writeFileSync(fileName, data, "utf8");
    }
}
/////////////////  END STUFF FROM SYS

class LineLeaf implements LineCollection {
    udata: any;

    constructor(public text: string) {

    }

    setUdata(data: any) {
        this.udata = data;
    }

    getUdata() {
        return this.udata;
    }

    isLeaf() {
        return true;
    }

    walk(rangeStart: number, rangeLength: number, walkFns: ILineIndexWalker) {
        walkFns.leaf(rangeStart, rangeLength, this);
    }

    charCount() {
        return this.text.length;
    }

    lineCount() {
        return 1;
    }
}

enum CharRangeSection {
    PreStart,
    Start,
    Entire,
    Mid,
    End,
    PostEnd
}

interface ILineIndexWalker {
    goSubtree: boolean;
    done: boolean;
    leaf(relativeStart: number, relativeLength: number, lineCollection: LineLeaf): void;
    pre? (relativeStart: number, relativeLength: number, lineCollection: LineCollection,
        parent: LineNode, nodeType: CharRangeSection): LineCollection;
    post? (relativeStart: number, relativeLength: number, lineCollection: LineCollection,
        parent: LineNode, nodeType: CharRangeSection): LineCollection;
}

interface LineCollection {
    charCount(): number;
    lineCount(): number;
    isLeaf(): boolean;
    walk(rangeStart: number, rangeLength: number, walkFns: ILineIndexWalker): void;
}

export interface ILineInfo {
    line: number;
    col: number;
    text?: string;
    leaf?: LineLeaf;
}

var lineCollectionCapacity = 4;

export class LineNode implements LineCollection {
    totalChars = 0;
    totalLines = 0;
    children: LineCollection[] = [];

    isLeaf() {
        return false;
    }

    updateCounts() {
        this.totalChars = 0;
        this.totalLines = 0;
        for (var i = 0, len = this.children.length; i < len; i++) {
            var child = this.children[i];
            this.totalChars += child.charCount();
            this.totalLines += child.lineCount();
        }
    }

    execWalk(rangeStart: number, rangeLength: number, walkFns: ILineIndexWalker, childIndex: number, nodeType: CharRangeSection) {
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
    }

    skipChild(relativeStart: number, relativeLength: number, childIndex: number, walkFns: ILineIndexWalker, nodeType: CharRangeSection) {
        if (walkFns.pre && (!walkFns.done)) {
            walkFns.pre(relativeStart, relativeLength, this.children[childIndex], this, nodeType);
            walkFns.goSubtree = true;
        }
    }

    walk(rangeStart: number, rangeLength: number, walkFns: ILineIndexWalker) {
        // assume (rangeStart < this.totalChars) && (rangeLength <= this.totalChars)
        var childIndex = 0;
        var child = this.children[0];
        var childCharCount = child.charCount();
        // find sub-tree containing start
        var adjustedStart = rangeStart;
        while (adjustedStart >= childCharCount) {
            this.skipChild(adjustedStart, rangeLength, childIndex, walkFns, CharRangeSection.PreStart);
            adjustedStart -= childCharCount;
            child = this.children[++childIndex];
            childCharCount = child.charCount();
        }
        // Case I: both start and end of range in same subtree
        if ((adjustedStart + rangeLength) <= childCharCount) {
            if (this.execWalk(adjustedStart, rangeLength, walkFns, childIndex, CharRangeSection.Entire)) {
                return;
            }
        }
        else {
            // Case II: start and end of range in different subtrees (possibly with subtrees in the middle)
            if (this.execWalk(adjustedStart, childCharCount - adjustedStart, walkFns, childIndex, CharRangeSection.Start)) {
                return;
            }
            var adjustedLength = rangeLength - (childCharCount - adjustedStart);
            child = this.children[++childIndex];
            childCharCount = child.charCount();
            while (adjustedLength > childCharCount) {
                if (this.execWalk(0, childCharCount, walkFns, childIndex, CharRangeSection.Mid)) {
                    return;
                }
                adjustedLength -= childCharCount;
                child = this.children[++childIndex];
                childCharCount = child.charCount();
            }
            if (adjustedLength > 0) {
                if (this.execWalk(0, adjustedLength, walkFns, childIndex, CharRangeSection.End)) {
                    return;
                }
            }
        }
        // Process any subtrees after the one containing range end
        if (walkFns.pre) {
            var clen = this.children.length;
            if (childIndex < (clen - 1)) {
                for (var ej = childIndex + 1; ej < clen; ej++) {
                    this.skipChild(0, 0, ej, walkFns, CharRangeSection.PostEnd);
                }
            }
        }
    }

    charOffsetToLineNumberAndPos(lineNumber: number, charOffset: number): ILineInfo {
        var childInfo = this.childFromCharOffset(lineNumber, charOffset);
        if (!childInfo.child) {
            return {
                line: lineNumber,
                col: charOffset,
            }
        }
        else if (childInfo.childIndex < this.children.length) {
            if (childInfo.child.isLeaf()) {
                return {
                    line: childInfo.lineNumber,
                    col: childInfo.charOffset,
                    text: (<LineLeaf>(childInfo.child)).text,
                    leaf: (<LineLeaf>(childInfo.child))
                };
            }
            else {
                var lineNode = <LineNode>(childInfo.child);
                return lineNode.charOffsetToLineNumberAndPos(childInfo.lineNumber, childInfo.charOffset);
            }
        }
        else {
            var lineInfo = this.lineNumberToInfo(this.lineCount(), 0);
            return { line: this.lineCount(), col: lineInfo.leaf.charCount() };
        }
    }

    lineNumberToInfo(lineNumber: number, charOffset: number): ILineInfo {
        var childInfo = this.childFromLineNumber(lineNumber, charOffset);
        if (!childInfo.child) {
            return {
                line: lineNumber,
                col: charOffset
            }
        }
        else if (childInfo.child.isLeaf()) {
            return {
                line: lineNumber,
                col: childInfo.charOffset,
                text: (<LineLeaf>(childInfo.child)).text,
                leaf: (<LineLeaf>(childInfo.child))
            }
        }
        else {
            var lineNode = <LineNode>(childInfo.child);
            return lineNode.lineNumberToInfo(childInfo.relativeLineNumber, childInfo.charOffset);
        }
    }

    childFromLineNumber(lineNumber: number, charOffset: number) {
        var child: LineCollection;
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
    }

    childFromCharOffset(lineNumber: number, charOffset: number) {
        var child: LineCollection;
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
        }
    }

    splitAfter(childIndex: number) {
        var splitNode: LineNode;
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
    }

    remove(child: LineCollection) {
        var childIndex = this.findChildIndex(child);
        var clen = this.children.length;
        if (childIndex < (clen - 1)) {
            for (var i = childIndex; i < (clen - 1); i++) {
                this.children[i] = this.children[i + 1];
            }
        }
        this.children.length--;
    }

    findChildIndex(child: LineCollection) {
        var childIndex = 0;
        var clen = this.children.length;
        while ((this.children[childIndex] != child) && (childIndex < clen)) childIndex++;
        return childIndex;
    }

    insertAt(child: LineCollection, nodes: LineCollection[]) {
        var childIndex = this.findChildIndex(child);
        var clen = this.children.length;
        var nodeCount = nodes.length;
        // if child is last and there is more room and only one node to place, place it
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
            var splitNodes: LineNode[] = [];
            var splitNodeCount = 0;
            if (nodeIndex < nodeCount) {
                splitNodeCount = Math.ceil((nodeCount - nodeIndex) / lineCollectionCapacity);
                splitNodes = <LineNode[]>new Array(splitNodeCount);
                var splitNodeIndex = 0;
                for (var i = 0; i < splitNodeCount; i++) {
                    splitNodes[i] = new LineNode();
                }
                var splitNode = <LineNode>splitNodes[0];
                while (nodeIndex < nodeCount) {
                    splitNode.add(nodes[nodeIndex++]);
                    if (splitNode.children.length == lineCollectionCapacity) {
                        splitNodeIndex++;
                        splitNode = <LineNode>splitNodes[splitNodeIndex];
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
                (<LineNode>splitNodes[i]).updateCounts();
            }
            return splitNodes;
        }
    }

    // assume there is room for the item; return true if more room
    add(collection: LineCollection) {
        this.children[this.children.length] = collection;
        return (this.children.length < lineCollectionCapacity);
    }

    charCount() {
        return this.totalChars;
    }

    lineCount() {
        return this.totalLines;
    }
}

class BaseLineIndexWalker implements ILineIndexWalker {
    goSubtree = true;
    done = false;
    leaf(rangeStart: number, rangeLength: number, ll: LineLeaf) {
    }
}

class EditWalker extends BaseLineIndexWalker {
    lineIndex = new LineIndex();
    // path to start of range
    startPath: LineCollection[];
    endBranch: LineCollection[] = [];
    branchNode: LineNode;
    // path to current node
    stack: LineNode[];
    state = CharRangeSection.Entire;
    lineCollectionAtBranch: LineCollection;
    initialText = "";
    trailingText = "";
    suppressTrailingText = false;

    constructor() {
        super();
        this.lineIndex.root = new LineNode();
        this.startPath = [this.lineIndex.root];
        this.stack = [this.lineIndex.root];
    }

    insertLines(insertedText: string) {
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
        var branchParent: LineNode;
        var lastZeroCount: LineCollection;

        for (var k = this.endBranch.length - 1; k >= 0; k--) {
            (<LineNode>this.endBranch[k]).updateCounts();
            if (this.endBranch[k].charCount() == 0) {
                lastZeroCount = this.endBranch[k];
                if (k > 0) {
                    branchParent = <LineNode>this.endBranch[k - 1];
                }
                else {
                    branchParent = this.branchNode;
                }
            }
        }
        if (lastZeroCount) {
            branchParent.remove(lastZeroCount);
        }

        // path at least length two (root and leaf)
        var insertionNode = <LineNode>this.startPath[this.startPath.length - 2];
        var leafNode = <LineLeaf>this.startPath[this.startPath.length - 1];
        var len = lines.length;

        if (len > 0) {
            leafNode.text = lines[0];

            if (len > 1) {
                var insertedNodes = <LineCollection[]>new Array(len - 1);
                var startNode = <LineCollection>leafNode;
                for (var i = 1, len = lines.length; i < len; i++) {
                    insertedNodes[i - 1] = new LineLeaf(lines[i]);
                }
                var pathIndex = this.startPath.length - 2;
                while (pathIndex >= 0) {
                    insertionNode = <LineNode>this.startPath[pathIndex];
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
                    (<LineNode>this.startPath[j]).updateCounts();
                }
            }
        }
        else {
            // no content for leaf node, so delete it
            insertionNode.remove(leafNode);
            for (var j = this.startPath.length - 2; j >= 0; j--) {
                (<LineNode>this.startPath[j]).updateCounts();
            }
        }

        return this.lineIndex;
    }

    post(relativeStart: number, relativeLength: number, lineCollection: LineCollection, parent: LineCollection, nodeType: CharRangeSection): LineCollection {
        // have visited the path for start of range, now looking for end
        // if range is on single line, we will never make this state transition
        if (lineCollection == this.lineCollectionAtBranch) {
            this.state = CharRangeSection.End;
        }
        // always pop stack because post only called when child has been visited
        this.stack.length--;
        return undefined;
    }

    pre(relativeStart: number, relativeLength: number, lineCollection: LineCollection, parent: LineCollection, nodeType: CharRangeSection) {
        // currentNode corresponds to parent, but in the new tree
        var currentNode = this.stack[this.stack.length - 1];

        if ((this.state == CharRangeSection.Entire) && (nodeType == CharRangeSection.Start)) {
            // if range is on single line, we will never make this state transition
            this.state = CharRangeSection.Start;
            this.branchNode = currentNode;
            this.lineCollectionAtBranch = lineCollection;
        }

        var child: LineCollection;
        function fresh(node: LineCollection): LineCollection {
            if (node.isLeaf()) {
                return new LineLeaf("");
            }
            else return new LineNode();
        }
        switch (nodeType) {
            case CharRangeSection.PreStart:
                this.goSubtree = false;
                if (this.state != CharRangeSection.End) {
                    currentNode.add(lineCollection);
                }
                break;
            case CharRangeSection.Start:
                if (this.state == CharRangeSection.End) {
                    this.goSubtree = false;
                }
                else {
                    child = fresh(lineCollection);
                    currentNode.add(child);
                    this.startPath[this.startPath.length] = child;
                }
                break;
            case CharRangeSection.Entire:
                if (this.state != CharRangeSection.End) {
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
            case CharRangeSection.Mid:
                this.goSubtree = false;
                break;
            case CharRangeSection.End:
                if (this.state != CharRangeSection.End) {
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
            case CharRangeSection.PostEnd:
                this.goSubtree = false;
                if (this.state != CharRangeSection.Start) {
                    currentNode.add(lineCollection);
                }
                break;
        }
        if (this.goSubtree) {
            this.stack[this.stack.length] = <LineNode>child;
        }
        return lineCollection;
    }
    // just gather text from the leaves
    leaf(relativeStart: number, relativeLength: number, ll: LineLeaf) {
        if (this.state == CharRangeSection.Start) {
            this.initialText = ll.text.substring(0, relativeStart);
        }
        else if (this.state == CharRangeSection.Entire) {
            this.initialText = ll.text.substring(0, relativeStart);
            this.trailingText = ll.text.substring(relativeStart + relativeLength);
        }
        else {
            // state is CharRangeSection.End
            this.trailingText = ll.text.substring(relativeStart + relativeLength);
        }
    }
}

export class LineIndex {
    root: LineNode;
    // set this to true to check each edit for accuracy
    checkEdits = false;

    charOffsetToLineNumberAndPos(charOffset: number) {
        return this.root.charOffsetToLineNumberAndPos(1, charOffset);
    }

    lineNumberToInfo(lineNumber: number): ILineInfo {
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
            }
        }
    }

    load(lines: string[]) {
        if (lines.length > 0) {
            var leaves: LineLeaf[] = [];
            for (var i = 0, len = lines.length; i < len; i++) {
                leaves[i] = new LineLeaf(lines[i]);
            }
            this.root = LineIndex.buildTreeFromBottom(leaves);
        }
        else {
            this.root = new LineNode();
        }
    }

    walk(rangeStart: number, rangeLength: number, walkFns: ILineIndexWalker) {
        this.root.walk(rangeStart, rangeLength, walkFns);
    }

    getText(rangeStart: number, rangeLength: number) {
        var accum = "";
        if ((rangeLength > 0) && (rangeStart < this.root.charCount())) {
            this.walk(rangeStart, rangeLength, {
                goSubtree: true,
                done: false,
                leaf: (relativeStart: number, relativeLength: number, ll: LineLeaf) => {
                    accum = accum.concat(ll.text.substring(relativeStart, relativeStart + relativeLength));
                }
            });
        }
        return accum;
    }

    every(f: (ll: LineLeaf, s: number, len: number) => boolean, rangeStart: number, rangeEnd?: number) {
        if (!rangeEnd) {
            rangeEnd = this.root.charCount();
        }
        var walkFns = {
            goSubtree: true,
            done: false,
            leaf: function (relativeStart: number, relativeLength: number, ll: LineLeaf) {
                if (!f(ll, relativeStart, relativeLength)) {
                    this.done = true;
                }
            }
        }
        this.walk(rangeStart, rangeEnd - rangeStart, walkFns);
        return !walkFns.done;
    }

    edit(pos: number, deleteLength: number, newText?: string) {
        function editFlat(source: string, s: number, dl: number, nt = "") {
            return source.substring(0, s) + nt + source.substring(s + dl, source.length);
        }
        if (this.root.charCount() == 0) {
            // TODO: assert deleteLength == 0
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
                // insert at end
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
                // check whether last characters deleted are line break
                var e = pos + deleteLength;
                var lineInfo = this.charOffsetToLineNumberAndPos(e);
                if ((lineInfo && (lineInfo.col == 0))) {
                    // move range end just past line that will merge with previous line
                    deleteLength += lineInfo.text.length;
                    // store text by appending to end of insertedText
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
    }

    static buildTreeFromBottom(nodes: LineCollection[]): LineNode {
        var nodeCount = Math.ceil(nodes.length / lineCollectionCapacity);
        var interiorNodes: LineNode[] = [];
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
    }

    static linesFromText(text: string) {
        var lineStarts = ts.computeLineStarts(text);

        if (lineStarts.length == 0) {
            return { lines: <string[]>[], lineMap: lineStarts };
        }
        var lines = <string[]>new Array(lineStarts.length);
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
    }
}

export class LineIndexSnapshot implements ts.IScriptSnapshot {
    index: LineIndex;
    changesSincePreviousVersion: TextChange[] = [];

    constructor(public version: number, public cache: ScriptVersionCache) {
    }

    getText(rangeStart: number, rangeEnd: number) {
        return this.index.getText(rangeStart, rangeEnd - rangeStart);
    }

    getLength() {
        return this.index.root.charCount();
    }

    // this requires linear space so don't hold on to these
    getLineStartPositions(): number[] {
        var starts: number[] = [-1];
        var count = 1;
        var pos = 0;
        this.index.every((ll, s, len) => {
            starts[count++] = pos;
            pos += ll.text.length;
            return true;
        }, 0);
        return starts;
    }

    getLineMapper() {
        return ((line: number) => {
            return this.index.lineNumberToInfo(line).col;
        });
    }

    getTextChangeRangeSinceVersion(scriptVersion: number) {
        if (this.version <= scriptVersion) {
            return unchangedTextChangeRange;
        }
        else {
            return this.cache.getTextChangesBetweenVersions(scriptVersion, this.version);
        }
    }
    getChangeRange(oldSnapshot: ts.IScriptSnapshot): ts.TextChangeRange {
        var oldSnap = <LineIndexSnapshot>oldSnapshot;
        return this.getTextChangeRangeSinceVersion(oldSnap.version);
    }
}

export class TextChange {
    constructor(public pos: number, public deleteLen: number, public insertedText?: string) {
    }

    getTextChangeRange() {
        return createTextChangeRange(createTextSpan(this.pos, this.deleteLen),
            this.insertedText ? this.insertedText.length : 0);
    }
}

export class ScriptVersionCache {
    changes: TextChange[] = [];
    versions: LineIndexSnapshot[] = [];
    minVersion = 0;  // no versions earlier than min version will maintain change history
    private currentVersion = 0;

    static changeNumberThreshold = 8;
    static changeLengthThreshold = 256;
    static maxVersions = 8;

    // REVIEW: can optimize by coalescing simple edits
    edit(pos: number, deleteLen: number, insertedText?: string) {
        this.changes[this.changes.length] = new TextChange(pos, deleteLen, insertedText);
        if ((this.changes.length > ScriptVersionCache.changeNumberThreshold) ||
            (deleteLen > ScriptVersionCache.changeLengthThreshold) ||
            (insertedText && (insertedText.length > ScriptVersionCache.changeLengthThreshold))) {
            this.getSnapshot();
        }
    }

    latest() {
        return this.versions[this.currentVersion];
    }

    latestVersion() {
        if (this.changes.length > 0) {
            this.getSnapshot();
        }
        return this.currentVersion;
    }

    reloadFromFile(filename: string, cb?: () => any) {
        var content = sys.readFile(filename);
        this.reload(content);
        if (cb)
            cb();
    }

    // reload whole script, leaving no change history behind reload
    reload(script: string) {
        this.currentVersion++;
        this.changes = []; // history wiped out by reload
        var snap = new LineIndexSnapshot(this.currentVersion, this);
        this.versions[this.currentVersion] = snap;
        snap.index = new LineIndex();
        var lm = LineIndex.linesFromText(script);
        snap.index.load(lm.lines);
        // REVIEW: could use linked list
        for (var i = this.minVersion; i < this.currentVersion; i++) {
            this.versions[i] = undefined;
        }
        this.minVersion = this.currentVersion;

    }

    getSnapshot() {
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
    }

    getTextChangesBetweenVersions(oldVersion: number, newVersion: number) {
        if (oldVersion < newVersion) {
            if (oldVersion >= this.minVersion) {
                var textChangeRanges: ts.TextChangeRange[] = [];
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
    }

    static fromString(script: string) {
        var svc = new ScriptVersionCache();
        var snap = new LineIndexSnapshot(0, svc);
        snap.index = new LineIndex();
        var lm = LineIndex.linesFromText(script);
        snap.index.load(lm.lines);
        svc.versions[svc.currentVersion] = snap;
        return svc;
    }
}

export class ScriptInfo {
    svc: ScriptVersionCache;
    children: ScriptInfo[] = [];     // files referenced by this file

    constructor(public fileName: string, public content: string, public isOpen = false) {
        this.svc = ScriptVersionCache.fromString(content);
    }

    close() {
        this.isOpen = false;
    }

    open() {
        this.isOpen = true;
    }

    getIsOpen() {
        return this.isOpen;
    }

    addChild(childInfo: ScriptInfo) {
        this.children.push(childInfo);
    }

    snap() {
        return this.svc.getSnapshot();
    }

    getText() {
        var snap = this.snap();
        return snap.getText(0, snap.getLength());
    }

    getLineInfo(line: number) {
        var snap = this.snap();
        return snap.index.lineNumberToInfo(line);
    }

    editContent(start: number, end: number, newText: string): void {
        this.svc.edit(start, end - start, newText);
    }

    getTextChangeRangeBetweenVersions(startVersion: number, endVersion: number): ts.TextChangeRange {
        return this.svc.getTextChangesBetweenVersions(startVersion, endVersion);
    }

    getChangeRange(oldSnapshot: ts.IScriptSnapshot): ts.TextChangeRange {
        return this.snap().getChangeRange(oldSnapshot);
    }
}

//////////////////////////////////////////// ACTUAL STUFF WE CARE ABOUT

// Note: All the magic code is really behind the ScripInfo class

import tsconfig = require('../tsconfig/tsconfig');
import path = require('path');
import fs = require('fs');

export interface Position {
    line: number;
    ch: number;
}

/**
 * This is the only class I really brought in. Everything else came from the dependency tree of this one class.
 */
export class LanguageServiceHost implements ts.LanguageServiceHost {
    /**
     * a map associating file absolute path to ScriptInfo
     */
    fileNameToScript: { [fileName: string]: ScriptInfo } = Object.create(null);

    constructor(private config: tsconfig.TypeScriptProjectFileDetails) {
        // Add all the files
        config.project.files.forEach((file) => this.addScript(file));

        // Also add the `lib.d.ts`
        var libFile = (path.join(path.dirname(require.resolve('typescript')), 'lib.d.ts'));
        this.addScript(libFile);
    }

    addScript = (fileName: string, content?: string) => {
        try {
            if (!content)
                content = fs.readFileSync(fileName).toString();
        }
        catch (ex) { // if we cannot read the file for whatever reason
            // TODO: in next version of TypeScript langauge service we would add it with "undefined"
            // For now its just an empty string
            content = '';
        }
        var script = new ScriptInfo(fileName, content);
        this.fileNameToScript[fileName] = script;
    }

    removeScript = (fileName: string) => {
        delete this.fileNameToScript[fileName];
    }

    removeAll = () => {
        this.fileNameToScript = Object.create(null);
    }

    updateScript = (fileName: string, content: string) => {
        var script = this.fileNameToScript[fileName];
        if (script) {

            // BAD THINGS HAPPEN IF YOU DON'T DO THIS
            if (script.getText() == content) {
                return;
            }
            
            script.editContent(0, script.snap().getLength(), content);
            return;
        }
        else {
            this.addScript(fileName, content);
        }
    }

    editScript = (fileName: string, minChar: number, limChar: number, newText: string) => {
        var script = this.fileNameToScript[fileName];
        if (script) {
            script.editContent(minChar, limChar, newText);
            return;
        }

        throw new Error('No script with name \'' + fileName + '\'');
    }

    setScriptIsOpen = (fileName: string, isOpen: boolean) => {
        var script = this.fileNameToScript[fileName];
        if (script) {
            script.open();
            return;
        }

        throw new Error('No script with name \'' + fileName + '\'');
    }

    getScriptContent = (fileName: string): string => {
        var script = this.fileNameToScript[fileName];
        if (script) {
            return script.getText();
        }
        return null;
    }

    hasScript = (fileName: string) => {
        return !!this.fileNameToScript[fileName];
    }

    /**
     * @param line 1 based index
     * @param col 1 based index
     */
    lineColToPosition(filename: string, line: number, col: number): number {
        var script: ScriptInfo = this.fileNameToScript[filename];
        var index = script.snap().index;

        var lineInfo = index.lineNumberToInfo(line);
        // TODO: assert this column is actually on the line
        return (lineInfo.col + col - 1);
    }

    /**
     * @param line 1-based index
     * @param col 1-based index
     */
    positionToLineCol(filename: string, position: number): ILineInfo {
        var script: ScriptInfo = this.fileNameToScript[filename];
        var index = script.snap().index;
        var lineCol = index.charOffsetToLineNumberAndPos(position);
        return { line: lineCol.line, col: lineCol.col + 1 };
    }

    /** 0 based */
    getPositionFromIndex = (fileName: string, index: number): { ch: number; line: number } => {
        var result = this.positionToLineCol(fileName, index);
        return { line: result.line - 1, ch: result.col - 1 };
    }

    /** 0 based */
    getIndexFromPosition = (fileName: string, position: { ch: number; line: number }): number => {
        var newPos = {ch:position.ch+1,line:position.line+1}
        return this.lineColToPosition(fileName, newPos.line, newPos.ch);
    }

    ////////////////////////////////////////
    // ts.LanguageServiceHost implementation
    ////////////////////////////////////////

    getCompilationSettings = () => this.config.project.compilerOptions;
    getScriptFileNames = (): string[]=> Object.keys(this.fileNameToScript);
    getScriptVersion = (fileName: string): string => {
        var script = this.fileNameToScript[fileName];
        if (script) {
            return script.svc.latestVersion().toString();
        }
        return '0';
    }
    getScriptIsOpen = (fileName: string): boolean => {
        var script = this.fileNameToScript[fileName];
        if (script) {
            return script.getIsOpen();
        }
        return false;
    }
    getScriptSnapshot = (fileName: string): ts.IScriptSnapshot  => {
        var script = this.fileNameToScript[fileName];
        if (script) {
            return script.snap();
        }
        return null;
    }
    getCurrentDirectory = (): string  => {
        return this.config.projectFileDirectory;
    }
    getDefaultLibFileName = (): string => {
        return 'lib.d.ts'; // TODO: this.config.project.compilerOptions.target === ts.ScriptTarget.ES6 ? "lib.es6.d.ts" : "lib.d.ts";
    }
}
