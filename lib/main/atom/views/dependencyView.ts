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


interface D3LinkNode extends D3.Layout.GraphNodeForce {
    name: string
}
interface D3Link {
    source: D3LinkNode;
    target: D3LinkNode;
}

var prefixes = {
    circle: 'circle'
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
        .attr('width', '100%')
        .attr('height', '99%')
        .call(zoom)
        .append('svg:g');
    var layout = d3.layout.force()
        .nodes(d3.values(d3LinkCache))
        .links(d3links)
        .gravity(.05)
        .linkDistance(300) // TODO: caculate this based on file path sizes
        .charge(-300)
        .on("tick", tick)
        .start();

    var drag = layout.drag()
        .on("dragstart", dragstart);

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
        .attr("data-target", function(o: D3Link) { return htmlName(o.target) })
        .attr("data-source", function(o: D3Link) { return htmlName(o.source) })
        .attr("marker-end", function(d: D3Link) { return "url(#regular)"; });

    var nodes = graph.append("g").selectAll("circle")
        .data(layout.nodes())
        .enter().append("circle")
        .attr("class", function(d: D3LinkNode) { return formatClassName(prefixes.circle, d) }) // Store class name for easier later lookup
        .attr("r", 6) // TODO: drive this based on in degree or out degree
        .call(drag)
        .on("dblclick", dblclick) // Unstick
        .on("mouseover", function(d: D3LinkNode) { onNodeMouseOver(d) })
        .on("mouseout", function(d: D3LinkNode) { onNodeMouseOut(d) })

    var text = graph.append("g").selectAll("text")
        .data(layout.nodes())
        .enter().append("text")
        .attr("x", 8)
        .attr("y", ".31em")
        .attr("data-name", function(o: D3LinkNode) { return htmlName(o) })
        .text(function(d) { return d.name; });

    // Use elliptical arc path segments to doubly-encode directionality.
    function tick() {
        links.attr("d", linkArc);
        nodes.attr("transform", transform);
        text.attr("transform", transform);
    }

    function linkArc(d: D3Link) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = Math.sqrt(dx * dx + dy * dy);
        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    }

    function transform(d: D3LinkNode) {
        return "translate(" + d.x + "," + d.y + ")";
    }


    function onNodeMouseOver(d: D3LinkNode) {
        // Highlight circle
        var elm = findElementByNode(prefixes.circle, d);
        elm.style("fill", '#b94431');

        updateNodeTransparencies(d, true);
    }
    function onNodeMouseOut(d: D3LinkNode) {
        // Highlight circle
        var elm = findElementByNode(prefixes.circle, d);
        elm.style("fill", '#ccc');

        updateNodeTransparencies(d, false);
    }

    function findElementByNode(prefix, node) {
        var selector = '.' + formatClassName(prefix, node);
        return graph.select(selector);
    }

    function isConnected(a: D3LinkNode, b: D3LinkNode) {
        return linkedByName[a.name + "," + b.name] || linkedByName[b.name + "," + a.name] || a.name == b.name;
    }

    function updateNodeTransparencies(d: D3LinkNode, fade = true) {
        var opacity = fade ? .05 : 1;

        // Poor mans loop of node (`this`) as well as the associated data element `o`
        nodes.style("stroke-opacity", function(o: D3LinkNode) {
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

        // Clean
        mainContent.find('path.link').removeAttr('data-show')
            .attr('class', 'link'); // http://stackoverflow.com/questions/8638621/jquery-svg-why-cant-i-addclass

        links.style("stroke-opacity", function(o: D3Link) {
            if (o.source.name === d.name) {

                // Highlight target of the link
                var elmNodes = graph.selectAll('.' + formatClassName(prefixes.circle, o.target));
                elmNodes.attr('fill-opacity', 1);
                elmNodes.attr('stroke-opacity', 1);
                elmNodes.classed('dimmed', false);

                // Highlight arrows
                let outgoingLink = mainContent.find('path.link[data-source=' + htmlName(o.source) + ']');
                outgoingLink.attr('data-show', 'true');
                outgoingLink.attr('marker-end', 'url(#regular)');
                outgoingLink.attr('class', 'link outgoing');

                return 1;
            }
            else if (o.target.name === d.name) {
                // Highlight arrows
                let incommingLink = mainContent.find('path.link[data-target=' + htmlName(o.target) + ']');
                incommingLink.attr('data-show', 'true');
                incommingLink.attr('marker-end', 'url(#regular)');
                incommingLink.attr('class', 'link incomming');

                return 1;
            }
            else {
                return opacity;
            }
        });

        text.style("opacity", function(o: D3LinkNode) {
            if (!fade) return 1;

            if (isConnected(d, o)) {
                return 1;
            }
            return 0;
        });

        // Hide other lines element markers
        var elmAllLinks = mainContent.find('path.link:not([data-show])');
        if (!fade) {
            elmAllLinks.attr('marker-end', 'url(#regular)');
        } else {
            elmAllLinks.attr('marker-end', '');
        }
    }

    // Helpers
    function formatClassName(prefix, object: D3LinkNode) {
        return prefix + '-' + htmlName(object);
    }
    function htmlName(object: D3LinkNode) {
        return object.name.replace(/(\.|\/)/gi, '-');
    }

    function dragstart(d) {
        d.fixed = true; // http://bl.ocks.org/mbostock/3750558
        d3.event.sourceEvent.stopPropagation(); // http://bl.ocks.org/mbostock/6123708
        d3.select(this).classed("fixed", true);
    }

    function dblclick(d) {
        d3.select(this).classed("fixed", d.fixed = false);
    }

}
