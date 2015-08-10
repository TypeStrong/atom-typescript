var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var sp = require('atom-space-pen-views');
var atomUtils = require("../atomUtils");
var parent = require("../../../worker/parent");
var d3 = require("d3");
var path_1 = require("path");
var fsUtil_1 = require("../../utils/fsUtil");
var os = require("os");
exports.dependencyURI = "ts-dependency:";
var DependencyView = (function (_super) {
    __extends(DependencyView, _super);
    function DependencyView(filePath) {
        var _this = this;
        _super.call(this);
        this.filePath = filePath;
        this.getURI = function () { return atomUtils.uriForPath(exports.dependencyURI, _this.filePath); };
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
    rootElement.innerHTML = "\n    <div class=\"graph\">\n      <div class=\"control-zoom\">\n          <a class=\"control-zoom-in\" href=\"#\" title=\"Zoom in\"></a>\n          <a class=\"control-zoom-out\" href=\"#\" title=\"Zoom out\"></a>\n        </div>\n    <div class=\"filter-section\">\n        <label>Filter: (enter to commit)</label>\n        <input id=\"filter\" class=\"native-key-bindings\"></input>\n    </div>\n    <div class='copy-message'>\n        <button class='btn btn-xs'>Copy Messages</button>\n    </div>\n    <div class=\"general-messages\"></div>\n    </div>";
    var messagesElement = mainContent.find('.general-messages');
    messagesElement.text("No Issues Found!");
    var filterElement = mainContent.find('#filter');
    filterElement.keyup(function (event) {
        if (event.keyCode !== 13) {
            return;
        }
        var val = filterElement.val().trim();
        if (!val) {
            nodes.classed('filtered-out', false);
            links.classed('filtered-out', false);
            text.classed('filtered-out', false);
            return;
        }
        else {
            nodes.classed('filtered-out', true);
            links.classed('filtered-out', true);
            text.classed('filtered-out', true);
            var filteredNodes = graph.selectAll("circle[data-name*=\"" + htmlName({ name: val }) + "\"]");
            filteredNodes.classed('filtered-out', false);
            var filteredLinks = graph.selectAll("[data-source*=\"" + htmlName({ name: val }) + "\"][data-target*=\"" + htmlName({ name: val }) + "\"]");
            filteredLinks.classed('filtered-out', false);
            var filteredText = graph.selectAll("text[data-name*=\"" + htmlName({ name: val }) + "\"]");
            filteredText.classed('filtered-out', false);
        }
    });
    var copyDisplay = mainContent.find('.copy-message>button');
    var d3NodeLookup = {};
    var d3links = dependencies.map(function (link) {
        var source = d3NodeLookup[link.sourcePath] || (d3NodeLookup[link.sourcePath] = { name: link.sourcePath });
        var target = d3NodeLookup[link.targetPath] || (d3NodeLookup[link.targetPath] = { name: link.targetPath });
        return { source: source, target: target };
    });
    var d3Graph = new D3Graph(d3links);
    if (d3Graph.cycles().length) {
        var cycles = d3Graph.cycles();
        var message = '';
        var textContent = '';
        for (var _i = 0; _i < cycles.length; _i++) {
            var cycle = cycles[_i];
            message += '<h3>Cycle Found: </h3>';
            message += cycle.join(' <br/> ') + '<br/>';
            textContent += '---Cycle Found---' + os.EOL;
            textContent += cycle.join(os.EOL) + os.EOL;
        }
        messagesElement.html(message);
        copyDisplay.show().on('click', function () {
            atom.clipboard.write(textContent);
            atom.notifications.addInfo('Copied!');
        });
    }
    else {
        copyDisplay.hide();
        messagesElement.hide();
    }
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
        .attr("data-name", function (o) { return htmlName(o); })
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
        nodes.classed('not-hovering', false);
        nodes.classed('dimmed', false);
        if (fade) {
            nodes.each(function (o) {
                if (!d3Graph.isConnected(d, o)) {
                    this.classList.add('not-hovering');
                    this.classList.add('dimmed');
                }
            });
        }
        graph.selectAll('path.link').attr('data-show', '')
            .classed('outgoing', false)
            .attr('marker-end', fade ? '' : 'url(#regular)')
            .classed('incomming', false)
            .classed('dimmed', fade);
        links.each(function (o) {
            if (o.source.name === d.name) {
                this.classList.remove('dimmed');
                var elmNodes = graph.selectAll('.' + formatClassName(prefixes.circle, o.target));
                elmNodes.attr('fill-opacity', 1);
                elmNodes.attr('stroke-opacity', 1);
                elmNodes.classed('dimmed', false);
                var outgoingLink = graph.selectAll('path.link[data-source="' + htmlName(o.source) + '"]');
                outgoingLink.attr('data-show', 'true');
                outgoingLink.attr('marker-end', 'url(#regular)');
                outgoingLink.classed('outgoing', true);
            }
            else if (o.target.name === d.name) {
                this.classList.remove('dimmed');
                var incommingLink = graph.selectAll('path.link[data-target="' + htmlName(o.target) + '"]');
                incommingLink.attr('data-show', 'true');
                incommingLink.attr('marker-end', 'url(#regular)');
                incommingLink.classed('incomming', true);
            }
        });
        text.classed("dimmed", function (o) {
            if (!fade)
                return false;
            if (d3Graph.isConnected(d, o))
                return false;
            return true;
        });
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
        return fsUtil_1.consistentPath(path_1.relative(link.source.name, link.target.name)).split('/').length;
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
    D3Graph.prototype.cycles = function () {
        return this.circularPaths;
    };
    return D3Graph;
})();
function linkArc(d) {
    var targetX = d.target.x;
    var targetY = d.target.y;
    var sourceX = d.source.x;
    var sourceY = d.source.y;
    var theta = Math.atan((targetX - sourceX) / (targetY - sourceY));
    var phi = Math.atan((targetY - sourceY) / (targetX - sourceX));
    var sinTheta = d.source.weight / 2 * Math.sin(theta);
    var cosTheta = d.source.weight / 2 * Math.cos(theta);
    var sinPhi = (d.target.weight - 6) * Math.sin(phi);
    var cosPhi = (d.target.weight - 6) * Math.cos(phi);
    if (d.target.y > d.source.y) {
        sourceX = sourceX + sinTheta;
        sourceY = sourceY + cosTheta;
    }
    else {
        sourceX = sourceX - sinTheta;
        sourceY = sourceY - cosTheta;
    }
    if (d.source.x > d.target.x) {
        targetX = targetX + cosPhi;
        targetY = targetY + sinPhi;
    }
    else {
        targetX = targetX - cosPhi;
        targetY = targetY - sinPhi;
    }
    var dx = targetX - sourceX, dy = targetY - sourceY, dr = Math.sqrt(dx * dx + dy * dy);
    return "M" + sourceX + "," + sourceY + "A" + dr + "," + dr + " 0 0,1 " + targetX + "," + targetY;
}
