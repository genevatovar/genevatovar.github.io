// Proportional Symbols Map - Assignment 9
// Dataset: Expensive States cost-of-living index + state centroid lat/lng
// Variable: costIndex - overall cost of living (100 = national average)
// Top 10 most expensive states highlighted in a distinct color

async function draw() {
  const width = 960, height = 600;
  const margin = { top: 60, right: 220, bottom: 20, left: 20 };

  // Load map, cost data, and centroid data
  const [us, costRaw, centRaw] = await Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json"),
    d3.csv("expensive-states.csv", d => ({
      rank:           +d.costRank,
      state:          d.State.trim(),
      costIndex:      +d.costIndex,
      grocery:        +d.groceryCost,
      housing:        +d.housingCost,
      utilities:      +d.utilitiesCost,
      transportation: +d.transportationCost,
      misc:           +d.miscCost
    })),
    d3.csv("latlongcentr.csv", d => ({
      state: d.state.trim(),
      lat:   +d.lat,
      lng:   +d.lng,
      abbr:  d.postal_code.trim()
    }))
  ]);

  // Join on state name
  const centMap = new Map(centRaw.map(d => [d.state, d]));
  const data = costRaw
    .map(d => ({ ...d, ...centMap.get(d.state) }))
    .filter(d => d.lat !== undefined);

  // Projection
  const projection = d3.geoAlbersUsa()
    .scale(1280)
    .translate([width / 2, (height - margin.top - margin.bottom) / 2 + margin.top]);

  const path = d3.geoPath().projection(projection);

  // Scales
  const TOP_N = 10;
  const [minIdx, maxIdx] = d3.extent(data, d => d.costIndex);

  const rScale = d3.scaleSqrt()
    .domain([minIdx, maxIdx])
    .range([6, 32]);

  const COLOR_TOP  = "#e05252";
  const COLOR_REST = "#5f8dbf";

  // SVG
  const svg = d3.select("#a9-proportsymbl")
    .append("svg")
    .attr("width", width + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  // Title
  svg.append("text")
    .attr("x", (width + margin.right) / 2)
    .attr("y", 32)
    .attr("text-anchor", "middle")
    .style("font-size", "17px")
    .style("font-weight", "bold")
    .style("font-family", "Raleway, sans-serif")
    .style("fill", "#333")
    .text("U.S. State Cost-of-Living Index");

  svg.append("text")
    .attr("x", (width + margin.right) / 2)
    .attr("y", 52)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#666")
    .style("font-family", "Nunito, sans-serif")
    .text("Circle area ∝ cost index (100 = national avg) · top 10 most expensive highlighted · hover for details");

  const mapG = svg.append("g");

  // Draw state outlines
  const states = topojson.feature(us, us.objects.states);
  const statesBorder = topojson.mesh(us, us.objects.states, (a, b) => a !== b);

  mapG.selectAll(".state")
    .data(states.features)
    .join("path")
    .attr("class", "state")
    .attr("d", path)
    .attr("fill", "#f0efe9")
    .attr("stroke", "#c8c5bb")
    .attr("stroke-width", 0.6);

  mapG.append("path")
    .datum(statesBorder)
    .attr("fill", "none")
    .attr("stroke", "#b0aaa0")
    .attr("stroke-width", 0.8)
    .attr("d", path);

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

  // Draw proportional symbols (sorted large to small so smaller circles stay on top)
  const sorted = [...data].sort((a, b) => b.costIndex - a.costIndex);

  mapG.selectAll(".symbol")
    .data(sorted)
    .join("circle")
    .attr("class", "symbol")
    .attr("cx", d => {
      const proj = projection([d.lng, d.lat]);
      return proj ? proj[0] : null;
    })
    .attr("cy", d => {
      const proj = projection([d.lng, d.lat]);
      return proj ? proj[1] : null;
    })
    .attr("r", d => rScale(d.costIndex))
    .attr("fill", d => d.rank <= TOP_N ? COLOR_TOP : COLOR_REST)
    .attr("fill-opacity", 0.72)
    .attr("stroke", d => d.rank <= TOP_N ? "#b03030" : "#3a6491")
    .attr("stroke-width", 1.2)
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      d3.select(this)
        .attr("fill-opacity", 1)
        .attr("stroke-width", 2);
      tooltip.style("opacity", 0.97)
        .html(`
          <strong>${d.state}</strong> &nbsp;
          <span style="color:#888">Rank #${d.rank}</span><br/>
          <br/>
          Cost index: <strong>${d.costIndex}</strong><br/>
          Housing: ${d.housing} &nbsp;|&nbsp; Grocery: ${d.grocery}<br/>
          Utilities: ${d.utilities} &nbsp;|&nbsp; Transport: ${d.transportation}<br/>
          Misc: ${d.misc}
        `)
        .style("left", event.pageX + 14 + "px")
        .style("top",  event.pageY - 40 + "px");
    })
    .on("mousemove", event => {
      tooltip
        .style("left", event.pageX + 14 + "px")
        .style("top",  event.pageY - 40 + "px");
    })
    .on("mouseout", function () {
      d3.select(this)
        .attr("fill-opacity", 0.72)
        .attr("stroke-width", 1.2);
      tooltip.style("opacity", 0);
    });

  // State abbreviation labels on circles
  mapG.selectAll(".sym-label")
    .data(sorted)
    .join("text")
    .attr("class", "sym-label")
    .attr("x", d => { const p = projection([d.lng, d.lat]); return p ? p[0] : null; })
    .attr("y", d => { const p = projection([d.lng, d.lat]); return p ? p[1] + 4 : null; })
    .attr("text-anchor", "middle")
    .style("font-size", d => `${Math.min(rScale(d.costIndex) * 0.6, 10)}px`)
    .style("font-family", "Nunito, sans-serif")
    .style("font-weight", "700")
    .style("fill", "#fff")
    .style("pointer-events", "none")
    .text(d => d.abbr);

  // Legend
  const legendX = width + margin.left;
  const legendY = margin.top + 20;
  const legendG = svg.append("g").attr("transform", `translate(${legendX}, ${legendY})`);

  // Color legend
  legendG.append("text")
    .attr("x", 0).attr("y", 0)
    .style("font-size", "12px").style("font-weight", "bold")
    .style("font-family", "Raleway, sans-serif").style("fill", "#333")
    .text("Cost Rank");

  [
    { color: COLOR_TOP,  label: "Top 10 most expensive",  stroke: "#b03030" },
    { color: COLOR_REST, label: "Ranks 11–51",             stroke: "#3a6491" }
  ].forEach(({ color, label, stroke }, i) => {
    const g = legendG.append("g").attr("transform", `translate(0, ${20 + i * 26})`);
    g.append("circle")
      .attr("cx", 9).attr("cy", 9).attr("r", 9)
      .attr("fill", color).attr("fill-opacity", 0.72)
      .attr("stroke", stroke).attr("stroke-width", 1.2);
    g.append("text")
      .attr("x", 24).attr("y", 13)
      .style("font-size", "11px").style("font-family", "Nunito, sans-serif").style("fill", "#444")
      .text(label);
  });

  // Size legend
  const sizeLegendG = legendG.append("g").attr("transform", "translate(0, 92)");

  sizeLegendG.append("text")
    .attr("x", 0).attr("y", 0)
    .style("font-size", "12px").style("font-weight", "bold")
    .style("font-family", "Raleway, sans-serif").style("fill", "#333")
    .text("Cost Index");

  const sizeValues = [90, 110, 130, 160, 193];
  let yOffset = 20;
  sizeValues.forEach(v => {
    const r = rScale(v);
    const g = sizeLegendG.append("g").attr("transform", `translate(0, ${yOffset})`);
    g.append("circle")
      .attr("cx", 18).attr("cy", r)
      .attr("r", r)
      .attr("fill", "none")
      .attr("stroke", "#999").attr("stroke-width", 1);
    g.append("text")
      .attr("x", 44).attr("y", r + 4)
      .style("font-size", "11px").style("font-family", "Nunito, sans-serif").style("fill", "#555")
      .text(v);
    yOffset += r * 2 + 10;
  });
}

draw().catch(err => console.error("Load error:", err));
