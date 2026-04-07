// Choropleth Map - Assignment 9
// Dataset: USDA ERS County-Level Poverty Data 2023
// Variable: PCTPOVALL_2023 - Estimated percent of people of all ages in poverty

async function draw() {
  const width = 960, height = 600;
  const margin = { top: 60, right: 200, bottom: 20, left: 20 };

  // Load map and CSV data
  const [us, rawCsv] = await Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/counties-albers-10m.json"),
    d3.csv("Poverty2023.csv")
  ]);

  // Filter to county-level poverty percent rows only (skip US/state totals)
  const povertyMap = new Map(
    rawCsv
      .filter(d => d.Attribute === "PCTPOVALL_2023" && String(+d.FIPS_Code).slice(-3) !== "000" && +d.FIPS_Code !== 0)
      .map(d => [String(+d.FIPS_Code).padStart(5, "0"), {
        fips:  String(+d.FIPS_Code).padStart(5, "0"),
        state: d.Stabr,
        name:  d.Area_Name,
        value: +d.Value
      }])
  );

  // Color scale
  const values = [...povertyMap.values()].map(d => d.value).filter(v => !isNaN(v));
  const [minVal, maxVal] = d3.extent(values);

  const colorScale = d3.scaleSequential()
    .domain([minVal, maxVal])
    .interpolator(d3.interpolateYlOrRd);

  // SVG
  const svg = d3.select("#a9-choropleth")
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
    .text("U.S. County-Level Poverty Rate (2023)");

  svg.append("text")
    .attr("x", (width + margin.right) / 2)
    .attr("y", 52)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#666")
    .style("font-family", "Nunito, sans-serif")
    .text("Estimated % of all ages in poverty · hover for details · Source: USDA ERS");

  const mapG = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Draw counties
  const path = d3.geoPath();
  const counties = topojson.feature(us, us.objects.counties);
  const statesOutline = topojson.mesh(us, us.objects.states, (a, b) => a !== b);

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

  mapG.selectAll(".county")
    .data(counties.features)
    .join("path")
    .attr("class", "county")
    .attr("d", path)
    .attr("fill", d => {
      const row = povertyMap.get(d.id);
      return row ? colorScale(row.value) : "#ccc";
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.25)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke", "#333").attr("stroke-width", 1.2);
      const row = povertyMap.get(d.id);
      const html = row
        ? `<strong>${row.name}</strong><br/>${row.state}<br/>Poverty rate: <strong>${row.value}%</strong>`
        : `<strong>County FIPS ${d.id}</strong><br/>No data`;
      tooltip.style("opacity", 0.97).html(html)
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY - 32 + "px");
    })
    .on("mousemove", event => {
      tooltip
        .style("left", event.pageX + 12 + "px")
        .style("top", event.pageY - 32 + "px");
    })
    .on("mouseout", function () {
      d3.select(this).attr("stroke", "#fff").attr("stroke-width", 0.25);
      tooltip.style("opacity", 0);
    });

  // State borders on top
  mapG.append("path")
    .datum(statesOutline)
    .attr("fill", "none")
    .attr("stroke", "#999")
    .attr("stroke-width", 0.6)
    .attr("d", path);

  // Color legend
  const legendWidth = 160, legendHeight = 12;
  const legendX = width + margin.left - 10;
  const legendY = margin.top + 30;

  const legendG = svg.append("g")
    .attr("transform", `translate(${legendX}, ${legendY})`);

  legendG.append("text")
    .attr("x", 0).attr("y", -12)
    .style("font-size", "12px").style("font-weight", "bold")
    .style("font-family", "Raleway, sans-serif").style("fill", "#333")
    .text("Poverty Rate (%)");

  // Gradient bar
  const defs = svg.append("defs");
  const grad = defs.append("linearGradient").attr("id", "choropleth-gradient");
  const nStops = 10;
  d3.range(nStops + 1).forEach(i => {
    grad.append("stop")
      .attr("offset", `${(i / nStops) * 100}%`)
      .attr("stop-color", colorScale(minVal + (i / nStops) * (maxVal - minVal)));
  });

  legendG.append("rect")
    .attr("width", legendWidth).attr("height", legendHeight)
    .style("fill", "url(#choropleth-gradient)")
    .attr("rx", 2);

  // Axis under gradient
  const legendScale = d3.scaleLinear()
    .domain([minVal, maxVal])
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .ticks(5)
    .tickFormat(d => `${d}%`);

  legendG.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis)
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll("text")
      .style("font-size", "10px")
      .style("font-family", "Nunito, sans-serif")
      .style("fill", "#555"));

  // No-data swatch
  const noDataG = legendG.append("g").attr("transform", `translate(0, 50)`);
  noDataG.append("rect")
    .attr("width", 14).attr("height", 14)
    .attr("fill", "#ccc").attr("rx", 2)
    .attr("stroke", "#aaa").attr("stroke-width", 0.5);
  noDataG.append("text")
    .attr("x", 20).attr("y", 11)
    .style("font-size", "11px").style("font-family", "Nunito, sans-serif").style("fill", "#555")
    .text("No data");
}

draw().catch(err => console.error("Load error:", err));
