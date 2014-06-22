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



//--------------------------------------------------------------------------
//
//  Immediate
//
//--------------------------------------------------------------------------

/**
 * a setImmediate shim
 */

var immediateImpl: {
    /**
     * schedule the "immediate" execution of callback 
     * @param expression a function or a string
     * @param args a list of arguments to pass as the function parameter
     * 
     * @return id of the sheduled execution
     */
    setImmediate(expression: any, ...args: any[]): number;
    
    /**
     * cancel an immediate scheduling
     * 
     * @param handle id returned by setImmediate
     */
    clearImmediate(handle: number): void;
};



interface Task {
    handle: number;
    callBack: (args: any[]) => any;
    parameters: any[];
}

if (typeof window.setImmediate !== 'undefined') {
    immediateImpl = window;
} else {
    var setImmediateQueue: Task[] = [],
        canceledImmediate: { [handle: number]: boolean } = {},
        sentinel = 'immediate' + String(Math.random()),
        uidHelper = 0;
    
    window.addEventListener('message', (event: MessageEvent) => {
        if (event.data === sentinel) {
            var queue = setImmediateQueue,
                canceled = canceledImmediate;
            
            setImmediateQueue = [];
            canceledImmediate = {};
            queue.forEach((task) => {
                if (!canceled[task.handle]) {
                    task.callBack.apply(null, task.parameters);
                }
            });
        }
    });
    
    immediateImpl = {
        setImmediate(expression: any, ...args: any[]): number {
            uidHelper++;
            setImmediateQueue.push({
                handle: uidHelper,
                callBack : typeof expression === 'string' ? new Function(expression) : expression,
                parameters: args
            });
            window.postMessage(sentinel, '*');
            return uidHelper;
        },
        clearImmediate(handle: number): void {
            canceledImmediate[handle] = true;
        }
    };
    
    Object.freeze(immediateImpl);
}

export = immediateImpl;
