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


import signal = require('../commons/signal');
import collections = require('../commons/collections');
import ws = require('../commons/workingSet');
import Promise = require('bluebird');




/**
 * implementation of the IWorkingSet
 */
class WorkingSet implements ws.IWorkingSet  {
    
    //-------------------------------
    //  constructor
    //-------------------------------


    constructor(
            private documentManager: brackets.DocumentManager,
            private editorManager: brackets.EditorManager
    ) {
        $(documentManager).on('workingSetAdd', <any>this.workingSetAddHandler);
        $(documentManager).on('workingSetAddList', <any>this.workingSetAddListHandler);
        $(documentManager).on('workingSetRemove', <any>this.workingSetRemoveHandler);
        $(documentManager).on('workingSetRemoveList', <any>this.workingSetRemoveListHandler);
        
        $(editorManager).on('activeEditorChange', <any>this.activeEditorChangeHandler); 
        
        this.setFiles(documentManager.getWorkingSet().map(file => file.fullPath));
        this.setActiveEditor(editorManager.getActiveEditor());
    }
    
    //-------------------------------
    //  Variables
    //-------------------------------
    
    /**
     * internal signal for workingSetChanged
     */
    private _workingSetChanged = new signal.Signal<ws.WorkingSetChangeRecord>();
    
    /**
     * internal signal for documentEdited
     */
    private _documentEdited = new signal.Signal<ws.DocumentChangeRecord>();
    
        
    /**
     * Set of file path in the working set
     */
    private filesSet = new collections.StringSet();
    
    /**
     * Set of file path in the working set
     */
    private currentDocument: brackets.Document;

    
    //-------------------------------
    //  IWorkingSet implementations
    //-------------------------------
    
    
    /**
     * list of files in the working set
     */
    getFiles() {
        return Promise.cast(this.filesSet.values);
    }
    
    /**
     * a signal dispatching events when change occured in the working set
     */
    get workingSetChanged() {
        return this._workingSetChanged;
    }
    
    
    /**
     * a signal that provide fine grained change over edited document
     */
    get documentEdited() {
        return this._documentEdited;
    }

    /**
     * dispose the working set 
     */   
    dispose(): void {
        $(this.documentManager).off('workingSetAdd', <any>this.workingSetAddHandler);
        $(this.documentManager).off('workingSetAddList', <any>this.workingSetAddListHandler);
        $(this.documentManager).off('workingSetRemove', <any>this.workingSetRemoveHandler);
        $(this.documentManager).off('workingSetRemoveList', <any>this.workingSetRemoveListHandler);
        $(this.editorManager).off('activeEditorChange', <any>this.activeEditorChangeHandler); 
        this.setFiles(null);
        this.setActiveEditor(null);
    }
    
    //-------------------------------
    //  Privates methods
    //-------------------------------
    
    /**
     * set working set files
     */
    private setFiles(files: string[]) {
        this.filesSet.values.forEach(path => this.filesSet.remove(path));
        if (files) {
            files.forEach(path => this.filesSet.add(path));
        }
    }
    
    //-------------------------------
    //  Events Handler
    //-------------------------------
    
    /**
     * handle 'workingSetAdd' event
     */
    private workingSetAddHandler = (event: any, file: brackets.File) => {
        this.filesSet.add(file.fullPath);
        this.workingSetChanged.dispatch({
            kind: ws.WorkingSetChangeKind.ADD,
            paths: [file.fullPath]
        });
    };

    /**
     * handle 'workingSetAddList' event
     */
    private workingSetAddListHandler = (event: any, ...files: brackets.File[]) => {
        var paths = files.map(file => {
            this.filesSet.add(file.fullPath); 
            return file.fullPath;
        });
        if (paths.length > 0) {
            this.workingSetChanged.dispatch({
                kind: ws.WorkingSetChangeKind.ADD,
                paths: paths
            });
        }
    };
    
    /**
     * handle 'workingSetRemove' event
     */      
    private workingSetRemoveHandler = (event: any, file: brackets.File) => {
        this.filesSet.remove(file.fullPath);
        this.workingSetChanged.dispatch({
            kind: ws.WorkingSetChangeKind.REMOVE,
            paths: [file.fullPath]
        });
    };
    
    /**
     * handle 'workingSetRemoveList' event
     */      
    private workingSetRemoveListHandler = (event: any, ...files: brackets.File[]) => {
        var paths = files.map( file => {
            this.filesSet.remove(file.fullPath); 
            return file.fullPath;
        });
        if (paths.length > 0) {
            this.workingSetChanged.dispatch({
                kind: ws.WorkingSetChangeKind.REMOVE,
                paths: paths
            });
        }
    };
 
    /**
     * attach events to the activeEditor
     */
    private setActiveEditor(editor: brackets.Editor) {
        if (this.currentDocument) {
            $(this.currentDocument).off('change', <any>this.documentChangesHandler);
        }
        this.currentDocument = editor && editor.document;
        if (this.currentDocument) {
            $(this.currentDocument).on('change', <any>this.documentChangesHandler);
        }
    }
            
    
    /**
     * handle 'change' on document
     */
    private documentChangesHandler = (event: any, document: brackets.Document, changes: CodeMirror.EditorChange[]) => {
        var changeList: ws.DocumentChangeDescriptor[] = 
            changes.map(change => ({
                from: change.from,
                to: change.to,
                text: change.text && change.text.join('\n'),
                removed: change.removed ? change.removed.join('\n') : ''
            }));
            
        if (changeList.length > 0) {
            this.documentEdited.dispatch({
                path: document.file.fullPath,
                changeList: changeList,
                documentText: document.getText()
            });
        }   
    };
    
    /**
     * handle active editor change
     */
    private activeEditorChangeHandler = (event: any, current: brackets.Editor, previous: brackets.Editor) => {
        this.setActiveEditor(current);
    };

}

export = WorkingSet;
