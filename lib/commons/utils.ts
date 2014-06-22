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

/**
 * assign all properties of a list of object to an object
 * @param target the object that will receive properties
 * @param items items which properties will be assigned to a target
 */
export function assign(target: any, ...items: any[]): any {
    return items.reduce(function (target: any, source: any) {
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
 * clone an object (deep)
 * 
 * @param target the object to clone
 */
export function deepClone<T>(target: T): T {
    return Object.keys(target).reduce((result: any, key: string) => {
        var value: any = (<any>target)[key];
        if (typeof value === 'object') {
            value = deepClone(value);
        }
        result[key] = value;
        return result;
    }, Array.isArray(target) ? [] : {});
}

/**
 * retrieve all enumerable properties of an object in the prototype chain
 * 
 * @param target the object to which we will retrieve properties
 */
export function getEnumerablePropertyNames(target: any): string [] {
    var result: string[] = [];
    for (var key in target) {
        result.push(key);
    }
    return result;
}

/**
 * merge multiple array in one
 * 
 * @param array an array of array to be flattened
 */
export function mergeAll<T>(array: T[][]): T[] {
    var results: T[] = [];
    array.forEach(subArray => {
        Array.prototype.push.apply(results, subArray);
    });
    
    return results;
};

/**
 * browserify path.resolve is buggy on windows
 */
export function pathResolve(from: string, to: string): string {
    var result = path.resolve(from, to);
    var index = result.indexOf(from[0]);
    return result.slice(index);
}





