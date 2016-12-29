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

import path = require('path');

export function mapValues<T>(map: { [index: string]: T }): T[] {
    return Object.keys(map).reduce((result: T[], key: string) => {
        result.push(map[key]);
        return result;
    }, []);
}

/**
 * assign all properties of a list of object to an object
 * @param target the object that will receive properties
 * @param items items which properties will be assigned to a target
 */
export function assign(target: any, ...items: any[]): any {
    return items.reduce(function(target: any, source: any) {
        return Object.keys(source).reduce((target: any, key: string) => {
            target[key] = source[key];
            return target;
        }, target);
    }, target);
}

/**
 * clone an object (shallow)
 * @param target the object to clone
 */
export function clone<T>(target: T): T {
    return assign(Array.isArray(target) ? [] : {}, target);
}

/**
 * Create a quick lookup map from list
 */
export function createMap(arr: (string|number)[]): { [string: string]: boolean;[number: number]: boolean } {
    return arr.reduce((result: { [string: string]: boolean }, key: string) => {
        result[key] = true;
        return result;
    }, <{ [string: string]: boolean }>{});
}


/**
 * browserify path.resolve is buggy on windows
 */
export function pathResolve(from: string, to: string): string {
    var result = path.resolve(from, to);
    var index = result.indexOf(from[0]);
    return result.slice(index);
}


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

var nameExtractorRegex = /return (.*);/;
/** Get the name using a lambda so that you don't have magic strings */
export function getName(nameLambda: () => any) {
    var m = nameExtractorRegex.exec(nameLambda + "");
    if (m == null)
        throw new Error("The function does not contain a statement matching 'return variableName;'");
    var access = m[1].split('.');
    return access[access.length - 1];
}

/** Sloppy but effective code to find distinct */
export function distinct(arr: string[]): string[] {
    var map = createMap(arr);
    return Object.keys(map);
}
