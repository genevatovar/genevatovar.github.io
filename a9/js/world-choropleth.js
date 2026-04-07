// World Choropleth Map - Assignment 9
// Dataset: World Life Expectancy 2021 (WHO)
// Variable: lifeExpectancy - average years at birth, both sexes

async function draw() {
  const width = 960, height = 500;
  const margin = { top: 60, right: 20, bottom: 60, left: 20 };

  // Load world map and life expectancy data
  const [world, rawCsv] = await Promise.all([
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"),
    d3.csv("world-life-expectancy.csv", d => ({
      id:   +d.id,
      name: d.country,
      value: +d.lifeExpectancy
    }))
  ]);

  const dataMap = new Map(rawCsv.map(d => [d.id, d]));

  // Color scale
  const [minVal, maxVal] = d3.extent(rawCsv, d => d.value);

  const colorScale = d3.scaleSequential()
    .domain([minVal, maxVal])
    .interpolator(d3.interpolateRdYlGn);

  // SVG
  const svg = d3.select("#a9-world-choropleth")
    .append("svg")
    .attr("width", width)
    .attr("height", height + margin.top + margin.bottom);

  // Title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 32)
    .attr("text-anchor", "middle")
    .style("font-size", "17px")
    .style("font-weight", "bold")
    .style("font-family", "Raleway, sans-serif")
    .style("fill", "#333")
    .text("World Life Expectancy (2021)");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 52)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#666")
    .style("font-family", "Nunito, sans-serif")
    .text("Average years at birth, both sexes · hover for details · Source: WHO");

  const mapG = svg.append("g")
    .attr("transform", `translate(0, ${margin.top})`);

  // Projection
  const projection = d3.geoNaturalEarth1()
    .scale(153)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  // Graticule (grid lines)
  const graticule = d3.geoGraticule();
  mapG.append("path")
    .datum(graticule())
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#ddd")
    .attr("stroke-width", 0.4);

  // Sphere outline
  mapG.append("path")
    .datum({ type: "Sphere" })
    .attr("d", path)
    .attr("fill", "#e8f4f8")
    .attr("stroke", "#aaa")
    .attr("stroke-width", 0.5);

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

  // Draw countries
  const countries = topojson.feature(world, world.objects.countries);

  mapG.selectAll(".country")
    .data(countries.features)
    .join("path")
    .attr("class", "country")
    .attr("d", path)
    .attr("fill", d => {
      const row = dataMap.get(+d.id);
      return row ? colorScale(row.value) : "#ccc";
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.3)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke", "#333").attr("stroke-width", 1.2);
      const row = dataMap.get(+d.id);
      const html = row
        ? `<strong>${row.name}</strong><br/>Life expectancy: <strong>${row.value} yrs</strong>`
        : `<strong>No data</strong>`;
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
      d3.select(this).attr("stroke", "#fff").attr("stroke-width", 0.3);
      tooltip.style("opacity", 0);
    });

  // Color legend
  const legendWidth = 280, legendHeight = 12;
  const legendX = (width - legendWidth) / 2;
  const legendY = height + margin.top + 20;

  const legendG = svg.append("g")
    .attr("transform", `translate(${legendX}, ${legendY})`);

  legendG.append("text")
    .attr("x", legendWidth / 2).attr("y", -14)
    .attr("text-anchor", "middle")
    .style("font-size", "12px").style("font-weight", "bold")
    .style("font-family", "Raleway, sans-serif").style("fill", "#333")
    .text("Life Expectancy (years)");

  // Gradient bar
  const defs = svg.append("defs");
  const grad = defs.append("linearGradient").attr("id", "world-gradient");
  const nStops = 10;
  d3.range(nStops + 1).forEach(i => {
    grad.append("stop")
      .attr("offset", `${(i / nStops) * 100}%`)
      .attr("stop-color", colorScale(minVal + (i / nStops) * (maxVal - minVal)));
  });

  legendG.append("rect")
    .attr("width", legendWidth).attr("height", legendHeight)
    .style("fill", "url(#world-gradient)")
    .attr("rx", 2);

  const legendScale = d3.scaleLinear()
    .domain([minVal, maxVal])
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale)
    .ticks(6)
    .tickFormat(d => `${d}`);

  legendG.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(legendAxis)
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll("text")
      .style("font-size", "10px")
      .style("font-family", "Nunito, sans-serif")
      .style("fill", "#555"));

  // No-data swatch
  const noDataG = legendG.append("g").attr("transform", `translate(${legendWidth + 20}, 0)`);
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
