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

    var nodes = {};

    // Compute the distinct nodes from the links.
    var d3links = depndencies.map(function(link) {
        var source = nodes[link.sourcePath] || (nodes[link.sourcePath] = { name: link.sourcePath });
        var target = nodes[link.targetPath] || (nodes[link.targetPath] = { name: link.targetPath });
        return { source, target };
    });

    var width = 960,
        height = 500;

    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(d3links)
        .size([width, height])
        .linkDistance(60)
        .charge(-300)
        .on("tick", tick)
        .start();

    var svg = d3.select(rootElement).append("svg").attr('width', '100%').attr('height', '98%');

    // Per-type markers, as they don't inherit styles.
    svg.append("defs").selectAll("marker")
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

    var path = svg.append("g").selectAll("path")
        .data(force.links())
        .enter().append("path")
        .attr("class", function(d: FileDependency) { return "link resolved" /* + d.type; */ })
        .attr("marker-end", function(d: FileDependency) { return "url(#" + /* d.type */ "resolved"+ ")"; });

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
