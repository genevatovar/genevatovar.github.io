// Adjacency Matrix — Assignment 8
// Dataset: Zachary's Karate Club (soc-karate)
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
  const width = 960, height = 620;
  const margin = { top: 120, right: 220, bottom: 40, left: 100 };
  const plot_width  = width  - margin.left - margin.right;
  const plot_height = height - margin.top  - margin.bottom;

  // Build node list sorted: faction 1 first, then by degree (most connected first)
  const nodeIds = Array.from(new Set(links.flatMap(d => [d.source, d.target]))).sort((a,b) => a-b);
  const degreeMap = {};
  nodeIds.forEach(id => degreeMap[id] = 0);
  links.forEach(l => { degreeMap[l.source]++; degreeMap[l.target]++; });

  const nodes = nodeIds
    .map(id => ({ id, faction: FACTIONS[id], degree: degreeMap[id] }))
    .sort((a, b) => a.faction !== b.faction ? a.faction - b.faction : b.degree - a.degree);

  const n = nodes.length;
  const cell = Math.min(plot_width, plot_height) / n;

  // Store all edges in a Set for fast lookup when drawing cells
  const adjSet = new Set();
  links.forEach(l => {
    adjSet.add(`${l.source}-${l.target}`);
    adjSet.add(`${l.target}-${l.source}`);
  });
  const hasEdge = (a, b) => adjSet.has(`${a}-${b}`);

  // Color scale — ColorBrewer Set2
  // Three categories: within faction A, within faction B, between factions
  const colorScale = d3.scaleOrdinal()
    .domain(["Faction A–A", "Faction B–B", "Cross-faction"])
    .range([d3.schemeSet2[0], d3.schemeSet2[1], d3.schemeSet2[2]]);

  // SVG canvas
  const canvas = d3.select("#a8-adjmatrix")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const plot = canvas.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Title
  canvas.append("text")
    .attr("x", margin.left + (n * cell) / 2)
    .attr("y", 28)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .style("font-family", "Raleway, sans-serif")
    .text("Zachary's Karate Club — Adjacency Matrix");

  canvas.append("text")
    .attr("x", margin.left + (n * cell) / 2)
    .attr("y", 50)
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .style("fill", "#666")
    .style("font-family", "Nunito, sans-serif")
    .text("Nodes sorted by faction then degree · hover to highlight row & column");

  // Faction labels above the matrix columns
  const f1Count = nodes.filter(n => n.faction === 1).length;
  const f2Count = n - f1Count;

  canvas.append("text")
    .attr("x", margin.left + (f1Count * cell) / 2)
    .attr("y", margin.top - 30)
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .style("font-weight", "600")
    .style("fill", colorScale("Faction A–A"))
    .style("font-family", "Raleway, sans-serif")
    .text(`← Faction A (${f1Count}) →`);

  canvas.append("text")
    .attr("x", margin.left + f1Count * cell + (f2Count * cell) / 2)
    .attr("y", margin.top - 30)
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .style("font-weight", "600")
    .style("fill", colorScale("Faction B–B"))
    .style("font-family", "Raleway, sans-serif")
    .text(`← Faction B (${f2Count}) →`);

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

  // Row and column highlight bands — drawn before cells so they appear behind them
  const hRow = plot.append("rect")
    .attr("x", 0).attr("width", n * cell).attr("height", cell)
    .attr("fill", "#f0f0f0").attr("opacity", 0)
    .style("pointer-events", "none");

  const hCol = plot.append("rect")
    .attr("y", 0).attr("height", n * cell).attr("width", cell)
    .attr("fill", "#f0f0f0").attr("opacity", 0)
    .style("pointer-events", "none");

  // Draw one cell for every row/column pair
  nodes.forEach((rowNode, ri) => {
    nodes.forEach((colNode, ci) => {
      const connected = hasEdge(rowNode.id, colNode.id);
      const diagonal  = ri === ci;

      // Pick fill color based on relationship
      let fill = "none";
      if (diagonal) {
        fill = "#e8e8e8";
      } else if (connected) {
        if      (rowNode.faction === 1 && colNode.faction === 1) fill = colorScale("Faction A–A");
        else if (rowNode.faction === 2 && colNode.faction === 2) fill = colorScale("Faction B–B");
        else fill = colorScale("Cross-faction");
      }

      const cellG = plot.append("g")
        .attr("transform", `translate(${ci * cell},${ri * cell})`);

      // Visible colored rect
      cellG.append("rect")
        .attr("width",  cell - 0.8)
        .attr("height", cell - 0.8)
        .attr("fill", fill)
        .attr("fill-opacity", connected ? 0.82 : (diagonal ? 0.5 : 0))
        .attr("stroke", "#ddd")
        .attr("stroke-width", 0.3)
        .attr("rx", 0.5);

      // Transparent full-size rect to reliably catch hover events
      cellG.append("rect")
        .attr("width", cell)
        .attr("height", cell)
        .attr("fill", "transparent")
        .on("mouseover", function(event) {
          // Highlight the entire row and column
          hRow.attr("y", ri * cell).attr("opacity", 0.35);
          hCol.attr("x", ci * cell).attr("opacity", 0.35);

          // Bold the matching axis labels
          plot.selectAll(".row-label")
            .style("font-weight", (_, i) => i === ri ? "700" : "400")
            .style("fill",        (_, i) => i === ri ? "#111" : "#555");
          plot.selectAll(".col-label")
            .style("font-weight", (_, i) => i === ci ? "700" : "400")
            .style("fill",        (_, i) => i === ci ? "#111" : "#555");

          // Tooltip text depends on what kind of cell this is
          let html;
          if (diagonal) {
            html = `<strong>Node ${rowNode.id}</strong><br/>
                    Faction: ${rowNode.faction === 1 ? "Mr. Hi" : "Officer John"}<br/>
                    Degree: ${rowNode.degree}`;
          } else if (connected) {
            const rel = rowNode.faction === colNode.faction ? "Same faction" : "Cross-faction";
            html = `<strong>${rowNode.id} — ${colNode.id}</strong><br/>${rel} edge`;
          } else {
            html = `<strong>${rowNode.id} — ${colNode.id}</strong><br/>No connection`;
          }

          tooltip.style("opacity", 0.95)
            .html(html)
            .style("left", event.pageX + 12 + "px")
            .style("top",  event.pageY - 28 + "px");
        })
        .on("mousemove", event => {
          tooltip
            .style("left", event.pageX + 12 + "px")
            .style("top",  event.pageY - 28 + "px");
        })
        .on("mouseout", function() {
          hRow.attr("opacity", 0);
          hCol.attr("opacity", 0);
          plot.selectAll(".row-label").style("font-weight", "400").style("fill", "#555");
          plot.selectAll(".col-label").style("font-weight", "400").style("fill", "#555");
          tooltip.style("opacity", 0);
        });
    });
  });

  // Dashed lines separating the two faction blocks
  plot.append("line")
    .attr("x1", f1Count * cell).attr("x2", f1Count * cell)
    .attr("y1", 0).attr("y2", n * cell)
    .attr("stroke", "#aaa").attr("stroke-width", 1.5).attr("stroke-dasharray", "5,3");

  plot.append("line")
    .attr("y1", f1Count * cell).attr("y2", f1Count * cell)
    .attr("x1", 0).attr("x2", n * cell)
    .attr("stroke", "#aaa").attr("stroke-width", 1.5).attr("stroke-dasharray", "5,3");

  // Row labels (left side)
  plot.selectAll(".row-label")
    .data(nodes).join("text")
    .attr("class", "row-label")
    .attr("x", -5)
    .attr("y", (_, i) => i * cell + cell / 2)
    .attr("text-anchor", "end")
    .attr("dominant-baseline", "central")
    .style("font-size", `${Math.min(cell * 0.72, 9)}px`)
    .style("font-family", "Nunito, sans-serif")
    .style("fill", "#555")
    .text(d => d.id);

  // Column labels (top, rotated 45°)
  plot.selectAll(".col-label")
    .data(nodes).join("text")
    .attr("class", "col-label")
    .attr("x", (_, i) => i * cell + cell / 2)
    .attr("y", -5)
    .attr("text-anchor", "start")
    .attr("transform", (_, i) => `rotate(-45, ${i * cell + cell / 2}, -5)`)
    .style("font-size", `${Math.min(cell * 0.72, 9)}px`)
    .style("font-family", "Nunito, sans-serif")
    .style("fill", "#555")
    .text(d => d.id);

  // D3-legend (Susie Lu)
  const legendG = canvas.append("g")
    .attr("transform", `translate(${margin.left + n * cell + 24}, ${margin.top})`);

  legendG.call(
    d3.legendColor()
      .shape("rect").shapeWidth(16).shapeHeight(16).shapePadding(10)
      .orient("vertical").scale(colorScale).title("Edge Type")
  );

  legendG.select(".legendTitle")
    .style("font-size", "13px").style("font-weight", "bold").style("font-family", "Raleway, sans-serif");
  legendG.selectAll(".label")
    .style("font-size", "12px").style("font-family", "Nunito, sans-serif");

  // Extra legend entries for empty cells and the diagonal (not part of the color scale)
  [
    { fill: "none",    label: "No edge",        offset: 3 * 26 + 28 },
    { fill: "#e8e8e8", label: "Self (diagonal)", offset: 3 * 26 + 56 }
  ].forEach(({ fill, label, offset }) => {
    const g = legendG.append("g").attr("transform", `translate(0, ${offset})`);
    g.append("rect")
      .attr("width", 16).attr("height", 16)
      .attr("fill", fill).attr("fill-opacity", fill === "none" ? 0 : 0.5)
      .attr("stroke", "#ddd").attr("stroke-width", 1).attr("rx", 1);
    g.append("text")
      .attr("x", 24).attr("y", 12)
      .style("font-size", "12px").style("font-family", "Nunito, sans-serif").style("fill", "#666")
      .text(label);
  });
}

function draw() {
  d3.csv("karate.csv").then(data => {
    const links = data.map(d => ({ source: +d.source, target: +d.target }));
    drawGraph(links);
  }).catch(err => console.error("CSV load error:", err));
}

draw();