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
//  WorkerBridge
//
//--------------------------------------------------------------------------

import utils = require('./utils');
import collections = require('./collections');
import signal = require('./signal');
import Promise = require('bluebird');

/**
 * list of operations that can be requested
 */
enum Operation {
    REQUEST,
    RESPONSE,
    ERROR,
    EXPOSE,
    SIGNAL,
}

/**
 * type of function exposed
 */
enum Type {
    FUNCTION,
    SIGNAL
}

interface Resolver {
    resolve(result: any): any;
    reject(error: any): any;
}

/**
 * create a descriptor for a map of exposed services
 * 
 * @param services
 * @param observables
 * @param baseKeys
 */
function createProxyDescriptor(services: any, signals: { [index: string]: signal.Signal<any> }, baseKeys: string[] = []) {
    if (baseKeys.length > 5) {
        return {};
    } 
    return utils.getEnumerablePropertyNames(services)
        .reduce((descriptor: any, key: string) => {
            var value = services[key],
                keys = baseKeys.concat(key);
            if (typeof value === 'function') {
                descriptor[key] = Type.FUNCTION;
            } else if (typeof value === 'object') {
                if (value instanceof signal.Signal) {
                    descriptor[key] = Type.SIGNAL;
                    signals[keys.join('.')] = value;
                } else if (!Array.isArray(value)) {
                    descriptor[key] = createProxyDescriptor(value, signals, keys);
                }
            }
            return descriptor;
        }, {});
}

var uidHelper = 0;
/**
 * create a query factory for a proxied service method
 */
function newQuery(chain: string[], sendMessage: (args: any) => void, resolverMap: collections.StringMap<Resolver>): any {
    return (...args: any []) => {
        var uid = 'operation' + (uidHelper++);
        sendMessage({
            operation: Operation.REQUEST,
            chain: chain,
            args: args,
            uid: uid
        });
        return new Promise((resolve, reject) => {
            resolverMap.set(uid, {
                resolve: resolve,
                reject: reject
            });
        });
    };
}


/**
 * create proxy from proxy descriptor
 */
function createProxy(descriptor: any, sendMessage: (args: any) => void, 
        resolverMap: collections.StringMap<Resolver>, baseKeys: string[] = []): any {
    return Object.keys(descriptor)
        .reduce((proxy: any, key: string) => {
            var value = descriptor[key],
                keys = baseKeys.concat(key);
            if (value === Type.FUNCTION) {
                proxy[key] = newQuery(keys, sendMessage, resolverMap);
            } else if (value === Type.SIGNAL) {
                proxy[key] = new signal.Signal();
            } else if (typeof value === 'object') {
                proxy[key] = createProxy(descriptor[key], sendMessage, resolverMap, keys);
            }
            return proxy;
        }, {});
}

/**
 * a simple bridge that will expose services from the 2 sides of a web worker
 */
class WorkerBridge {
    
    private signals: { signal: signal.Signal<any>; handler: (value: any) => void }[]; 

    /**
     * stack of deferred bound to a requres
     */
    private resolverMap = new collections.StringMap<Resolver>();
    
    /**
     * deffered tracking sate
     */
    private initResolver: Resolver;
    
    /**
     * @private
     * exposed services
     */
    private services: any;
    
    /**
     * build proxy of the bridge
     */
    proxy: any;
    
    constructor(
        /**
         * target
         */
        private target: WorkerBridge.MessageTarget
    ) {}
    
    /**
     * initialize te bridge, return a promise that resolve to the created proxy 
     * @param services the exposed services
     */
    init(services: any): Promise<any> {
        this.services = services;
        return new Promise((resolve, reject) => {
            var target = this.target;
            target.onmessage = this.messageHandler;

            var signals: { [index: string]: signal.Signal<any> } = {};
            target.postMessage({
                operation : Operation.EXPOSE,
                descriptor: createProxyDescriptor(services, signals)
            });
            
            

            this.signals =  Object.keys(signals).map(key => {
                var signal = signals[key];
                var handler = (value: any) => {
                    target.postMessage({ 
                        operation: Operation.SIGNAL, 
                        chain: key.split('.') , 
                        value: value
                    });
                };
                signal.add(handler);
                return { 
                    signal: signal, 
                    handler: handler
                };    
            });    
            
            this.initResolver = {resolve: resolve, reject: reject};
        });

    }
    
    /**
     * dispose the bridge
     */
    dispose() {
        this.signals.forEach(signalDesc => signalDesc.signal.remove(signalDesc.handler));
        this.target.onmessage = null;
    }
    
    /**
     * message handler
     */
    private messageHandler = (message: WorkerBridge.Message) =>  {
        var data = message.data;
        switch (data.operation) {
            case Operation.EXPOSE:
                this.proxy = createProxy(
                    data.descriptor,  
                    (args: any) => this.target.postMessage(args), 
                    this.resolverMap
                );

                this.initResolver.resolve(this.proxy);
                break;

            case Operation.REQUEST:
                new Promise(resolve => {
                    var chain: string[] = data.chain.slice(),
                        thisObject: any = null,
                        method: any = this.services;
                    while (chain.length) {
                        thisObject = method;
                        method = method[chain.shift()];
                    }
                    resolve(method.apply(thisObject, data.args));
                }).then(result => {
                    this.target.postMessage({
                        operation: Operation.RESPONSE,
                        chain: data.chain,
                        result: result,
                        uid: data.uid
                    });
                }, (error?) => {
                    this.target.postMessage({
                        operation: Operation.ERROR,
                        chain: data.chain,
                        errorMessage: error instanceof Error ? error.message : error,
                        uid: data.uid
                    });
                });

                break;

            case Operation.RESPONSE:
                var responseDeferred = this.resolverMap.get(data.uid);
                responseDeferred.resolve(data.result);
                this.resolverMap.delete(data.uid);
                break;

            case Operation.ERROR:
                var errorDeferred = this.resolverMap.get(data.uid);
                errorDeferred.reject(new Error(data.errorMessage));
                this.resolverMap.delete(data.uid);
                break;
                
            default:
                var chain: string[] = data.chain.slice(),
                    signal: signal.Signal<any> = this.proxy;
                while (chain.length) {
                    signal = (<any>signal)[chain.shift()];
                }
                signal.dispatch(data.value);
        }
    };
}



module WorkerBridge {
    export interface MessageTarget {
        postMessage(message: any): void;
        onmessage: (event: Message) => void;
    }
    
    export interface Message {
        data: any
    }
}

export = WorkerBridge;
