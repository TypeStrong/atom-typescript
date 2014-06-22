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


import Promise = require('bluebird');
import signal = require('./signal');


//--------------------------------------------------------------------------
//
//  IFileSystem
//
//--------------------------------------------------------------------------

/**
 * A simple wrapper over brackets filesystem that provide simple function and 
 * typed watcher
 */
export interface IFileSystem {
    
    /**
     * return a promise resolving to the project root folder path
     */
    getProjectRoot(): Promise<string>;
    
    /**
     * a signal dispatching fine grained change reflecting the change that happens in the working set
     */
    projectFilesChanged: signal.Signal<FileChangeRecord[]>;
    
    /**
     * return a promise that resolve with an array of string containing all the files of the projects
     */
    getProjectFiles(): Promise<string[]>;
    
    /**
     * read a file, return a promise with that resolve to the file content
     * 
     * @param path the file to read
     */
    readFile(path: string): Promise<string>;
    
    /**
     * reset the wrapper and dispatch a refresh event
     */
    reset(): void;
    
    /**
     * clean the wrapper for disposal
     */
    dispose(): void;
}


//--------------------------------------------------------------------------
//
//  Change record
//
//--------------------------------------------------------------------------


/**
 * enum representing the kind change possible in the fileSysem
 */
export enum FileChangeKind {
    /**
     * a file has been added
     */
    ADD,
    
    /**
     * a file has been updated
     */
    UPDATE,
    
    /**
     * a file has been deleted
     */
    DELETE,
    
    /**
     * the project files has been reset 
     */
    RESET
}

/**
 * FileSystem change descriptor
 */
export interface FileChangeRecord {
    /**
     * kind of change
     */
    kind: FileChangeKind;
    
    /**
     * name of the file that have changed
     */
    fileName: string;
}


