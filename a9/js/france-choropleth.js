// France Department Choropleth - Assignment 9
// Dataset: Population density by French department (2022)
// Variable: density - inhabitants per km²
// Note: log color scale used due to extreme range (Lozère 15 → Paris 20,755)

async function draw() {
  const width = 860, height = 620;
  const margin = { top: 60, right: 200, bottom: 20, left: 20 };

  // Load GeoJSON and dataset
  const [geojson, rawCsv] = await Promise.all([
    d3.json("https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/departements.geojson"),
    d3.csv("france-pop-density.csv", d => ({
      code:    d.code,
      name:    d.department,
      density: +d.density
    }))
  ]);

  // Keep only metropolitan France (codes are 2 chars: 01-95, 2A, 2B)
  const metroFeatures = geojson.features.filter(d => d.properties.code.length <= 2);
  const metroGeoJSON = { type: "FeatureCollection", features: metroFeatures };

  const dataMap = new Map(rawCsv.map(d => [d.code, d]));

  // Log color scale to handle Paris outlier
  const [minVal, maxVal] = d3.extent(rawCsv, d => d.density);

  const colorScale = d3.scaleSequentialLog()
    .domain([minVal, maxVal])
    .interpolator(d3.interpolateYlOrBr);

  // SVG
  const svg = d3.select("#a9-france-choropleth")
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
    .text("France — Population Density by Department (2022)");

  svg.append("text")
    .attr("x", (width + margin.right) / 2)
    .attr("y", 52)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#666")
    .style("font-family", "Nunito, sans-serif")
    .text("Inhabitants per km² · log color scale · hover for details · Source: INSEE");

  const mapG = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Fit projection to metropolitan France
  const projection = d3.geoMercator()
    .fitSize([width - margin.left - margin.right, height], metroGeoJSON);

  const path = d3.geoPath().projection(projection);

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

  // Draw departments
  mapG.selectAll(".dept")
    .data(metroFeatures)
    .join("path")
    .attr("class", "dept")
    .attr("d", path)
    .attr("fill", d => {
      const row = dataMap.get(d.properties.code);
      return row ? colorScale(row.density) : "#ccc";
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.6)
    .on("mouseover", function (event, d) {
      d3.select(this).attr("stroke", "#333").attr("stroke-width", 1.5);
      const row = dataMap.get(d.properties.code);
      const html = row
        ? `<strong>${row.name}</strong> <span style="color:#888">(${d.properties.code})</span><br/>Density: <strong>${row.density.toLocaleString()} /km²</strong>`
        : `<strong>${d.properties.nom}</strong><br/>No data`;
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
      d3.select(this).attr("stroke", "#fff").attr("stroke-width", 0.6);
      tooltip.style("opacity", 0);
    });

  // Color legend
  const legendWidth = 160, legendHeight = 12;
  const legendX = width - 10;
  const legendY = margin.top + 30;

  const legendG = svg.append("g")
    .attr("transform", `translate(${legendX}, ${legendY})`);

  legendG.append("text")
    .attr("x", 0).attr("y", -24)
    .style("font-size", "12px").style("font-weight", "bold")
    .style("font-family", "Raleway, sans-serif").style("fill", "#333")
    .text("Density (/km²)");

  legendG.append("text")
    .attr("x", 0).attr("y", -10)
    .style("font-size", "10px")
    .style("font-family", "Nunito, sans-serif").style("fill", "#888")
    .text("(log scale)");

  // Gradient bar
  const defs = svg.append("defs");
  const grad = defs.append("linearGradient").attr("id", "france-gradient");
  const nStops = 10;
  d3.range(nStops + 1).forEach(i => {
    grad.append("stop")
      .attr("offset", `${(i / nStops) * 100}%`)
      .attr("stop-color", colorScale(Math.exp(
        Math.log(minVal) + (i / nStops) * (Math.log(maxVal) - Math.log(minVal))
      )));
  });

  legendG.append("rect")
    .attr("width", legendWidth).attr("height", legendHeight)
    .style("fill", "url(#france-gradient)")
    .attr("rx", 2);

  // Manual tick labels at meaningful log positions
  const tickValues = [15, 50, 150, 500, 2000, 20000];
  const logScale = d3.scaleLog().domain([minVal, maxVal]).range([0, legendWidth]);

  legendG.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(
      d3.axisBottom(logScale)
        .tickValues(tickValues)
        .tickFormat(d => d >= 1000 ? `${d/1000}k` : `${d}`)
    )
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll("text")
      .style("font-size", "9px")
      .style("font-family", "Nunito, sans-serif")
      .style("fill", "#555"));
}

draw().catch(err => console.error("Load error:", err));
