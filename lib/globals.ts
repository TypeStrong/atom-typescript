/// <reference path="./typings/tsd.d.ts"/>
/// <reference path="../node_modules/typescript/bin/typescript.d.ts"/>

// From brackets plugin
/// <reference path="./typings/bluebird.d.ts"/>
/// <reference path="./typings/codemirror.d.ts"/>
/// <reference path="./typings/brackets.d.ts"/>
/// <reference path="./typings/minimatch.d.ts"/>
/// <reference path="./typings/mustache.d.ts"/>

/// <reference path="../views/views.d.ts"/>
/// <reference path="./typings/atompromise.d.ts"/>

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


declare module 'atom-space-pen-views' {
    import atom = require('atom');
    export class SelectListView extends atom.SelectListView { }
}

/** https://github.com/paulmillr/chokidar */
declare module 'chokidar' {
    export interface Watcher {
        on: (event: string, callback: (path: string) => any) => any;
    }

    export function watch(path, options?: any): Watcher;
}

declare module 'basarat-text-buffer' {
    var options;
    export = options;
}


interface EmitOutput {
    outputFiles: string[];
    success: boolean;
    errors: TSError[];
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
    errorsInFile: TSError[];
}

interface TSError {
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
