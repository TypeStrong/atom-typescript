///ts:ref=globals
/// <reference path="../../globals.ts"/> ///ts:ref:generated

// more: https://github.com/atom-community/autocomplete-plus/wiki/Provider-API


declare module autocompleteplus {
    export interface RequestOptions {
        editor: AtomCore.IEditor;
        position: any; // the position of the cursor
    }
}


var provider = {
    selector: '.source.js,.source.ts',
    requestHandler: (options) => {
        console.log(options);
        return [];
    }
}

export = provider;
