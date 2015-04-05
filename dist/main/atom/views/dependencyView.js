var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var sp = require('atom-space-pen-views');
var parent = require("../../../worker/parent");
var d3 = require("d3");
var atom_space_pen_views_1 = require("atom-space-pen-views");
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
function renderGraph(dependencies, mainContent, display) {
    var rootElement = mainContent[0];
    var d3Root = d3.select(rootElement);
    rootElement.innerHTML = "\n    <div class=\"graph\">\n      <div class=\"control-zoom\">\n          <a class=\"control-zoom-in\" href=\"#\" title=\"Zoom in\"></a>\n          <a class=\"control-zoom-out\" href=\"#\" title=\"Zoom out\"></a>\n        </div>\n    </div>";
    var linkedByName = {};
    var d3LinkCache = {};
    var d3links = dependencies.map(function (link) {
        var source = d3LinkCache[link.sourcePath] || (d3LinkCache[link.sourcePath] = { name: link.sourcePath });
        var target = d3LinkCache[link.targetPath] || (d3LinkCache[link.targetPath] = { name: link.targetPath });
        return { source: source, target: target };
    });
    d3links.forEach(function (d) {
        linkedByName[d.source.name + "," + d.target.name] = 1;
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
        .nodes(d3.values(d3LinkCache))
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
        .data(["regular"])
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
    var links = graph.append("g").selectAll("path")
        .data(layout.links())
        .enter().append("path")
        .attr("class", function (d) { return "link"; })
        .attr("marker-end", function (d) { return "url(#regular)"; });
    var nodes = graph.append("g").selectAll("circle")
        .data(layout.nodes())
        .enter().append("circle")
        .attr("class", function (d) { return formatClassName('circle', d); })
        .attr("r", 6)
        .call(layout.drag)
        .on("mouseover", function (d) { onNodeMouseOver(nodes, links, d); })
        .on("mouseout", function (d) { onNodeMouseOut(nodes, links, d); });
    var text = graph.append("g").selectAll("text")
        .data(layout.nodes())
        .enter().append("text")
        .attr("x", 8)
        .attr("y", ".31em")
        .text(function (d) { return d.name; });
    function tick() {
        links.attr("d", linkArc);
        nodes.attr("transform", transform);
        text.attr("transform", transform);
    }
    function linkArc(d) {
        var dx = d.target.x - d.source.x, dy = d.target.y - d.source.y, dr = Math.sqrt(dx * dx + dy * dy);
        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    }
    function transform(d) {
        return "translate(" + d.x + "," + d.y + ")";
    }
    function onNodeMouseOver(nodes, links, d) {
        var elm = findElementByNode('circle', d);
        elm.style("fill", '#b94431');
        fadeRelatedNodes(d, .05, nodes, links);
    }
    function onNodeMouseOut(nodes, links, d) {
        var elm = findElementByNode('circle', d);
        elm.style("fill", '#ccc');
        fadeRelatedNodes(d, 1, nodes, links);
    }
    function findElementByNode(prefix, node) {
        var selector = '.' + formatClassName(prefix, node);
        return graph.select(selector);
    }
    function isConnected(a, b) {
        return linkedByName[a.index + "," + b.index] || linkedByName[b.index + "," + a.index] || a.index == b.index;
    }
    function fadeRelatedNodes(d, opacity, nodes, links) {
        atom_space_pen_views_1.$('path.link').removeAttr('data-show');
        nodes.style("stroke-opacity", function (o) {
            if (isConnected(d, o)) {
                var thisOpacity = 1;
            }
            else {
                thisOpacity = opacity;
            }
            this.setAttribute('fill-opacity', thisOpacity);
            this.setAttribute('stroke-opacity', thisOpacity);
            if (thisOpacity == 1) {
                this.classList.remove('dimmed');
            }
            else {
                this.classList.add('dimmed');
            }
            return thisOpacity;
        });
        links.style("stroke-opacity", function (o) {
            if (o.source === d) {
                var elmNodes = graph.selectAll('.' + formatClassName('node', o.target));
                elmNodes.attr('fill-opacity', 1);
                elmNodes.attr('stroke-opacity', 1);
                elmNodes.classed('dimmed', false);
                var elmCurrentLink = atom_space_pen_views_1.$('path.link[data-source=' + o.source.index + ']');
                elmCurrentLink.attr('data-show', 'true');
                elmCurrentLink.attr('marker-end', 'url(#regular)');
                return 1;
            }
            else {
                var elmAllLinks = atom_space_pen_views_1.$('path.link:not([data-show])');
                if (opacity == 1) {
                    elmAllLinks.attr('marker-end', 'url(#regular)');
                }
                else {
                    elmAllLinks.attr('marker-end', '');
                }
                return opacity;
            }
        });
    }
    function formatClassName(prefix, object) {
        return prefix + '-' + object.name.replace(/(\.|\/)/gi, '-');
    }
}
