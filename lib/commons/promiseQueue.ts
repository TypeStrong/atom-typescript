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

/**
 * A simple Promise Queue
 */
class PromiseQueue {
    
    /**
     * the current promise
     */
    private promise: Promise<any>;
    
    /**
     * the resolve function of the initial promise
     */
    private initializer: (result: any) => any;
    
    /**
     * true if the queue has been initialized
     */
    private initialized: boolean = false;
    
    constructor() {
        this.promise = new Promise(resolve => {
            this.initializer = resolve;    
        });
    }
    
    /**
     * initialize the queue subsequent call reset the queue
     * 
     * @param val the value passed as initialial result
     */
    init<T>(val: Promise<T>): Promise<T>;
    
    /**
     * initialize the queue subsequent call reset the queue
     * 
     * @param val the value passed as initialial result
     */
    init<T>(val: T): Promise<T> {
        if (this.initialized) {
            this.promise = Promise.cast(val);
        } else {
            this.initialized = true;
            this.initializer(val);
            return this.promise;
        }
    }
    
    /**
     * enqueue an action
     */
    then<T>(action: () => Promise<T>): Promise<T>;
    /**
     * enqueue an action
     */
    then<T>(action: () => T): Promise<T>;
    /**
     * enqueue an action
     */
    then(action: () => void): Promise<void> {
        return this.promise = this.promise.then(
            () => action(), 
            () => action()
        );
    }
}

export = PromiseQueue;
