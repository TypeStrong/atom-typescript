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
import ls = require('../commons/lexicalStructure');

var EditorManager = brackets.getModule('editor/EditorManager'),
    QuickOpen    = brackets.getModule('search/QuickOpen');


class Session {
    constructor(
        public items: ls.LexicalStructureItem[]
    ) {}
} 


class TypeScriptQuickFindDefitionProvider extends ServiceConsumer<ls.ILexicalStructureService> implements 
    brackets.QuickOpenPluginDef<TypeScriptQuickFindDefitionProvider.LexicalStructureItem> {
    
    private session: Session;
    
    
    name = 'TypeScriptQuickFindDefitionProvider';
    languageIds = ['typescript'];    
    label = 'TypeScript';
    
    match(query: string) {
        return query.indexOf('@') === 0;
    }
    
    search = (request: string, stringMatcher: brackets.StringMatcher) =>  {
        request = request.slice(request.indexOf('@') + 1, request.length);
        return this.getSession().then(session => {
            return session.items.filter(item => {
                return !!stringMatcher.match(item.name, request);
            });
        });
    };
    
    done = () => {
        this.session = null;
    };
    
    itemSelect = (item: TypeScriptQuickFindDefitionProvider.LexicalStructureItem) => {
        this.itemFocus(item);
    };
    
    itemFocus = (item: TypeScriptQuickFindDefitionProvider.LexicalStructureItem) => {
        this.setCurrentPosition(item.position);
    };
    
    resultsFormatter(item: TypeScriptQuickFindDefitionProvider.LexicalStructureItem) {
        var displayName = QuickOpen.highlightMatch(item.name);
        displayName = item.containerName ? item.containerName + '.' + displayName : displayName;
        return '<li>' + displayName + '</li>';
    }
    
    
    private getSession(): JQueryPromise<Session> {
        return $.Deferred(deferred => {
            if (this.session) {
                deferred.resolve(this.session);
            } else {
                this.getService().then(lexicalStructureService => {
                    var editor = EditorManager.getActiveEditor(),
                        currentFile = editor.document.file.fullPath;
                    lexicalStructureService.getLexicalStructureForFile(currentFile).then(items => {
                        this.session = new Session(items);
                        deferred.resolve(this.session);    
                    });
                });
            }
        }).promise();
    }
    
    private setCurrentPosition(pos: CodeMirror.Position) {
        EditorManager.getActiveEditor().setCursorPos(pos.line, pos.ch, true, true);
    }
}

module TypeScriptQuickFindDefitionProvider {
    export interface LexicalStructureItem {
        name: string; 
        containerName: string;
        position: CodeMirror.Position;
    }
}


export = TypeScriptQuickFindDefitionProvider;
