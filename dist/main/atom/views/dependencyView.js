var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var sp = require('atom-space-pen-views');
var parent = require("../../../worker/parent");
var d3 = require("d3");
var path_1 = require("path");
var tsconfig_1 = require("../../tsconfig/tsconfig");
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
var prefixes = {
    circle: 'circle'
};
function renderGraph(dependencies, mainContent, display) {
    var rootElement = mainContent[0];
    var d3Root = d3.select(rootElement);
    rootElement.innerHTML = "\n    <div class=\"graph\">\n      <div class=\"control-zoom\">\n          <a class=\"control-zoom-in\" href=\"#\" title=\"Zoom in\"></a>\n          <a class=\"control-zoom-out\" href=\"#\" title=\"Zoom out\"></a>\n        </div>\n    </div>";
    var d3NodeLookup = {};
    var d3links = dependencies.map(function (link) {
        var source = d3NodeLookup[link.sourcePath] || (d3NodeLookup[link.sourcePath] = { name: link.sourcePath });
        var target = d3NodeLookup[link.targetPath] || (d3NodeLookup[link.targetPath] = { name: link.targetPath });
        return { source: source, target: target };
    });
    var d3Graph = new D3Graph(d3links);
    Object.keys(d3NodeLookup).forEach(function (name) {
        var node = d3NodeLookup[name];
        node.weight = d3Graph.avgDeg(node);
    });
    var zoom = d3.behavior.zoom();
    zoom.scale(0.4);
    zoom.on("zoom", onZoomChanged);
    var graph = d3Root.append("svg")
        .attr('width', '100%')
        .attr('height', '99%')
        .call(zoom)
        .append('svg:g');
    var layout = d3.layout.force()
        .nodes(d3.values(d3NodeLookup))
        .links(d3links)
        .gravity(.05)
        .linkDistance(function (link) { return (d3Graph.difference(link)) * 200; })
        .charge(-900)
        .on("tick", tick)
        .start();
    var drag = layout.drag()
        .on("dragstart", dragstart);
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
        .attr("data-target", function (o) { return htmlName(o.target); })
        .attr("data-source", function (o) { return htmlName(o.source); })
        .attr("marker-end", function (d) { return "url(#regular)"; });
    var nodes = graph.append("g").selectAll("circle")
        .data(layout.nodes())
        .enter().append("circle")
        .attr("class", function (d) { return formatClassName(prefixes.circle, d); })
        .attr("r", function (d) { return Math.max(d.weight, 3); })
        .classed("inonly", function (d) { return d3Graph.inOnly(d); })
        .classed("outonly", function (d) { return d3Graph.outOnly(d); })
        .classed("circular", function (d) { return d3Graph.isCircular(d); })
        .call(drag)
        .on("dblclick", dblclick)
        .on("mouseover", function (d) { onNodeMouseOver(d); })
        .on("mouseout", function (d) { onNodeMouseOut(d); });
    var text = graph.append("g").selectAll("text")
        .data(layout.nodes())
        .enter().append("text")
        .attr("x", 8)
        .attr("y", ".31em")
        .attr("data-name", function (o) { return htmlName(o); })
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
    function onNodeMouseOver(d) {
        var elm = findElementByNode(prefixes.circle, d);
        elm.classed("hovering", true);
        updateNodeTransparencies(d, true);
    }
    function onNodeMouseOut(d) {
        var elm = findElementByNode(prefixes.circle, d);
        elm.classed("hovering", false);
        updateNodeTransparencies(d, false);
    }
    function findElementByNode(prefix, node) {
        var selector = '.' + formatClassName(prefix, node);
        return graph.select(selector);
    }
    function updateNodeTransparencies(d, fade) {
        if (fade === void 0) { fade = true; }
        var opacity = fade ? .05 : 1;
        nodes.style("stroke-opacity", function (o) {
            if (d3Graph.isConnected(d, o)) {
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
        mainContent.find('path.link').removeAttr('data-show')
            .attr('class', 'link');
        links.style("stroke-opacity", function (o) {
            if (o.source.name === d.name) {
                var elmNodes = graph.selectAll('.' + formatClassName(prefixes.circle, o.target));
                elmNodes.attr('fill-opacity', 1);
                elmNodes.attr('stroke-opacity', 1);
                elmNodes.classed('dimmed', false);
                var outgoingLink = mainContent.find('path.link[data-source=' + htmlName(o.source) + ']');
                outgoingLink.attr('data-show', 'true');
                outgoingLink.attr('marker-end', 'url(#regular)');
                outgoingLink.attr('class', 'link outgoing');
                return 1;
            }
            else if (o.target.name === d.name) {
                var incommingLink = mainContent.find('path.link[data-target=' + htmlName(o.target) + ']');
                incommingLink.attr('data-show', 'true');
                incommingLink.attr('marker-end', 'url(#regular)');
                incommingLink.attr('class', 'link incomming');
                return 1;
            }
            else {
                return opacity;
            }
        });
        text.style("opacity", function (o) {
            if (!fade)
                return 1;
            if (d3Graph.isConnected(d, o))
                return 1;
            return opacity;
        });
        var elmAllLinks = mainContent.find('path.link:not([data-show])');
        if (!fade) {
            elmAllLinks.attr('marker-end', 'url(#regular)');
        }
        else {
            elmAllLinks.attr('marker-end', '');
        }
    }
    function formatClassName(prefix, object) {
        return prefix + '-' + htmlName(object);
    }
    function htmlName(object) {
        return object.name.replace(/(\.|\/)/gi, '-');
    }
    function dragstart(d) {
        d.fixed = true;
        d3.event.sourceEvent.stopPropagation();
        d3.select(this).classed("fixed", true);
    }
    function dblclick(d) {
        d3.select(this).classed("fixed", d.fixed = false);
    }
}
var D3Graph = (function () {
    function D3Graph(links) {
        var _this = this;
        this.links = links;
        this.inDegLookup = {};
        this.outDegLookup = {};
        this.linkedByName = {};
        this.targetsBySourceName = {};
        this.circularPaths = [];
        links.forEach(function (l) {
            if (!_this.inDegLookup[l.target.name])
                _this.inDegLookup[l.target.name] = 2;
            else
                _this.inDegLookup[l.target.name]++;
            if (!_this.outDegLookup[l.source.name])
                _this.outDegLookup[l.source.name] = 2;
            else
                _this.outDegLookup[l.source.name]++;
            _this.linkedByName[l.source.name + "," + l.target.name] = 1;
            if (!_this.targetsBySourceName[l.source.name])
                _this.targetsBySourceName[l.source.name] = [];
            _this.targetsBySourceName[l.source.name].push(l.target);
        });
        this.findCircular();
    }
    D3Graph.prototype.inDeg = function (node) {
        return this.inDegLookup[node.name] ? this.inDegLookup[node.name] : 1;
    };
    D3Graph.prototype.outDeg = function (node) {
        return this.outDegLookup[node.name] ? this.outDegLookup[node.name] : 1;
    };
    D3Graph.prototype.avgDeg = function (node) {
        return (this.inDeg(node) + this.outDeg(node)) / 2;
    };
    D3Graph.prototype.isConnected = function (a, b) {
        return this.linkedByName[a.name + "," + b.name] || this.linkedByName[b.name + "," + a.name] || a.name == b.name;
    };
    D3Graph.prototype.difference = function (link) {
        return tsconfig_1.consistentPath(path_1.relative(link.source.name, link.target.name)).split('/').length;
    };
    D3Graph.prototype.inOnly = function (node) {
        return !this.outDegLookup[node.name] && this.inDegLookup[node.name];
    };
    D3Graph.prototype.outOnly = function (node) {
        return !this.inDegLookup[node.name] && this.outDegLookup[node.name];
    };
    D3Graph.prototype.getPath = function (parent, unresolved) {
        var parentVisited = false;
        return Object.keys(unresolved).filter(function (module) {
            if (module === parent.name) {
                parentVisited = true;
            }
            return parentVisited && unresolved[module];
        });
    };
    D3Graph.prototype.resolver = function (sourceName, resolved, unresolved) {
        var _this = this;
        unresolved[sourceName] = true;
        if (this.targetsBySourceName[sourceName]) {
            this.targetsBySourceName[sourceName].forEach(function (dependency) {
                if (!resolved[dependency.name]) {
                    if (unresolved[dependency.name]) {
                        _this.circularPaths.push(_this.getPath(dependency, unresolved));
                        return;
                    }
                    _this.resolver(dependency.name, resolved, unresolved);
                }
            });
        }
        resolved[sourceName] = true;
        unresolved[sourceName] = false;
    };
    D3Graph.prototype.findCircular = function () {
        var _this = this;
        var resolved = {}, unresolved = {};
        Object.keys(this.targetsBySourceName).forEach(function (sourceName) {
            _this.resolver(sourceName, resolved, unresolved);
        });
    };
    ;
    D3Graph.prototype.isCircular = function (node) {
        var cyclic = false;
        this.circularPaths.some(function (path) {
            if (path.indexOf(node.name) >= 0) {
                cyclic = true;
                return true;
            }
            return false;
        });
        return cyclic;
    };
    return D3Graph;
})();
