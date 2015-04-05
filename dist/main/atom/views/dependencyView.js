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
        var _this = this;
        return this.div({ class: 'dependency-view' }, function () {
            _this.div({ outlet: 'mainContent', style: 'width: 100%' });
        });
    };
    DependencyView.prototype.init = function () {
        var _this = this;
        parent.getAST({ filePath: this.filePath }).then(function (res) {
            renderTree(res.root, _this.mainContent, function (node) {
            });
        });
    };
    return DependencyView;
})(sp.ScrollView);
exports.DependencyView = DependencyView;
function renderTree(rootNode, mainContent, display) {
    var rootElement = mainContent[0];
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
    links.forEach(function (link) {
        link.source = nodes[link.source] || (nodes[link.source] = { name: link.source });
        link.target = nodes[link.target] || (nodes[link.target] = { name: link.target });
    });
    var width = 960, height = 500;
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
    svg.append("defs").selectAll("marker")
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
    var path = svg.append("g").selectAll("path")
        .data(force.links())
        .enter().append("path")
        .attr("class", function (d) { return "link " + d.type; })
        .attr("marker-end", function (d) { return "url(#" + d.type + ")"; });
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
