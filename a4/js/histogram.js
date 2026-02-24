// Histogram is used for Distribution of Precipitation

function drawGraph(data) {
  // DIMENSIONS
  const width = 700;
  const height = 500;
  const margin = { top: 60, right: 30, bottom: 75, left: 75 };
  const plot_width = width - margin.left - margin.right;
  const plot_height = height - margin.top - margin.bottom;

  // CANVAS
  var canvas = d3
    .select("#a4-histogram")
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
    .domain([0, d3.max(data, d => d.precip)])
    .range([0, plot_width]);

  // BINS
  let histogram = d3
    .bin()
    .value(d => d.precip)
    .domain(xScale.domain())
    .thresholds(xScale.ticks(20));

  let bins = histogram(data);

  let yScale = d3
    .scaleLinear()
    .domain([0, d3.max(bins, d => d.length)])
    .range([plot_height, 0]);

  // HISTOGRAM BARS
  let viz = plot
    .selectAll(".bar")
    .data(bins)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => xScale(d.x0) + 1)
    .attr("y", d => yScale(d.length))
    .attr("width", d => xScale(d.x1) - xScale(d.x0) - 1)
    .attr("height", d => plot_height - yScale(d.length))
    .style("fill", "steelblue");

  // GRIDLINES
  let yGrid = (g) => {
    g.attr("class", "grid-line")
      .selectAll("line")
      .data(yScale.ticks())
      .join("line")
      .attr("x1", 0)
      .attr("x2", plot_width)
      .attr("y1", d => yScale(d))
      .attr("y2", d => yScale(d))
      .style("stroke", "gray")
      .style("stroke-width", 0.1);
  };

  plot.append("g").call(yGrid);

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
    .attr("x", plot_width / 2)
    .attr("y", plot_height + margin.bottom * 0.7)
    .attr("text-anchor", "middle")
    .text("Precipitation (in)");

  plot
    .append("g")
    .append("text")
    .attr("class", "axisLabel")
    .attr("x", 0)
    .attr("y", -(margin.left * 0.67))
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text("Frequency");

  // TITLE
  plot
    .append("text")
    .attr("x", plot_width / 2)
    .attr("y", -30)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Distribution of Precipitation");

  // TOOLTIP
  let tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  viz
    .on("mouseover", (e, d) => {
      d3.select(e.currentTarget).style("fill", "orange");
      tooltip.transition().duration(500).style("opacity", 0.9);
      tooltip
        .html(`Range: ${d.x0.toFixed(2)} - ${d.x1.toFixed(2)} in<br>Count: ${d.length}`)
        .style("left", e.pageX + "px")
        .style("top", e.pageY - 28 + "px");
    })
    .on("mouseout", (e) => {
      d3.select(e.currentTarget).style("fill", "steelblue");
      tooltip.transition().duration(500).style("opacity", 0);
    });
}

function draw() {
  d3.csv("weather.csv")
    .then((data) => {
      data.forEach(d => {
        d.precip = +d["Data.Precipitation"];
      });
      const validData = data.filter(d => !isNaN(d.precip));
      drawGraph(validData);
    })
    .catch((err) => {
      console.log("Something has gone wrong");
      console.log(err);
    });
}

draw();

// SOURCES BELOW:

// D3.js Official Documentation
// https://d3js.org/
// For learning D3 syntax, scales, axes, and data binding

// D3 Graph Gallery
// https://d3-graph-gallery.com/
// Examples of bar charts, scatter plots, and heatmaps

// Observable D3 Tutorials
// https://observablehq.com/@d3/learn-d3
// Interactive D3 learning resources