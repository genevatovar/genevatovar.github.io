// Node-Link Diagram — Assignment 8
// Dataset: Zachary's Karate Club (soc-karate, networkrepository.com)
// 34 nodes, 78 edges — social network of friendships in a university karate club
// Source: Rossi & Ahmed (2015), networkrepository.com/soc-karate

// Which faction each node belongs to (from Zachary's 1977 paper)
// 1 = Mr. Hi's group, 2 = Officer John's group
const FACTIONS = {
  1:1,  2:1,  3:1,  4:1,  5:1,  6:1,  7:1,  8:1,  9:2,  10:2,
  11:1, 12:1, 13:1, 14:2, 15:2, 16:2, 17:1, 18:1, 19:2, 20:1,
  21:2, 22:1, 23:2, 24:2, 25:2, 26:2, 27:2, 28:2, 29:2, 30:2,
  31:2, 32:2, 33:2, 34:2
};

function drawGraph(links) {
  const width = 960, height = 580;
  const margin = { top: 70, right: 220, bottom: 60, left: 40 };
  const plot_width  = width  - margin.left - margin.right;
  const plot_height = height - margin.top  - margin.bottom;

  // Build node list and compute each node's degree from the edge list
  const nodeIds = Array.from(new Set(links.flatMap(d => [d.source, d.target]))).sort((a,b) => a-b);
  const nodes = nodeIds.map(id => ({ id, faction: FACTIONS[id], degree: 0 }));
  const nodeIndex = Object.fromEntries(nodes.map((n, i) => [n.id, i]));

  links.forEach(l => {
    nodes[nodeIndex[l.source]].degree++;
    nodes[nodeIndex[l.target]].degree++;
  });

  // Remap links to array indices so D3 force simulation can reference them
  const simLinks = links.map(l => ({
    source: nodeIndex[l.source],
    target: nodeIndex[l.target],
    sourceFaction: FACTIONS[l.source],
    targetFaction: FACTIONS[l.target]
  }));

  // Color scale — ColorBrewer Dark2, one color per faction
  const colorScale = d3.scaleOrdinal()
    .domain([1, 2])
    .range([d3.schemeDark2[0], d3.schemeDark2[1]]);

  // SVG canvas
  const canvas = d3.select("#a8-nodelink")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const plot = canvas.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Title
  canvas.append("text")
    .attr("x", margin.left + plot_width / 2)
    .attr("y", 28)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("font-family", "Raleway, sans-serif")
    .text("Zachary's Karate Club — Force-Directed Layout with Edge Bundling");

  canvas.append("text")
    .attr("x", margin.left + plot_width / 2)
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .style("fill", "#666")
    .style("font-family", "Nunito, sans-serif")
    .text("Edges bundled toward network centroid · adjust tension with slider · hover node to inspect");

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

  // Bundling tension slider — embedded in the SVG via foreignObject
  let tension = 0.85;

  const controlG = canvas.append("g")
    .attr("transform", `translate(${margin.left + plot_width / 2 - 120}, ${height - 28})`);

  controlG.append("text")
    .attr("x", 0).attr("y", 12)
    .style("font-size", "12px")
    .style("font-family", "Nunito, sans-serif")
    .style("fill", "#444")
    .text("Bundling tension:");

  controlG.append("foreignObject")
    .attr("x", 125).attr("y", -2)
    .attr("width", 110).attr("height", 24)
    .append("xhtml:input")
    .attr("type", "range")
    .attr("min", 0).attr("max", 1).attr("step", 0.05)
    .attr("value", 0.85)
    .style("width", "100px")
    .on("input", function() {
      tensionLabel.text(parseFloat(this.value).toFixed(2));
      tension = parseFloat(this.value);
      redrawEdges();
    });

  const tensionLabel = controlG.append("text")
    .attr("x", 242).attr("y", 12)
    .style("font-size", "12px")
    .style("font-family", "Nunito, sans-serif")
    .style("font-weight", "600")
    .style("fill", "#333")
    .text("0.85");

  // Run the simulation to a stable layout before drawing anything,
  // so nodes aren't all stacked at the center on first render
  const simulation = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(simLinks).id((_, i) => i).distance(58).strength(0.55))
    .force("charge", d3.forceManyBody().strength(-190))
    .force("center", d3.forceCenter(plot_width / 2, plot_height / 2))
    .force("collision", d3.forceCollide().radius(d => 6 + d.degree * 0.8));

  simulation.stop();
  for (let i = 0; i < 300; i++) simulation.tick();

  // Each edge is a quadratic Bézier curve whose control point is pulled
  // toward the network centroid by `tension` (0 = straight, 1 = all through center)
  function centroid() {
    return { x: d3.mean(nodes, d => d.x), y: d3.mean(nodes, d => d.y) };
  }

  function bundledPath(s, t) {
    const mx = (s.x + t.x) / 2, my = (s.y + t.y) / 2;
    const c = centroid();
    return `M${s.x},${s.y} Q${mx + (c.x - mx) * tension},${my + (c.y - my) * tension} ${t.x},${t.y}`;
  }

  // Draw edges — cross-faction edges are grey, same-faction edges use faction color
  const linkGroup = plot.append("g").attr("class", "links");

  let linkPaths = linkGroup.selectAll("path")
    .data(simLinks)
    .join("path")
    .attr("d", d => bundledPath(d.source, d.target))
    .attr("fill", "none")
    .attr("stroke", d => d.sourceFaction !== d.targetFaction ? "#bbb" : colorScale(d.sourceFaction))
    .attr("stroke-width", 1.2)
    .attr("stroke-opacity", d => d.sourceFaction !== d.targetFaction ? 0.38 : 0.48)
    .attr("stroke-linecap", "round");

  function redrawEdges() {
    linkPaths.attr("d", d => bundledPath(d.source, d.target));
  }

  // Draw nodes — sized by degree so hubs are visually larger
  const nodeEl = plot.append("g").attr("class", "nodes")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("class", "node")
    .attr("transform", d => `translate(${d.x},${d.y})`)
    .call(d3.drag()
      .on("start", (event, d) => { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag",  (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on("end",   (event, d) => { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
    );

  nodeEl.append("circle")
    .attr("r", d => 5 + d.degree * 0.85)
    .attr("fill", d => colorScale(d.faction))
    .attr("fill-opacity", 0.85)
    .attr("stroke", d => colorScale(d.faction))
    .attr("stroke-width", 1.5)
    .attr("stroke-opacity", 0.45);

  nodeEl.append("text")
    .text(d => d.id)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "central")
    .style("font-size", "8px")
    .style("font-family", "Nunito, sans-serif")
    .style("fill", "#fff")
    .style("pointer-events", "none");

  // On hover: highlight connected edges, dim unrelated nodes, show tooltip
  nodeEl
    .on("mouseover", function(event, d) {
      linkPaths
        .attr("stroke-opacity", l => (l.source.id === d.id || l.target.id === d.id) ? 0.9 : 0.06)
        .attr("stroke-width",   l => (l.source.id === d.id || l.target.id === d.id) ? 2.5 : 1.2);
      nodeEl.selectAll("circle")
        .attr("fill-opacity", n => {
          if (n.id === d.id) return 1;
          return simLinks.some(l =>
            (l.source.id === d.id && l.target.id === n.id) ||
            (l.target.id === d.id && l.source.id === n.id)
          ) ? 0.85 : 0.15;
        });
      tooltip.style("opacity", 0.95)
        .html(`<strong>Node ${d.id}</strong><br/>
               Faction: ${d.faction === 1 ? "Mr. Hi" : "Officer John"}<br/>
               Degree: ${d.degree}`)
        .style("left", event.pageX + 12 + "px")
        .style("top",  event.pageY - 28 + "px");
    })
    .on("mousemove", event => {
      tooltip
        .style("left", event.pageX + 12 + "px")
        .style("top",  event.pageY - 28 + "px");
    })
    .on("mouseout", function() {
      linkPaths
        .attr("stroke-opacity", d => d.sourceFaction !== d.targetFaction ? 0.38 : 0.48)
        .attr("stroke-width", 1.2);
      nodeEl.selectAll("circle").attr("fill-opacity", 0.85);
      tooltip.style("opacity", 0);
    });

  // Keep node positions and edge paths in sync while dragging
  simulation.on("tick", () => {
    nodeEl.attr("transform", d => `translate(${d.x},${d.y})`);
    redrawEdges();
  });
  simulation.alpha(0.3).restart();

  // D3-legend (Susie Lu)
  const legendG = canvas.append("g")
    .attr("transform", `translate(${margin.left + plot_width + 24}, ${margin.top + 20})`);

  legendG.call(
    d3.legendColor()
      .shape("circle").shapeRadius(7).shapePadding(10).orient("vertical")
      .scale(colorScale)
      .labels(["Faction A (Mr. Hi)", "Faction B (Officer John)"])
      .title("Faction")
  );

  legendG.select(".legendTitle")
    .style("font-size", "13px").style("font-weight", "bold").style("font-family", "Raleway, sans-serif");
  legendG.selectAll(".label")
    .style("font-size", "12px").style("font-family", "Nunito, sans-serif");

  // Cross-faction edges aren't in the color scale, so add a manual legend entry
  const crossG = legendG.append("g").attr("transform", `translate(0, ${2 * 26 + 28})`);
  crossG.append("line")
    .attr("x1", 0).attr("x2", 18).attr("y1", 7).attr("y2", 7)
    .attr("stroke", "#bbb").attr("stroke-width", 2);
  crossG.append("text")
    .attr("x", 26).attr("y", 12)
    .style("font-size", "12px").style("font-family", "Nunito, sans-serif").style("fill", "#555")
    .text("Cross-faction edge");
}

function draw() {
  d3.csv("karate.csv").then(data => {
    const links = data.map(d => ({ source: +d.source, target: +d.target }));
    drawGraph(links);
  }).catch(err => console.error("CSV load error:", err));
}

draw();