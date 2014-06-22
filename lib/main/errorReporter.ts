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

//TODO that part of the application is not well tested and just 'work' it needs to be refactored

import ServiceConsumer = require('./serviceConsumer');
import immediate = require('../commons/immediate');
import IErrorService =  require('../commons/errorService');


//--------------------------------------------------------------------------
//
//  TypeScriptProject
//
//--------------------------------------------------------------------------

/**
 * TypeScript Inspection Provider
 */
class TypeScriptErrorReporter extends ServiceConsumer<IErrorService> implements brackets.InspectionProvider {
    
    /**
     * name of the error reporter
     */
    name = 'TypeScript';
    
    /**
     * scan file
     */
    scanFileAsync(content: string, path: string): JQueryPromise<{ errors: brackets.LintingError[];  aborted: boolean }> {
        return $.Deferred(deferred => {
            immediate.setImmediate(() => {
                this.getService().then(service => {
                    service.getErrorsForFile(path).then(
                        result => {
                            deferred.resolve(result);
                        },
                        () => {
                            deferred.resolve({ 
                                errors: [], 
                                aborted : false
                            });
                        }
                    );
                });    
            });
        }).promise();
    }
}

export = TypeScriptErrorReporter;
