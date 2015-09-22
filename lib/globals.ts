/// <reference path="./typings/tsd.d.ts"/>

// From brackets plugin
/// <reference path="./typings/bluebird.d.ts"/>
/// <reference path="./typings/codemirror.d.ts"/>
/// <reference path="./typings/brackets.d.ts"/>
/// <reference path="./typings/minimatch.d.ts"/>
/// <reference path="./typings/mustache.d.ts"/>

/// <reference path="../views/views.d.ts"/>
/// <reference path="./typings/atompromise.d.ts"/>

/** Utility function to print stack trace from whereever */
declare function stack();
declare module NodeJS {
    export interface Global {
        stack: any;
        ts: any;
    }
}

interface Function {
    name?: string; // exists for named function on node / atom / "good" browsers ;)
}

interface Error {
    details?: any; // Really useful to have for debugging
}

// escape-html
declare module 'escape-html' {
    function escape(html: string): string;
    export = escape;
}

// courtesy @blakeembrey
declare module 'strip-bom' {
    import Buffer = require('buffer')

    function stripBom(value: string): string
    function stripBom(value: Buffer): Buffer

    export = stripBom
}

declare module 'atom-space-pen-views' {
    import atom = require('atom');
    export class SelectListView extends atom.SelectListView { }
    export class ScrollView extends atom.ScrollView { }
    export class View extends atom.View { }
    export var $: JQueryStatic;
}

declare module 'basarat-text-buffer' {
    var ctor: {
        new (content: string): TextBuffer.ITextBuffer;
    };
    export = ctor;
}

interface EmitOutput {
    sourceFileName: string;
    outputFiles: string[];
    success: boolean;
    errors: CodeError[];
    emitError: boolean;
}

interface BuildOutput {
    outputs: EmitOutput[];
    counts: {
        inputFiles: number;
        outputFiles: number;
        errors: number;
        emitErrors: number;
    }
}

interface BuildUpdate {
    builtCount: number;
    totalCount: number;
    errorCount: number;
    firstError: boolean;
    filePath: string;
    errorsInFile: CodeError[];
}

interface CodeError {
    filePath: string;
    startPos: EditorPosition;
    endPos: EditorPosition;
    message: string;
    preview: string;
}

interface EditorPosition {
    line: number;
    col: number;
}

interface CodeEdit {
    start: EditorPosition;
    end: EditorPosition;
    newText: string;
}

/** Interfaces used by GotoHistory feature */
interface GotoPosition {
    filePath: string;
    line: number;
    col: number;
}
interface TabWithGotoPositions {
    lastPosition?: GotoPosition;
    members: GotoPosition[];
}

/** Interfaces needed for file symbols view */
interface NavigationBarItem {
    text: string;
    kind: string;
    kindModifiers: string;
    position: EditorPosition;
    indent: number;
    bolded: boolean;
    grayed: boolean;
}
/** for project symbols view */
interface NavigateToItem {
    name: string;
    kind: string;
    filePath: string;
    position: EditorPosition;
    fileName: string;
}

/**
 * used by semantic view
 */
interface SemanticTreeNode {
    text: string;
    kind: string;
    kindModifiers: string;
    start: EditorPosition;
    end: EditorPosition;
    subNodes: SemanticTreeNode[];
}

interface ReferenceDetails {
    filePath: string;
    position: EditorPosition
    preview: string;
}

/** Used by AST display */
interface NodeDisplay {
    kind: string;
    children: NodeDisplay[];

    pos: number;
    end: number;

    /** Represents how many parents it has */
    depth: number;
    /** If we had a flat structure this is where this item would belong */
    nodeIndex: number;

    /** Key Details I understand */
    details?: any;

    /** Best attempt serialization of original node
    * I also remove `parent`
    */
    rawJson: any;
}

/** Used by Dependency display */
interface FileDependency {
    sourcePath: string;
    targetPath: string;
}

/** Provided by the atom team */
interface String {
    startsWith(str: string): boolean;
    endsWith(str: string): boolean;
}
