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
    var d3Root = d3.select(rootElement);
    rootElement.innerHTML = "\n    <div class=\"graph\">\n      <div class=\"control-zoom\">\n          <a class=\"control-zoom-in\" href=\"#\" title=\"Zoom in\"></a>\n          <a class=\"control-zoom-out\" href=\"#\" title=\"Zoom out\"></a>\n        </div>\n    </div>";
    var nodes = {};
    var d3links = depndencies.map(function (link) {
        var source = nodes[link.sourcePath] || (nodes[link.sourcePath] = { name: link.sourcePath });
        var target = nodes[link.targetPath] || (nodes[link.targetPath] = { name: link.targetPath });
        return { source: source, target: target };
    });
    var zoom = d3.behavior.zoom();
    zoom.scale(0.4);
    zoom.on("zoom", onZoomChanged);
    var graph = d3Root.append("svg")
        .attr("pointer-events", "all")
        .call(zoom)
        .attr('width', '100%')
        .attr('height', '99%')
        .append('svg:g');
    var layout = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(d3links)
        .gravity(.05)
        .linkDistance(200)
        .charge(-300)
        .on("tick", tick)
        .start();
    resize();
    d3.select(window).on("resize", resize);
    centerGraph();
    var graphWidth, graphHeight;
    function resize() {
        graphWidth = mainContent.width();
        graphHeight = mainContent.height();
        graph.attr("width", graphWidth)
            .attr("height", graphHeight);
        layout.size([graphWidth, graphHeight])
            .resume();
    }
    function centerGraph() {
        var centerTranslate = [
            (graphWidth / 4),
            (graphHeight / 4),
        ];
        zoom.translate(centerTranslate);
        graph.transition()
            .duration(500)
            .attr("transform", "translate(" + zoom.translate() + ")" + " scale(" + zoom.scale() + ")");
    }
    function onZoomChanged() {
        graph.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
    }
    graph.append("defs").selectAll("marker")
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
    var path = graph.append("g").selectAll("path")
        .data(layout.links())
        .enter().append("path")
        .attr("class", function (d) { return "link resolved"; })
        .attr("marker-end", function (d) { return "url(#" + "resolved" + ")"; });
    var circle = graph.append("g").selectAll("circle")
        .data(layout.nodes())
        .enter().append("circle")
        .attr("r", 6)
        .call(layout.drag);
    var text = graph.append("g").selectAll("text")
        .data(layout.nodes())
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
