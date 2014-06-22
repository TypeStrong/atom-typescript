typescript-services
===================
[![NPM version](https://badge.fury.io/js/typescript-services.svg)](http://badge.fury.io/js/typescript-services)
[![Views](https://sourcegraph.com/api/repos/github.com/basarat/typescript-services/counters/views.png)](https://sourcegraph.com/github.com/basarat/typescript-services)

[![NPM](https://nodei.co/npm/typescript-services.png?downloads=true)](https://nodei.co/npm/typescript-services/)

Open up TypeScript services for nodejs consumption

# Usage
```typescript
/// <reference path="./typescriptServices.d.ts"/>
import ts = require('typescript-services');

// formatter:
var snapshot = ts.SimpleText.fromString('var foo = 123;');
var formatter = new ts.Services.Formatting.TextSnapshot(snapshot);
console.log(formatter);

```
# Contributing
## Getting the language service
Opening up the TypeScript compiler : http://www.slideshare.net/nnzz2475/typescript-35845723 
```bash
git glone https://git01.codeplex.com/typescript TypeScript
cd TypeScript
npm install 
node_modules/.bin/jake local
cd built/local
ls
```
Important:
```bash
typescriptServices.d.ts
typescriptServices.js
```

## unwrap

###.js
Add line at bottom of .js:
```typescript
module.exports = TypeScript;
```
###.d.ts
Add header needed to a valid DT definition: 

```typescript
// Type definitions for TypeScript-Services
// Project: https://www.npmjs.org/package/typescript-services
// Definitions by: Basarat Ali Syed <http://github.com/basarat>
// Definitions: https://github.com/borisyankov/DefinitelyTyped
```
Cleanup the following lines from `.d.ts` as these should come from `node.d.ts`. 
```typescript
declare var require: any;
declare var module: any;
```
```typescript
declare module process {
    var argv: string[];
    var platform: string;
    function on(event: string, handler: (arg: any) => void): void;
    module stdout {
        function write(str: string): any;
        function on(event: string, action: () => void): void;
    }
    module stderr {
        function write(str: string): any;
        function on(event: string, action: () => void): void;
    }
    module mainModule {
        var filename: string;
    }
    function exit(exitCode?: number): any;
}
declare var Buffer: new(str: string, encoding?: string) => any;
```
```typescript
declare var global: any;
```
Add line at bottom on .d.ts: 
```typescript
declare module 'typescript-services' {
    export = TypeScript;
}
```
All set!