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
 * a class implementing logic to stack operations until a service 
 * has been injected
 */
class ServiceConsumer<T>   {
    
    /**
     * callback that resolve the internal promise 
     */
    private serviceResolver: (t: T) => void;
    
    /**
     * internal promise 
     */
    private promise: Promise<T>;
    
    /**
     * constructor
     */
    constructor() {
        this.reset();
    }
    
    /**
     * inject the service
     * 
     * @param service the injected service
     */
    setService(service: T) {
        this.serviceResolver(service);
    }
    
    /**
     * @return a promise that will be resolved when the service get injected
     */
    getService(): Promise<T> {
        return this.promise;    
    }
    
    /**
     * reset the injection
     */
    reset() {
        this.promise = new Promise(resolve => this.serviceResolver = resolve);
    }
}

export = ServiceConsumer;
