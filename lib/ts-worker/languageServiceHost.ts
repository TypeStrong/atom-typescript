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

'use strict';

import logger = require('../commons/logger');
import collections = require('../commons/collections');
import path = require('path');
import utils = require('../commons/utils');

/**
 * ILanguage Service host implementation
 */
class LanguageServiceHost extends logger.LogingClass implements TypeScript.Services.ILanguageServiceHost {
    
    /**
     * compilationSettings
     */
    private compilationSettings: TypeScript.CompilationSettings;
  
    /**
     * a map associating file absolute path to ScriptInfo
     */
    private fileNameToScript = new collections.StringMap<ScriptInfo>();
    
    /**
     * add a script to the host
     * 
     * @param fileName the absolute path of the file
     * @param content the file content
     */
    addScript(fileName: string, content: string) {
        var script = new ScriptInfo(fileName, content);
        this.fileNameToScript.set(fileName, script);
    }

    /**
     * remove a script from the host
     * 
     * @param fileName the absolute path of the file
     */
    removeScript(fileName: string) {
        this.fileNameToScript.delete(fileName);
    }
    
    /**
     * remove all script from the host
     * 
     * @param fileName the absolute path of the file
     */
    removeAll(): void {
        this.fileNameToScript.clear();
    }

    /**
     * update a script
     * 
     * @param fileName the absolute path of the file
     * @param content the new file content
     */
    updateScript(fileName: string, content: string) {
        var script = this.fileNameToScript.get(fileName);
        if (script) {
            script.updateContent(content);
            return;
        }
        throw new Error('No script with name \'' + fileName + '\'');
    }

    /**
     * edit a script
     * 
     * @param fileName the absolute path of the file
     * @param minChar the index in the file content where the edition begins
     * @param limChar the index  in the file content where the edition ends
     * @param newText the text inserted
     */
    editScript(fileName: string, minChar: number, limChar: number, newText: string) {
        var script = this.fileNameToScript.get(fileName);
        if (script) {
            script.editContent(minChar, limChar, newText);
            return;
        }

        throw new Error('No script with name \'' + fileName + '\'');
    }
    
    /**
     * set 'open' status of a script
     * 
     * @param fileName the absolute path of the file
     * @param isOpen open status
     */
    setScriptIsOpen(fileName: string, isOpen: boolean) {
        var script = this.fileNameToScript.get(fileName);
        if (script) {
            script.isOpen = isOpen;
            return;
        }

        throw new Error('No script with name \'' + fileName + '\'');
    }
    
    /**
     * the the language service host compilation settings
     * 
     * @param the settings to be applied to the host
     */
    setCompilationSettings(settings: TypeScript.CompilationSettings ): void{
        this.compilationSettings = Object.freeze(utils.clone(settings));
    }
    
    /**
     * retrieve the content of a given script
     * 
     * @param fileName the absolute path of the file
     */
    getScriptContent(fileName: string): string {
        var script = this.fileNameToScript.get(fileName);
        if (script) {
            return script.content;
        }
        return null;
    }
    
    /**
     * return an index from a positon in line/char
     * 
     * @param path the path of the file
     * @param position the position
     */
    getIndexFromPos(fileName: string, position: CodeMirror.Position): number {
        var script = this.fileNameToScript.get(fileName);
        if (script) {
            return script.getPositionFromLine(position.line, position.ch);
        }
        return -1;
    }
    
    
    /**
     * return a positon in line/char from an index
     * @param path the path of the file
     * @param index the index
     */
    indexToPosition(fileName: string, index: number): CodeMirror.Position {
        var script = this.fileNameToScript.get(fileName);
        if (script) {
            var tsPosition = script.getLineAndColForPositon(index);
            return {
                ch: tsPosition.character,
                line: tsPosition.line
            };
        }
        return null;
    }
   

    //////////////////////////////////////////////////////////////////////
    // ILanguageServiceShimHost implementation
    //

    getCompilationSettings(): TypeScript.CompilationSettings {
        return this.compilationSettings; 
    }

    getScriptFileNames() {
        return this.fileNameToScript.keys;
    }

    getScriptSnapshot(fileName: string): TypeScript.IScriptSnapshot {
        var script = this.fileNameToScript.get(fileName);
        if (script) {
            return new ScriptSnapshot(script);
        }
        return null;
    }

    getScriptVersion(fileName: string): number {
        var script = this.fileNameToScript.get(fileName);
        if (script) {
            return script.version;
        }
        return 0;
    }

    getScriptIsOpen(fileName: string): boolean {
        var script = this.fileNameToScript.get(fileName);
        if (script) {
            return script.isOpen;
        }
        return false;
    }

    getScriptByteOrderMark(fileName: string): TypeScript.ByteOrderMark {
        var script = this.fileNameToScript.get(fileName);
        if (script) {
            return script.byteOrderMark;
        }
        return TypeScript.ByteOrderMark.None;
    }

    getDiagnosticsObject(): TypeScript.Services.ILanguageServicesDiagnostics {
        return new LanguageServicesDiagnostics('');
    }

    getLocalizedDiagnosticMessages(): string {
        return '';
    }

    fileExists(s: string) {
        return this.fileNameToScript.has(s);
    }

    directoryExists(s: string) {
        return true;
    }

    resolveRelativePath(fileName: string, directory: string): string {
        return utils.pathResolve(directory, fileName);
    }

    getParentDirectory(fileName: string): string {
        return path.dirname(fileName);
    }
}


/**
 * Manage a script in the language service host
 */
class ScriptInfo {
    version: number = 1;
    editRanges: TypeScript.TextChangeRange[] = [];
    lineMap: TypeScript.LineMap = null;
    fileName: string;
    content: string;
    isOpen: boolean;
    byteOrderMark: TypeScript.ByteOrderMark;
    

    /**
     * @param fileName the absolute path of the file
     * @param content the content of the file
     * @param isOpen the open status of the script
     * @param byteOrderMark
     */
    constructor(fileName: string, content: string, isOpen = false, 
                byteOrderMark: TypeScript.ByteOrderMark = TypeScript.ByteOrderMark.None) {
        this.fileName = fileName;
        this.content = content;
        this.isOpen = isOpen;
        this.byteOrderMark = byteOrderMark;
        this.setContent(content);
    }
    
   
    

    /**
     * update the content of the script
     * 
     * @param newContent the new script content
     */
    updateContent(newContent: string): void {
        this.setContent(newContent);
        this.editRanges = [];
        this.version++;
    }


    /**
     * edit the script content
     * 
     * @param minChar the index in the file content where the edition begins
     * @param limChar the index  in the file content where the edition ends
     * @param newText the text inserted
     */
    editContent(minChar: number, limChar: number, newText: string): void {
        // Apply edits
        var prefix = this.content.substring(0, minChar);
        var middle = newText;
        var suffix = this.content.substring(limChar);
        this.setContent(prefix + middle + suffix);

        // Store edit range + new length of script
        this.editRanges.push(new TypeScript.TextChangeRange(
                TypeScript.TextSpan.fromBounds(minChar, limChar), newText.length));

        // Update version #
        this.version++;
    }

     
     
    /**
     * return an index position from line an character position
     * 
     * @param line line number
     * @param character charecter poisiton in the line
     */
    getPositionFromLine(line: number, character: number) {
        return this.lineMap.getPosition(line, character);
    }
     
    /**
     * return line and chararacter position from index position
     * 
     * @param position
     */
    getLineAndColForPositon(position: number) {
        var lineAndChar = { line: -1, character: -1};
        this.lineMap.fillLineAndCharacterFromPosition(position, lineAndChar);
        return lineAndChar;
    }
    
    
    /**
     * set the script content
     */
    private setContent(content: string): void {
        this.content = content;
        this.lineMap = TypeScript.LineMap1.fromString(content);
    }
}

 
/**
 * ScriptSnapshot implementation
 * Simply a proxy over ScriptInfo
 */
class ScriptSnapshot implements TypeScript.IScriptSnapshot {
    private scriptInfo: ScriptInfo;
    private lineMap: TypeScript.LineMap = null;
    private textSnapshot: string;
    private version: number;
    private editRanges: TypeScript.TextChangeRange[];

    constructor(scriptInfo: ScriptInfo) {
        this.scriptInfo = scriptInfo;
        this.textSnapshot = scriptInfo.content;
        this.version = scriptInfo.version;
        this.editRanges = scriptInfo.editRanges.slice(0);
    }

    getText(start: number, end: number): string {
        return this.textSnapshot.substring(start, end);
    }

    getLength(): number {
        return this.textSnapshot.length;
    }

    getLineStartPositions(): number[] {
        if (this.lineMap === null) {
            this.lineMap = TypeScript.LineMap1.fromString(this.textSnapshot);
        }
        return this.lineMap.lineStarts();
    }

    getTextChangeRangeSinceVersion(scriptVersion: number): TypeScript.TextChangeRange {
        if (scriptVersion === this.version) {
            // No edits!
            return TypeScript.TextChangeRange.unchanged;
        }
        var initialEditRangeIndex = this.editRanges.length - (this.version - scriptVersion);

        if (initialEditRangeIndex < 0) {
            return null;
        }
        
        var entries = this.editRanges.slice(initialEditRangeIndex);
        return TypeScript.TextChangeRange.collapseChangesAcrossMultipleVersions(entries);
    }
}


class LanguageServicesDiagnostics implements TypeScript.Services.ILanguageServicesDiagnostics {

    constructor(private destination: string) { }

    log(content: string): void {
        //Imitates the LanguageServicesDiagnostics object when not in Visual Studio
    }
}


export = LanguageServiceHost;
