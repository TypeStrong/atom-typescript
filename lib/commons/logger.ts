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
//  Logger
//
//--------------------------------------------------------------------------

/**
 * hold the configured log level
 */
var currentLogLevel: Level = Level.error;

/**
 * return true if the logging level is superior or equal to information
 */
export function information(): boolean { 
    return currentLogLevel >= Level.information; 
}

/**
 * return true if the logging level is superior or equal to debug
 */
export function debug(): boolean { 
    return currentLogLevel >= Level.debug; 
}

/**
 * return true if the logging level is superior or equal to warning
 */
export function warning(): boolean { 
    return currentLogLevel >= Level.warning; 
}


/**
 * return true if the logging level is superior or equal to error
 */
export function error(): boolean { 
    return currentLogLevel >= Level.error; 
}


/**
 * return true if the logging level is superior or equal to fatal
 */
export function fatal(): boolean { 
    return currentLogLevel >= Level.fatal; 
}

/**
 * log the given string
 */
export function log(s: string): void {
   console.log(s);
}

/**
 * Logging level
 */
export enum Level {
    fatal,
    error,
    warning,
    debug, 
    information
}

/**
 * set the current log level, accepted level are :
 *  'information',
 *  'debug', 
 *  'warning',
 *  'error',
 *  'fatal'
 */
export function setLogLevel(level: string): void {
    currentLogLevel = (<any>Level)[level];
}

/**
 * base class reusing the logger for typescript 
 */
export class LogingClass {
    information = information;
    debug = debug;
    warning = warning;
    error = error;
    fatal = fatal;
    log = log;
}

