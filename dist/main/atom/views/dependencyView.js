var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var sp = require('atom-space-pen-views');
var parent = require("../../../worker/parent");
var d3 = require("d3");
exports.dependencyURI = "ts-dependency:";
function dependencyUriForPath(filePath) {
    return exports.dependencyURI + "//" + filePath;
}
exports.dependencyUriForPath = dependencyUriForPath;
var DependencyView = (function (_super) {
    __extends(DependencyView, _super);
    function DependencyView(filePath) {
        var _this = this;
        _super.call(this);
        this.filePath = filePath;
        this.getURI = function () { return dependencyUriForPath(_this.filePath); };
        this.getTitle = function () { return 'TypeScript Dependencies'; };
        this.getIconName = function () { return 'git-compare'; };
        this.init();
    }
    DependencyView.content = function () {
        var _this = this;
        return this.div({ class: 'dependency-view' }, function () {
            _this.div({ style: 'display: flex' }, function () {
                _this.div({ outlet: 'mainContent', style: 'width: 50%' });
                _this.pre({ outlet: 'rawDisplay', style: 'width: 50%' });
            });
        });
    };
    DependencyView.prototype.init = function () {
        var _this = this;
        parent.getAST({ filePath: this.filePath }).then(function (res) {
            renderTree(res.root, _this.mainContent, function (node) {
                var display = ("\n" + node.kind + "\n-------------------- AST --------------------\n" + node.rawJson + "\n                ").trim();
                _this.rawDisplay.text(display);
            });
        });
    };
    return DependencyView;
})(sp.ScrollView);
exports.DependencyView = DependencyView;
function renderTree(rootNode, mainContent, display) {
    var rootElement = mainContent[0];
    var margin = { top: 30, right: 20, bottom: 30, left: 20 };
    var width = mainContent.width() - margin.left - margin.right;
    var barHeight = 30;
    var barWidth = width * .8;
    var i = 0, duration = 400;
    var tree = d3.layout.tree()
        .nodeSize([0, 20]);
    var diagonal = d3.svg.diagonal()
        .projection(function (d) { return [d.y, d.x]; });
    var svg = d3.select(rootElement).append("svg")
        .attr("width", width + margin.left + margin.right)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    var selected;
    select(rootNode);
    function update() {
        var nodes = tree.nodes(rootNode);
        var height = Math.max(500, nodes.length * barHeight + margin.top + margin.bottom);
        d3.select("svg").transition()
            .duration(duration)
            .attr("height", height);
        d3.select(self.frameElement).transition()
            .duration(duration)
            .style("height", height + "px");
        nodes.forEach(function (n, i) {
            n.x = i * barHeight;
        });
        var node = svg.selectAll("g.node")
            .data(nodes, function (d) { return d.id || (d.id = ++i); });
        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function (d) { return "translate(" + rootNode.depth + "," + rootNode.nodeIndex + ")"; })
            .style("opacity", 1e-6);
        nodeEnter.append("rect")
            .attr("y", -barHeight / 2)
            .attr("height", barHeight)
            .attr("width", barWidth)
            .style("fill", color)
            .on("click", select);
        nodeEnter.append("text")
            .attr("dy", 3.5)
            .attr("dx", 5.5)
            .text(function (d) {
            return d.kind;
        });
        nodeEnter.transition()
            .duration(duration)
            .attr("transform", function (d) { return "translate(" + d.y + "," + d.x + ")"; })
            .style("opacity", 1);
        node.transition()
            .duration(duration)
            .attr("transform", function (d) { return "translate(" + d.y + "," + d.x + ")"; })
            .style("opacity", 1)
            .select("rect")
            .style("fill", color);
        node.exit().transition()
            .duration(duration)
            .attr("transform", function (d) { return "translate(" + rootNode.nodeIndex + "," + rootNode.depth + ")"; })
            .style("opacity", 1e-6)
            .remove();
        var link = svg.selectAll("path.link")
            .data(tree.links(nodes), function (d) { return d.target.id; });
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
            var o = { x: rootNode.depth, y: rootNode.nodeIndex };
            return diagonal({ source: o, target: o });
        })
            .transition()
            .duration(duration)
            .attr("d", diagonal);
        link.transition()
            .duration(duration)
            .attr("d", diagonal);
        link.exit().transition()
            .duration(duration)
            .attr("d", function (d) {
            var o = { x: rootNode.depth, y: rootNode.nodeIndex };
            return diagonal({ source: o, target: o });
        })
            .remove();
    }
    function select(node) {
        display(node);
        selected = node;
        update();
    }
    function color(d) {
        if (selected == d) {
            return "rgb(140, 0, 0)";
        }
        return d.children ? "#000000" : "rgb(29, 166, 0)";
    }
}
