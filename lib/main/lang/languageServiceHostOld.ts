/**
 * THIS FILE IS NO LONGER USED. 
 * This is kept as a reference implementation for a simpler language service shot + ScriptInfo
 */

//   Copyright 2013-2014 François de Campredon
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.

///ts:ref=atom.d
/// <reference path="../../typings/atom/atom.d.ts"/> ///ts:ref:generated

'use strict';

import ts = require('typescript');
import path = require('path');
import utils = require('./utils');
import fs = require('fs');

import tsconfig = require('../tsconfig/tsconfig');

export interface Position {
    line: number;
    ch: number;
}

interface ScriptInfo {
    getFileName(): string;
    getContent(): string;
    getVersion(): number;
    getIsOpen(): boolean;
    setIsOpen(val: boolean): void;
    getEditRanges(): ts.TextChangeRange[];
    getLineStarts(): number[];


    updateContent(newContent: string): void;
    editContent(minChar: number, limChar: number, newText: string): void;
    getPositionFromLine(line: number, ch: number): number;
    getLineAndColForPositon(position: number): Position;
}
interface ITextBuffer extends TextBuffer.ITextBuffer{}

/**
 * Manage a script in the language service host
 */
function createScriptInfo(fileName: string, content: string, isOpen = false): ScriptInfo {


    var version: number = 1;
    var editRanges: ts.TextChangeRange[] = [];

    var _lineStarts: number[];
    var _lineStartIsDirty = true;

    function getLineStarts() {
        if (_lineStartIsDirty) {
            // TODO: pref
            _lineStarts = ts.computeLineStarts(content);
            _lineStartIsDirty = false;
        }
        return _lineStarts;
    }

    /**
     * update the content of the script
     *
     * @param newContent the new script content
     */
    function updateContent(newContent: string): void {
        content = newContent;
        _lineStartIsDirty = true;
        editRanges = [];
        version++;
    }


    /**
     * edit the script content
     *
     * @param minChar the index in the file content where the edition begins
     * @param limChar the index  in the file content where the edition ends
     * @param newText the text inserted
     */
    function editContent(minChar: number, limChar: number, newText: string): void {
        // Apply edits
        var prefix = content.substring(0, minChar);
        var middle = newText;
        var suffix = content.substring(limChar);
        content = prefix + middle + suffix;
        _lineStartIsDirty = true;


        // Store edit range + new length of script
        editRanges.push({
            span: { start: minChar, length: limChar - minChar },
            newLength: newText.length
        });

        // Update version #
        version++;
    }



    /**
     * return an index position from line an character position
     *
     * @param line line number
     * @param character charecter poisiton in the line
     */
    function getPositionFromLine(line: number, ch: number) {
        return getLineStarts()[line] + ch;
    }

    /**
     * return line and chararacter position from index position
     *
     * @param position
     */
    function getLineAndColForPositon(position: number) {
        if (position < 0 || position > content.length) {
            throw new RangeError('Argument out of range: position');
        }
        var lineStarts = getLineStarts();
        var lineNumber = utils.binarySearch(lineStarts, position);
        if (lineNumber < 0) {
            lineNumber = (~lineNumber) - 1;
        }
        return {
            line: lineNumber,
            ch: position - lineStarts[lineNumber]
        };
    }




    return {
        getFileName: () => fileName,
        getContent: () => content,
        getVersion: () => version,
        getIsOpen: () => isOpen,
        setIsOpen: val => isOpen = val,
        getEditRanges: () => editRanges,
        getLineStarts: getLineStarts,

        updateContent: updateContent,
        editContent: editContent,
        getPositionFromLine: getPositionFromLine,
        getLineAndColForPositon: getLineAndColForPositon
    }
}



function getScriptSnapShot(scriptInfo: ScriptInfo): ts.IScriptSnapshot {
    var lineStarts = scriptInfo.getLineStarts();
    var textSnapshot = scriptInfo.getContent();
    var version = scriptInfo.getVersion()
    var editRanges = scriptInfo.getEditRanges()


    function getChangeRange(oldSnapshot: ts.IScriptSnapshot): ts.TextChangeRange {
        var unchanged = { span: { start: 0, length: 0 }, newLength: 0 };

        function collapseChangesAcrossMultipleVersions(changes: ts.TextChangeRange[]) {
            if (changes.length === 0) {
                return unchanged;
            }
            if (changes.length === 1) {
                return changes[0];
            }
            var change0 = changes[0];
            var oldStartN = change0.span.start;
            var oldEndN = change0.span.start + change0.span.length;
            var newEndN = oldStartN + change0.newLength;
            for (var i = 1; i < changes.length; i++) {
                var nextChange = changes[i];
                var oldStart1 = oldStartN;
                var oldEnd1 = oldEndN;
                var newEnd1 = newEndN;
                var oldStart2 = nextChange.span.start;
                var oldEnd2 = nextChange.span.start + nextChange.span.length;
                var newEnd2 = oldStart2 + nextChange.newLength;
                oldStartN = Math.min(oldStart1, oldStart2);
                oldEndN = Math.max(oldEnd1, oldEnd1 + (oldEnd2 - newEnd1));
                newEndN = Math.max(newEnd2, newEnd2 + (newEnd1 - oldEnd2));
            }
            return { span: { start: oldStartN, length: oldEndN - oldStartN }, newLength: newEndN - oldStartN };
        };

        var scriptVersion: number = (<any>oldSnapshot).version || 0;
        if (scriptVersion === version) {
            return unchanged;
        }
        var initialEditRangeIndex = editRanges.length - (version - scriptVersion);

        if (initialEditRangeIndex < 0) {
            return null;
        }

        var entries = editRanges.slice(initialEditRangeIndex);
        return collapseChangesAcrossMultipleVersions(entries);
    }

    return {
        getText: (start: number, end: number) => textSnapshot.substring(start, end),
        getLength: () => textSnapshot.length,
        getChangeRange: getChangeRange,
        getLineStartPositions: () => lineStarts,
        version: version
    }
}

// NOTES:
// * fileName is * always * the absolute path to the file
// * content is *always* the string content of the file
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

        var script = createScriptInfo(fileName, content);
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
            script.updateContent(content);
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
            script.setIsOpen(isOpen);
            return;
        }

        throw new Error('No script with name \'' + fileName + '\'');
    }

    getScriptContent = (fileName: string): string => {
        var script = this.fileNameToScript[fileName];
        if (script) {
            return script.getContent();
        }
        return null;
    }

    hasScript = (fileName: string) => {
        return !!this.fileNameToScript[fileName];
    }

    getIndexFromPosition = (fileName: string, position: { ch: number; line: number }): number => {
        var script = this.fileNameToScript[fileName];
        if (script) {
            return script.getPositionFromLine(position.line, position.ch);
        }
        return -1;
    }

    getPositionFromIndex = (fileName: string, index: number): { ch: number; line: number } => {
        if (!this.fileNameToScript[fileName]) this.addScript(fileName);
        var script = this.fileNameToScript[fileName];
        if (script) {
            return script.getLineAndColForPositon(index);
        }
        return null;
    }



    ////////////////////////////////////////
    // ts.LanguageServiceHost implementation
    ////////////////////////////////////////

    getCompilationSettings = () => this.config.project.compilerOptions;
    getScriptFileNames = (): string[]=> Object.keys(this.fileNameToScript);
    getScriptVersion = (fileName: string): string => {
        var script = this.fileNameToScript[fileName];
        if (script) {
            return '' + script.getVersion();
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
            return getScriptSnapShot(script);
        }
        return null;
    }
    getCurrentDirectory = (): string  => {
        return this.config.projectFileDirectory;
    }
    getDefaultLibFileName = (): string => {
        return 'lib.d.ts'; // TODO: this.config.project.compilerOptions.target === ts.ScriptTarget.ES6 ? "lib.es6.d.ts" : "lib.d.ts";
    }

    // ts.Logger implementation
    log = () => void 0
    error = () => void 0
    trace = () => void 0
}
