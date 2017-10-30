"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
function mapValues(map) {
    return Object.keys(map).reduce((result, key) => {
        result.push(map[key]);
        return result;
    }, []);
}
exports.mapValues = mapValues;
/**
 * assign all properties of a list of object to an object
 * @param outerTarget the object that will receive properties
 * @param items items which properties will be assigned to a target
 */
function assign(outerTarget, ...items) {
    return items.reduce((target, source) => {
        return Object.keys(source).reduce((innerTarget, key) => {
            innerTarget[key] = source[key];
            return innerTarget;
        }, target);
    }, outerTarget);
}
exports.assign = assign;
/**
 * clone an object (shallow)
 * @param target the object to clone
 */
function clone(target) {
    return assign(Array.isArray(target) ? [] : {}, target);
}
exports.clone = clone;
/**
 * Create a quick lookup map from list
 */
function createMap(arr) {
    return arr.reduce((result, key) => {
        result[key] = true;
        return result;
    }, {});
}
exports.createMap = createMap;
/**
 * browserify path.resolve is buggy on windows
 */
function pathResolve(from, to) {
    const result = path.resolve(from, to);
    const index = result.indexOf(from[0]);
    return result.slice(index);
}
exports.pathResolve = pathResolve;
const nameExtractorRegex = /return (.*);/;
/** Get the name using a lambda so that you don't have magic strings */
function getName(nameLambda) {
    const m = nameExtractorRegex.exec(nameLambda + "");
    if (m == null) {
        throw new Error("The function does not contain a statement matching 'return variableName;'");
    }
    const access = m[1].split(".");
    return access[access.length - 1];
}
exports.getName = getName;
/** Sloppy but effective code to find distinct */
function distinct(arr) {
    const map = createMap(arr);
    return Object.keys(map);
}
exports.distinct = distinct;
//# sourceMappingURL=utils.js.map