interface Window {
  atom_typescript_debug: boolean
}

// escape-html
declare module 'escape-html' {
    function escape(html: string): string;
    export = escape;
}

declare module 'atom-space-pen-views' {
    import atom = require('atom');
    export class SelectListView extends atom.SelectListView { }
    export class ScrollView extends atom.ScrollView { }
    export class View extends atom.View { }
    export var $: JQueryStatic;
}

declare module AtomCore {
    export interface IEditor {
        element: any;
    }
}
