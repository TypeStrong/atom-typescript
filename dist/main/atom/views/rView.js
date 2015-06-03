// Sample implementation of a react view 
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var atomUtils_1 = require("../atomUtils");
var sp = require("atom-space-pen-views");
var React = require('react');
var MyComponent = React.createClass({
    render: function () {
        return React.createElement('div', null, 'This is a test');
    }
});
var RView = (function (_super) {
    __extends(RView, _super);
    function RView(config) {
        var _this = this;
        _super.call(this);
        this.config = config;
        this.getURI = function () { return atomUtils_1.uriForPath(_this.constructor.protocol, _this.config.filePath); };
        this.getTitle = function () { return _this.config.title; };
        this.getIconName = function () { return _this.config.icon; };
        React.render(React.createElement(MyComponent, null), this.rootDomElement);
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
