/** Utility function to print stack trace from whereever */
declare function stack();
declare module NodeJS {
    export interface Global {
        stack: any;
        ts: any;
    }
}

interface Error {
    details?: any; // Really useful to have for debugging
}

// escape-html
declare module 'escape-html' {
    function escape(html: string): string;
    export = escape;
}

declare module 'atom-space-pen-views' {
    import atom = require('atom');
    export class SelectListView extends atom.SelectListView { }
    export class ScrollView extends atom.ScrollView { }
    export class View extends atom.View { }
    export var $: JQueryStatic;
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

declare module AtomCore {
    export interface IEditor {
        element: any;
    }
}

declare module AtomCore {
    export interface IEditor {
        element: any;
    }
}
