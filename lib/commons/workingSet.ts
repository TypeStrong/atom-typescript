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

import Promise = require('bluebird');
import signal = require('./signal');



//--------------------------------------------------------------------------
//
//  IWorkingSet
//
//--------------------------------------------------------------------------

/**
 * A service that will reflect files in the working set 
 */
export interface IWorkingSet {
    /**
     * list of files in the working set
     */
    getFiles(): Promise<string[]>;
    
    /**
     * a signal dispatching events when change occured in the working set
     */
    workingSetChanged: signal.Signal<WorkingSetChangeRecord>;
    
    /**
     * a signal that provide fine grained change over edited document
     */
    documentEdited: signal.Signal<DocumentChangeRecord>;

    /**
     * dispose the working set 
     */
    dispose(): void;
}


//--------------------------------------------------------------------------
//
//  ChangeRecord
//
//--------------------------------------------------------------------------


/**
 * describe change in the working set
 */
export interface WorkingSetChangeRecord {
    /**
     * kind of change that occured in the working set
     */
    kind: WorkingSetChangeKind;
    
    /**
     * list of paths that has been added or removed from the working set
     */
    paths: string[];
}


/**
 * enum listing the change kind that occur in a working set
 */
export enum WorkingSetChangeKind {
    ADD,
    REMOVE
}


//--------------------------------------------------------------------------
//
//  DocumentChangeDescriptor
//
//--------------------------------------------------------------------------

/**
 * describe a change in a document
 */
export interface DocumentChangeDescriptor {
    
    /**
     * start position of the change
     */
    from?: CodeMirror.Position;
    
    /**
     * end positon of the change
     */
    to?: CodeMirror.Position;
    
    /**
     * text that has been inserted (if any)
     */
    text?: string;
    
    /**
     * text that has been removed (if any)
     */
    removed?: string;
    
}
/**
 * describe a list of change in a document
 */
export interface DocumentChangeRecord {
    /**
     * path of the files that has changed
     */
    path: string;
    /**
     * list of changes
     */
    changeList: DocumentChangeDescriptor[];
    
    /**
     * documentText
     */
    documentText: string
}
