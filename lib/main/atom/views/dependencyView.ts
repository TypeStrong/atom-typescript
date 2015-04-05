import sp = require('atom-space-pen-views');
import mainPanelView = require('./mainPanelView');
import ts = require('typescript');
import atomUtils = require("../atomUtils");
import * as parent from "../../../worker/parent";
import * as d3  from "d3";
import {$} from "atom-space-pen-views";

export var dependencyURI = "ts-dependency:";
export function dependencyUriForPath(filePath: string) {
    return dependencyURI + "//" + filePath;
}

/**
 * https://github.com/atom/atom-space-pen-views
 */
export class DependencyView extends sp.ScrollView {

    static content() {
        return this.div({ class: 'dependency-view' }, () => {
        });
    }

    get $(): JQuery {
        return <any>this;
    }

    constructor(public filePath) {
        super();
        this.init();
    }
    init() {
        parent.getDependencies({ filePath: this.filePath }).then((res) => {
            renderGraph(res.links, this.$, (node) => {
            });
        });
    }

    getURI = () => dependencyUriForPath(this.filePath);
    getTitle = () => 'TypeScript Dependencies'
    getIconName = () => 'git-compare'
}


interface D3LinkNode {
    name: string

    // added by d3 : forcelayout.links(d3links)
    index: number;
    weight: number;
    x: number;
    y: number;
}
interface D3Link {
    source: D3LinkNode;
    target: D3LinkNode;
}


function renderGraph(dependencies: FileDependency[], mainContent: JQuery, display: (content: FileDependency) => any) {

    var rootElement = mainContent[0];
    var d3Root = d3.select(rootElement)

    // Setup zoom controls
    rootElement.innerHTML = `
    <div class="graph">
      <div class="control-zoom">
          <a class="control-zoom-in" href="#" title="Zoom in"></a>
          <a class="control-zoom-out" href="#" title="Zoom out"></a>
        </div>
    </div>`;

    var linkedByName = {};

    // Compute the distinct nodes from the links.
    var d3LinkCache = {};
    var d3links: D3Link[] = dependencies.map(function(link) {
        var source = d3LinkCache[link.sourcePath] || (d3LinkCache[link.sourcePath] = { name: link.sourcePath });
        var target = d3LinkCache[link.targetPath] || (d3LinkCache[link.targetPath] = { name: link.targetPath });
        return { source, target };
    });

    // Build linked index
    d3links.forEach(function(d) {
        linkedByName[d.source.name + "," + d.target.name] = 1;
    });

    // Setup zoom
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

    /** resize initially and setup for resize */
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
        // Render transition
        graph.transition()
            .duration(500)
            .attr("transform", "translate(" + zoom.translate() + ")" + " scale(" + zoom.scale() + ")");
    }


    function onZoomChanged() {
        graph.attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
    }


    // Per-type markers, as they don't inherit styles.
    graph.append("defs").selectAll("marker")
        .data(["regular"])
        .enter().append("marker")
        .attr("id", function(d) { return d; })
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
        .attr("class", function(d: D3Link) { return "link"; })
        .attr("marker-end", function(d: D3Link) { return "url(#regular)"; });

    var nodes = graph.append("g").selectAll("circle")
        .data(layout.nodes())
        .enter().append("circle")
        .attr("class", function(d: D3LinkNode) { return formatClassName('circle', d) }) // Store class name for easier later lookup
        .attr("r", 6)
        .call(layout.drag)
        .on("mouseover", function(d) { onNodeMouseOver(nodes, links, d) })
        .on("mouseout", function(d) { onNodeMouseOut(nodes, links, d) });


    var text = graph.append("g").selectAll("text")
        .data(layout.nodes())
        .enter().append("text")
        .attr("x", 8)
        .attr("y", ".31em")
        .text(function(d) { return d.name; });

    // Use elliptical arc path segments to doubly-encode directionality.
    function tick() {
        links.attr("d", linkArc);
        nodes.attr("transform", transform);
        text.attr("transform", transform);
    }

    function linkArc(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    }

    function transform(d) {
        return "translate(" + d.x + "," + d.y + ")";
    }


    function onNodeMouseOver(nodes, links, d) {
        // Highlight circle
        var elm = findElementByNode('circle', d);
        elm.style("fill", '#b94431');
        // Highlight related nodes
        fadeRelatedNodes(d, .05, nodes, links);
    }
    function onNodeMouseOut(nodes, links, d) {
        // Highlight circle
        var elm = findElementByNode('circle', d);
        elm.style("fill", '#ccc');
        // Highlight related nodes
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
        // Clean
        $('path.link').removeAttr('data-show');
        nodes.style("stroke-opacity", function(o) {
            if (isConnected(d, o)) {
                var thisOpacity = 1;
            } else {
                thisOpacity = opacity;
            }
            this.setAttribute('fill-opacity', thisOpacity);
            this.setAttribute('stroke-opacity', thisOpacity);
            if (thisOpacity == 1) {
                this.classList.remove('dimmed');
            } else {
                this.classList.add('dimmed');
            }
            return thisOpacity;
        });
        links.style("stroke-opacity", function(o) {
            if (o.source === d) {
                // Highlight target/sources of the link
                var elmNodes = graph.selectAll('.' + formatClassName('node', o.target));
                elmNodes.attr('fill-opacity', 1);
                elmNodes.attr('stroke-opacity', 1);
                elmNodes.classed('dimmed', false);
                // Highlight arrows
                var elmCurrentLink = $('path.link[data-source=' + o.source.index + ']');
                elmCurrentLink.attr('data-show', 'true');
                elmCurrentLink.attr('marker-end', 'url(#regular)');
                return 1;
            } else {
                var elmAllLinks = $('path.link:not([data-show])');
                if (opacity == 1) {
                    elmAllLinks.attr('marker-end', 'url(#regular)');
                } else {
                    elmAllLinks.attr('marker-end', '');
                }
                return opacity;
            }
        });
    }

    // Helpers
    function formatClassName(prefix, object: D3LinkNode) {
        return prefix + '-' + object.name.replace(/(\.|\/)/gi, '-');
    }

}
