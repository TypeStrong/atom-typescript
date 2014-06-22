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
//  StringSet
//
//--------------------------------------------------------------------------

/**
 * Set that only accept string as value
 */
export class StringSet {
    /**
     * internal map, object with null prototype 
     */
    private map: { [path: string]: boolean; };
    
    /**
     * constructor
     * @param array an array of string that will be added to the set
     */
    constructor(array?: string[]) {
        this.map = Object.create(null);
        if (array) {
            for (var i = 0, l = array.length; i < l; i ++) {
                this.add(array[i]);
            }
        }
    }
    
    /**
     * add a value to the set
     * @param value
     */
    add(value: string): void {
        this.map[value] = true;
    }
    
    /**
     * remove a value from the set
     * @param value
     */
    remove(value: string): void {
        delete this.map[value];
    }
    
    /**
     * return true if the set contains the given value
     * @param value
     */
    has(value: string): boolean {
        return !!this.map[value];
    }
 
    /**
     * return an array containing the values of the set
     */
    get values(): string[] {
        return Object.keys(this.map);
    }
}


//--------------------------------------------------------------------------
//
//  StringMap
//
//--------------------------------------------------------------------------

export interface MapEntry<T> { key: string; value: T };
    

/**
 * Map that only accept string as key
 */
export class StringMap<T> {
    /**
     * internal map, object with null prototype 
     */
    private map: { [path: string]: T };
    
    /**
     * an object that allow to differenciate undefined value from a key
     * not present in the map;
     */
    private mascot: T;
    
    /**
     * constructor
     * @param obj initial values to set in the map each properties
     *  of the object will be treaded as a pair key/value
     */
    constructor(obj?: {[index: string]: T}) {
        this.map = Object.create(null);
        this.mascot = <T>{};
        if (obj) {
            Object.keys(obj).forEach(key => this.map[key] = obj[key]);
        }
    }
    
    /**
     * set a value in the map
     * @param key the key
     * @param value the value
     */
    set(key: string, value: T): void {
        this.map[key] = (typeof value === 'undefined' ? this.mascot : value);
    }
    
    /**
     * retrive a value associated to the given key
     * @param key the key to retrieve the value associated with
     */
    get(key: string): T {
        var value = this.map[key];
        return value === this.mascot ? undefined : value;
    }
    
    /**
     * delete an entry corresponding to the given key
     * @param key
     */
    delete(key: string): boolean {
        return delete this.map[key];
    }
    
    /**
     * return true if the map contains the given key
     * @param key
     */
    has(key: string): boolean {
        return typeof this.map[key] !== 'undefined';
    }
   
    /**
     * clear the map
     */
    clear(): void {
        this.map = Object.create(null);
    }
    
    /**
     * return an array containing the keys of the map
     */
    get keys() {
        return Object.keys(this.map);
    }
    
    /**
     * return an array containing the values of the map
     */
    get values() {
        return Object.keys(this.map).map(key => this.map[key]);
    }
    
    /**
     * return an array containing the entries of the map
     */
    get entries(): MapEntry<T>[] {
        return Object.keys(this.map).map(key => {
            return {
                key: key,
                value: this.map[key]
            };
        });
    }
    
    /**
     * return an object representation
     */
    toObject(): {[key: string]: T} {
        return Object.keys(this.map).reduce(
            (obj: {[key: string]: T}, key: string) => {
                obj[key] = this.map[key];
                return obj;
            }, <{[key: string]: T}>{});
    }
    
    /**
     * return a clone of the map
     */
    clone(): StringMap<T> {
        return new StringMap<T>(this.toObject());
    }
}
