// Heatmap is used for Temperature by City x Month

function drawGraph(data) {
  // DIMENSIONS
  const width = 900;
  const height = 500;
  const margin = { top: 100, right: 30, bottom: 100, left: 120 };
  const plot_width = width - margin.left - margin.right;
  const plot_height = height - margin.top - margin.bottom;

  // CANVAS AND PLOT
  const canvas = d3.select("#a4-heatmap")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const plot = canvas.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // ORGANIZE DATA
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const cities = [...new Set(data.map(d => d.city))].sort().slice(0, 8);

  const heatmapData = [];
  for (let m = 1; m <= 12; m++) {
    cities.forEach(city => {
      const cellData = data.filter(d => +d.month === m && d.city === city);
      if (cellData.length > 0) {
        heatmapData.push({
          month: monthNames[m - 1],
          city: city,
          temp: d3.mean(cellData, d => d.temp)
        });
      }
    });
  }

  // SCALES
  let scaleX = d3.scaleBand(monthNames, [0, plot_width]).padding(0.05);
  let scaleY = d3.scaleBand(cities, [0, plot_height]).padding(0.05);
  let scaleColor = d3.scaleSequential()
    .domain([d3.max(heatmapData, d => d.temp), d3.min(heatmapData, d => d.temp)])
    .interpolator(d3.interpolateRdYlBu);

  // HEAT MAP
  plot.selectAll("rect").data(heatmapData).enter()
    .append("rect")
    .attr("class", "heatmap-tile")
    .attr("x", d => scaleX(d.month))
    .attr("y", d => scaleY(d.city))
    .attr("width", d => scaleX.bandwidth())
    .attr("height", d => scaleY.bandwidth())
    .attr("stroke", "white")
    .attr("stroke-width", 2)
    .style("fill", d => scaleColor(d.temp));

  // AXES
  let xAx = d3.axisBottom(scaleX);
  let yAx = d3.axisLeft(scaleY);

  let xaxis = plot
    .append("g")
    .attr("transform", `translate(0, ${plot_height})`)
    .attr("class", "axes")
    .call(xAx.tickSizeOuter(0));

  let yaxis = plot
    .append("g")
    .attr("transform", "translate(0, 0)")
    .attr("class", "axes")
    .call(yAx.tickSizeOuter(0));

  // AXIS LABELS
  plot
    .append("g")
    .append("text")
    .attr("class", "axisLabel")
    .attr("x", plot_width / 2)
    .attr("y", plot_height + margin.bottom * 0.6)
    .attr("text-anchor", "middle")
    .text("Month");

  plot
    .append("g")
    .append("text")
    .attr("class", "axisLabel")
    .attr("x", 0)
    .attr("y", -(margin.left * 0.75))
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text("City");

  // TITLE
  plot
    .append("text")
    .attr("x", plot_width / 2)
    .attr("y", -70)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Average Temperature by City and Month");

  // COLOR LEGEND
  const legendWidth = 300;
  const legendHeight = 15;

  const legendScale = d3.scaleLinear()
    .domain(scaleColor.domain())
    .range([0, legendWidth]);

  const legend = plot.append("g")
    .attr("transform", `translate(${plot_width / 2 - legendWidth / 2}, ${-50})`);

  const defs = canvas.append("defs");
  const gradient = defs.append("linearGradient")
    .attr("id", "legend-gradient");

  const numStops = 10;
  for (let i = 0; i <= numStops; i++) {
    const offset = i / numStops;
    gradient.append("stop")
      .attr("offset", `${offset * 100}%`)
      .attr("stop-color", scaleColor(legendScale.invert(offset * legendWidth)));
  }

  legend.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");

  legend.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(d3.axisBottom(legendScale).ticks(5).tickFormat(d => d.toFixed(0) + "°F"));

  // TOOLTIP
  let tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  plot.selectAll(".heatmap-tile")
    .on("mouseover", (e, d) => {
      d3.select(e.currentTarget).attr("stroke", "black").attr("stroke-width", 3);
      tooltip.transition().duration(500).style("opacity", 0.9);
      tooltip
        .html(`${d.city}, ${d.month}: ${d.temp.toFixed(1)}°F`)
        .style("left", e.pageX + "px")
        .style("top", e.pageY - 28 + "px");
    })
    .on("mouseout", (e) => {
      d3.select(e.currentTarget).attr("stroke", "white").attr("stroke-width", 2);
      tooltip.transition().duration(500).style("opacity", 0);
    });
}

function draw() {
  d3.csv("weather.csv")
    .then(function(data) {
      data.forEach(d => {
        d.month = d["Date.Month"];
        d.city = d["Station.City"];
        d.temp = +d["Data.Temperature.Avg Temp"];
      });
      const validData = data.filter(d => d.month && d.city && !isNaN(d.temp));
      drawGraph(validData);
    })
    .catch((err) => {
      console.log("data loading error");
      console.log(err);
    });
}

draw();

// SOURCES BELOW:

// Creating Heat Map in D3 Tutorial
// https://www.youtube.com/watch?v=1eEKkLC8Uz8

// D3.js Official Documentation
// https://d3js.org/
// For learning D3 syntax, scales, axes, and data binding

// D3 Graph Gallery
// https://d3-graph-gallery.com/
// Examples of bar charts, scatter plots, and heatmaps

// Observable D3 Tutorials
// https://observablehq.com/@d3/learn-d3
// Interactive D3 learning resources