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
        return this.div({ class: 'dependency-view' }, function () {
        });
    };
    Object.defineProperty(DependencyView.prototype, "$", {
        get: function () {
            return this;
        },
        enumerable: true,
        configurable: true
    });
    DependencyView.prototype.init = function () {
        var _this = this;
        parent.getDependencies({ filePath: this.filePath }).then(function (res) {
            renderGraph(res.links, _this.$, function (node) {
            });
        });
    };
    return DependencyView;
})(sp.ScrollView);
exports.DependencyView = DependencyView;
function renderGraph(depndencies, mainContent, display) {
    var rootElement = mainContent[0];
    var nodes = {};
    var d3links = depndencies.map(function (link) {
        var source = nodes[link.sourcePath] || (nodes[link.sourcePath] = { name: link.sourcePath });
        var target = nodes[link.targetPath] || (nodes[link.targetPath] = { name: link.targetPath });
        return { source: source, target: target };
    });
    var width = 960, height = 500;
    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(d3links)
        .size([width, height])
        .linkDistance(60)
        .charge(-300)
        .on("tick", tick)
        .start();
    var svg = d3.select(rootElement).append("svg").attr('width', '100%').attr('height', '98%');
    svg.append("defs").selectAll("marker")
        .data(["suit", "licensing", "resolved"])
        .enter().append("marker")
        .attr("id", function (d) { return d; })
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", -1.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5");
    var path = svg.append("g").selectAll("path")
        .data(force.links())
        .enter().append("path")
        .attr("class", function (d) { return "link resolved"; })
        .attr("marker-end", function (d) { return "url(#" + "resolved" + ")"; });
    var circle = svg.append("g").selectAll("circle")
        .data(force.nodes())
        .enter().append("circle")
        .attr("r", 6)
        .call(force.drag);
    var text = svg.append("g").selectAll("text")
        .data(force.nodes())
        .enter().append("text")
        .attr("x", 8)
        .attr("y", ".31em")
        .text(function (d) { return d.name; });
    function tick() {
        path.attr("d", linkArc);
        circle.attr("transform", transform);
        text.attr("transform", transform);
    }
    function linkArc(d) {
        var dx = d.target.x - d.source.x, dy = d.target.y - d.source.y, dr = Math.sqrt(dx * dx + dy * dy);
        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    }
    function transform(d) {
        return "translate(" + d.x + "," + d.y + ")";
    }
}
