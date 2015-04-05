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
    static content() {
        return this.div({ class: 'dependency-view' }, () => {
            this.div({ outlet: 'mainContent', style: 'width: 100%' })
        });
    }

    constructor(public filePath) {
        super();
        this.init();
    }
    init() {
        parent.getAST({ filePath: this.filePath }).then((res) => {
            renderTree(res.root, this.mainContent, (node) => {
            });
        });
    }

    getURI = () => dependencyUriForPath(this.filePath);
    getTitle = () => 'TypeScript Dependencies'
    getIconName = () => 'git-compare'
}


function renderTree(rootNode: NodeDisplay, mainContent: JQuery, display: (content: NodeDisplay) => any) {

    var rootElement = mainContent[0];

    // http://blog.thomsonreuters.com/index.php/mobile-patent-suits-graphic-of-the-day/
    var links = [
        { source: "Microsoft", target: "Amazon", type: "licensing" },
        { source: "Microsoft", target: "HTC", type: "licensing" },
        { source: "Samsung", target: "Apple", type: "suit" },
        { source: "Motorola", target: "Apple", type: "suit" },
        { source: "Nokia", target: "Apple", type: "resolved" },
        { source: "HTC", target: "Apple", type: "suit" },
        { source: "Kodak", target: "Apple", type: "suit" },
        { source: "Microsoft", target: "Barnes & Noble", type: "suit" },
        { source: "Microsoft", target: "Foxconn", type: "suit" },
        { source: "Oracle", target: "Google", type: "suit" },
        { source: "Apple", target: "HTC", type: "suit" },
        { source: "Microsoft", target: "Inventec", type: "suit" },
        { source: "Samsung", target: "Kodak", type: "resolved" },
        { source: "LG", target: "Kodak", type: "resolved" },
        { source: "RIM", target: "Kodak", type: "suit" },
        { source: "Sony", target: "LG", type: "suit" },
        { source: "Kodak", target: "LG", type: "resolved" },
        { source: "Apple", target: "Nokia", type: "resolved" },
        { source: "Qualcomm", target: "Nokia", type: "resolved" },
        { source: "Apple", target: "Motorola", type: "suit" },
        { source: "Microsoft", target: "Motorola", type: "suit" },
        { source: "Motorola", target: "Microsoft", type: "suit" },
        { source: "Huawei", target: "ZTE", type: "suit" },
        { source: "Ericsson", target: "ZTE", type: "suit" },
        { source: "Kodak", target: "Samsung", type: "resolved" },
        { source: "Apple", target: "Samsung", type: "suit" },
        { source: "Kodak", target: "RIM", type: "suit" },
        { source: "Nokia", target: "Qualcomm", type: "suit" }
    ];

    var nodes = {};

    // Compute the distinct nodes from the links.
    links.forEach(function(link) {
        link.source = nodes[link.source] || (nodes[link.source] = { name: link.source });
        link.target = nodes[link.target] || (nodes[link.target] = { name: link.target });
    });

    var width = 960,
        height = 500;

    var force = d3.layout.force()
        .nodes(d3.values(nodes))
        .links(links)
        .size([width, height])
        .linkDistance(60)
        .charge(-300)
        .on("tick", tick)
        .start();

    var svg = d3.select(rootElement).append("svg")
        .attr("width", width)
        .attr("height", height);

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
        .attr("class", function(d) { return "link " + d.type; })
        .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });

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
