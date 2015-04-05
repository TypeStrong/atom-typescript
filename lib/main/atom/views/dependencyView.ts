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

    public mainContent: JQuery;
    public rawDisplay: JQuery;
    static content() {
        return this.div({ class: 'dependency-view' }, () => {
            this.div({ style: 'display: flex' }, () => {
                this.div({ outlet: 'mainContent', style: 'width: 50%' })
                this.pre({ outlet: 'rawDisplay', style: 'width: 50%' })
            })
        });
    }

    constructor(public filePath) {
        super();
        this.init();
    }
    init() {
        parent.getAST({ filePath: this.filePath }).then((res) => {
            renderTree(res.root, this.mainContent, (node) => {
                var display = `
${node.kind}
-------------------- AST --------------------
${node.rawJson}
                `.trim();
                this.rawDisplay.text(display);
            });
        });
    }

    getURI = () => dependencyUriForPath(this.filePath);
    getTitle = () => 'TypeScript Dependencies'
    getIconName = () => 'git-compare'
}


function renderTree(rootNode: NodeDisplay, mainContent: JQuery, display: (content: NodeDisplay) => any) {
    var rootElement = mainContent[0];
    var margin = { top: 30, right: 20, bottom: 30, left: 20 };
    var width = mainContent.width() - margin.left - margin.right;
    var barHeight = 30;
    var barWidth = width * .8;

    var i = 0,
        duration = 400;

    var tree = d3.layout.tree()
        .nodeSize([0, 20]);

    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });

    var svg = d3.select(rootElement).append("svg")
        .attr("width", width + margin.left + margin.right)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var selected: NodeDisplay;
    select(rootNode);

    function update() {

        // Compute the flattened node list. TODO use d3.layout.hierarchy.
        var nodes = tree.nodes(rootNode);

        var height = Math.max(500, nodes.length * barHeight + margin.top + margin.bottom);

        d3.select("svg").transition()
            .duration(duration)
            .attr("height", height);

        d3.select(self.frameElement).transition()
            .duration(duration)
            .style("height", height + "px");

        // Compute the "layout".
        nodes.forEach(function(n, i) {
            n.x = i * barHeight;
        });

        // Update the nodes…
        var node = svg.selectAll("g.node")
            .data(nodes, function(d) { return d.id || (d.id = ++i); });

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + rootNode.depth + "," + rootNode.nodeIndex + ")"; })
            .style("opacity", 1e-6);

        // Enter any new nodes at the parent's previous position.
        nodeEnter.append("rect")
            .attr("y", -barHeight / 2)
            .attr("height", barHeight)
            .attr("width", barWidth)
            .style("fill", color)
            .on("click", select);

        nodeEnter.append("text")
            .attr("dy", 3.5)
            .attr("dx", 5.5)
            .text(function(d: NodeDisplay) {
            return d.kind;
        });

        // Transition nodes to their new position.
        nodeEnter.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
            .style("opacity", 1);

        node.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
            .style("opacity", 1)
            .select("rect")
            .style("fill", color);

        // Transition exiting nodes to the parent's new position.
        node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + rootNode.nodeIndex + "," + rootNode.depth + ")"; })
            .style("opacity", 1e-6)
            .remove();

        // Update the links…
        var link = svg.selectAll("path.link")
            .data(tree.links(nodes), function(d) { return d.target.id; });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
            var o = { x: rootNode.depth, y: rootNode.nodeIndex };
            return diagonal({ source: o, target: o });
        })
            .transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
            var o = { x: rootNode.depth, y: rootNode.nodeIndex };
            return diagonal({ source: o, target: o });
        })
            .remove();
    }

    /** display details on click */
    function select(node: NodeDisplay) {
        display(node);
        selected = node;
        update();
    }

    function color(d: NodeDisplay) {
        if (selected == d) {
            return "rgb(140, 0, 0)";
        }
        return d.children ? "#000000" : "rgb(29, 166, 0)";
    }

}
