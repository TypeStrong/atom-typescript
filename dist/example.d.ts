// Type definitions for mixto
// Project: https://github.com/atom/mixto
// Definitions by: vvakame <https://github.com/vvakame/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare module Mixto {
	interface IMixinStatic {
		includeInto(constructor:any):void;
		extend(object:any):void;
	}
}

declare module "mixto" {
	var _tmp:Mixto.IMixinStatic;
	export = _tmp;
}
// Type definitions for emissary
// Project: https://github.com/atom/emissary
// Definitions by: vvakame <https://github.com/vvakame/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/// <reference path="../mixto/mixto.d.ts" />

declare module Emissary {
	interface IEmitterStatic extends Mixto.IMixinStatic {
		new ():IEmitter;
	}

	interface IEmitter {
		on(eventNames:string, handler:Function):any; // return value type are Signal
		once(eventName:string, handler:Function):any; // return value type are Signal
		signal(eventName:string):void;
		behavior(eventName:string, initialValue:any):void;
		emit(eventName:string, ...args:any[]):void;
		off(eventNames:string, handler:Function):void;
		pauseEvents(eventNames:string):void;
		resumeEvents(eventNames:string):void;
		incrementSubscriptionCount(eventName:string):number;
		decrementSubscriptionCount(eventName:string):number;
		getSubscriptionCount(eventName:string):number;
		hasSubscriptions(eventName:string):boolean;
	}

	interface ISubscriberStatic extends Mixto.IMixinStatic {
		new ():ISubscriber;
	}

	interface ISubscriber {
		subscribeWith(eventEmitter:any, methodName:string, args:any):ISubscription;

		addSubscription(subscription:any):ISubscription;

		subscribe(eventEmitterOrSubscription:any, ...args:any[]):ISubscription;

		subscribeToCommand(eventEmitter:any, ...args:any[]):ISubscription;

		unsubscribe(object?:any):any;
	}

	interface ISubscriptionStatic {
		new (emitter: any, eventNames:string, handler:Function):ISubscription;
	}

	interface ISubscription extends IEmitter {
		cancelled:boolean;

		off():any;
	}
}

declare module "emissary" {
	var Emitter:Emissary.IEmitterStatic;
	var Subscriber:Emissary.ISubscriberStatic;
	var Signal:Function;   // TODO
	var Behavior:Function; // TODO
	var combine:Function;  // TODO
}
// Type definitions for Node.js v0.12.0
// Project: http://nodejs.org/
// Definitions by: Microsoft TypeScript <http://typescriptlang.org>, DefinitelyTyped <https://github.com/borisyankov/DefinitelyTyped>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/************************************************
*                                               *
*               Node.js v0.12.0 API             *
*                                               *
************************************************/

/************************************************
*                                               *
*                   GLOBAL                      *
*                                               *
************************************************/
declare var process: NodeJS.Process;
declare var global: any;

declare var __filename: string;
declare var __dirname: string;

declare function setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timer;
declare function clearTimeout(timeoutId: NodeJS.Timer): void;
declare function setInterval(callback: (...args: any[]) => void, ms: number, ...args: any[]): NodeJS.Timer;
declare function clearInterval(intervalId: NodeJS.Timer): void;
declare function setImmediate(callback: (...args: any[]) => void, ...args: any[]): any;
declare function clearImmediate(immediateId: any): void;

declare var require: {
    (id: string): any;
    resolve(id:string): string;
    cache: any;
    extensions: any;
    main: any;
};

declare var module: {
    exports: any;
    require(id: string): any;
    id: string;
    filename: string;
    loaded: boolean;
    parent: any;
    children: any[];
};

// Same as module.exports
declare var exports: any;
declare var SlowBuffer: {
    new (str: string, encoding?: string): Buffer;
    new (size: number): Buffer;
    new (size: Uint8Array): Buffer;
    new (array: any[]): Buffer;
    prototype: Buffer;
    isBuffer(obj: any): boolean;
    byteLength(string: string, encoding?: string): number;
    concat(list: Buffer[], totalLength?: number): Buffer;
};


// Buffer class
interface Buffer extends NodeBuffer {}
declare var Buffer: {
    new (str: string, encoding?: string): Buffer;
    new (size: number): Buffer;
    new (size: Uint8Array): Buffer;
    new (array: any[]): Buffer;
    prototype: Buffer;
    isBuffer(obj: any): boolean;
    byteLength(string: string, encoding?: string): number;
    concat(list: Buffer[], totalLength?: number): Buffer;
};

/************************************************
*                                               *
*               GLOBAL INTERFACES               *
*                                               *
************************************************/
declare module NodeJS {
    export interface ErrnoException extends Error {
        errno?: any;
        code?: string;
        path?: string;
        syscall?: string;
    }

    export interface EventEmitter {
        addListener(event: string, listener: Function): EventEmitter;
        on(event: string, listener: Function): EventEmitter;
        once(event: string, listener: Function): EventEmitter;
        removeListener(event: string, listener: Function): EventEmitter;
        removeAllListeners(event?: string): EventEmitter;
        setMaxListeners(n: number): void;
        listeners(event: string): Function[];
        emit(event: string, ...args: any[]): boolean;
    }

    export interface ReadableStream extends EventEmitter {
        readable: boolean;
        read(size?: number): any;
        setEncoding(encoding: string): void;
        pause(): void;
        resume(): void;
        pipe<T extends WritableStream>(destination: T, options?: { end?: boolean; }): T;
        unpipe<T extends WritableStream>(destination?: T): void;
        unshift(chunk: string): void;
        unshift(chunk: Buffer): void;
        wrap(oldStream: ReadableStream): ReadableStream;
    }

    export interface WritableStream extends EventEmitter {
        writable: boolean;
        write(buffer: Buffer, cb?: Function): boolean;
        write(str: string, cb?: Function): boolean;
        write(str: string, encoding?: string, cb?: Function): boolean;
        end(): void;
        end(buffer: Buffer, cb?: Function): void;
        end(str: string, cb?: Function): void;
        end(str: string, encoding?: string, cb?: Function): void;
    }

    export interface ReadWriteStream extends ReadableStream, WritableStream {}

    export interface Process extends EventEmitter {
        stdout: WritableStream;
        stderr: WritableStream;
        stdin: ReadableStream;
        argv: string[];
        execPath: string;
        abort(): void;
        chdir(directory: string): void;
        cwd(): string;
        env: any;
        exit(code?: number): void;
        getgid(): number;
        setgid(id: number): void;
        setgid(id: string): void;
        getuid(): number;
        setuid(id: number): void;
        setuid(id: string): void;
        version: string;
        versions: {
            http_parser: string;
            node: string;
            v8: string;
            ares: string;
            uv: string;
            zlib: string;
            openssl: string;
        };
        config: {
            target_defaults: {
                cflags: any[];
                default_configuration: string;
                defines: string[];
                include_dirs: string[];
                libraries: string[];
            };
            variables: {
                clang: number;
                host_arch: string;
                node_install_npm: boolean;
                node_install_waf: boolean;
                node_prefix: string;
                node_shared_openssl: boolean;
                node_shared_v8: boolean;
                node_shared_zlib: boolean;
                node_use_dtrace: boolean;
                node_use_etw: boolean;
                node_use_openssl: boolean;
                target_arch: string;
                v8_no_strict_aliasing: number;
                v8_use_snapshot: boolean;
                visibility: string;
            };
        };
        kill(pid: number, signal?: string): void;
        pid: number;
        title: string;
        arch: string;
        platform: string;
        memoryUsage(): { rss: number; heapTotal: number; heapUsed: number; };
        nextTick(callback: Function): void;
        umask(mask?: number): number;
        uptime(): number;
        hrtime(time?:number[]): number[];

        // Worker
        send?(message: any, sendHandle?: any): void;
    }

    export interface Timer {
        ref() : void;
        unref() : void;
    }
}

/**
 * @deprecated
 */
interface NodeBuffer {
    [index: number]: number;
    write(string: string, offset?: number, length?: number, encoding?: string): number;
    toString(encoding?: string, start?: number, end?: number): string;
    toJSON(): any;
    length: number;
    copy(targetBuffer: Buffer, targetStart?: number, sourceStart?: number, sourceEnd?: number): number;
    slice(start?: number, end?: number): Buffer;
    readUInt8(offset: number, noAsset?: boolean): number;
    readUInt16LE(offset: number, noAssert?: boolean): number;
    readUInt16BE(offset: number, noAssert?: boolean): number;
    readUInt32LE(offset: number, noAssert?: boolean): number;
    readUInt32BE(offset: number, noAssert?: boolean): number;
    readInt8(offset: number, noAssert?: boolean): number;
    readInt16LE(offset: number, noAssert?: boolean): number;
    readInt16BE(offset: number, noAssert?: boolean): number;
    readInt32LE(offset: number, noAssert?: boolean): number;
    readInt32BE(offset: number, noAssert?: boolean): number;
    readFloatLE(offset: number, noAssert?: boolean): number;
    readFloatBE(offset: number, noAssert?: boolean): number;
    readDoubleLE(offset: number, noAssert?: boolean): number;
    readDoubleBE(offset: number, noAssert?: boolean): number;
    writeUInt8(value: number, offset: number, noAssert?: boolean): void;
    writeUInt16LE(value: number, offset: number, noAssert?: boolean): void;
    writeUInt16BE(value: number, offset: number, noAssert?: boolean): void;
    writeUInt32LE(value: number, offset: number, noAssert?: boolean): void;
    writeUInt32BE(value: number, offset: number, noAssert?: boolean): void;
    writeInt8(value: number, offset: number, noAssert?: boolean): void;
    writeInt16LE(value: number, offset: number, noAssert?: boolean): void;
    writeInt16BE(value: number, offset: number, noAssert?: boolean): void;
    writeInt32LE(value: number, offset: number, noAssert?: boolean): void;
    writeInt32BE(value: number, offset: number, noAssert?: boolean): void;
    writeFloatLE(value: number, offset: number, noAssert?: boolean): void;
    writeFloatBE(value: number, offset: number, noAssert?: boolean): void;
    writeDoubleLE(value: number, offset: number, noAssert?: boolean): void;
    writeDoubleBE(value: number, offset: number, noAssert?: boolean): void;
    fill(value: any, offset?: number, end?: number): void;
}

/************************************************
*                                               *
*                   MODULES                     *
*                                               *
************************************************/
declare module "buffer" {
    export var INSPECT_MAX_BYTES: number;
}

declare module "querystring" {
    export function stringify(obj: any, sep?: string, eq?: string): string;
    export function parse(str: string, sep?: string, eq?: string, options?: { maxKeys?: number; }): any;
    export function escape(str: string): string;
    export function unescape(str: string): string;
}

declare module "events" {
    export class EventEmitter implements NodeJS.EventEmitter {
        static listenerCount(emitter: EventEmitter, event: string): number;

        addListener(event: string, listener: Function): EventEmitter;
        on(event: string, listener: Function): EventEmitter;
        once(event: string, listener: Function): EventEmitter;
        removeListener(event: string, listener: Function): EventEmitter;
        removeAllListeners(event?: string): EventEmitter;
        setMaxListeners(n: number): void;
        listeners(event: string): Function[];
        emit(event: string, ...args: any[]): boolean;
   }
}

declare module "http" {
    import events = require("events");
    import net = require("net");
    import stream = require("stream");

    export interface Server extends events.EventEmitter {
        listen(port: number, hostname?: string, backlog?: number, callback?: Function): Server;
        listen(path: string, callback?: Function): Server;
        listen(handle: any, listeningListener?: Function): Server;
        close(cb?: any): Server;
        address(): { port: number; family: string; address: string; };
        maxHeadersCount: number;
    }
    export interface ServerRequest extends events.EventEmitter, stream.Readable {
        method: string;
        url: string;
        headers: any;
        trailers: string;
        httpVersion: string;
        setEncoding(encoding?: string): void;
        pause(): void;
        resume(): void;
        connection: net.Socket;
    }
    export interface ServerResponse extends events.EventEmitter, stream.Writable {
        // Extended base methods
        write(buffer: Buffer): boolean;
        write(buffer: Buffer, cb?: Function): boolean;
        write(str: string, cb?: Function): boolean;
        write(str: string, encoding?: string, cb?: Function): boolean;
        write(str: string, encoding?: string, fd?: string): boolean;

        writeContinue(): void;
        writeHead(statusCode: number, reasonPhrase?: string, headers?: any): void;
        writeHead(statusCode: number, headers?: any): void;
        statusCode: number;
        setHeader(name: string, value: string): void;
        sendDate: boolean;
        getHeader(name: string): string;
        removeHeader(name: string): void;
        write(chunk: any, encoding?: string): any;
        addTrailers(headers: any): void;

        // Extended base methods
        end(): void;
        end(buffer: Buffer, cb?: Function): void;
        end(str: string, cb?: Function): void;
        end(str: string, encoding?: string, cb?: Function): void;
        end(data?: any, encoding?: string): void;
    }
    export interface ClientRequest extends events.EventEmitter, stream.Writable {
        // Extended base methods
        write(buffer: Buffer): boolean;
        write(buffer: Buffer, cb?: Function): boolean;
        write(str: string, cb?: Function): boolean;
        write(str: string, encoding?: string, cb?: Function): boolean;
        write(str: string, encoding?: string, fd?: string): boolean;

        write(chunk: any, encoding?: string): void;
        abort(): void;
        setTimeout(timeout: number, callback?: Function): void;
        setNoDelay(noDelay?: boolean): void;
        setSocketKeepAlive(enable?: boolean, initialDelay?: number): void;

        // Extended base methods
        end(): void;
        end(buffer: Buffer, cb?: Function): void;
        end(str: string, cb?: Function): void;
        end(str: string, encoding?: string, cb?: Function): void;
        end(data?: any, encoding?: string): void;
    }
    export interface ClientResponse extends events.EventEmitter, stream.Readable {
        statusCode: number;
        httpVersion: string;
        headers: any;
        trailers: any;
        setEncoding(encoding?: string): void;
        pause(): void;
        resume(): void;
    }

	export interface AgentOptions {
		/**
		 * Keep sockets around in a pool to be used by other requests in the future. Default = false
		 */
		keepAlive?: boolean;
		/**
		 * When using HTTP KeepAlive, how often to send TCP KeepAlive packets over sockets being kept alive. Default = 1000.
		 * Only relevant if keepAlive is set to true.
		 */
		keepAliveMsecs?: number;
		/**
		 * Maximum number of sockets to allow per host. Default for Node 0.10 is 5, default for Node 0.12 is Infinity
		 */
		maxSockets?: number;
		/**
		 * Maximum number of sockets to leave open in a free state. Only relevant if keepAlive is set to true. Default = 256.
		 */
		maxFreeSockets?: number;
	}

    export class Agent {
		maxSockets: number;
		sockets: any;
		requests: any;

		constructor(opts?: AgentOptions);

		/**
		 * Destroy any sockets that are currently in use by the agent.
		 * It is usually not necessary to do this. However, if you are using an agent with KeepAlive enabled,
		 * then it is best to explicitly shut down the agent when you know that it will no longer be used. Otherwise,
		 * sockets may hang open for quite a long time before the server terminates them.
		 */
		destroy(): void;
	}

    export var STATUS_CODES: {
        [errorCode: number]: string;
        [errorCode: string]: string;
    };
    export function createServer(requestListener?: (request: ServerRequest, response: ServerResponse) =>void ): Server;
    export function createClient(port?: number, host?: string): any;
    export function request(options: any, callback?: Function): ClientRequest;
    export function get(options: any, callback?: Function): ClientRequest;
    export var globalAgent: Agent;
}

declare module "cluster" {
    import child  = require("child_process");
    import events = require("events");

    export interface ClusterSettings {
        exec?: string;
        args?: string[];
        silent?: boolean;
    }

    export class Worker extends events.EventEmitter {
        id: string;
        process: child.ChildProcess;
        suicide: boolean;
        send(message: any, sendHandle?: any): void;
        kill(signal?: string): void;
        destroy(signal?: string): void;
        disconnect(): void;
    }

    export var settings: ClusterSettings;
    export var isMaster: boolean;
    export var isWorker: boolean;
    export function setupMaster(settings?: ClusterSettings): void;
    export function fork(env?: any): Worker;
    export function disconnect(callback?: Function): void;
    export var worker: Worker;
    export var workers: Worker[];

    // Event emitter
    export function addListener(event: string, listener: Function): void;
    export function on(event: string, listener: Function): any;
    export function once(event: string, listener: Function): void;
    export function removeListener(event: string, listener: Function): void;
    export function removeAllListeners(event?: string): void;
    export function setMaxListeners(n: number): void;
    export function listeners(event: string): Function[];
    export function emit(event: string, ...args: any[]): boolean;
}

declare module "zlib" {
    import stream = require("stream");
    export interface ZlibOptions { chunkSize?: number; windowBits?: number; level?: number; memLevel?: number; strategy?: number; dictionary?: any; }

    export interface Gzip extends stream.Transform { }
    export interface Gunzip extends stream.Transform { }
    export interface Deflate extends stream.Transform { }
    export interface Inflate extends stream.Transform { }
    export interface DeflateRaw extends stream.Transform { }
    export interface InflateRaw extends stream.Transform { }
    export interface Unzip extends stream.Transform { }

    export function createGzip(options?: ZlibOptions): Gzip;
    export function createGunzip(options?: ZlibOptions): Gunzip;
    export function createDeflate(options?: ZlibOptions): Deflate;
    export function createInflate(options?: ZlibOptions): Inflate;
    export function createDeflateRaw(options?: ZlibOptions): DeflateRaw;
    export function createInflateRaw(options?: ZlibOptions): InflateRaw;
    export function createUnzip(options?: ZlibOptions): Unzip;

    export function deflate(buf: Buffer, callback: (error: Error, result: any) =>void ): void;
    export function deflateRaw(buf: Buffer, callback: (error: Error, result: any) =>void ): void;
    export function gzip(buf: Buffer, callback: (error: Error, result: any) =>void ): void;
    export function gunzip(buf: Buffer, callback: (error: Error, result: any) =>void ): void;
    export function inflate(buf: Buffer, callback: (error: Error, result: any) =>void ): void;
    export function inflateRaw(buf: Buffer, callback: (error: Error, result: any) =>void ): void;
    export function unzip(buf: Buffer, callback: (error: Error, result: any) =>void ): void;

    // Constants
    export var Z_NO_FLUSH: number;
    export var Z_PARTIAL_FLUSH: number;
    export var Z_SYNC_FLUSH: number;
    export var Z_FULL_FLUSH: number;
    export var Z_FINISH: number;
    export var Z_BLOCK: number;
    export var Z_TREES: number;
    export var Z_OK: number;
    export var Z_STREAM_END: number;
    export var Z_NEED_DICT: number;
    export var Z_ERRNO: number;
    export var Z_STREAM_ERROR: number;
    export var Z_DATA_ERROR: number;
    export var Z_MEM_ERROR: number;
    export var Z_BUF_ERROR: number;
    export var Z_VERSION_ERROR: number;
    export var Z_NO_COMPRESSION: number;
    export var Z_BEST_SPEED: number;
    export var Z_BEST_COMPRESSION: number;
    export var Z_DEFAULT_COMPRESSION: number;
    export var Z_FILTERED: number;
    export var Z_HUFFMAN_ONLY: number;
    export var Z_RLE: number;
    export var Z_FIXED: number;
    export var Z_DEFAULT_STRATEGY: number;
    export var Z_BINARY: number;
    export var Z_TEXT: number;
    export var Z_ASCII: number;
    export var Z_UNKNOWN: number;
    export var Z_DEFLATED: number;
    export var Z_NULL: number;
}

declare module "os" {
    export function tmpdir(): string;
    export function hostname(): string;
    export function type(): string;
    export function platform(): string;
    export function arch(): string;
    export function release(): string;
    export function uptime(): number;
    export function loadavg(): number[];
    export function totalmem(): number;
    export function freemem(): number;
    export function cpus(): { model: string; speed: number; times: { user: number; nice: number; sys: number; idle: number; irq: number; }; }[];
    export function networkInterfaces(): any;
    export var EOL: string;
}

declare module "https" {
    import tls = require("tls");
    import events = require("events");
    import http = require("http");

    export interface ServerOptions {
        pfx?: any;
        key?: any;
        passphrase?: string;
        cert?: any;
        ca?: any;
        crl?: any;
        ciphers?: string;
        honorCipherOrder?: boolean;
        requestCert?: boolean;
        rejectUnauthorized?: boolean;
        NPNProtocols?: any;
        SNICallback?: (servername: string) => any;
    }

    export interface RequestOptions {
        host?: string;
        hostname?: string;
        port?: number;
        path?: string;
        method?: string;
        headers?: any;
        auth?: string;
        agent?: any;
        pfx?: any;
        key?: any;
        passphrase?: string;
        cert?: any;
        ca?: any;
        ciphers?: string;
        rejectUnauthorized?: boolean;
    }

    export interface Agent {
        maxSockets: number;
        sockets: any;
        requests: any;
    }
    export var Agent: {
        new (options?: RequestOptions): Agent;
    };
    export interface Server extends tls.Server { }
    export function createServer(options: ServerOptions, requestListener?: Function): Server;
    export function request(options: RequestOptions, callback?: (res: http.ClientResponse) =>void ): http.ClientRequest;
    export function get(options: RequestOptions, callback?: (res: http.ClientResponse) =>void ): http.ClientRequest;
    export var globalAgent: Agent;
}

declare module "punycode" {
    export function decode(string: string): string;
    export function encode(string: string): string;
    export function toUnicode(domain: string): string;
    export function toASCII(domain: string): string;
    export var ucs2: ucs2;
    interface ucs2 {
        decode(string: string): string;
        encode(codePoints: number[]): string;
    }
    export var version: any;
}

declare module "repl" {
    import stream = require("stream");
    import events = require("events");

    export interface ReplOptions {
        prompt?: string;
        input?: NodeJS.ReadableStream;
        output?: NodeJS.WritableStream;
        terminal?: boolean;
        eval?: Function;
        useColors?: boolean;
        useGlobal?: boolean;
        ignoreUndefined?: boolean;
        writer?: Function;
    }
    export function start(options: ReplOptions): events.EventEmitter;
}

declare module "readline" {
    import events = require("events");
    import stream = require("stream");

    export interface ReadLine extends events.EventEmitter {
        setPrompt(prompt: string, length: number): void;
        prompt(preserveCursor?: boolean): void;
        question(query: string, callback: Function): void;
        pause(): void;
        resume(): void;
        close(): void;
        write(data: any, key?: any): void;
    }
    export interface ReadLineOptions {
        input: NodeJS.ReadableStream;
        output: NodeJS.WritableStream;
        completer?: Function;
        terminal?: boolean;
    }
    export function createInterface(options: ReadLineOptions): ReadLine;
}

declare module "vm" {
    export interface Context { }
    export interface Script {
        runInThisContext(): void;
        runInNewContext(sandbox?: Context): void;
    }
    export function runInThisContext(code: string, filename?: string): void;
    export function runInNewContext(code: string, sandbox?: Context, filename?: string): void;
    export function runInContext(code: string, context: Context, filename?: string): void;
    export function createContext(initSandbox?: Context): Context;
    export function createScript(code: string, filename?: string): Script;
}

declare module "child_process" {
    import events = require("events");
    import stream = require("stream");

    export interface ChildProcess extends events.EventEmitter {
        stdin:  stream.Writable;
        stdout: stream.Readable;
        stderr: stream.Readable;
        pid: number;
        kill(signal?: string): void;
        send(message: any, sendHandle?: any): void;
        disconnect(): void;
    }

    export function spawn(command: string, args?: string[], options?: {
        cwd?: string;
        stdio?: any;
        custom?: any;
        env?: any;
        detached?: boolean;
    }): ChildProcess;
    export function exec(command: string, options: {
        cwd?: string;
        stdio?: any;
        customFds?: any;
        env?: any;
        encoding?: string;
        timeout?: number;
        maxBuffer?: number;
        killSignal?: string;
    }, callback: (error: Error, stdout: Buffer, stderr: Buffer) =>void ): ChildProcess;
    export function exec(command: string, callback: (error: Error, stdout: Buffer, stderr: Buffer) =>void ): ChildProcess;
    export function execFile(file: string,
        callback?: (error: Error, stdout: Buffer, stderr: Buffer) =>void ): ChildProcess;
    export function execFile(file: string, args?: string[],
        callback?: (error: Error, stdout: Buffer, stderr: Buffer) =>void ): ChildProcess;
    export function execFile(file: string, args?: string[], options?: {
        cwd?: string;
        stdio?: any;
        customFds?: any;
        env?: any;
        encoding?: string;
        timeout?: number;
        maxBuffer?: string;
        killSignal?: string;
    }, callback?: (error: Error, stdout: Buffer, stderr: Buffer) =>void ): ChildProcess;
    export function fork(modulePath: string, args?: string[], options?: {
        cwd?: string;
        env?: any;
        encoding?: string;
    }): ChildProcess;
    export function execSync(command: string, options?: {
        cwd?: string;
        input?: string|Buffer;
        stdio?: any;
        env?: any;
        uid?: number;
        gid?: number;
        timeout?: number;
        maxBuffer?: number;
        killSignal?: string;
        encoding?: string;
    }): ChildProcess;
}

declare module "url" {
    export interface Url {
        href: string;
        protocol: string;
        auth: string;
        hostname: string;
        port: string;
        host: string;
        pathname: string;
        search: string;
        query: any; // string | Object
        slashes: boolean;
        hash?: string;
        path?: string;
    }

    export interface UrlOptions {
        protocol?: string;
        auth?: string;
        hostname?: string;
        port?: string;
        host?: string;
        pathname?: string;
        search?: string;
        query?: any;
        hash?: string;
        path?: string;
    }

    export function parse(urlStr: string, parseQueryString?: boolean , slashesDenoteHost?: boolean ): Url;
    export function format(url: UrlOptions): string;
    export function resolve(from: string, to: string): string;
}

declare module "dns" {
    export function lookup(domain: string, family: number, callback: (err: Error, address: string, family: number) =>void ): string;
    export function lookup(domain: string, callback: (err: Error, address: string, family: number) =>void ): string;
    export function resolve(domain: string, rrtype: string, callback: (err: Error, addresses: string[]) =>void ): string[];
    export function resolve(domain: string, callback: (err: Error, addresses: string[]) =>void ): string[];
    export function resolve4(domain: string, callback: (err: Error, addresses: string[]) =>void ): string[];
    export function resolve6(domain: string, callback: (err: Error, addresses: string[]) =>void ): string[];
    export function resolveMx(domain: string, callback: (err: Error, addresses: string[]) =>void ): string[];
    export function resolveTxt(domain: string, callback: (err: Error, addresses: string[]) =>void ): string[];
    export function resolveSrv(domain: string, callback: (err: Error, addresses: string[]) =>void ): string[];
    export function resolveNs(domain: string, callback: (err: Error, addresses: string[]) =>void ): string[];
    export function resolveCname(domain: string, callback: (err: Error, addresses: string[]) =>void ): string[];
    export function reverse(ip: string, callback: (err: Error, domains: string[]) =>void ): string[];
}

declare module "net" {
    import stream = require("stream");

    export interface Socket extends stream.Duplex {
        // Extended base methods
        write(buffer: Buffer): boolean;
        write(buffer: Buffer, cb?: Function): boolean;
        write(str: string, cb?: Function): boolean;
        write(str: string, encoding?: string, cb?: Function): boolean;
        write(str: string, encoding?: string, fd?: string): boolean;

        connect(port: number, host?: string, connectionListener?: Function): void;
        connect(path: string, connectionListener?: Function): void;
        bufferSize: number;
        setEncoding(encoding?: string): void;
        write(data: any, encoding?: string, callback?: Function): void;
        destroy(): void;
        pause(): void;
        resume(): void;
        setTimeout(timeout: number, callback?: Function): void;
        setNoDelay(noDelay?: boolean): void;
        setKeepAlive(enable?: boolean, initialDelay?: number): void;
        address(): { port: number; family: string; address: string; };
        unref(): void;
        ref(): void;

        remoteAddress: string;
        remotePort: number;
        bytesRead: number;
        bytesWritten: number;

        // Extended base methods
        end(): void;
        end(buffer: Buffer, cb?: Function): void;
        end(str: string, cb?: Function): void;
        end(str: string, encoding?: string, cb?: Function): void;
        end(data?: any, encoding?: string): void;
    }

    export var Socket: {
        new (options?: { fd?: string; type?: string; allowHalfOpen?: boolean; }): Socket;
    };

    export interface Server extends Socket {
        listen(port: number, host?: string, backlog?: number, listeningListener?: Function): Server;
        listen(path: string, listeningListener?: Function): Server;
        listen(handle: any, listeningListener?: Function): Server;
        close(callback?: Function): Server;
        address(): { port: number; family: string; address: string; };
        maxConnections: number;
        connections: number;
    }
    export function createServer(connectionListener?: (socket: Socket) =>void ): Server;
    export function createServer(options?: { allowHalfOpen?: boolean; }, connectionListener?: (socket: Socket) =>void ): Server;
    export function connect(options: { allowHalfOpen?: boolean; }, connectionListener?: Function): Socket;
    export function connect(port: number, host?: string, connectionListener?: Function): Socket;
    export function connect(path: string, connectionListener?: Function): Socket;
    export function createConnection(options: { allowHalfOpen?: boolean; }, connectionListener?: Function): Socket;
    export function createConnection(port: number, host?: string, connectionListener?: Function): Socket;
    export function createConnection(path: string, connectionListener?: Function): Socket;
    export function isIP(input: string): number;
    export function isIPv4(input: string): boolean;
    export function isIPv6(input: string): boolean;
}

declare module "dgram" {
    import events = require("events");

    interface RemoteInfo {
        address: string;
        port: number;
        size: number;
    }

    interface AddressInfo {
        address: string;
        family: string;
        port: number;
    }

    export function createSocket(type: string, callback?: (msg: Buffer, rinfo: RemoteInfo) => void): Socket;

    interface Socket extends events.EventEmitter {
        send(buf: Buffer, offset: number, length: number, port: number, address: string, callback?: (error: Error, bytes: number) => void): void;
        bind(port: number, address?: string, callback?: () => void): void;
        close(): void;
        address(): AddressInfo;
        setBroadcast(flag: boolean): void;
        setMulticastTTL(ttl: number): void;
        setMulticastLoopback(flag: boolean): void;
        addMembership(multicastAddress: string, multicastInterface?: string): void;
        dropMembership(multicastAddress: string, multicastInterface?: string): void;
    }
}

declare module "fs" {
    import stream = require("stream");
    import events = require("events");

    interface Stats {
        isFile(): boolean;
        isDirectory(): boolean;
        isBlockDevice(): boolean;
        isCharacterDevice(): boolean;
        isSymbolicLink(): boolean;
        isFIFO(): boolean;
        isSocket(): boolean;
        dev: number;
        ino: number;
        mode: number;
        nlink: number;
        uid: number;
        gid: number;
        rdev: number;
        size: number;
        blksize: number;
        blocks: number;
        atime: Date;
        mtime: Date;
        ctime: Date;
    }

    interface FSWatcher extends events.EventEmitter {
        close(): void;
    }

    export interface ReadStream extends stream.Readable {
        close(): void;
    }
    export interface WriteStream extends stream.Writable {
        close(): void;
    }

    export function rename(oldPath: string, newPath: string, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function renameSync(oldPath: string, newPath: string): void;
    export function truncate(path: string, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function truncate(path: string, len: number, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function truncateSync(path: string, len?: number): void;
    export function ftruncate(fd: number, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function ftruncate(fd: number, len: number, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function ftruncateSync(fd: number, len?: number): void;
    export function chown(path: string, uid: number, gid: number, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function chownSync(path: string, uid: number, gid: number): void;
    export function fchown(fd: number, uid: number, gid: number, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function fchownSync(fd: number, uid: number, gid: number): void;
    export function lchown(path: string, uid: number, gid: number, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function lchownSync(path: string, uid: number, gid: number): void;
    export function chmod(path: string, mode: number, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function chmod(path: string, mode: string, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function chmodSync(path: string, mode: number): void;
    export function chmodSync(path: string, mode: string): void;
    export function fchmod(fd: number, mode: number, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function fchmod(fd: number, mode: string, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function fchmodSync(fd: number, mode: number): void;
    export function fchmodSync(fd: number, mode: string): void;
    export function lchmod(path: string, mode: number, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function lchmod(path: string, mode: string, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function lchmodSync(path: string, mode: number): void;
    export function lchmodSync(path: string, mode: string): void;
    export function stat(path: string, callback?: (err: NodeJS.ErrnoException, stats: Stats) => any): void;
    export function lstat(path: string, callback?: (err: NodeJS.ErrnoException, stats: Stats) => any): void;
    export function fstat(fd: number, callback?: (err: NodeJS.ErrnoException, stats: Stats) => any): void;
    export function statSync(path: string): Stats;
    export function lstatSync(path: string): Stats;
    export function fstatSync(fd: number): Stats;
    export function link(srcpath: string, dstpath: string, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function linkSync(srcpath: string, dstpath: string): void;
    export function symlink(srcpath: string, dstpath: string, type?: string, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function symlinkSync(srcpath: string, dstpath: string, type?: string): void;
    export function readlink(path: string, callback?: (err: NodeJS.ErrnoException, linkString: string) => any): void;
    export function readlinkSync(path: string): string;
    export function realpath(path: string, callback?: (err: NodeJS.ErrnoException, resolvedPath: string) => any): void;
    export function realpath(path: string, cache: {[path: string]: string}, callback: (err: NodeJS.ErrnoException, resolvedPath: string) =>any): void;
    export function realpathSync(path: string, cache?: {[path: string]: string}): string;
    export function unlink(path: string, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function unlinkSync(path: string): void;
    export function rmdir(path: string, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function rmdirSync(path: string): void;
    export function mkdir(path: string, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function mkdir(path: string, mode: number, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function mkdir(path: string, mode: string, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function mkdirSync(path: string, mode?: number): void;
    export function mkdirSync(path: string, mode?: string): void;
    export function readdir(path: string, callback?: (err: NodeJS.ErrnoException, files: string[]) => void): void;
    export function readdirSync(path: string): string[];
    export function close(fd: number, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function closeSync(fd: number): void;
    export function open(path: string, flags: string, callback?: (err: NodeJS.ErrnoException, fd: number) => any): void;
    export function open(path: string, flags: string, mode: number, callback?: (err: NodeJS.ErrnoException, fd: number) => any): void;
    export function open(path: string, flags: string, mode: string, callback?: (err: NodeJS.ErrnoException, fd: number) => any): void;
    export function openSync(path: string, flags: string, mode?: number): number;
    export function openSync(path: string, flags: string, mode?: string): number;
    export function utimes(path: string, atime: number, mtime: number, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function utimes(path: string, atime: Date, mtime: Date, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function utimesSync(path: string, atime: number, mtime: number): void;
    export function utimesSync(path: string, atime: Date, mtime: Date): void;
    export function futimes(fd: number, atime: number, mtime: number, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function futimes(fd: number, atime: Date, mtime: Date, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function futimesSync(fd: number, atime: number, mtime: number): void;
    export function futimesSync(fd: number, atime: Date, mtime: Date): void;
    export function fsync(fd: number, callback?: (err?: NodeJS.ErrnoException) => void): void;
    export function fsyncSync(fd: number): void;
    export function write(fd: number, buffer: Buffer, offset: number, length: number, position: number, callback?: (err: NodeJS.ErrnoException, written: number, buffer: Buffer) => void): void;
    export function writeSync(fd: number, buffer: Buffer, offset: number, length: number, position: number): number;
    export function read(fd: number, buffer: Buffer, offset: number, length: number, position: number, callback?: (err: NodeJS.ErrnoException, bytesRead: number, buffer: Buffer) => void): void;
    export function readSync(fd: number, buffer: Buffer, offset: number, length: number, position: number): number;
    export function readFile(filename: string, encoding: string, callback: (err: NodeJS.ErrnoException, data: string) => void): void;
    export function readFile(filename: string, options: { encoding: string; flag?: string; }, callback: (err: NodeJS.ErrnoException, data: string) => void): void;
    export function readFile(filename: string, options: { flag?: string; }, callback: (err: NodeJS.ErrnoException, data: Buffer) => void): void;
    export function readFile(filename: string, callback: (err: NodeJS.ErrnoException, data: Buffer) => void ): void;
    export function readFileSync(filename: string, encoding: string): string;
    export function readFileSync(filename: string, options: { encoding: string; flag?: string; }): string;
    export function readFileSync(filename: string, options?: { flag?: string; }): Buffer;
    export function writeFile(filename: string, data: any, callback?: (err: NodeJS.ErrnoException) => void): void;
    export function writeFile(filename: string, data: any, options: { encoding?: string; mode?: number; flag?: string; }, callback?: (err: NodeJS.ErrnoException) => void): void;
    export function writeFile(filename: string, data: any, options: { encoding?: string; mode?: string; flag?: string; }, callback?: (err: NodeJS.ErrnoException) => void): void;
    export function writeFileSync(filename: string, data: any, options?: { encoding?: string; mode?: number; flag?: string; }): void;
    export function writeFileSync(filename: string, data: any, options?: { encoding?: string; mode?: string; flag?: string; }): void;
    export function appendFile(filename: string, data: any, options: { encoding?: string; mode?: number; flag?: string; }, callback?: (err: NodeJS.ErrnoException) => void): void;
    export function appendFile(filename: string, data: any, options: { encoding?: string; mode?: string; flag?: string; }, callback?: (err: NodeJS.ErrnoException) => void): void;
    export function appendFile(filename: string, data: any, callback?: (err: NodeJS.ErrnoException) => void): void;
    export function appendFileSync(filename: string, data: any, options?: { encoding?: string; mode?: number; flag?: string; }): void;
    export function appendFileSync(filename: string, data: any, options?: { encoding?: string; mode?: string; flag?: string; }): void;
    export function watchFile(filename: string, listener: (curr: Stats, prev: Stats) => void): void;
    export function watchFile(filename: string, options: { persistent?: boolean; interval?: number; }, listener: (curr: Stats, prev: Stats) => void): void;
    export function unwatchFile(filename: string, listener?: (curr: Stats, prev: Stats) => void): void;
    export function watch(filename: string, listener?: (event: string, filename: string) => any): FSWatcher;
    export function watch(filename: string, options: { persistent?: boolean; }, listener?: (event: string, filename: string) => any): FSWatcher;
    export function exists(path: string, callback?: (exists: boolean) => void): void;
    export function existsSync(path: string): boolean;
    export function createReadStream(path: string, options?: {
        flags?: string;
        encoding?: string;
        fd?: string;
        mode?: number;
        bufferSize?: number;
    }): ReadStream;
    export function createReadStream(path: string, options?: {
        flags?: string;
        encoding?: string;
        fd?: string;
        mode?: string;
        bufferSize?: number;
    }): ReadStream;
    export function createWriteStream(path: string, options?: {
        flags?: string;
        encoding?: string;
        string?: string;
    }): WriteStream;
}

declare module "path" {

    export interface ParsedPath {
        root: string;
        dir: string;
        base: string;
        ext: string;
        name: string;
    }

    export function normalize(p: string): string;
    export function join(...paths: any[]): string;
    export function resolve(...pathSegments: any[]): string;
    export function isAbsolute(p: string): boolean;
    export function relative(from: string, to: string): string;
    export function dirname(p: string): string;
    export function basename(p: string, ext?: string): string;
    export function extname(p: string): string;
    export var sep: string;
    export var delimiter: string;
    export function parse(p: string): ParsedPath;
    export function format(pP: ParsedPath): string;
}

declare module "string_decoder" {
    export interface NodeStringDecoder {
        write(buffer: Buffer): string;
        detectIncompleteChar(buffer: Buffer): number;
    }
    export var StringDecoder: {
        new (encoding: string): NodeStringDecoder;
    };
}

declare module "tls" {
    import crypto = require("crypto");
    import net = require("net");
    import stream = require("stream");

    var CLIENT_RENEG_LIMIT: number;
    var CLIENT_RENEG_WINDOW: number;

    export interface TlsOptions {
        pfx?: any;   //string or buffer
        key?: any;   //string or buffer
        passphrase?: string;
        cert?: any;
        ca?: any;    //string or buffer
        crl?: any;   //string or string array
        ciphers?: string;
        honorCipherOrder?: any;
        requestCert?: boolean;
        rejectUnauthorized?: boolean;
        NPNProtocols?: any;  //array or Buffer;
        SNICallback?: (servername: string) => any;
    }

    export interface ConnectionOptions {
        host?: string;
        port?: number;
        socket?: net.Socket;
        pfx?: any;   //string | Buffer
        key?: any;   //string | Buffer
        passphrase?: string;
        cert?: any;  //string | Buffer
        ca?: any;    //Array of string | Buffer
        rejectUnauthorized?: boolean;
        NPNProtocols?: any;  //Array of string | Buffer
        servername?: string;
    }

    export interface Server extends net.Server {
        // Extended base methods
        listen(port: number, host?: string, backlog?: number, listeningListener?: Function): Server;
        listen(path: string, listeningListener?: Function): Server;
        listen(handle: any, listeningListener?: Function): Server;

        listen(port: number, host?: string, callback?: Function): Server;
        close(): Server;
        address(): { port: number; family: string; address: string; };
        addContext(hostName: string, credentials: {
            key: string;
            cert: string;
            ca: string;
        }): void;
        maxConnections: number;
        connections: number;
    }

    export interface ClearTextStream extends stream.Duplex {
        authorized: boolean;
        authorizationError: Error;
        getPeerCertificate(): any;
        getCipher: {
            name: string;
            version: string;
        };
        address: {
            port: number;
            family: string;
            address: string;
        };
        remoteAddress: string;
        remotePort: number;
    }

    export interface SecurePair {
        encrypted: any;
        cleartext: any;
    }

    export function createServer(options: TlsOptions, secureConnectionListener?: (cleartextStream: ClearTextStream) =>void ): Server;
    export function connect(options: TlsOptions, secureConnectionListener?: () =>void ): ClearTextStream;
    export function connect(port: number, host?: string, options?: ConnectionOptions, secureConnectListener?: () =>void ): ClearTextStream;
    export function connect(port: number, options?: ConnectionOptions, secureConnectListener?: () =>void ): ClearTextStream;
    export function createSecurePair(credentials?: crypto.Credentials, isServer?: boolean, requestCert?: boolean, rejectUnauthorized?: boolean): SecurePair;
}

declare module "crypto" {
    export interface CredentialDetails {
        pfx: string;
        key: string;
        passphrase: string;
        cert: string;
        ca: any;    //string | string array
        crl: any;   //string | string array
        ciphers: string;
    }
    export interface Credentials { context?: any; }
    export function createCredentials(details: CredentialDetails): Credentials;
    export function createHash(algorithm: string): Hash;
    export function createHmac(algorithm: string, key: string): Hmac;
    export function createHmac(algorithm: string, key: Buffer): Hmac;
    interface Hash {
        update(data: any, input_encoding?: string): Hash;
        digest(encoding: 'buffer'): Buffer;
        digest(encoding: string): any;
        digest(): Buffer;
    }
    interface Hmac {
        update(data: any, input_encoding?: string): Hmac;
        digest(encoding: 'buffer'): Buffer;
        digest(encoding: string): any;
        digest(): Buffer;
    }
    export function createCipher(algorithm: string, password: any): Cipher;
    export function createCipheriv(algorithm: string, key: any, iv: any): Cipher;
    interface Cipher {
        update(data: Buffer): Buffer;
        update(data: string, input_encoding?: string, output_encoding?: string): string;
        final(): Buffer;
        final(output_encoding: string): string;
        setAutoPadding(auto_padding: boolean): void;
    }
    export function createDecipher(algorithm: string, password: any): Decipher;
    export function createDecipheriv(algorithm: string, key: any, iv: any): Decipher;
    interface Decipher {
        update(data: Buffer): Buffer;
        update(data: string, input_encoding?: string, output_encoding?: string): string;
        final(): Buffer;
        final(output_encoding: string): string;
        setAutoPadding(auto_padding: boolean): void;
    }
    export function createSign(algorithm: string): Signer;
    interface Signer {
        update(data: any): void;
        sign(private_key: string, output_format: string): string;
    }
    export function createVerify(algorith: string): Verify;
    interface Verify {
        update(data: any): void;
        verify(object: string, signature: string, signature_format?: string): boolean;
    }
    export function createDiffieHellman(prime_length: number): DiffieHellman;
    export function createDiffieHellman(prime: number, encoding?: string): DiffieHellman;
    interface DiffieHellman {
        generateKeys(encoding?: string): string;
        computeSecret(other_public_key: string, input_encoding?: string, output_encoding?: string): string;
        getPrime(encoding?: string): string;
        getGenerator(encoding: string): string;
        getPublicKey(encoding?: string): string;
        getPrivateKey(encoding?: string): string;
        setPublicKey(public_key: string, encoding?: string): void;
        setPrivateKey(public_key: string, encoding?: string): void;
    }
    export function getDiffieHellman(group_name: string): DiffieHellman;
    export function pbkdf2(password: string, salt: string, iterations: number, keylen: number, callback: (err: Error, derivedKey: Buffer) => any): void;
    export function pbkdf2Sync(password: string, salt: string, iterations: number, keylen: number) : Buffer;
    export function randomBytes(size: number): Buffer;
    export function randomBytes(size: number, callback: (err: Error, buf: Buffer) =>void ): void;
    export function pseudoRandomBytes(size: number): Buffer;
    export function pseudoRandomBytes(size: number, callback: (err: Error, buf: Buffer) =>void ): void;
}

declare module "stream" {
    import events = require("events");

    export interface Stream extends events.EventEmitter {
        pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean; }): T;
    }

    export interface ReadableOptions {
        highWaterMark?: number;
        encoding?: string;
        objectMode?: boolean;
    }

    export class Readable extends events.EventEmitter implements NodeJS.ReadableStream {
        readable: boolean;
        constructor(opts?: ReadableOptions);
        _read(size: number): void;
        read(size?: number): any;
        setEncoding(encoding: string): void;
        pause(): void;
        resume(): void;
        pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean; }): T;
        unpipe<T extends NodeJS.WritableStream>(destination?: T): void;
        unshift(chunk: string): void;
        unshift(chunk: Buffer): void;
        wrap(oldStream: NodeJS.ReadableStream): NodeJS.ReadableStream;
        push(chunk: any, encoding?: string): boolean;
    }

    export interface WritableOptions {
        highWaterMark?: number;
        decodeStrings?: boolean;
    }

    export class Writable extends events.EventEmitter implements NodeJS.WritableStream {
        writable: boolean;
        constructor(opts?: WritableOptions);
        _write(data: Buffer, encoding: string, callback: Function): void;
        _write(data: string, encoding: string, callback: Function): void;
        write(buffer: Buffer, cb?: Function): boolean;
        write(str: string, cb?: Function): boolean;
        write(str: string, encoding?: string, cb?: Function): boolean;
        end(): void;
        end(buffer: Buffer, cb?: Function): void;
        end(str: string, cb?: Function): void;
        end(str: string, encoding?: string, cb?: Function): void;
    }

    export interface DuplexOptions extends ReadableOptions, WritableOptions {
        allowHalfOpen?: boolean;
    }

    // Note: Duplex extends both Readable and Writable.
    export class Duplex extends Readable implements NodeJS.ReadWriteStream {
        writable: boolean;
        constructor(opts?: DuplexOptions);
        _write(data: Buffer, encoding: string, callback: Function): void;
        _write(data: string, encoding: string, callback: Function): void;
        write(buffer: Buffer, cb?: Function): boolean;
        write(str: string, cb?: Function): boolean;
        write(str: string, encoding?: string, cb?: Function): boolean;
        end(): void;
        end(buffer: Buffer, cb?: Function): void;
        end(str: string, cb?: Function): void;
        end(str: string, encoding?: string, cb?: Function): void;
    }

    export interface TransformOptions extends ReadableOptions, WritableOptions {}

    // Note: Transform lacks the _read and _write methods of Readable/Writable.
    export class Transform extends events.EventEmitter implements NodeJS.ReadWriteStream {
        readable: boolean;
        writable: boolean;
        constructor(opts?: TransformOptions);
        _transform(chunk: Buffer, encoding: string, callback: Function): void;
        _transform(chunk: string, encoding: string, callback: Function): void;
        _flush(callback: Function): void;
        read(size?: number): any;
        setEncoding(encoding: string): void;
        pause(): void;
        resume(): void;
        pipe<T extends NodeJS.WritableStream>(destination: T, options?: { end?: boolean; }): T;
        unpipe<T extends NodeJS.WritableStream>(destination?: T): void;
        unshift(chunk: string): void;
        unshift(chunk: Buffer): void;
        wrap(oldStream: NodeJS.ReadableStream): NodeJS.ReadableStream;
        push(chunk: any, encoding?: string): boolean;
        write(buffer: Buffer, cb?: Function): boolean;
        write(str: string, cb?: Function): boolean;
        write(str: string, encoding?: string, cb?: Function): boolean;
        end(): void;
        end(buffer: Buffer, cb?: Function): void;
        end(str: string, cb?: Function): void;
        end(str: string, encoding?: string, cb?: Function): void;
    }

    export class PassThrough extends Transform {}
}

declare module "util" {
    export interface InspectOptions {
        showHidden?: boolean;
        depth?: number;
        colors?: boolean;
        customInspect?: boolean;
    }

    export function format(format: any, ...param: any[]): string;
    export function debug(string: string): void;
    export function error(...param: any[]): void;
    export function puts(...param: any[]): void;
    export function print(...param: any[]): void;
    export function log(string: string): void;
    export function inspect(object: any, showHidden?: boolean, depth?: number, color?: boolean): string;
    export function inspect(object: any, options: InspectOptions): string;
    export function isArray(object: any): boolean;
    export function isRegExp(object: any): boolean;
    export function isDate(object: any): boolean;
    export function isError(object: any): boolean;
    export function inherits(constructor: any, superConstructor: any): void;
}

declare module "assert" {
    function internal (value: any, message?: string): void;
    module internal {
        export class AssertionError implements Error {
            name: string;
            message: string;
            actual: any;
            expected: any;
            operator: string;
            generatedMessage: boolean;

            constructor(options?: {message?: string; actual?: any; expected?: any;
                                  operator?: string; stackStartFunction?: Function});
        }

        export function fail(actual?: any, expected?: any, message?: string, operator?: string): void;
        export function ok(value: any, message?: string): void;
        export function equal(actual: any, expected: any, message?: string): void;
        export function notEqual(actual: any, expected: any, message?: string): void;
        export function deepEqual(actual: any, expected: any, message?: string): void;
        export function notDeepEqual(acutal: any, expected: any, message?: string): void;
        export function strictEqual(actual: any, expected: any, message?: string): void;
        export function notStrictEqual(actual: any, expected: any, message?: string): void;
        export var throws: {
            (block: Function, message?: string): void;
            (block: Function, error: Function, message?: string): void;
            (block: Function, error: RegExp, message?: string): void;
            (block: Function, error: (err: any) => boolean, message?: string): void;
        };

        export var doesNotThrow: {
            (block: Function, message?: string): void;
            (block: Function, error: Function, message?: string): void;
            (block: Function, error: RegExp, message?: string): void;
            (block: Function, error: (err: any) => boolean, message?: string): void;
        };

        export function ifError(value: any): void;
    }

    export = internal;
}

declare module "tty" {
    import net = require("net");

    export function isatty(fd: number): boolean;
    export interface ReadStream extends net.Socket {
        isRaw: boolean;
        setRawMode(mode: boolean): void;
    }
    export interface WriteStream extends net.Socket {
        columns: number;
        rows: number;
    }
}

declare module "domain" {
    import events = require("events");

    export class Domain extends events.EventEmitter {
        run(fn: Function): void;
        add(emitter: events.EventEmitter): void;
        remove(emitter: events.EventEmitter): void;
        bind(cb: (err: Error, data: any) => any): any;
        intercept(cb: (data: any) => any): any;
        dispose(): void;

        addListener(event: string, listener: Function): Domain;
        on(event: string, listener: Function): Domain;
        once(event: string, listener: Function): Domain;
        removeListener(event: string, listener: Function): Domain;
        removeAllListeners(event?: string): Domain;
    }

    export function create(): Domain;
}
// Type definitions for Q
// Project: https://github.com/kriskowal/q
// Definitions by: Barrie Nemetchek <https://github.com/bnemetchek>, Andrew Gaspar <https://github.com/AndrewGaspar/>, John Reilly <https://github.com/johnnyreilly>
// Definitions: https://github.com/borisyankov/DefinitelyTyped  

/**
 * If value is a Q promise, returns the promise.
 * If value is a promise from another library it is coerced into a Q promise (where possible).
 */
declare function Q<T>(promise: Q.IPromise<T>): Q.Promise<T>;
/**
 * If value is not a promise, returns a promise that is fulfilled with value.
 */
declare function Q<T>(value: T): Q.Promise<T>;

declare module Q {
    interface IPromise<T> {
        then<U>(onFulfill?: (value: T) => U | IPromise<U>, onReject?: (error: any) => U | IPromise<U>): IPromise<U>;
    }

    interface Deferred<T> {
        promise: Promise<T>;
        resolve(value: T): void;
        reject(reason: any): void;
        notify(value: any): void;
        makeNodeResolver(): (reason: any, value: T) => void;
    }

    interface Promise<T> {
        /**
         * Like a finally clause, allows you to observe either the fulfillment or rejection of a promise, but to do so without modifying the final value. This is useful for collecting resources regardless of whether a job succeeded, like closing a database connection, shutting a server down, or deleting an unneeded key from an object.

         * finally returns a promise, which will become resolved with the same fulfillment value or rejection reason as promise. However, if callback returns a promise, the resolution of the returned promise will be delayed until the promise returned from callback is finished.
         */
        fin(finallyCallback: () => any): Promise<T>;
        /**
         * Like a finally clause, allows you to observe either the fulfillment or rejection of a promise, but to do so without modifying the final value. This is useful for collecting resources regardless of whether a job succeeded, like closing a database connection, shutting a server down, or deleting an unneeded key from an object.

         * finally returns a promise, which will become resolved with the same fulfillment value or rejection reason as promise. However, if callback returns a promise, the resolution of the returned promise will be delayed until the promise returned from callback is finished.
         */
        finally(finallyCallback: () => any): Promise<T>;

        /**
         * The then method from the Promises/A+ specification, with an additional progress handler.
         */
        then<U>(onFulfill?: (value: T) => U | IPromise<U>, onReject?: (error: any) => U | IPromise<U>, onProgress?: Function): Promise<U>;

        /**
         * Like then, but "spreads" the array into a variadic fulfillment handler. If any of the promises in the array are rejected, instead calls onRejected with the first rejected promise's rejection reason.
         * 
         * This is especially useful in conjunction with all
         */
        spread<U>(onFulfilled: Function, onRejected?: Function): Promise<U>;

        fail<U>(onRejected: (reason: any) => U | IPromise<U>): Promise<U>;

        /**
         * A sugar method, equivalent to promise.then(undefined, onRejected).
         */
        catch<U>(onRejected: (reason: any) => U | IPromise<U>): Promise<U>;

        /**
         * A sugar method, equivalent to promise.then(undefined, undefined, onProgress).
         */
        progress(onProgress: (progress: any) => any): Promise<T>;

        /**
         * Much like then, but with different behavior around unhandled rejection. If there is an unhandled rejection, either because promise is rejected and no onRejected callback was provided, or because onFulfilled or onRejected threw an error or returned a rejected promise, the resulting rejection reason is thrown as an exception in a future turn of the event loop.
         *
         * This method should be used to terminate chains of promises that will not be passed elsewhere. Since exceptions thrown in then callbacks are consumed and transformed into rejections, exceptions at the end of the chain are easy to accidentally, silently ignore. By arranging for the exception to be thrown in a future turn of the event loop, so that it won't be caught, it causes an onerror event on the browser window, or an uncaughtException event on Node.js's process object.
         *
         * Exceptions thrown by done will have long stack traces, if Q.longStackSupport is set to true. If Q.onerror is set, exceptions will be delivered there instead of thrown in a future turn.
         *
         * The Golden Rule of done vs. then usage is: either return your promise to someone else, or if the chain ends with you, call done to terminate it.
         */
        done(onFulfilled?: (value: T) => any, onRejected?: (reason: any) => any, onProgress?: (progress: any) => any): void;

        /**
         * If callback is a function, assumes it's a Node.js-style callback, and calls it as either callback(rejectionReason) when/if promise becomes rejected, or as callback(null, fulfillmentValue) when/if promise becomes fulfilled. If callback is not a function, simply returns promise.
         */
        nodeify(callback: (reason: any, value: any) => void): Promise<T>;

        /**
         * Returns a promise to get the named property of an object. Essentially equivalent to
         * 
         * promise.then(function (o) {
         *     return o[propertyName];
         * });
         */
        get<U>(propertyName: String): Promise<U>;
        set<U>(propertyName: String, value: any): Promise<U>;
        delete<U>(propertyName: String): Promise<U>;
        /**
         * Returns a promise for the result of calling the named method of an object with the given array of arguments. The object itself is this in the function, just like a synchronous method call. Essentially equivalent to
         * 
         * promise.then(function (o) {
         *     return o[methodName].apply(o, args);
         * });
         */
        post<U>(methodName: String, args: any[]): Promise<U>;
        /**
         * Returns a promise for the result of calling the named method of an object with the given variadic arguments. The object itself is this in the function, just like a synchronous method call.
         */
        invoke<U>(methodName: String, ...args: any[]): Promise<U>;
        fapply<U>(args: any[]): Promise<U>;
        fcall<U>(...args: any[]): Promise<U>;

        /**
         * Returns a promise for an array of the property names of an object. Essentially equivalent to
         * 
         * promise.then(function (o) {
         *     return Object.keys(o);
         * });
         */
        keys(): Promise<string[]>;
        
        /**
         * A sugar method, equivalent to promise.then(function () { return value; }).
         */
        thenResolve<U>(value: U): Promise<U>;
        /**
         * A sugar method, equivalent to promise.then(function () { throw reason; }).
         */
        thenReject(reason: any): Promise<T>;
        timeout(ms: number, message?: string): Promise<T>;
        /**
         * Returns a promise that will have the same result as promise, but will only be fulfilled or rejected after at least ms milliseconds have passed.
         */
        delay(ms: number): Promise<T>;

        /**
         * Returns whether a given promise is in the fulfilled state. When the static version is used on non-promises, the result is always true.
         */
        isFulfilled(): boolean;
        /**
         * Returns whether a given promise is in the rejected state. When the static version is used on non-promises, the result is always false.
         */
        isRejected(): boolean;
        /**
         * Returns whether a given promise is in the pending state. When the static version is used on non-promises, the result is always false.
         */
        isPending(): boolean;
        
        valueOf(): any;

        /**
         * Returns a "state snapshot" object, which will be in one of three forms:
         * 
         * - { state: "pending" }
         * - { state: "fulfilled", value: <fulfllment value> }
         * - { state: "rejected", reason: <rejection reason> }
         */
        inspect(): PromiseState<T>;
    }

    interface PromiseState<T> {
        /**
         * "fulfilled", "rejected", "pending"
         */
        state: string;
        value?: T;
        reason?: any;
    }

    // If no value provided, returned promise will be of void type
    export function when(): Promise<void>;

    // if no fulfill, reject, or progress provided, returned promise will be of same type
    export function when<T>(value: T | IPromise<T>): Promise<T>;

    // If a non-promise value is provided, it will not reject or progress
    export function when<T, U>(value: T | IPromise<T>, onFulfilled: (val: T) => U | IPromise<U>, onRejected?: (reason: any) => U | IPromise<U>, onProgress?: (progress: any) => any): Promise<U>;
    
    /** 
     * Currently "impossible" (and I use the term loosely) to implement due to TypeScript limitations as it is now.
     * See: https://github.com/Microsoft/TypeScript/issues/1784 for discussion on it.
     */
    // export function try(method: Function, ...args: any[]): Promise<any>; 

    export function fbind<T>(method: (...args: any[]) => T | IPromise<T>, ...args: any[]): (...args: any[]) => Promise<T>;

    export function fcall<T>(method: (...args: any[]) => T, ...args: any[]): Promise<T>;

    export function send<T>(obj: any, functionName: string, ...args: any[]): Promise<T>;
    export function invoke<T>(obj: any, functionName: string, ...args: any[]): Promise<T>;
    export function mcall<T>(obj: any, functionName: string, ...args: any[]): Promise<T>;

    export function denodeify<T>(nodeFunction: Function, ...args: any[]): (...args: any[]) => Promise<T>;
    export function nbind<T>(nodeFunction: Function, thisArg: any, ...args: any[]): (...args: any[]) => Promise<T>;
    export function nfbind<T>(nodeFunction: Function, ...args: any[]): (...args: any[]) => Promise<T>;
    export function nfcall<T>(nodeFunction: Function, ...args: any[]): Promise<T>;
    export function nfapply<T>(nodeFunction: Function, args: any[]): Promise<T>;

    export function ninvoke<T>(nodeModule: any, functionName: string, ...args: any[]): Promise<T>;
    export function npost<T>(nodeModule: any, functionName: string, args: any[]): Promise<T>;
    export function nsend<T>(nodeModule: any, functionName: string, ...args: any[]): Promise<T>;
    export function nmcall<T>(nodeModule: any, functionName: string, ...args: any[]): Promise<T>;

    /**
     * Returns a promise that is fulfilled with an array containing the fulfillment value of each promise, or is rejected with the same rejection reason as the first promise to be rejected.
     */
    export function all<T>(promises: IPromise<T>[]): Promise<T[]>;
    
    /**
     * Returns a promise that is fulfilled with an array of promise state snapshots, but only after all the original promises have settled, i.e. become either fulfilled or rejected.
     */
    export function allSettled<T>(promises: IPromise<T>[]): Promise<PromiseState<T>[]>;

    export function allResolved<T>(promises: IPromise<T>[]): Promise<Promise<T>[]>;

    /**
     * Like then, but "spreads" the array into a variadic fulfillment handler. If any of the promises in the array are rejected, instead calls onRejected with the first rejected promise's rejection reason. 
     * This is especially useful in conjunction with all.
     */
    export function spread<T, U>(promises: IPromise<T>[], onFulfilled: (...args: T[]) => U | IPromise<U>, onRejected?: (reason: any) => U | IPromise<U>): Promise<U>;
    
    /**
     * Returns a promise that will have the same result as promise, except that if promise is not fulfilled or rejected before ms milliseconds, the returned promise will be rejected with an Error with the given message. If message is not supplied, the message will be "Timed out after " + ms + " ms".
     */
    export function timeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T>;

    /**
     * Returns a promise that will have the same result as promise, but will only be fulfilled or rejected after at least ms milliseconds have passed.
     */
    export function delay<T>(promise: Promise<T>, ms: number): Promise<T>;
    /**
     * Returns a promise that will have the same result as promise, but will only be fulfilled or rejected after at least ms milliseconds have passed.
     */
    export function delay<T>(value: T, ms: number): Promise<T>;
    /**
     * Returns a promise that will be fulfilled with undefined after at least ms milliseconds have passed.
     */
    export function delay(ms: number): Promise <void>;
    /**
     * Returns whether a given promise is in the fulfilled state. When the static version is used on non-promises, the result is always true.
     */
    export function isFulfilled(promise: Promise<any>): boolean;
    /**
     * Returns whether a given promise is in the rejected state. When the static version is used on non-promises, the result is always false.
     */
    export function isRejected(promise: Promise<any>): boolean;
    /**
     * Returns whether a given promise is in the pending state. When the static version is used on non-promises, the result is always false.
     */
    export function isPending(promise: Promise<any>): boolean;

    /**
     * Returns a "deferred" object with a:
     * promise property
     * resolve(value) method
     * reject(reason) method
     * notify(value) method
     * makeNodeResolver() method
     */
    export function defer<T>(): Deferred<T>;

    /**
     * Returns a promise that is rejected with reason.
     */
    export function reject<T>(reason?: any): Promise<T>;

    export function Promise<T>(resolver: (resolve: (val: T | IPromise<T>) => void , reject: (reason: any) => void , notify: (progress: any) => void ) => void ): Promise<T>;

    /**
     * Creates a new version of func that accepts any combination of promise and non-promise values, converting them to their fulfillment values before calling the original func. The returned version also always returns a promise: if func does a return or throw, then Q.promised(func) will return fulfilled or rejected promise, respectively.
     *
     * This can be useful for creating functions that accept either promises or non-promise values, and for ensuring that the function always returns a promise even in the face of unintentional thrown exceptions.
     */
    export function promised<T>(callback: (...args: any[]) => T): (...args: any[]) => Promise<T>;

    /**
     * Returns whether the given value is a Q promise.
     */
    export function isPromise(object: any): boolean;
    /**
     * Returns whether the given value is a promise (i.e. it's an object with a then function).
     */
    export function isPromiseAlike(object: any): boolean;
    /**
     * Returns whether a given promise is in the pending state. When the static version is used on non-promises, the result is always false.
     */
    export function isPending(object: any): boolean;

    /**
     * This is an experimental tool for converting a generator function into a deferred function. This has the potential of reducing nested callbacks in engines that support yield.
     */
    export function async<T>(generatorFunction: any): (...args: any[]) => Promise<T>;
    export function nextTick(callback: Function): void;

    /**
     * A settable property that will intercept any uncaught errors that would otherwise be thrown in the next tick of the event loop, usually as a result of done. Can be useful for getting the full stack trace of an error in browsers, which is not usually possible with window.onerror.
     */
    export var onerror: (reason: any) => void;
    /**
     * A settable property that lets you turn on long stack trace support. If turned on, "stack jumps" will be tracked across asynchronous promise operations, so that if an uncaught error is thrown by done or a rejection reason's stack property is inspected in a rejection callback, a long stack trace is produced.
     */
    export var longStackSupport: boolean;

    /**
     * Calling resolve with a pending promise causes promise to wait on the passed promise, becoming fulfilled with its fulfillment value or rejected with its rejection reason (or staying pending forever, if the passed promise does).
     * Calling resolve with a rejected promise causes promise to be rejected with the passed promise's rejection reason.
     * Calling resolve with a fulfilled promise causes promise to be fulfilled with the passed promise's fulfillment value.
     * Calling resolve with a non-promise value causes promise to be fulfilled with that value.
     */
    export function resolve<T>(object: IPromise<T>): Promise<T>;
    /**
     * Calling resolve with a pending promise causes promise to wait on the passed promise, becoming fulfilled with its fulfillment value or rejected with its rejection reason (or staying pending forever, if the passed promise does).
     * Calling resolve with a rejected promise causes promise to be rejected with the passed promise's rejection reason.
     * Calling resolve with a fulfilled promise causes promise to be fulfilled with the passed promise's fulfillment value.
     * Calling resolve with a non-promise value causes promise to be fulfilled with that value.
     */
    export function resolve<T>(object: T): Promise<T>;
}

declare module "q" {
    export = Q;
}
// Type definitions for pathwatcher
// Project: https://github.com/atom/node-pathwatcher
// Definitions by: vvakame <https://github.com/vvakame/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/// <reference path="../node/node.d.ts" />
/// <reference path="../q/Q.d.ts" />

declare module PathWatcher {
	interface IFileStatic {
		new (path:string, symlink?:boolean):IFile;
	}

	interface IFile {
		realPath:string;
		path:string;
		symlink:boolean;
		cachedContents:string;
		digest:string;

		handleEventSubscriptions():void;
		setPath(path:string):void;
		getPath():string;
		getRealPathSync():string;
		getBaseName():string;
		write(text:string):void;
		readSync(flushCache:boolean):string;
		read(flushCache?:boolean):Q.Promise<string>;
		exists():boolean;
		setDigest(contents:string):void;
		getDigest():string;
		writeFileWithPrivilegeEscalationSync (filePath:string, text:string):void;
		handleNativeChangeEvent(eventType:string, eventPath:string):void;
		detectResurrectionAfterDelay():void;
		detectResurrection():void;
		subscribeToNativeChangeEvents():void;
		unsubscribeFromNativeChangeEvents():void;
	}

	interface IDirectoryStatic {
		new (path:string, symlink?:boolean):IDirectory;
	}

	interface IDirectory {
		realPath:string;
		path:string;
		symlink:boolean;

		getBaseName():string;
		getPath():void;
		getRealPathSync():string;
		contains(pathToCheck:string):boolean;
		relativize(fullPath:string):string;
		getEntriesSync():any[]; // return type are {File | Directory}[]
		getEntries(callback:Function):void;
		subscribeToNativeChangeEvents():void;
		unsubscribeFromNativeChangeEvents():void;
		isPathPrefixOf(prefix:string, fullPath:string):boolean;
	}
}

declare module "pathwatcher" {

	import events = require("events");

	interface IHandleWatcher extends events.EventEmitter {
		onEvent(event:any, filePath:any, oldFilePath:any):any;
		start():void;
		closeIfNoListener():void;
		close():void;
	}

	interface IPathWatcher {
		isWatchingParent:boolean;
		path:any;
		handleWatcher:IHandleWatcher;

		close():void;
	}

	function watch(path:string, callback:Function):IPathWatcher;

	function closeAllWatchers():void;

	function getWatchedPaths():string[];

	var File:PathWatcher.IFileStatic;
	var Directory:PathWatcher.IDirectoryStatic;
}
// Type definitions for jQuery 1.10.x / 2.0.x
// Project: http://jquery.com/
// Definitions by: Boris Yankov <https://github.com/borisyankov/>, Christian Hoffmeister <https://github.com/choffmeister>, Steve Fenton <https://github.com/Steve-Fenton>, Diullei Gomes <https://github.com/Diullei>, Tass Iliopoulos <https://github.com/tasoili>, Jason Swearingen <https://github.com/jasons-novaleaf>, Sean Hill <https://github.com/seanski>, Guus Goossens <https://github.com/Guuz>, Kelly Summerlin <https://github.com/ksummerlin>, Basarat Ali Syed <https://github.com/basarat>, Nicholas Wolverson <https://github.com/nwolverson>, Derek Cicerone <https://github.com/derekcicerone>, Andrew Gaspar <https://github.com/AndrewGaspar>, James Harrison Fisher <https://github.com/jameshfisher>, Seikichi Kondo <https://github.com/seikichi>, Benjamin Jackman <https://github.com/benjaminjackman>, Poul Sorensen <https://github.com/s093294>, Josh Strobl <https://github.com/JoshStrobl>, John Reilly <https://github.com/johnnyreilly/>, Dick van den Brink <https://github.com/DickvdBrink>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/* *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */


/**
 * Interface for the AJAX setting that will configure the AJAX request
 */
interface JQueryAjaxSettings {
    /**
     * The content type sent in the request header that tells the server what kind of response it will accept in return. If the accepts setting needs modification, it is recommended to do so once in the $.ajaxSetup() method.
     */
    accepts?: any;
    /**
     * By default, all requests are sent asynchronously (i.e. this is set to true by default). If you need synchronous requests, set this option to false. Cross-domain requests and dataType: "jsonp" requests do not support synchronous operation. Note that synchronous requests may temporarily lock the browser, disabling any actions while the request is active. As of jQuery 1.8, the use of async: false with jqXHR ($.Deferred) is deprecated; you must use the success/error/complete callback options instead of the corresponding methods of the jqXHR object such as jqXHR.done() or the deprecated jqXHR.success().
     */
    async?: boolean;
    /**
     * A pre-request callback function that can be used to modify the jqXHR (in jQuery 1.4.x, XMLHTTPRequest) object before it is sent. Use this to set custom headers, etc. The jqXHR and settings objects are passed as arguments. This is an Ajax Event. Returning false in the beforeSend function will cancel the request. As of jQuery 1.5, the beforeSend option will be called regardless of the type of request.
     */
    beforeSend? (jqXHR: JQueryXHR, settings: JQueryAjaxSettings): any;
    /**
     * If set to false, it will force requested pages not to be cached by the browser. Note: Setting cache to false will only work correctly with HEAD and GET requests. It works by appending "_={timestamp}" to the GET parameters. The parameter is not needed for other types of requests, except in IE8 when a POST is made to a URL that has already been requested by a GET.
     */
    cache?: boolean;
    /**
     * A function to be called when the request finishes (after success and error callbacks are executed). The function gets passed two arguments: The jqXHR (in jQuery 1.4.x, XMLHTTPRequest) object and a string categorizing the status of the request ("success", "notmodified", "error", "timeout", "abort", or "parsererror"). As of jQuery 1.5, the complete setting can accept an array of functions. Each function will be called in turn. This is an Ajax Event.
     */
    complete? (jqXHR: JQueryXHR, textStatus: string): any;
    /**
     * An object of string/regular-expression pairs that determine how jQuery will parse the response, given its content type. (version added: 1.5)
     */
    contents?: { [key: string]: any; };
    //According to jQuery.ajax source code, ajax's option actually allows contentType to set to "false"
    // https://github.com/borisyankov/DefinitelyTyped/issues/742
    /**
     * When sending data to the server, use this content type. Default is "application/x-www-form-urlencoded; charset=UTF-8", which is fine for most cases. If you explicitly pass in a content-type to $.ajax(), then it is always sent to the server (even if no data is sent). The W3C XMLHttpRequest specification dictates that the charset is always UTF-8; specifying another charset will not force the browser to change the encoding.
     */
    contentType?: any;
    /**
     * This object will be made the context of all Ajax-related callbacks. By default, the context is an object that represents the ajax settings used in the call ($.ajaxSettings merged with the settings passed to $.ajax).
     */
    context?: any;
    /**
     * An object containing dataType-to-dataType converters. Each converter's value is a function that returns the transformed value of the response. (version added: 1.5)
     */
    converters?: { [key: string]: any; };
    /**
     * If you wish to force a crossDomain request (such as JSONP) on the same domain, set the value of crossDomain to true. This allows, for example, server-side redirection to another domain. (version added: 1.5)
     */
    crossDomain?: boolean;
    /**
     * Data to be sent to the server. It is converted to a query string, if not already a string. It's appended to the url for GET-requests. See processData option to prevent this automatic processing. Object must be Key/Value pairs. If value is an Array, jQuery serializes multiple values with same key based on the value of the traditional setting (described below).
     */
    data?: any;
    /**
     * A function to be used to handle the raw response data of XMLHttpRequest.This is a pre-filtering function to sanitize the response. You should return the sanitized data. The function accepts two arguments: The raw data returned from the server and the 'dataType' parameter.
     */
    dataFilter? (data: any, ty: any): any;
    /**
     * The type of data that you're expecting back from the server. If none is specified, jQuery will try to infer it based on the MIME type of the response (an XML MIME type will yield XML, in 1.4 JSON will yield a JavaScript object, in 1.4 script will execute the script, and anything else will be returned as a string). 
     */
    dataType?: string;
    /**
     * A function to be called if the request fails. The function receives three arguments: The jqXHR (in jQuery 1.4.x, XMLHttpRequest) object, a string describing the type of error that occurred and an optional exception object, if one occurred. Possible values for the second argument (besides null) are "timeout", "error", "abort", and "parsererror". When an HTTP error occurs, errorThrown receives the textual portion of the HTTP status, such as "Not Found" or "Internal Server Error." As of jQuery 1.5, the error setting can accept an array of functions. Each function will be called in turn. Note: This handler is not called for cross-domain script and cross-domain JSONP requests. This is an Ajax Event.
     */
    error? (jqXHR: JQueryXHR, textStatus: string, errorThrown: string): any;
    /**
     * Whether to trigger global Ajax event handlers for this request. The default is true. Set to false to prevent the global handlers like ajaxStart or ajaxStop from being triggered. This can be used to control various Ajax Events.
     */
    global?: boolean;
    /**
     * An object of additional header key/value pairs to send along with requests using the XMLHttpRequest transport. The header X-Requested-With: XMLHttpRequest is always added, but its default XMLHttpRequest value can be changed here. Values in the headers setting can also be overwritten from within the beforeSend function. (version added: 1.5)
     */
    headers?: { [key: string]: any; };
    /**
     * Allow the request to be successful only if the response has changed since the last request. This is done by checking the Last-Modified header. Default value is false, ignoring the header. In jQuery 1.4 this technique also checks the 'etag' specified by the server to catch unmodified data.
     */
    ifModified?: boolean;
    /**
     * Allow the current environment to be recognized as "local," (e.g. the filesystem), even if jQuery does not recognize it as such by default. The following protocols are currently recognized as local: file, *-extension, and widget. If the isLocal setting needs modification, it is recommended to do so once in the $.ajaxSetup() method. (version added: 1.5.1)
     */
    isLocal?: boolean;
    /**
     * Override the callback function name in a jsonp request. This value will be used instead of 'callback' in the 'callback=?' part of the query string in the url. So {jsonp:'onJSONPLoad'} would result in 'onJSONPLoad=?' passed to the server. As of jQuery 1.5, setting the jsonp option to false prevents jQuery from adding the "?callback" string to the URL or attempting to use "=?" for transformation. In this case, you should also explicitly set the jsonpCallback setting. For example, { jsonp: false, jsonpCallback: "callbackName" }
     */
    jsonp?: any;
    /**
     * Specify the callback function name for a JSONP request. This value will be used instead of the random name automatically generated by jQuery. It is preferable to let jQuery generate a unique name as it'll make it easier to manage the requests and provide callbacks and error handling. You may want to specify the callback when you want to enable better browser caching of GET requests. As of jQuery 1.5, you can also use a function for this setting, in which case the value of jsonpCallback is set to the return value of that function.
     */
    jsonpCallback?: any;
    /**
     * A mime type to override the XHR mime type. (version added: 1.5.1)
     */
    mimeType?: string;
    /**
     * A password to be used with XMLHttpRequest in response to an HTTP access authentication request.
     */
    password?: string;
    /**
     * By default, data passed in to the data option as an object (technically, anything other than a string) will be processed and transformed into a query string, fitting to the default content-type "application/x-www-form-urlencoded". If you want to send a DOMDocument, or other non-processed data, set this option to false.
     */
    processData?: boolean;
    /**
     * Only applies when the "script" transport is used (e.g., cross-domain requests with "jsonp" or "script" dataType and "GET" type). Sets the charset attribute on the script tag used in the request. Used when the character set on the local page is not the same as the one on the remote script.
     */
    scriptCharset?: string;
    /**
     * An object of numeric HTTP codes and functions to be called when the response has the corresponding code. f the request is successful, the status code functions take the same parameters as the success callback; if it results in an error (including 3xx redirect), they take the same parameters as the error callback. (version added: 1.5)
     */
    statusCode?: { [key: string]: any; };
    /**
     * A function to be called if the request succeeds. The function gets passed three arguments: The data returned from the server, formatted according to the dataType parameter; a string describing the status; and the jqXHR (in jQuery 1.4.x, XMLHttpRequest) object. As of jQuery 1.5, the success setting can accept an array of functions. Each function will be called in turn. This is an Ajax Event.
     */
    success? (data: any, textStatus: string, jqXHR: JQueryXHR): any;
    /**
     * Set a timeout (in milliseconds) for the request. This will override any global timeout set with $.ajaxSetup(). The timeout period starts at the point the $.ajax call is made; if several other requests are in progress and the browser has no connections available, it is possible for a request to time out before it can be sent. In jQuery 1.4.x and below, the XMLHttpRequest object will be in an invalid state if the request times out; accessing any object members may throw an exception. In Firefox 3.0+ only, script and JSONP requests cannot be cancelled by a timeout; the script will run even if it arrives after the timeout period.
     */
    timeout?: number;
    /**
     * Set this to true if you wish to use the traditional style of param serialization.
     */
    traditional?: boolean;
    /**
     * The type of request to make ("POST" or "GET"), default is "GET". Note: Other HTTP request methods, such as PUT and DELETE, can also be used here, but they are not supported by all browsers.
     */
    type?: string;
    /**
     * A string containing the URL to which the request is sent.
     */
    url?: string;
    /**
     * A username to be used with XMLHttpRequest in response to an HTTP access authentication request.
     */
    username?: string;
    /**
     * Callback for creating the XMLHttpRequest object. Defaults to the ActiveXObject when available (IE), the XMLHttpRequest otherwise. Override to provide your own implementation for XMLHttpRequest or enhancements to the factory.
     */
    xhr?: any;
    /**
     * An object of fieldName-fieldValue pairs to set on the native XHR object. For example, you can use it to set withCredentials to true for cross-domain requests if needed. In jQuery 1.5, the withCredentials property was not propagated to the native XHR and thus CORS requests requiring it would ignore this flag. For this reason, we recommend using jQuery 1.5.1+ should you require the use of it. (version added: 1.5.1)
     */
    xhrFields?: { [key: string]: any; };
}

/**
 * Interface for the jqXHR object
 */
interface JQueryXHR extends XMLHttpRequest, JQueryPromise<any> {
    /**
     * The .overrideMimeType() method may be used in the beforeSend() callback function, for example, to modify the response content-type header. As of jQuery 1.5.1, the jqXHR object also contains the overrideMimeType() method (it was available in jQuery 1.4.x, as well, but was temporarily removed in jQuery 1.5). 
     */
    overrideMimeType(mimeType: string): any;
    /**
     * Cancel the request. 
     *
     * @param statusText A string passed as the textStatus parameter for the done callback. Default value: "canceled"
     */
    abort(statusText?: string): void;
    /**
     * Incorporates the functionality of the .done() and .fail() methods, allowing (as of jQuery 1.8) the underlying Promise to be manipulated. Refer to deferred.then() for implementation details.
     */
    then(doneCallback: (data: any, textStatus: string, jqXHR: JQueryXHR) => void, failCallback?: (jqXHR: JQueryXHR, textStatus: string, errorThrown: any) => void): JQueryPromise<any>;
    /**
     * Property containing the parsed response if the response Content-Type is json
     */
    responseJSON?: any;
}

/**
 * Interface for the JQuery callback
 */
interface JQueryCallback {
    /**
     * Add a callback or a collection of callbacks to a callback list.
     * 
     * @param callbacks A function, or array of functions, that are to be added to the callback list.
     */
    add(callbacks: Function): JQueryCallback;
    /**
     * Add a callback or a collection of callbacks to a callback list.
     * 
     * @param callbacks A function, or array of functions, that are to be added to the callback list.
     */
    add(callbacks: Function[]): JQueryCallback;

    /**
     * Disable a callback list from doing anything more.
     */
    disable(): JQueryCallback;

    /**
     * Determine if the callbacks list has been disabled.
     */
    disabled(): boolean;

    /**
     * Remove all of the callbacks from a list.
     */
    empty(): JQueryCallback;

    /**
     * Call all of the callbacks with the given arguments
     * 
     * @param arguments The argument or list of arguments to pass back to the callback list.
     */
    fire(...arguments: any[]): JQueryCallback;

    /**
     * Determine if the callbacks have already been called at least once.
     */
    fired(): boolean;

    /**
     * Call all callbacks in a list with the given context and arguments.
     * 
     * @param context A reference to the context in which the callbacks in the list should be fired.
     * @param arguments An argument, or array of arguments, to pass to the callbacks in the list.
     */
    fireWith(context?: any, ...args: any[]): JQueryCallback;

    /**
     * Determine whether a supplied callback is in a list
     * 
     * @param callback The callback to search for.
     */
    has(callback: Function): boolean;

    /**
     * Lock a callback list in its current state.
     */
    lock(): JQueryCallback;

    /**
     * Determine if the callbacks list has been locked.
     */
    locked(): boolean;

    /**
     * Remove a callback or a collection of callbacks from a callback list.
     * 
     * @param callbacks A function, or array of functions, that are to be removed from the callback list.
     */
    remove(callbacks: Function): JQueryCallback;
    /**
     * Remove a callback or a collection of callbacks from a callback list.
     * 
     * @param callbacks A function, or array of functions, that are to be removed from the callback list.
     */
    remove(callbacks: Function[]): JQueryCallback;
}

/**
 * Allows jQuery Promises to interop with non-jQuery promises
 */
interface JQueryGenericPromise<T> {
    /**
     * Add handlers to be called when the Deferred object is resolved, rejected, or still in progress.
     * 
     * @param doneFilter A function that is called when the Deferred is resolved.
     * @param failFilter An optional function that is called when the Deferred is rejected.
     */
    then<U>(doneFilter: (value: T) => U|JQueryGenericPromise<U>, failFilter?: (reason: any) => U|JQueryGenericPromise<U>): JQueryGenericPromise<U>;
}

/**
 * Interface for the JQuery promise/deferred callbacks
 */
interface JQueryPromiseCallback<T> {
    (value?: T, ...args: any[]): void;
}

interface JQueryPromiseOperator<T, R> {
    (callback: JQueryPromiseCallback<T>, ...callbacks: JQueryPromiseCallback<T>[]): JQueryPromise<R>;
    (callback: JQueryPromiseCallback<T>[], ...callbacks: JQueryPromiseCallback<T>[]): JQueryPromise<R>;
}

/**
 * Interface for the JQuery promise, part of callbacks
 */
interface JQueryPromise<T> {
    /**
     * Add handlers to be called when the Deferred object is either resolved or rejected.
     * 
     * @param alwaysCallbacks1 A function, or array of functions, that is called when the Deferred is resolved or rejected.
     * @param alwaysCallbacks2 Optional additional functions, or arrays of functions, that are called when the Deferred is resolved or rejected.
     */
    always: JQueryPromiseOperator<any, T>;
    /**
     * Add handlers to be called when the Deferred object is resolved.
     * 
     * @param doneCallbacks1 A function, or array of functions, that are called when the Deferred is resolved.
     * @param doneCallbacks2 Optional additional functions, or arrays of functions, that are called when the Deferred is resolved.
     */
    done: JQueryPromiseOperator<T, T>;
    /**
     * Add handlers to be called when the Deferred object is rejected.
     * 
     * @param failCallbacks1 A function, or array of functions, that are called when the Deferred is rejected.
     * @param failCallbacks2 Optional additional functions, or arrays of functions, that are called when the Deferred is rejected.
     */
    fail: JQueryPromiseOperator<any, T>;
    /**
     * Add handlers to be called when the Deferred object generates progress notifications.
     * 
     * @param progressCallbacks A function, or array of functions, to be called when the Deferred generates progress notifications.
     */
    progress(progressCallback: JQueryPromiseCallback<T>): JQueryPromise<T>;
    progress(progressCallbacks: JQueryPromiseCallback<T>[]): JQueryPromise<T>;

    /**
     * Determine the current state of a Deferred object.
     */
    state(): string;

    // Deprecated - given no typings
    pipe(doneFilter?: (x: any) => any, failFilter?: (x: any) => any, progressFilter?: (x: any) => any): JQueryPromise<any>;

    /**
     * Add handlers to be called when the Deferred object is resolved, rejected, or still in progress.
     * 
     * @param doneFilter A function that is called when the Deferred is resolved.
     * @param failFilter An optional function that is called when the Deferred is rejected.
     * @param progressFilter An optional function that is called when progress notifications are sent to the Deferred.
     */
    then<U>(doneFilter: (value: T) => U|JQueryGenericPromise<U>, failFilter?: (...reasons: any[]) => U|JQueryGenericPromise<U>, progressFilter?: (...progression: any[]) => any): JQueryPromise<U>;

    // Because JQuery Promises Suck
    /**
     * Add handlers to be called when the Deferred object is resolved, rejected, or still in progress.
     * 
     * @param doneFilter A function that is called when the Deferred is resolved.
     * @param failFilter An optional function that is called when the Deferred is rejected.
     * @param progressFilter An optional function that is called when progress notifications are sent to the Deferred.
     */
    then<U>(doneFilter: (...values: any[]) => U|JQueryGenericPromise<U>, failFilter?: (...reasons: any[]) => U|JQueryGenericPromise<U>, progressFilter?: (...progression: any[]) => any): JQueryPromise<U>;
}

/**
 * Interface for the JQuery deferred, part of callbacks
 */
interface JQueryDeferred<T> extends JQueryPromise<T> {
    /**
     * Add handlers to be called when the Deferred object is either resolved or rejected.
     * 
     * @param alwaysCallbacks1 A function, or array of functions, that is called when the Deferred is resolved or rejected.
     * @param alwaysCallbacks2 Optional additional functions, or arrays of functions, that are called when the Deferred is resolved or rejected.
     */
    always(alwaysCallbacks1?: JQueryPromiseCallback<T>, ...alwaysCallbacks2: JQueryPromiseCallback<T>[]): JQueryDeferred<T>;
    always(alwaysCallbacks1?: JQueryPromiseCallback<T>[], ...alwaysCallbacks2: JQueryPromiseCallback<T>[]): JQueryDeferred<T>;
    always(alwaysCallbacks1?: JQueryPromiseCallback<T>, ...alwaysCallbacks2: any[]): JQueryDeferred<T>;
    always(alwaysCallbacks1?: JQueryPromiseCallback<T>[], ...alwaysCallbacks2: any[]): JQueryDeferred<T>;
    /**
     * Add handlers to be called when the Deferred object is resolved.
     * 
     * @param doneCallbacks1 A function, or array of functions, that are called when the Deferred is resolved.
     * @param doneCallbacks2 Optional additional functions, or arrays of functions, that are called when the Deferred is resolved.
     */
    done(doneCallbacks1?: JQueryPromiseCallback<T>, ...doneCallbacks2: JQueryPromiseCallback<T>[]): JQueryDeferred<T>;
    done(doneCallbacks1?: JQueryPromiseCallback<T>[], ...doneCallbacks2: JQueryPromiseCallback<T>[]): JQueryDeferred<T>;
    done(doneCallbacks1?: JQueryPromiseCallback<T>, ...doneCallbacks2: any[]): JQueryDeferred<T>;
    done(doneCallbacks1?: JQueryPromiseCallback<T>[], ...doneCallbacks2: any[]): JQueryDeferred<T>;
    /**
     * Add handlers to be called when the Deferred object is rejected.
     * 
     * @param failCallbacks1 A function, or array of functions, that are called when the Deferred is rejected.
     * @param failCallbacks2 Optional additional functions, or arrays of functions, that are called when the Deferred is rejected.
     */
    fail(failCallbacks1?: JQueryPromiseCallback<T>, ...failCallbacks2: JQueryPromiseCallback<T>[]): JQueryDeferred<T>;
    fail(failCallbacks1?: JQueryPromiseCallback<T>[], ...failCallbacks2: JQueryPromiseCallback<T>[]): JQueryDeferred<T>;
    fail(failCallbacks1?: JQueryPromiseCallback<T>, ...failCallbacks2: any[]): JQueryDeferred<T>;
    fail(failCallbacks1?: JQueryPromiseCallback<T>[], ...failCallbacks2: any[]): JQueryDeferred<T>;
    /**
     * Add handlers to be called when the Deferred object generates progress notifications.
     * 
     * @param progressCallbacks A function, or array of functions, to be called when the Deferred generates progress notifications.
     */
    progress(progressCallback: JQueryPromiseCallback<T>): JQueryDeferred<T>;
    progress(progressCallbacks: JQueryPromiseCallback<T>[]): JQueryDeferred<T>;

    /**
     * Call the progressCallbacks on a Deferred object with the given args.
     * 
     * @param args Optional arguments that are passed to the progressCallbacks.
     */
    notify(...args: any[]): JQueryDeferred<T>;

    /**
     * Call the progressCallbacks on a Deferred object with the given context and args.
     * 
     * @param context Context passed to the progressCallbacks as the this object.
     * @param args Optional arguments that are passed to the progressCallbacks.
     */
    notifyWith(context: any, ...args: any[]): JQueryDeferred<T>;

    /**
     * Reject a Deferred object and call any failCallbacks with the given args.
     * 
     * @param args Optional arguments that are passed to the failCallbacks.
     */
    reject(...args: any[]): JQueryDeferred<T>;
    /**
     * Reject a Deferred object and call any failCallbacks with the given context and args.
     * 
     * @param context Context passed to the failCallbacks as the this object.
     * @param args An optional array of arguments that are passed to the failCallbacks.
     */
    rejectWith(context: any, ...args: any[]): JQueryDeferred<T>;

    /**
     * Resolve a Deferred object and call any doneCallbacks with the given args.
     * 
     * @param value First argument passed to doneCallbacks.
     * @param args Optional subsequent arguments that are passed to the doneCallbacks.
     */
    resolve(value?: T, ...args: any[]): JQueryDeferred<T>;

    /**
     * Resolve a Deferred object and call any doneCallbacks with the given context and args.
     * 
     * @param context Context passed to the doneCallbacks as the this object.
     * @param args An optional array of arguments that are passed to the doneCallbacks.
     */
    resolveWith(context: any, ...args: any[]): JQueryDeferred<T>;

    /**
     * Return a Deferred's Promise object.
     * 
     * @param target Object onto which the promise methods have to be attached
     */
    promise(target?: any): JQueryPromise<T>;
}

/**
 * Interface of the JQuery extension of the W3C event object
 */
interface BaseJQueryEventObject extends Event {
    data: any;
    delegateTarget: Element;
    isDefaultPrevented(): boolean;
    isImmediatePropagationStopped(): boolean;
    isPropagationStopped(): boolean;
    namespace: string;
    originalEvent: Event;
    preventDefault(): any;
    relatedTarget: Element;
    result: any;
    stopImmediatePropagation(): void;
    stopPropagation(): void;
    target: Element;
    pageX: number;
    pageY: number;
    which: number;
    metaKey: boolean;
}

interface JQueryInputEventObject extends BaseJQueryEventObject {
    altKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
    shiftKey: boolean;
}

interface JQueryMouseEventObject extends JQueryInputEventObject {
    button: number;
    clientX: number;
    clientY: number;
    offsetX: number;
    offsetY: number;
    pageX: number;
    pageY: number;
    screenX: number;
    screenY: number;
}

interface JQueryKeyEventObject extends JQueryInputEventObject {
    char: any;
    charCode: number;
    key: any;
    keyCode: number;
}

interface JQueryEventObject extends BaseJQueryEventObject, JQueryInputEventObject, JQueryMouseEventObject, JQueryKeyEventObject{
}

/*
    Collection of properties of the current browser
*/

interface JQuerySupport {
    ajax?: boolean;
    boxModel?: boolean;
    changeBubbles?: boolean;
    checkClone?: boolean;
    checkOn?: boolean;
    cors?: boolean;
    cssFloat?: boolean;
    hrefNormalized?: boolean;
    htmlSerialize?: boolean;
    leadingWhitespace?: boolean;
    noCloneChecked?: boolean;
    noCloneEvent?: boolean;
    opacity?: boolean;
    optDisabled?: boolean;
    optSelected?: boolean;
    scriptEval? (): boolean;
    style?: boolean;
    submitBubbles?: boolean;
    tbody?: boolean;
}

interface JQueryParam {
    /**
     * Create a serialized representation of an array or object, suitable for use in a URL query string or Ajax request.
     * 
     * @param obj An array or object to serialize.
     */
    (obj: any): string;

    /**
     * Create a serialized representation of an array or object, suitable for use in a URL query string or Ajax request.
     * 
     * @param obj An array or object to serialize.
     * @param traditional A Boolean indicating whether to perform a traditional "shallow" serialization.
     */
    (obj: any, traditional: boolean): string;
}

/**
 * The interface used to construct jQuery events (with $.Event). It is
 * defined separately instead of inline in JQueryStatic to allow
 * overriding the construction function with specific strings
 * returning specific event objects.
 */
interface JQueryEventConstructor {
    (name: string, eventProperties?: any): JQueryEventObject;
    new (name: string, eventProperties?: any): JQueryEventObject;
}

/**
 * The interface used to specify coordinates.
 */
interface JQueryCoordinates {
    left: number;
    top: number;
}

/**
 * Elements in the array returned by serializeArray()
 */
interface JQuerySerializeArrayElement {
    name: string;
    value: string;
}

interface JQueryAnimationOptions { 
    /**
     * A string or number determining how long the animation will run.
     */
    duration?: any; 
    /**
     * A string indicating which easing function to use for the transition.
     */
    easing?: string; 
    /**
     * A function to call once the animation is complete.
     */
    complete?: Function; 
    /**
     * A function to be called for each animated property of each animated element. This function provides an opportunity to modify the Tween object to change the value of the property before it is set.
     */
    step?: (now: number, tween: any) => any; 
    /**
     * A function to be called after each step of the animation, only once per animated element regardless of the number of animated properties. (version added: 1.8)
     */
    progress?: (animation: JQueryPromise<any>, progress: number, remainingMs: number) => any; 
    /**
     * A function to call when the animation begins. (version added: 1.8)
     */
    start?: (animation: JQueryPromise<any>) => any; 
    /**
     * A function to be called when the animation completes (its Promise object is resolved). (version added: 1.8)
     */
    done?: (animation: JQueryPromise<any>, jumpedToEnd: boolean) => any; 
    /**
     * A function to be called when the animation fails to complete (its Promise object is rejected). (version added: 1.8)
     */
    fail?: (animation: JQueryPromise<any>, jumpedToEnd: boolean) => any; 
    /**
     * A function to be called when the animation completes or stops without completing (its Promise object is either resolved or rejected). (version added: 1.8)
     */
    always?: (animation: JQueryPromise<any>, jumpedToEnd: boolean) => any; 
    /**
     * A Boolean indicating whether to place the animation in the effects queue. If false, the animation will begin immediately. As of jQuery 1.7, the queue option can also accept a string, in which case the animation is added to the queue represented by that string. When a custom queue name is used the animation does not automatically start; you must call .dequeue("queuename") to start it.
     */
    queue?: any; 
    /**
     * A map of one or more of the CSS properties defined by the properties argument and their corresponding easing functions. (version added: 1.4)
     */
    specialEasing?: Object;
}

/**
 * Static members of jQuery (those on $ and jQuery themselves)
 */
interface JQueryStatic {

    /**
     * Perform an asynchronous HTTP (Ajax) request.
     *
     * @param settings A set of key/value pairs that configure the Ajax request. All settings are optional. A default can be set for any option with $.ajaxSetup().
     */
    ajax(settings: JQueryAjaxSettings): JQueryXHR;
    /**
     * Perform an asynchronous HTTP (Ajax) request.
     *
     * @param url A string containing the URL to which the request is sent.
     * @param settings A set of key/value pairs that configure the Ajax request. All settings are optional. A default can be set for any option with $.ajaxSetup().
     */
    ajax(url: string, settings?: JQueryAjaxSettings): JQueryXHR;

    /**
     * Handle custom Ajax options or modify existing options before each request is sent and before they are processed by $.ajax().
     *
     * @param dataTypes An optional string containing one or more space-separated dataTypes
     * @param handler A handler to set default values for future Ajax requests.
     */
    ajaxPrefilter(dataTypes: string, handler: (opts: any, originalOpts: JQueryAjaxSettings, jqXHR: JQueryXHR) => any): void;
    /**
     * Handle custom Ajax options or modify existing options before each request is sent and before they are processed by $.ajax().
     *
     * @param handler A handler to set default values for future Ajax requests.
     */
    ajaxPrefilter(handler: (opts: any, originalOpts: JQueryAjaxSettings, jqXHR: JQueryXHR) => any): void;

    ajaxSettings: JQueryAjaxSettings;

     /**
      * Set default values for future Ajax requests. Its use is not recommended.
      *
      * @param options A set of key/value pairs that configure the default Ajax request. All options are optional.
      */
    ajaxSetup(options: JQueryAjaxSettings): void;

    /**
     * Load data from the server using a HTTP GET request.
     *
     * @param url A string containing the URL to which the request is sent.
     * @param success A callback function that is executed if the request succeeds.
     * @param dataType The type of data expected from the server. Default: Intelligent Guess (xml, json, script, or html).
     */
    get(url: string, success?: (data: any, textStatus: string, jqXHR: JQueryXHR) => any, dataType?: string): JQueryXHR;
    /**
     * Load data from the server using a HTTP GET request.
     *
     * @param url A string containing the URL to which the request is sent.
     * @param data A plain object or string that is sent to the server with the request.
     * @param success A callback function that is executed if the request succeeds.
     * @param dataType The type of data expected from the server. Default: Intelligent Guess (xml, json, script, or html).
     */
    get(url: string, data?: Object|string, success?: (data: any, textStatus: string, jqXHR: JQueryXHR) => any, dataType?: string): JQueryXHR;
    /**
     * Load JSON-encoded data from the server using a GET HTTP request.
     *
     * @param url A string containing the URL to which the request is sent.
     * @param success A callback function that is executed if the request succeeds.
     */
    getJSON(url: string, success?: (data: any, textStatus: string, jqXHR: JQueryXHR) => any): JQueryXHR;
    /**
     * Load JSON-encoded data from the server using a GET HTTP request.
     *
     * @param url A string containing the URL to which the request is sent.
     * @param data A plain object or string that is sent to the server with the request.
     * @param success A callback function that is executed if the request succeeds.
     */
    getJSON(url: string, data?: Object|string, success?: (data: any, textStatus: string, jqXHR: JQueryXHR) => any): JQueryXHR;
    /**
     * Load a JavaScript file from the server using a GET HTTP request, then execute it.
     *
     * @param url A string containing the URL to which the request is sent.
     * @param success A callback function that is executed if the request succeeds.
     */
    getScript(url: string, success?: (script: string, textStatus: string, jqXHR: JQueryXHR) => any): JQueryXHR;

    /**
     * Create a serialized representation of an array or object, suitable for use in a URL query string or Ajax request.
     */
    param: JQueryParam;

    /**
     * Load data from the server using a HTTP POST request.
     *
     * @param url A string containing the URL to which the request is sent.
     * @param success A callback function that is executed if the request succeeds. Required if dataType is provided, but can be null in that case.
     * @param dataType The type of data expected from the server. Default: Intelligent Guess (xml, json, script, text, html).
     */
    post(url: string, success?: (data: any, textStatus: string, jqXHR: JQueryXHR) => any, dataType?: string): JQueryXHR;
    /**
     * Load data from the server using a HTTP POST request.
     *
     * @param url A string containing the URL to which the request is sent.
     * @param data A plain object or string that is sent to the server with the request.
     * @param success A callback function that is executed if the request succeeds. Required if dataType is provided, but can be null in that case.
     * @param dataType The type of data expected from the server. Default: Intelligent Guess (xml, json, script, text, html).
     */
    post(url: string, data?: Object|string, success?: (data: any, textStatus: string, jqXHR: JQueryXHR) => any, dataType?: string): JQueryXHR;

    /**
     * A multi-purpose callbacks list object that provides a powerful way to manage callback lists.
     *
     * @param flags An optional list of space-separated flags that change how the callback list behaves.
     */
    Callbacks(flags?: string): JQueryCallback;

    /**
     * Holds or releases the execution of jQuery's ready event.
     *
     * @param hold Indicates whether the ready hold is being requested or released
     */
    holdReady(hold: boolean): void;

    /**
     * Accepts a string containing a CSS selector which is then used to match a set of elements.
     *
     * @param selector A string containing a selector expression
     * @param context A DOM Element, Document, or jQuery to use as context
     */
    (selector: string, context?: Element|JQuery): JQuery;
    /**
     * Accepts a string containing a CSS selector which is then used to match a set of elements.
     *
     * @param element A DOM element to wrap in a jQuery object.
     */
    (element: Element): JQuery;
    /**
     * Accepts a string containing a CSS selector which is then used to match a set of elements.
     *
     * @param elementArray An array containing a set of DOM elements to wrap in a jQuery object.
     */
    (elementArray: Element[]): JQuery;
    /**
     * Accepts a string containing a CSS selector which is then used to match a set of elements.
     *
     * @param object A plain object to wrap in a jQuery object.
     */
    (object: {}): JQuery;
    /**
     * Accepts a string containing a CSS selector which is then used to match a set of elements.
     *
     * @param object An existing jQuery object to clone.
     */
    (object: JQuery): JQuery;
    /**
     * Specify a function to execute when the DOM is fully loaded.
     */
    (): JQuery;

    /**
     * Creates DOM elements on the fly from the provided string of raw HTML.
     *
     * @param html A string of HTML to create on the fly. Note that this parses HTML, not XML.
     * @param ownerDocument A document in which the new elements will be created.
     */
    (html: string, ownerDocument?: Document): JQuery;
    /**
     * Creates DOM elements on the fly from the provided string of raw HTML.
     *
     * @param html A string defining a single, standalone, HTML element (e.g. <div/> or <div></div>).
     * @param attributes An object of attributes, events, and methods to call on the newly-created element.
     */
    (html: string, attributes: Object): JQuery;

    /**
     * Binds a function to be executed when the DOM has finished loading.
     *
     * @param callback A function to execute after the DOM is ready.
     */
    (callback: Function): JQuery;

    /**
     * Relinquish jQuery's control of the $ variable.
     *
     * @param removeAll A Boolean indicating whether to remove all jQuery variables from the global scope (including jQuery itself).
     */
    noConflict(removeAll?: boolean): Object;

    /**
     * Provides a way to execute callback functions based on one or more objects, usually Deferred objects that represent asynchronous events.
     *
     * @param deferreds One or more Deferred objects, or plain JavaScript objects.
     */
    when<T>(...deferreds: JQueryGenericPromise<T>[]): JQueryPromise<T>;
    /**
     * Provides a way to execute callback functions based on one or more objects, usually Deferred objects that represent asynchronous events.
     *
     * @param deferreds One or more Deferred objects, or plain JavaScript objects.
     */
    when<T>(...deferreds: T[]): JQueryPromise<T>;
    /**
     * Provides a way to execute callback functions based on one or more objects, usually Deferred objects that represent asynchronous events.
     *
     * @param deferreds One or more Deferred objects, or plain JavaScript objects.
     */
    when<T>(...deferreds: any[]): JQueryPromise<T>;

    /**
     * Hook directly into jQuery to override how particular CSS properties are retrieved or set, normalize CSS property naming, or create custom properties.
     */
    cssHooks: { [key: string]: any; };
    cssNumber: any;

    /**
     * Store arbitrary data associated with the specified element. Returns the value that was set.
     *
     * @param element The DOM element to associate with the data.
     * @param key A string naming the piece of data to set.
     * @param value The new data value.
     */
    data<T>(element: Element, key: string, value: T): T;
    /**
     * Returns value at named data store for the element, as set by jQuery.data(element, name, value), or the full data store for the element.
     *
     * @param element The DOM element to associate with the data.
     * @param key A string naming the piece of data to set.
     */
    data(element: Element, key: string): any;
    /**
     * Returns value at named data store for the element, as set by jQuery.data(element, name, value), or the full data store for the element.
     *
     * @param element The DOM element to associate with the data.
     */
    data(element: Element): any;

    /**
     * Execute the next function on the queue for the matched element.
     *
     * @param element A DOM element from which to remove and execute a queued function.
     * @param queueName A string containing the name of the queue. Defaults to fx, the standard effects queue.
     */
    dequeue(element: Element, queueName?: string): void;

    /**
     * Determine whether an element has any jQuery data associated with it.
     *
     * @param element A DOM element to be checked for data.
     */
    hasData(element: Element): boolean;

    /**
     * Show the queue of functions to be executed on the matched element.
     *
     * @param element A DOM element to inspect for an attached queue.
     * @param queueName A string containing the name of the queue. Defaults to fx, the standard effects queue.
     */
    queue(element: Element, queueName?: string): any[];
    /**
     * Manipulate the queue of functions to be executed on the matched element.
     *
     * @param element A DOM element where the array of queued functions is attached.
     * @param queueName A string containing the name of the queue. Defaults to fx, the standard effects queue.
     * @param newQueue An array of functions to replace the current queue contents.
     */
    queue(element: Element, queueName: string, newQueue: Function[]): JQuery;
    /**
     * Manipulate the queue of functions to be executed on the matched element.
     *
     * @param element A DOM element on which to add a queued function.
     * @param queueName A string containing the name of the queue. Defaults to fx, the standard effects queue.
     * @param callback The new function to add to the queue.
     */
    queue(element: Element, queueName: string, callback: Function): JQuery;

    /**
     * Remove a previously-stored piece of data.
     *
     * @param element A DOM element from which to remove data.
     * @param name A string naming the piece of data to remove.
     */
    removeData(element: Element, name?: string): JQuery;

    /**
     * A constructor function that returns a chainable utility object with methods to register multiple callbacks into callback queues, invoke callback queues, and relay the success or failure state of any synchronous or asynchronous function.
     *
     * @param beforeStart A function that is called just before the constructor returns.
     */
    Deferred<T>(beforeStart?: (deferred: JQueryDeferred<T>) => any): JQueryDeferred<T>;

    /**
     * Effects
     */
    fx: {
        tick: () => void;
        /**
         * The rate (in milliseconds) at which animations fire.
         */
        interval: number;
        stop: () => void;
        speeds: { slow: number; fast: number; };
        /**
         * Globally disable all animations.
         */
        off: boolean;
        step: any;
    };

    /**
     * Takes a function and returns a new one that will always have a particular context.
     *
     * @param fnction The function whose context will be changed.
     * @param context The object to which the context (this) of the function should be set.
     * @param additionalArguments Any number of arguments to be passed to the function referenced in the function argument.
     */
    proxy(fnction: (...args: any[]) => any, context: Object, ...additionalArguments: any[]): any;
    /**
     * Takes a function and returns a new one that will always have a particular context.
     *
     * @param context The object to which the context (this) of the function should be set.
     * @param name The name of the function whose context will be changed (should be a property of the context object).
     * @param additionalArguments Any number of arguments to be passed to the function named in the name argument.
     */
    proxy(context: Object, name: string, ...additionalArguments: any[]): any;

    Event: JQueryEventConstructor;

    /**
     * Takes a string and throws an exception containing it.
     *
     * @param message The message to send out.
     */
    error(message: any): JQuery;

    expr: any;
    fn: any;  //TODO: Decide how we want to type this

    isReady: boolean;

    // Properties
    support: JQuerySupport;

    /**
     * Check to see if a DOM element is a descendant of another DOM element.
     * 
     * @param container The DOM element that may contain the other element.
     * @param contained The DOM element that may be contained by (a descendant of) the other element.
     */
    contains(container: Element, contained: Element): boolean;

    /**
     * A generic iterator function, which can be used to seamlessly iterate over both objects and arrays. Arrays and array-like objects with a length property (such as a function's arguments object) are iterated by numeric index, from 0 to length-1. Other objects are iterated via their named properties.
     * 
     * @param collection The object or array to iterate over.
     * @param callback The function that will be executed on every object.
     */
    each<T>(
        collection: T[],
        callback: (indexInArray: number, valueOfElement: T) => any
        ): any;

    /**
     * A generic iterator function, which can be used to seamlessly iterate over both objects and arrays. Arrays and array-like objects with a length property (such as a function's arguments object) are iterated by numeric index, from 0 to length-1. Other objects are iterated via their named properties.
     * 
     * @param collection The object or array to iterate over.
     * @param callback The function that will be executed on every object.
     */
    each(
        collection: any,
        callback: (indexInArray: any, valueOfElement: any) => any
        ): any;

    /**
     * Merge the contents of two or more objects together into the first object.
     *
     * @param target An object that will receive the new properties if additional objects are passed in or that will extend the jQuery namespace if it is the sole argument.
     * @param object1 An object containing additional properties to merge in.
     * @param objectN Additional objects containing properties to merge in.
     */
    extend(target: any, object1?: any, ...objectN: any[]): any;
    /**
     * Merge the contents of two or more objects together into the first object.
     *
     * @param deep If true, the merge becomes recursive (aka. deep copy).
     * @param target The object to extend. It will receive the new properties.
     * @param object1 An object containing additional properties to merge in.
     * @param objectN Additional objects containing properties to merge in.
     */
    extend(deep: boolean, target: any, object1?: any, ...objectN: any[]): any;

    /**
     * Execute some JavaScript code globally.
     *
     * @param code The JavaScript code to execute.
     */
    globalEval(code: string): any;

    /**
     * Finds the elements of an array which satisfy a filter function. The original array is not affected.
     *
     * @param array The array to search through.
     * @param func The function to process each item against. The first argument to the function is the item, and the second argument is the index. The function should return a Boolean value.  this will be the global window object.
     * @param invert If "invert" is false, or not provided, then the function returns an array consisting of all elements for which "callback" returns true. If "invert" is true, then the function returns an array consisting of all elements for which "callback" returns false.
     */
    grep<T>(array: T[], func: (elementOfArray: T, indexInArray: number) => boolean, invert?: boolean): T[];

    /**
     * Search for a specified value within an array and return its index (or -1 if not found).
     *
     * @param value The value to search for.
     * @param array An array through which to search.
     * @param fromIndex he index of the array at which to begin the search. The default is 0, which will search the whole array.
     */
    inArray<T>(value: T, array: T[], fromIndex?: number): number;

    /**
     * Determine whether the argument is an array.
     *
     * @param obj Object to test whether or not it is an array.
     */
    isArray(obj: any): boolean;
    /**
     * Check to see if an object is empty (contains no enumerable properties).
     *
     * @param obj The object that will be checked to see if it's empty.
     */
    isEmptyObject(obj: any): boolean;
    /**
     * Determine if the argument passed is a Javascript function object.
     *
     * @param obj Object to test whether or not it is a function.
     */
    isFunction(obj: any): boolean;
    /**
     * Determines whether its argument is a number.
     *
     * @param obj The value to be tested.
     */
    isNumeric(value: any): boolean;
    /**
     * Check to see if an object is a plain object (created using "{}" or "new Object").
     *
     * @param obj The object that will be checked to see if it's a plain object.
     */
    isPlainObject(obj: any): boolean;
    /**
     * Determine whether the argument is a window.
     *
     * @param obj Object to test whether or not it is a window.
     */
    isWindow(obj: any): boolean;
    /**
     * Check to see if a DOM node is within an XML document (or is an XML document).
     *
     * @param node he DOM node that will be checked to see if it's in an XML document.
     */
    isXMLDoc(node: Node): boolean;

    /**
     * Convert an array-like object into a true JavaScript array.
     * 
     * @param obj Any object to turn into a native Array.
     */
    makeArray(obj: any): any[];

    /**
     * Translate all items in an array or object to new array of items.
     * 
     * @param array The Array to translate.
     * @param callback The function to process each item against. The first argument to the function is the array item, the second argument is the index in array The function can return any value. Within the function, this refers to the global (window) object.
     */
    map<T, U>(array: T[], callback: (elementOfArray: T, indexInArray: number) => U): U[];
    /**
     * Translate all items in an array or object to new array of items.
     * 
     * @param arrayOrObject The Array or Object to translate.
     * @param callback The function to process each item against. The first argument to the function is the value; the second argument is the index or key of the array or object property. The function can return any value to add to the array. A returned array will be flattened into the resulting array. Within the function, this refers to the global (window) object.
     */
    map(arrayOrObject: any, callback: (value: any, indexOrKey: any) => any): any;

    /**
     * Merge the contents of two arrays together into the first array.
     * 
     * @param first The first array to merge, the elements of second added.
     * @param second The second array to merge into the first, unaltered.
     */
    merge<T>(first: T[], second: T[]): T[];

    /**
     * An empty function.
     */
    noop(): any;

    /**
     * Return a number representing the current time.
     */
    now(): number;

    /**
     * Takes a well-formed JSON string and returns the resulting JavaScript object.
     * 
     * @param json The JSON string to parse.
     */
    parseJSON(json: string): any;

    /**
     * Parses a string into an XML document.
     *
     * @param data a well-formed XML string to be parsed
     */
    parseXML(data: string): XMLDocument;

    /**
     * Remove the whitespace from the beginning and end of a string.
     * 
     * @param str Remove the whitespace from the beginning and end of a string.
     */
    trim(str: string): string;

    /**
     * Determine the internal JavaScript [[Class]] of an object.
     * 
     * @param obj Object to get the internal JavaScript [[Class]] of.
     */
    type(obj: any): string;

    /**
     * Sorts an array of DOM elements, in place, with the duplicates removed. Note that this only works on arrays of DOM elements, not strings or numbers.
     * 
     * @param array The Array of DOM elements.
     */
    unique(array: Element[]): Element[];

    /**
     * Parses a string into an array of DOM nodes.
     *
     * @param data HTML string to be parsed
     * @param context DOM element to serve as the context in which the HTML fragment will be created
     * @param keepScripts A Boolean indicating whether to include scripts passed in the HTML string
     */
    parseHTML(data: string, context?: HTMLElement, keepScripts?: boolean): any[];

    /**
     * Parses a string into an array of DOM nodes.
     *
     * @param data HTML string to be parsed
     * @param context DOM element to serve as the context in which the HTML fragment will be created
     * @param keepScripts A Boolean indicating whether to include scripts passed in the HTML string
     */
    parseHTML(data: string, context?: Document, keepScripts?: boolean): any[];
}

/**
 * The jQuery instance members
 */
interface JQuery {
    /**
     * Register a handler to be called when Ajax requests complete. This is an AjaxEvent.
     *
     * @param handler The function to be invoked.
     */
    ajaxComplete(handler: (event: JQueryEventObject, XMLHttpRequest: XMLHttpRequest, ajaxOptions: any) => any): JQuery;
    /**
     * Register a handler to be called when Ajax requests complete with an error. This is an Ajax Event.
     *
     * @param handler The function to be invoked.
     */
    ajaxError(handler: (event: JQueryEventObject, jqXHR: JQueryXHR, ajaxSettings: JQueryAjaxSettings, thrownError: any) => any): JQuery;
    /**
     * Attach a function to be executed before an Ajax request is sent. This is an Ajax Event.
     *
     * @param handler The function to be invoked.
     */
    ajaxSend(handler: (event: JQueryEventObject, jqXHR: JQueryXHR, ajaxOptions: JQueryAjaxSettings) => any): JQuery;
    /**
     * Register a handler to be called when the first Ajax request begins. This is an Ajax Event.
     *
     * @param handler The function to be invoked.
     */
    ajaxStart(handler: () => any): JQuery;
    /**
     * Register a handler to be called when all Ajax requests have completed. This is an Ajax Event.
     *
     * @param handler The function to be invoked.
     */
    ajaxStop(handler: () => any): JQuery;
    /**
     * Attach a function to be executed whenever an Ajax request completes successfully. This is an Ajax Event.
     *
     * @param handler The function to be invoked.
     */
    ajaxSuccess(handler: (event: JQueryEventObject, XMLHttpRequest: XMLHttpRequest, ajaxOptions: JQueryAjaxSettings) => any): JQuery;

    /**
     * Load data from the server and place the returned HTML into the matched element.
     *
     * @param url A string containing the URL to which the request is sent.
     * @param data A plain object or string that is sent to the server with the request.
     * @param complete A callback function that is executed when the request completes.
     */
    load(url: string, data?: string|Object, complete?: (responseText: string, textStatus: string, XMLHttpRequest: XMLHttpRequest) => any): JQuery;

    /**
     * Encode a set of form elements as a string for submission.
     */
    serialize(): string;
    /**
     * Encode a set of form elements as an array of names and values.
     */
    serializeArray(): JQuerySerializeArrayElement[];

    /**
     * Adds the specified class(es) to each of the set of matched elements.
     *
     * @param className One or more space-separated classes to be added to the class attribute of each matched element.
     */
    addClass(className: string): JQuery;
    /**
     * Adds the specified class(es) to each of the set of matched elements.
     *
     * @param function A function returning one or more space-separated class names to be added to the existing class name(s). Receives the index position of the element in the set and the existing class name(s) as arguments. Within the function, this refers to the current element in the set.
     */
    addClass(func: (index: number, className: string) => string): JQuery;

    /**
     * Add the previous set of elements on the stack to the current set, optionally filtered by a selector.
     */
    addBack(selector?: string): JQuery;

    /**
     * Get the value of an attribute for the first element in the set of matched elements.
     *
     * @param attributeName The name of the attribute to get.
     */
    attr(attributeName: string): string;
    /**
     * Set one or more attributes for the set of matched elements.
     *
     * @param attributeName The name of the attribute to set.
     * @param value A value to set for the attribute.
     */
    attr(attributeName: string, value: string|number): JQuery;
    /**
     * Set one or more attributes for the set of matched elements.
     *
     * @param attributeName The name of the attribute to set.
     * @param func A function returning the value to set. this is the current element. Receives the index position of the element in the set and the old attribute value as arguments.
     */
    attr(attributeName: string, func: (index: number, attr: string) => string|number): JQuery;
    /**
     * Set one or more attributes for the set of matched elements.
     *
     * @param attributes An object of attribute-value pairs to set.
     */
    attr(attributes: Object): JQuery;
    
    /**
     * Determine whether any of the matched elements are assigned the given class.
     *
     * @param className The class name to search for.
     */
    hasClass(className: string): boolean;

    /**
     * Get the HTML contents of the first element in the set of matched elements.
     */
    html(): string;
    /**
     * Set the HTML contents of each element in the set of matched elements.
     *
     * @param htmlString A string of HTML to set as the content of each matched element.
     */
    html(htmlString: string): JQuery;
    /**
     * Set the HTML contents of each element in the set of matched elements.
     *
     * @param func A function returning the HTML content to set. Receives the index position of the element in the set and the old HTML value as arguments. jQuery empties the element before calling the function; use the oldhtml argument to reference the previous content. Within the function, this refers to the current element in the set.
     */
    html(func: (index: number, oldhtml: string) => string): JQuery;
    /**
     * Set the HTML contents of each element in the set of matched elements.
     *
     * @param func A function returning the HTML content to set. Receives the index position of the element in the set and the old HTML value as arguments. jQuery empties the element before calling the function; use the oldhtml argument to reference the previous content. Within the function, this refers to the current element in the set.
     */

    /**
     * Get the value of a property for the first element in the set of matched elements.
     *
     * @param propertyName The name of the property to get.
     */
    prop(propertyName: string): any;
    /**
     * Set one or more properties for the set of matched elements.
     *
     * @param propertyName The name of the property to set.
     * @param value A value to set for the property.
     */
    prop(propertyName: string, value: string|number|boolean): JQuery;
    /**
     * Set one or more properties for the set of matched elements.
     *
     * @param properties An object of property-value pairs to set.
     */
    prop(properties: Object): JQuery;
    /**
     * Set one or more properties for the set of matched elements.
     *
     * @param propertyName The name of the property to set.
     * @param func A function returning the value to set. Receives the index position of the element in the set and the old property value as arguments. Within the function, the keyword this refers to the current element.
     */
    prop(propertyName: string, func: (index: number, oldPropertyValue: any) => any): JQuery;

    /**
     * Remove an attribute from each element in the set of matched elements.
     *
     * @param attributeName An attribute to remove; as of version 1.7, it can be a space-separated list of attributes.
     */
    removeAttr(attributeName: string): JQuery;

    /**
     * Remove a single class, multiple classes, or all classes from each element in the set of matched elements.
     *
     * @param className One or more space-separated classes to be removed from the class attribute of each matched element.
     */
    removeClass(className?: string): JQuery;
    /**
     * Remove a single class, multiple classes, or all classes from each element in the set of matched elements.
     *
     * @param function A function returning one or more space-separated class names to be removed. Receives the index position of the element in the set and the old class value as arguments.
     */
    removeClass(func: (index: number, className: string) => string): JQuery;

    /**
     * Remove a property for the set of matched elements.
     *
     * @param propertyName The name of the property to remove.
     */
    removeProp(propertyName: string): JQuery;

    /**
     * Add or remove one or more classes from each element in the set of matched elements, depending on either the class's presence or the value of the switch argument.
     *
     * @param className One or more class names (separated by spaces) to be toggled for each element in the matched set.
     * @param swtch A Boolean (not just truthy/falsy) value to determine whether the class should be added or removed.
     */
    toggleClass(className: string, swtch?: boolean): JQuery;
    /**
     * Add or remove one or more classes from each element in the set of matched elements, depending on either the class's presence or the value of the switch argument.
     *
     * @param swtch A boolean value to determine whether the class should be added or removed.
     */
    toggleClass(swtch?: boolean): JQuery;
    /**
     * Add or remove one or more classes from each element in the set of matched elements, depending on either the class's presence or the value of the switch argument.
     *
     * @param func A function that returns class names to be toggled in the class attribute of each element in the matched set. Receives the index position of the element in the set, the old class value, and the switch as arguments.
     * @param swtch A boolean value to determine whether the class should be added or removed.
     */
    toggleClass(func: (index: number, className: string, swtch: boolean) => string, swtch?: boolean): JQuery;

    /**
     * Get the current value of the first element in the set of matched elements.
     */
    val(): any;
    /**
     * Set the value of each element in the set of matched elements.
     *
     * @param value A string of text or an array of strings corresponding to the value of each matched element to set as selected/checked.
     */
    val(value: string|string[]): JQuery;
    /**
     * Set the value of each element in the set of matched elements.
     *
     * @param func A function returning the value to set. this is the current element. Receives the index position of the element in the set and the old value as arguments.
     */
    val(func: (index: number, value: string) => string): JQuery;


    /**
     * Get the value of style properties for the first element in the set of matched elements.
     *
     * @param propertyName A CSS property.
     */
    css(propertyName: string): string;
    /**
     * Set one or more CSS properties for the set of matched elements.
     *
     * @param propertyName A CSS property name.
     * @param value A value to set for the property.
     */
    css(propertyName: string, value: string|number): JQuery;
    /**
     * Set one or more CSS properties for the set of matched elements.
     *
     * @param propertyName A CSS property name.
     * @param value A function returning the value to set. this is the current element. Receives the index position of the element in the set and the old value as arguments.
     */
    css(propertyName: string, value: (index: number, value: string) => string|number): JQuery;
    /**
     * Set one or more CSS properties for the set of matched elements.
     *
     * @param properties An object of property-value pairs to set.
     */
    css(properties: Object): JQuery;

    /**
     * Get the current computed height for the first element in the set of matched elements.
     */
    height(): number;
    /**
     * Set the CSS height of every matched element.
     *
     * @param value An integer representing the number of pixels, or an integer with an optional unit of measure appended (as a string).
     */
    height(value: number|string): JQuery;
    /**
     * Set the CSS height of every matched element.
     *
     * @param func A function returning the height to set. Receives the index position of the element in the set and the old height as arguments. Within the function, this refers to the current element in the set.
     */
    height(func: (index: number, height: number) => number|string): JQuery;

    /**
     * Get the current computed height for the first element in the set of matched elements, including padding but not border.
     */
    innerHeight(): number;

    /**
     * Sets the inner height on elements in the set of matched elements, including padding but not border.
     *
     * @param value An integer representing the number of pixels, or an integer along with an optional unit of measure appended (as a string).
     */
    innerHeight(height: number|string): JQuery;
    
    /**
     * Get the current computed width for the first element in the set of matched elements, including padding but not border.
     */
    innerWidth(): number;

    /**
     * Sets the inner width on elements in the set of matched elements, including padding but not border.
     *
     * @param value An integer representing the number of pixels, or an integer along with an optional unit of measure appended (as a string).
     */
    innerWidth(width: number|string): JQuery;
    
    /**
     * Get the current coordinates of the first element in the set of matched elements, relative to the document.
     */
    offset(): JQueryCoordinates;
    /**
     * An object containing the properties top and left, which are integers indicating the new top and left coordinates for the elements.
     *
     * @param coordinates An object containing the properties top and left, which are integers indicating the new top and left coordinates for the elements.
     */
    offset(coordinates: JQueryCoordinates): JQuery;
    /**
     * An object containing the properties top and left, which are integers indicating the new top and left coordinates for the elements.
     *
     * @param func A function to return the coordinates to set. Receives the index of the element in the collection as the first argument and the current coordinates as the second argument. The function should return an object with the new top and left properties.
     */
    offset(func: (index: number, coords: JQueryCoordinates) => JQueryCoordinates): JQuery;

    /**
     * Get the current computed height for the first element in the set of matched elements, including padding, border, and optionally margin. Returns an integer (without "px") representation of the value or null if called on an empty set of elements.
     *
     * @param includeMargin A Boolean indicating whether to include the element's margin in the calculation.
     */
    outerHeight(includeMargin?: boolean): number;

    /**
     * Sets the outer height on elements in the set of matched elements, including padding and border.
     *
     * @param value An integer representing the number of pixels, or an integer along with an optional unit of measure appended (as a string).
     */
    outerHeight(height: number|string): JQuery;

    /**
     * Get the current computed width for the first element in the set of matched elements, including padding and border.
     *
     * @param includeMargin A Boolean indicating whether to include the element's margin in the calculation.
     */
    outerWidth(includeMargin?: boolean): number;

    /**
     * Sets the outer width on elements in the set of matched elements, including padding and border.
     *
     * @param value An integer representing the number of pixels, or an integer along with an optional unit of measure appended (as a string).
     */
    outerWidth(width: number|string): JQuery;

    /**
     * Get the current coordinates of the first element in the set of matched elements, relative to the offset parent.
     */
    position(): JQueryCoordinates;

    /**
     * Get the current horizontal position of the scroll bar for the first element in the set of matched elements or set the horizontal position of the scroll bar for every matched element.
     */
    scrollLeft(): number;
    /**
     * Set the current horizontal position of the scroll bar for each of the set of matched elements.
     *
     * @param value An integer indicating the new position to set the scroll bar to.
     */
    scrollLeft(value: number): JQuery;

    /**
     * Get the current vertical position of the scroll bar for the first element in the set of matched elements or set the vertical position of the scroll bar for every matched element.
     */
    scrollTop(): number;
    /**
     * Set the current vertical position of the scroll bar for each of the set of matched elements.
     *
     * @param value An integer indicating the new position to set the scroll bar to.
     */
    scrollTop(value: number): JQuery;

    /**
     * Get the current computed width for the first element in the set of matched elements.
     */
    width(): number;
    /**
     * Set the CSS width of each element in the set of matched elements.
     *
     * @param value An integer representing the number of pixels, or an integer along with an optional unit of measure appended (as a string).
     */
    width(value: number|string): JQuery;
    /**
     * Set the CSS width of each element in the set of matched elements.
     *
     * @param func A function returning the width to set. Receives the index position of the element in the set and the old width as arguments. Within the function, this refers to the current element in the set.
     */
    width(func: (index: number, width: number) => number|string): JQuery;

    /**
     * Remove from the queue all items that have not yet been run.
     *
     * @param queueName A string containing the name of the queue. Defaults to fx, the standard effects queue.
     */
    clearQueue(queueName?: string): JQuery;

    /**
     * Store arbitrary data associated with the matched elements.
     *
     * @param key A string naming the piece of data to set.
     * @param value The new data value; it can be any Javascript type including Array or Object.
     */
    data(key: string, value: any): JQuery;
    /**
     * Store arbitrary data associated with the matched elements.
     *
     * @param obj An object of key-value pairs of data to update.
     */
    data(obj: { [key: string]: any; }): JQuery;
    /**
     * Return the value at the named data store for the first element in the jQuery collection, as set by data(name, value) or by an HTML5 data-* attribute.
     *
     * @param key Name of the data stored.
     */
    data(key: string): any;
    /**
     * Return the value at the named data store for the first element in the jQuery collection, as set by data(name, value) or by an HTML5 data-* attribute.
     */
    data(): any;

    /**
     * Execute the next function on the queue for the matched elements.
     *
     * @param queueName A string containing the name of the queue. Defaults to fx, the standard effects queue.
     */
    dequeue(queueName?: string): JQuery;

    /**
     * Remove a previously-stored piece of data.
     *
     * @param name A string naming the piece of data to delete or space-separated string naming the pieces of data to delete.
     */
    removeData(name: string): JQuery;
    /**
     * Remove a previously-stored piece of data.
     *
     * @param list An array of strings naming the pieces of data to delete.
     */
    removeData(list: string[]): JQuery;

    /**
     * Return a Promise object to observe when all actions of a certain type bound to the collection, queued or not, have finished.
     *
     * @param type The type of queue that needs to be observed. (default: fx)
     * @param target Object onto which the promise methods have to be attached
     */
    promise(type?: string, target?: Object): JQueryPromise<any>;

    /**
     * Perform a custom animation of a set of CSS properties.
     *
     * @param properties An object of CSS properties and values that the animation will move toward.
     * @param duration A string or number determining how long the animation will run.
     * @param complete A function to call once the animation is complete.
     */
    animate(properties: Object, duration?: string|number, complete?: Function): JQuery;
    /**
     * Perform a custom animation of a set of CSS properties.
     *
     * @param properties An object of CSS properties and values that the animation will move toward.
     * @param duration A string or number determining how long the animation will run.
     * @param easing A string indicating which easing function to use for the transition. (default: swing)
     * @param complete A function to call once the animation is complete.
     */
    animate(properties: Object, duration?: string|number, easing?: string, complete?: Function): JQuery;
    /**
     * Perform a custom animation of a set of CSS properties.
     *
     * @param properties An object of CSS properties and values that the animation will move toward.
     * @param options A map of additional options to pass to the method.
     */
    animate(properties: Object, options: JQueryAnimationOptions): JQuery;

    /**
     * Set a timer to delay execution of subsequent items in the queue.
     *
     * @param duration An integer indicating the number of milliseconds to delay execution of the next item in the queue.
     * @param queueName A string containing the name of the queue. Defaults to fx, the standard effects queue.
     */
    delay(duration: number, queueName?: string): JQuery;

    /**
     * Display the matched elements by fading them to opaque.
     *
     * @param duration A string or number determining how long the animation will run.
     * @param complete A function to call once the animation is complete.
     */
    fadeIn(duration?: number|string, complete?: Function): JQuery;
    /**
     * Display the matched elements by fading them to opaque.
     *
     * @param duration A string or number determining how long the animation will run.
     * @param easing A string indicating which easing function to use for the transition.
     * @param complete A function to call once the animation is complete.
     */
    fadeIn(duration?: number|string, easing?: string, complete?: Function): JQuery;
    /**
     * Display the matched elements by fading them to opaque.
     *
     * @param options A map of additional options to pass to the method.
     */
    fadeIn(options: JQueryAnimationOptions): JQuery;

    /**
     * Hide the matched elements by fading them to transparent.
     *
     * @param duration A string or number determining how long the animation will run.
     * @param complete A function to call once the animation is complete.
     */
    fadeOut(duration?: number|string, complete?: Function): JQuery;
    /**
     * Hide the matched elements by fading them to transparent.
     *
     * @param duration A string or number determining how long the animation will run.
     * @param easing A string indicating which easing function to use for the transition.
     * @param complete A function to call once the animation is complete.
     */
    fadeOut(duration?: number|string, easing?: string, complete?: Function): JQuery;
    /**
     * Hide the matched elements by fading them to transparent.
     *
     * @param options A map of additional options to pass to the method.
     */
    fadeOut(options: JQueryAnimationOptions): JQuery;

    /**
     * Adjust the opacity of the matched elements.
     *
     * @param duration A string or number determining how long the animation will run.
     * @param opacity A number between 0 and 1 denoting the target opacity.
     * @param complete A function to call once the animation is complete.
     */
    fadeTo(duration: string|number, opacity: number, complete?: Function): JQuery;
    /**
     * Adjust the opacity of the matched elements.
     *
     * @param duration A string or number determining how long the animation will run.
     * @param opacity A number between 0 and 1 denoting the target opacity.
     * @param easing A string indicating which easing function to use for the transition.
     * @param complete A function to call once the animation is complete.
     */
    fadeTo(duration: string|number, opacity: number, easing?: string, complete?: Function): JQuery;

    /**
     * Display or hide the matched elements by animating their opacity.
     *
     * @param duration A string or number determining how long the animation will run.
     * @param complete A function to call once the animation is complete.
     */
    fadeToggle(duration?: number|string, complete?: Function): JQuery;
    /**
     * Display or hide the matched elements by animating their opacity.
     *
     * @param duration A string or number determining how long the animation will run.
     * @param easing A string indicating which easing function to use for the transition.
     * @param complete A function to call once the animation is complete.
     */
    fadeToggle(duration?: number|string, easing?: string, complete?: Function): JQuery;
    /**
     * Display or hide the matched elements by animating their opacity.
     *
     * @param options A map of additional options to pass to the method.
     */
    fadeToggle(options: JQueryAnimationOptions): JQuery;

    /**
     * Stop the currently-running animation, remove all queued animations, and complete all animations for the matched elements.
     *
     * @param queue The name of the queue in which to stop animations.
     */
    finish(queue?: string): JQuery;

    /**
     * Hide the matched elements.
     *
     * @param duration A string or number determining how long the animation will run.
     * @param complete A function to call once the animation is complete.
     */
    hide(duration?: number|string, complete?: Function): JQuery;
    /**
     * Hide the matched elements.
     *
     * @param duration A string or number determining how long the animation will run.
     * @param easing A string indicating which easing function to use for the transition.
     * @param complete A function to call once the animation is complete.
     */
    hide(duration?: number|string, easing?: string, complete?: Function): JQuery;
    /**
     * Hide the matched elements.
     *
     * @param options A map of additional options to pass to the method.
     */
    hide(options: JQueryAnimationOptions): JQuery;

    /**
     * Display the matched elements.
     *
     * @param duration A string or number determining how long the animation will run.
     * @param complete A function to call once the animation is complete.
     */
    show(duration?: number|string, complete?: Function): JQuery;
    /**
     * Display the matched elements.
     *
     * @param duration A string or number determining how long the animation will run.
     * @param easing A string indicating which easing function to use for the transition.
     * @param complete A function to call once the animation is complete.
     */
    show(duration?: number|string, easing?: string, complete?: Function): JQuery;
    /**
     * Display the matched elements.
     *
     * @param options A map of additional options to pass to the method.
     */
    show(options: JQueryAnimationOptions): JQuery;

    /**
     * Display the matched elements with a sliding motion.
     *
     * @param duration A string or number determining how long the animation will run.
     * @param complete A function to call once the animation is complete.
     */
    slideDown(duration?: number|string, complete?: Function): JQuery;
    /**
     * Display the matched elements with a sliding motion.
     *
     * @param duration A string or number determining how long the animation will run.
     * @param easing A string indicating which easing function to use for the transition.
     * @param complete A function to call once the animation is complete.
     */
    slideDown(duration?: number|string, easing?: string, complete?: Function): JQuery;
    /**
     * Display the matched elements with a sliding motion.
     *
     * @param options A map of additional options to pass to the method.
     */
    slideDown(options: JQueryAnimationOptions): JQuery;

    /**
     * Display or hide the matched elements with a sliding motion.
     *
     * @param duration A string or number determining how long the animation will run.
     * @param complete A function to call once the animation is complete.
     */
    slideToggle(duration?: number|string, complete?: Function): JQuery;
    /**
     * Display or hide the matched elements with a sliding motion.
     *
     * @param duration A string or number determining how long the animation will run.
     * @param easing A string indicating which easing function to use for the transition.
     * @param complete A function to call once the animation is complete.
     */
    slideToggle(duration?: number|string, easing?: string, complete?: Function): JQuery;
    /**
     * Display or hide the matched elements with a sliding motion.
     *
     * @param options A map of additional options to pass to the method.
     */
    slideToggle(options: JQueryAnimationOptions): JQuery;

    /**
     * Hide the matched elements with a sliding motion.
     *
     * @param duration A string or number determining how long the animation will run.
     * @param complete A function to call once the animation is complete.
     */
    slideUp(duration?: number|string, complete?: Function): JQuery;
    /**
     * Hide the matched elements with a sliding motion.
     *
     * @param duration A string or number determining how long the animation will run.
     * @param easing A string indicating which easing function to use for the transition.
     * @param complete A function to call once the animation is complete.
     */
    slideUp(duration?: number|string, easing?: string, complete?: Function): JQuery;
    /**
     * Hide the matched elements with a sliding motion.
     *
     * @param options A map of additional options to pass to the method.
     */
    slideUp(options: JQueryAnimationOptions): JQuery;

    /**
     * Stop the currently-running animation on the matched elements.
     *
     * @param clearQueue A Boolean indicating whether to remove queued animation as well. Defaults to false.
     * @param jumpToEnd A Boolean indicating whether to complete the current animation immediately. Defaults to false.
     */
    stop(clearQueue?: boolean, jumpToEnd?: boolean): JQuery;
    /**
     * Stop the currently-running animation on the matched elements.
     *
     * @param queue The name of the queue in which to stop animations.
     * @param clearQueue A Boolean indicating whether to remove queued animation as well. Defaults to false.
     * @param jumpToEnd A Boolean indicating whether to complete the current animation immediately. Defaults to false.
     */
    stop(queue?: string, clearQueue?: boolean, jumpToEnd?: boolean): JQuery;

    /**
     * Display or hide the matched elements.
     *
     * @param duration A string or number determining how long the animation will run.
     * @param complete A function to call once the animation is complete.
     */
    toggle(duration?: number|string, complete?: Function): JQuery;
    /**
     * Display or hide the matched elements.
     *
     * @param duration A string or number determining how long the animation will run.
     * @param easing A string indicating which easing function to use for the transition.
     * @param complete A function to call once the animation is complete.
     */
    toggle(duration?: number|string, easing?: string, complete?: Function): JQuery;
    /**
     * Display or hide the matched elements.
     *
     * @param options A map of additional options to pass to the method.
     */
    toggle(options: JQueryAnimationOptions): JQuery;
    /**
     * Display or hide the matched elements.
     *
     * @param showOrHide A Boolean indicating whether to show or hide the elements.
     */
    toggle(showOrHide: boolean): JQuery;

    /**
     * Attach a handler to an event for the elements.
     * 
     * @param eventType A string containing one or more DOM event types, such as "click" or "submit," or custom event names.
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute each time the event is triggered.
     */
    bind(eventType: string, eventData: any, handler: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Attach a handler to an event for the elements.
     * 
     * @param eventType A string containing one or more DOM event types, such as "click" or "submit," or custom event names.
     * @param handler A function to execute each time the event is triggered.
     */
    bind(eventType: string, handler: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Attach a handler to an event for the elements.
     * 
     * @param eventType A string containing one or more DOM event types, such as "click" or "submit," or custom event names.
     * @param eventData An object containing data that will be passed to the event handler.
     * @param preventBubble Setting the third argument to false will attach a function that prevents the default action from occurring and stops the event from bubbling. The default is true.
     */
    bind(eventType: string, eventData: any, preventBubble: boolean): JQuery;
    /**
     * Attach a handler to an event for the elements.
     * 
     * @param eventType A string containing one or more DOM event types, such as "click" or "submit," or custom event names.
     * @param preventBubble Setting the third argument to false will attach a function that prevents the default action from occurring and stops the event from bubbling. The default is true.
     */
    bind(eventType: string, preventBubble: boolean): JQuery;
    /**
     * Attach a handler to an event for the elements.
     * 
     * @param events An object containing one or more DOM event types and functions to execute for them.
     */
    bind(events: any): JQuery;

    /**
     * Trigger the "blur" event on an element
     */
    blur(): JQuery;
    /**
     * Bind an event handler to the "blur" JavaScript event
     *
     * @param handler A function to execute each time the event is triggered.
     */
    blur(handler: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "blur" JavaScript event
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute each time the event is triggered.
     */
    blur(eventData?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;

    /**
     * Trigger the "change" event on an element.
     */
    change(): JQuery;
    /**
     * Bind an event handler to the "change" JavaScript event
     *
     * @param handler A function to execute each time the event is triggered.
     */
    change(handler: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "change" JavaScript event
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute each time the event is triggered.
     */
    change(eventData?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;

    /**
     * Trigger the "click" event on an element.
     */
    click(): JQuery;
    /**
     * Bind an event handler to the "click" JavaScript event
     *
     * @param eventData An object containing data that will be passed to the event handler.
     */
    click(handler: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "click" JavaScript event
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute each time the event is triggered.
     */
    click(eventData?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;

    /**
     * Trigger the "dblclick" event on an element.
     */
    dblclick(): JQuery;
    /**
     * Bind an event handler to the "dblclick" JavaScript event
     *
     * @param handler A function to execute each time the event is triggered.
     */
    dblclick(handler: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "dblclick" JavaScript event
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute each time the event is triggered.
     */
    dblclick(eventData?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;

    delegate(selector: any, eventType: string, handler: (eventObject: JQueryEventObject) => any): JQuery;
    delegate(selector: any, eventType: string, eventData: any, handler: (eventObject: JQueryEventObject) => any): JQuery;

    /**
     * Trigger the "focus" event on an element.
     */
    focus(): JQuery;
    /**
     * Bind an event handler to the "focus" JavaScript event
     *
     * @param handler A function to execute each time the event is triggered.
     */
    focus(handler: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "focus" JavaScript event
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute each time the event is triggered.
     */
    focus(eventData?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;

    /**
     * Bind an event handler to the "focusin" JavaScript event
     *
     * @param handler A function to execute each time the event is triggered.
     */
    focusin(handler: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "focusin" JavaScript event
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute each time the event is triggered.
     */
    focusin(eventData: Object, handler: (eventObject: JQueryEventObject) => any): JQuery;

    /**
     * Bind an event handler to the "focusout" JavaScript event
     *
     * @param handler A function to execute each time the event is triggered.
     */
    focusout(handler: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "focusout" JavaScript event
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute each time the event is triggered.
     */
    focusout(eventData: Object, handler: (eventObject: JQueryEventObject) => any): JQuery;

    /**
     * Bind two handlers to the matched elements, to be executed when the mouse pointer enters and leaves the elements.
     *
     * @param handlerIn A function to execute when the mouse pointer enters the element.
     * @param handlerOut A function to execute when the mouse pointer leaves the element.
     */
    hover(handlerIn: (eventObject: JQueryEventObject) => any, handlerOut: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Bind a single handler to the matched elements, to be executed when the mouse pointer enters or leaves the elements.
     *
     * @param handlerInOut A function to execute when the mouse pointer enters or leaves the element.
     */
    hover(handlerInOut: (eventObject: JQueryEventObject) => any): JQuery;

    /**
     * Trigger the "keydown" event on an element.
     */
    keydown(): JQuery;
    /**
     * Bind an event handler to the "keydown" JavaScript event
     *
     * @param handler A function to execute each time the event is triggered.
     */
    keydown(handler: (eventObject: JQueryKeyEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "keydown" JavaScript event
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute each time the event is triggered.
     */
    keydown(eventData?: any, handler?: (eventObject: JQueryKeyEventObject) => any): JQuery;

    /**
     * Trigger the "keypress" event on an element.
     */
    keypress(): JQuery;
    /**
     * Bind an event handler to the "keypress" JavaScript event
     *
     * @param handler A function to execute each time the event is triggered.
     */
    keypress(handler: (eventObject: JQueryKeyEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "keypress" JavaScript event
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute each time the event is triggered.
     */
    keypress(eventData?: any, handler?: (eventObject: JQueryKeyEventObject) => any): JQuery;

    /**
     * Trigger the "keyup" event on an element.
     */
    keyup(): JQuery;
    /**
     * Bind an event handler to the "keyup" JavaScript event
     *
     * @param handler A function to execute each time the event is triggered.
     */
    keyup(handler: (eventObject: JQueryKeyEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "keyup" JavaScript event
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute each time the event is triggered.
     */
    keyup(eventData?: any, handler?: (eventObject: JQueryKeyEventObject) => any): JQuery;

    /**
     * Bind an event handler to the "load" JavaScript event.
     *
     * @param handler A function to execute when the event is triggered.
     */
    load(handler: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "load" JavaScript event.
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute when the event is triggered.
     */
    load(eventData?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;

    /**
     * Trigger the "mousedown" event on an element.
     */
    mousedown(): JQuery;
    /**
     * Bind an event handler to the "mousedown" JavaScript event.
     *
     * @param handler A function to execute when the event is triggered.
     */
    mousedown(handler: (eventObject: JQueryMouseEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "mousedown" JavaScript event.
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute when the event is triggered.
     */
    mousedown(eventData: Object, handler: (eventObject: JQueryMouseEventObject) => any): JQuery;

    /**
     * Trigger the "mouseenter" event on an element.
     */
    mouseenter(): JQuery;
    /**
     * Bind an event handler to be fired when the mouse enters an element.
     *
     * @param handler A function to execute when the event is triggered.
     */
    mouseenter(handler: (eventObject: JQueryMouseEventObject) => any): JQuery;
    /**
     * Bind an event handler to be fired when the mouse enters an element.
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute when the event is triggered.
     */
    mouseenter(eventData: Object, handler: (eventObject: JQueryMouseEventObject) => any): JQuery;

    /**
     * Trigger the "mouseleave" event on an element.
     */
    mouseleave(): JQuery;
    /**
     * Bind an event handler to be fired when the mouse leaves an element.
     *
     * @param handler A function to execute when the event is triggered.
     */
    mouseleave(handler: (eventObject: JQueryMouseEventObject) => any): JQuery;
    /**
     * Bind an event handler to be fired when the mouse leaves an element.
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute when the event is triggered.
     */
    mouseleave(eventData: Object, handler: (eventObject: JQueryMouseEventObject) => any): JQuery;

    /**
     * Trigger the "mousemove" event on an element.
     */
    mousemove(): JQuery;
    /**
     * Bind an event handler to the "mousemove" JavaScript event.
     *
     * @param handler A function to execute when the event is triggered.
     */
    mousemove(handler: (eventObject: JQueryMouseEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "mousemove" JavaScript event.
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute when the event is triggered.
     */
    mousemove(eventData: Object, handler: (eventObject: JQueryMouseEventObject) => any): JQuery;

    /**
     * Trigger the "mouseout" event on an element.
     */
    mouseout(): JQuery;
    /**
     * Bind an event handler to the "mouseout" JavaScript event.
     *
     * @param handler A function to execute when the event is triggered.
     */
    mouseout(handler: (eventObject: JQueryMouseEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "mouseout" JavaScript event.
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute when the event is triggered.
     */
    mouseout(eventData: Object, handler: (eventObject: JQueryMouseEventObject) => any): JQuery;

    /**
     * Trigger the "mouseover" event on an element.
     */
    mouseover(): JQuery;
    /**
     * Bind an event handler to the "mouseover" JavaScript event.
     *
     * @param handler A function to execute when the event is triggered.
     */
    mouseover(handler: (eventObject: JQueryMouseEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "mouseover" JavaScript event.
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute when the event is triggered.
     */
    mouseover(eventData: Object, handler: (eventObject: JQueryMouseEventObject) => any): JQuery;

    /**
     * Trigger the "mouseup" event on an element.
     */
    mouseup(): JQuery;
    /**
     * Bind an event handler to the "mouseup" JavaScript event.
     *
     * @param handler A function to execute when the event is triggered.
     */
    mouseup(handler: (eventObject: JQueryMouseEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "mouseup" JavaScript event.
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute when the event is triggered.
     */
    mouseup(eventData: Object, handler: (eventObject: JQueryMouseEventObject) => any): JQuery;

    /**
     * Remove an event handler.
     */
    off(): JQuery;
    /**
     * Remove an event handler.
     *
     * @param events One or more space-separated event types and optional namespaces, or just namespaces, such as "click", "keydown.myPlugin", or ".myPlugin".
     * @param selector A selector which should match the one originally passed to .on() when attaching event handlers.
     * @param handler A handler function previously attached for the event(s), or the special value false.
     */
    off(events: string, selector?: string, handler?: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Remove an event handler.
     *
     * @param events One or more space-separated event types and optional namespaces, or just namespaces, such as "click", "keydown.myPlugin", or ".myPlugin".
     * @param handler A handler function previously attached for the event(s), or the special value false.
     */
    off(events: string, handler: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Remove an event handler.
     *
     * @param events An object where the string keys represent one or more space-separated event types and optional namespaces, and the values represent handler functions previously attached for the event(s).
     * @param selector A selector which should match the one originally passed to .on() when attaching event handlers.
     */
    off(events: { [key: string]: any; }, selector?: string): JQuery;

    /**
     * Attach an event handler function for one or more events to the selected elements.
     *
     * @param events One or more space-separated event types and optional namespaces, such as "click" or "keydown.myPlugin".
     * @param handler A function to execute when the event is triggered. The value false is also allowed as a shorthand for a function that simply does return false. Rest parameter args is for optional parameters passed to jQuery.trigger(). Note that the actual parameters on the event handler function must be marked as optional (? syntax).
     */
    on(events: string, handler: (eventObject: JQueryEventObject, ...args: any[]) => any): JQuery;
    /**
     * Attach an event handler function for one or more events to the selected elements.
     *
     * @param events One or more space-separated event types and optional namespaces, such as "click" or "keydown.myPlugin".
     * @param data Data to be passed to the handler in event.data when an event is triggered.
     * @param handler A function to execute when the event is triggered. The value false is also allowed as a shorthand for a function that simply does return false.
    */
    on(events: string, data : any, handler: (eventObject: JQueryEventObject, ...args: any[]) => any): JQuery;
    /**
     * Attach an event handler function for one or more events to the selected elements.
     *
     * @param events One or more space-separated event types and optional namespaces, such as "click" or "keydown.myPlugin".
     * @param selector A selector string to filter the descendants of the selected elements that trigger the event. If the selector is null or omitted, the event is always triggered when it reaches the selected element.
     * @param handler A function to execute when the event is triggered. The value false is also allowed as a shorthand for a function that simply does return false.
     */
    on(events: string, selector: string, handler: (eventObject: JQueryEventObject, ...eventData: any[]) => any): JQuery;
    /**
     * Attach an event handler function for one or more events to the selected elements.
     *
     * @param events One or more space-separated event types and optional namespaces, such as "click" or "keydown.myPlugin".
     * @param selector A selector string to filter the descendants of the selected elements that trigger the event. If the selector is null or omitted, the event is always triggered when it reaches the selected element.
     * @param data Data to be passed to the handler in event.data when an event is triggered.
     * @param handler A function to execute when the event is triggered. The value false is also allowed as a shorthand for a function that simply does return false.
     */
    on(events: string, selector: string, data: any, handler: (eventObject: JQueryEventObject, ...eventData: any[]) => any): JQuery;
    /**
     * Attach an event handler function for one or more events to the selected elements.
     *
     * @param events An object in which the string keys represent one or more space-separated event types and optional namespaces, and the values represent a handler function to be called for the event(s).
     * @param selector A selector string to filter the descendants of the selected elements that will call the handler. If the selector is null or omitted, the handler is always called when it reaches the selected element.
     * @param data Data to be passed to the handler in event.data when an event occurs.
     */
    on(events: { [key: string]: any; }, selector?: string, data?: any): JQuery;
    /**
     * Attach an event handler function for one or more events to the selected elements.
     *
     * @param events An object in which the string keys represent one or more space-separated event types and optional namespaces, and the values represent a handler function to be called for the event(s).
     * @param data Data to be passed to the handler in event.data when an event occurs.
     */
    on(events: { [key: string]: any; }, data?: any): JQuery;

    /**
     * Attach a handler to an event for the elements. The handler is executed at most once per element per event type.
     *
     * @param events A string containing one or more JavaScript event types, such as "click" or "submit," or custom event names.
     * @param handler A function to execute at the time the event is triggered.
     */
    one(events: string, handler: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Attach a handler to an event for the elements. The handler is executed at most once per element per event type.
     *
     * @param events A string containing one or more JavaScript event types, such as "click" or "submit," or custom event names.
     * @param data An object containing data that will be passed to the event handler.
     * @param handler A function to execute at the time the event is triggered.
     */
    one(events: string, data: Object, handler: (eventObject: JQueryEventObject) => any): JQuery;

    /**
     * Attach a handler to an event for the elements. The handler is executed at most once per element per event type.
     *
     * @param events One or more space-separated event types and optional namespaces, such as "click" or "keydown.myPlugin".
     * @param selector A selector string to filter the descendants of the selected elements that trigger the event. If the selector is null or omitted, the event is always triggered when it reaches the selected element.
     * @param handler A function to execute when the event is triggered. The value false is also allowed as a shorthand for a function that simply does return false.
     */
    one(events: string, selector: string, handler: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Attach a handler to an event for the elements. The handler is executed at most once per element per event type.
     *
     * @param events One or more space-separated event types and optional namespaces, such as "click" or "keydown.myPlugin".
     * @param selector A selector string to filter the descendants of the selected elements that trigger the event. If the selector is null or omitted, the event is always triggered when it reaches the selected element.
     * @param data Data to be passed to the handler in event.data when an event is triggered.
     * @param handler A function to execute when the event is triggered. The value false is also allowed as a shorthand for a function that simply does return false.
     */
    one(events: string, selector: string, data: any, handler: (eventObject: JQueryEventObject) => any): JQuery;

    /**
     * Attach a handler to an event for the elements. The handler is executed at most once per element per event type.
     *
     * @param events An object in which the string keys represent one or more space-separated event types and optional namespaces, and the values represent a handler function to be called for the event(s).
     * @param selector A selector string to filter the descendants of the selected elements that will call the handler. If the selector is null or omitted, the handler is always called when it reaches the selected element.
     * @param data Data to be passed to the handler in event.data when an event occurs.
     */
    one(events: { [key: string]: any; }, selector?: string, data?: any): JQuery;

    /**
     * Attach a handler to an event for the elements. The handler is executed at most once per element per event type.
     *
     * @param events An object in which the string keys represent one or more space-separated event types and optional namespaces, and the values represent a handler function to be called for the event(s).
     * @param data Data to be passed to the handler in event.data when an event occurs.
     */
    one(events: { [key: string]: any; }, data?: any): JQuery;


    /**
     * Specify a function to execute when the DOM is fully loaded.
     *
     * @param handler A function to execute after the DOM is ready.
     */
    ready(handler: Function): JQuery;

    /**
     * Trigger the "resize" event on an element.
     */
    resize(): JQuery;
    /**
     * Bind an event handler to the "resize" JavaScript event.
     *
     * @param handler A function to execute each time the event is triggered.
     */
    resize(handler: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "resize" JavaScript event.
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute each time the event is triggered.
     */
    resize(eventData: Object, handler: (eventObject: JQueryEventObject) => any): JQuery;

    /**
     * Trigger the "scroll" event on an element.
     */
    scroll(): JQuery;
    /**
     * Bind an event handler to the "scroll" JavaScript event.
     *
     * @param handler A function to execute each time the event is triggered.
     */
    scroll(handler: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "scroll" JavaScript event.
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute each time the event is triggered.
     */
    scroll(eventData: Object, handler: (eventObject: JQueryEventObject) => any): JQuery;

    /**
     * Trigger the "select" event on an element.
     */
    select(): JQuery;
    /**
     * Bind an event handler to the "select" JavaScript event.
     *
     * @param handler A function to execute each time the event is triggered.
     */
    select(handler: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "select" JavaScript event.
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute each time the event is triggered.
     */
    select(eventData: Object, handler: (eventObject: JQueryEventObject) => any): JQuery;

    /**
     * Trigger the "submit" event on an element.
     */
    submit(): JQuery;
    /**
     * Bind an event handler to the "submit" JavaScript event
     *
     * @param handler A function to execute each time the event is triggered.
     */
    submit(handler: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "submit" JavaScript event
     *
     * @param eventData An object containing data that will be passed to the event handler.
     * @param handler A function to execute each time the event is triggered.
     */
    submit(eventData?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;

    /**
     * Execute all handlers and behaviors attached to the matched elements for the given event type.
     * 
     * @param eventType A string containing a JavaScript event type, such as click or submit.
     * @param extraParameters Additional parameters to pass along to the event handler.
     */
    trigger(eventType: string, extraParameters?: any[]|Object): JQuery;
    /**
     * Execute all handlers and behaviors attached to the matched elements for the given event type.
     * 
     * @param event A jQuery.Event object.
     * @param extraParameters Additional parameters to pass along to the event handler.
     */
    trigger(event: JQueryEventObject, extraParameters?: any[]|Object): JQuery;

    /**
     * Execute all handlers attached to an element for an event.
     * 
     * @param eventType A string containing a JavaScript event type, such as click or submit.
     * @param extraParameters An array of additional parameters to pass along to the event handler.
     */
    triggerHandler(eventType: string, ...extraParameters: any[]): Object;

    /**
     * Remove a previously-attached event handler from the elements.
     * 
     * @param eventType A string containing a JavaScript event type, such as click or submit.
     * @param handler The function that is to be no longer executed.
     */
    unbind(eventType?: string, handler?: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Remove a previously-attached event handler from the elements.
     * 
     * @param eventType A string containing a JavaScript event type, such as click or submit.
     * @param fls Unbinds the corresponding 'return false' function that was bound using .bind( eventType, false ).
     */
    unbind(eventType: string, fls: boolean): JQuery;
    /**
     * Remove a previously-attached event handler from the elements.
     * 
     * @param evt A JavaScript event object as passed to an event handler.
     */
    unbind(evt: any): JQuery;

    /**
     * Remove a handler from the event for all elements which match the current selector, based upon a specific set of root elements.
     */
    undelegate(): JQuery;
    /**
     * Remove a handler from the event for all elements which match the current selector, based upon a specific set of root elements.
     * 
     * @param selector A selector which will be used to filter the event results.
     * @param eventType A string containing a JavaScript event type, such as "click" or "keydown"
     * @param handler A function to execute at the time the event is triggered.
     */
    undelegate(selector: string, eventType: string, handler?: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Remove a handler from the event for all elements which match the current selector, based upon a specific set of root elements.
     * 
     * @param selector A selector which will be used to filter the event results.
     * @param events An object of one or more event types and previously bound functions to unbind from them.
     */
    undelegate(selector: string, events: Object): JQuery;
    /**
     * Remove a handler from the event for all elements which match the current selector, based upon a specific set of root elements.
     * 
     * @param namespace A string containing a namespace to unbind all events from.
     */
    undelegate(namespace: string): JQuery;

    /**
     * Bind an event handler to the "unload" JavaScript event. (DEPRECATED from v1.8)
     * 
     * @param handler A function to execute when the event is triggered.
     */
    unload(handler: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "unload" JavaScript event. (DEPRECATED from v1.8)
     * 
     * @param eventData A plain object of data that will be passed to the event handler.
     * @param handler A function to execute when the event is triggered.
     */
    unload(eventData?: any, handler?: (eventObject: JQueryEventObject) => any): JQuery;

    /**
     * The DOM node context originally passed to jQuery(); if none was passed then context will likely be the document. (DEPRECATED from v1.10)
     */
    context: Element;

    jquery: string;

    /**
     * Bind an event handler to the "error" JavaScript event. (DEPRECATED from v1.8)
     * 
     * @param handler A function to execute when the event is triggered.
     */
    error(handler: (eventObject: JQueryEventObject) => any): JQuery;
    /**
     * Bind an event handler to the "error" JavaScript event. (DEPRECATED from v1.8)
     * 
     * @param eventData A plain object of data that will be passed to the event handler.
     * @param handler A function to execute when the event is triggered.
     */
    error(eventData: any, handler: (eventObject: JQueryEventObject) => any): JQuery;

    /**
     * Add a collection of DOM elements onto the jQuery stack.
     * 
     * @param elements An array of elements to push onto the stack and make into a new jQuery object.
     */
    pushStack(elements: any[]): JQuery;
    /**
     * Add a collection of DOM elements onto the jQuery stack.
     * 
     * @param elements An array of elements to push onto the stack and make into a new jQuery object.
     * @param name The name of a jQuery method that generated the array of elements.
     * @param arguments The arguments that were passed in to the jQuery method (for serialization).
     */
    pushStack(elements: any[], name: string, arguments: any[]): JQuery;

    /**
     * Insert content, specified by the parameter, after each element in the set of matched elements.
     * 
     * param content1 HTML string, DOM element, array of elements, or jQuery object to insert after each element in the set of matched elements.
     * param content2 One or more additional DOM elements, arrays of elements, HTML strings, or jQuery objects to insert after each element in the set of matched elements.
     */
    after(content1: JQuery|any[]|Element|Text|string, ...content2: any[]): JQuery;
    /**
     * Insert content, specified by the parameter, after each element in the set of matched elements.
     * 
     * param func A function that returns an HTML string, DOM element(s), or jQuery object to insert after each element in the set of matched elements. Receives the index position of the element in the set as an argument. Within the function, this refers to the current element in the set.
     */
    after(func: (index: number, html: string) => string|Element|JQuery): JQuery;

    /**
     * Insert content, specified by the parameter, to the end of each element in the set of matched elements.
     * 
     * param content1 DOM element, array of elements, HTML string, or jQuery object to insert at the end of each element in the set of matched elements.
     * param content2 One or more additional DOM elements, arrays of elements, HTML strings, or jQuery objects to insert at the end of each element in the set of matched elements.
     */
    append(content1: JQuery|any[]|Element|Text|string, ...content2: any[]): JQuery;
    /**
     * Insert content, specified by the parameter, to the end of each element in the set of matched elements.
     * 
     * param func A function that returns an HTML string, DOM element(s), or jQuery object to insert at the end of each element in the set of matched elements. Receives the index position of the element in the set and the old HTML value of the element as arguments. Within the function, this refers to the current element in the set.
     */
    append(func: (index: number, html: string) => string|Element|JQuery): JQuery;

    /**
     * Insert every element in the set of matched elements to the end of the target.
     * 
     * @param target A selector, element, HTML string, array of elements, or jQuery object; the matched set of elements will be inserted at the end of the element(s) specified by this parameter.
     */
    appendTo(target: JQuery|any[]|Element|string): JQuery;

    /**
     * Insert content, specified by the parameter, before each element in the set of matched elements.
     * 
     * param content1 HTML string, DOM element, array of elements, or jQuery object to insert before each element in the set of matched elements.
     * param content2 One or more additional DOM elements, arrays of elements, HTML strings, or jQuery objects to insert before each element in the set of matched elements.
     */
    before(content1: JQuery|any[]|Element|Text|string, ...content2: any[]): JQuery;
    /**
     * Insert content, specified by the parameter, before each element in the set of matched elements.
     * 
     * param func A function that returns an HTML string, DOM element(s), or jQuery object to insert before each element in the set of matched elements. Receives the index position of the element in the set as an argument. Within the function, this refers to the current element in the set.
     */
    before(func: (index: number, html: string) => string|Element|JQuery): JQuery;

    /**
     * Create a deep copy of the set of matched elements.
     * 
     * param withDataAndEvents A Boolean indicating whether event handlers and data should be copied along with the elements. The default value is false.
     * param deepWithDataAndEvents A Boolean indicating whether event handlers and data for all children of the cloned element should be copied. By default its value matches the first argument's value (which defaults to false).
     */
    clone(withDataAndEvents?: boolean, deepWithDataAndEvents?: boolean): JQuery;

    /**
     * Remove the set of matched elements from the DOM.
     * 
     * param selector A selector expression that filters the set of matched elements to be removed.
     */
    detach(selector?: string): JQuery;

    /**
     * Remove all child nodes of the set of matched elements from the DOM.
     */
    empty(): JQuery;

    /**
     * Insert every element in the set of matched elements after the target.
     * 
     * param target A selector, element, array of elements, HTML string, or jQuery object; the matched set of elements will be inserted after the element(s) specified by this parameter.
     */
    insertAfter(target: JQuery|any[]|Element|Text|string): JQuery;

    /**
     * Insert every element in the set of matched elements before the target.
     * 
     * param target A selector, element, array of elements, HTML string, or jQuery object; the matched set of elements will be inserted before the element(s) specified by this parameter.
     */
    insertBefore(target: JQuery|any[]|Element|Text|string): JQuery;

    /**
     * Insert content, specified by the parameter, to the beginning of each element in the set of matched elements.
     * 
     * param content1 DOM element, array of elements, HTML string, or jQuery object to insert at the beginning of each element in the set of matched elements.
     * param content2 One or more additional DOM elements, arrays of elements, HTML strings, or jQuery objects to insert at the beginning of each element in the set of matched elements.
     */
    prepend(content1: JQuery|any[]|Element|Text|string, ...content2: any[]): JQuery;
    /**
     * Insert content, specified by the parameter, to the beginning of each element in the set of matched elements.
     * 
     * param func A function that returns an HTML string, DOM element(s), or jQuery object to insert at the beginning of each element in the set of matched elements. Receives the index position of the element in the set and the old HTML value of the element as arguments. Within the function, this refers to the current element in the set.
     */
    prepend(func: (index: number, html: string) => string|Element|JQuery): JQuery;

    /**
     * Insert every element in the set of matched elements to the beginning of the target.
     * 
     * @param target A selector, element, HTML string, array of elements, or jQuery object; the matched set of elements will be inserted at the beginning of the element(s) specified by this parameter.
     */
    prependTo(target: JQuery|any[]|Element|string): JQuery;

    /**
     * Remove the set of matched elements from the DOM.
     * 
     * @param selector A selector expression that filters the set of matched elements to be removed.
     */
    remove(selector?: string): JQuery;

    /**
     * Replace each target element with the set of matched elements.
     * 
     * @param target A selector string, jQuery object, DOM element, or array of elements indicating which element(s) to replace.
     */
    replaceAll(target: JQuery|any[]|Element|string): JQuery;

    /**
     * Replace each element in the set of matched elements with the provided new content and return the set of elements that was removed.
     * 
     * param newContent The content to insert. May be an HTML string, DOM element, array of DOM elements, or jQuery object.
     */
    replaceWith(newContent: JQuery|any[]|Element|Text|string): JQuery;
    /**
     * Replace each element in the set of matched elements with the provided new content and return the set of elements that was removed.
     * 
     * param func A function that returns content with which to replace the set of matched elements.
     */
    replaceWith(func: () => Element|JQuery): JQuery;

    /**
     * Get the combined text contents of each element in the set of matched elements, including their descendants.
     */
    text(): string;
    /**
     * Set the content of each element in the set of matched elements to the specified text.
     * 
     * @param text The text to set as the content of each matched element. When Number or Boolean is supplied, it will be converted to a String representation.
     */
    text(text: string|number|boolean): JQuery;
    /**
     * Set the content of each element in the set of matched elements to the specified text.
     * 
     * @param func A function returning the text content to set. Receives the index position of the element in the set and the old text value as arguments.
     */
    text(func: (index: number, text: string) => string): JQuery;

    /**
     * Retrieve all the elements contained in the jQuery set, as an array.
     */
    toArray(): any[];

    /**
     * Remove the parents of the set of matched elements from the DOM, leaving the matched elements in their place.
     */
    unwrap(): JQuery;

    /**
     * Wrap an HTML structure around each element in the set of matched elements.
     * 
     * @param wrappingElement A selector, element, HTML string, or jQuery object specifying the structure to wrap around the matched elements.
     */
    wrap(wrappingElement: JQuery|Element|string): JQuery;
    /**
     * Wrap an HTML structure around each element in the set of matched elements.
     * 
     * @param func A callback function returning the HTML content or jQuery object to wrap around the matched elements. Receives the index position of the element in the set as an argument. Within the function, this refers to the current element in the set.
     */
    wrap(func: (index: number) => string|JQuery): JQuery;

    /**
     * Wrap an HTML structure around all elements in the set of matched elements.
     * 
     * @param wrappingElement A selector, element, HTML string, or jQuery object specifying the structure to wrap around the matched elements.
     */
    wrapAll(wrappingElement: JQuery|Element|string): JQuery;
    wrapAll(func: (index: number) => string): JQuery;

    /**
     * Wrap an HTML structure around the content of each element in the set of matched elements.
     * 
     * @param wrappingElement An HTML snippet, selector expression, jQuery object, or DOM element specifying the structure to wrap around the content of the matched elements.
     */
    wrapInner(wrappingElement: JQuery|Element|string): JQuery;
    /**
     * Wrap an HTML structure around the content of each element in the set of matched elements.
     * 
     * @param func A callback function which generates a structure to wrap around the content of the matched elements. Receives the index position of the element in the set as an argument. Within the function, this refers to the current element in the set.
     */
    wrapInner(func: (index: number) => string): JQuery;

    /**
     * Iterate over a jQuery object, executing a function for each matched element.
     * 
     * @param func A function to execute for each matched element.
     */
    each(func: (index: number, elem: Element) => any): JQuery;

    /**
     * Retrieve one of the elements matched by the jQuery object.
     * 
     * @param index A zero-based integer indicating which element to retrieve.
     */
    get(index: number): HTMLElement;
    /**
     * Retrieve the elements matched by the jQuery object.
     */
    get(): any[];

    /**
     * Search for a given element from among the matched elements.
     */
    index(): number;
    /**
     * Search for a given element from among the matched elements.
     * 
     * @param selector A selector representing a jQuery collection in which to look for an element.
     */
    index(selector: string|JQuery|Element): number;

    /**
     * The number of elements in the jQuery object.
     */
    length: number;
    /**
     * A selector representing selector passed to jQuery(), if any, when creating the original set.
     * version deprecated: 1.7, removed: 1.9
     */
    selector: string;
    [index: string]: any;
    [index: number]: HTMLElement;

    /**
     * Add elements to the set of matched elements.
     * 
     * @param selector A string representing a selector expression to find additional elements to add to the set of matched elements.
     * @param context The point in the document at which the selector should begin matching; similar to the context argument of the $(selector, context) method.
     */
    add(selector: string, context?: Element): JQuery;
    /**
     * Add elements to the set of matched elements.
     * 
     * @param elements One or more elements to add to the set of matched elements.
     */
    add(...elements: Element[]): JQuery;
    /**
     * Add elements to the set of matched elements.
     * 
     * @param html An HTML fragment to add to the set of matched elements.
     */
    add(html: string): JQuery;
    /**
     * Add elements to the set of matched elements.
     * 
     * @param obj An existing jQuery object to add to the set of matched elements.
     */
    add(obj: JQuery): JQuery;

    /**
     * Get the children of each element in the set of matched elements, optionally filtered by a selector.
     * 
     * @param selector A string containing a selector expression to match elements against.
     */
    children(selector?: string): JQuery;

    /**
     * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
     * 
     * @param selector A string containing a selector expression to match elements against.
     */
    closest(selector: string): JQuery;
    /**
     * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
     * 
     * @param selector A string containing a selector expression to match elements against.
     * @param context A DOM element within which a matching element may be found. If no context is passed in then the context of the jQuery set will be used instead.
     */
    closest(selector: string, context?: Element): JQuery;
    /**
     * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
     * 
     * @param obj A jQuery object to match elements against.
     */
    closest(obj: JQuery): JQuery;
    /**
     * For each element in the set, get the first element that matches the selector by testing the element itself and traversing up through its ancestors in the DOM tree.
     * 
     * @param element An element to match elements against.
     */
    closest(element: Element): JQuery;

    /**
     * Get an array of all the elements and selectors matched against the current element up through the DOM tree.
     * 
     * @param selectors An array or string containing a selector expression to match elements against (can also be a jQuery object).
     * @param context A DOM element within which a matching element may be found. If no context is passed in then the context of the jQuery set will be used instead.
     */
    closest(selectors: any, context?: Element): any[];

    /**
     * Get the children of each element in the set of matched elements, including text and comment nodes.
     */
    contents(): JQuery;

    /**
     * End the most recent filtering operation in the current chain and return the set of matched elements to its previous state.
     */
    end(): JQuery;

    /**
     * Reduce the set of matched elements to the one at the specified index.
     * 
     * @param index An integer indicating the 0-based position of the element. OR An integer indicating the position of the element, counting backwards from the last element in the set.
     *  
     */
    eq(index: number): JQuery;

    /**
     * Reduce the set of matched elements to those that match the selector or pass the function's test.
     * 
     * @param selector A string containing a selector expression to match the current set of elements against.
     */
    filter(selector: string): JQuery;
    /**
     * Reduce the set of matched elements to those that match the selector or pass the function's test.
     * 
     * @param func A function used as a test for each element in the set. this is the current DOM element.
     */
    filter(func: (index: number, element: Element) => any): JQuery;
    /**
     * Reduce the set of matched elements to those that match the selector or pass the function's test.
     * 
     * @param element An element to match the current set of elements against.
     */
    filter(element: Element): JQuery;
    /**
     * Reduce the set of matched elements to those that match the selector or pass the function's test.
     * 
     * @param obj An existing jQuery object to match the current set of elements against.
     */
    filter(obj: JQuery): JQuery;

    /**
     * Get the descendants of each element in the current set of matched elements, filtered by a selector, jQuery object, or element.
     * 
     * @param selector A string containing a selector expression to match elements against.
     */
    find(selector: string): JQuery;
    /**
     * Get the descendants of each element in the current set of matched elements, filtered by a selector, jQuery object, or element.
     * 
     * @param element An element to match elements against.
     */
    find(element: Element): JQuery;
    /**
     * Get the descendants of each element in the current set of matched elements, filtered by a selector, jQuery object, or element.
     * 
     * @param obj A jQuery object to match elements against.
     */
    find(obj: JQuery): JQuery;

    /**
     * Reduce the set of matched elements to the first in the set.
     */
    first(): JQuery;

    /**
     * Reduce the set of matched elements to those that have a descendant that matches the selector or DOM element.
     * 
     * @param selector A string containing a selector expression to match elements against.
     */
    has(selector: string): JQuery;
    /**
     * Reduce the set of matched elements to those that have a descendant that matches the selector or DOM element.
     * 
     * @param contained A DOM element to match elements against.
     */
    has(contained: Element): JQuery;

    /**
     * Check the current matched set of elements against a selector, element, or jQuery object and return true if at least one of these elements matches the given arguments.
     * 
     * @param selector A string containing a selector expression to match elements against.
     */
    is(selector: string): boolean;
    /**
     * Check the current matched set of elements against a selector, element, or jQuery object and return true if at least one of these elements matches the given arguments.
     * 
     * @param func A function used as a test for the set of elements. It accepts one argument, index, which is the element's index in the jQuery collection.Within the function, this refers to the current DOM element.
     */
    is(func: (index: number, element: Element) => boolean): boolean;
    /**
     * Check the current matched set of elements against a selector, element, or jQuery object and return true if at least one of these elements matches the given arguments.
     * 
     * @param obj An existing jQuery object to match the current set of elements against.
     */
    is(obj: JQuery): boolean;
    /**
     * Check the current matched set of elements against a selector, element, or jQuery object and return true if at least one of these elements matches the given arguments.
     * 
     * @param elements One or more elements to match the current set of elements against.
     */
    is(elements: any): boolean;

    /**
     * Reduce the set of matched elements to the final one in the set.
     */
    last(): JQuery;

    /**
     * Pass each element in the current matched set through a function, producing a new jQuery object containing the return values.
     * 
     * @param callback A function object that will be invoked for each element in the current set.
     */
    map(callback: (index: number, domElement: Element) => any): JQuery;

    /**
     * Get the immediately following sibling of each element in the set of matched elements. If a selector is provided, it retrieves the next sibling only if it matches that selector.
     * 
     * @param selector A string containing a selector expression to match elements against.
     */
    next(selector?: string): JQuery;

    /**
     * Get all following siblings of each element in the set of matched elements, optionally filtered by a selector.
     * 
     * @param selector A string containing a selector expression to match elements against.
     */
    nextAll(selector?: string): JQuery;

    /**
     * Get all following siblings of each element up to but not including the element matched by the selector, DOM node, or jQuery object passed.
     * 
     * @param selector A string containing a selector expression to indicate where to stop matching following sibling elements.
     * @param filter A string containing a selector expression to match elements against.
     */
    nextUntil(selector?: string, filter?: string): JQuery;
    /**
     * Get all following siblings of each element up to but not including the element matched by the selector, DOM node, or jQuery object passed.
     * 
     * @param element A DOM node or jQuery object indicating where to stop matching following sibling elements.
     * @param filter A string containing a selector expression to match elements against.
     */
    nextUntil(element?: Element, filter?: string): JQuery;
    /**
     * Get all following siblings of each element up to but not including the element matched by the selector, DOM node, or jQuery object passed.
     * 
     * @param obj A DOM node or jQuery object indicating where to stop matching following sibling elements.
     * @param filter A string containing a selector expression to match elements against.
     */
    nextUntil(obj?: JQuery, filter?: string): JQuery;

    /**
     * Remove elements from the set of matched elements.
     * 
     * @param selector A string containing a selector expression to match elements against.
     */
    not(selector: string): JQuery;
    /**
     * Remove elements from the set of matched elements.
     * 
     * @param func A function used as a test for each element in the set. this is the current DOM element.
     */
    not(func: (index: number, element: Element) => boolean): JQuery;
    /**
     * Remove elements from the set of matched elements.
     * 
     * @param elements One or more DOM elements to remove from the matched set.
     */
    not(...elements: Element[]): JQuery;
    /**
     * Remove elements from the set of matched elements.
     * 
     * @param obj An existing jQuery object to match the current set of elements against.
     */
    not(obj: JQuery): JQuery;

    /**
     * Get the closest ancestor element that is positioned.
     */
    offsetParent(): JQuery;

    /**
     * Get the parent of each element in the current set of matched elements, optionally filtered by a selector.
     * 
     * @param selector A string containing a selector expression to match elements against.
     */
    parent(selector?: string): JQuery;

    /**
     * Get the ancestors of each element in the current set of matched elements, optionally filtered by a selector.
     * 
     * @param selector A string containing a selector expression to match elements against.
     */
    parents(selector?: string): JQuery;

    /**
     * Get the ancestors of each element in the current set of matched elements, up to but not including the element matched by the selector, DOM node, or jQuery object.
     * 
     * @param selector A string containing a selector expression to indicate where to stop matching ancestor elements.
     * @param filter A string containing a selector expression to match elements against.
     */
    parentsUntil(selector?: string, filter?: string): JQuery;
    /**
     * Get the ancestors of each element in the current set of matched elements, up to but not including the element matched by the selector, DOM node, or jQuery object.
     * 
     * @param element A DOM node or jQuery object indicating where to stop matching ancestor elements.
     * @param filter A string containing a selector expression to match elements against.
     */
    parentsUntil(element?: Element, filter?: string): JQuery;
    /**
     * Get the ancestors of each element in the current set of matched elements, up to but not including the element matched by the selector, DOM node, or jQuery object.
     * 
     * @param obj A DOM node or jQuery object indicating where to stop matching ancestor elements.
     * @param filter A string containing a selector expression to match elements against.
     */
    parentsUntil(obj?: JQuery, filter?: string): JQuery;

    /**
     * Get the immediately preceding sibling of each element in the set of matched elements, optionally filtered by a selector.
     * 
     * @param selector A string containing a selector expression to match elements against.
     */
    prev(selector?: string): JQuery;

    /**
     * Get all preceding siblings of each element in the set of matched elements, optionally filtered by a selector.
     * 
     * @param selector A string containing a selector expression to match elements against.
     */
    prevAll(selector?: string): JQuery;

    /**
     * Get all preceding siblings of each element up to but not including the element matched by the selector, DOM node, or jQuery object.
     * 
     * @param selector A string containing a selector expression to indicate where to stop matching preceding sibling elements.
     * @param filter A string containing a selector expression to match elements against.
     */
    prevUntil(selector?: string, filter?: string): JQuery;
    /**
     * Get all preceding siblings of each element up to but not including the element matched by the selector, DOM node, or jQuery object.
     * 
     * @param element A DOM node or jQuery object indicating where to stop matching preceding sibling elements.
     * @param filter A string containing a selector expression to match elements against.
     */
    prevUntil(element?: Element, filter?: string): JQuery;
    /**
     * Get all preceding siblings of each element up to but not including the element matched by the selector, DOM node, or jQuery object.
     * 
     * @param obj A DOM node or jQuery object indicating where to stop matching preceding sibling elements.
     * @param filter A string containing a selector expression to match elements against.
     */
    prevUntil(obj?: JQuery, filter?: string): JQuery;

    /**
     * Get the siblings of each element in the set of matched elements, optionally filtered by a selector.
     * 
     * @param selector A string containing a selector expression to match elements against.
     */
    siblings(selector?: string): JQuery;

    /**
     * Reduce the set of matched elements to a subset specified by a range of indices.
     * 
     * @param start An integer indicating the 0-based position at which the elements begin to be selected. If negative, it indicates an offset from the end of the set.
     * @param end An integer indicating the 0-based position at which the elements stop being selected. If negative, it indicates an offset from the end of the set. If omitted, the range continues until the end of the set.
     */
    slice(start: number, end?: number): JQuery;

    /**
     * Show the queue of functions to be executed on the matched elements.
     * 
     * @param queueName A string containing the name of the queue. Defaults to fx, the standard effects queue.
     */
    queue(queueName?: string): any[];
    /**
     * Manipulate the queue of functions to be executed, once for each matched element.
     * 
     * @param newQueue An array of functions to replace the current queue contents.
     */
    queue(newQueue: Function[]): JQuery;
    /**
     * Manipulate the queue of functions to be executed, once for each matched element.
     * 
     * @param callback The new function to add to the queue, with a function to call that will dequeue the next item.
     */
    queue(callback: Function): JQuery;
    /**
     * Manipulate the queue of functions to be executed, once for each matched element.
     * 
     * @param queueName A string containing the name of the queue. Defaults to fx, the standard effects queue.
     * @param newQueue An array of functions to replace the current queue contents.
     */
    queue(queueName: string, newQueue: Function[]): JQuery;
    /**
     * Manipulate the queue of functions to be executed, once for each matched element.
     * 
     * @param queueName A string containing the name of the queue. Defaults to fx, the standard effects queue.
     * @param callback The new function to add to the queue, with a function to call that will dequeue the next item.
     */
    queue(queueName: string, callback: Function): JQuery;
}
declare module "jquery" {
    export = $;
}
declare var jQuery: JQueryStatic;
declare var $: JQueryStatic;
// Type definitions for SpacePen
// Project: https://github.com/atom/space-pen
// Definitions by: vvakame <https://github.com/vvakame>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/// <reference path="../jquery/jquery.d.ts" />

// http://atom.github.io/space-pen/

interface JQuery {
	view():any;
	views():any[];
}

interface JQuery {
	scrollBottom():number;
	scrollBottom(newValue:number):JQuery;
	scrollDown():JQuery;
	scrollUp():JQuery;
	scrollToTop():JQuery;
	scrollToBottom():JQuery;
	scrollRight():number;
	scrollRight(newValue:number):JQuery;
	pageUp():JQuery;
	pageDown():JQuery;
	isOnDom():boolean;
	isVisible():boolean;
	isHidden():boolean;
	isDisabled():boolean;
	enable():JQuery;
	disable():JQuery;
	insertAt(index:number, element:any):JQuery;
	removeAt(index:number):JQuery;
	indexOf(child:any):any;
	containsElement(element:any):boolean;
	preempt(eventName:any, handler:Function):any;
	handlers(eventName:any):any;
	hasParent():boolean;
	hasFocus():boolean;
	flashError():number;
	trueHeight():any;
	trueWidth():any;
	document(eventName:any, docString:string):any;
	events():any;
	command(eventName:any, handler:any):any;
	command(eventName:any, selector:any, handler:any):any;
	command(eventName:any, selector:any, options:any, handler:any):any;
	iconSize(size:number):void;
	intValue():number;
}

declare class View /* implements JQuery */ {

	static builderStack:Builder[];

	static subview(name:any, view:any):void;

	static text(str:string):void;

	static tag(tagName:any, ...args:any[]):void;

	static raw(str:string):void;

	static pushBuilder():void;

	static popBuilder():Builder;

	static buildHtml(fn:()=>void):string[];

	static render(fn:()=>void):JQuery;

	// please override this method!
	static content(...args:any[]):void;

	// tag start
	static a(...args:any[]):void;

	static abbr(...args:any[]):void;

	static address(...args:any[]):void;

	static article(...args:any[]):void;

	static aside(...args:any[]):void;

	static audio(...args:any[]):void;

	static b(...args:any[]):void;

	static bdi(...args:any[]):void;

	static bdo(...args:any[]):void;

	static blockquote(...args:any[]):void;

	static body(...args:any[]):void;

	static button(...args:any[]):void;

	static canvas(...args:any[]):void;

	static caption(...args:any[]):void;

	static cite(...args:any[]):void;

	static code(...args:any[]):void;

	static colgroup(...args:any[]):void;

	static datalist(...args:any[]):void;

	static dd(...args:any[]):void;

	static del(...args:any[]):void;

	static details(...args:any[]):void;

	static dfn(...args:any[]):void;

	static div(...args:any[]):void;

	static dl(...args:any[]):void;

	static dt(...args:any[]):void;

	static em(...args:any[]):void;

	static fieldset(...args:any[]):void;

	static figcaption(...args:any[]):void;

	static figure(...args:any[]):void;

	static footer(...args:any[]):void;

	static form(...args:any[]):void;

	static h1(...args:any[]):void;

	static h2(...args:any[]):void;

	static h3(...args:any[]):void;

	static h4(...args:any[]):void;

	static h5(...args:any[]):void;

	static h6(...args:any[]):void;

	static head(...args:any[]):void;

	static header(...args:any[]):void;

	static hgroup(...args:any[]):void;

	static html(...args:any[]):void;

	static i(...args:any[]):void;

	static iframe(...args:any[]):void;

	static ins(...args:any[]):void;

	static kbd(...args:any[]):void;

	static label(...args:any[]):void;

	static legend(...args:any[]):void;

	static li(...args:any[]):void;

	static map(...args:any[]):void;

	static mark(...args:any[]):void;

	static menu(...args:any[]):void;

	static meter(...args:any[]):void;

	static nav(...args:any[]):void;

	static noscript(...args:any[]):void;

	static object(...args:any[]):void;

	static ol(...args:any[]):void;

	static optgroup(...args:any[]):void;

	static option(...args:any[]):void;

	static output(...args:any[]):void;

	static p(...args:any[]):void;

	static pre(...args:any[]):void;

	static progress(...args:any[]):void;

	static q(...args:any[]):void;

	static rp(...args:any[]):void;

	static rt(...args:any[]):void;

	static ruby(...args:any[]):void;

	static s(...args:any[]):void;

	static samp(...args:any[]):void;

	static script(...args:any[]):void;

	static section(...args:any[]):void;

	static select(...args:any[]):void;

	static small(...args:any[]):void;

	static span(...args:any[]):void;

	static strong(...args:any[]):void;

	static style(...args:any[]):void;

	static sub(...args:any[]):void;

	static summary(...args:any[]):void;

	static sup(...args:any[]):void;

	static table(...args:any[]):void;

	static tbody(...args:any[]):void;

	static td(...args:any[]):void;

	static textarea(...args:any[]):void;

	static tfoot(...args:any[]):void;

	static th(...args:any[]):void;

	static thead(...args:any[]):void;

	static time(...args:any[]):void;

	static title(...args:any[]):void;

	static tr(...args:any[]):void;

	static u(...args:any[]):void;

	static ul(...args:any[]):void;

	static video(...args:any[]):void;

	static area(...args:any[]):void;

	static base(...args:any[]):void;

	static br(...args:any[]):void;

	static col(...args:any[]):void;

	static command(...args:any[]):void;

	static embed(...args:any[]):void;

	static hr(...args:any[]):void;

	static img(...args:any[]):void;

	static input(...args:any[]):void;

	static keygen(...args:any[]):void;

	static link(...args:any[]):void;

	static meta(...args:any[]):void;

	static param(...args:any[]):void;

	static source(...args:any[]):void;

	static track(...args:any[]):void;

	static wbrk(...args:any[]):void;

	// tag end

	initialize(view:View, args:any):void;

	constructor(...args:any[]);

	buildHtml(params:any):any;

	wireOutlets(view:View):void;

	bindEventHandlers(view:View):void;

	pushStack(elems:any):any;

	end():any;

	command(commandName:any, selector:any, options:any, handler:any):any;

	preempt(eventName:any, handler:any):any;
}

declare class Builder {
	document:any[];
	postProcessingSteps:any[];

	buildHtml():any[];

	tag(name:string, ...args:any[]):void;

	openTag(name:string, attributes:any):void;

	closeTag(name:string):void;

	text(str:string):void;

	raw(str:string):void;

	subview(outletName:any, subview:View):void;

	extractOptions(args:any):any;
}

declare module "space-pen" {

	// copy & paste start
	class View /* implements JQueryStatic */ {

		static builderStack:Builder[];

		static subview(name:any, view:any):void;

		static text(str:string):void;

		static tag(tagName:any, ...args:any[]):void;

		static raw(str:string):void;

		static pushBuilder():void;

		static popBuilder():Builder;

		static buildHtml(fn:()=>void):string[];

		static render(fn:()=>void):JQuery;

		// please override this method!
		static content(...args:any[]):void;

		// tag start
		static a(...args:any[]):any;

		static abbr(...args:any[]):any;

		static address(...args:any[]):any;

		static article(...args:any[]):any;

		static aside(...args:any[]):any;

		static audio(...args:any[]):any;

		static b(...args:any[]):any;

		static bdi(...args:any[]):any;

		static bdo(...args:any[]):any;

		static blockquote(...args:any[]):any;

		static body(...args:any[]):any;

		static button(...args:any[]):any;

		static canvas(...args:any[]):any;

		static caption(...args:any[]):any;

		static cite(...args:any[]):any;

		static code(...args:any[]):any;

		static colgroup(...args:any[]):any;

		static datalist(...args:any[]):any;

		static dd(...args:any[]):any;

		static del(...args:any[]):any;

		static details(...args:any[]):any;

		static dfn(...args:any[]):any;

		static div(...args:any[]):any;

		static dl(...args:any[]):any;

		static dt(...args:any[]):any;

		static em(...args:any[]):any;

		static fieldset(...args:any[]):any;

		static figcaption(...args:any[]):any;

		static figure(...args:any[]):any;

		static footer(...args:any[]):any;

		static form(...args:any[]):any;

		static h1(...args:any[]):any;

		static h2(...args:any[]):any;

		static h3(...args:any[]):any;

		static h4(...args:any[]):any;

		static h5(...args:any[]):any;

		static h6(...args:any[]):any;

		static head(...args:any[]):any;

		static header(...args:any[]):any;

		static hgroup(...args:any[]):any;

		static html(...args:any[]):any;

		static i(...args:any[]):any;

		static iframe(...args:any[]):any;

		static ins(...args:any[]):any;

		static kbd(...args:any[]):any;

		static label(...args:any[]):any;

		static legend(...args:any[]):any;

		static li(...args:any[]):any;

		static map(...args:any[]):any;

		static mark(...args:any[]):any;

		static menu(...args:any[]):any;

		static meter(...args:any[]):any;

		static nav(...args:any[]):any;

		static noscript(...args:any[]):any;

		static object(...args:any[]):any;

		static ol(...args:any[]):any;

		static optgroup(...args:any[]):any;

		static option(...args:any[]):any;

		static output(...args:any[]):any;

		static p(...args:any[]):any;

		static pre(...args:any[]):any;

		static progress(...args:any[]):any;

		static q(...args:any[]):any;

		static rp(...args:any[]):any;

		static rt(...args:any[]):any;

		static ruby(...args:any[]):any;

		static s(...args:any[]):any;

		static samp(...args:any[]):any;

		static script(...args:any[]):any;

		static section(...args:any[]):any;

		static select(...args:any[]):any;

		static small(...args:any[]):any;

		static span(...args:any[]):any;

		static strong(...args:any[]):any;

		static style(...args:any[]):any;

		static sub(...args:any[]):any;

		static summary(...args:any[]):any;

		static sup(...args:any[]):any;

		static table(...args:any[]):any;

		static tbody(...args:any[]):any;

		static td(...args:any[]):any;

		static textarea(...args:any[]):any;

		static tfoot(...args:any[]):any;

		static th(...args:any[]):any;

		static thead(...args:any[]):any;

		static time(...args:any[]):any;

		static title(...args:any[]):any;

		static tr(...args:any[]):any;

		static u(...args:any[]):any;

		static ul(...args:any[]):any;

		static video(...args:any[]):any;

		static area(...args:any[]):any;

		static base(...args:any[]):any;

		static br(...args:any[]):any;

		static col(...args:any[]):any;

		static command(...args:any[]):any;

		static embed(...args:any[]):any;

		static hr(...args:any[]):any;

		static img(...args:any[]):any;

		static input(...args:any[]):any;

		static keygen(...args:any[]):any;

		static link(...args:any[]):any;

		static meta(...args:any[]):any;

		static param(...args:any[]):any;

		static source(...args:any[]):any;

		static track(...args:any[]):any;

		static wbrk(...args:any[]):any;

		// tag end

		initialize(view:View, args:any):void;

		constructor(...args:any[]);

		buildHtml(params:any):any;

		wireOutlets(view:View):void;

		bindEventHandlers(view:View):void;

		pushStack(elems:any):any;

		end():any;

		command(eventName:string, handler:any):any;

		command(eventName:string, selector:any, handler:any):any;

		command(eventName:string, selector:any, options:any, handler:any):any;

		preempt(eventName:any, handler:any):any;
	}

	class Builder {
		document:any[];
		postProcessingSteps:any[];

		buildHtml():any[];

		tag(name:string, ...args:any[]):void;

		openTag(name:string, attributes:any):void;

		closeTag(name:string):void;

		text(str:string):void;

		raw(str:string):void;

		subview(outletName:any, subview:View):void;

		extractOptions(args:any):any;
	}
	// copy & paste end


	var jQuery:JQueryStatic;
	var $:JQueryStatic;
	var $$:(fn:Function)=>JQuery; // same type as View.render's return type.
	var $$$:(fn:Function)=>any; // same type as View.buildHtml's return type's [0].
}
// Type definitions for text-buffer
// Project: https://github.com/atom/text-buffer
// Definitions by: vvakame <https://github.com/vvakame/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/// <reference path="../atom/atom.d.ts" />
/// <reference path="../emissary/emissary.d.ts" />
/// <reference path="../q/Q.d.ts" />


declare module TextBuffer {

	interface IPointStatic {
		new (row?:number, column?:number):IPoint;

		fromObject(point:IPoint, copy?:boolean):IPoint;
		fromObject(object:number[]):IPoint;
		fromObject(object:{row:number; column:number;}):IPoint;

		min(point1:IPoint, point2:IPoint):IPoint;
		min(point1:number[], point2:IPoint):IPoint;
		min(point1:{row:number; column:number;}, point2:IPoint):IPoint;

		min(point1:IPoint, point2:number[]):IPoint;
		min(point1:number[], point2:number[]):IPoint;
		min(point1:{row:number; column:number;}, point2:number[]):IPoint;

		min(point1:IPoint, point2:{row:number; column:number;}):IPoint;
		min(point1:number[], point2:{row:number; column:number;}):IPoint;
		min(point1:{row:number; column:number;}, point2:{row:number; column:number;}):IPoint;
	}

	interface IPoint {
		constructor: IPointStatic;

		row:number;
		column:number;

		copy():IPoint;
		freeze():IPoint;

		translate(delta:IPoint):IPoint;
		translate(delta:number[]):IPoint;
		translate(delta:{row:number; column:number;}):IPoint;

		add(other:IPoint):IPoint;
		add(other:number[]):IPoint;
		add(other:{row:number; column:number;}):IPoint;

		splitAt(column:number):IPoint[];
		compare(other:IPoint):number;
		isEqual(other:IPoint):boolean;
		isLessThan(other:IPoint):boolean;
		isLessThanOrEqual(other:IPoint):boolean;
		isGreaterThan(other:IPoint):boolean;
		isGreaterThanOrEqual(other:IPoint):boolean;
		toArray():number[];
		serialize():number[];
	}

	interface IRangeStatic {
		deserialize(array:IPoint[]):IRange;

		fromObject(object:IPoint[]):IRange;

		fromObject(object:IRange, copy?:boolean):IRange;

		fromObject(object:{start: IPoint; end: IPoint}):IRange;
		fromObject(object:{start: number[]; end: IPoint}):IRange;
		fromObject(object:{start: {row:number; column:number;}; end: IPoint}):IRange;

		fromObject(object:{start: IPoint; end: number[]}):IRange;
		fromObject(object:{start: number[]; end: number[]}):IRange;
		fromObject(object:{start: {row:number; column:number;}; end: number[]}):IRange;

		fromObject(object:{start: IPoint; end: {row:number; column:number;}}):IRange;
		fromObject(object:{start: number[]; end: {row:number; column:number;}}):IRange;
		fromObject(object:{start: {row:number; column:number;}; end: {row:number; column:number;}}):IRange;

		fromText(point:IPoint, text:string):IRange;
		fromText(point:number[], text:string):IRange;
		fromText(point:{row:number; column:number;}, text:string):IRange;
		fromText(text:string):IRange;

		fromPointWithDelta(startPoint:IPoint, rowDelta:number, columnDelta:number):IRange;
		fromPointWithDelta(startPoint:number[], rowDelta:number, columnDelta:number):IRange;
		fromPointWithDelta(startPoint:{row:number; column:number;}, rowDelta:number, columnDelta:number):IRange;

		new(point1:IPoint, point2:IPoint):IRange;
		new(point1:number[], point2:IPoint):IRange;
		new(point1:{row:number; column:number;}, point2:IPoint):IRange;

		new(point1:IPoint, point2:number[]):IRange;
		new(point1:number[], point2:number[]):IRange;
		new(point1:{row:number; column:number;}, point2:number[]):IRange;

		new(point1:IPoint, point2:{row:number; column:number;}):IRange;
		new(point1:number[], point2:{row:number; column:number;}):IRange;
		new(point1:{row:number; column:number;}, point2:{row:number; column:number;}):IRange;
	}

	interface IRange {
		constructor:IRangeStatic;

		start: IPoint;
		end: IPoint;

		serialize():number[][];
		copy():IRange;
		freeze():IRange;
		isEqual(other:IRange):boolean;
		isEqual(other:IPoint[]):boolean;

		compare(object:IPoint[]):number;

		compare(object:{start: IPoint; end: IPoint}):number;
		compare(object:{start: number[]; end: IPoint}):number;
		compare(object:{start: {row:number; column:number;}; end: IPoint}):number;

		compare(object:{start: IPoint; end: number[]}):number;
		compare(object:{start: number[]; end: number[]}):number;
		compare(object:{start: {row:number; column:number;}; end: number[]}):number;

		compare(object:{start: IPoint; end: {row:number; column:number;}}):number;
		compare(object:{start: number[]; end: {row:number; column:number;}}):number;
		compare(object:{start: {row:number; column:number;}; end: {row:number; column:number;}}):number;

		isSingleLine():boolean;
		coversSameRows(other:IRange):boolean;

		add(object:IPoint[]):IRange;

		add(object:{start: IPoint; end: IPoint}):IRange;
		add(object:{start: number[]; end: IPoint}):IRange;
		add(object:{start: {row:number; column:number;}; end: IPoint}):IRange;

		add(object:{start: IPoint; end: number[]}):IRange;
		add(object:{start: number[]; end: number[]}):IRange;
		add(object:{start: {row:number; column:number;}; end: number[]}):IRange;

		add(object:{start: IPoint; end: {row:number; column:number;}}):IRange;
		add(object:{start: number[]; end: {row:number; column:number;}}):IRange;
		add(object:{start: {row:number; column:number;}; end: {row:number; column:number;}}):IRange;

		translate(startPoint:IPoint, endPoint:IPoint):IRange;
		translate(startPoint:IPoint):IRange;

		intersectsWith(otherRange:IRange):boolean;
		containsRange(otherRange:IRange, exclusive:boolean):boolean;

		containsPoint(point:IPoint, exclusive:boolean):boolean;
		containsPoint(point:number[], exclusive:boolean):boolean;
		containsPoint(point:{row:number; column:number;}, exclusive:boolean):boolean;

		intersectsRow(row:number):boolean;
		intersectsRowRange(startRow:number, endRow:number):boolean;
		union(otherRange:IRange):IRange;
		isEmpty():boolean;
		toDelta():IPoint;
		getRowCount():number;
		getRows():number[];
	}

	interface IHistory {
		// TBD
	}

	interface IMarkerManager {
		// TBD
	}

	interface IMarker {
		// TBD
	}

	interface IBufferPatch {
		// TBD
	}

	interface ITextBufferStatic {
		Point: IPointStatic;
		Range: IRangeStatic;
		newlineRegex:any;

		new (text:string): ITextBuffer;
		new (params:any): ITextBuffer;
	}

	interface ITextBuffer extends Emissary.IEmitter, Emissary.ISubscriber {
		// Delegator.includeInto(TextBuffer);
		// Serializable.includeInto(TextBuffer);

		cachedText:string;
		stoppedChangingDelay:number;
		stoppedChangingTimeout:any;
		cachedDiskContents:string;
		conflict:boolean;
		file:any; // pathwatcher.IFile
		refcount:number;

		lines:string[];
		lineEndings:string[];
		offsetIndex:any; // span-skip-list.SpanSkipList
		history:IHistory;
		markers:IMarkerManager;
		loaded:boolean;
		digestWhenLastPersisted:string;
		modifiedWhenLastPersisted:boolean;
		useSerializedText:boolean;

		deserializeParams(params:any):any;
		serializeParams():any;

		getText():string;
		getLines():string;
		isEmpty():boolean;
		getLineCount():number;
		getLastRow():number;
		lineForRow(row:number):string;
		getLastLine():string;
		lineEndingForRow(row:number):string;
		lineLengthForRow(row:number):number;
		setText(text:string):IRange;
		setTextViaDiff(text:any):any[];
		setTextInRange(range:IRange, text:string, normalizeLineEndings?:boolean):IRange;
		insert(position:IPoint, text:string, normalizeLineEndings?:boolean):IRange;
		append(text:string, normalizeLineEndings?:boolean):IRange;
		delete(range:IRange):IRange;
		deleteRow(row:number):IRange;
		deleteRows(startRow:number, endRow:number):IRange;
		buildPatch(oldRange:IRange, newText:string, normalizeLineEndings?:boolean):IBufferPatch;
		applyPatch(patch:IBufferPatch):any;
		getTextInRange(range:IRange):string;
		clipRange(range:IRange):IRange;
		clipPosition(position:IPoint):IPoint;
		getFirstPosition():IPoint;
		getEndPosition():IPoint;
		getRange():IRange;
		rangeForRow(row:number, includeNewline?:boolean):IRange;
		characterIndexForPosition(position:IPoint):number;
		positionForCharacterIndex(offset:number):IPoint;
		getMaxCharacterIndex():number;
		loadSync():ITextBuffer;
		load():Q.IPromise<ITextBuffer>;
		finishLoading():ITextBuffer;
		handleTextChange(event:any):any;
		destroy():any;
		isAlive():boolean;
		isDestroyed():boolean;
		isRetained():boolean;
		retain():ITextBuffer;
		release():ITextBuffer;
		subscribeToFile():any;
		hasMultipleEditors():boolean;
		reload():any;
		updateCachedDiskContentsSync():string;
		updateCachedDiskContents():Q.IPromise<string>;
		getBaseName():string;
		getPath():string;
		getUri():string;
		setPath(filePath:string):any;
		save():void;
		saveAs(filePath:string):any;
		isModified():boolean;
		isInConflict():boolean;
		destroyMarker(id:any):any;
		matchesInCharacterRange(regex:any, startIndex:any, endIndex:any):any[];
		scan(regex:any, iterator:any):any;
		backwardsScan(regex:any, iterator:any):any;
		replace(regex:any, replacementText:any):any;
		scanInRange(regex:any, range:any, iterator:any, reverse:any):any;
		backwardsScanInRange(regex:any, range:any, iterator:any):any;
		isRowBlank(row:number):boolean;
		previousNonBlankRow(startRow:number):number;
		nextNonBlankRow(startRow:number):number;
		usesSoftTabs():boolean;
		cancelStoppedChangingTimeout():any;
		scheduleModifiedEvents():any;
		emitModifiedStatusChanged(modifiedStatus:any):any;
		logLines(start:number, end:number):void;

		// delegate to history property
		undo():any;
		redo():any;
		transact(fn:Function):any;
		beginTransaction():any;
		commitTransaction():any;
		abortTransaction():any;
		clearUndoStack():any;

		// delegate to markers property
		markRange(range:any, properties:any):any;
		markPosition(range:any, properties:any):any;
		getMarker(id:number):IMarker;
		getMarkers():IMarker[];
		getMarkerCount():number;
	}
}

declare module "text-buffer" {
	var _: TextBuffer.ITextBufferStatic;
	export = _;
}// Type definitions for status-bar
// Project: https://github.com/atom/status-bar
// Definitions by: vvakame <https://github.com/vvakame/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/// <reference path="../space-pen/space-pen.d.ts" />
/// <reference path="../text-buffer/text-buffer.d.ts" />

declare module StatusBar {
	interface IStatusBarViewStatic {
		content():any;

		new(...args:any[]):IStatusBarView;
	}

	interface IStatusBarView extends View {

		initialize():any;
		attach():any;
		destroy():any;
		appendLeft(view:View):any;
		prependLeft(view:View):any;
		appendRight(view:View):any;
		prependRight(view:View):any;
		getActiveBuffer():TextBuffer.ITextBuffer;
		getActiveItem():any;
		storeActiveBuffer():TextBuffer.ITextBuffer;
		subscribeToBuffer(event:string, callback:Function):any;
		subscribeAllToBuffer():any[];
		unsubscribeAllFromBuffer():any[];
	}
}
// Type definitions for Atom
// Project: https://atom.io/
// Definitions by: vvakame <https://github.com/vvakame/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/// <reference path="../q/Q.d.ts" />
/// <reference path="../jquery/jquery.d.ts" />
/// <reference path="../space-pen/space-pen.d.ts" />
/// <reference path="../emissary/emissary.d.ts" />
/// <reference path="../pathwatcher/pathwatcher.d.ts" />
/// <reference path="../text-buffer/text-buffer.d.ts" />
/// <reference path="../status-bar/status-bar.d.ts" />

// Policy: this definition file only declare element related to `atom`.
// if js file include to another npm package (e.g. "space-pen", "mixto" and "emissary").
// you should create a separate file.

// NOTE Document? You should use DevTools hehe...

interface Window {
	atom: AtomCore.IAtom;
	measure(description:string, fn:Function):any; // return fn result
	profile(description:string, fn:Function):any; // return fn result
}

declare module AtomCore {

// https://atom.io/docs/v0.84.0/advanced/view-system
	interface IWorkspaceViewStatic {
		new ():IWorkspaceView;

		version: number;
		configDefaults:any;
		content():any;
    }

    interface Disposable {
        dispose();
    }

	interface Decoration
	{
	    destroy(): void;
	}

	/**
	 * Represents a buffer annotation that remains logically stationary even as the buffer changes. This is used
	 * to represent cursors, folds, snippet targets, misspelled words, any anything else that needs to track a
	 * logical location in the buffer over time.
	 */
    interface Marker {
        /**
         * Destroys the marker, causing it to emit the 'destroyed' event. Once destroyed, a marker cannot be
         * restored by undo/redo operations.
         */
        destroy(): void;

        /**
         * Gets the screen range of the display marker.
         */
        getScreenRange(): Range;
    }

    interface IWorkspaceView extends View {
		// Delegator.includeInto(WorkspaceView);

		// delegate to model property's property
		fullScreen:boolean;

		// delegate to model property's method
		open(uri:string, options:any):Q.Promise<View>;
		openSync(uri:string, options?:any):any;
		saveActivePaneItem():any;
		saveActivePaneItemAs():any;
		saveAll():void;
		destroyActivePaneItem():any;
		destroyActivePane():any;
		increaseFontSize():void;
		decreaseFontSize():void;

		// own property & methods
		initialize(model:IWorkspace):any;
		initialize(view:View, args:any):void; // do not use
		model:IWorkspace;
		panes: IPaneContainerView;
		getModel():IWorkspace;
		installShellCommands():any;
		handleFocus():any;
		afterAttach(onDom?:any):any;
		confirmClose():boolean;
		updateTitle():any;
		setTitle(title:string):any;
		getEditorViews():any[]; // atom.EditorView
		prependToTop(element:any):any;
		appendToTop(element:any):any;
		prependToBottom(element:any):any;
		appendToBottom(element:any):any;
		prependToLeft(element:any):any;
		appendToLeft(element:any):any;
		prependToRight(element:any):any;
		appendToRight(element:any):any;
		getActivePaneView():IPaneView;
		getActiveView():View;
		focusPreviousPaneView():any;
		focusNextPaneView():any;
		focusPaneViewAbove():any;
		focusPaneViewBelow():any;
		focusPaneViewOnLeft():any;
		focusPaneViewOnRight():any;
		eachPaneView(callback:(paneView:IPaneView)=>any):{ off():any; };
		getPaneViews():IPaneView[];
		eachEditorView(callback:(editorView:any /* EditorView */)=>any):{ off():any; };
		beforeRemove():any;

		command(eventName:string, handler:Function):any;
		command(eventName:string, selector:Function, handler:Function):any;
		command(eventName:string, options:any, handler:Function):any;
		command(eventName:string, selector:Function, options:any, handler:Function):any;

		statusBar:StatusBar.IStatusBarView;
	}

	interface IPanes {
		// TBD
	}

	interface IPaneView {
		// TBD
	}

	interface IPaneContainerView {
		// TBD
	}

	interface ITreeView {
		// TBD
	}

	interface IGutterViewStatic {
		new(): IGutterView;
		content():any;
	}

	interface IGutterView extends View {
		firstScreenRow:any;
		lastScreenRow:any;
		initialize():void;
		initialize(view:View, args:any):void; // do not use
		afterAttach(onDom?:any):any;
		beforeRemove():any;
		handleMouseEvents(e:JQueryMouseEventObject):any;
		getEditorView():any; /* EditorView */
		getEditor():IEditor;
		getLineNumberElements():HTMLCollection;
		getLineNumberElementsForClass(klass:string):NodeList;
		getLineNumberElement(bufferRow:number):NodeList;
		addClassToAllLines(klass:string):boolean;
		removeClassFromAllLines(klass:string):boolean;
		addClassToLine(bufferRow:number, klass:string):boolean;
		removeClassFromLine(bufferRow:number, klass:string):boolean;
		updateLineNumbers(changes:any[], startScreenRow?:number, endScreenRow?:number):any;
		prependLineElements(lineElements:any):void;
		appendLineElements(lineElements:any):void;
		removeLineElements(numberOfElements:number):void;
		buildLineElements(startScreenRow:any, endScreenRow:any):any;
		buildLineElementsHtml(startScreenRow:any, endScreenRow:any):any;
		updateFoldableClasses(changes:any[]):any;
		removeLineHighlights():void;
		addLineHighlight(row:number, emptySelection?:boolean):any;
		highlightLines():boolean;
    }

    interface ICommandRegistry {
        add(selector: string, name: string, callback: (event: any) => void); // selector:'atom-editor'|'atom-workspace'
		dispatch(selector: any, name:string);
    }

    interface ICommandPanel {
		// TBD
	}

	interface IDisplayBufferStatic {
		new(_arg?:any):IDisplayBuffer;
	}

	interface IDisplayBuffer /* extends Theorist.Model */ {
		// Serializable.includeInto(Editor);

		constructor:IDisplayBufferStatic;

		verticalScrollMargin:number;
		horizontalScrollMargin:number;

		declaredPropertyValues:any;
		tokenizedBuffer: ITokenizedBuffer;
		buffer: TextBuffer.ITextBuffer;
		charWidthsByScope:any;
		markers:{ [index:number]:IDisplayBufferMarker; };
		foldsByMarkerId:any;
		maxLineLength:number;
		screenLines:ITokenizedLine[];
		rowMap:any; // return type are RowMap
		longestScreenRow:number;
		subscriptions:Emissary.ISubscription[];
		subscriptionsByObject:any; // return type are WeakMap
		behaviors:any;
		subscriptionCounts:any;
		eventHandlersByEventName:any;
		pendingChangeEvent:any;

		softWrap:boolean;

		serializeParams():{id:number; softWrap:boolean; editorWidthInChars: number; scrollTop: number; scrollLeft: number; tokenizedBuffer: any; };
		deserializeParams(params:any):any;
		copy():IDisplayBuffer;
		updateAllScreenLines():any;
		emitChanged(eventProperties:any, refreshMarkers?:boolean):any;
		updateWrappedScreenLines():any;
		setVisible(visible:any):any;
		getVerticalScrollMargin():number;
		setVerticalScrollMargin(verticalScrollMargin:number):number;
		getHorizontalScrollMargin():number;
		setHorizontalScrollMargin(horizontalScrollMargin:number):number;
		getHeight():any;
		setHeight(height:any):any;
		getWidth():any;
		setWidth(newWidth:any):any;
		getScrollTop():number;
		setScrollTop(scrollTop:number):number;
		getScrollBottom():number;
		setScrollBottom(scrollBottom:number):number;
		getScrollLeft():number;
		setScrollLeft(scrollLeft:number):number;
		getScrollRight():number;
		setScrollRight(scrollRight:number):number;
		getLineHeight():any;
		setLineHeight(lineHeight:any):any;
		getDefaultCharWidth():any;
		setDefaultCharWidth(defaultCharWidth:any):any;
		getScopedCharWidth(scopeNames:any, char:any):any;
		getScopedCharWidths(scopeNames:any):any;
		setScopedCharWidth(scopeNames:any, char:any, width:any):any;
		setScopedCharWidths(scopeNames:any, charWidths:any):any;
		clearScopedCharWidths():any;
		getScrollHeight():number;
		getScrollWidth():number;
		getVisibleRowRange():number[];
		intersectsVisibleRowRange(startRow:any, endRow:any):any;
		selectionIntersectsVisibleRowRange(selection:any):any;
		scrollToScreenRange(screenRange:any):any;
		scrollToScreenPosition(screenPosition:any):any;
		scrollToBufferPosition(bufferPosition:any):any;
		pixelRectForScreenRange(screenRange:TextBuffer.IRange):any;
		getTabLength():number;
		setTabLength(tabLength:number):any;
		setSoftWrap(softWrap:boolean):boolean;
		getSoftWrap():boolean;
		setEditorWidthInChars(editorWidthInChars:number):any;
		getEditorWidthInChars():number;
		getSoftWrapColumn():number;
		lineForRow(row:number):any;
		linesForRows(startRow:number, endRow:number):any;
		getLines():any[];
		indentLevelForLine(line:any):any;
		bufferRowsForScreenRows(startScreenRow:any, endScreenRow:any):any;
		createFold(startRow:number, endRow:number):IFold;
		isFoldedAtBufferRow(bufferRow:number):boolean;
		isFoldedAtScreenRow(screenRow:number):boolean;
		destroyFoldWithId(id:number):any;
		unfoldBufferRow(bufferRow:number):any[];
		largestFoldStartingAtBufferRow(bufferRow:number):any;
		foldsStartingAtBufferRow(bufferRow:number):any;
		largestFoldStartingAtScreenRow(screenRow:any):any;
		largestFoldContainingBufferRow(bufferRow:any):any;
		outermostFoldsInBufferRowRange(startRow:any, endRow:any):any[];
		foldsContainingBufferRow(bufferRow:any):any[];
		screenRowForBufferRow(bufferRow:number):number;
		lastScreenRowForBufferRow(bufferRow:number):number;
		bufferRowForScreenRow(screenRow:number):number;

		screenRangeForBufferRange(bufferRange:TextBuffer.IPoint[]):TextBuffer.IRange;

		screenRangeForBufferRange(bufferRange:TextBuffer.IRange):TextBuffer.IRange;

		screenRangeForBufferRange(bufferRange:{start: TextBuffer.IPoint; end: TextBuffer.IPoint}):TextBuffer.IRange;
		screenRangeForBufferRange(bufferRange:{start: number[]; end: TextBuffer.IPoint}):TextBuffer.IRange;
		screenRangeForBufferRange(bufferRange:{start: {row:number; col:number;}; end: TextBuffer.IPoint}):TextBuffer.IRange;

		screenRangeForBufferRange(bufferRange:{start: TextBuffer.IPoint; end: number[]}):TextBuffer.IRange;
		screenRangeForBufferRange(bufferRange:{start: number[]; end: number[]}):TextBuffer.IRange;
		screenRangeForBufferRange(bufferRange:{start: {row:number; col:number;}; end: number[]}):TextBuffer.IRange;

		screenRangeForBufferRange(bufferRange:{start: TextBuffer.IPoint; end: {row:number; col:number;}}):TextBuffer.IRange;
		screenRangeForBufferRange(bufferRange:{start: number[]; end: {row:number; col:number;}}):TextBuffer.IRange;
		screenRangeForBufferRange(bufferRange:{start: {row:number; col:number;}; end: {row:number; col:number;}}):TextBuffer.IRange;

		bufferRangeForScreenRange(screenRange:TextBuffer.IPoint[]):TextBuffer.IRange;

		bufferRangeForScreenRange(screenRange:TextBuffer.IRange):TextBuffer.IRange;

		bufferRangeForScreenRange(screenRange:{start: TextBuffer.IPoint; end: TextBuffer.IPoint}):TextBuffer.IRange;
		bufferRangeForScreenRange(screenRange:{start: number[]; end: TextBuffer.IPoint}):TextBuffer.IRange;
		bufferRangeForScreenRange(screenRange:{start: {row:number; col:number;}; end: TextBuffer.IPoint}):TextBuffer.IRange;

		bufferRangeForScreenRange(screenRange:{start: TextBuffer.IPoint; end: number[]}):TextBuffer.IRange;
		bufferRangeForScreenRange(screenRange:{start: number[]; end: number[]}):TextBuffer.IRange;
		bufferRangeForScreenRange(screenRange:{start: {row:number; col:number;}; end: number[]}):TextBuffer.IRange;

		bufferRangeForScreenRange(screenRange:{start: TextBuffer.IPoint; end: {row:number; col:number;}}):TextBuffer.IRange;
		bufferRangeForScreenRange(screenRange:{start: number[]; end: {row:number; col:number;}}):TextBuffer.IRange;
		bufferRangeForScreenRange(screenRange:{start: {row:number; col:number;}; end: {row:number; col:number;}}):TextBuffer.IRange;

		pixelRangeForScreenRange(screenRange:TextBuffer.IPoint[], clip?:boolean):TextBuffer.IRange;

		pixelRangeForScreenRange(screenRange:TextBuffer.IRange, clip?:boolean):TextBuffer.IRange;

		pixelRangeForScreenRange(screenRange:{start: TextBuffer.IPoint; end: TextBuffer.IPoint}, clip?:boolean):TextBuffer.IRange;
		pixelRangeForScreenRange(screenRange:{start: number[]; end: TextBuffer.IPoint}, clip?:boolean):TextBuffer.IRange;
		pixelRangeForScreenRange(screenRange:{start: {row:number; col:number;}; end: TextBuffer.IPoint}, clip?:boolean):TextBuffer.IRange;

		pixelRangeForScreenRange(screenRange:{start: TextBuffer.IPoint; end: number[]}, clip?:boolean):TextBuffer.IRange;
		pixelRangeForScreenRange(screenRange:{start: number[]; end: number[]}, clip?:boolean):TextBuffer.IRange;
		pixelRangeForScreenRange(screenRange:{start: {row:number; col:number;}; end: number[]}, clip?:boolean):TextBuffer.IRange;

		pixelRangeForScreenRange(screenRange:{start: TextBuffer.IPoint; end: {row:number; col:number;}}, clip?:boolean):TextBuffer.IRange;
		pixelRangeForScreenRange(screenRange:{start: number[]; end: {row:number; col:number;}}, clip?:boolean):TextBuffer.IRange;
		pixelRangeForScreenRange(screenRange:{start: {row:number; col:number;}; end: {row:number; col:number;}}, clip?:boolean):TextBuffer.IRange;

		pixelPositionForScreenPosition(screenPosition:TextBuffer.IPoint, clip?:boolean):TextBuffer.IPoint;
		pixelPositionForScreenPosition(screenPosition:number[], clip?:boolean):TextBuffer.IPoint;
		pixelPositionForScreenPosition(screenPosition:{row:number; col:number;}, clip?:boolean):TextBuffer.IPoint;

		screenPositionForPixelPosition(pixelPosition:any):TextBuffer.IPoint;

		pixelPositionForBufferPosition(bufferPosition:any):any;
		getLineCount():number;
		getLastRow():number;
		getMaxLineLength():number;
		screenPositionForBufferPosition(bufferPosition:any, options:any):any;
		bufferPositionForScreenPosition(bufferPosition:any, options:any):any;
		scopesForBufferPosition(bufferPosition:any):any;
		bufferRangeForScopeAtPosition(selector:any, position:any):any;
		tokenForBufferPosition(bufferPosition:any):any;
		getGrammar():IGrammar;
		setGrammar(grammar:IGrammar):any;
		reloadGrammar():any;
		clipScreenPosition(screenPosition:any, options:any):any;
		findWrapColumn(line:any, softWrapColumn:any):any;
		rangeForAllLines():TextBuffer.IRange;
		getMarker(id:number):IDisplayBufferMarker;
		getMarkers():IDisplayBufferMarker[];
		getMarkerCount():number;
		markScreenRange(range:TextBuffer.IRange, ...args:any[]):IDisplayBufferMarker;
		markBufferRange(range:TextBuffer.IRange, options?:any):IDisplayBufferMarker;
		markScreenPosition(screenPosition:TextBuffer.IPoint, options?:any):IDisplayBufferMarker;
		markBufferPosition(bufferPosition:TextBuffer.IPoint, options?:any):IDisplayBufferMarker;
		destroyMarker(id:number):any;
		findMarker(params?:any):IDisplayBufferMarker;
		findMarkers(params?:any):IDisplayBufferMarker[];
		translateToBufferMarkerParams(params?:any):any;
		findFoldMarker(attributes:any):IMarker;
		findFoldMarkers(attributes:any):IMarker[];
		getFoldMarkerAttributes(attributes?:any):any;
		pauseMarkerObservers():any;
		resumeMarkerObservers():any;
		refreshMarkerScreenPositions():any;
		destroy():any;
		logLines(start:number, end:number):any[];
		handleTokenizedBufferChange(tokenizedBufferChange:any):any;
		updateScreenLines(startBufferRow:any, endBufferRow:any, bufferDelta?:number, options?:any):any;
		buildScreenLines(startBufferRow:any, endBufferRow:any):any;
		findMaxLineLength(startScreenRow:any, endScreenRow:any, newScreenLines:any):any;
		handleBufferMarkersUpdated():any;
		handleBufferMarkerCreated(marker:any):any;
		createFoldForMarker(maker:any):IFold;
		foldForMarker(marker:any):any;
	}

	interface IViewRegistry {
		getView(selector:any):any;
	}

	interface ICursorStatic {
		new (arg:{editor:IEditor; marker:IDisplayBufferMarker; id: number;}):ICursor;
	}

	interface ICursor /* extends Theorist.Model */ {
		screenPosition:any;
		bufferPosition:any;
		goalColumn:any;
		visible:boolean;
		needsAutoscroll:boolean;

		editor:IEditor;
		marker:IDisplayBufferMarker;
		id: number;

		destroy():any;
		changePosition(options:any, fn:Function):any;
		getPixelRect():any;
		setScreenPosition(screenPosition:any, options?:any):any;
		getScreenPosition():TextBuffer.IPoint;
		getScreenRange():TextBuffer.IRange;
		setBufferPosition(bufferPosition:any, options?:any):any;
		getBufferPosition():TextBuffer.IPoint;
		autoscroll():any;
		updateVisibility():any;
		setVisible(visible:boolean):any;
		isVisible():boolean;
		wordRegExp(arg?:any):any;
		isLastCursor():boolean;
		isSurroundedByWhitespace():boolean;
		isBetweenWordAndNonWord():boolean;
		isInsideWord():boolean;
		clearAutoscroll():void;
		clearSelection():void;
		getScreenRow():number;
		getScreenColumn():number;
		getBufferRow():number;
		getBufferColumn():number;
		getCurrentBufferLine():string;
		moveUp(rowCount:number, arg?:any):any;
		moveDown(rowCount:number, arg?:any):any;
		moveLeft(arg?:any):any;
		moveRight(arg?:any):any;
		moveToTop():any;
		moveToBottom():void;
		moveToBeginningOfScreenLine():void;
		moveToBeginningOfLine():void;
		moveToFirstCharacterOfLine():void;
		moveToEndOfScreenLine():void;
		moveToEndOfLine():void;
		moveToBeginningOfWord():void;
		moveToEndOfWord():void;
		moveToBeginningOfNextWord():void;
		moveToPreviousWordBoundary():void;
		moveToNextWordBoundary():void;
		getBeginningOfCurrentWordBufferPosition(options?:any):TextBuffer.IPoint;
		getPreviousWordBoundaryBufferPosition(options?:any):TextBuffer.IPoint;
		getMoveNextWordBoundaryBufferPosition(options?:any):TextBuffer.IPoint;
		getEndOfCurrentWordBufferPosition(options?:any):TextBuffer.IPoint;
		getBeginningOfNextWordBufferPosition(options?:any):TextBuffer.IPoint;
		getCurrentWordBufferRange(options?:any):TextBuffer.IPoint;
		getCurrentLineBufferRange(options?:any):TextBuffer.IPoint;
		getCurrentParagraphBufferRange():any;
		getCurrentWordPrefix():string;
		isAtBeginningOfLine():boolean;
		getIndentLevel():number;
		isAtEndOfLine():boolean;
		getScopes():string[];
		hasPrecedingCharactersOnLine():boolean;
		getMarker(): Marker;
	}

	interface ILanguageMode {
		// TBD
	}

	interface ISelection /* extends Theorist.Model */ {
		cursor:ICursor;
		marker:IDisplayBufferMarker;
		editor:IEditor;
		initialScreenRange:any;
		wordwise:boolean;
		needsAutoscroll:boolean;
		retainSelection:boolean;
		subscriptionCounts:any;

		destroy():any;
		finalize():any;
		clearAutoscroll():any;
		isEmpty():boolean;
		isReversed():boolean;
		isSingleScreenLine():boolean;
		getScreenRange():TextBuffer.IRange;
		setScreenRange(screenRange:any, options:any):any;
		getBufferRange():TextBuffer.IRange;
		setBufferRange(bufferRange:any, options:any):any;
		getBufferRowRange():number[];
		autoscroll():void;
		getText():string;
		clear():boolean;
		selectWord():TextBuffer.IRange;
		expandOverWord():any;
		selectLine(row?:any):TextBuffer.IRange;
		expandOverLine():boolean;
		selectToScreenPosition(position:any):any;
		selectToBufferPosition(position:any):any;
		selectRight():boolean;
		selectLeft():boolean;
		selectUp(rowCount?:any):boolean;
		selectDown(rowCount?:any):boolean;
		selectToTop():any;
		selectToBottom():any;
		selectAll():any;
		selectToBeginningOfLine():any;
		selectToFirstCharacterOfLine():any;
		selectToEndOfLine():any;
		selectToBeginningOfWord():any;
		selectToEndOfWord():any;
		selectToBeginningOfNextWord():any;
		selectToPreviousWordBoundary():any;
		selectToNextWordBoundary():any;
		addSelectionBelow():any;
		getGoalBufferRange():any;
		addSelectionAbove():any[];
		insertText(text:string, options?:any):any;
		normalizeIndents(text:string, indentBasis:number):any;
		indent(_arg?:any):any;
		indentSelectedRows():TextBuffer.IRange[];
		setIndentationForLine(line:string, indentLevel:number):any;
		backspace():any;
		backspaceToBeginningOfWord():any;
		backspaceToBeginningOfLine():any;
		delete():any;
		deleteToEndOfWord():any;
		deleteSelectedText():any;
		deleteLine():any;
		joinLines():any;
		outdentSelectedRows():any[];
		autoIndentSelectedRows():any;
		toggleLineComments():any;
		cutToEndOfLine(maintainClipboard:any):any;
		cut(maintainClipboard:any):any;
		copy(maintainClipboard:any):any;
		fold():any;
		modifySelection(fn:()=>any):any;
		plantTail():any;
		intersectsBufferRange(bufferRange:any):any;
		intersectsWith(otherSelection:any):any;
		merge(otherSelection:any, options:any):any;
		compare(otherSelection:any):any;
		getRegionRects():any[];
		screenRangeChanged():any;
	}

	interface IEditor {
		// Serializable.includeInto(Editor);
		// Delegator.includeInto(Editor);

		deserializing:boolean;
		callDisplayBufferCreatedHook:boolean;
		registerEditor:boolean;
		buffer:TextBuffer.ITextBuffer;
		languageMode: ILanguageMode;
		cursors:ICursor[];
		selections: ISelection[];
		suppressSelectionMerging:boolean;
		softTabs: boolean;
		displayBuffer: IDisplayBuffer;

		id:number;
		behaviors:any;
		declaredPropertyValues: any;
		eventHandlersByEventName: any;
		eventHandlersByNamespace: any;
		lastOpened: number;
		subscriptionCounts: any;
		subscriptionsByObject: any; /* WeakMap */
		subscriptions: Emissary.ISubscription[];

		serializeParams():{id:number; softTabs:boolean; scrollTop:number; scrollLeft:number; displayBuffer:any;};
		deserializeParams(params:any):any;
		subscribeToBuffer():void;
		subscribeToDisplayBuffer():void;
		getViewClass():any; // return type are EditorView
		isDestroyed():boolean;
		copy():IEditor;
		getTitle():string;
		getLongTitle():string;
		setVisible(visible:boolean):void;
		setScrollTop(scrollTop:any):void;
		getScrollTop():number;
		setScrollLeft(scrollLeft:any):void;
		getScrollLeft():number;
		setEditorWidthInChars(editorWidthInChars:any):void;
		getSoftWrapColumn():number;
		getSoftTabs():boolean;
		setSoftTabs(softTabs:boolean):void;
		getSoftWrap():boolean;
		setSoftWrap(softWrap:any):void;
		getTabText():string;
		getTabLength():number;
		setTabLength(tabLength:any):void;
		clipBufferPosition(bufferPosition:any):void;
		clipBufferRange(range:any):void;
		indentationForBufferRow(bufferRow:any):void;
		setIndentationForBufferRow(bufferRow:any, newLevel:any, _arg:any):void;
		indentLevelForLine(line:any):number;
		buildIndentString(number:any):string;
		save():void;
		saveAs(filePath:any):void;
		getPath():string;
		getText():string;
		setText(text:any):void;
		getTextInRange(range:any):any;
		getLineCount():number;
		getBuffer():TextBuffer.ITextBuffer;
		getUri():string;
		isBufferRowBlank(bufferRow:any):boolean;
		isBufferRowCommented(bufferRow:any):void;
		nextNonBlankBufferRow(bufferRow:any):void;
		getEofBufferPosition():TextBuffer.IPoint;
		getLastBufferRow():number;
		bufferRangeForBufferRow(row:any, options:any):TextBuffer.IRange;
		lineForBufferRow(row:number):string;
		lineLengthForBufferRow(row:number):number;
		scan():any;
		scanInBufferRange():any;
		backwardsScanInBufferRange():any;
		isModified():boolean;
		shouldPromptToSave():boolean;
		screenPositionForBufferPosition(bufferPosition:any, options?:any):TextBuffer.IPoint;
		bufferPositionForScreenPosition(screenPosition:any, options?:any):TextBuffer.IPoint;
		screenRangeForBufferRange(bufferRange:any):TextBuffer.IRange;
		bufferRangeForScreenRange(screenRange:any):TextBuffer.IRange;
		clipScreenPosition(screenPosition:any, options:any):TextBuffer.IRange;
		lineForScreenRow(row:any):ITokenizedLine;
		linesForScreenRows(start?:any, end?:any):ITokenizedLine[];
		getScreenLineCount():number;
		getMaxScreenLineLength():number;
		getLastScreenRow():number;
		bufferRowsForScreenRows(startRow:any, endRow:any):any[];
		bufferRowForScreenRow(row:any):number;
		scopesForBufferPosition(bufferPosition:any):string[];
		bufferRangeForScopeAtCursor(selector:string):any;
		tokenForBufferPosition(bufferPosition:any):IToken;
		getCursorScopes():string[];
		insertText(text:string, options?:any):TextBuffer.IRange[];
		insertNewline():TextBuffer.IRange[];
		insertNewlineBelow():TextBuffer.IRange[];
		insertNewlineAbove():any;
		indent(options?:any):any;
		backspace():any[];
		backspaceToBeginningOfWord():any[];
		backspaceToBeginningOfLine():any[];
		delete():any[];
		deleteToEndOfWord():any[];
		deleteLine():TextBuffer.IRange[];
		indentSelectedRows():TextBuffer.IRange[][];
		outdentSelectedRows():TextBuffer.IRange[][];
		toggleLineCommentsInSelection():TextBuffer.IRange[];
		autoIndentSelectedRows():TextBuffer.IRange[][];
		normalizeTabsInBufferRange(bufferRange:any):any;
		cutToEndOfLine():boolean[];
		cutSelectedText():boolean[];
		copySelectedText():boolean[];
		pasteText(options?:any):TextBuffer.IRange[];
		undo():any[];
		redo():any[];
		foldCurrentRow():any;
		unfoldCurrentRow():any[];
		foldSelectedLines():any[];
		foldAll():any[];
		unfoldAll():any[];
		foldAllAtIndentLevel(level:any):any;
		foldBufferRow(bufferRow:any):any;
		unfoldBufferRow(bufferRow:any):any;
		isFoldableAtBufferRow(bufferRow:any):boolean;
		createFold(startRow:any, endRow:any):IFold;
		destroyFoldWithId(id:any):any;
		destroyFoldsIntersectingBufferRange(bufferRange:any):any;
		toggleFoldAtBufferRow(bufferRow:any):any;
		isFoldedAtCursorRow():boolean;
		isFoldedAtBufferRow(bufferRow:any):boolean;
		isFoldedAtScreenRow(screenRow:any):boolean;
		largestFoldContainingBufferRow(bufferRow:any):boolean;
		largestFoldStartingAtScreenRow(screenRow:any):any;
		outermostFoldsInBufferRowRange(startRow:any, endRow:any):any[];
		moveLineUp():ISelection[];
		moveLineDown():ISelection[];
		duplicateLines():any[][];
		duplicateLine():any[][];
		mutateSelectedText(fn:(selection:ISelection)=>any):any;
		replaceSelectedText(options:any, fn:(selection:string)=>any):any;
		getMarker(id:number):IDisplayBufferMarker;
		getMarkers():IDisplayBufferMarker[];
		findMarkers(...args:any[]):IDisplayBufferMarker[];
		markScreenRange(...args:any[]):IDisplayBufferMarker;
		markBufferRange(...args:any[]):IDisplayBufferMarker;
		markScreenPosition(...args:any[]):IDisplayBufferMarker;
		markBufferPosition(...args:any[]):IDisplayBufferMarker;
		destroyMarker(...args:any[]):boolean;
		getMarkerCount():number;
		hasMultipleCursors():boolean;
		getCursors():ICursor[];
		getCursor():ICursor;
		addCursorAtScreenPosition(screenPosition:any):ICursor;
		addCursorAtBufferPosition(bufferPosition:any):ICursor;
		addCursor(marker:any):ICursor;
		removeCursor(cursor:any):ICursor[];
		addSelection(marker:any, options:any):ISelection;
		addSelectionForBufferRange(bufferRange:any, options:any):ISelection;
		setSelectedBufferRange(bufferRange:any, options:any):any;
		setSelectedBufferRanges(bufferRanges:any, options:any):any;
		removeSelection(selection:ISelection):any;
		clearSelections():boolean;
		consolidateSelections():boolean;
		getSelections():ISelection[];
		getSelection(index?:number):ISelection;
		getLastSelection():ISelection;
		getSelectionsOrderedByBufferPosition():ISelection[];
		getLastSelectionInBuffer():ISelection;
		selectionIntersectsBufferRange(bufferRange:any):any;
		setCursorScreenPosition(position:TextBuffer.IPoint, options?:any):any;
		getCursorScreenPosition():TextBuffer.IPoint;
		getCursorScreenRow():number;
		setCursorBufferPosition(position:any, options?:any):any;
		getCursorBufferPosition():TextBuffer.IPoint;
		getSelectedScreenRange():TextBuffer.IRange;
		getSelectedBufferRange():TextBuffer.IRange;
		getSelectedBufferRanges():TextBuffer.IRange[];
		getSelectedText():string;
		getTextInBufferRange(range:TextBuffer.IRange):string;
		setTextInBufferRange(range:TextBuffer.IRange | any[], text:string):any;
		getCurrentParagraphBufferRange():TextBuffer.IRange;
		getWordUnderCursor(options?:any):string;
		moveCursorUp(lineCount?:number):void;
		moveCursorDown(lineCount?:number):void;
		moveCursorLeft():void;
		moveCursorRight():void;
		moveCursorToTop():void;
		moveCursorToBottom():void;
		moveCursorToBeginningOfScreenLine():void;
		moveCursorToBeginningOfLine():void;
		moveCursorToFirstCharacterOfLine():void;
		moveCursorToEndOfScreenLine():void;
		moveCursorToEndOfLine():void;
		moveCursorToBeginningOfWord():void;
		moveCursorToEndOfWord():void;
		moveCursorToBeginningOfNextWord():void;
		moveCursorToPreviousWordBoundary():void;
		moveCursorToNextWordBoundary():void;
		moveCursors(fn:(cursor:ICursor)=>any):any;
		moveToBeginningOfLine():any;
		moveToEndOfLine():any;
		selectToScreenPosition(position:TextBuffer.IPoint):any;
		selectRight():ISelection[];
		selectLeft():ISelection[];
		selectUp(rowCount?:number):ISelection[];
		selectDown(rowCount?:number):ISelection[];
		selectToTop():ISelection[];
		selectAll():ISelection[];
		selectToBottom():ISelection[];
		selectToBeginningOfLine():ISelection[];
		selectToFirstCharacterOfLine():ISelection[];
		selectToEndOfLine():ISelection[];
		selectToPreviousWordBoundary():ISelection[];
		selectToNextWordBoundary():ISelection[];
		selectLine():ISelection[];
		selectLinesContainingCursors():ISelection[];
		addSelectionBelow():ISelection[];
		addSelectionAbove():ISelection[];
		splitSelectionsIntoLines():any[];
		transpose():TextBuffer.IRange[];
		upperCase():boolean[];
		lowerCase():boolean[];
		joinLines():any[];
		selectToBeginningOfWord():ISelection[];
		selectToEndOfWord():ISelection[];
		selectToBeginningOfNextWord():ISelection[];
		selectWord():ISelection[];
		selectMarker(marker:any):any;
		mergeCursors():number[];
		expandSelectionsForward():any;
		expandSelectionsBackward(fn:(selection:ISelection)=>any):ISelection[];
		finalizeSelections():boolean[];
		mergeIntersectingSelections():any;
		preserveCursorPositionOnBufferReload():Emissary.ISubscription;
		getGrammar(): IGrammar;
		setGrammar(grammer:IGrammar):void;
		reloadGrammar():any;
		shouldAutoIndent():boolean;
		transact(fn:Function):any;
		beginTransaction():ITransaction;
		commitTransaction():any;
		abortTransaction():any[];
		inspect():string;
		logScreenLines(start:number, end:number):any[];
		handleGrammarChange():void;
		handleMarkerCreated(marker:any):any;
		getSelectionMarkerAttributes():{type: string; editorId: number; invalidate: string; };
		// joinLine():any; // deprecated

		onDidChange(callback: Function): Disposable;
        onDidDestroy(callback: Function): Disposable;
        onDidStopChanging(callback: Function): Disposable;
        onDidSave(callback: (event: { path: string }) => void): Disposable;

		screenPositionForPixelPosition: Function;
        pixelPositionForBufferPosition: Function;
		getHeight(): number;

		decorateMarker(marker: Marker, options: any): Decoration;
		getLastCursor(): ICursor;
	}

	interface IGrammar {
    	name: any;
		scopeName: string;
		// TBD
	}

	interface IPane /* extends Theorist.Model */ {
        itemForURI: (uri:string)=>IEditor;
		items:any[];
		activeItem:any;

		serializeParams():any;
		deserializeParams(params:any):any;
		getViewClass():any; // return type are PaneView
		isActive():boolean;
		isDestroyed():boolean;
		focus():void;
		blur():void;
		activate():void;
		getPanes():IPane[];
		getItems():any[];
		getActiveItem():any;
		getActiveEditor():any;
		itemAtIndex(index:number):any;
		activateNextItem():any;
		activatePreviousItem():any;
		getActiveItemIndex():number;
		activateItemAtIndex(index:number):any;
		activateItem(item:any):any;
		addItem(item:any, index:number):any;
		addItems(items:any[], index:number):any[];
		removeItem(item:any, destroying:any):void;
		moveItem(item:any, newIndex:number):void;
		moveItemToPane(item:any, pane:IPane, index:number):void;
		destroyActiveItem():boolean; // always return false
		destroyItem(item:any):boolean;
		destroyItems():any[];
		destroyInactiveItems():any[];
		destroy():void;
		destroyed():any[];
		promptToSaveItem(item:any):boolean;
		saveActiveItem():void;
		saveActiveItemAs():void;
		saveItem(item:any, nextAction:Function):void;
		saveItemAs(item:any, nextAction:Function):void;
		saveItems():any[];
		itemForUri(uri:any):any;
		activateItemForUri(uri:any):any;
		copyActiveItem():void;
		splitLeft(params:any):IPane;
		splitRight(params:any):IPane;
		splitUp(params:any):IPane;
		splitDown(params:any):IPane;
		split(orientation:string, side:string, params:any):IPane;
		findLeftmostSibling():IPane;
		findOrCreateRightmostSibling():IPane;
	}

// https://atom.io/docs/v0.84.0/advanced/serialization
	interface ISerializationStatic<T> {
		deserialize(data:ISerializationInfo):T;
		new (data:T): ISerialization;
	}

	interface ISerialization {
		serialize():ISerializationInfo;
	}

	interface ISerializationInfo {
		deserializer: string;
	}

	interface IBrowserWindow {
		getPosition():number[];
		getSize():number[];
	}

	interface IAtomWindowDimentions {
		x:number;
		y:number;
		width:number;
		height:number;
	}

	interface IProjectStatic {
		pathForRepositoryUrl(repoUrl:string):string;

		new (arg?:{path:any; buffers:any[];}):IProject;
	}

	interface IProject /* extends Theorist.Model */ {
		// Serializable.includeInto(Project);

		path:string;
		/** deprecated */
		rootDirectory?:PathWatcher.IDirectory;
		rootDirectories:PathWatcher.IDirectory[];

		serializeParams():any;
		deserializeParams(params:any):any;
		destroyed():any;
		destroyRepo():any;
		destroyUnretainedBuffers():any;
		getRepo():IGit;
		getPath():string;
		setPath(projectPath:string):any;
		getRootDirectory():PathWatcher.IDirectory;
		resolve(uri:string):string;
		relativize(fullPath:string):string;
		contains(pathToCheck:string):boolean;
		open(filePath:string, options?:any):Q.Promise<IEditor>;
		openSync(filePath:string, options?:any):IEditor;
		getBuffers():TextBuffer.ITextBuffer;
		isPathModified(filePath:string):boolean;
		findBufferForPath(filePath:string):TextBuffer.ITextBuffer;
		bufferForPathSync(filePath:string):TextBuffer.ITextBuffer;
		bufferForPath(filePath:string):Q.Promise<TextBuffer.ITextBuffer>;
		bufferForId(id:any):TextBuffer.ITextBuffer;
		buildBufferSync(absoluteFilePath:string):TextBuffer.ITextBuffer;
		buildBuffer(absoluteFilePath:string):Q.Promise<TextBuffer.ITextBuffer>;
		addBuffer(buffer:TextBuffer.ITextBuffer, options?:any):any;
		addBufferAtIndex(buffer:TextBuffer.ITextBuffer, index:number, options?:any):any;
		scan(regex:any, options:any, iterator:any):Q.Promise<any>;
		replace(regex:any, replacementText:any, filePaths:any, iterator:any):Q.Promise<any>;
		buildEditorForBuffer(buffer:any, editorOptions:any):IEditor;
		eachBuffer(...args:any[]):any;
	}

	interface IWorkspaceStatic {
		new():IWorkspace;
	}

	interface IWorkspacePanelOptions{
		item:any;
		visible?:boolean;
		priority?:number;
	}

	interface Panel{
		getItem():any;
		getPriority():any;
		isVisible():boolean;
		show();
		hide();
	}

	interface IWorkspace {
		addBottomPanel(options:IWorkspacePanelOptions):Panel;
		addLeftPanel(options:IWorkspacePanelOptions):Panel;
		addRightPanel(options:IWorkspacePanelOptions):Panel;
		addTopPanel(options:IWorkspacePanelOptions):Panel;
		addModalPanel(options:IWorkspacePanelOptions):Panel;
        addOpener(opener: Function): any;

		deserializeParams(params:any):any;
		serializeParams():{paneContainer:any;fullScreen:boolean;};
        eachEditor(callback: Function): void;
		getTextEditors():IEditor[];
		open(uri:string, options:any):Q.Promise<View>;
		openLicense():void;
		openSync(uri:string, options:any):any;
        openUriInPane(uri: string, pane: any, options: any): Q.Promise<View>;
        observeTextEditors(callback: Function): Disposable;
		reopenItemSync():any;
		registerOpener(opener:(urlToOpen:string)=>any):void;
		unregisterOpener(opener:Function):void;
		getOpeners():any;
		getActivePane(): IPane;
		getActivePaneItem(): IPane;
		getActiveTextEditor(): IEditor;
		getPanes():any;
		saveAll():void;
		activateNextPane():any;
		activatePreviousPane():any;
		paneForURI: (uri:string) => IPane;
		saveActivePaneItem():any;
		saveActivePaneItemAs():any;
		destroyActivePaneItem():any;
		destroyActivePane():any;
		increaseFontSize():void;
		decreaseFontSize():void;
		resetFontSize():void;
		itemOpened(item:any):void;
		onPaneItemDestroyed(item:any):void;
		destroyed():void;

		onDidChangeActivePaneItem(item:any):Disposable;
	}

	interface IAtomSettings {
		appVersion: string;
		bootstrapScript: string;
		devMode: boolean;
		initialPath: string;
		pathToOpen: string;
		resourcePath: string;
		shellLoadTime: number;
		windowState:string;
	}

	interface IAtomState {
		mode:string;
		packageStates:any;
		project:any;
		syntax:any;
		version:number;
		windowDimensions:any;
		workspace:any;
	}

	interface IDeserializerManager {
		deserializers:Function;
		add:Function;
		remove:Function;
		deserialize:Function;
		get:Function;
	}

	interface IConfig {
		get(keyPath:string):any;
		// TBD
	}

	interface IKeymapManager {
		defaultTarget:HTMLElement;
		// TBD
	}

	interface IPackageManager extends Emissary.IEmitter {
		packageDirPaths:string[];
		loadedPackages:any;
		activePackages:any;
		packageStates:any;
		packageActivators:any[];

		getApmPath():string;
		getPackageDirPaths():string;
		getPackageState(name:string):any;
		setPackageState(name:string, state:any):void;
		enablePackage(name:string):any;
		disablePackage(name:string):any;
		activate():void;
		registerPackageActivator(activator:any, types:any):void;
		activatePackages(packages:any):void;
		activatePackage(name:string):any;
		deactivatePackages():void;
		deactivatePackage(name:string):void;
		getActivePackages():any;
		getActivePackage(name:string):any;
		isPackageActive(name:string):boolean;
		unobserveDisabledPackages():void;
		observeDisabledPackages():void;
		loadPackages():void;
		loadPackage(nameOrPath:string):void;
		unloadPackages():void;
		unloadPackage(name:string):void;
		getLoadedPackage(name:string):any;
		isPackageLoaded(name:string):boolean;
		getLoadedPackages():any;
		getLoadedPackagesForTypes(types:any):any[];
		resolvePackagePath(name:string):string;
		isPackageDisabled(name:string):boolean;
		hasAtomEngine(packagePath:string):boolean;
		isBundledPackage(name:string):boolean;
		getPackageDependencies():any;
		getAvailablePackagePaths():any[];
		getAvailablePackageNames():any[];
		getAvailablePackageMetadata():any[];
	}

    interface INotifications {
        addInfo: Function;
        addError: Function;
        addSuccess: Function;
        addWarning: Function;
    }

	interface IThemeManager {
		// TBD
	}

	interface IContextMenuManager {
		// TBD
	}

	interface IMenuManager {
		// TBD
	}

	interface IClipboard {
		write(text:string, metadata?:any):any;
		read():string;
	}

	interface ISyntax {
		// TBD
	}

	interface IWindowEventHandler {
		// TBD
	}

	interface IAtomStatic extends ISerializationStatic<IAtom> {
		version: number;
		loadSettings: IAtomSettings;
		loadOrCreate(mode:string):IAtom;
		loadState(mode:any):void;
		getStatePath(mode:any):string;
		getConfigDirPath():string;
		getStorageDirPath():string;
		getLoadSettings():IAtomSettings;
		getCurrentWindow():IBrowserWindow;
		getVersion():string;
		isReleasedVersion():boolean;

		new(state:IAtomState):IAtom;
	}

	interface IAtom {
		constructor:IAtomStatic;

		state:IAtomState;
		mode:string;
		deserializers:IDeserializerManager;
        config: IConfig;
        commands: ICommandRegistry;
		keymaps: IKeymapManager;
		keymap: IKeymapManager;
		packages: IPackageManager;
		themes: IThemeManager;
		contextManu: IContextMenuManager;
		menu: IMenuManager;
		notifications: INotifications; // https://github.com/atom/notifications
		clipboard:IClipboard;
		syntax:ISyntax;
		views: IViewRegistry;
		windowEventHandler: IWindowEventHandler;

		// really exists? start
		subscribe:Function;
		unsubscribe:Function;
		loadTime:number;
		workspaceViewParentSelector:string;

		project: IProject;
		workspaceView: IWorkspaceView;
		workspace: IWorkspace;
		// really exists? end

		initialize:Function;
		// registerRepresentationClass:Function;
		// registerRepresentationClasses:Function;
		setBodyPlatformClass:Function;
		getCurrentWindow():IBrowserWindow;
		getWindowDimensions:Function;
		setWindowDimensions:Function;
		restoreWindowDimensions:Function;
		storeWindowDimensions:Function;
		getLoadSettings:Function;
		deserializeProject: Function;
		deserializeWorkspaceView:Function;
		deserializePackageStates:Function;
		deserializeEditorWindow:Function;
		startEditorWindow:Function;
		unloadEditorWindow:Function;
		loadThemes:Function;
		watchThemes:Function;
		open:Function;
		confirm:Function;
		showSaveDialog:Function;
		showSaveDialogSync:Function;
		openDevTools:Function;
		toggleDevTools:Function;
		executeJavaScriptInDevTools:Function;
		reload:Function;
		focus:Function;
		show:Function;
		hide:Function;
		setSize:Function;
		setPosition:Function;
		center:Function;
		displayWindow:Function;
		close:Function;
		exit:Function;
		inDevMode:Function;
		inSpecMode:Function;
		toggleFullScreen:Function;
		setFullScreen:Function;
		isFullScreen:Function;
		getVersion:Function;
		isReleasedVersion:Function;
		getGitHubAuthTokenName:Function;
		setGitHubAuthToken:Function;
		getGitHubAuthToken:Function;
		getConfigDirPath:Function;
		saveSync:Function;
		getWindowLoadTime():number;
		crashMainProcess:Function;
		crashRenderProcess:Function;
		beep:Function;
		getUserInitScriptPath:Function;
		requireUserInitScript:Function;
        requireWithGlobals: Function;

        services: any; // TODO: New services api
	}

	interface IBufferedNodeProcessStatic {
		new (arg:any):IBufferedNodeProcess;
	}

	interface IBufferedNodeProcess extends IBufferedProcess {
	}

	interface IBufferedProcessStatic {
		new (arg:any):IBufferedProcess;
	}

	interface IBufferedProcess {
		process:Function;
		killed:boolean;

		bufferStream:Function;
		kill:Function;
	}

	interface IGitStatic {
		new(path:any, options:any):IGit;
	}

	interface IGit {
	}

	interface ITokenizedBuffer {
		// TBD
	}

	interface ITokenizedLine {
		// TBD
	}

	interface IToken {
		// TBD
	}

	interface IFoldStatic {
		new (displayBuffer:IDisplayBuffer, marker:IMarker):IFold;
		// TBD
	}

	interface IFold {
		id:number;
		displayBuffer:IDisplayBuffer;
		marker:IMarker;

		// TBD
	}

	interface IDisplayBufferMarkerStatic {
		new (_arg:{bufferMarker:IMarker; displayBuffer: IDisplayBuffer}):IDisplayBufferMarker;
	}

	interface IDisplayBufferMarker extends Emissary.IEmitter, Emissary.ISubscriber {
		constructor:IDisplayBufferMarkerStatic;

		id: number;

		bufferMarkerSubscription:any;
		oldHeadBufferPosition:TextBuffer.IPoint;
		oldHeadScreenPosition:TextBuffer.IPoint;
		oldTailBufferPosition:TextBuffer.IPoint;
		oldTailScreenPosition:TextBuffer.IPoint;
		wasValid:boolean;

		bufferMarker: IMarker;
		displayBuffer: IDisplayBuffer;
		globalPauseCount:number;
		globalQueuedEvents:any;

		subscriptions:Emissary.ISubscription[];
		subscriptionsByObject:any; // WeakMap

		copy(attributes?:any /* maybe IMarker */):IDisplayBufferMarker;
		getScreenRange():TextBuffer.IRange;
		setScreenRange(screenRange:any, options:any):any;
		getBufferRange():TextBuffer.IRange;
		setBufferRange(bufferRange:any, options:any):any;
		getPixelRange():any;
		getHeadScreenPosition():TextBuffer.IPoint;
		setHeadScreenPosition(screenPosition:any, options:any):any;
		getHeadBufferPosition():TextBuffer.IPoint;
		setHeadBufferPosition(bufferPosition:any):any;
		getTailScreenPosition():TextBuffer.IPoint;
		setTailScreenPosition(screenPosition:any, options:any):any;
		getTailBufferPosition():TextBuffer.IPoint;
		setTailBufferPosition(bufferPosition:any):any;
		plantTail():boolean;
		clearTail():boolean;
		hasTail():boolean;
		isReversed():boolean;
		isValid():boolean;
		isDestroyed():boolean;
		getAttributes():any;
		setAttributes(attributes:any):any;
		matchesAttributes(attributes:any):any;
		destroy():any;
		isEqual(other:IDisplayBufferMarker):boolean;
		compare(other:IDisplayBufferMarker):boolean;
		inspect():string;
		destroyed():any;
		notifyObservers(_arg:any):any;
	}

	interface ITransaction {
		// TBD
	}

	interface IMarker extends Emissary.IEmitter {
		// Serializable.includeInto(Editor);
		// Delegator.includeInto(Editor);

		// TBD
	}

	interface ITaskStatic {
		new(taskPath:any):ITask;
	}

	interface ITask {
		// TBD
	}
}

declare var atom:AtomCore.IAtom;

declare module "atom" {
	import spacePen = require("space-pen");

	var $:typeof spacePen.$;
	var $$:typeof spacePen.$$;
	var $$$:typeof spacePen.$$$;

	var BufferedNodeProcess:AtomCore.IBufferedNodeProcessStatic;
	var BufferedProcess:AtomCore.IBufferedProcessStatic;
	var Git:AtomCore.IGitStatic;
	var Point:TextBuffer.IPointStatic;
	var Range:TextBuffer.IRangeStatic;

	class View extends spacePen.View implements Emissary.ISubscriber {
		// Subscriber.includeInto(spacePen.View);

		// inherit from Subscriber
		subscribeWith(eventEmitter:any, methodName:string, args:any):any;

		addSubscription(subscription:any):any;

		subscribe(eventEmitterOrSubscription:any, ...args:any[]):any;

		subscribeToCommand(eventEmitter:any, ...args:any[]):any;

		unsubscribe(object?:any):any;
	}

	class EditorView extends View {
		static characterWidthCache:any;
		static configDefaults:any;
		static nextEditorId:number;

		static content(params:any):void;

		static classes(_arg?:{mini?:any}):string;

		vScrollMargin:number;
		hScrollMargin:number;
		lineHeight:any;
		charWidth:any;
		charHeight:any;
		cursorViews:any[];
		selectionViews:any[];
		lineCache:any[];
		isFocused:any;
		editor:AtomCore.IEditor;
		attached:any;
		lineOverdraw:number;
		pendingChanges:any[];
		newCursors:any[];
		newSelections:any[];
		redrawOnReattach:any;
		bottomPaddingInLines:number;
		active:boolean;

		id:number;

		gutter:AtomCore.IGutterView;
		overlayer:JQuery;
		scrollView:JQuery;
		renderedLines:JQuery;
		underlayer:JQuery;
		hiddenInput:JQuery;
		verticalScrollbar:JQuery;
		verticalScrollbarContent:JQuery;

		constructor(editor:AtomCore.IEditor);

		initialize(editorOrOptions:AtomCore.IEditor):void; // return type are same as editor method.
		initialize(editorOrOptions?:{editor: AtomCore.IEditor; mini:any; placeholderText:any}):void;

		initialize(editorOrOptions:{}):void; // compatible for spacePen.View

		bindKeys():void;

		getEditor():AtomCore.IEditor;

		getText():string;

		setText(text:string):void;

		insertText(text:string, options?:any):TextBuffer.IRange[];

		setHeightInLines(heightInLines:number):number;

		setWidthInChars(widthInChars:number):number;

		pageDown():void;

		pageUp():void;

		getPageRows():number;

		setShowInvisibles(showInvisibles:boolean):void;

		setInvisibles(invisibles:{ eol:string; space: string; tab: string; cr: string; }):void;

		setShowIndentGuide(showIndentGuide:boolean):void;

		setPlaceholderText(placeholderText:string):void;

		getPlaceholderText():string;

		checkoutHead():boolean;

		configure():Emissary.ISubscription;

		handleEvents():void;

		handleInputEvents():void;

		bringHiddenInputIntoView():JQuery;

		selectOnMousemoveUntilMouseup():any;

		afterAttach(onDom:any):any;

		edit(editor:AtomCore.IEditor):any;

		getModel():AtomCore.IEditor;

		setModel(editor:AtomCore.IEditor):any;

		showBufferConflictAlert(editor:AtomCore.IEditor):any;

		scrollTop(scrollTop:number, options?:any):any;

		scrollBottom(scrollBottom?:number):any;

		scrollLeft(scrollLeft?:number):number;

		scrollRight(scrollRight?:number):any;

		scrollToBottom():any;

		scrollToCursorPosition():any;

		scrollToBufferPosition(bufferPosition:any, options:any):any;

		scrollToScreenPosition(screenPosition:any, options:any):any;

		scrollToPixelPosition(pixelPosition:any, options:any):any;

		highlightFoldsContainingBufferRange(bufferRange:any):any;

		saveScrollPositionForEditor():any;

		toggleSoftTabs():any;

		toggleSoftWrap():any;

		calculateWidthInChars():number;

		calculateHeightInLines():number;

		getScrollbarWidth():number;

		setSoftWrap(softWrap:boolean):any;

		setFontSize(fontSize:number):any;

		getFontSize():number;

		setFontFamily(fontFamily?:string):any;

		getFontFamily():string;

		setLineHeight(lineHeight:number):any;

		redraw():any;

		splitLeft():any;

		splitRight():any;

		splitUp():any;

		splitDown():any;

		getPane():any; // return type are PaneView

		remove(selector:any, keepData:any):any;

		beforeRemove():any;

		getCursorView(index?:number):any; // return type are CursorView

		getCursorViews():any[]; // return type are CursorView[]

		addCursorView(cursor:any, options:any):any; // return type are CursorView

		removeCursorView(cursorView:any):any;

		getSelectionView(index?:number):any; // return type are SelectionView

		getSelectionViews():any[]; // return type are SelectionView[]

		addSelectionView(selection:any):any;

		removeSelectionView(selectionView:any):any;

		removeAllCursorAndSelectionViews():any[];

		appendToLinesView(view:any):any;

		scrollVertically(pixelPosition:any, _arg:any):any;

		scrollHorizontally(pixelPosition:any):any;

		calculateDimensions():number;

		recalculateDimensions():any;

		updateLayerDimensions():any;

		isHidden():boolean;

		clearRenderedLines():void;

		resetDisplay():any;

		requestDisplayUpdate():any;

		updateDisplay(options?:any):any;

		updateCursorViews():any;

		shouldUpdateCursor(cursorView:any):any;

		updateSelectionViews():any[];

		shouldUpdateSelection(selectionView:any):any;

		syncCursorAnimations():any[];

		autoscroll(suppressAutoscroll?:any):any[];

		updatePlaceholderText():any;

		updateRenderedLines(scrollViewWidth:any):any;

		computeSurroundingEmptyLineChanges(change:any):any;

		computeIntactRanges(renderFrom:any, renderTo:any):any;

		truncateIntactRanges(intactRanges:any, renderFrom:any, renderTo:any):any;

		clearDirtyRanges(intactRanges:any):any;

		clearLine(lineElement:any):any;

		fillDirtyRanges(intactRanges:any, renderFrom:any, renderTo:any):any;

		updatePaddingOfRenderedLines():any;

		getFirstVisibleScreenRow():number;

		getLastVisibleScreenRow():number;

		isScreenRowVisible():boolean;

		handleScreenLinesChange(change:any):any;

		buildLineElementForScreenRow(screenRow:any):any;

		buildLineElementsForScreenRows(startRow:any, endRow:any):any;

		htmlForScreenRows(startRow:any, endRow:any):any;

		htmlForScreenLine(screenLine:any, screenRow:any):any;

		buildIndentation(screenRow:any, editor:any):any;

		buildHtmlEndOfLineInvisibles(screenLine:any):any;

		getEndOfLineInvisibles(screenLine:any):any;

		lineElementForScreenRow(screenRow:any):any;

		toggleLineCommentsInSelection():any;

		pixelPositionForBufferPosition(position:any):any;

		pixelPositionForScreenPosition(position:any):any;

		positionLeftForLineAndColumn(lineElement:any, screenRow:any, screenColumn:any):any;

		measureToColumn(lineElement:any, tokenizedLine:any, screenColumn:any):any;

		getCharacterWidthCache(scopes:any, char:any):any;

		setCharacterWidthCache(scopes:any, char:any, val:any):any;

		clearCharacterWidthCache():any;

		pixelOffsetForScreenPosition(position:any):any;

		screenPositionFromMouseEvent(e:any):any;

		highlightCursorLine():any;

		copyPathToClipboard():any;

		buildLineHtml(_arg:any):any;

		updateScopeStack(line:any, scopeStack:any, desiredScopes:any):any;

		pushScope(line:any, scopeStack:any, scope:any):any;

		popScope(line:any, scopeStack:any):any;

		buildEmptyLineHtml(showIndentGuide:any, eolInvisibles:any, htmlEolInvisibles:any, indentation:any, editor:any, mini:any):any;

		replaceSelectedText(replaceFn:(str:string)=>string):any;

		consolidateSelections(e:any):any;

		logCursorScope():any;

		logScreenLines(start:any, end:any):any;

		logRenderedLines():any;
	}

	class ScrollView extends View {
		// TBD
	}

	interface ISelectListItem {
		/** e.g. application:about */
		eventName:string;
		/** e.g. Application: About */
		eventDescription:string;
	}

	class SelectListView extends View {
		static content():any;

		maxItems:number;
		scheduleTimeout:any;
		inputThrottle:number;
		cancelling:boolean;
		items:any[];
		list:JQuery;
        filterEditorView: JQuery;

		previouslyFocusedElement:JQuery;

		initialize():any;

		schedulePopulateList():number;

		setItems(items:any[]):any;

		setError(message?:string):any;

		setLoading(message?:string):any;

		getFilterQuery():string;

		populateList():any;

		getEmptyMessage(itemCount?:any, filteredItemCount?:any):string;

		setMaxItems(maxItems:number):void;

		selectPreviousItemView():any;

		selectNextItemView():any;

		selectItemView(view:any):any;

		scrollToItemView(view:any):any;

		getSelectedItemView():any;

		getSelectedItem():any;

		confirmSelection():any;

		viewForItem(item:any):JQuery|string|HTMLElement|View; // You must override this method!
		confirmed(item:any):any; // You must override this method!
		getFilterKey():any;

		focusFilterEditor():any;

		storeFocusedElement():any;

		restoreFocus():any;

		cancelled():any;

		cancel():any;
	}

	var WorkspaceView:AtomCore.IWorkspaceViewStatic;

	var Task:AtomCore.ITaskStatic;
	var Workspace:AtomCore.IWorkspaceStatic;
}
declare module "glob-expand" {
    var foo;
    export = foo;
}
// Type definitions for mkdirp 0.3.0
// Project: http://github.com/substack/node-mkdirp
// Definitions by: Bart van der Schoor <https://github.com/Bartvds>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare module 'mkdirp' {

	function mkdirp(dir: string, cb: (err: any, made: string) => void): void;
	function mkdirp(dir: string, flags: any, cb: (err: any, made: string) => void): void;

	module mkdirp {
		function sync(dir: string, flags?: any): string;
	}
	export = mkdirp;
}
// Type definitions for d3JS
// Project: http://d3js.org/
// Definitions by: Boris Yankov <https://github.com/borisyankov>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare module D3 {
    export interface Selectors {
        /**
        * Select an element from the current document
        */
        select: {
            /**
            * Returns the empty selection
            */
            (): _Selection<any>;
            /**
            * Selects the first element that matches the specified selector string
            *
            * @param selector Selection String to match
            */
            (selector: string): _Selection<any>;
            /**
            * Selects the specified node
            *
            * @param element Node element to select
            */
            (element: EventTarget): _Selection<any>;
        };

        /**
        * Select multiple elements from the current document
        */
        selectAll: {
            /**
            * Selects all elements that match the specified selector
            *
            * @param selector Selection String to match
            */
            (selector: string): _Selection<any>;
            /**
            * Selects the specified array of elements
            *
            * @param elements Array of node elements to select
            */
            (elements: EventTarget[]): _Selection<any>;
        };
    }

    export interface D3Event extends Event{
        dx: number;
        dy: number;
        clientX: number;
        clientY: number;
        translate: number[];
        scale: number;
        sourceEvent: D3Event;
        x: number;
        y: number;
        keyCode: number;
        altKey: any;
        type: string;
    }

    export interface Base extends Selectors {
        /**
        * Create a behavior
        */
        behavior: Behavior.Behavior;
        /**
        * Access the current user event for interaction
        */
        event: D3Event;

        /**
        * Compare two values for sorting.
        * Returns -1 if a is less than b, or 1 if a is greater than b, or 0
        *
        * @param a First value
        * @param b Second value
        */
        ascending<T>(a: T, b: T): number;
        /**
        * Compare two values for sorting.
        * Returns -1 if a is greater than b, or 1 if a is less than b, or 0
        *
        * @param a First value
        * @param b Second value
        */
        descending<T>(a: T, b: T): number;
        /**
        * Find the minimum value in an array
        *
        * @param arr Array to search
        * @param map Accsessor function
        */
        min<T, U>(arr: T[], map: (v?: T, i?: number) => U): U;
        /**
        * Find the minimum value in an array
        *
        * @param arr Array to search
        */
        min<T>(arr: T[]): T;
        /**
        * Find the maximum value in an array
        *
        * @param arr Array to search
        * @param map Accsessor function
        */
        max<T, U>(arr: T[], map: (v?: T, i?: number) => U): U;
        /**
        * Find the maximum value in an array
        *
        * @param arr Array to search
        */
        max<T>(arr: T[]): T;
        /**
        * Find the minimum and maximum value in an array
        *
        * @param arr Array to search
        * @param map Accsessor function
        */
        extent<T, U>(arr: T[], map: (v: T) => U): U[];
        /**
        * Find the minimum and maximum value in an array
        *
        * @param arr Array to search
        */
        extent<T>(arr: T[]): T[];
        /**
        * Compute the sum of an array of numbers
        *
        * @param arr Array to search
        * @param map Accsessor function
        */
        sum<T>(arr: T[], map: (v: T) => number): number;
        /**
        * Compute the sum of an array of numbers
        *
        * @param arr Array to search
        */
        sum(arr: number[]): number;
        /**
        * Compute the arithmetic mean of an array of numbers
        *
        * @param arr Array to search
        * @param map Accsessor function
        */
        mean<T>(arr: T[], map: (v: T) => number): number;
        /**
        * Compute the arithmetic mean of an array of numbers
        *
        * @param arr Array to search
        */
        mean(arr: number[]): number;
        /**
        * Compute the median of an array of numbers (the 0.5-quantile).
        *
        * @param arr Array to search
        * @param map Accsessor function
        */
        median<T>(arr: T[], map: (v: T) => number): number;
        /**
        * Compute the median of an array of numbers (the 0.5-quantile).
        *
        * @param arr Array to search
        */
        median(arr: number[]): number;
        /**
        * Compute a quantile for a sorted array of numbers.
        *
        * @param arr Array to search
        * @param p The quantile to return
        */
        quantile: (arr: number[], p: number) => number;
        /**
        * Locate the insertion point for x in array to maintain sorted order
        *
        * @param arr Array to search
        * @param x Value to search for insertion point
        * @param low Minimum value of array subset
        * @param hihg Maximum value of array subset
        */
        bisect<T>(arr: T[], x: T, low?: number, high?: number): number;
        /**
        * Locate the insertion point for x in array to maintain sorted order
        *
        * @param arr Array to search
        * @param x Value to serch for insertion point
        * @param low Minimum value of array subset
        * @param high Maximum value of array subset
        */
        bisectLeft<T>(arr: T[], x: T, low?: number, high?: number): number;
        /**
        * Locate the insertion point for x in array to maintain sorted order
        *
        * @param arr Array to search
        * @param x Value to serch for insertion point
        * @param low Minimum value of array subset
        * @param high Maximum value of array subset
        */
        bisectRight<T>(arr: T[], x: T, low?: number, high?: number): number;
        /**
        * Bisect using an accessor.
        *
        * @param accessor Accessor function
        */
        bisector(accessor: (data: any, index: number) => any): any;
        /**
        * Randomize the order of an array.
        *
        * @param arr Array to randomize
        */
        shuffle<T>(arr: T[]): T[];
        /**
        * Reorder an array of elements according to an array of indexes
        *
        * @param arr Array to reorder
        * @param indexes Array containing the order the elements should be returned in
        */
        permute(arr: any[], indexes: any[]): any[];
        /**
        * Transpose a variable number of arrays.
        *
        * @param arrs Arrays to transpose
        */
        zip(...arrs: any[]): any[];
        /**
        * Parse the given 2D affine transform string, as defined by SVG's transform attribute.
        *
        * @param definition 2D affine transform string
        */
        transform(definition: string): any;
        /**
        * Transpose an array of arrays.
        *
        * @param matrix Two dimensional array to transpose
        */
        transpose(matrix: any[]): any[];
        /**
        * Creates an array containing tuples of adjacent pairs
        *
        * @param arr An array containing entries to pair
        * @returns any[][] An array of 2-element tuples for each pair
        */
        pairs(arr: any[]): any[][];
        /**
        * List the keys of an associative array.
        *
        * @param map Array of objects to get the key values from
        */
        keys(map: any): string[];
        /**
        * List the values of an associative array.
        *
        * @param map Array of objects to get the values from
        */
        values(map: any): any[];
        /**
        * List the key-value entries of an associative array.
        *
        * @param map Array of objects to get the key-value pairs from
        */
        entries(map: any): any[];
        /**
        * merge multiple arrays into one array
        *
        * @param map Arrays to merge
        */
        merge(...map: any[]): any[];
        /**
        * Generate a range of numeric values.
        */
        range: {
            /**
            * Generate a range of numeric values from 0.
            *
            * @param stop Value to generate the range to
            * @param step Step between each value
            */
            (stop: number, step?: number): number[];
            /**
            * Generate a range of numeric values.
            *
            * @param start Value to start
            * @param stop Value to generate the range to
            * @param step Step between each value
            */
            (start: number, stop?: number, step?: number): number[];
        };
        /**
        * Create new nest operator
        */
        nest(): Nest;
        /**
        * Request a resource using XMLHttpRequest.
        */
        xhr: {
            /**
            * Creates an asynchronous request for specified url
            *
            * @param url Url to request
            * @param callback Function to invoke when resource is loaded or the request fails
            */
            (url: string, callback?: (xhr: XMLHttpRequest) => void ): Xhr;
            /**
            * Creates an asynchronous request for specified url
            *
            * @param url Url to request
            * @param mime MIME type to request
            * @param callback Function to invoke when resource is loaded or the request fails
            */
            (url: string, mime: string, callback?: (xhr: XMLHttpRequest) => void ): Xhr;
        };
        /**
        * Request a text file
        */
        text: {
            /**
            * Request a text file
            *
            * @param url Url to request
            * @param callback Function to invoke when resource is loaded or the request fails
            */
            (url: string, callback?: (response: string) => void ): Xhr;
            /**
            * Request a text file
            *
            * @param url Url to request
            * @param mime MIME type to request
            * @param callback Function to invoke when resource is loaded or the request fails
            */
            (url: string, mime: string, callback?: (response: string) => void ): Xhr;
        };
        /**
        * Request a JSON blob
        *
        * @param url Url to request
        * @param callback Function to invoke when resource is loaded or the request fails
        */
        json: (url: string, callback?: (error: any, data: any) => void ) => Xhr;
        /**
        * Request an HTML document fragment.
        */
        xml: {
            /**
            * Request an HTML document fragment.
            *
            * @param url Url to request
            * @param callback Function to invoke when resource is loaded or the request fails
            */
            (url: string, callback?: (response: Document) => void ): Xhr;
            /**
            * Request an HTML document fragment.
            *
            * @param url Url to request
            * @param mime MIME type to request
            * @param callback Function to invoke when resource is loaded or the request fails
            */
            (url: string, mime: string, callback?: (response: Document) => void ): Xhr;
        };
        /**
        * Request an XML document fragment.
        *
        * @param url Url to request
        * @param callback Function to invoke when resource is loaded or the request fails
        */
        html: (url: string, callback?: (response: DocumentFragment) => void ) => Xhr;
        /**
        * Request a comma-separated values (CSV) file.
        */
        csv: Dsv;
        /**
        * Request a tab-separated values (TSV) file
        */
        tsv: Dsv;
        /**
        * Time Functions
        */
        time: Time.Time;
        /**
        * Scales
        */
        scale: Scale.ScaleBase;
        /*
        * Interpolate two values
        */
        interpolate: Transition.BaseInterpolate;
        /*
        * Interpolate two numbers
        */
        interpolateNumber: Transition.BaseInterpolate;
        /*
        * Interpolate two integers
        */
        interpolateRound: Transition.BaseInterpolate;
        /*
        * Interpolate two strings
        */
        interpolateString: Transition.BaseInterpolate;
        /*
        * Interpolate two RGB colors
        */
        interpolateRgb: Transition.BaseInterpolate;
        /*
        * Interpolate two HSL colors
        */
        interpolateHsl: Transition.BaseInterpolate;
        /*
        * Interpolate two HCL colors
        */
        interpolateHcl: Transition.BaseInterpolate;
        /*
        * Interpolate two L*a*b* colors
        */
        interpolateLab: Transition.BaseInterpolate;
        /*
        * Interpolate two arrays of values
        */
        interpolateArray: Transition.BaseInterpolate;
        /*
        * Interpolate two arbitary objects
        */
        interpolateObject: Transition.BaseInterpolate;
        /*
        * Interpolate two 2D matrix transforms
        */
        interpolateTransform: Transition.BaseInterpolate;
        /*
        * The array of built-in interpolator factories
        */
        interpolators: Transition.InterpolateFactory[];
        /**
        * Layouts
        */
        layout: Layout.Layout;
        /**
        * Svg's
        */
        svg: Svg.Svg;
        /**
        * Random number generators
        */
        random: Random;
        /**
        * Create a function to format a number as a string
        *
        * @param specifier The format specifier to use
        */
        format(specifier: string): (value: number) => string;
        /**
        * Returns the SI prefix for the specified value at the specified precision
        */
        formatPrefix(value: number, precision?: number): MetricPrefix;
        /**
        * The version of the d3 library
        */
        version: string;
        /**
        * Returns the root selection
        */
        selection(): _Selection<any>;
        ns: {
            /**
            * The map of registered namespace prefixes
            */
            prefix: {
                svg: string;
                xhtml: string;
                xlink: string;
                xml: string;
                xmlns: string;
            };
            /**
            * Qualifies the specified name
            */
            qualify(name: string): { space: string; local: string; };
        };
        /**
        * Returns a built-in easing function of the specified type
        */
        ease: (type: string, ...arrs: any[]) => D3.Transition.Transition;
        /**
        * Constructs a new RGB color.
        */
        rgb: {
            /**
            * Constructs a new RGB color with the specified r, g and b channel values
            */
            (r: number, g: number, b: number): D3.Color.RGBColor;
            /**
            * Constructs a new RGB color by parsing the specified color string
            */
            (color: string): D3.Color.RGBColor;
        };
        /**
        * Constructs a new HCL color.
        */
        hcl: {
            /**
            * Constructs a new HCL color.
            */
            (h: number, c: number, l: number): Color.HCLColor;
            /**
            * Constructs a new HCL color by parsing the specified color string
            */
            (color: string): Color.HCLColor;
        };
        /**
        * Constructs a new HSL color.
        */
        hsl: {
            /**
            * Constructs a new HSL color with the specified hue h, saturation s and lightness l
            */
            (h: number, s: number, l: number): Color.HSLColor;
            /**
            * Constructs a new HSL color by parsing the specified color string
            */
            (color: string): Color.HSLColor;
        };
        /**
        * Constructs a new RGB color.
        */
        lab: {
            /**
            * Constructs a new LAB color.
            */
            (l: number, a: number, b: number): Color.LABColor;
            /**
            * Constructs a new LAB color by parsing the specified color string
            */
            (color: string): Color.LABColor;
        };
        geo: Geo.Geo;
        geom: Geom.Geom;
        /**
        * gets the mouse position relative to a specified container.
        */
        mouse(container: any): number[];
        /**
        * gets the touch positions relative to a specified container.
        */
        touches(container: any): number[][];

        /**
        * If the specified value is a function, returns the specified value.
        * Otherwise, returns a function that returns the specified value.
        */
        functor<R,T>(value: (p : R) => T): (p : R) => T;
        functor<T>(value: T): (p : any) => T;

        map: {
            (): Map<any>;
            <T>(object: {[key: string]: T; }): Map<T>;
            <T>(map: Map<T>): Map<T>;
            <T>(array: T[]): Map<T>;
            <T>(array: T[], keyFn: (object: T, index?: number) => string): Map<T>;
        };
        set: {
            (): Set<any>;
            <T>(array: T[]): Set<T>;
        };
        dispatch(...types: string[]): Dispatch;
        rebind(target: any, source: any, ...names: any[]): any;
        requote(str: string): string;
        timer: {
            (funct: () => boolean, delay?: number, mark?: number): void;
            flush(): void;
        }
        transition(): Transition.Transition;

        round(x: number, n: number): number;
    }

    export interface Dispatch {
        [event: string]: any;
        on: {
            (type: string): any;
            (type: string, listener: any): any;
        }
    }

    export interface MetricPrefix {
        /**
        * the scale function, for converting numbers to the appropriate prefixed scale.
        */
        scale: (d: number) => number;
        /**
        * the prefix symbol
        */
        symbol: string;
    }

    export interface Xhr {
        /**
        * Get or set request header
        */
        header: {
            /**
            * Get the value of specified request header
            *
            * @param name Name of header to get the value for
            */
            (name: string): string;
            /**
            * Set the value of specified request header
            *
            * @param name Name of header to set the value for
            * @param value Value to set the header to
            */
            (name: string, value: string): Xhr;
        };
        /**
        * Get or set MIME Type
        */
        mimeType: {
            /**
            * Get the current MIME Type
            */
            (): string;
            /**
            * Set the MIME Type for the request
            *
            * @param type The MIME type for the request
            */
            (type: string): Xhr;
        };
        /*
        * Get or Set the function used to map the response to the associated data value
        */
        response: {
            /**
            * Get function used to map the response to the associated data value
            */
            (): (xhr: XMLHttpRequest) => any;
            /**
            * Set function used to map the response to the associated data value
            *
            * @param value The function used to map the response to a data value
            */
            (value: (xhr: XMLHttpRequest) => any): Xhr;
        };
        /**
        * Issue the request using the GET method
        *
        * @param callback Function to invoke on completion of request
        */
        get(callback?: (xhr: XMLHttpRequest) => void ): Xhr;
        /**
        * Issue the request using the POST method
        */
        post: {
            /**
            * Issue the request using the POST method
            *
            * @param callback Function to invoke on completion of request
            */
            (callback?: (xhr: XMLHttpRequest) => void ): Xhr;
            /**
            * Issue the request using the POST method
            *
            * @param data Data to post back in the request
            * @param callback Function to invoke on completion of request
            */
            (data: any, callback?: (xhr: XMLHttpRequest) => void ): Xhr;
        };
        /**
        * Issues this request using the specified method
        */
        send: {
            /**
            * Issues this request using the specified method
            *
            * @param method Method to use to make the request
            * @param callback Function to invoke on completion of request
            */
            (method: string, callback?: (xhr: XMLHttpRequest) => void ): Xhr;
            /**
            * Issues this request using the specified method
            *
            * @param method Method to use to make the request
            * @param data Data to post back in the request
            * @param callback Function to invoke on completion of request
            */
            (method: string, data: any, callback?: (xhr: XMLHttpRequest) => void ): Xhr;
        };
        /**
        * Aborts this request, if it is currently in-flight
        */
        abort(): Xhr;
        /**
        * Registers a listener to receive events
        *
        * @param type Enent name to attach the listener to
        * @param listener Function to attach to event
        */
        on: (type: string, listener: (data: any, index?: number) => any) => Xhr;
    }

    export interface Dsv {
        /**
        * Request a delimited values file
        *
        * @param url Url to request
        * @param callback Function to invoke when resource is loaded or the request fails
        */
        (url: string, callback?: (error: any, response: any[]) => void ): Xhr;
        /**
        * Parse a delimited string into objects using the header row.
        *
        * @param string delimited formatted string to parse
        * @param accessor to modify properties of each row
        */
        parse(string: string, accessor?: (row: any, index?: number) => any): any[];
        /**
        * Parse a delimited string into tuples, ignoring the header row.
        *
        * @param string delimited formatted string to parse
        */
        parseRows(string: string, accessor: (row: any[], index: number) => any): any;
        /**
        * Format an array of tuples into a delimited string.
        *
        * @param rows Array to convert to a delimited string
        */
        format(rows: any[]): string;
    }

    export interface _Selection<T> extends Selectors, Array<any> {
        attr: {
            (name: string): string;
            (name: string, value: any): _Selection<T>;
            (name: string, valueFunction: (data: T, index: number) => any): _Selection<T>;
            (attrValueMap: Object): _Selection<T>;
        };

        classed: {
            (name: string): boolean;
            (name: string, value: any): _Selection<T>;
            (name: string, valueFunction: (data: T, index: number) => any): _Selection<T>;
            (classValueMap: Object): _Selection<T>;
        };

        style: {
            (name: string): string;
            (name: string, value: any, priority?: string): _Selection<T>;
            (name: string, valueFunction: (data: T, index: number) => any, priority?: string): _Selection<T>;
            (styleValueMap: Object): _Selection<T>;
        };

        property: {
            (name: string): void;
            (name: string, value: any): _Selection<T>;
            (name: string, valueFunction: (data: T, index: number) => any): _Selection<T>;
            (propertyValueMap: Object): _Selection<T>;
        };

        text: {
            (): string;
            (value: any): _Selection<T>;
            (valueFunction: (data: T, index: number) => any): _Selection<T>;
        };

        html: {
            (): string;
            (value: any): _Selection<T>;
            (valueFunction: (data: T, index: number) => any): _Selection<T>;
        };

        append: (name: string) => _Selection<T>;
        insert: (name: string, before: string) => _Selection<T>;
        remove: () => _Selection<T>;
        empty: () => boolean;

        data: {
            <U>(values: (data: T, index?: number) => U[], key?: (data: U, index?: number) => any): _UpdateSelection<U>;
            <U>(values: U[], key?: (data: U, index?: number) => any): _UpdateSelection<U>;
            (): T[];
        };

        datum: {
            /**
             * Sets the element's bound data to the return value of the specified function evaluated
             * for each selected element.
             * Unlike the D3.Selection.data method, this method does not compute a join (and thus
             * does not compute enter and exit selections).
             * @param values The function to be evaluated for each selected element, being passed the
             * previous datum d and the current index i, with the this context as the current DOM
             * element. The function is then used to set each element's data. A null value will
             * delete the bound data. This operator has no effect on the index.
             */
            <U>(values: (data: U, index: number) => any): _UpdateSelection<U>;
            /**
             * Sets the element's bound data to the specified value on all selected elements.
             * Unlike the D3.Selection.data method, this method does not compute a join (and thus
             * does not compute enter and exit selections).
             * @param values The same data to be given to all elements.
             */
            <U>(values: U): _UpdateSelection<U>;
            /**
             * Returns the bound datum for the first non-null element in the selection.
             * This is generally useful only if you know the selection contains exactly one element.
             */
            (): T;
        };

        filter: {
            (filter: (data: T, index: number) => boolean, thisArg?: any): _UpdateSelection<T>;
            (filter: string): _UpdateSelection<T>;
        };

        call(callback: (selection: _Selection<T>, ...args: any[]) => void, ...args: any[]): _Selection<T>;
        each(eachFunction: (data: T, index: number) => any): _Selection<T>;
        on: {
            (type: string): (data: any, index: number) => any;
            (type: string, listener: (data: any, index: number) => any, capture?: boolean): _Selection<T>;
        };

        /**
        * Returns the total number of elements in the current selection.
        */
        size(): number;

        /**
        * Starts a transition for the current selection. Transitions behave much like selections,
        * except operators animate smoothly over time rather than applying instantaneously.
        */
        transition(): Transition.Transition;

        /**
        * Sorts the elements in the current selection according to the specified comparator
        * function.
        *
        * @param comparator a comparison function, which will be passed two data elements a and b
        * to compare, and should return either a negative, positive, or zero value to indicate
        * their relative order.
        */
        sort(comparator?: (a: T, b: T) => number): _Selection<T>;

        /**
        * Re-inserts elements into the document such that the document order matches the selection
        * order. This is equivalent to calling sort() if the data is already sorted, but much
        * faster.
        */
        order: () => _Selection<T>;

        /**
        * Returns the first non-null element in the current selection. If the selection is empty,
        * returns null.
        */
        node: <E extends Element>() => E;
    }

    export interface Selection extends _Selection<any> { }

    export interface _EnterSelection<T> {
        append: (name: string) => _Selection<T>;
        insert: (name: string, before?: string) => _Selection<T>;
        select: (selector: string) => _Selection<T>;
        empty: () => boolean;
        node: () => Element;
        call: (callback: (selection: _EnterSelection<T>) => void) => _EnterSelection<T>;
        size: () => number;
    }

    export interface EnterSelection extends _EnterSelection<any> { }

    export interface _UpdateSelection<T> extends _Selection<T> {
        enter: () => _EnterSelection<T>;
        update: () => _Selection<T>;
        exit: () => _Selection<T>;
    }

    export interface UpdateSelection extends _UpdateSelection<any> { }

    export interface NestKeyValue {
        key: string;
        values: any;
    }

    export interface Nest {
        key(keyFunction: (data: any, index: number) => string): Nest;
        sortKeys(comparator: (d1: any, d2: any) => number): Nest;
        sortValues(comparator: (d1: any, d2: any) => number): Nest;
        rollup(rollupFunction: (data: any, index: number) => any): Nest;
        map(values: any[], mapType?: any): any;
        entries(values: any[]): NestKeyValue[];
    }

    export interface MapKeyValue<T> {
        key: string;
        value: T;
    }

    export interface Map<T> {
        has(key: string): boolean;
        get(key: string): T;
        set(key: string, value: T): T;
        remove(key: string): boolean;
        keys(): string[];
        values(): T[];
        entries(): MapKeyValue<T>[];
        forEach(func: (key: string, value: T) => void ): void;
        empty(): boolean;
        size(): number;
    }

    export interface Set<T> {
        has(value: T): boolean;
        add(value: T): T;
        remove(value: T): boolean;
        values(): string[];
        forEach(func: (value: string) => void ): void;
        empty(): boolean;
        size(): number;
    }

    export interface Random {
        /**
        * Returns a function for generating random numbers with a normal distribution
        *
        * @param mean The expected value of the generated pseudorandom numbers
        * @param deviation The given standard deviation
        */
        normal(mean?: number, deviation?: number): () => number;
        /**
        * Returns a function for generating random numbers with a log-normal distribution
        *
        * @param mean The expected value of the generated pseudorandom numbers
        * @param deviation The given standard deviation
        */
        logNormal(mean?: number, deviation?: number): () => number;
        /**
        * Returns a function for generating random numbers with an Irwin-Hall distribution
        *
        * @param count The number of independent variables
        */
        irwinHall(count: number): () => number;
    }

    // Transitions
    export module Transition {
        export interface Transition {
            duration: {
                (duration: number): Transition;
                (duration: (data: any, index: number) => any): Transition;
            };
            delay: {
                (delay: number): Transition;
                (delay: (data: any, index: number) => any): Transition;
            };
            attr: {
                (name: string): string;
                (name: string, value: any): Transition;
                (name: string, valueFunction: (data: any, index: number) => any): Transition;
                (attrValueMap : any): Transition;
            };
            style: {
                (name: string): string;
                (name: string, value: any, priority?: string): Transition;
                (name: string, valueFunction: (data: any, index: number) => any, priority?: string): Transition;
            };
            call(callback: (transition: Transition, ...args: any[]) => void, ...args: any[]): Transition;
            /**
            * Select an element from the current document
            */
            select: {
                /**
                * Selects the first element that matches the specified selector string
                *
                * @param selector Selection String to match
                */
                (selector: string): Transition;
                /**
                * Selects the specified node
                *
                * @param element Node element to select
                */
                (element: EventTarget): Transition;
            };

            /**
            * Select multiple elements from the current document
            */
            selectAll: {
                /**
                * Selects all elements that match the specified selector
                *
                * @param selector Selection String to match
                */
                (selector: string): Transition;
                /**
                * Selects the specified array of elements
                *
                * @param elements Array of node elements to select
                */
                (elements: EventTarget[]): Transition;
            }
            each: {
                /**
                 * Immediately invokes the specified function for each element in the current
                 * transition, passing in the current datum and index, with the this context
                 * of the current DOM element. Similar to D3.Selection.each.
                 *
                 * @param eachFunction The function to be invoked for each element in the
                 * current transition, passing in the current datum and index, with the this
                 * context of the current DOM element.
                 */
                (eachFunction: (data: any, index: number) => any): Transition;
                /**
                 * Adds a listener for transition events, supporting "start", "end" and
                 * "interrupt" events. The listener will be invoked for each individual
                 * element in the transition.
                 *
                 * @param type Type of transition event. Supported values are "start", "end"
                 * and "interrupt".
                 * @param listener The listener to be invoked for each individual element in
                 * the transition.
                 */
                (type: string, listener: (data: any, index: number) => any): Transition;
            }
            transition: () => Transition;
            ease: (value: string, ...arrs: any[]) => Transition;
            attrTween(name: string, tween: (d: any, i: number, a: any) => BaseInterpolate): Transition;
            styleTween(name: string, tween: (d: any, i: number, a: any) => BaseInterpolate, priority?: string): Transition;
            text: {
                (text: string): Transition;
                (text: (d: any, i: number) => string): Transition;
            }
            tween(name: string, factory: InterpolateFactory): Transition;
            filter: {
                (selector: string): Transition;
                (selector: (data: any, index: number) => boolean): Transition;
            };
            remove(): Transition;
        }

        export interface InterpolateFactory {
            (a?: any, b?: any): BaseInterpolate;
        }

        export interface BaseInterpolate {
            (a: any, b?: any): any;
        }

        export interface Interpolate {
            (t: any): any;
        }
    }

    //Time
    export module Time {
        export interface Time {
            second: Interval;
            minute: Interval;
            hour: Interval;
            day: Interval;
            week: Interval;
            sunday: Interval;
            monday: Interval;
            tuesday: Interval;
            wednesday: Interval;
            thursday: Interval;
            friday: Interval;
            saturday: Interval;
            month: Interval;
            year: Interval;

            seconds: Range;
            minutes: Range;
            hours: Range;
            days: Range;
            weeks: Range;
            months: Range;
            years: Range;

            sundays: Range;
            mondays: Range;
            tuesdays: Range;
            wednesdays: Range;
            thursdays: Range;
            fridays: Range;
            saturdays: Range;
            format: {
                /**
                 * Constructs a new local time formatter using the given specifier.
                 */
                (specifier: string): TimeFormat;
                /**
                 * Returns a new multi-resolution time format given the specified array of predicated formats.
                 */
                multi: (formats: any[][]) => TimeFormat;

                utc: {
                    /**
                     * Constructs a new local time formatter using the given specifier.
                     */
                    (specifier: string): TimeFormat;
                    /**
                     * Returns a new multi-resolution UTC time format given the specified array of predicated formats.
                     */
                    multi: (formats: any[][]) => TimeFormat;
                };

                /**
                 * The full ISO 8601 UTC time format: "%Y-%m-%dT%H:%M:%S.%LZ".
                 */
                iso: TimeFormat;
            };

            scale: {
                /**
                * Constructs a new time scale with the default domain and range;
                * the ticks and tick format are configured for local time.
                */
                (): Scale.TimeScale;
                /**
                * Constructs a new time scale with the default domain and range;
                * the ticks and tick format are configured for UTC time.
                */
                utc(): Scale.TimeScale;
            };
        }

        export interface Range {
            (start: Date, end: Date, step?: number): Date[];
        }

        export interface Interval {
            (date: Date): Date;
            floor: (date: Date) => Date;
            round: (date: Date) => Date;
            ceil: (date: Date) => Date;
            range: Range;
            offset: (date: Date, step: number) => Date;
            utc?: Interval;
        }

        export interface TimeFormat {
            (date: Date): string;
            parse: (string: string) => Date;
        }
    }

    // Layout
    export module Layout {
        export interface Layout {
            /**
            * Creates a new Stack layout
            */
            stack(): StackLayout;
            /**
            * Creates a new pie layout
            */
            pie(): PieLayout;
            /**
            * Creates a new force layout
            */
            force(): ForceLayout;
            /**
            * Creates a new tree layout
            */
            tree(): TreeLayout;
            bundle(): BundleLayout;
            chord(): ChordLayout;
            cluster(): ClusterLayout;
            hierarchy(): HierarchyLayout;
            histogram(): HistogramLayout;
            pack(): PackLayout;
            partition(): PartitionLayout;
            treemap(): TreeMapLayout;
        }

        export interface StackLayout {
            <T>(layers: T[], index?: number): T[];
            values(accessor?: (d: any) => any): StackLayout;
            offset(offset: string): StackLayout;
            x(accessor: (d: any, i: number) => any): StackLayout;
            y(accessor: (d: any, i: number) => any): StackLayout;
            out(setter: (d: any, y0: number, y: number) => void): StackLayout;
        }

        export interface TreeLayout {
            /**
            * Gets or sets the sort order of sibling nodes for the layout using the specified comparator function
            */
            sort: {
                /**
                * Gets the sort order function of sibling nodes for the layout
                */
                (): (d1: any, d2: any) => number;
                /**
                * Sets the sort order of sibling nodes for the layout using the specified comparator function
                */
                (comparator: (d1: any, d2: any) => number): TreeLayout;
            };
            /**
            * Gets or sets the specified children accessor function
            */
            children: {
                /**
                * Gets the children accessor function
                */
                (): (d: any) => any;
                /**
                * Sets the specified children accessor function
                */
                (children: (d: any) => any): TreeLayout;
            };
            /**
            * Runs the tree layout
            */
            nodes(root: GraphNode): GraphNode[];
            /**
            * Given the specified array of nodes, such as those returned by nodes, returns an array of objects representing the links from parent to child for each node
            */
            links(nodes: GraphNode[]): GraphLink[];
            /**
            * If separation is specified, uses the specified function to compute separation between neighboring nodes. If separation is not specified, returns the current separation function
            */
            separation: {
                /**
                * Gets the current separation function
                */
                (): (a: GraphNode, b: GraphNode) => number;
                /**
                * Sets the specified function to compute separation between neighboring nodes
                */
                (separation: (a: GraphNode, b: GraphNode) => number): TreeLayout;
            };
            /**
            * Gets or sets the available layout size
            */
            size: {
                /**
                * Gets the available layout size
                */
                (): number[];
                /**
                * Sets the available layout size
                */
                (size: number[]): TreeLayout;
            };
            /**
            * Gets or sets the available node size
            */
            nodeSize: {
                /**
                * Gets the available node size
                */
                (): number[];
                /**
                * Sets the available node size
                */
                (size: number[]): TreeLayout;
            };
        }

        export interface PieLayout {
            (values: any[], index?: number): ArcDescriptor[];
            value: {
                (): (d: any, index: number) => number;
                (accessor: (d: any, index: number) => number): PieLayout;
            };
            sort: {
                (): (d1: any, d2: any) => number;
                (comparator: (d1: any, d2: any) => number): PieLayout;
            };
            startAngle: {
                (): number;
                (angle: number): PieLayout;
                (angle: () => number): PieLayout;
                (angle: (d : any) => number): PieLayout;
                (angle: (d : any, i: number) => number): PieLayout;
            };
            endAngle: {
                (): number;
                (angle: number): PieLayout;
                (angle: () => number): PieLayout;
                (angle: (d : any) => number): PieLayout
                (angle: (d : any, i: number) => number): PieLayout;
            };
            padAngle: {
                (): number;
                (angle: number): PieLayout;
                (angle: () => number): PieLayout;
                (angle: (d : any) => number): PieLayout
                (angle: (d : any, i: number) => number): PieLayout;
            };
        }

        export interface ArcDescriptor {
            value: any;
            data: any;
            startAngle: number;
            endAngle: number;
            index: number;
        }

        export interface GraphNode  {
            id?: number;
            index?: number;
            name?: string;
            px?: number;
            py?: number;
            size?: number;
            weight?: number;
            x?: number;
            y?: number;
            subindex?: number;
            startAngle?: number;
            endAngle?: number;
            value?: number;
            fixed?: boolean;
            children?: GraphNode[];
            _children?: GraphNode[];
            parent?: GraphNode;
            depth?: number;
        }

        export interface GraphLink {
            source: GraphNode;
            target: GraphNode;
        }

        export interface GraphNodeForce {
            index?: number;
            x?: number;
            y?: number;
            px?: number;
            py?: number;
            fixed?: boolean;
            weight?: number;
        }

        export interface GraphLinkForce {
            source: GraphNodeForce;
            target: GraphNodeForce;
        }

        export interface ForceLayout {
            (): ForceLayout;
            size: {
                (): number[];
                (mysize: number[]): ForceLayout;
            };
            linkDistance: {
                (): number;
                (number:number): ForceLayout;
                (accessor: (d: any, index: number) => number): ForceLayout;
            };
            linkStrength:
            {
                (): number;
                (number:number): ForceLayout;
                (accessor: (d: any, index: number) => number): ForceLayout;
            };
            friction:
            {
                (): number;
                (number:number): ForceLayout;
                (accessor: (d: any, index: number) => number): ForceLayout;
            };
            alpha: {
                (): number;
                (number:number): ForceLayout;
                (accessor: (d: any, index: number) => number): ForceLayout;
            };
            charge: {
                (): number;
                (number:number): ForceLayout;
                (accessor: (d: any, index: number) => number): ForceLayout;
            };

            theta: {
                (): number;
                (number:number): ForceLayout;
                (accessor: (d: any, index: number) => number): ForceLayout;
            };

            gravity: {
                (): number;
                (number:number): ForceLayout;
                (accessor: (d: any, index: number) => number): ForceLayout;
            };

            links: {
                (): GraphLinkForce[];
                (arLinks: GraphLinkForce[]): ForceLayout;

            };
            nodes:
            {
                (): GraphNodeForce[];
                (arNodes: GraphNodeForce[]): ForceLayout;

            };
            start(): ForceLayout;
            resume(): ForceLayout;
            stop(): ForceLayout;
            tick(): ForceLayout;
            on(type: string, listener: (arg:any) => void ): ForceLayout;
            drag(): ForceLayout;
        }

        export interface BundleLayout{
            (links: GraphLink[]): GraphNode[][];
        }

        export interface ChordLayout {
            matrix: {
                (): number[][];
                (matrix: number[][]): ChordLayout;
            }
            padding: {
                (): number;
                (padding: number): ChordLayout;
            }
            sortGroups: {
                (): (a: number, b: number) => number;
                (comparator: (a: number, b: number) => number): ChordLayout;
            }
            sortSubgroups: {
                (): (a: number, b: number) => number;
                (comparator: (a: number, b: number) => number): ChordLayout;
            }
            sortChords: {
                (): (a: number, b: number) => number;
                (comparator: (a: number, b: number) => number): ChordLayout;
            }
            chords(): GraphLink[];
            groups(): ArcDescriptor[];
        }

        export interface ClusterLayout{
            sort: {
                (): (a: GraphNode, b: GraphNode) => number;
                (comparator: (a: GraphNode, b: GraphNode) => number): ClusterLayout;
            }
            children: {
                (): (d: any, i?: number) => GraphNode[];
                (children: (d: any, i?: number) => GraphNode[]): ClusterLayout;
            }
            nodes(root: GraphNode): GraphNode[];
            links(nodes: GraphNode[]): GraphLink[];
            separation: {
                (): (a: GraphNode, b: GraphNode) => number;
                (separation: (a: GraphNode, b: GraphNode) => number): ClusterLayout;
            }
            size: {
                (): number[];
                (size: number[]): ClusterLayout;
            }
            value: {
                (): (node: GraphNode) => number;
                (value: (node: GraphNode) => number): ClusterLayout;
            }
        }

        export interface HierarchyLayout {
            sort: {
                (): (a: GraphNode, b: GraphNode) => number;
                (comparator: (a: GraphNode, b: GraphNode) => number): HierarchyLayout;
            }
            children: {
                (): (d: any, i?: number) => GraphNode[];
                (children: (d: any, i?: number) => GraphNode[]): HierarchyLayout;
            }
            nodes(root: GraphNode): GraphNode[];
            links(nodes: GraphNode[]): GraphLink[];
            value: {
                (): (node: GraphNode) => number;
                (value: (node: GraphNode) => number): HierarchyLayout;
            }
            reValue(root: GraphNode): HierarchyLayout;
        }

        export interface Bin extends Array<any> {
            x: number;
            dx: number;
            y: number;
        }

        export interface HistogramLayout {
            (values: any[], index?: number): Bin[];
            value: {
                (): (value: any) => any;
                (accessor: (value: any) => any): HistogramLayout
            }
            range: {
                (): (value: any, index: number) => number[];
                (range: (value: any, index: number) => number[]): HistogramLayout;
                (range: number[]): HistogramLayout;
            }
            bins: {
                (): (range: any[], index: number) => number[];
                (bins: (range: any[], index: number) => number[]): HistogramLayout;
                (bins: number): HistogramLayout;
                (bins: number[]): HistogramLayout;
            }
            frequency: {
                (): boolean;
                (frequency: boolean): HistogramLayout;
            }
        }

        export interface PackLayout {
            sort: {
                (): (a: GraphNode, b: GraphNode) => number;
                (comparator: (a: GraphNode, b: GraphNode) => number): PackLayout;
            }
            children: {
                (): (d: any, i?: number) => GraphNode[];
                (children: (d: any, i?: number) => GraphNode[]): PackLayout;
            }
            nodes(root: GraphNode): GraphNode[];
            links(nodes: GraphNode[]): GraphLink[];
            value: {
                (): (node: GraphNode) => number;
                (value: (node: GraphNode) => number): PackLayout;
            }
            size: {
                (): number[];
                (size: number[]): PackLayout;
            }
            padding: {
                (): number;
                (padding: number): PackLayout;
            }
        }

        export interface PartitionLayout {
            sort: {
                (): (a: GraphNode, b: GraphNode) => number;
                (comparator: (a: GraphNode, b: GraphNode) => number): PackLayout;
            }
            children: {
                (): (d: any, i?: number) => GraphNode[];
                (children: (d: any, i?: number) => GraphNode[]): PackLayout;
            }
            nodes(root: GraphNode): GraphNode[];
            links(nodes: GraphNode[]): GraphLink[];
            value: {
                (): (node: GraphNode) => number;
                (value: (node: GraphNode) => number): PackLayout;
            }
            size: {
                (): number[];
                (size: number[]): PackLayout;
            }
        }

        export interface TreeMapLayout {
            sort: {
                (): (a: GraphNode, b: GraphNode) => number;
                (comparator: (a: GraphNode, b: GraphNode) => number): TreeMapLayout;
            }
            children: {
                (): (d: any, i?: number) => GraphNode[];
                (children: (d: any, i?: number) => GraphNode[]): TreeMapLayout;
            }
            nodes(root: GraphNode): GraphNode[];
            links(nodes: GraphNode[]): GraphLink[];
            value: {
                (): (node: GraphNode) => number;
                (value: (node: GraphNode) => number): TreeMapLayout;
            }
            size: {
                (): number[];
                (size: number[]): TreeMapLayout;
            }
            padding: {
                (): number;
                (padding: number): TreeMapLayout;
            }
            round: {
                (): boolean;
                (round: boolean): TreeMapLayout;
            }
            sticky: {
                (): boolean;
                (sticky: boolean): TreeMapLayout;
            }
            mode: {
                (): string;
                (mode: string): TreeMapLayout;
            }
        }
    }

    // Color
    export module Color {
        export interface Color {
            /**
            * increase lightness by some exponential factor (gamma)
            */
            brighter(k?: number): Color;
            /**
            * decrease lightness by some exponential factor (gamma)
            */
            darker(k?: number): Color;
            /**
            * convert the color to a string.
            */
            toString(): string;
        }

        export interface RGBColor extends Color{
            /**
            * the red color channel.
            */
            r: number;
            /**
            * the green color channel.
            */
            g: number;
            /**
            * the blue color channel.
            */
            b: number;
            /**
            * convert from RGB to HSL.
            */
            hsl(): HSLColor;
        }

        export interface HSLColor extends Color{
            /**
            * hue
            */
            h: number;
            /**
            * saturation
            */
            s: number;
            /**
            * lightness
            */
            l: number;
            /**
            * convert from HSL to RGB.
            */
            rgb(): RGBColor;
        }

        export interface LABColor extends Color{
            /**
            * lightness
            */
            l: number;
            /**
            * a-dimension
            */
            a: number;
            /**
            * b-dimension
            */
            b: number;
            /**
            * convert from LAB to RGB.
            */
            rgb(): RGBColor;
        }

        export interface HCLColor extends Color{
            /**
            * hue
            */
            h: number;
            /**
            * chroma
            */
            c: number;
            /**
            * luminance
            */
            l: number;
            /**
            * convert from HCL to RGB.
            */
            rgb(): RGBColor;
        }
    }

    // SVG
    export module Svg {
        export interface Svg {
            /**
            * Create a new symbol generator
            */
            symbol(): Symbol;
            /**
            * Create a new axis generator
            */
            axis(): Axis;
            /**
            * Create a new arc generator
            */
            arc(): Arc;
            /**
            * Create a new line generator
            */
            line: {
                (): Line;
                radial(): LineRadial;
            }
            /**
            * Create a new area generator
            */
            area: {
                (): Area;
                radial(): AreaRadial;
            }
            /**
            * Create a new brush generator
            */
            brush(): Brush;
            /**
            * Create a new chord generator
            */
            chord(): Chord;
            /**
            * Create a new diagonal generator
            */
            diagonal: {
                (): Diagonal;
                radial(): Diagonal;
            }
            /**
            * The array of supported symbol types.
            */
            symbolTypes: string[];
        }

        export interface Symbol {
            type: (symbolType: string | ((datum: any, index: number) => string)) => Symbol;
            size: (size: number | ((datum: any, index: number) => number)) => Symbol;
            (datum?: any, index?: number): string;
        }

        export interface Brush {
            /**
            * Draws or redraws this brush into the specified selection of elements
            */
            (selection: _Selection<any>): void;
            /**
            * Gets or sets the x-scale associated with the brush
            */
            x: {
                /**
                * Gets  the x-scale associated with the brush
                */
                (): D3.Scale.Scale;
                /**
                * Sets the x-scale associated with the brush
                *
                * @param accessor The new Scale
                */
                (scale: D3.Scale.Scale): Brush;
            };
            /**
            * Gets or sets the x-scale associated with the brush
            */
            y: {
                /**
                * Gets  the x-scale associated with the brush
                */
                (): D3.Scale.Scale;
                /**
                * Sets the x-scale associated with the brush
                *
                * @param accessor The new Scale
                */
                (scale: D3.Scale.Scale): Brush;
            };
            /**
            * Gets or sets the current brush extent
            */
            extent: {
                /**
                * Gets the current brush extent
                */
                (): any[];
                /**
                * Sets the current brush extent
                */
                (values: any[]): Brush;
            };
            /**
            * Clears the extent, making the brush extent empty.
            */
            clear(): Brush;
            /**
            * Returns true if and only if the brush extent is empty
            */
            empty(): boolean;
            /**
            * Gets or sets the listener for the specified event type
            */
            on: {
                /**
                * Gets the listener for the specified event type
                */
                (type: string): (data: any, index: number) => any;
                /**
                * Sets the listener for the specified event type
                */
                (type: string, listener: (data: any, index: number) => any, capture?: boolean): Brush;
            };
        }

        export interface Axis {
            (selection: _Selection<any>): void;
            (transition: Transition.Transition): void;

            scale: {
                (): any;
                (scale: any): Axis;
            };

            orient: {
                (): string;
                (orientation: string): Axis;
            };

            ticks: {
                (): any[];
                (...arguments: any[]): Axis;
            };

            tickPadding: {
                (): number;
                (padding: number): Axis;
            };

            tickValues: {
                (): any[];
                (values: any[]): Axis;
            };
            tickSubdivide(count: number): Axis;
            tickSize: {
                (): number;
                (inner: number, outer?: number): Axis;
            }
            innerTickSize: {
                (): number;
                (value: number): Axis;
            }
            outerTickSize: {
                (): number;
                (value: number): Axis;
            }
            tickFormat(formatter: (value: any, index?: number) => string): Axis;
            nice(count?: number): Axis;
        }

        export interface Arc {
           /**
           * Returns the path data string
           *
           * @param data Array of data elements
           * @param index Optional index
           */
           (data: any, index?: number): string;
           innerRadius: {
                (): (data: any, index?: number) => number;
                (radius: number): Arc;
                (radius: () => number): Arc;
                (radius: (data: any) => number): Arc;
                (radius: (data: any, index: number) => number): Arc;
            };
            outerRadius: {
                (): (data: any, index?: number) => number;
                (radius: number): Arc;
                (radius: () => number): Arc;
                (radius: (data: any) => number): Arc;
                (radius: (data: any, index: number) => number): Arc;
            };
            startAngle: {
                (): (data: any, index?: number) => number;
                (angle: number): Arc;
                (angle: () => number): Arc;
                (angle: (data: any) => number): Arc;
                (angle: (data: any, index: number) => number): Arc;
            };
            endAngle: {
                (): (data: any, index?: number) => number;
                (angle: number): Arc;
                (angle: () => number): Arc;
                (angle: (data: any) => number): Arc;
                (angle: (data: any, index: number) => number): Arc;
            };
            centroid(data: any, index?: number): number[];
        }

        export interface Line {
            /**
            * Returns the path data string
            *
            * @param data Array of data elements
            * @param index Optional index
            */
            (data: any[], index?: number): string;
            /**
            * Get or set the x-coordinate accessor.
            */
            x: {
                /**
                * Get the x-coordinate accessor.
                */
                (): (data: any, index ?: number) => number;
                /**
                * Set the x-coordinate accessor.
                *
                * @param accessor The new accessor function
                */
                (accessor: (data: any) => number): Line;
                (accessor: (data: any, index: number) => number): Line;
                /**
                * Set the  x-coordinate to a constant.
                *
                * @param cnst The new constant value.
                */
                (cnst: number): Line;
            };
            /**
            * Get or set the y-coordinate accessor.
            */
            y: {
                /**
                * Get the y-coordinate accessor.
                */
                (): (data: any, index ?: number) => number;
                /**
                * Set the y-coordinate accessor.
                *
                * @param accessor The new accessor function
                */
                (accessor: (data: any) => number): Line;
                (accessor: (data: any, index: number) => number): Line;
                /**
                * Set the  y-coordinate to a constant.
                *
                * @param cnst The new constant value.
                */
                (cnst: number): Line;
            };
            /**
            * Get or set the interpolation mode.
            */
            interpolate: {
                /**
                * Get the interpolation accessor.
                */
                (): string;
                /**
                * Set the interpolation accessor.
                *
                * @param interpolate The interpolation mode
                */
                (interpolate: string): Line;
            };
            /**
            * Get or set the cardinal spline tension.
            */
            tension: {
                /**
                * Get the cardinal spline accessor.
                */
                (): number;
                /**
                * Set the cardinal spline accessor.
                *
                * @param tension The Cardinal spline interpolation tension
                */
                (tension: number): Line;
            };
            /**
            * Control whether the line is defined at a given point.
            */
            defined: {
                /**
                * Get the accessor function that controls where the line is defined.
                */
                (): (data: any, index?: number) => boolean;
                /**
                * Set the accessor function that controls where the area is defined.
                *
                * @param defined The new accessor function
                */
                (defined: (data: any, index?: number) => boolean): Line;
            };
        }

        export interface LineRadial {
            /**
            * Returns the path data string
            *
            * @param data Array of data elements
            * @param index Optional index
            */
            (data: any[], index?: number): string;
            /**
            * Get or set the x-coordinate accessor.
            */
            x: {
                /**
                * Get the x-coordinate accessor.
                */
                (): (data: any, index ?: number) => number;
                /**
                * Set the x-coordinate accessor.
                *
                * @param accessor The new accessor function
                */
                (accessor: (data: any) => number): LineRadial;
                (accessor: (data: any, index: number) => number): LineRadial;

                /**
                * Set the  x-coordinate to a constant.
                *
                * @param cnst The new constant value.
                */
                (cnst: number): LineRadial;
            };
            /**
            * Get or set the y-coordinate accessor.
            */
            y: {
                /**
                * Get the y-coordinate accessor.
                */
                (): (data: any, index ?: number) => number;
                /**
                * Set the y-coordinate accessor.
                *
                * @param accessor The new accessor function
                */
                (accessor: (data: any) => number): LineRadial;
                (accessor: (data: any, index: number) => number): LineRadial;
                /**
                * Set the  y-coordinate to a constant.
                *
                * @param cnst The new constant value.
                */
                (cnst: number): LineRadial;
            };
            /**
            * Get or set the interpolation mode.
            */
            interpolate: {
                /**
                * Get the interpolation accessor.
                */
                (): string;
                /**
                * Set the interpolation accessor.
                *
                * @param interpolate The interpolation mode
                */
                (interpolate: string): LineRadial;
            };
            /**
            * Get or set the cardinal spline tension.
            */
            tension: {
                /**
                * Get the cardinal spline accessor.
                */
                (): number;
                /**
                * Set the cardinal spline accessor.
                *
                * @param tension The Cardinal spline interpolation tension
                */
                (tension: number): LineRadial;
            };
            /**
            * Control whether the line is defined at a given point.
            */
            defined: {
                /**
                * Get the accessor function that controls where the line is defined.
                */
                (): (data: any) => any;
                /**
                * Set the accessor function that controls where the area is defined.
                *
                * @param defined The new accessor function
                */
                (defined: (data: any) => any): LineRadial;
            };
            radius: {
                (): (d: any, i?: number) => number;
                (radius: number): LineRadial;
                (radius: (d: any) => number): LineRadial;
                (radius: (d: any, i: number) => number): LineRadial;
            }
            angle: {
                (): (d: any, i?: any) => number;
                (angle: number): LineRadial;
                (angle: (d: any) => number): LineRadial;
                (angle: (d: any, i: any) => number): LineRadial;
            }
        }

        export interface Area {
            /**
            * Generate a piecewise linear area, as in an area chart.
            */
            (data: any[], index?: number): string;
            /**
            * Get or set the x-coordinate accessor.
            */
            x: {
                /**
                * Get the x-coordinate accessor.
                */
                (): (data: any, index ?: number) => number;
                /**
                * Set the x-coordinate accessor.
                *
                * @param accessor The new accessor function
                */
                (accessor: (data: any) => number): Area;
                (accessor: (data: any, index: number) => number): Area;
                /**
                * Set the  x-coordinate to a constant.
                *
                * @param cnst The new constant value.
                */
                (cnst: number): Area;
            };
            /**
            * Get or set the x0-coordinate (baseline) accessor.
            */
            x0: {
                /**
                * Get the  x0-coordinate (baseline) accessor.
                */
                (): (data: any, index ?: number) => number;
                /**
                * Set the  x0-coordinate (baseline) accessor.
                *
                * @param accessor The new accessor function
                */
                (accessor: (data: any) => number): Area;
                (accessor: (data: any, index: number) => number): Area;
                /**
                * Set the  x0-coordinate (baseline) to a constant.
                *
                * @param cnst The new constant value.
                */
                (cnst: number): Area;
            };
            /**
            * Get or set the x1-coordinate (topline) accessor.
            */
            x1: {
                /**
                * Get the  x1-coordinate (topline) accessor.
                */
                (): (data: any, index ?: number) => number;
                /**
                * Set the  x1-coordinate (topline) accessor.
                *
                * @param accessor The new accessor function
                */
                (accessor: (data: any) => number): Area;
                (accessor: (data: any, index: number) => number): Area;
                /**
                * Set the  x1-coordinate (topline) to a constant.
                *
                * @param cnst The new constant value.
                */
                (cnst: number): Area;
            };
            /**
            * Get or set the y-coordinate accessor.
            */
            y: {
                /**
                * Get the y-coordinate accessor.
                */
                (): (data: any, index ?: number) => number;
                /**
                * Set the y-coordinate accessor.
                *
                * @param accessor The new accessor function
                */
                (accessor: (data: any) => number): Area;
                (accessor: (data: any, index: number) => number): Area;
                /**
                * Set the y-coordinate to a constant.
                *
                * @param cnst The constant value
                */
                (cnst: number): Area;
            };
            /**
            * Get or set the y0-coordinate (baseline) accessor.
            */
            y0: {
                /**
                * Get the y0-coordinate (baseline) accessor.
                */
                (): (data: any, index ?: number) => number;
                /**
                * Set the y0-coordinate (baseline) accessor.
                *
                * @param accessor The new accessor function
                */
                (accessor: (data: any) => number): Area;
                (accessor: (data: any, index: number) => number): Area;
                /**
                * Set the y0-coordinate (baseline) to a constant.
                *
                * @param cnst The constant value
                */
                (cnst: number): Area;
            };
            /**
            * Get or set the y1-coordinate (topline) accessor.
            */
            y1: {
                /**
                * Get the y1-coordinate (topline) accessor.
                */
                (): (data: any, index ?: number) => number;
                /**
                * Set the y1-coordinate (topline) accessor.
                *
                * @param accessor The new accessor function
                */
                (accessor: (data: any) => number): Area;
                (accessor: (data: any, index: number) => number): Area;
                /**
                * Set the y1-coordinate (baseline) to a constant.
                *
                * @param cnst The constant value
                */
                (cnst: number): Area;
            };
            /**
            * Get or set the interpolation mode.
            */
            interpolate: {
                /**
                * Get the interpolation accessor.
                */
                (): string;
                /**
                * Set the interpolation accessor.
                *
                * @param interpolate The interpolation mode
                */
                (interpolate: string): Area;
            };
            /**
            * Get or set the cardinal spline tension.
            */
            tension: {
                /**
                * Get the cardinal spline accessor.
                */
                (): number;
                /**
                * Set the cardinal spline accessor.
                *
                * @param tension The Cardinal spline interpolation tension
                */
                (tension: number): Area;
            };
            /**
            * Control whether the area is defined at a given point.
            */
            defined: {
                /**
                * Get the accessor function that controls where the area is defined.
                */
                (): (data: any, index?: number) => any;
                /**
                * Set the accessor function that controls where the area is defined.
                *
                * @param defined The new accessor function
                */
                (defined: (data: any, index?: number) => any): Area;
            };
        }

        export interface AreaRadial {
            /**
            * Generate a piecewise linear area, as in an area chart.
            */
            (data: any[], index?: number): string;
            /**
            * Get or set the x-coordinate accessor.
            */
            x: {
                /**
                * Get the x-coordinate accessor.
                */
                (): (data: any, index ?: number) => number;
                /**
                * Set the x-coordinate accessor.
                *
                * @param accessor The new accessor function
                */
                (accessor: (data: any) => number): AreaRadial;
                (accessor: (data: any, index: number) => number): AreaRadial;
                /**
                * Set the  x-coordinate to a constant.
                *
                * @param cnst The new constant value.
                */
                (cnst: number): AreaRadial;
            };
            /**
            * Get or set the x0-coordinate (baseline) accessor.
            */
            x0: {
                /**
                * Get the  x0-coordinate (baseline) accessor.
                */
                (): (data: any, index ?: number) => number;
                /**
                * Set the  x0-coordinate (baseline) accessor.
                *
                * @param accessor The new accessor function
                */
                (accessor: (data: any) => number): AreaRadial;
                (accessor: (data: any, index: number) => number): AreaRadial;
                /**
                * Set the  x0-coordinate to a constant.
                *
                * @param cnst The new constant value.
                */
                (cnst: number): AreaRadial;
            };
            /**
            * Get or set the x1-coordinate (topline) accessor.
            */
            x1: {
                /**
                * Get the  x1-coordinate (topline) accessor.
                */
                (): (data: any, index ?: number) => number;
                /**
                * Set the  x1-coordinate (topline) accessor.
                *
                * @param accessor The new accessor function
                */
                (accessor: (data: any) => number): AreaRadial;
                (accessor: (data: any, index: number) => number): AreaRadial;
                /**
                * Set the  x1-coordinate to a constant.
                *
                * @param cnst The new constant value.
                */
                (cnst: number): AreaRadial;
            };
            /**
            * Get or set the y-coordinate accessor.
            */
            y: {
                /**
                * Get the y-coordinate accessor.
                */
                (): (data: any, index ?: number) => number;
                /**
                * Set the y-coordinate accessor.
                *
                * @param accessor The new accessor function
                */
                (accessor: (data: any) => number): AreaRadial;
                (accessor: (data: any, index: number) => number): AreaRadial;
                /**
                * Set the y-coordinate to a constant.
                *
                * @param cnst The new constant value.
                */
                (cnst: number): AreaRadial;
            };
            /**
            * Get or set the y0-coordinate (baseline) accessor.
            */
            y0: {
                /**
                * Get the y0-coordinate (baseline) accessor.
                */
                (): (data: any, index ?: number) => number;
                /**
                * Set the y0-coordinate (baseline) accessor.
                *
                * @param accessor The new accessor function
                */
                (accessor: (data: any) => number): AreaRadial;
                (accessor: (data: any, index: number) => number): AreaRadial;
                /**
                * Set the  y0-coordinate to a constant.
                *
                * @param cnst The new constant value.
                */
                (cnst: number): AreaRadial;
            };
            /**
            * Get or set the y1-coordinate (topline) accessor.
            */
            y1: {
                /**
                * Get the y1-coordinate (topline) accessor.
                */
                (): (data: any, index ?: number) => number;
                /**
                * Set the y1-coordinate (topline) accessor.
                *
                * @param accessor The new accessor function
                */
                (accessor: (data: any) => number): AreaRadial;
                (accessor: (data: any, index: number) => number): AreaRadial;
                /**
                * Set the  y1-coordinate to a constant.
                *
                * @param cnst The new constant value.
                */
                (cnst: number): AreaRadial;
            };
            /**
            * Get or set the interpolation mode.
            */
            interpolate: {
                /**
                * Get the interpolation accessor.
                */
                (): string;
                /**
                * Set the interpolation accessor.
                *
                * @param interpolate The interpolation mode
                */
                (interpolate: string): AreaRadial;
            };
            /**
            * Get or set the cardinal spline tension.
            */
            tension: {
                /**
                * Get the cardinal spline accessor.
                */
                (): number;
                /**
                * Set the cardinal spline accessor.
                *
                * @param tension The Cardinal spline interpolation tension
                */
                (tension: number): AreaRadial;
            };
            /**
            * Control whether the area is defined at a given point.
            */
            defined: {
                /**
                * Get the accessor function that controls where the area is defined.
                */
                (): (data: any) => any;
                /**
                * Set the accessor function that controls where the area is defined.
                *
                * @param defined The new accessor function
                */
                (defined: (data: any) => any): AreaRadial;
            };
            radius: {
                (): number;
                (radius: number): AreaRadial;
                (radius: () => number): AreaRadial;
                (radius: (data: any) => number): AreaRadial;
                (radius: (data: any, index: number) => number): AreaRadial;
            };
            innerRadius: {
                (): number;
                (radius: number): AreaRadial;
                (radius: () => number): AreaRadial;
                (radius: (data: any) => number): AreaRadial;
                (radius: (data: any, index: number) => number): AreaRadial;
            };
            outerRadius: {
                (): number;
                (radius: number): AreaRadial;
                (radius: () => number): AreaRadial;
                (radius: (data: any) => number): AreaRadial;
                (radius: (data: any, index: number) => number): AreaRadial;
            };
            angle: {
                (): number;
                (angle: number): AreaRadial;
                (angle: () => number): AreaRadial;
                (angle: (data: any) => number): AreaRadial;
                (angle: (data: any, index: number) => number): AreaRadial;
            };
            startAngle: {
                (): number;
                (angle: number): AreaRadial;
                (angle: () => number): AreaRadial;
                (angle: (data: any) => number): AreaRadial;
                (angle: (data: any, index: number) => number): AreaRadial;
            };
            endAngle: {
                (): number;
                (angle: number): AreaRadial;
                (angle: () => number): AreaRadial;
                (angle: (data: any) => number): AreaRadial;
                (angle: (data: any, index: number) => number): AreaRadial;
            };
        }

        export interface Chord {
            (datum: any, index?: number): string;
            radius: {
                (): number;
                (radius: number): Chord;
                (radius: () => number): Chord;
            };
            startAngle: {
                (): number;
                (angle: number): Chord;
                (angle: () => number): Chord;
            };
            endAngle: {
                (): number;
                (angle: number): Chord;
                (angle: () => number): Chord;
            };
            source: {
                (): any;
                (angle: any): Chord;
                (angle: (d: any, i?: number) => any): Chord;
            };
            target: {
                (): any;
                (angle: any): Chord;
                (angle: (d: any, i?: number) => any): Chord;
            };
        }

        export interface Diagonal {
            (datum: any, index?: number): string;
            projection: {
                (): (datum: any, index?: number) => number[];
                (proj: (datum: any) => number[]): Diagonal;
                (proj: (datum: any, index: number) => number[]): Diagonal;
            };
            source: {
                (): (datum: any, index?: number) => any;
                (src: (datum: any) => any): Diagonal;
                (src: (datum: any, index: number) => any): Diagonal;
                (src: any): Diagonal;
            };
            target: {
                (): (datum: any, index?: number) => any;
                (target: (d: any) => any): Diagonal;
                (target: (d: any, i: number) => any): Diagonal;
                (target: any): Diagonal;
            };
        }
    }

    // Scales
    export module Scale {
        export interface ScaleBase {
            /**
            * Construct a linear quantitative scale.
            */
            linear(): LinearScale;
            /*
            * Construct an ordinal scale.
            */
            ordinal(): OrdinalScale;
            /**
            * Construct a linear quantitative scale with a discrete output range.
            */
            quantize(): QuantizeScale;
            /*
            * Construct an ordinal scale with ten categorical colors.
            */
            category10(): OrdinalScale;
            /*
            * Construct an ordinal scale with twenty categorical colors
            */
            category20(): OrdinalScale;
            /*
            * Construct an ordinal scale with twenty categorical colors
            */
            category20b(): OrdinalScale;
            /*
            * Construct an ordinal scale with twenty categorical colors
            */
            category20c(): OrdinalScale;
            /*
            * Construct a linear identity scale.
            */
            identity(): IdentityScale;
            /*
            * Construct a quantitative scale with an logarithmic transform.
            */
            log(): LogScale;
            /*
            * Construct a quantitative scale with an exponential transform.
            */
            pow(): PowScale;
            /*
            * Construct a quantitative scale mapping to quantiles.
            */
            quantile(): QuantileScale;
            /*
            * Construct a quantitative scale with a square root transform.
            */
            sqrt(): SqrtScale;
            /*
            * Construct a threshold scale with a discrete output range.
            */
            threshold(): ThresholdScale;
        }

        export interface GenericScale<S> {
            (value: any): any;
            domain: {
                (values: any[]): S;
                (): any[];
            };
            range: {
                (values: any[]): S;
                (): any[];
            };
            invertExtent?(y: any): any[];
            copy(): S;
        }

        export interface Scale extends GenericScale<Scale> { }

        export interface GenericQuantitativeScale<S> extends GenericScale<S> {
            /**
            * Get the range value corresponding to a given domain value.
            *
            * @param value Domain Value
            */
            (value: number): number;
            /**
            * Get the domain value corresponding to a given range value.
            *
            * @param value Range Value
            */
            invert(value: number): number;
            /**
            * Set the scale's output range, and enable rounding.
            *
            * @param value The output range.
            */
            rangeRound: (values: any[]) => S;
            /**
            * get or set the scale's output interpolator.
            */
            interpolate: {
                (): D3.Transition.Interpolate;
                (factory: D3.Transition.Interpolate): S;
            };
            /**
            * enable or disable clamping of the output range.
            *
            * @param clamp Enable or disable
            */
            clamp: {
                (): boolean;
                (clamp: boolean): S;
            }
            /**
            * extend the scale domain to nice round numbers.
            *
            * @param count Optional number of ticks to exactly fit the domain
            */
            nice(count?: number): S;
            /**
            * get representative values from the input domain.
            *
            * @param count Aproximate representative values to return.
            */
            ticks(count: number): any[];
            /**
            * get a formatter for displaying tick values
            *
            * @param count Aproximate representative values to return
            */
            tickFormat(count: number, format?: string): (n: number) => string;
        }

        export interface QuantitativeScale extends GenericQuantitativeScale<QuantitativeScale> { }

        export interface LinearScale extends GenericQuantitativeScale<LinearScale> { }

        export interface IdentityScale extends GenericScale<IdentityScale> {
            /**
            * Get the range value corresponding to a given domain value.
            *
            * @param value Domain Value
            */
            (value: number): number;
            /**
            * Get the domain value corresponding to a given range value.
            *
            * @param value Range Value
            */
            invert(value: number): number;
            /**
            * get representative values from the input domain.
            *
            * @param count Aproximate representative values to return.
            */
            ticks(count: number): any[];
            /**
            * get a formatter for displaying tick values
            *
            * @param count Aproximate representative values to return
            */
            tickFormat(count: number): (n: number) => string;
        }

        export interface SqrtScale extends GenericQuantitativeScale<SqrtScale> { }

        export interface PowScale extends GenericQuantitativeScale<PowScale> { }

        export interface LogScale extends GenericQuantitativeScale<LogScale> { }

        export interface OrdinalScale extends GenericScale<OrdinalScale> {
            rangePoints(interval: any[], padding?: number): OrdinalScale;
            rangeBands(interval: any[], padding?: number, outerPadding?: number): OrdinalScale;
            rangeRoundBands(interval: any[], padding?: number, outerPadding?: number): OrdinalScale;
            rangeBand(): number;
            rangeExtent(): any[];
        }

        export interface QuantizeScale extends GenericScale<QuantizeScale> { }

        export interface ThresholdScale extends GenericScale<ThresholdScale> { }

        export interface QuantileScale extends GenericScale<QuantileScale> {
            quantiles(): any[];
        }

        export interface TimeScale extends GenericScale<TimeScale> {
            (value: Date): number;
            invert(value: number): Date;
            rangeRound: (values: any[]) => TimeScale;
            interpolate: {
                (): D3.Transition.Interpolate;
                (factory: D3.Transition.InterpolateFactory): TimeScale;
            };
            clamp(clamp: boolean): TimeScale;
            ticks: {
                (count: number): any[];
                (range: D3.Time.Range, count: number): any[];
            };
            tickFormat(count: number): (n: number) => string;
            nice(count?: number): TimeScale;
        }
    }

    // Behaviour
    export module Behavior {
        export interface Behavior{
            /**
            * Constructs a new drag behaviour
            */
            drag(): Drag;
            /**
            * Constructs a new zoom behaviour
            */
            zoom(): Zoom;
        }

        export interface Zoom {
            /**
            * Applies the zoom behavior to the specified selection,
            * registering the necessary event listeners to support
            * panning and zooming.
            */
            (selection: _Selection<any>): void;

            /**
            * Registers a listener to receive events
            *
            * @param type Enent name to attach the listener to
            * @param listener Function to attach to event
            */
            on: (type: string, listener: (data: any, index?: number) => any) => Zoom;

            /**
            * Gets or set the current zoom scale
            */
            scale: {
                /**
                * Get the current current zoom scale
                */
                (): number;
                /**
                * Set the current current zoom scale
                *
                * @param origin Zoom scale
                */
                (scale: number): Zoom;
            };

            /**
            * Gets or set the current zoom translation vector
            */
            translate: {
                /**
                * Get the current zoom translation vector
                */
                (): number[];
                /**
                * Set the current zoom translation vector
                *
                * @param translate Tranlation vector
                */
                (translate: number[]): Zoom;
            };

            /**
            * Gets or set the allowed scale range
            */
            scaleExtent: {
                /**
                * Get the current allowed zoom range
                */
                (): number[];
                /**
                * Set the allowable zoom range
                *
                * @param extent Allowed zoom range
                */
                (extent: number[]): Zoom;
            };

            /**
            * Gets or set the X-Scale that should be adjusted when zooming
            */
            x: {
                /**
                * Get the X-Scale
                */
                (): D3.Scale.Scale;
                /**
                * Set the X-Scale to be adjusted
                *
                * @param x The X Scale
                */
                (x: D3.Scale.Scale): Zoom;

            };

            /**
            * Gets or set the Y-Scale that should be adjusted when zooming
            */
            y: {
                /**
                * Get the Y-Scale
                */
                (): D3.Scale.Scale;
                /**
                * Set the Y-Scale to be adjusted
                *
                * @param y The Y Scale
                */
                (y: D3.Scale.Scale): Zoom;
            };
        }

        export interface Drag {
            /**
            * Execute drag method
            */
            (): any;

            /**
            * Registers a listener to receive events
            *
            * @param type Enent name to attach the listener to
            * @param listener Function to attach to event
            */
            on: (type: string, listener: (data: any, index?: number) => any) => Drag;

            /**
            * Gets or set the current origin accessor function
            */
            origin: {
                /**
                * Get the current origin accessor function
                */
                (): any;
                /**
                * Set the origin accessor function
                *
                * @param origin Accessor function
                */
                (origin?: any): Drag;
            };
        }
    }

    // Geography
    export module Geo {
        export interface Geo {
            /**
            * create a new geographic path generator
            */
            path(): Path;
            /**
            * create a circle generator.
            */
            circle(): Circle;
            /**
            * compute the spherical area of a given feature.
            */
            area(feature: any): number;
            /**
            * compute the latitude-longitude bounding box for a given feature.
            */
            bounds(feature: any): number[][];
            /**
            * compute the spherical centroid of a given feature.
            */
            centroid(feature: any): number[];
            /**
            * compute the great-arc distance between two points.
            */
            distance(a: number[], b: number[]): number;
            /**
            * interpolate between two points along a great arc.
            */
            interpolate(a: number[], b: number[]): (t: number) => number[];
            /**
            * compute the length of a line string or the circumference of a polygon.
            */
            length(feature: any): number;
            /**
            * create a standard projection from a raw projection.
            */
            projection(raw: RawProjection): Projection;
            /**
            * create a standard projection from a mutable raw projection.
            */
            projectionMutator(rawFactory: RawProjection): ProjectionMutator;
            /**
            * the Albers equal-area conic projection.
            */
            albers(): Projection;
            /**
            * a composite Albers projection for the United States.
            */
            albersUsa(): Projection;
            /**
            * the azimuthal equal-area projection.
            */
            azimuthalEqualArea: {
                (): Projection;
                raw: RawProjection;
            }
            /**
            * the azimuthal equidistant projection.
            */
            azimuthalEquidistant: {
                (): Projection;
                raw: RawProjection;
            }
            /**
            * the conic conformal projection.
            */
            conicConformal: {
                (): Projection;
                raw(phi1:number, phi2:number): RawProjection;
            }
            /**
            * the conic equidistant projection.
            */
            conicEquidistant: {
                (): Projection;
                raw(phi1:number, phi2:number): RawProjection;
            }
            /**
            * the conic equal-area (a.k.a. Albers) projection.
            */
            conicEqualArea: {
                (): Projection;
                raw(phi1:number, phi2:number): RawProjection;
            }
            /**
            * the equirectangular (plate carreé) projection.
            */
            equirectangular: {
                (): Projection;
                raw: RawProjection;
            }
            /**
            * the gnomonic projection.
            */
            gnomonic: {
                (): Projection;
                raw: RawProjection;
            }
            /**
            * the spherical Mercator projection.
            */
            mercator: {
                (): Projection;
                raw: RawProjection;
            }
            /**
            * the azimuthal orthographic projection.
            */
            orthographic: {
                (): Projection;
                raw: RawProjection;
            }
            /**
            * the azimuthal stereographic projection.
            */
            stereographic: {
                (): Projection;
                raw: RawProjection;
            }
            /**
            * the transverse Mercator projection.
            */
            transverseMercator: {
                (): Projection;
                raw: RawProjection;
            }
            /**
            * convert a GeoJSON object to a geometry stream.
            */
            stream(object: GeoJSON, listener: Stream): void;
            /**
            *
            */
            graticule(): Graticule;
            /**
            *
            */
            greatArc(): GreatArc;
            /**
            *
            */
            rotation(rotation: number[]): Rotation;
        }

        export interface Path {
            /**
            * Returns the path data string for the given feature
            */
            (feature: any, index?: any): string;
            /**
            * get or set the geographic projection.
            */
            projection: {
                /**
                * get the geographic projection.
                */
                (): Projection;
                /**
                * set the geographic projection.
                */
                (projection: Projection): Path;
            }
            /**
            * get or set the render context.
            */
            context: {
                /**
                * return an SVG path string invoked on the given feature.
                */
                (): string;
                /**
                * sets the render context and returns the path generator
                */
                (context: Context): Path;
            }
            /**
            * Computes the projected area
            */
            area(feature: any): any;
            /**
            * Computes the projected centroid
            */
            centroid(feature: any): any;
            /**
            * Computes the projected bounding box
            */
            bounds(feature: any): any;
            /**
            * get or set the radius to display point features.
            */
            pointRadius: {
                /**
                * returns the current radius
                */
                (): number;
                /**
                * sets the radius used to display Point and MultiPoint features to the specified number
                */
                (radius: number): Path;
                /**
                * sets the radius used to display Point and MultiPoint features to the specified number
                */
                (radius: (feature: any, index: number) => number): Path;
            }
        }

        export interface Context {
            beginPath(): any;
            moveTo(x: number, y: number): any;
            lineTo(x: number, y: number): any;
            arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): any;
            closePath(): any;
        }

        export interface Circle {
            (...args: any[]): GeoJSON;
            origin: {
                (): number[];
                (origin: number[]): Circle;
                (origin: (...args: any[]) => number[]): Circle;
            }
            angle: {
                (): number;
                (angle: number): Circle;
            }
            precision: {
                (): number;
                (precision: number): Circle;
            }
        }

        export interface Graticule{
            (): GeoJSON;
            lines(): GeoJSON[];
            outline(): GeoJSON;
            extent: {
                (): number[][];
                (extent: number[][]): Graticule;
            }
            minorExtent: {
                (): number[][];
                (extent: number[][]): Graticule;
            }
            majorExtent: {
                (): number[][];
                (extent: number[][]): Graticule;
            }
            step: {
                (): number[][];
                (extent: number[][]): Graticule;
            }
            minorStep: {
                (): number[][];
                (extent: number[][]): Graticule;
            }
            majorStep: {
                (): number[][];
                (extent: number[][]): Graticule;
            }
            precision: {
                (): number;
                (precision: number): Graticule;
            }
        }

        export interface GreatArc {
            (): GeoJSON;
            distance(): number;
            source: {
                (): any;
                (source: any): GreatArc;
            }
            target: {
                (): any;
                (target: any): GreatArc;
            }
            precision: {
                (): number;
                (precision: number): GreatArc;
            }
        }

        export interface GeoJSON {
            coordinates: number[][];
            type: string;
        }

        export interface RawProjection {
            (lambda: number, phi: number): number[];
            invert?(x: number, y: number): number[];
        }

        export interface Projection {
            (coordinates: number[]): number[];
            invert?(point: number[]): number[];
            rotate: {
                (): number[];
                (rotation: number[]): Projection;
            };
            center: {
                (): number[];
                (location: number[]): Projection;
            };
            parallels: {
                (): number[];
                (location: number[]): Projection;
            };
            translate: {
                (): number[];
                (point: number[]): Projection;
            };
            scale: {
                (): number;
                (scale: number): Projection;
            };
            clipAngle: {
                (): number;
                (angle: number): Projection;
            };
            clipExtent: {
                (): number[][];
                (extent: number[][]): Projection;
            };
            precision: {
                (): number;
                (precision: number): Projection;
            };
            stream(listener?: Stream): Stream;
        }

        export interface Stream {
            point(x: number, y: number, z?: number): void;
            lineStart(): void;
            lineEnd(): void;
            polygonStart(): void;
            polygonEnd(): void;
            sphere(): void;
        }

        export interface Rotation extends Array<any> {
            (location: number[]): Rotation;
            invert(location: number[]): Rotation;
        }

        export interface ProjectionMutator {
            (lambda: number, phi: number): Projection;
        }
    }

    // Geometry
    export module Geom {
        export interface Geom {
            voronoi<T>(): Voronoi<T>;
            /**
            * compute the Voronoi diagram for the specified points.
            */
            voronoi(vertices: Vertice[]): Polygon[];
            /**
            * compute the Delaunay triangulation for the specified points.
            */
            delaunay(vertices?: Vertice[]): Polygon[];
            /**
            * constructs a quadtree for an array of points.
            */
            quadtree(): QuadtreeFactory;
            /**
            * Constructs a new quadtree for the specified array of points.
            */
            quadtree(points: Point[], x1: number, y1: number, x2: number, y2: number): Quadtree;
            /**
            * Constructs a new quadtree for the specified array of points.
            */
            quadtree(points: Point[], width: number, height: number): Quadtree;
            /**
            * Returns the input array of vertices with additional methods attached
            */
            polygon(vertices:Vertice[]): Polygon;
            /**
            * creates a new hull layout with the default settings.
            */
            hull(): Hull;

            hull(vertices:Vertice[]): Vertice[];
        }

        export interface Vertice extends Array<number> {
            /**
            * Returns the angle of the vertice
            */
            angle?: number;
        }

        export interface Polygon extends Array<Vertice> {
            /**
            * Returns the signed area of this polygon
            */
            area(): number;
            /**
            * Returns a two-element array representing the centroid of this polygon.
            */
            centroid(): number[];
            /**
            * Clips the subject polygon against this polygon
            */
            clip(subject: Polygon): Polygon;
        }

        export interface QuadtreeFactory {
            /**
            * Constructs a new quadtree for the specified array of points.
            */
            (): Quadtree;
            /**
            * Constructs a new quadtree for the specified array of points.
            */
            (points: Point[], x1: number, y1: number, x2: number, y2: number): Quadtree;
            /**
            * Constructs a new quadtree for the specified array of points.
            */
            (points: Point[], width: number, height: number): Quadtree;

            x: {
                (): (d: any) => any;
                (accesor: (d: any) => any): QuadtreeFactory;

            }
            y: {
                (): (d: any) => any;
                (accesor: (d: any) => any): QuadtreeFactory;

            }
            size(): number[];
            size(size: number[]): QuadtreeFactory;
            extent(): number[][];
            extent(points: number[][]): QuadtreeFactory;
        }

        export interface Quadtree {
            /**
            * Adds a new point to the quadtree.
            */
            add(point: Point): void;
            visit(callback: any): void;
        }

        export interface Point {
            x: number;
            y: number;
        }

        export interface Voronoi<T> {
            /**
            * Compute the Voronoi diagram for the specified data.
            */
            (data: T[]): Polygon[];
            /**
            * Compute the graph links for the Voronoi diagram for the specified data.
            */
            links(data: T[]): Layout.GraphLink[];
            /**
            * Compute the triangles for the Voronoi diagram for the specified data.
            */
            triangles(data: T[]): number[][];
            x: {
                /**
                * Get the x-coordinate accessor.
                */
                (): (data: T, index ?: number) => number;

                /**
                * Set the x-coordinate accessor.
                *
                * @param accessor The new accessor function
                */
                (accessor: (data: T, index: number) => number): Voronoi<T>;

                /**
                * Set the x-coordinate to a constant.
                *
                * @param constant The new constant value.
                */
                (constant: number): Voronoi<T>;
            }
            y: {
                /**
                * Get the y-coordinate accessor.
                */
                (): (data: T, index ?: number) => number;

                /**
                * Set the y-coordinate accessor.
                *
                * @param accessor The new accessor function
                */
                (accessor: (data: T, index: number) => number): Voronoi<T>;

                /**
                * Set the y-coordinate to a constant.
                *
                * @param constant The new constant value.
                */
                (constant: number): Voronoi<T>;
            }
            clipExtent: {
                /**
                * Get the clip extent.
                */
                (): number[][];
                /**
                * Set the clip extent.
                *
                * @param extent The new clip extent.
                */
                (extent: number[][]): Voronoi<T>;
            }
            size: {
                /**
                * Get the size.
                */
                (): number[];
                /**
                * Set the size, equivalent to a clip extent starting from (0,0).
                *
                * @param size The new size.
                */
                (size: number[]): Voronoi<T>;
            }
        }

        export interface Hull {
            (vertices: Vertice[]): Vertice[];
            x: {
                (): (d: any) => any;
                (accesor: (d: any) => any): any;
            }
            y: {
                (): (d: any) => any;
                (accesor: (d: any) => any): any;
            }
        }
    }
}

declare var d3: D3.Base;

declare module "d3" {
    export = d3;
}
/// <reference path="emissary/emissary.d.ts" />
/// <reference path="pathwatcher/pathwatcher.d.ts" />
/// <reference path="mixto/mixto.d.ts" />
/// <reference path="atom/atom.d.ts" />
/// <reference path="text-buffer/text-buffer.d.ts" />
/// <reference path="status-bar/status-bar.d.ts" />
/// <reference path="space-pen/space-pen.d.ts" />
/// <reference path="jquery/jquery.d.ts" />
/// <reference path="node/node.d.ts" />
/// <reference path="q/Q.d.ts" />
/// <reference path="glob-expand/glob-expand.d.ts" />
/// <reference path="mkdirp/mkdirp.d.ts" />
/// <reference path="d3/d3.d.ts" />
// Type definitions for es6-promises
// Project: https://github.com/jakearchibald/ES6-Promises
// Definitions by: François de Campredon <https://github.com/fdecampredon/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

/*tslint:disable unused*/
declare module 'bluebird' {
    class Promise<R> implements Promise.Thenable<R> {
        /**
         * If you call resolve in the body of the callback passed to the constructor, 
         * your promise is fulfilled with result object passed to resolve.
         * If you call reject your promise is rejected with the object passed to resolve. 
         * For consistency and debugging (eg stack traces), obj should be an instanceof Error. 
         * Any errors thrown in the constructor callback will be implicitly passed to reject().
         */
        constructor(callback: (resolve: (result: R) => void, reject: (error: any) => void) => void);
        /**
         * If you call resolve in the body of the callback passed to the constructor, 
         * your promise will be fulfilled/rejected with the outcome of thenable passed to resolve.
         * If you call reject your promise is rejected with the object passed to resolve. 
         * For consistency and debugging (eg stack traces), obj should be an instanceof Error. 
         * Any errors thrown in the constructor callback will be implicitly passed to reject().
         */
        constructor(callback: (resolve: (thenable: Promise.Thenable<R>) => void, reject: (error: any) => void) => void);


        /**
         * onFulFill is called when/if "promise" resolves. onRejected is called when/if "promise" rejects. 
         * Both are optional, if either/both are omitted the next onFulfilled/onRejected in the chain is called. 
         * Both callbacks have a single parameter , the fulfillment value or rejection reason. 
         * "then" returns a new promise equivalent to the value you return from onFulfilled/onRejected after 
         * being passed through Promise.resolve. 
         * If an error is thrown in the callback, the returned promise rejects with that error.
         * 
         * @param onFulFill called when/if "promise" resolves
         * @param onReject called when/if "promise" rejects
         */
        then<U>(onFulfill: (value: R) => Promise.Thenable<U>,  onReject: (error: any) => Promise.Thenable<U>): Promise<U>;
        /**
         * onFulFill is called when/if "promise" resolves. onRejected is called when/if "promise" rejects. 
         * Both are optional, if either/both are omitted the next onFulfilled/onRejected in the chain is called. 
         * Both callbacks have a single parameter , the fulfillment value or rejection reason. 
         * "then" returns a new promise equivalent to the value you return from onFulfilled/onRejected after 
         * being passed through Promise.resolve. 
         * If an error is thrown in the callback, the returned promise rejects with that error.
         * 
         * @param onFulFill called when/if "promise" resolves
         * @param onReject called when/if "promise" rejects
         */
        then<U>(onFulfill: (value: R) => Promise.Thenable<U>, onReject?: (error: any) => U): Promise<U>;
        /**
         * onFulFill is called when/if "promise" resolves. onRejected is called when/if "promise" rejects. 
         * Both are optional, if either/both are omitted the next onFulfilled/onRejected in the chain is called. 
         * Both callbacks have a single parameter , the fulfillment value or rejection reason. 
         * "then" returns a new promise equivalent to the value you return from onFulfilled/onRejected after 
         * being passed through Promise.resolve. 
         * If an error is thrown in the callback, the returned promise rejects with that error.
         * 
         * @param onFulFill called when/if "promise" resolves
         * @param onReject called when/if "promise" rejects
         */
        then<U>(onFulfill: (value: R) => U, onReject: (error: any) => Promise.Thenable<U>): Promise<U>;
        /**
         * onFulFill is called when/if "promise" resolves. onRejected is called when/if "promise" rejects. 
         * Both are optional, if either/both are omitted the next onFulfilled/onRejected in the chain is called. 
         * Both callbacks have a single parameter , the fulfillment value or rejection reason. 
         * "then" returns a new promise equivalent to the value you return from onFulfilled/onRejected after 
         * being passed through Promise.resolve. 
         * If an error is thrown in the callback, the returned promise rejects with that error.
         * 
         * @param onFulFill called when/if "promise" resolves
         * @param onReject called when/if "promise" rejects
         */
        then<U>(onFulfill?: (value: R) => U, onReject?: (error: any) => U): Promise<U>;


        /**
         * Sugar for promise.then(undefined, onRejected)
         * 
         * @param onReject called when/if "promise" rejects
         */
        catch<U>(onReject?: (error: any) => Promise.Thenable<U>): Promise<U>;
        /**
         * Sugar for promise.then(undefined, onRejected)
         * 
         * @param onReject called when/if "promise" rejects
         */
        catch<U>(onReject?: (error: any) => U): Promise<U>;
    }

    module Promise {
        
        export interface Thenable<R> {
            then<U>(onFulfilled: (value: R) => Thenable<U>,  onRejected: (error: any) => Thenable<U>): Thenable<U>;
            then<U>(onFulfilled: (value: R) => Thenable<U>, onRejected?: (error: any) => U): Thenable<U>;
            then<U>(onFulfilled: (value: R) => U, onRejected: (error: any) => Thenable<U>): Thenable<U>;
            then<U>(onFulfilled?: (value: R) => U, onRejected?: (error: any) => U): Thenable<U>;
        }

        /**
         * Returns promise (only if promise.constructor == Promise)
         */
        function cast<R>(promise: Promise<R>): Promise<R>;
        /**
         * Make a promise that fulfills to obj.
         */
        function cast<R>(object?: R): Promise<R>;


        /**
         * Make a new promise from the thenable. 
         * A thenable is promise-like in as far as it has a "then" method. 
         * This also creates a new promise if you pass it a genuine JavaScript promise, 
         * making it less efficient for casting than Promise.cast.
         */
        function resolve<R>(thenable: Promise.Thenable<R>): Promise<R>;
        /**
         * Make a promise that fulfills to obj. Same as Promise.cast(obj) in this situation.
         */
        function resolve<R>(object?: R): Promise<R>;

        /**
         * Make a promise that rejects to obj. For consistency and debugging (eg stack traces), obj should be an instanceof Error
         */
        function reject(error?: any): Promise<any>;

        /**
         * Make a promise that fulfills when every item in the array fulfills, and rejects if (and when) any item rejects. 
         * the array passed to all can be a mixture of promise-like objects and other objects. 
         * The fulfillment value is an array (in order) of fulfillment values. The rejection value is the first rejection value.
         */
        function all<R>(promises: Promise<R>[]): Promise<R[]>;

        /**
         * Make a Promise that fulfills when any item fulfills, and rejects if any item rejects.
         */
        function race<R>(promises: Promise<R>[]): Promise<R>;
    }
    
    
    export = Promise;
}
/*tslint:disable unused*/

declare function CodeMirror(host: HTMLElement, options?: CodeMirror.EditorConfiguration): CodeMirror.Editor;
declare function CodeMirror(callback: (host: HTMLElement) => void , options?: CodeMirror.EditorConfiguration): CodeMirror.Editor;

declare module CodeMirror {
    
    interface CodeMirrorStream {
        eol(): boolean;
        sol(): boolean;
        peek(): string;
        next(): string;
        eat(match: string): string;
        eat(match: RegExp): string;
        eat(match: (char: string) => boolean): string;
        eatWhile(match: string): string;
        eatWhile(match: RegExp): string;
        eatWhile(match: (char: string) => boolean): string;
        eatSpace(): boolean;
        skipToEnd(): void;
        skipTo(ch: string): boolean;
        match(pattern: string, consume?: boolean, caseFold?: boolean): boolean;
        match(pattern: RegExp, consume?: boolean): string[];
        backUp(n: number): void;
        column(): number;
        indentation(): number;
        current(): string;
    
        pos: number;
        string: string;
    }
    
    interface CodeMirrorMode<T> {
        token(stream: CodeMirrorStream, state: T): void;
        
        startState?: () => T;
        blankLine?: (state: T) => void;
        copyState?: (state: T) => T;
        
        indent?: (state: T, textAfter: string) => number;
  
        lineComment?: string;
        blockCommentStart?: string;
        blockCommentEnd?: string;
        blockCommentLead?: string;
    
        electricChars?: string
        
    }
    
    
    interface CodeMirrorModeOptions  {
    
    }
    
    interface CodeMirrorModeFactory<T> {
        (options: CodeMirror.EditorConfiguration, spec: any): CodeMirrorMode<T>
    }

    function defineMode(id: string, modefactory: CodeMirrorModeFactory<any>): void;
    function defineMIME(mime: string, modeId: string): void;
    
    var Pass: any;

    function fromTextArea(host: HTMLTextAreaElement, options?: EditorConfiguration): CodeMirror.Editor;

    var version: string;

    /** If you want to define extra methods in terms of the CodeMirror API, it is possible to use defineExtension.
    This will cause the given value(usually a method) to be added to all CodeMirror instances created from then on. */
    function defineExtension(name: string, value: any): void;

    /** Like defineExtension, but the method will be added to the interface for Doc objects instead. */
    function defineDocExtension(name: string, value: any): void;

    /** Similarly, defineOption can be used to define new options for CodeMirror.
    The updateFunc will be called with the editor instance and the new value when an editor is initialized,
    and whenever the option is modified through setOption. */
    function defineOption(name: string, default_: any, updateFunc: Function): void;

    /** If your extention just needs to run some code whenever a CodeMirror instance is initialized, use CodeMirror.defineInitHook.
    Give it a function as its only argument, and from then on, that function will be called (with the instance as argument)
    whenever a new CodeMirror instance is initialized. */
    function defineInitHook(func: Function): void;



    function on(element: any, eventName: string, handler: Function): void;
    function off(element: any, eventName: string, handler: Function): void;

    /** Fired whenever a change occurs to the document. changeObj has a similar type as the object passed to the editor's "change" event,
    but it never has a next property, because document change events are not batched (whereas editor change events are). */
    function on(doc: Doc, eventName: 'change', handler: (instance: Doc, change: EditorChange) => void ): void;
    function off(doc: Doc, eventName: 'change', handler: (instance: Doc, change: EditorChange) => void ): void;

    /** See the description of the same event on editor instances. */
    function on(doc: Doc, eventName: 'beforeChange', handler: (instance: Doc, change: EditorChangeCancellable) => void ): void;
    function off(doc: Doc, eventName: 'beforeChange', handler: (instance: Doc, change: EditorChangeCancellable) => void ): void;

    /** Fired whenever the cursor or selection in this document changes. */
    function on(doc: Doc, eventName: 'cursorActivity', handler: (instance: CodeMirror.Editor) => void ): void;
    function off(doc: Doc, eventName: 'cursorActivity', handler: (instance: CodeMirror.Editor) => void ): void;

    /** Equivalent to the event by the same name as fired on editor instances. */
    function on(doc: Doc, eventName: 'beforeSelectionChange', 
        handler: (instance: CodeMirror.Editor, selection: { head: Position; anchor: Position; }) => void ): void;
    function off(doc: Doc, eventName: 'beforeSelectionChange', 
        handler: (instance: CodeMirror.Editor, selection: { head: Position; anchor: Position; }) => void ): void;

    /** Will be fired when the line object is deleted. A line object is associated with the start of the line.
    Mostly useful when you need to find out when your gutter markers on a given line are removed. */
    function on(line: LineHandle, eventName: 'delete', handler: () => void ): void;
    function off(line: LineHandle, eventName: 'delete', handler: () => void ): void;

    /** Fires when the line's text content is changed in any way (but the line is not deleted outright).
    The change object is similar to the one passed to change event on the editor object. */
    function on(line: LineHandle, eventName: 'change', handler: (line: LineHandle, change: EditorChange) => void ): void;
    function off(line: LineHandle, eventName: 'change', handler: (line: LineHandle, change: EditorChange) => void ): void;

    /** Fired when the cursor enters the marked range. From this event handler, the editor state may be inspected but not modified,
    with the exception that the range on which the event fires may be cleared. */
    function on(marker: TextMarker, eventName: 'beforeCursorEnter', handler: () => void ): void;
    function off(marker: TextMarker, eventName: 'beforeCursorEnter', handler: () => void ): void;

    /** Fired when the range is cleared, either through cursor movement in combination with clearOnEnter or 
     * through a call to its clear() method.
     * Will only be fired once per handle. Note that deleting the range through text editing does not fire this event,
     * because an undo action might bring the range back into existence. 
     */
    function on(marker: TextMarker, eventName: 'clear', handler: () => void ): void;
    function off(marker: TextMarker, eventName: 'clear', handler: () => void ): void;

    /** Fired when the last part of the marker is removed from the document by editing operations. */
    function on(marker: TextMarker, eventName: 'hide', handler: () => void ): void;
    function off(marker: TextMarker, eventName: 'hide', handler: () => void ): void;

    /** Fired when, after the marker was removed by editing, a undo operation brought the marker back. */
    function on(marker: TextMarker, eventName: 'unhide', handler: () => void ): void;
    function off(marker: TextMarker, eventName: 'unhide', handler: () => void ): void;

    /** Fired whenever the editor re-adds the widget to the DOM. This will happen once right after the widget is added (if it is scrolled into view),
    and then again whenever it is scrolled out of view and back in again, or when changes to the editor options
    or the line the widget is on require the widget to be redrawn. */
    function on(line: LineWidget, eventName: 'redraw', handler: () => void ): void;
    function off(line: LineWidget, eventName: 'redraw', handler: () => void ): void;

    interface Editor {
    
        /** Tells you whether the editor currently has focus. */
        hasFocus(): boolean;
    
        /** Used to find the target position for horizontal cursor motion.start is a { line , ch } object,
        amount an integer(may be negative), and unit one of the string "char", "column", or "word".
        Will return a position that is produced by moving amount times the distance specified by unit.
        When visually is true , motion in right - to - left text will be visual rather than logical.
        When the motion was clipped by hitting the end or start of the document, the returned value will have a hitSide property set to true. */
        findPosH(start: CodeMirror.Position, amount: number, unit: string, visually: boolean): { line: number; ch: number; hitSide?: boolean; };
    
        /** Similar to findPosH , but used for vertical motion.unit may be "line" or "page".
        The other arguments and the returned value have the same interpretation as they have in findPosH. */
        findPosV(start: CodeMirror.Position, amount: number, unit: string): { line: number; ch: number; hitSide?: boolean; };
    
    
        /** Change the configuration of the editor. option should the name of an option, and value should be a valid value for that option. */
        setOption(option: string, value: any): void;
    
        /** Retrieves the current value of the given option for this editor instance. */
        getOption(option: string): any;
    
        /** Attach an additional keymap to the editor.
        This is mostly useful for add - ons that need to register some key handlers without trampling on the extraKeys option.
        Maps added in this way have a higher precedence than the extraKeys and keyMap options, and between them,
        the maps added earlier have a lower precedence than those added later, unless the bottom argument was passed,
        in which case they end up below other keymaps added with this method. */
        addKeyMap(map: any, bottom?: boolean): void;
    
        /** Disable a keymap added with addKeyMap.Either pass in the keymap object itself , or a string,
        which will be compared against the name property of the active keymaps. */
        removeKeyMap(map: any): void;
    
        /** Enable a highlighting overlay.This is a stateless mini - mode that can be used to add extra highlighting.
        For example, the search add - on uses it to highlight the term that's currently being searched.
        mode can be a mode spec or a mode object (an object with a token method). The options parameter is optional. If given, it should be an object.
        Currently, only the opaque option is recognized. This defaults to off, but can be given to allow the overlay styling, when not null,
        to override the styling of the base mode entirely, instead of the two being applied together. */
        addOverlay(mode: any, options?: any): void;
    
        /** Pass this the exact argument passed for the mode parameter to addOverlay to remove an overlay again. */
        removeOverlay(mode: any): void;
    
    
        /** Retrieve the currently active document from an editor. */
        getDoc(): CodeMirror.Doc;
    
        /** Attach a new document to the editor. Returns the old document, which is now no longer associated with an editor. */
        swapDoc(doc: CodeMirror.Doc): CodeMirror.Doc;
    
    
    
        /** Sets the gutter marker for the given gutter (identified by its CSS class, see the gutters option) to the given value.
        Value can be either null, to clear the marker, or a DOM element, to set it. The DOM element will be shown in the specified gutter next to the specified line. */
        setGutterMarker(line: any, gutterID: string, value: HTMLElement): CodeMirror.LineHandle;
    
        /** Remove all gutter markers in the gutter with the given ID. */
        clearGutter(gutterID: string): void;
    
        /** Set a CSS class name for the given line.line can be a number or a line handle.
        where determines to which element this class should be applied, can can be one of "text" (the text element, which lies in front of the selection),
        "background"(a background element that will be behind the selection),
        or "wrap" (the wrapper node that wraps all of the line's elements, including gutter elements).
        class should be the name of the class to apply. */
        addLineClass(line: any, where: string, _class_: string): CodeMirror.LineHandle;
    
        /** Remove a CSS class from a line.line can be a line handle or number.
        where should be one of "text", "background", or "wrap"(see addLineClass).
        class can be left off to remove all classes for the specified node, or be a string to remove only a specific class. */
        removeLineClass(line: any, where: string, class_: string): CodeMirror.LineHandle;
    
        /** Returns the line number, text content, and marker status of the given line, which can be either a number or a line handle. */
        lineInfo(line: any): {
            line: any;
            handle: any;
            text: string;
            /** Object mapping gutter IDs to marker elements. */
            gutterMarks: any;
            textClass: string;
            bgClass: string;
            wrapClass: string;
            /** Array of line widgets attached to this line. */
            widgets: any;
        };
    
        /** Puts node, which should be an absolutely positioned DOM node, into the editor, positioned right below the given { line , ch } position.
        When scrollIntoView is true, the editor will ensure that the entire node is visible (if possible).
        To remove the widget again, simply use DOM methods (move it somewhere else, or call removeChild on its parent). */
        addWidget(pos: CodeMirror.Position, node: HTMLElement, scrollIntoView: boolean):  void;
    
        /** Adds a line widget, an element shown below a line, spanning the whole of the editor's width, and moving the lines below it downwards.
        line should be either an integer or a line handle, and node should be a DOM node, which will be displayed below the given line.
        options, when given, should be an object that configures the behavior of the widget.
        Note that the widget node will become a descendant of nodes with CodeMirror-specific CSS classes, and those classes might in some cases affect it. */
        addLineWidget(line: any, node: HTMLElement, options?: {
            /** Whether the widget should cover the gutter. */
            coverGutter: boolean;
            /** Whether the widget should stay fixed in the face of horizontal scrolling. */
            noHScroll: boolean;
            /** Causes the widget to be placed above instead of below the text of the line. */
            above: boolean;
            /** When true, will cause the widget to be rendered even if the line it is associated with is hidden. */
            showIfHidden: boolean;
        }): CodeMirror.LineWidget;
    
    
        /** Programatically set the size of the editor (overriding the applicable CSS rules).
        width and height height can be either numbers(interpreted as pixels) or CSS units ("100%", for example).
        You can pass null for either of them to indicate that that dimension should not be changed. */
        setSize(width: any, height: any):  void;
    
        /** Scroll the editor to a given(pixel) position.Both arguments may be left as null or undefined to have no effect. */
        scrollTo(x: number, y: number):  void;
    
        /** Get an { left , top , width , height , clientWidth , clientHeight } object that represents the current scroll position, the size of the scrollable area,
        and the size of the visible area(minus scrollbars). */
        getScrollInfo(): {
            left: any;
            top: any;
            width: any;
            height: any;
            clientWidth: any;
            clientHeight: any;
        };
    
        /** Scrolls the given element into view. pos is a { line , ch } position, referring to a given character, null, to refer to the cursor.
        The margin parameter is optional. When given, it indicates the amount of pixels around the given area that should be made visible as well. */
        scrollIntoView(pos: CodeMirror.Position, margin?: number):  void;
    
        /** Scrolls the given element into view. pos is a { left , top , right , bottom } object, in editor-local coordinates.
        The margin parameter is optional. When given, it indicates the amount of pixels around the given area that should be made visible as well. */
        scrollIntoView(pos: { left: number; top: number; right: number; bottom: number; }, margin: number):  void;
    
        /** Returns an { left , top , bottom } object containing the coordinates of the cursor position.
        If mode is "local" , they will be relative to the top-left corner of the editable document.
        If it is "page" or not given, they are relative to the top-left corner of the page.
        where is a boolean indicating whether you want the start(true) or the end(false) of the selection. */
        cursorCoords(where: boolean, mode: string): { left: number; top: number; bottom: number; };
    
        /** Returns an { left , top , bottom } object containing the coordinates of the cursor position.
        If mode is "local" , they will be relative to the top-left corner of the editable document.
        If it is "page" or not given, they are relative to the top-left corner of the page.
        where specifies the precise position at which you want to measure. */
        cursorCoords(where: CodeMirror.Position, mode: string): { left: number; top: number; bottom: number; };
    
        /** Returns the position and dimensions of an arbitrary character.pos should be a { line , ch } object.
        This differs from cursorCoords in that it'll give the size of the whole character,
        rather than just the position that the cursor would have when it would sit at that position. */
        charCoords(pos: CodeMirror.Position, mode: string): { left: number; right: number; top: number; bottom: number; };
    
        /** Given an { left , top } object , returns the { line , ch } position that corresponds to it.
        The optional mode parameter determines relative to what the coordinates are interpreted. It may be "window" , "page"(the default) , or "local". */
        coordsChar(object: { left: number; top: number; }, mode?: string): CodeMirror.Position;
    
        /** Returns the line height of the default font for the editor. */
        defaultTextHeight(): number;
    
        /** Returns the pixel width of an 'x' in the default font for the editor.
        (Note that for non - monospace fonts , this is mostly useless, and even for monospace fonts, non - ascii characters might have a different width). */
        defaultCharWidth(): number;
    
        /** Returns a { from , to } object indicating the start (inclusive) and end (exclusive) of the currently rendered part of the document.
        In big documents, when most content is scrolled out of view, CodeMirror will only render the visible part, and a margin around it.
        See also the viewportChange event. */
        getViewport(): { from: number; to: number };
    
        /** If your code does something to change the size of the editor element (window resizes are already listened for), or unhides it,
        you should probably follow up by calling this method to ensure CodeMirror is still looking as intended. */
        refresh():  void;
    
    
        /** Retrieves information about the token the current mode found before the given position (a {line, ch} object). */
        getTokenAt(pos: CodeMirror.Position): {
            /** The character(on the given line) at which the token starts. */
            start: number;
            /** The character at which the token ends. */
            end: number;
            /** The token's string. */
            string: string;
            /** The token type the mode assigned to the token, such as "keyword" or "comment" (may also be null). */
            type: string;
            /** The mode's state at the end of this token. */
            state: any;            
        };
    
        /** Returns the mode's parser state, if any, at the end of the given line number.
        If no line number is given, the state at the end of the document is returned.
        This can be useful for storing parsing errors in the state, or getting other kinds of contextual information for a line. */
        getStateAfter(line?: number): any;
    
        /** CodeMirror internally buffers changes and only updates its DOM structure after it has finished performing some operation.
        If you need to perform a lot of operations on a CodeMirror instance, you can call this method with a function argument.
        It will call the function, buffering up all changes, and only doing the expensive update after the function returns.
        This can be a lot faster. The return value from this method will be the return value of your function. */
        operation<T>(fn: ()=> T): T;
    
        /** Adjust the indentation of the given line.
        The second argument (which defaults to "smart") may be one of:
        "prev" Base indentation on the indentation of the previous line.
        "smart" Use the mode's smart indentation if available, behave like "prev" otherwise.
        "add" Increase the indentation of the line by one indent unit.
        "subtract" Reduce the indentation of the line. */
        indentLine(line: number, dir?: string):  void;
    
    
        /** Give the editor focus. */
        focus():  void;
    
        /** Returns the hidden textarea used to read input. */
        getInputField(): HTMLTextAreaElement;
    
        /** Returns the DOM node that represents the editor, and controls its size. Remove this from your tree to delete an editor instance. */
        getWrapperElement(): HTMLElement;
    
        /** Returns the DOM node that is responsible for the scrolling of the editor. */
        getScrollerElement(): HTMLElement;
    
        /** Fetches the DOM node that contains the editor gutters. */
        getGutterElement(): HTMLElement;
    
    
    
        /** Events are registered with the on method (and removed with the off method).
        These are the events that fire on the instance object. The name of the event is followed by the arguments that will be passed to the handler.
        The instance argument always refers to the editor instance. */
        on(eventName: string, handler: (instance: CodeMirror.Editor) => void ):  void;
        off(eventName: string, handler: (instance: CodeMirror.Editor) => void ):  void;
    
        /** Fires every time the content of the editor is changed. */
        on(eventName: 'change', handler: (instance: CodeMirror.Editor, change: CodeMirror.EditorChangeLinkedList) => void ):  void;
        off(eventName: 'change', handler: (instance: CodeMirror.Editor, change: CodeMirror.EditorChangeLinkedList) => void ):  void;
    
        /** This event is fired before a change is applied, and its handler may choose to modify or cancel the change.
        The changeObj never has a next property, since this is fired for each individual change, and not batched per operation.
        Note: you may not do anything from a "beforeChange" handler that would cause changes to the document or its visualization.
        Doing so will, since this handler is called directly from the bowels of the CodeMirror implementation,
        probably cause the editor to become corrupted. */
        on(eventName: 'beforeChange', handler: (instance: CodeMirror.Editor, change: CodeMirror.EditorChangeCancellable) => void ):  void;
        off(eventName: 'beforeChange', handler: (instance: CodeMirror.Editor, change: CodeMirror.EditorChangeCancellable) => void ):  void;
    
        /** Will be fired when the cursor or selection moves, or any change is made to the editor content. */
        on(eventName: 'cursorActivity', handler: (instance: CodeMirror.Editor) => void ):  void;
        off(eventName: 'cursorActivity', handler: (instance: CodeMirror.Editor) => void ):  void;
    
        /** This event is fired before the selection is moved. Its handler may modify the resulting selection head and anchor.
        Handlers for this event have the same restriction as "beforeChange" handlers � they should not do anything to directly update the state of the editor. */
        on(eventName: 'beforeSelectionChange', handler: (instance: CodeMirror.Editor, selection: { head: CodeMirror.Position; anchor: CodeMirror.Position; }) => void ):  void;
        off(eventName: 'beforeSelectionChange', handler: (instance: CodeMirror.Editor, selection: { head: CodeMirror.Position; anchor: CodeMirror.Position; }) => void ):  void;
    
        /** Fires whenever the view port of the editor changes (due to scrolling, editing, or any other factor).
        The from and to arguments give the new start and end of the viewport. */
        on(eventName: 'viewportChange', handler: (instance: CodeMirror.Editor, from: number, to: number) => void ):  void;
        off(eventName: 'viewportChange', handler: (instance: CodeMirror.Editor, from: number, to: number) => void ):  void;
    
        /** Fires when the editor gutter (the line-number area) is clicked. Will pass the editor instance as first argument,
        the (zero-based) number of the line that was clicked as second argument, the CSS class of the gutter that was clicked as third argument,
        and the raw mousedown event object as fourth argument. */
        on(eventName: 'gutterClick', handler: (instance: CodeMirror.Editor, line: number, gutter: string, clickEvent: Event) => void ):  void;
        off(eventName: 'gutterClick', handler: (instance: CodeMirror.Editor, line: number, gutter: string, clickEvent: Event) => void ):  void;
    
        /** Fires whenever the editor is focused. */
        on(eventName: 'focus', handler: (instance: CodeMirror.Editor) => void ):  void;
        off(eventName: 'focus', handler: (instance: CodeMirror.Editor) => void ):  void;
    
        /** Fires whenever the editor is unfocused. */
        on(eventName: 'blur', handler: (instance: CodeMirror.Editor) => void ):  void;
        off(eventName: 'blur', handler: (instance: CodeMirror.Editor) => void ):  void;
    
        /** Fires when the editor is scrolled. */
        on(eventName: 'scroll', handler: (instance: CodeMirror.Editor) => void ):  void;
        off(eventName: 'scroll', handler: (instance: CodeMirror.Editor) => void ):  void;
    
        /** Will be fired whenever CodeMirror updates its DOM display. */
        on(eventName: 'update', handler: (instance: CodeMirror.Editor) => void ):  void;
        off(eventName: 'update', handler: (instance: CodeMirror.Editor) => void ):  void;
    
        /** Fired whenever a line is (re-)rendered to the DOM. Fired right after the DOM element is built, before it is added to the document.
        The handler may mess with the style of the resulting element, or add event handlers, but should not try to change the state of the editor. */
        on(eventName: 'renderLine', handler: (instance: CodeMirror.Editor, line: number, element: HTMLElement) => void ):  void;
        off(eventName: 'renderLine', handler: (instance: CodeMirror.Editor, line: number, element: HTMLElement) => void ): void;
    }

    class Doc {
        constructor (text: string, mode?: any, firstLineNumber?: number);

        /** Get the current editor content. You can pass it an optional argument to specify the string to be used to separate lines (defaults to "\n"). */
        getValue(seperator?: string): string;

        /** Set the editor content. */
        setValue(content: string): void;

        /** Get the text between the given points in the editor, which should be {line, ch} objects.
        An optional third argument can be given to indicate the line separator string to use (defaults to "\n"). */
        getRange(from: Position, to: CodeMirror.Position, seperator?: string): string;

        /** Replace the part of the document between from and to with the given string.
        from and to must be {line, ch} objects. to can be left off to simply insert the string at position from. */
        replaceRange(replacement: string, from: CodeMirror.Position, to: CodeMirror.Position): void;

        /** Get the content of line n. */
        getLine(n: number): string;

        /** Set the content of line n. */
        setLine(n: number, text: string): void;

        /** Remove the given line from the document. */
        removeLine(n: number): void;

        /** Get the number of lines in the editor. */
        lineCount(): number;

        /** Get the first line of the editor. This will usually be zero but for linked sub-views,
        or documents instantiated with a non-zero first line, it might return other values. */
        firstLine(): number;

        /** Get the last line of the editor. This will usually be lineCount() - 1, but for linked sub-views, it might return other values. */
        lastLine(): number;

        /** Fetches the line handle for the given line number. */
        getLineHandle(num: number): CodeMirror.LineHandle;

        /** Given a line handle, returns the current position of that line (or null when it is no longer in the document). */
        getLineNumber(handle: CodeMirror.LineHandle): number;

        /** Iterate over the whole document, and call f for each line, passing the line handle.
        This is a faster way to visit a range of line handlers than calling getLineHandle for each of them.
        Note that line handles have a text property containing the line's content (as a string). */
        eachLine(f: (line: CodeMirror.LineHandle) => void ): void;

        /** Iterate over the range from start up to (not including) end, and call f for each line, passing the line handle.
        This is a faster way to visit a range of line handlers than calling getLineHandle for each of them.
        Note that line handles have a text property containing the line's content (as a string). */
        eachLine(start: number, end: number, f: (line: CodeMirror.LineHandle) => void ): void;

        /** Set the editor content as 'clean', a flag that it will retain until it is edited, and which will be set again when such an edit is undone again.
        Useful to track whether the content needs to be saved. */
        markClean(): void;

        /** Returns whether the document is currently clean (not modified since initialization or the last call to markClean). */
        isClean(): boolean;



        /** Get the currently selected code. */
        getSelection(): string;

        /** Replace the selection with the given string. By default, the new selection will span the inserted text.
        The optional collapse argument can be used to change this � passing "start" or "end" will collapse the selection to the start or end of the inserted text. */
        replaceSelection(replacement: string, collapse?: string): void;

        /** start is a an optional string indicating which end of the selection to return.
        It may be "start" , "end" , "head"(the side of the selection that moves when you press shift + arrow),
        or "anchor"(the fixed side of the selection).Omitting the argument is the same as passing "head".A { line , ch } object will be returned. */
        getCursor(start?: string): CodeMirror.Position;

        /** Return true if any text is selected. */
        somethingSelected(): boolean;

        /** Set the cursor position.You can either pass a single { line , ch } object , or the line and the character as two separate parameters. */
        setCursor(pos: CodeMirror.Position): void;

        /** Set the selection range.anchor and head should be { line , ch } objects.head defaults to anchor when not given. */
        setSelection(anchor: CodeMirror.Position, head: CodeMirror.Position): void;

        /** Similar to setSelection , but will, if shift is held or the extending flag is set,
        move the head of the selection while leaving the anchor at its current place.
        pos2 is optional , and can be passed to ensure a region (for example a word or paragraph) will end up selected
        (in addition to whatever lies between that region and the current anchor). */
        extendSelection(from: CodeMirror.Position, to?: CodeMirror.Position): void;

        /** Sets or clears the 'extending' flag , which acts similar to the shift key,
        in that it will cause cursor movement and calls to extendSelection to leave the selection anchor in place. */
        setExtending(value: boolean): void;


        /** Retrieve the editor associated with a document. May return null. */
        getEditor(): CodeMirror.Editor;


        /** Create an identical copy of the given doc. When copyHistory is true , the history will also be copied.Can not be called directly on an editor. */
        copy(copyHistory: boolean): CodeMirror.Doc;

        /** Create a new document that's linked to the target document. Linked documents will stay in sync (changes to one are also applied to the other) until unlinked. */
        linkedDoc(options: {
            /** When turned on, the linked copy will share an undo history with the original.
            Thus, something done in one of the two can be undone in the other, and vice versa. */
            sharedHist?: boolean;
            from?: number;
            /** Can be given to make the new document a subview of the original. Subviews only show a given range of lines.
            Note that line coordinates inside the subview will be consistent with those of the parent,
            so that for example a subview starting at line 10 will refer to its first line as line 10, not 0. */
            to?: number;
            /** By default, the new document inherits the mode of the parent. This option can be set to a mode spec to give it a different mode. */
            mode: any;
        }): CodeMirror.Doc;

        /** Break the link between two documents. After calling this , changes will no longer propagate between the documents,
        and, if they had a shared history, the history will become separate. */
        unlinkDoc(doc: CodeMirror.Doc): void;

        /** Will call the given function for all documents linked to the target document. It will be passed two arguments,
        the linked document and a boolean indicating whether that document shares history with the target. */
        iterLinkedDocs(fn: (doc: CodeMirror.Doc, sharedHist: boolean) => void ): void;

        /** Undo one edit (if any undo events are stored). */
        undo(): void;

        /** Redo one undone edit. */
        redo(): void;

        /** Returns an object with {undo, redo } properties , both of which hold integers , indicating the amount of stored undo and redo operations. */
        historySize(): { undo: number; redo: number; };

        /** Clears the editor's undo history. */
        clearHistory(): void;

        /** Get a(JSON - serializeable) representation of the undo history. */
        getHistory(): any;

        /** Replace the editor's undo history with the one provided, which must be a value as returned by getHistory.
        Note that this will have entirely undefined results if the editor content isn't also the same as it was when getHistory was called. */
        setHistory(history: any): void;


        /** Can be used to mark a range of text with a specific CSS class name. from and to should be { line , ch } objects. */
        markText(from: CodeMirror.Position, to: CodeMirror.Position, options?: CodeMirror.TextMarkerOptions): TextMarker;

        /** Inserts a bookmark, a handle that follows the text around it as it is being edited, at the given position.
        A bookmark has two methods find() and clear(). The first returns the current position of the bookmark, if it is still in the document,
        and the second explicitly removes the bookmark. */
        setBookmark(pos: CodeMirror.Position, options?: {
            /** Can be used to display a DOM node at the current location of the bookmark (analogous to the replacedWith option to markText). */
            widget?: HTMLElement;

            /** By default, text typed when the cursor is on top of the bookmark will end up to the right of the bookmark.
            Set this option to true to make it go to the left instead. */
            insertLeft?: boolean;
        }): CodeMirror.TextMarker;

        /** Returns an array of all the bookmarks and marked ranges present at the given position. */
        findMarksAt(pos: CodeMirror.Position): TextMarker[];
        
        /** Returns an array containing all marked ranges in the document. */
        getAllMarks(): CodeMirror.TextMarker[];


        /** Gets the mode object for the editor. Note that this is distinct from getOption("mode"), which gives you the mode specification,
        rather than the resolved, instantiated mode object. */
        getMode(): any;

        /** Calculates and returns a { line , ch } object for a zero-based index whose value is relative to the start of the editor's text.
        If the index is out of range of the text then the returned object is clipped to start or end of the text respectively. */
        posFromIndex(index: number): CodeMirror.Position;

        /** The reverse of posFromIndex. */
        indexFromPos(object: CodeMirror.Position): number;

    }

    interface LineHandle {
        text: string;
    }

    interface TextMarker {
        /** Remove the mark. */
        clear(): void;

        /** Returns a {from, to} object (both holding document positions), indicating the current position of the marked range,
        or undefined if the marker is no longer in the document. */
        find(): CodeMirror.Position;

        /**  Returns an object representing the options for the marker. If copyWidget is given true, it will clone the value of the replacedWith option, if any. */
        getOptions(copyWidget: boolean): CodeMirror.TextMarkerOptions;
    }

    interface LineWidget {
        /** Removes the widget. */
        clear(): void;

        /** Call this if you made some change to the widget's DOM node that might affect its height.
        It'll force CodeMirror to update the height of the line that contains the widget. */
        changed(): void;
    }

    interface EditorChange {
        /** Position (in the pre-change coordinate system) where the change started. */
        from: CodeMirror.Position;
        /** Position (in the pre-change coordinate system) where the change ended. */
        to: CodeMirror.Position;
        /** Array of strings representing the text that replaced the changed range (split by line). */
        text: string[];
        /**  Text that used to be between from and to, which is overwritten by this change. */
        removed: string[];
    }

    interface EditorChangeLinkedList extends CodeMirror.EditorChange {
        /** Points to another change object (which may point to another, etc). */
        next?: CodeMirror.EditorChangeLinkedList;
    }

    interface EditorChangeCancellable extends CodeMirror.EditorChange {
        /** may be used to modify the change. All three arguments to update are optional, and can be left off to leave the existing value for that field intact. */
        update(from?: CodeMirror.Position, to?: CodeMirror.Position, text?: string): void;

        cancel(): void;
    }

    interface Position {
        ch: number;
        line: number;
    }

    interface EditorConfiguration {
        /** string| The starting value of the editor. Can be a string, or a document object. */
        value?: any;

        /** string|object. The mode to use. When not given, this will default to the first mode that was loaded.
        It may be a string, which either simply names the mode or is a MIME type associated with the mode.
        Alternatively, it may be an object containing configuration options for the mode,
        with a name property that names the mode (for example {name: "javascript", json: true}). */
        mode?: any;

        /** The theme to style the editor with. You must make sure the CSS file defining the corresponding .cm-s-[name] styles is loaded.
        The default is "default". */
        theme?: string;

        /** How many spaces a block (whatever that means in the edited language) should be indented. The default is 2. */
        indentUnit?: number;

        /** Whether to use the context-sensitive indentation that the mode provides (or just indent the same as the line before). Defaults to true. */
        smartIndent?: boolean;

        /** The width of a tab character. Defaults to 4. */
        tabSize?: number;

        /** Whether, when indenting, the first N*tabSize spaces should be replaced by N tabs. Default is false. */
        indentWithTabs?: boolean;

        /** Configures whether the editor should re-indent the current line when a character is typed
        that might change its proper indentation (only works if the mode supports indentation). Default is true. */
        electricChars?: boolean;
        
        /** Determines whether horizontal cursor movement through right-to-left (Arabic, Hebrew) text
        is visual (pressing the left arrow moves the cursor left)
        or logical (pressing the left arrow moves to the next lower index in the string, which is visually right in right-to-left text).
        The default is false on Windows, and true on other platforms. */
        rtlMoveVisually?: boolean;

        /** Configures the keymap to use. The default is "default", which is the only keymap defined in codemirror.js itself.
        Extra keymaps are found in the keymap directory. See the section on keymaps for more information. */
        keyMap?: string;
        
        /** Can be used to specify extra keybindings for the editor, alongside the ones defined by keyMap. Should be either null, or a valid keymap value. */
        extraKeys?: any;
        
        /** Whether CodeMirror should scroll or wrap for long lines. Defaults to false (scroll). */
        lineWrapping?: boolean;
        
        /** Whether to show line numbers to the left of the editor. */
        lineNumbers?: boolean;
        
        /** At which number to start counting lines. Default is 1. */
        firstLineNumber?: number;

        /** A function used to format line numbers. The function is passed the line number, and should return a string that will be shown in the gutter. */
        lineNumberFormatter?: (line: number) => string;

        /** Can be used to add extra gutters (beyond or instead of the line number gutter).
        Should be an array of CSS class names, each of which defines a width (and optionally a background),
        and which will be used to draw the background of the gutters.
        May include the CodeMirror-linenumbers class, in order to explicitly set the position of the line number gutter
        (it will default to be to the right of all other gutters). These class names are the keys passed to setGutterMarker. */
        gutters?: string[];
        
        /** Determines whether the gutter scrolls along with the content horizontally (false)
        or whether it stays fixed during horizontal scrolling (true, the default). */
        fixedGutter?: boolean;
        
        /** boolean|string. This disables editing of the editor content by the user. If the special value "nocursor" is given (instead of simply true), focusing of the editor is also disallowed. */
        readOnly?: any;
        
        /**Whether the cursor should be drawn when a selection is active. Defaults to false. */
        showCursorWhenSelecting?: boolean;
        
        /** The maximum number of undo levels that the editor stores. Defaults to 40. */
        undoDepth?: number;
        
        /** The period of inactivity (in milliseconds) that will cause a new history event to be started when typing or deleting. Defaults to 500. */
        historyEventDelay?: number;
        
        /** The tab index to assign to the editor. If not given, no tab index will be assigned. */
        tabindex?: number;

        /** Can be used to make CodeMirror focus itself on initialization. Defaults to off.
        When fromTextArea is used, and no explicit value is given for this option, it will be set to true when either the source textarea is focused,
        or it has an autofocus attribute and no other element is focused. */
        autofocus?: boolean;

        /** Controls whether drag-and - drop is enabled. On by default. */
        dragDrop?: boolean;

        /** When given , this will be called when the editor is handling a dragenter , dragover , or drop event.
        It will be passed the editor instance and the event object as arguments.
        The callback can choose to handle the event itself , in which case it should return true to indicate that CodeMirror should not do anything further. */
        onDragEvent?: (instance: CodeMirror.Editor, event: Event) => boolean;

        /** This provides a rather low - level hook into CodeMirror's key handling.
        If provided, this function will be called on every keydown, keyup, and keypress event that CodeMirror captures.
        It will be passed two arguments, the editor instance and the key event.
        This key event is pretty much the raw key event, except that a stop() method is always added to it.
        You could feed it to, for example, jQuery.Event to further normalize it.
        This function can inspect the key event, and handle it if it wants to.
        It may return true to tell CodeMirror to ignore the event.
        Be wary that, on some browsers, stopping a keydown does not stop the keypress from firing, whereas on others it does.
        If you respond to an event, you should probably inspect its type property and only do something when it is keydown
        (or keypress for actions that need character data). */
        onKeyEvent?: (instance: CodeMirror.Editor, event: Event) => boolean;

        /** Half - period in milliseconds used for cursor blinking. The default blink rate is 530ms. */
        cursorBlinkRate?: number;

        /** Determines the height of the cursor. Default is 1 , meaning it spans the whole height of the line.
        For some fonts (and by some tastes) a smaller height (for example 0.85),
        which causes the cursor to not reach all the way to the bottom of the line, looks better */
        cursorHeight?: number;

        /** Highlighting is done by a pseudo background - thread that will work for workTime milliseconds,
        and then use timeout to sleep for workDelay milliseconds.
        The defaults are 200 and 300, you can change these options to make the highlighting more or less aggressive. */
        workTime?: number;

        /** See workTime. */
        workDelay?: number;

        /** Indicates how quickly CodeMirror should poll its input textarea for changes(when focused).
        Most input is captured by events, but some things, like IME input on some browsers, don't generate events that allow CodeMirror to properly detect it.
        Thus, it polls. Default is 100 milliseconds. */
        pollInterval?: number;

        /** By default, CodeMirror will combine adjacent tokens into a single span if they have the same class.
        This will result in a simpler DOM tree, and thus perform better. With some kinds of styling(such as rounded corners),
        this will change the way the document looks. You can set this option to false to disable this behavior. */
        flattenSpans?: boolean;

        /** When highlighting long lines, in order to stay responsive, the editor will give up and simply style
        the rest of the line as plain text when it reaches a certain position. The default is 10000.
        You can set this to Infinity to turn off this behavior. */
        maxHighlightLength?: number;

        /** Specifies the amount of lines that are rendered above and below the part of the document that's currently scrolled into view.
        This affects the amount of updates needed when scrolling, and the amount of work that such an update does.
        You should usually leave it at its default, 10. Can be set to Infinity to make sure the whole document is always rendered,
        and thus the browser's text search works on it. This will have bad effects on performance of big documents. */
        viewportMargin?: number;
    }

    interface TextMarkerOptions {
        /** Assigns a CSS class to the marked stretch of text. */
        className?: string;
        
        /** Determines whether text inserted on the left of the marker will end up inside or outside of it. */
        inclusiveLeft?: boolean;
        
        /** Like inclusiveLeft , but for the right side. */
        inclusiveRight?: boolean;
        
        /** Atomic ranges act as a single unit when cursor movement is concerned � i.e. it is impossible to place the cursor inside of them.
        In atomic ranges, inclusiveLeft and inclusiveRight have a different meaning � they will prevent the cursor from being placed
        respectively directly before and directly after the range. */
        atomic?: boolean;
        
        /** Collapsed ranges do not show up in the display.Setting a range to be collapsed will automatically make it atomic. */
        collapsed?: boolean;
        
        /** When enabled, will cause the mark to clear itself whenever the cursor enters its range.
        This is mostly useful for text - replacement widgets that need to 'snap open' when the user tries to edit them.
        The "clear" event fired on the range handle can be used to be notified when this happens. */
        clearOnEnter?: boolean;
        
        /** Use a given node to display this range.Implies both collapsed and atomic.
        The given DOM node must be an inline element(as opposed to a block element). */
        replacedWith?: HTMLElement;
        
        /** A read - only span can, as long as it is not cleared, not be modified except by calling setValue to reset the whole document.
        Note: adding a read - only span currently clears the undo history of the editor,
        because existing undo events being partially nullified by read - only spans would corrupt the history (in the current implementation). */
        readOnly?: boolean;
        
        /** When set to true (default is false), adding this marker will create an event in the undo history that can be individually undone(clearing the marker). */
        addToHistory?: boolean;
        
        /** Can be used to specify an extra CSS class to be applied to the leftmost span that is part of the marker. */
        startStyle?: string;
        
        /** Equivalent to startStyle, but for the rightmost span. */
        endStyle?: string;
        
        /** When the target document is linked to other documents, you can set shared to true to make the marker appear in all documents.
        By default, a marker appears only in its target document. */
        shared?: boolean;
    }
}
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


///<reference path="./codemirror.d.ts" />



//--------------------------------------------------------------------------
//
//  Brackets declaration files
//
//--------------------------------------------------------------------------




declare module brackets {


    //--------------------------------------------------------------------------
    //
    //  FileSystem
    //
    //--------------------------------------------------------------------------

    /**
     * FileSystem is a model object representing a complete file system. This object creates
     * and manages File and Directory instances, dispatches events when the file system changes,
     * and provides methods for showing 'open' and 'save' dialogs.
     *
     * The FileSystem must be initialized very early during application startup.
     *
     * There are three ways to get File or Directory instances:
     *    * Use FileSystem.resolve() to convert a path to a File/Directory object. This will only
     *      succeed if the file/directory already exists.
     *    * Use FileSystem.getFileForPath()/FileSystem.getDirectoryForPath() if you know the
     *      file/directory already exists, or if you want to create a new entry.
     *    * Use Directory.getContents() to return all entries for the specified Directory.
     *
     * FileSystem dispatches the following events:
     *    change - Sent whenever there is a change in the file system. The handler
     *          is passed one argument -- entry. This argument can be...
     *          *  a File - the contents of the file have changed, and should be reloaded.
     *          *  a Directory - an immediate child of the directory has been added, removed,
     *             or renamed/moved. Not triggered for "grandchildren".
     *          *  null - a 'wholesale' change happened, and you should assume everything may
     *             have changed.
     *          For changes made externally, there may be a significant delay before a "change" event
     *          is dispatched.
     *    rename - Sent whenever a File or Directory is renamed. All affected File and Directory
     *          objects have been updated to reflect the new path by the time this event is dispatched.
     *          This event should be used to trigger any UI updates that may need to occur when a path
     *          has changed.
     *
     * FileSystem may perform caching. But it guarantees:
     *    * File contents & metadata - reads are guaranteed to be up to date (cached data is not used
     *      without first veryifying it is up to date).
     *    * Directory structure / file listing - reads may return cached data immediately, which may not
     *      reflect external changes made recently. (However, changes made via FileSystem itself are always
     *      reflected immediately, as soon as the change operation's callback signals success).
     *
     * The FileSystem doesn't directly read or write contents--this work is done by a low-level
     * implementation object. This allows client code to use the FileSystem API without having to
     * worry about the underlying storage, which could be a local filesystem or a remote server.
     */
    interface FileSystem {
        // should not expose thoses method one
        //init(impl, callback)
        //close(callback)
        //shouldShow

        /**
         * Return a File object for the specified path.This file may not yet exist on disk.
         *
         * @param path Absolute path of file.
         */
        getFileForPath(path: string): File;

        /**
         * Return a Directory object for the specified path.This directory may not yet exist on disk.
         *
         * @param path Absolute path of directory.
         */
        getDirectoryForPath(path: string): Directory;

         /**
         * Resolve a path.
         *
         * @param path The path to resolve
         * @param callback Callback resolved  with a FileSystemError string or with the entry for the provided path.
         */
        resolve(path: string, callback: (err: string, entry: FileSystemEntry, stat: FileSystemStats) => any): void;


         /**
         * Show an "Open" dialog and return the file(s)/directories selected by the user.
         *
         * @param allowMultipleSelection Allows selecting more than one file at a time
         * @param chooseDirectories Allows directories to be opened
         * @param title The title of the dialog
         * @param initialPath The folder opened inside the window initially. If initialPath
         *                          is not set, or it doesn't exist, the window would show the last
         *                          browsed folder depending on the OS preferences
         * @param fileTypes List of extensions that are allowed to be opened. A null value
         *                          allows any extension to be selected.
         * @param callback Callback resolved with a FileSystemError
         *                          string or the selected file(s)/directories. If the user cancels the
         *                          open dialog, the error will be falsy and the file/directory array will
         *                          be empty.
         */
        showOpenDialog(allowMultipleSelection: boolean, chooseDirectories: boolean, title: string, initialPath: string,
            fileTypes: string[], callback: (err: string, files: string[]) => any): void;

        /**
         * Show a "Save" dialog and return the path of the file to save.
         *
         * @param title The title of the dialog.
         * @param initialPath The folder opened inside the window initially. If initialPath
         *                          is not set, or it doesn't exist, the window would show the last
         *                          browsed folder depending on the OS preferences.
         * @param proposedNewFilename Provide a new file name for the user. This could be based on
         *                          on the current file name plus an additional suffix
         * @param callback Callback that is resolved with a FileSystemError
         *                          string or the name of the file to save. If the user cancels the save,
         *                          the error will be falsy and the name will be empty.
         */
        showSaveDialog(title: string, initialPath: string, proposedNewFilename: string, callback: (err: string, file: string) => any): void;

        /**
         * Start watching a filesystem root entry.
         *
         * @param entry The root entry to watch. If entry is a directory,
         *      all subdirectories that aren't explicitly filtered will also be watched.
         * @param filter A function to determine whether
         *      a particular name should be watched or ignored. Paths that are ignored are also
         *      filtered from Directory.getContents() results within this subtree.
         * @param callback A function that is called when the watch has completed.
         *      If the watch fails, the function will have a non-null FileSystemError string parametr.
         */
        watch(entry: FileSystemEntry, filter: (file: string) => boolean, callback?: (file: string) => void): void;

        /**
         * Stop watching a filesystem root entry.
         *
         * @param {FileSystemEntry} entry - The root entry to stop watching. The unwatch will
         *      if the entry is not currently being watched.
         * @param {function(?string)=} callback - A function that is called when the unwatch has
         *      completed. If the unwatch fails, the function will have a non-null FileSystemError
         *      string parameter.
         */
        unwatch(entry: FileSystemEntry, callback?: (file: string) => void): void;

        /**
         * return true if the path is absolute
         *
         * @param path
         */
        isAbsolutePath(path: string): boolean;


        /**
         * Add an event listener for a FileSystem event.
         *
         * @param  event The name of the event
         * @param  handler The handler for the event
         */
        on(event: string, handler: (...args: any[]) => any): void;

        /**
         * Remove an event listener for a FileSystem event.
         *
         * @param event The name of the event
         * @param handler The handler for the event
         */
        off(event: string, handler: (...args: any[]) => any): void;
    }


    /**
     * This is an abstract representation of a FileSystem entry, and the base class for the File and Directory classes.
     * FileSystemEntry objects are never created directly by client code. Use FileSystem.getFileForPath(),
     * FileSystem.getDirectoryForPath(), or Directory.getContents() to create the entry.
     */
    interface FileSystemEntry {
        fullPath: string;
        name: string;
        parentPath: string;
        id: string;
        isFile: boolean;
        isDirectory: boolean;

        /**
         * Check to see if the entry exists on disk. Note that there will NOT be an
         * error returned if the file does not exist on the disk; in that case the
         * error parameter will be null and the boolean will be false. The error
         * parameter will only be truthy when an unexpected error was encountered
         * during the test, in which case the state of the entry should be considered
         * unknown.
         *
         * @param callback Callback with a FileSystemError
         *      string or a boolean indicating whether or not the file exists.
         */
        exists(callback: (err: string, exist: boolean) => any): void;


        /**
         * Returns the stats for the entry.
         *
         * @param callback Callback with a FileSystemError string or FileSystemStats object.
         */
        stat(callback: (err: string, stat: FileSystemStats) => any): void;

         /**
         * Rename this entry.
         *
         * @param {string} newFullPath New path & name for this entry.
         * @param {function (?string)=} callback Callback with a single FileSystemError string parameter.
         */
        rename(newFullPath: string, callback?: (err: string) => any): void;


        /**
         * Unlink (delete) this entry. For Directories, this will delete the directory
         * and all of its contents.
         *
         * @param callback Callback with a single FileSystemError string parameter.
         */
         unlink(callback?: (err: string) => any): void;


         /**
         * Move this entry to the trash. If the underlying file system doesn't support move
         * to trash, the item is permanently deleted.
         *
         * @param callback Callback with a single FileSystemError string parameter.
         */

        moveToTrash(callback?: (err: string) => any): void;

         /**
         * Visit this entry and its descendents with the supplied visitor function.
         *
         * @paramvisitor - A visitor function, which is applied to descendent FileSystemEntry objects. If the function returns false for
         *      a particular Directory entry, that directory's descendents will not be visited.
         * @param {{failFast: boolean=, maxDepth: number=, maxEntries: number=}=} options
         * @param {function(?string)=} callback Callback with single FileSystemError string parameter.
         */
        visit(visitor: (entry: FileSystemEntry) => boolean, options: {failFast?: boolean; maxDepth?: number; maxEntries?: number},
            callbak: (err: string) => any): void;
    }

    /**
     * This class represents a directory on disk (this could be a local disk or cloud storage). This is a subclass of FileSystemEntry.
     */
    interface Directory extends FileSystemEntry {
        /**
         * Read the contents of a Directory.
         *
         * @param callback Callback that is passed an error code or the stat-able contents
         *          of the directory along with the stats for these entries and a
         *          fullPath-to-FileSystemError string map of unstat-able entries
         *          and their stat errors. If there are no stat errors then the last
         *          parameter shall remain undefined.
         */
        getContents(callback: (err: string, files: FileSystemEntry[],
            stats: FileSystemStats, errors: { [path: string]: string; }) => any): void;


        /**
         * Create a directory
         *
         * @param callback Callback resolved with a FileSystemError string or the stat object for the created directory.
         */
        create(callback:  (err: string, stat: FileSystemStats) => any): void;
    }

    /**
     * This class represents a file on disk (this could be a local disk or cloud storage). This is a subclass of FileSystemEntry.
     */
    interface File extends FileSystemEntry {
         /**
         * Read a file.
         *
         * @param options Currently unused.
         * @param callback Callback that is passed the FileSystemError string or the file's contents and its stats.
         */
        read(options: {}, callback: (err: string, data: string, stat: FileSystemStats) => any): void;


        /**
         * Write a file.
         *
         * @param data Data to write.
         * @param options Currently unused.
         * @param callback Callback that is passed the FileSystemError string or the file's new stats.
         */
        write(data: string, options?: {}, callback?: (err: string, stat: FileSystemStats) => any ): void;



    }

    interface FileSystemStats {
        isFile: boolean;
        isDirectory: boolean;
        mtime: Date;
        size: number;
    }

    //--------------------------------------------------------------------------
    //
    //  Project
    //
    //--------------------------------------------------------------------------




    /**
     * ProjectManager is the model for the set of currently open project. It is responsible for
     * creating and updating the project tree when projects are opened and when changes occur to
     * the file tree.
     *
     * This module dispatches these events:
     *    - beforeProjectClose -- before _projectRoot changes
     *    - beforeAppClose     -- before Brackets quits entirely
     *    - projectOpen        -- after _projectRoot changes and the tree is re-rendered
     *    - projectRefresh     -- when project tree is re-rendered for a reason other than
     *                            a project being opened (e.g. from the Refresh command)
     *
     * These are jQuery events, so to listen for them you do something like this:
     *    $(ProjectManager).on("eventname", handler);
     */
    interface ProjectManager {
         /**
         * Returns the root folder of the currently loaded project, or null if no project is open (during
         * startup, or running outside of app shell).
         */
        getProjectRoot(): Directory;

        /**
         * Returns the encoded Base URL of the currently loaded project, or empty string if no project
         * is open (during startup, or running outside of app shell).
         */
        getBaseUrl(): string;

        /**
         * Sets the encoded Base URL of the currently loaded project.
         * @param {String}
         */
        setBaseUrl(): string;

        /**
         * Returns true if absPath lies within the project, false otherwise.
         * Does not support paths containing ".."
         */
        isWithinProject(absPath: string): boolean;

        /**
         * If absPath lies within the project, returns a project-relative path. Else returns absPath
         * unmodified.
         * Does not support paths containing ".."
         * @param  absPath
         */
        makeProjectRelativeIfPossible(absPath: string): string;

         /**
         * Returns false for files and directories that are not commonly useful to display.
         *
         * @param entry File or directory to filter
         */
        shouldShow(entry: FileSystemEntry): boolean;

         /**
         * Returns true if fileName's extension doesn't belong to binary (e.g. archived)
         * @param fileName
         */
        isBinaryFile(fileName: string): boolean;

        /**
         * Open a new project. Currently, Brackets must always have a project open, so
         * this method handles both closing the current project and opening a new project.
         * return {$.Promise} A promise object that will be resolved when the
         * project is loaded and tree is rendered, or rejected if the project path
         * fails to load.
         *
         * @param path Optional absolute path to the root folder of the project.
         *  If path is undefined or null, displays a dialog where the user can choose a
         *  folder to load. If the user cancels the dialog, nothing more happens.

         */
        openProject(path?: string): JQueryPromise<any>;

         /**
         * Returns the File or Directory corresponding to the item selected in the sidebar panel, whether in
         * the file tree OR in the working set; or null if no item is selected anywhere in the sidebar.
         * May NOT be identical to the current Document - a folder may be selected in the sidebar, or the sidebar may not
         * have the current document visible in the tree & working set.
         */
        getSelectedItem(): FileSystemEntry;

         /**
         * Returns an Array of all files for this project, optionally including
         * files in the working set that are *not* under the project root. Files filtered
         * out by shouldShow() OR isBinaryFile() are excluded.
         *
         * @param filter Optional function to filter
         *          the file list (does not filter directory traversal). API matches Array.filter().
         * @param includeWorkingSet If true, include files in the working set
         *          that are not under the project root (*except* for untitled documents).
         *
         * @return {$.Promise} Promise that is resolved with an Array of File objects.
         */
        getAllFiles(filter?: (file: File) => boolean, includeWorkingSet?: boolean): JQueryPromise<File[]>;

        /*
         TODO
        getInitialProjectPath;
        isWelcomeProjectPath;
        updateWelcomeProjectPath;
        createNewItem;
        renameItemInline;
        deleteItem;
        forceFinishRename;
        showInTree;
        refreshFileTree;

        getLanguageFilter;

        */
    }

    //--------------------------------------------------------------------------
    //
    //  Document
    //
    //--------------------------------------------------------------------------

    /**
     * DocumentManager maintains a list of currently 'open' Documents. It also owns the list of files in
     * the working set, and the notion of which Document is currently shown in the main editor UI area.
     *
     * Document is the model for a file's contents; it dispatches events whenever those contents change.
     * To transiently inspect a file's content, simply get a Document and call getText() on it. However,
     * to be notified of Document changes or to modify a Document, you MUST call addRef() to ensure the
     * Document instance 'stays alive' and is shared by all other who read/modify that file. ('Open'
     * Documents are all Documents that are 'kept alive', i.e. have ref count > 0).
     *
     * To get a Document, call getDocumentForPath(); never new up a Document yourself.
     *
     * Secretly, a Document may use an Editor instance to act as the model for its internal state. (This
     * is unavoidable because CodeMirror does not separate its model from its UI). Documents are not
     * modifiable until they have a backing 'master Editor'. Creation of the backing Editor is owned by
     * EditorManager. A Document only gets a backing Editor if it becomes the currentDocument, or if edits
     * occur in any Editor (inline or full-sized) bound to the Document; there is currently no other way
     * to ensure a Document is modifiable.
     *
     * A non-modifiable Document may still dispatch change notifications, if the Document was changed
     * externally on disk.
     *
     * Aside from the text content, Document tracks a few pieces of metadata - notably, whether there are
     * any unsaved changes.
     *
     * This module dispatches several events:
     *
     *    - dirtyFlagChange -- When any Document's isDirty flag changes. The 2nd arg to the listener is the
     *      Document whose flag changed.
     *    - documentSaved -- When a Document's changes have been saved. The 2nd arg to the listener is the
     *      Document that has been saved.
     *    - documentRefreshed -- When a Document's contents have been reloaded from disk. The 2nd arg to the
     *      listener is the Document that has been refreshed.
     *
     *    - currentDocumentChange -- When the value of getCurrentDocument() changes.
     *
     *    To listen for working set changes, you must listen to *all* of these events:
     *    - workingSetAdd -- When a file is added to the working set (see getWorkingSet()). The 2nd arg
     *      to the listener is the added File, and the 3rd arg is the index it was inserted at.
     *    - workingSetAddList -- When multiple files are added to the working set (e.g. project open, multiple file open).
     *      The 2nd arg to the listener is the array of added File objects.
     *    - workingSetRemove -- When a file is removed from the working set (see getWorkingSet()). The
     *      2nd arg to the listener is the removed File.
     *    - workingSetRemoveList -- When multiple files are removed from the working set (e.g. project close).
     *      The 2nd arg to the listener is the array of removed File objects.
     *    - workingSetSort -- When the workingSet array is reordered without additions or removals.
     *      Listener receives no arguments.
     *
     *    - workingSetDisableAutoSorting -- Dispatched in addition to workingSetSort when the reorder was caused
     *      by manual dragging and dropping. Listener receives no arguments.
     *
     *    - fileNameChange -- When the name of a file or folder has changed. The 2nd arg is the old name.
     *      The 3rd arg is the new name.
     *    - pathDeleted -- When a file or folder has been deleted. The 2nd arg is the path that was deleted.
     *
     * These are jQuery events, so to listen for them you do something like this:
     *    $(DocumentManager).on("eventname", handler);
     *
     * Document objects themselves also dispatch some events - see Document docs for details.
     */
    export interface DocumentManager {
         /**
         * Returns the Document that is currently open in the editor UI. May be null.
         * When this changes, DocumentManager dispatches a "currentDocumentChange" event. The current
         * document always has a backing Editor (Document._masterEditor != null) and is thus modifiable.
         */
        getCurrentDocument(): Document;

        /** Changes currentDocument to null, causing no full Editor to be shown in the UI */
        _clearCurrentDocument(): void;

        /**
         * Gets an existing open Document for the given file, or creates a new one if the Document is
         * not currently open ('open' means referenced by the UI somewhere). Always use this method to
         * get Documents; do not call the Document constructor directly. This method is safe to call
         * in parallel.
         *
         * If you are going to hang onto the Document for more than just the duration of a command - e.g.
         * if you are going to display its contents in a piece of UI - then you must addRef() the Document
         * and listen for changes on it. (Note: opening the Document in an Editor automatically manages
         * refs and listeners for that Editor UI).
         *
         * @param fullPath
         * @return {$.Promise} A promise object that will be resolved with the Document, or rejected
         *      with a FileSystemError if the file is not yet open and can't be read from disk.
         */
        getDocumentForPath(fullPath: string): JQueryPromise<Document>;

        /**
         * Returns the existing open Document for the given file, or null if the file is not open ('open'
         * means referenced by the UI somewhere). If you will hang onto the Document, you must addRef()
         * it; see {@link getDocumentForPath()} for details.
         * @param fullPath
         */
        getOpenDocumentForPath(fullPath: string): Document;

         /**
         * Gets the text of a Document (including any unsaved changes), or would-be Document if the
         * file is not actually open. More efficient than getDocumentForPath(). Use when you're reading
         * document(s) but don't need to hang onto a Document object.
         *
         * If the file is open this is equivalent to calling getOpenDocumentForPath().getText(). If the
         * file is NOT open, this is like calling getDocumentForPath()...getText() but more efficient.
         * Differs from plain FileUtils.readAsText() in two ways: (a) line endings are still normalized
         * as in Document.getText(); (b) unsaved changes are returned if there are any.
         *
         * @param file
         */
        getDocumentText(file: File): JQueryPromise<string>;

        /**
         * Creates an untitled document. The associated File has a fullPath that
         * looks like /some-random-string/Untitled-counter.fileExt.
         *
         * @param counter - used in the name of the new Document's File
         * @param fileExt - file extension of the new Document's File
         * @return {Document} - a new untitled Document
         */
        createUntitledDocument(counter: number, fileExt: string): Document;


        /**
         * Returns a list of items in the working set in UI list order. May be 0-length, but never null.
         *
         * When a file is added this list, DocumentManager dispatches a "workingSetAdd" event.
         * When a file is removed from list, DocumentManager dispatches a "workingSetRemove" event.
         * To listen for ALL changes to this list, you must listen for both events.
         *
         * Which items belong in the working set is managed entirely by DocumentManager. Callers cannot
         * (yet) change this collection on their own.
         *
         */
        getWorkingSet(): File[];

         /**
         * Returns the index of the file matching fullPath in the working set.
         * Returns -1 if not found.
         * @param fullPath
         * @param list Pass this arg to search a different array of files. Internal
         *          use only.
         * @returns {number} index
         */
        findInWorkingSet(fullPath: string, list?: File[]): number;
        /*TODO
        findInWorkingSetAddedOrder()
        getAllOpenDocuments()
        setCurrentDocument()
        addToWorkingSet()
        addListToWorkingSet()
        removeFromWorkingSet()
        removeListFromWorkingSet()
        getNextPrevFile()
        swapWorkingSetIndexes()
        sortWorkingSet()
        beginDocumentNavigation()
        finalizeDocumentNavigation()
        closeFullEditor()
        closeAll()
        notifyFileDeleted()
        notifyPathNameChanged()
        notifyPathDeleted()*/
    }


    /**
     * Model for the contents of a single file and its current modification state.
     * See DocumentManager documentation for important usage notes.
     *
     * Document dispatches these events:
     *
     * change -- When the text of the editor changes (including due to undo/redo).
     *
     *        Passes ({Document}, {ChangeList}), where ChangeList is a linked list (NOT an array)
     *        of change record objects. Each change record looks like:
     *
     *            { from: start of change, expressed as {line: <line number>, ch: <character offset>},
     *              to: end of change, expressed as {line: <line number>, ch: <chracter offset>},
     *              text: array of lines of text to replace existing text,
     *              next: next change record in the linked list, or undefined if this is the last record }
     *
     *        The line and ch offsets are both 0-based.
     *
     *        The ch offset in "from" is inclusive, but the ch offset in "to" is exclusive. For example,
     *        an insertion of new content (without replacing existing content) is expressed by a range
     *        where from and to are the same.
     *
     *        If "from" and "to" are undefined, then this is a replacement of the entire text content.
     *
     *        IMPORTANT: If you listen for the "change" event, you MUST also addRef() the document
     *        (and releaseRef() it whenever you stop listening). You should also listen to the "deleted"
     *        event.
     *
     *        (FUTURE: this is a modified version of the raw CodeMirror change event format; may want to make
     *        it an ordinary array)
     *
     * deleted -- When the file for this document has been deleted. All views onto the document should
     *      be closed. The document will no longer be editable or dispatch "change" events.
     *
     */
    interface Document {
        /**
         * The File for this document. Need not lie within the project.
         * If Document is untitled, this is an InMemoryFile object.
         */
        file: File;

        /**
         * The Language for this document. Will be resolved by file extension in the constructor
         * @type {!Language}
         */
        //TODO language: Language;

        /**
         * Whether this document has unsaved changes or not.
         * When this changes on any Document, DocumentManager dispatches a "dirtyFlagChange" event.
         */
        isDirty: boolean;

        /**
         * Returns the document's current contents; may not be saved to disk yet. Whenever this
         * value changes, the Document dispatches a "change" event.
         *
         * @param useOriginalLineEndings If true, line endings in the result depend on the
         *      Document's line endings setting (based on OS & the original text loaded from disk).
         *      If false, line endings are always \n (like all the other Document text getter methods).
         */
        getText(useOriginalLineEndings?: boolean): string;

        /**
         * Adds, replaces, or removes text. If a range is given, the text at that range is replaced with the
         * given new text; if text == "", then the entire range is effectively deleted. If 'end' is omitted,
         * then the new text is inserted at that point and all existing text is preserved. Line endings will
         * be rewritten to match the document's current line-ending style.
         *
         * IMPORTANT NOTE: Because of #1688, do not use this in cases where you might be
         * operating on a linked document (like the main document for an inline editor)
         * during an outer CodeMirror operation (like a key event that's handled by the
         * editor itself). A common case of this is code hints in inline editors. In
         * such cases, use `editor._codeMirror.replaceRange()` instead. This should be
         * fixed when we migrate to use CodeMirror's native document-linking functionality.
         *
         * @param text  Text to insert or replace the range with
         * @param start  Start of range, inclusive (if 'to' specified) or insertion point (if not)
         * @param end  End of range, exclusive; optional
         * @param origin  Optional string used to batch consecutive edits for undo.
         *     If origin starts with "+", then consecutive edits with the same origin will be batched for undo if
         *     they are close enough together in time.
         *     If origin starts with "*", then all consecutive edit with the same origin will be batched for
         *     undo.
         *     Edits with origins starting with other characters will not be batched.
         *     (Note that this is a higher level of batching than batchOperation(), which already batches all
         *     edits within it for undo. Origin batching works across operations.)
         */
        replaceRange(text: string, start: CodeMirror.Position, end?: CodeMirror.Position, origin?: string): void;

        /**
         * Returns the text of the given line (excluding any line ending characters)
         * @param index Zero-based line number
         */
        getLine(index: number): string;

        /**
         * Sets the contents of the document. Treated as an edit. Line endings will be rewritten to
         * match the document's current line-ending style.
         * @param text The text to replace the contents of the document with.
         */
        setText(text: string): void;

        //TODO imcomplete
    }

    //--------------------------------------------------------------------------
    //
    //  Editor
    //
    //--------------------------------------------------------------------------

    /**
     * Editor is a 1-to-1 wrapper for a CodeMirror editor instance. It layers on Brackets-specific
     * functionality and provides APIs that cleanly pass through the bits of CodeMirror that the rest
     * of our codebase may want to interact with. An Editor is always backed by a Document, and stays
     * in sync with its content; because Editor keeps the Document alive, it's important to always
     * destroy() an Editor that's going away so it can release its Document ref.
     *
     * For now, there's a distinction between the "master" Editor for a Document - which secretly acts
     * as the Document's internal model of the text state - and the multitude of "slave" secondary Editors
     * which, via Document, sync their changes to and from that master.
     *
     * For now, direct access to the underlying CodeMirror object is still possible via _codeMirror --
     * but this is considered deprecated and may go away.
     *
     * The Editor object dispatches the following events:
     *    - keyEvent -- When any key event happens in the editor (whether it changes the text or not).
     *          Event handlers are passed ({Editor}, {KeyboardEvent}). The 2nd arg is the raw DOM event.
     *          Note: most listeners will only want to respond when event.type === "keypress".
     *    - cursorActivity -- When the user moves the cursor or changes the selection, or an edit occurs.
     *          Note: do not listen to this in order to be generally informed of edits--listen to the
     *          "change" event on Document instead.
     *    - scroll -- When the editor is scrolled, either by user action or programmatically.
     *    - lostContent -- When the backing Document changes in such a way that this Editor is no longer
     *          able to display accurate text. This occurs if the Document's file is deleted, or in certain
     *          Document->editor syncing edge cases that we do not yet support (the latter cause will
     *          eventually go away).
     *    - optionChange -- Triggered when an option for the editor is changed. The 2nd arg to the listener
     *          is a string containing the editor option that is changing. The 3rd arg, which can be any
     *          data type, is the new value for the editor option.
     *
     * The Editor also dispatches "change" events internally, but you should listen for those on
     * Documents, not Editors.
     *
     * These are jQuery events, so to listen for them you do something like this:
     *    $(editorInstance).on("eventname", handler);
     */
    interface Editor {
        _codeMirror: CodeMirror.Editor;
        document: Document;
        getCursorPos(): CodeMirror.Position;
        getModeForSelection(): string;
        getSelection(boolean: boolean): {
            start: CodeMirror.Position;
            end: CodeMirror.Position
        };
        setCursorPos(line: number, ch: number, center: boolean, expandTabs: boolean): void ;
    }


    interface EditorManager {
        registerInlineEditProvider(provider: InlineEditProvider, priority?: number): void;
        registerInlineDocsProvider(provider: InlineDocsProvider, priority?: number): void;
        registerJumpToDefProvider(provider: JumpDoDefProvider): void;
        getFocusedEditor(): Editor;
        /**
         * Returns the current active editor (full-sized OR inline editor). This editor may not
         * have focus at the moment, but it is visible and was the last editor that was given
         * focus. Returns null if no editors are active.
         * @see getFocusedEditor()
         * @returns {?Editor}
         */
        getActiveEditor(): Editor;
        getCurrentFullEditor(): Editor;
    }

    //--------------------------------------------------------------------------
    //
    //  Editor
    //
    //--------------------------------------------------------------------------

    /**
     * PreferencesManager
     *
     */
    interface PreferencesManager extends Preferences {
        /**
         * Creates an extension-specific preferences manager using the prefix given.
         * A `.` character will be appended to the prefix. So, a preference named `foo`
         * with a prefix of `myExtension` will be stored as `myExtension.foo` in the
         * preferences files.
         *
         * @param prefix Prefix to be applied
         */
        getExtensionPrefs(prefix: string): Preferences;


        /**
         * Get the full path to the user-level preferences file.
         *
         * @return Path to the preferences file
         */
        getUserPrefFile(): string;

        /**
         * Context to look up preferences for the currently edited file.
         * This is undefined because this is the default behavior of PreferencesSystem.get.
         */
        CURRENT_FILE: any;
        /**
         * Context to look up preferences in the current project.
         */
        CURRENT_PROJECT: any;
    }

    interface Preferences {
        /**
         * Defines a new (prefixed) preference.
         *
         * @param id unprefixed identifier of the preference. Generally a dotted name.
         * @param type Data type for the preference (generally, string, boolean, number)
         * @param initial Default value for the preference
         * @param options Additional options for the pref. Can include name and description
         *                          that will ultimately be used in UI.
         * @return {Object} The preference object.
         */
        definePreference(id: string, type: string, value: any, options?: { name?: string; description: string; }): any;


        /**
         * Get the prefixed preference object
         *
         * @param {string} id ID of the pref to retrieve.
         */
        getPreference(id: string): any;

        /**
         * Gets the prefixed preference
         *
         * @param id Name of the preference for which the value should be retrieved
         * @param context Optional context object to change the preference lookup
         */
        get(id: string, context?: any): any;

        /**
         * Gets the location in which the value of a prefixed preference has been set.
         *
         * @param id Name of the preference for which the value should be retrieved
         * @param context Optional context object to change the preference lookup
         * @return Object describing where the preferences came from
         */
        getPreferenceLocation(id: string, context?: any): {scope: string; layer?: string; layerID?: any};

        /**
         * Sets the prefixed preference
         *
         * @param id Identifier of the preference to set
         * @param value New value for the preference
         * @param options Specific location in which to set the value or the context to use when setting the value
         * @return true if a value was set
         */
        set(id: string, value: any, options?: {location: any; context?: any; }): boolean;


        /**
         * Sets up a listener for events for this PrefixedPreferencesSystem. Only prefixed events
         * will notify. Optionally, you can set up a listener for a
         * specific preference.
         *
         * @param event Name of the event to listen for
         * @param preferenceID Name of a specific preference
         * @param handler Handler for the event
         */
        on(event: string, preferenceId: string, handler: (...rest: any[]) => void): void;
        /**
         * Sets up a listener for events for this PrefixedPreferencesSystem. Only prefixed events
         * will notify. Optionally, you can set up a listener for a
         * specific preference.
         *
         * @param event Name of the event to listen for
         * @param handler Handler for the event
         */
        on(event: string, handler: (...rest: any[]) => void): void;


        /**
         * Turns off the event handlers for a given event, optionally for a specific preference
         * or a specific handler function.
         *
         * @param event Name of the event for which to turn off listening
         * @param preferenceID Name of a specific preference
         * @param handler Specific handler which should stop being notified
         */
        off(event: string, preferenceId: string, handler: (...rest: any[]) => void): void;
        /**
         * Turns off the event handlers for a given event, optionally for a specific preference
         * or a specific handler function.
         *
         * @param event Name of the event to listen for
         * @param handler Specific handler which should stop being notified
         */
        off(event: string, handler: (...rest: any[]) => void): void;


        /**
         * Saves the preferences. If a save is already in progress, a Promise is returned for
         * that save operation.
         *
         * @return  a promise resolved when the preferences are done saving.
         */
        save(): JQueryPromise<void>;
    }



    //--------------------------------------------------------------------------
    //
    //  PanelManager
    //
    //--------------------------------------------------------------------------

    /**
     * Represents a panel below the editor area (a child of ".content").
     */
    interface Panel {
        isVisible(): boolean;
        show(): void;
        hide(): void;
        setVisible(visible: boolean): void;
        $panel: JQuery
    }

    /**
     * Manages layout of panels surrounding the editor area, and size of the editor area (but not its contents).
     *
     * Updates panel sizes when the window is resized. Maintains the max resizing limits for panels, based on
     * currently available window size.
     *
     * Events:
     *    - editorAreaResize -- When editor-holder's size changes for any reason (including panel show/hide
     *              panel resize, or the window resize).
     *              The 2nd arg is the new editor-holder height.
     *              The 3rd arg is a refreshHint flag for internal EditorManager use.
     */

    interface PanelManager {
         /**
         * Creates a new panel beneath the editor area and above the status bar footer. Panel is initially invisible.
         *
         * @param id  Unique id for this panel. Use package-style naming, e.g. "myextension.feature.panelname"
         * @param $panel  DOM content to use as the panel. Need not be in the document yet.
         * @param minSize  Minimum height of panel in px.
         */
        createBottomPanel(id: string, $panel: JQuery, minSize: number): Panel;
    }

    //--------------------------------------------------------------------------
    //
    //  Command
    //
    //--------------------------------------------------------------------------
    interface CommandManager {
        execute(id: string, args: any): JQueryPromise<any>;
        register(name: string, id: string, callback: () => void): void;
    }


    //--------------------------------------------------------------------------
    //
    //  CodeHint
    //
    //--------------------------------------------------------------------------


    interface CodeHintManager {
        registerHintProvider(hintProvider: CodeHintProvider, languageIds: string[], priority?: number): void;
    }
    interface HintResult {
        hints?: any [];
        match?: string;
        selectInitial?: boolean
    }

    interface CodeHintProvider {
        hasHints(editor: Editor, implicitChar: string): boolean;
        getHints(implicitChar: string): JQueryDeferred<HintResult>;
        insertHint(hint: any): void;
    }


    //--------------------------------------------------------------------------
    //
    //  Inspection
    //
    //--------------------------------------------------------------------------



    interface CodeInspection {
        register(languageId: string, provider: InspectionProvider): void;
        Type: { [index: string]: string}
    }


    interface LintingError {
        pos: CodeMirror.Position;
        endPos?: CodeMirror.Position;
        message: string;
        type?: string;
    }

    interface InspectionProvider {
        name: string;
        scanFile?(content: string, path: string): { errors: LintingError[];  aborted: boolean };
        scanFileAsync?(content: string, path: string): JQueryPromise<{ errors: LintingError[];  aborted: boolean }>;
    }


    //--------------------------------------------------------------------------
    //
    //  QuickEdit
    //
    //--------------------------------------------------------------------------

    interface InlineEditProvider {
        (hostEditor: Editor, pos: CodeMirror.Position): JQueryPromise<InlineWidget>
    }



    //--------------------------------------------------------------------------
    //
    //  QuickOpen
    //
    //--------------------------------------------------------------------------

    interface QuickOpen {
        /**
         * Creates and registers a new QuickOpenPlugin
         */
        addQuickOpenPlugin<S>(def: QuickOpenPluginDef<S>): void;
        highlightMatch(item: string): string;
    }


    interface QuickOpenPluginDef<S> {
        /**
         * plug-in name, **must be unique**
         */
        name: string;
        /**
         * language Ids array. Example: ["javascript", "css", "html"]. To allow any language, pass []. Required.
         */
        languageIds: string[];
        /**
         * called when quick open is complete. Plug-in should clear its internal state. Optional.
         */
        done?: () => void;
        /**
         * takes a query string and a StringMatcher (the use of which is optional but can speed up your searches)
         * and returns an array of strings that match the query. Required.
         */
        search: (request: string, stringMatcher: StringMatcher) => JQueryPromise<S[]>;
        /**
         * takes a query string and returns true if this plug-in wants to provide
         */
        match: (query: string) => boolean;
        /**
         * performs an action when a result has been highlighted (via arrow keys, mouseover, etc.).
         */
        itemFocus?: (result: S) => void;
        /**
         * performs an action when a result is chosen.
         */
        itemSelect: (result: S) => void;
        /**
         * takes a query string and an item string and returns
         * a <LI> item to insert into the displayed search results. Optional.
         */
        resultsFormatter?: (result: S) => string;

        /**
         * options to pass along to the StringMatcher (see StringMatch.StringMatcher for available options).
         */
        matcherOptions?: StringMatcherOptions;
        /**
         * if provided, the label to show before the query field. Optional.
         */
        label?: string;
    }

    interface StringMatcherOptions {
        preferPrefixMatches?: boolean;
        segmentedSearch?: boolean;
    }

    interface StringMatcher {
        match(target: string, query: string): {
            ranges: { text: string; matched: boolean; includesLastSegment: boolean}[];
            matchGoodness: number;
            scoreDebug: any;
        }
    }


    //--------------------------------------------------------------------------
    //
    //  Todo
    //
    //--------------------------------------------------------------------------

    interface InlineDocsProvider {
        (hostEditor: Editor, pos: CodeMirror.Position): JQueryPromise<InlineWidget>
    }

    interface JumpDoDefProvider {
        (): JQueryPromise<boolean>
    }



    interface InlineWidget {
        load(editor: Editor): void
    }



    module MultiRangeInlineEditor {
        class MultiRangeInlineEditor implements InlineWidget {
            constructor(ranges: MultiRangeInlineEditorRange[]);
            load(editor: Editor): void;
        }
    }

    interface MultiRangeInlineEditorRange {
        name: string;
        document: brackets.Document;
        lineStart: number;
        lineEnd: number;
    }

    function getModule(module: 'filesystem/FileSystem'): FileSystem;
    function getModule(module: 'document/DocumentManager'): brackets.DocumentManager;
    function getModule(module: 'project/ProjectManager'): brackets.ProjectManager;
    function getModule(module: 'editor/CodeHintManager'): CodeHintManager;
    function getModule(module: 'editor/EditorManager'): EditorManager;
    function getModule(module: 'editor/MultiRangeInlineEditor'): typeof MultiRangeInlineEditor;
    function getModule(module: 'language/CodeInspection'): CodeInspection;
    function getModule(module: 'view/PanelManager'): PanelManager;
    function getModule(module: 'command/CommandManager'): CommandManager;
    function getModule(module: 'search/QuickOpen'): QuickOpen;
    function getModule(module: 'preferences/PreferencesManager'): PreferencesManager;
    function getModule(module: string): any;

}
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

/**
 * All options are false by default.
 */
interface MiniMatchOptions {
    
    /**
     * Dump a ton of stuff to stderr.
     */
    debug?: boolean;
    
    /**
     * Do not expand {a,b} and {1..3} brace sets.
     */
    nobrace?: boolean;
   
    /** 
     * Disable ** matching against multiple folder names.
     */
    noglobstar?: boolean;
    
    /** 
     * Allow patterns to match filenames starting with a period, even if the pattern does not explicitly have a period in that spot.
     * Note that by default, a/** /b will not match a/.d/b, unless dot is set.
     */
    dot?: boolean;
    
    /** 
     * Disable "extglob" style patterns like +(a|b).
     */
    noext?: boolean;
    
    /** 
     * Perform a case-insensitive match.
     */
    nocase?: boolean;

    
    /** 
     * When a match is not found by minimatch.match, return a list containing the pattern itself. 
     * When set, an empty list is returned if there are no matches.
     */
    nonull?: boolean;

    
    /** 
     * If set, then patterns without slashes will be matched against the basename of the path if it contains slashes. 
     * For example, a?b would match the path /xyz/123/acb, but not /xyz/acb/123.
     */
    matchBase?: boolean;

    
    /** 
     * Suppress the behavior of treating # at the start of a pattern as a comment.
     */
    nocomment?: boolean;

    
    /** 
     * Suppress the behavior of treating a leading ! character as negation.
     */
    nonegate?: boolean;

    
    /**
     * Returns from negate expressions the same as if they were not negated. (Ie, true on a hit, false on a miss.)
     */
    flipNegate?: boolean;
}


interface MiniMatchStatic {
    (path: string, pattern: string, options?: MiniMatchOptions): boolean;
    filter(pattern: string, options?: MiniMatchOptions): { (path: string): boolean };
}

declare module 'minimatch' {
    var minimatch: MiniMatchStatic;
    export = minimatch;
}


// Type definitions for Mustache 0.7
// Project: https://github.com/janl/mustache.js
// Definitions by: Boris Yankov <https://github.com/borisyankov/>
// Definitions: https://github.com/borisyankov/DefinitelyTyped


/*tslint:disable unused*/

declare var Mustache: {
    render(template: string, data: any): string;
};
// Ripped from lib.es6.d.ts with addtions for atom

/**
 * Represents the completion of an asynchronous operation
 */
interface Promise<T> {
    /**
    * Attaches callbacks for the resolution and/or rejection of the Promise.
    * @param onfulfilled The callback to execute when the Promise is resolved.
    * @param onrejected The callback to execute when the Promise is rejected.
    * @returns A Promise for the completion of which ever callback is executed.
    */
    then<TResult>(onfulfilled?: (value: T) => TResult | Promise<TResult>, onrejected?: (reason: any) => TResult | Promise<TResult>): Promise<TResult>;

    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch(onrejected?: (reason: any) => T | Promise<T>): Promise<T>;
}

interface PromiseConstructor {
    /**
      * A reference to the prototype.
      */
    prototype: Promise<any>;

    /**
     * Creates a new Promise.
     * @param init A callback used to initialize the promise. This callback is passed two arguments:
     * a resolve callback used resolve the promise with a value or the result of another promise,
     * and a reject callback used to reject the promise with a provided reason or error.
     */
    new <T>(init: (resolve: (value?: T | Promise<T>) => void, reject: (reason?: any) => void) => void): Promise<T>;

    <T>(init: (resolve: (value?: T | Promise<T>) => void, reject: (reason?: any) => void) => void): Promise<T>;

    /**
     * Creates a Promise that is resolved with an array of results when all of the provided Promises
     * resolve, or rejected when any Promise is rejected.
     * @param values An array of Promises.
     * @returns A new Promise.
     */
    all<T>(values: (T | Promise<T>)[]): Promise<T[]>;

    /**
     * Creates a Promise that is resolved with an array of results when all of the provided Promises
     * resolve, or rejected when any Promise is rejected.
     * @param values An array of values.
     * @returns A new Promise.
     */
    all(values: Promise<void>[]): Promise<void>;

    /**
     * Creates a Promise that is resolved or rejected when any of the provided Promises are resolved
     * or rejected.
     * @param values An array of Promises.
     * @returns A new Promise.
     */
    race<T>(values: (T | Promise<T>)[]): Promise<T>;

    /**
     * Creates a new rejected promise for the provided reason.
     * @param reason The reason the promise was rejected.
     * @returns A new rejected Promise.
     */
    reject(reason: any): Promise<void>;

    /**
     * Creates a new rejected promise for the provided reason.
     * @param reason The reason the promise was rejected.
     * @returns A new rejected Promise.
     */
    reject<T>(reason: any): Promise<T>;

    /**
      * Creates a new resolved promise for the provided value.
      * @param value A promise.
      * @returns A promise whose internal state matches the provided promise.
      */
    resolve<T>(value: T | Promise<T>): Promise<T>;

    /**
     * Creates a new resolved promise .
     * @returns A resolved promise.
     */
    resolve(): Promise<void>;

    /// BAS ADDITIONS AFTER INSPECTION INTO ATOM
    defer<T>(): PromiseDeferred<T>;
}

interface PromiseDeferred<T> {
    promise: Promise<T>; resolve(value: T): any; reject(error: T): any;
}

declare var Promise: PromiseConstructor;
/// <reference path="typings/tsd.d.ts" />
/// <reference path="../node_modules/typescript/bin/typescript.d.ts" />
/// <reference path="../node_modules/typescript/bin/typescript_internal.d.ts" />
/// <reference path="typings/bluebird.d.ts" />
/// <reference path="typings/codemirror.d.ts" />
/// <reference path="typings/brackets.d.ts" />
/// <reference path="typings/minimatch.d.ts" />
/// <reference path="typings/mustache.d.ts" />
/// <reference path="../views/views.d.ts" />
/// <reference path="typings/atompromise.d.ts" />
interface Function {
    name?: string;
}
interface Error {
    details?: any;
}
declare module 'escape-html' {
    function escape(html: string): string;
    export = escape;
}
declare module 'atom-space-pen-views' {
    import atom = require('atom');
    class SelectListView extends atom.SelectListView {
    }
    class ScrollView extends atom.ScrollView {
    }
    class View extends atom.View {
    }
    var $: JQueryStatic;
}
/** https://github.com/paulmillr/chokidar */
declare module 'chokidar' {
    interface Watcher {
        on: (event: string, callback: (path: string) => any) => any;
    }
    function watch(path: any, options?: any): Watcher;
}
declare module 'basarat-text-buffer' {
    var options: any;
    export = options;
}
interface EmitOutput {
    outputFiles: string[];
    success: boolean;
    errors: TSError[];
    emitError: boolean;
}
interface BuildOutput {
    outputs: EmitOutput[];
    counts: {
        inputFiles: number;
        outputFiles: number;
        errors: number;
        emitErrors: number;
    };
}
interface BuildUpdate {
    builtCount: number;
    totalCount: number;
    errorCount: number;
    firstError: boolean;
    filePath: string;
    errorsInFile: TSError[];
}
interface TSError {
    filePath: string;
    startPos: EditorPosition;
    endPos: EditorPosition;
    message: string;
    preview: string;
}
interface EditorPosition {
    line: number;
    col: number;
}
interface CodeEdit {
    start: EditorPosition;
    end: EditorPosition;
    newText: string;
}
/** Interfaces used by GotoHistory feature */
interface GotoPosition {
    filePath: string;
    line: number;
    col: number;
}
interface TabWithGotoPositions {
    lastPosition?: GotoPosition;
    members: GotoPosition[];
}
/** Interfaces needed for file symbols view */
interface NavigationBarItem {
    text: string;
    kind: string;
    kindModifiers: string;
    position: EditorPosition;
    indent: number;
    bolded: boolean;
    grayed: boolean;
}
/** for project symbols view */
interface NavigateToItem {
    name: string;
    kind: string;
    filePath: string;
    position: EditorPosition;
    fileName: string;
}
interface ReferenceDetails {
    filePath: string;
    position: EditorPosition;
    preview: string;
}
/** Used by AST display */
interface NodeDisplay {
    kind: string;
    children: NodeDisplay[];
    pos: number;
    end: number;
    /** Represents how many parents it has */
    depth: number;
    /** If we had a flat structure this is where this item would belong */
    nodeIndex: number;
    /** Key Details I understand */
    details?: any;
    /** Best attempt serialization of original node
    * I also remove `parent`
    */
    rawJson: any;
}
/** Used by Dependency display */
interface FileDependency {
    sourcePath: string;
    targetPath: string;
}
declare module 'example/main/lang/utils' {
	export function mapValues<T>(map: {
	    [index: string]: T;
	}): T[];
	/**
	 * assign all properties of a list of object to an object
	 * @param target the object that will receive properties
	 * @param items items which properties will be assigned to a target
	 */
	export function assign(target: any, ...items: any[]): any;
	/**
	 * clone an object (shallow)
	 * @param target the object to clone
	 */
	export function clone<T>(target: T): T;
	/**
	 * Create a quick lookup map from list
	 */
	export function createMap(arr: string[]): {
	    [string: string]: boolean;
	};
	/**
	 * browserify path.resolve is buggy on windows
	 */
	export function pathResolve(from: string, to: string): string;
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
	    private listeners;
	    /**
	     * Priorities corresponding to the listeners
	     */
	    private priorities;
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
	export function binarySearch(array: number[], value: number): number;
	export function selectMany<T>(arr: T[][]): T[];
	export function pathIsRelative(str: string): boolean;
	/** Key is string. Note: this data structure might have been a bad idea. Sorry. */
	export class Dict<T> {
	    table: any;
	    constructor();
	    setValue(key: string, item: T): void;
	    getValue(key: string): any;
	    clearValue(key: string): void;
	    clearAll(): void;
	    keys(): string[];
	    values(): T[];
	}
	/** for testing ui lags only */
	export function delay(seconds?: number): void;
	export function delayMilliseconds(milliseconds?: number): void;
	export function debounce<T extends Function>(func: T, milliseconds: number, immediate?: boolean): T;

}
declare module 'example/worker/debug' {
	/** Set this to true to run the child code in the UI thread and just debug using the dev tools */
	export var debug: boolean;

}
declare module 'example/main/tsconfig/simpleValidator' {
	export var types: {
	    string: string;
	    boolean: string;
	    number: string;
	};
	export interface ValidationInfo {
	    [name: string]: {
	        validValues?: string[];
	        type?: string;
	    };
	}
	export interface Errors {
	    invalidValues: string[];
	    extraKeys: string[];
	    errorMessage: string;
	}
	export class SimpleValidator {
	    validationInfo: ValidationInfo;
	    private potentialLowerCaseMatch;
	    constructor(validationInfo: ValidationInfo);
	    validate(config: any): Errors;
	}
	export function createMap(arr: string[]): {
	    [key: string]: boolean;
	};

}
declare module 'example/main/atom/views/view' {
	/// <reference path="../../../globals.d.ts" />
	import sp = require("atom-space-pen-views");
	export class View<Options> extends sp.View {
	    options: Options;
	    $: JQuery;
	    static content(): void;
	    constructor(options?: Options);
	    init(): void;
	}
	export var $: JQueryStatic;

}
declare module 'example/main/atom/views/lineMessageView' {
	import view = require('example\main\atom\views\view');
	export interface ViewOptions {
	    /** This is needed to support good goto next / goto previous logic
	     *  We inform the parent about our navigation
	     */
	    goToLine: (filePath: string, line: number, col: number) => any;
	    /** your message to the people */
	    message: string;
	    /** what line are we talking about? */
	    line: number;
	    /** which column */
	    col: number;
	    /** so, was that in some other file? */
	    file: string;
	    /** lets you display a code snippet inside a pre tag */
	    preview: string;
	}
	export class LineMessageView extends view.View<ViewOptions> {
	    index: number;
	    private position;
	    private contents;
	    private code;
	    static content(): any;
	    init(): void;
	    goToLine(): void;
	    getSummary(): {
	        summary: string;
	        rawSummary: boolean;
	        handler: any;
	    };
	}

}
declare module 'example/main/atom/gotoHistory' {
	export var errorsInOpenFiles: TabWithGotoPositions;
	export var buildOutput: TabWithGotoPositions;
	export var referencesOutput: TabWithGotoPositions;
	/** This *must* always be set */
	export var activeList: TabWithGotoPositions;
	export function gotoLine(filePath: string, line: number, col: number, list: TabWithGotoPositions): void;
	/** Uses `activeList` to go to the next position or loop back */
	export function gotoNext(): void;
	export function gotoPrevious(): void;

}
declare module 'example/main/atom/views/mainPanelView' {
	import view = require('example\main\atom\views\view');
	import lineMessageView = require('example\main\atom\views\lineMessageView');
	export class MainPanelView extends view.View<any> {
	    private btnFold;
	    private summary;
	    private heading;
	    private errorPanelBtn;
	    private buildPanelBtn;
	    private referencesPanelBtn;
	    private errorBody;
	    private buildBody;
	    private referencesBody;
	    private buildProgress;
	    private sectionPending;
	    private txtPendingCount;
	    private pendingRequests;
	    static content(): void;
	    init(): void;
	    showPending(): void;
	    updatePendingRequests(pending: string[]): void;
	    errorPanelSelected(forceExpand?: boolean): void;
	    buildPanelSelected(forceExpand?: boolean): void;
	    referencesPanelSelected(forceExpand?: boolean): void;
	    private selectPanel(btn, body, activeList);
	    private setActivePanel();
	    private expanded;
	    toggle(): void;
	    setReferences(references: ReferenceDetails[]): void;
	    private clearedError;
	    clearError(): void;
	    addError(view: lineMessageView.LineMessageView): void;
	    setErrorSummary(summary: any): void;
	    setErrorPanelErrorCount(fileErrorCount: number, totalErrorCount: number): void;
	    setBuildPanelCount(errorCount: number, inProgressBuild?: boolean): void;
	    clearBuild(): void;
	    addBuild(view: lineMessageView.LineMessageView): void;
	    setBuildProgress(progress: BuildUpdate): void;
	}
	export var panelView: MainPanelView;
	export function attach(): void;
	export function show(): void;
	export function hide(): void;

}
declare module 'example/main/lang/core/project' {
	/// <reference path="../../../globals.d.ts" />
	import ts = require('typescript');
	export import languageServiceHost = require('example\main\lang\core\languageServiceHost2');
	import tsconfig = require('example\main\tsconfig\tsconfig');
	/**
	 * Wraps up `langaugeService` `languageServiceHost` and `projectFile` in a single package
	 */
	export class Project {
	    projectFile: tsconfig.TypeScriptProjectFileDetails;
	    languageServiceHost: languageServiceHost.LanguageServiceHost;
	    languageService: ts.LanguageService;
	    constructor(projectFile: tsconfig.TypeScriptProjectFileDetails);
	    /** all files except lib.d.ts  */
	    getProjectSourceFiles(): ts.SourceFile[];
	}

}
declare module 'example/main/atom/views/plainMessageView' {
	import view = require('example\main\atom\views\view');
	export interface ViewOptions {
	    /** your message to the people */
	    message: string;
	    className: string;
	}
	export class PlainMessageView extends view.View<ViewOptions> {
	    static content(): void;
	    init(): void;
	    getSummary(): {
	        summary: string;
	        rawSummary: boolean;
	        className: string;
	    };
	}

}
declare module 'example/main/atom/errorView' {
	/// <reference path="../../globals.d.ts" />
	export var setErrors: (filePath: string, errorsForFile: TSError[]) => void;
	export function showEmittedMessage(output: EmitOutput): void;

}
declare module 'example/worker/queryParent' {
	export interface Position {
	    line: number;
	    col: number;
	}
	export interface TSError {
	    filePath: string;
	    startPos: Position;
	    endPos: Position;
	    message: string;
	    preview: string;
	}
	export function echoNumWithModification(query: {
	    num: number;
	}): Promise<{
	    num: number;
	}>;
	export function getUpdatedTextForUnsavedEditors(query: {}): Promise<{
	    editors: {
	        filePath: string;
	        text: string;
	    }[];
	}>;
	export function getOpenEditorPaths(query: {}): Promise<{
	    filePaths: string[];
	}>;
	export function setConfigurationError(query: {
	    projectFilePath: string;
	    error: {
	        message: string;
	        details: any;
	    };
	}): Promise<{}>;
	export function notifySuccess(query: {
	    message: string;
	}): Promise<{}>;
	export function buildUpdate(query: BuildUpdate): Promise<{}>;
	export interface Test {
	}

}
declare module 'example/main/lang/modules/building' {
	import ts = require('typescript');
	import project = require('example\main\lang\core\project');
	export function diagnosticToTSError(diagnostic: ts.Diagnostic): TSError;
	export function emitFile(proj: project.Project, filePath: string): EmitOutput;
	export function getRawOutput(proj: project.Project, filePath: string): ts.EmitOutput;
	export function emitDts(proj: project.Project): void;

}
declare module 'example/main/lang/modules/formatting' {
	import project = require('example\main\lang\core\project');
	export function formatDocument(proj: project.Project, filePath: string): CodeEdit[];
	export function formatDocumentRange(proj: project.Project, filePath: string, start: EditorPosition, end: EditorPosition): CodeEdit[];

}
declare module 'example/main/lang/modules/getExternalModules' {
	import { Program } from "typescript";
	export function getExternalModuleNames(program: Program): string[];

}
declare module 'example/main/lang/modules/astToText' {
	/**
	 * Things we care about:
	 * name , kind , text
	 */
	import * as ts from "typescript";
	export function astToText(srcFile: ts.Node): NodeDisplay;
	export function astToTextFull(srcFile: ts.Node): NodeDisplay;

}
declare module 'example/main/lang/modules/programDependencies' {
	import { TypeScriptProjectFileDetails } from 'example\main\tsconfig\tsconfig';
	import * as ts from "typescript";
	export default function getDependencies(projectFile: TypeScriptProjectFileDetails, program: ts.Program): FileDependency[];

}
declare module 'example/main/lang/fixmyts/quickFix' {
	/**
	 * Interfaces for quick fixes
	 */
	import ts = require("typescript");
	import project = require('example\main\lang\core\project');
	export interface Refactoring extends ts.TextChange {
	    filePath: string;
	}
	/** Note this interface has a few redundant stuff. This is intentional to precompute once */
	export interface QuickFixQueryInformation {
	    project: project.Project;
	    service: ts.LanguageService;
	    program: ts.Program;
	    typeChecker: ts.TypeChecker;
	    srcFile: ts.SourceFile;
	    fileErrors: ts.Diagnostic[];
	    positionErrors: ts.Diagnostic[];
	    position: number;
	    positionNode: ts.Node;
	    filePath: string;
	}
	export interface QuickFix {
	    /** Some unique key. Classname works best ;) */
	    key: string;
	    /**
	      * Return '' if you can't provide a fix
	      * return 'Some string to display' if you can provide a string
	      */
	    canProvideFix(info: QuickFixQueryInformation): string;
	    provideFix(info: QuickFixQueryInformation): Refactoring[];
	}
	/** You don't need to create this manually. Just use the util function */
	export interface RefactoringsByFilePath {
	    [filePath: string]: Refactoring[];
	}
	/** Utility method. Reason is we want to transact by file path */
	export function getRefactoringsByFilePath(refactorings: Refactoring[]): RefactoringsByFilePath;

}
declare module 'example/main/lang/fixmyts/astUtils' {
	import * as ts from "typescript";
	export var forEachChild: typeof ts.forEachChild;
	export function forEachChildRecursive<T>(node: ts.Node, cbNode: (node: ts.Node, depth: number) => T, depth?: number): T;
	export function getNodeByKindAndName(program: ts.Program, kind: ts.SyntaxKind, name: string): ts.Node;

}
declare module 'example/main/lang/fixmyts/addClassMember' {
	import { QuickFix, QuickFixQueryInformation, Refactoring } from 'example\main\lang\fixmyts\quickFix'; class AddClassMember implements QuickFix {
	    key: string;
	    canProvideFix(info: QuickFixQueryInformation): string;
	    provideFix(info: QuickFixQueryInformation): Refactoring[];
	}
	export default AddClassMember;

}
declare module 'example/main/lang/fixmyts/equalsToEquals' {
	import { QuickFix, QuickFixQueryInformation, Refactoring } from 'example\main\lang\fixmyts\quickFix'; class EqualsToEquals implements QuickFix {
	    key: string;
	    canProvideFix(info: QuickFixQueryInformation): string;
	    provideFix(info: QuickFixQueryInformation): Refactoring[];
	}
	export default EqualsToEquals;

}
declare module 'example/main/lang/fixmyts/quotesToQuotes' {
	import { QuickFix, QuickFixQueryInformation, Refactoring } from 'example\main\lang\fixmyts\quickFix'; class QuotesToQuotes implements QuickFix {
	    key: string;
	    canProvideFix(info: QuickFixQueryInformation): string;
	    provideFix(info: QuickFixQueryInformation): Refactoring[];
	}
	export default QuotesToQuotes;

}
declare module 'example/main/lang/fixmyts/quoteToTemplate' {
	import { QuickFix, QuickFixQueryInformation, Refactoring } from 'example\main\lang\fixmyts\quickFix'; class QuoteToTemplate implements QuickFix {
	    key: string;
	    canProvideFix(info: QuickFixQueryInformation): string;
	    provideFix(info: QuickFixQueryInformation): Refactoring[];
	}
	export default QuoteToTemplate;

}
/// <reference path="globals.d.ts" />
declare module 'example/main/atom/buildView' {
	/// <reference path="../../globals.d.ts" />
	export function setBuildOutput(buildOutput: BuildOutput): void;

}
declare module 'example/main/atom/views/documentationView' {
	import view = require('example\main\atom\views\view');
	export class DocumentationView extends view.View<any> {
	    private header;
	    private documentation;
	    static content(): any;
	    private shown;
	    show(): void;
	    hide(): void;
	    toggle(): void;
	    setContent(content: {
	        display: string;
	        documentation: string;
	        filePath: string;
	    }): void;
	    autoPosition(): void;
	}
	export var docView: DocumentationView;
	export function attach(): void;
	export function testDocumentationView(): void;

}
declare module 'example/main/atom/views/fileSymbolsView' {
	import sp = require('atom-space-pen-views');
	/**
	 * https://github.com/atom/atom-space-pen-views
	 */
	export class FileSymbolsView extends sp.SelectListView {
	    $: JQuery;
	    filePath: string;
	    setNavBarItems(tsItems: NavigationBarItem[], filePath: any): void;
	    /** override */
	    viewForItem(item: NavigationBarItem): string;
	    /** override */
	    confirmed(item: NavigationBarItem): void;
	    getFilterKey(): string;
	    panel: AtomCore.Panel;
	    show(): void;
	    hide(): void;
	    cancelled(): void;
	}

}
declare module 'example/main/atom/views/projectSymbolsView' {
	import sp = require('atom-space-pen-views');
	/**
	 * https://github.com/atom/atom-space-pen-views
	 */
	export class ProjectSymbolsView extends sp.SelectListView {
	    $: JQuery;
	    setNavBarItems(tsItems: NavigateToItem[]): void;
	    /** override */
	    viewForItem(item: NavigateToItem): string;
	    /** override */
	    confirmed(item: NavigateToItem): void;
	    getFilterKey(): string;
	    panel: AtomCore.Panel;
	    show(): void;
	    hide(): void;
	    cancelled(): void;
	}

}
declare module 'example/main/atom/views/astView' {
	import sp = require('atom-space-pen-views');
	export var astURI: string;
	export function astUriForPath(filePath: string): string;
	export var astURIFull: string;
	export function astUriFullForPath(filePath: string): string;
	/**
	 * https://github.com/atom/atom-space-pen-views
	 */
	export class AstView extends sp.ScrollView {
	    filePath: any;
	    text: string;
	    full: boolean;
	    mainContent: JQuery;
	    rawDisplay: JQuery;
	    static content(): any;
	    constructor(filePath: any, text: string, full: boolean);
	    init(): void;
	    getURI: () => string;
	    getTitle: () => string;
	    getIconName: () => string;
	}

}
declare module 'example/main/atom/views/dependencyView' {
	import sp = require('atom-space-pen-views');
	export var dependencyURI: string;
	export function dependencyUriForPath(filePath: string): string;
	/**
	 * https://github.com/atom/atom-space-pen-views
	 */
	export class DependencyView extends sp.ScrollView {
	    filePath: any;
	    static content(): any;
	    $: JQuery;
	    constructor(filePath: any);
	    init(): void;
	    getURI: () => string;
	    getTitle: () => string;
	    getIconName: () => string;
	}

}
declare module 'example/main/atom/views/simpleSelectionView' {
	/**
	 * A functional form of the SelectListView
	 * Only one of these bad boys is allowed on the screen at one time
	 */
	export interface SelectListViewOptions<T> {
	    items: T[];
	    /** everything except the `li` which is required */
	    viewForItem: (item: T) => string;
	    /** some property on item */
	    filterKey: string;
	    confirmed: (item: T) => any;
	}
	export default function simpleSelectionView<T>(options: SelectListViewOptions<T>): SimpleSelectListView<T>;
	/**
	 * Various Utility section
	 */
	import sp = require('atom-space-pen-views');
	export class SimpleSelectListView<T> extends sp.SelectListView {
	    options: SelectListViewOptions<T>;
	    constructor(options: SelectListViewOptions<T>);
	    $: JQuery;
	    setItems(): void;
	    /** override */
	    viewForItem(item: T): string;
	    /** override */
	    confirmed(item: T): void;
	    /** override */
	    getFilterKey(): string;
	    panel: AtomCore.Panel;
	    show(): void;
	    hide(): void;
	    cancelled(): void;
	}

}
declare module 'example/main/atom/views/simpleOverlaySelectionView' {
	/**
	 * A functional form of the SelectListView
	 * Only one of these bad boys is allowed on the screen at one time
	 */
	export interface SelectListViewOptions<T> {
	    items: T[];
	    /** everything except the `li` which is required and we add for you */
	    viewForItem: (item: T) => string;
	    /** some property on item */
	    filterKey: string;
	    confirmed: (item: T) => any;
	}
	export default function <T>(options: SelectListViewOptions<T>, editor: AtomCore.IEditor): SimpleOverlaySelectListView<T>;
	/**
	 * Various Utility section
	 */
	import sp = require('atom-space-pen-views');
	export class SimpleOverlaySelectListView<T> extends sp.SelectListView {
	    options: SelectListViewOptions<T>;
	    editor: AtomCore.IEditor;
	    private _overlayDecoration;
	    constructor(options: SelectListViewOptions<T>, editor: AtomCore.IEditor);
	    $: JQuery;
	    setItems(): void;
	    /** override */
	    viewForItem(item: T): string;
	    /** override */
	    confirmed(item: T): void;
	    /** override */
	    getFilterKey(): string;
	    show(): void;
	    hide(): void;
	    cancelled(): void;
	}

}
declare module 'example/main/atom/commands/outputFileCommands' {
	/**
	 * Command related to output files
	 */
	export function register(): void;

}
declare module 'example/main/atom/commands/commands' {
	export function registerCommands(): void;

}
declare module 'example/main/atom/debugAtomTs' {
	/// <reference path="../../globals.d.ts" />
	export function runDebugCode(details: {
	    filePath: string;
	    editor: AtomCore.IEditor;
	}): void;

}
declare module 'example/main/atom/onSaveHandler' {
	/// <reference path="../../globals.d.ts" />
	export function handle(event: {
	    filePath: string;
	    editor: AtomCore.IEditor;
	}): void;

}
declare module 'example/main/atom/signatureProvider' {
	/// <reference path="../../globals.d.ts" />
	export function requestHandler(config: {
	    editor: AtomCore.IEditor;
	    filePath: string;
	    position: number;
	}): void;

}
declare module 'example/main/atom/tooltipManager' {
	/// <reference path="../../globals.d.ts" />
	export function getFromShadowDom(element: JQuery, selector: string): JQuery;
	export function attach(editorView: JQuery, editor: AtomCore.IEditor): void;

}
declare module 'example/main/atom/views/awesomePanelView' {
	import view = require('example\main\atom\views\view');
	export class AwesomePanelView extends view.View<any> {
	    private something;
	    static content(): any;
	    init(): void;
	}
	export var panelView: AwesomePanelView;
	export var panel: AtomCore.Panel;
	export function attach(): void;

}
/// <reference path="../globals.d.ts" />
