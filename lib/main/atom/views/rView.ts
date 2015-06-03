// Sample implementation of a react view
// DOCS: 
// http://facebook.github.io/react/blog/2015/01/27/react-v0.13.0-beta-1.html#es6-classes
// https://facebook.github.io/react/docs/component-specs.html

import {uriForPath} from "../atomUtils";
import * as sp from "atom-space-pen-views";

import React = require('react');

interface Props { initialCount: number }
interface State { count: number }

class MyComponent extends React.Component<Props, State>{

    static defaultProps = { count: 0 };
    state = { count: 0 };
    constructor(props: Props) {
        super(props);
    }

    componentDidMount() {
        setInterval(() => {
            this.setState({ count: this.state.count + 1 });
        });
    }

    render() {
        return React.createElement(
            'div',
            null,
            'This is a test: ' + this.state.count
            );
    }
}


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

        React.render(React.createElement(MyComponent, {}), this.rootDomElement);
    }

        
    /** Override */
    static protocol: string = 'atomtsview:';

    public get $() { return <JQuery><any>this; }
    private getURI = () => uriForPath((<any>this.constructor).protocol, this.config.filePath);
    private getTitle = () => this.config.title;
    private getIconName = () => this.config.icon;
}      