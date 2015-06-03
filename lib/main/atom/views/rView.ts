// Sample implementation of a react view 

import {uriForPath} from "../atomUtils";
import * as sp from "atom-space-pen-views";

import React = require('react');

var MyComponent = React.createClass({  
  render: function() {
      return React.createElement(
        'div',
        null,
        'This is a test'
      );
  }
});


/**
 * A base class for creating React based views in atom
 */
export class RView extends sp.ScrollView {

    public mainContent: JQuery;
    public get rootDomElement() {
        return this.mainContent[0];
    }
    static content() {
        return this.div({ class: 'atomts-r-view native-key-bindings' }, () => {
            this.div({ outlet: 'mainContent' });
        });
    }

    constructor(public config: {
        icon: string;
        title: string;
        filePath: string;
    }) {
        super();

        React.render(React.createElement(MyComponent,null),this.rootDomElement);
    }

        
    /** Override */
    static protocol: string = 'atomtsview:';

    public get $() { return <JQuery><any>this; }
    private getURI = () => uriForPath((<any>this.constructor).protocol, this.config.filePath);
    private getTitle = () => this.config.title;
    private getIconName = () => this.config.icon;
}      