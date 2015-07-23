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

    interval: number;
    componentDidMount() {
        this.interval = setInterval(() => {
            this.setState({ count: this.state.count + 1 });
        });
    }

    stop = () => {
        clearInterval(this.interval);
    }

    render() {
        return <div onClick={this.stop}>
            This is a test: {this.state.count}
        </div>
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
        return this.div({ class: 'atomts atomts-r-view native-key-bindings' }, () => {
            this.div({ outlet: 'mainContent layout' });
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

    public get $() { return this as any as JQuery; }
    private getURI = () => uriForPath((this.constructor as any).protocol, this.config.filePath);
    private getTitle = () => this.config.title;
    private getIconName = () => this.config.icon;
}
