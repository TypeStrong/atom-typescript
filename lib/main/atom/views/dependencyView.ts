import sp = require('atom-space-pen-views');
import mainPanelView = require('./mainPanelView');
import ts = require('typescript');
import atomUtils = require("../atomUtils");
import * as parent from "../../../worker/parent";
import * as d3  from "d3";

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


function renderGraph(depndencies: FileDependency[], mainContent: JQuery, display: (content: FileDependency) => any) {

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

    var nodes = {};

    // Compute the distinct nodes from the links.
    var d3links = depndencies.map(function(link) {
        var source = nodes[link.sourcePath] || (nodes[link.sourcePath] = { name: link.sourcePath });
        var target = nodes[link.targetPath] || (nodes[link.targetPath] = { name: link.targetPath });
        return { source, target };
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
        .nodes(d3.values(nodes))
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
        .data(["suit", "licensing", "resolved"])
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

    var path = graph.append("g").selectAll("path")
        .data(layout.links())
        .enter().append("path")
        .attr("class", function(d: FileDependency) { return "link resolved" /* + d.type; */ })
        .attr("marker-end", function(d: FileDependency) { return "url(#" + /* d.type */ "resolved" + ")"; });

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
        .text(function(d) { return d.name; });

    // Use elliptical arc path segments to doubly-encode directionality.
    function tick() {
        path.attr("d", linkArc);
        circle.attr("transform", transform);
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

}
