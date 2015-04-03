import sp = require('atom-space-pen-views');
import mainPanelView = require('./mainPanelView');
import ts = require('typescript');
import atomUtils = require("../atomUtils");
import * as parent from "../../../worker/parent";


export var astURI = "ts-ast:";
export function astUriForPath(filePath: string) {
    return astURI + "//" + filePath;
}

/**
 * https://github.com/atom/atom-space-pen-views
 */
export class AstView extends sp.ScrollView {

    private something: JQuery;
    static content() {
        return this.div({ class: 'awesome' },
            () => this.div({ class: 'dude', outlet: 'something' })
            );
    }

    constructor(public filePath) {
        super();
        this.init();
    }

    init() {
        console.log('HERERERERERER')
        this.something.html('<div>tada</div>');

        parent.getAST({ filePath: this.filePath }).then((res) => {
            console.log(res.root);
        });
    }

    getURI = () => astUriForPath(this.filePath);
    getTitle = () => 'TypeScript AST'
    getIconName = () => 'repo-forked'
}
