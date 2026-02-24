// Scatter Plot is used for Max Temp vs Min Temp

function drawGraph(data) {
  // DIMENSIONS
  const width = 700;
  const height = 500;
  const margin = { top: 60, right: 30, bottom: 75, left: 75 };
  const plot_width = width - margin.left - margin.right;
  const plot_height = height - margin.top - margin.bottom;

  // CANVAS
  var canvas = d3
    .select("#a4-scatterplot")
    .append("svg")
    .attr("height", height)
    .attr("width", width);

  // PLOT
  var plot = canvas
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // SCALES
  let xScale = d3
    .scaleLinear()
    .domain([d3.min(data, d => d.minTemp) * 0.9, d3.max(data, d => d.minTemp) * 1.1])
    .range([0, plot_width]);

  let yScale = d3
    .scaleLinear()
    .domain([d3.min(data, d => d.maxTemp) * 0.9, d3.max(data, d => d.maxTemp) * 1.1])
    .range([plot_height, 0]);

  let colorScale = d3
    .scaleSequential()
    .domain([1, 12])
    .interpolator(d3.interpolateRdYlBu);

  // SCATTER PLOT
  let viz = plot
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => xScale(d.minTemp))
    .attr("cy", d => yScale(d.maxTemp))
    .attr("r", 4)
    .attr("opacity", 0.6)
    .style("fill", d => colorScale(+d.month));

  // AXES
  let xAx = d3.axisBottom(xScale);
  let yAx = d3.axisLeft(yScale);

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
    .attr("x", plot_width)
    .attr("y", plot_height + margin.bottom * 0.7)
    .text("Min Temperature (°F)");

  plot
    .append("g")
    .append("text")
    .attr("class", "axisLabel")
    .attr("x", 0)
    .attr("y", -(margin.left * 0.67))
    .attr("transform", "rotate(-90)")
    .text("Max Temperature (°F)");

  // TITLE
  plot
    .append("text")
    .attr("x", plot_width / 2)
    .attr("y", -30)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Max vs Min Temperature");

  // TOOLTIP
  let tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  viz
    .on("mouseover", (e, d) => {
      d3.select(e.currentTarget).attr("opacity", 1).attr("r", 6);
      tooltip.transition().duration(500).style("opacity", 0.9);
      tooltip
        .html(`${d.city}<br>Max: ${d.maxTemp}°F<br>Min: ${d.minTemp}°F`)
        .style("left", e.pageX + "px")
        .style("top", e.pageY - 28 + "px");
    })
    .on("mouseout", (e) => {
      d3.select(e.currentTarget).attr("opacity", 0.6).attr("r", 4);
      tooltip.transition().duration(500).style("opacity", 0);
    });
}

function draw() {
  d3.csv("weather.csv")
    .then((data) => {
      data.forEach(d => {
        d.month = d["Date.Month"];
        d.city = d["Station.City"];
        d.maxTemp = +d["Data.Temperature.Max Temp"];
        d.minTemp = +d["Data.Temperature.Min Temp"];
      });
      const validData = data.filter(d => !isNaN(d.maxTemp) && !isNaN(d.minTemp));
      drawGraph(validData);
    })
    .catch((err) => {
      console.log("Something has gone wrong");
      console.log(err);
    });
}

draw();

// SOURCES BELOW:

// Creating a Scatterplot in D3 tutorial
// https://www.youtube.com/watch?v=pd5PZisnQ14

// D3.js Official Documentation
// https://d3js.org/
// For learning D3 syntax, scales, axes, and data binding

// D3 Graph Gallery
// https://d3-graph-gallery.com/
// Examples of bar charts, scatter plots, and heatmaps

// Observable D3 Tutorials
// https://observablehq.com/@d3/learn-d3
// Interactive D3 learning resources