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

/**
 * C# like events and delegates for typed events
 * dispatching
 */
export interface ISignal<T> {
    /**
     * Subscribes a listener for the signal.
     * 
     * @params listener the callback to call when events are dispatched
     * @params priority an optional priority for this signal
     */
    add(listener: (parameter: T) => any, priority?: number): void;
    
    /**
     * unsubscribe a listener for the signal
     * 
     * @params listener the previously subscribed listener
     */
    remove(listener: (parameter: T) => any): void;
    
    /**
     * dispatch an event
     * 
     * @params parameter the parameter attached to the event dispatching
     */
    dispatch(parameter?: T): boolean;
    
    /**
     * Remove all listener from the signal
     */
    clear(): void;
    
    /**
     * @return true if the listener has been subsribed to this signal
     */
    hasListeners(): boolean;
}


export class Signal<T> implements ISignal<T> {
    
    /**
     * list of listeners that have been suscribed to this signal
     */
    private listeners: { (parameter: T): any }[] = [];
    
    /**
     * Priorities corresponding to the listeners 
     */
    private priorities: number[] = [];
    
    /**
     * Subscribes a listener for the signal.
     * 
     * @params listener the callback to call when events are dispatched
     * @params priority an optional priority for this signal
     */
    add(listener: (parameter: T) => any, priority = 0): void {
        var index = this.listeners.indexOf(listener);
        if (index !== -1) {
            this.priorities[index] = priority;
            return;
        }
        for (var i = 0, l = this.priorities.length; i < l; i++) {
            if (this.priorities[i] < priority) {
                this.priorities.splice(i, 0, priority);
                this.listeners.splice(i, 0, listener);
                return;
            }
        }
        this.priorities.push(priority);
        this.listeners.push(listener);
    }
    
    /**
     * unsubscribe a listener for the signal
     * 
     * @params listener the previously subscribed listener
     */
    remove(listener: (parameter: T) => any): void {
        var index = this.listeners.indexOf(listener);
        if (index >= 0) {
            this.priorities.splice(index, 1);
            this.listeners.splice(index, 1);
        }
    }
    
    /**
     * dispatch an event
     * 
     * @params parameter the parameter attached to the event dispatching
     */
    dispatch(parameter?: T): boolean {
        var hasBeenCanceled = this.listeners.every((listener: (parameter: T) => any) =>  {
            var result = listener(parameter);
            return result !== false;
        });
        
        return hasBeenCanceled;
    }
    
    /**
     * Remove all listener from the signal
     */
    clear(): void {
        this.listeners = [];
        this.priorities = [];
    }
    
    /**
     * @return true if the listener has been subsribed to this signal
     */
    hasListeners(): boolean {
        return this.listeners.length > 0;
    }
}
