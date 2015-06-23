var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var sp = require('atom-space-pen-views');
var atomUtils = require("../atomUtils");
var parent = require("../../../worker/parent");
var d3 = require("d3");
exports.astURI = "ts-ast:";
exports.astURIFull = "ts-ast-full:";
var AstView = (function (_super) {
    __extends(AstView, _super);
    function AstView(filePath, text, full) {
        var _this = this;
        _super.call(this);
        this.filePath = filePath;
        this.text = text;
        this.full = full;
        this.getURI = function () { return atomUtils.uriForPath(_this.full ? exports.astURIFull : exports.astURI, _this.filePath); };
        this.getTitle = function () { return 'TypeScript AST'; };
        this.getIconName = function () { return 'repo-forked'; };
        this.init();
    }
    AstView.content = function () {
        var _this = this;
        return this.div({ class: 'ast-view' }, function () {
            _this.div({ style: 'display: flex' }, function () {
                _this.div({ outlet: 'mainContent', style: 'width: 50%' });
                _this.pre({ class: 'raw-display', outlet: 'rawDisplay', style: 'width: 50%' });
            });
        });
    };
    AstView.prototype.init = function () {
        var _this = this;
        if (this.full) {
            var query = parent.getASTFull({ filePath: this.filePath });
        }
        else {
            query = parent.getAST({ filePath: this.filePath });
        }
        query.then(function (res) {
            renderTree(res.root, _this.mainContent, function (node) {
                var display = ("\n" + node.kind + "\n-------------------- AST --------------------\n" + node.rawJson + "\n-------------------- TEXT -------------------\n" + _this.text.substring(node.pos, node.end) + "\n                ").trim();
                _this.rawDisplay.text(display);
            });
        });
    };
    return AstView;
})(sp.ScrollView);
exports.AstView = AstView;
function renderTree(rootNode, _mainContent, display) {
    var root = {
        dom: _mainContent[0],
        jq: _mainContent
    };
    var margin = { top: 30, right: 20, bottom: 30, left: 20 };
    var width = root.jq.width() - margin.left - margin.right;
    var barHeight = 30;
    var barWidth = width * .8;
    var i = 0, duration = 400;
    var tree = d3.layout.tree()
        .nodeSize([0, 20]);
    var diagonal = d3.svg.diagonal()
        .projection(function (d) { return [d.y, d.x]; });
    var graphRoot = d3.select(root.dom).append("svg")
        .attr("width", width + margin.left + margin.right);
    var graph = graphRoot.append("g")
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
        var node = graph.selectAll("g.node")
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
        var link = graph.selectAll("path.link")
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
    function resize() {
        width = root.jq.width() - margin.left - margin.right;
        d3.select("svg").attr("width", width);
        update();
    }
    d3.select(root.dom).on("resize", resize);
    resize();
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
