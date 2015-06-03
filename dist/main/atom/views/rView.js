// Sample implementation of a react view
// DOCS: 
// http://facebook.github.io/react/blog/2015/01/27/react-v0.13.0-beta-1.html#es6-classes
// https://facebook.github.io/react/docs/component-specs.html
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var atomUtils_1 = require("../atomUtils");
var sp = require("atom-space-pen-views");
var React = require('react');
var MyComponent = (function (_super) {
    __extends(MyComponent, _super);
    function MyComponent(props) {
        _super.call(this, props);
        this.state = { count: 0 };
    }
    MyComponent.prototype.componentDidMount = function () {
        var _this = this;
        setInterval(function () {
            _this.setState({ count: _this.state.count + 1 });
        });
    };
    MyComponent.prototype.render = function () {
        return React.createElement('div', null, 'This is a test: ' + this.state.count);
    };
    MyComponent.defaultProps = { count: 0 };
    return MyComponent;
})(React.Component);
var RView = (function (_super) {
    __extends(RView, _super);
    function RView(config) {
        var _this = this;
        _super.call(this);
        this.config = config;
        this.getURI = function () { return atomUtils_1.uriForPath(_this.constructor.protocol, _this.config.filePath); };
        this.getTitle = function () { return _this.config.title; };
        this.getIconName = function () { return _this.config.icon; };
        React.render(React.createElement(MyComponent, {}), this.rootDomElement);
    }
    Object.defineProperty(RView.prototype, "rootDomElement", {
        get: function () {
            return this.mainContent[0];
        },
        enumerable: true,
        configurable: true
    });
    RView.content = function () {
        var _this = this;
        return this.div({ class: 'atomts-r-view native-key-bindings' }, function () {
            _this.div({ outlet: 'mainContent' });
        });
    };
    Object.defineProperty(RView.prototype, "$", {
        get: function () { return this; },
        enumerable: true,
        configurable: true
    });
    RView.protocol = 'atomtsview:';
    return RView;
})(sp.ScrollView);
exports.RView = RView;
