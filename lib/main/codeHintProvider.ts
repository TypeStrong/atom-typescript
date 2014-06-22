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

//TODO that part of the application is not well tested and just 'work' it needs to be refactored

import ServiceConsumer = require('./serviceConsumer');
import completion = require('../commons/completion');
import CompletionKind = completion.CompletionKind;

var HINT_TEMPLATE = [
    '<span class="cm-s-default">',
    '   <span style="display: inline-block" class="{{classType}}">',
    '       <span style="font-weight: bold">{{match}}</span>{{suffix}}',
    '   </span>',
    '</span>'
].join('\n');


/**
 * basic implementation
 */
class CodeHintProvider extends ServiceConsumer<completion.ICompletionService> implements brackets.CodeHintProvider {
    
    
    private editor: brackets.Editor;
    
    /**
     * return true if hints can be calculated for te current editor
     * 
     * @param editor the editor
     * @param implicitChar determine whether the hinting request is explicit or implicit, 
     * null if implicit, contains the last character inserted
     */
    hasHints(editor: brackets.Editor, implicitChar: string): boolean {
        //TODO we should find a better test here that limits more the implicit request
        if (!implicitChar || /[\w.\($_]/.test(implicitChar)) {
            this.editor = editor;
            return true;  
        }
        return false;
    }
    
    getHints(implicitChar: string): JQueryDeferred<brackets.HintResult> {
        var currentFileName: string = this.editor.document.file.fullPath, 
            position = this.editor.getCursorPos(),
            deferred = $.Deferred();
        if (!this.hasHints(this.editor, implicitChar)) {
            deferred.resolve({
                hints: [],
                selectInitial: false 
            });
        } else {

            this.getService().then(service => {
                service.getCompletionAtPosition(currentFileName, position).then(result => {
                    deferred.resolve({
                        hints: result.entries.map(entry => {
                            var text = entry.name,
                                match: string,
                                suffix: string,
                                classType = '';

                            switch (entry.kind) {
                                case CompletionKind.KEYWORD:
                                    switch (entry.name) {
                                        case 'static':
                                        case 'public':
                                        case 'private':
                                        case 'export':
                                        case 'get':
                                        case 'set':
                                            classType = 'cm-qualifier';
                                            break;
                                        case 'class':
                                        case 'function':
                                        case 'module':
                                        case 'var':
                                            classType = 'cm-def';
                                            break;
                                        default:
                                            classType = 'cm-keyword';
                                            break;
                                    }
                                    break;
                                case CompletionKind.METHOD:
                                case CompletionKind.FUNCTION:
                                    text += entry.type ?  entry.type : ''; 
                                    break;
                                default:
                                    text += entry.type ? ' - ' + entry.type : ''; 
                                    break;
                            }

                            // highlight the matched portion of each hint
                            if (result.match) {
                                match = text.slice(0, result.match.length);
                                suffix  = text.slice(result.match.length);

                            } else {
                                match = '';
                                suffix = text;
                            }


                            var jqueryObj = $(Mustache.render(HINT_TEMPLATE, {
                                match: match,
                                suffix: suffix,
                                classType: classType
                            })); 
                            jqueryObj.data('entry', entry);
                            jqueryObj.data('match', result.match);
                            return jqueryObj;

                        }),
                        selectInitial: !!implicitChar
                    });
                }).catch(error => deferred.reject(error));
            });
        }
        return deferred;
    }
    
    
    
    insertHint($hintObj: JQuery): void {
        var entry: completion.CompletionEntry = $hintObj.data('entry'),
            match: string = $hintObj.data('match'), 
            position = this.editor.getCursorPos(),
            startPos = !match ? 
                position : 
                {
                    line : position.line,
                    ch : position.ch - match.length
                }
            ;
        
        
        this.editor.document.replaceRange(entry.name, startPos, position);
    }
}


export = CodeHintProvider;
