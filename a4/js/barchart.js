// Bar Chart is used for Average Monthly Temperature

function drawGraph(data) {
  // DIMENSIONS
  const width = 700;
  const height = 400;
  const margin = { top: 40, right: 30, bottom: 80, left: 70 };
  const plot_width = width - margin.left - margin.right;
  const plot_height = height - margin.top - margin.bottom;

  // MONTHLY AVERAGES
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyAvg = {};
  for (let i = 1; i <= 12; i++) {
    const monthData = data.filter(d => +d.month === i);
    if (monthData.length > 0) {
      monthlyAvg[monthNames[i - 1]] = d3.mean(monthData, d => d.temp);
    }
  }
  const chartData = Object.entries(monthlyAvg).map(([month, temp]) => ({
    month: month,
    temp: temp
  }));

  // CANVAS
  var canvas = d3
    .select("#a4-barchart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // PLOT
  var plot = canvas
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // SCALES
  let xScale = d3.scaleBand()
    .domain(chartData.map(d => d.month))
    .range([0, plot_width])
    .padding(0.3);

  let yScale = d3.scaleLog()
    .domain([1, d3.max(chartData, d => d.temp) * 1.1])
    .range([plot_height, 0]);

  // BAR CHART
  let viz = plot
    .selectAll(".bar")
    .data(chartData)
    .enter()
    .append("rect")
    .attr("x", d => xScale(d.month))
    .attr("y", d => yScale(d.temp))
    .attr("height", d => plot_height - yScale(d.temp))
    .attr("width", d => xScale.bandwidth())
    .style("fill", "steelblue");

  // GRIDLINE FUNCTION
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
    .call(xAx);

  xaxis.selectAll("text")
    .attr("transform", "translate(-10,0)rotate(-45)")
    .attr("text-anchor", "end");

  plot
    .append("g")
    .attr("transform", "translate(0, 0)")
    .attr("class", "axes")
    .call(yAx);

  // AXIS LABELS
  plot
    .append("g")
    .append("text")
    .attr("class", "axisLabel")
    .attr("x", plot_width / 2)
    .attr("y", plot_height + margin.bottom * 0.85)
    .attr("text-anchor", "middle")
    .text("Month");

  plot
    .append("g")
    .append("text")
    .attr("class", "axisLabel")
    .attr("x", 0)
    .attr("y", -(margin.left * 0.67))
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text("Avg Temperature (°F)");

  // TITLE
  plot
    .append("text")
    .attr("x", plot_width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Average Monthly Temperature");

  // DATA LABELS
  plot
    .selectAll(".bar-label")
    .data(chartData)
    .enter()
    .append("text")
    .attr("class", "bar-label")
    .attr("x", d => xScale(d.month) + xScale.bandwidth() / 2)
    .attr("y", d => yScale(d.temp) - 5)
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .style("fill", "black")
    .text(d => d.temp.toFixed(1) + "°F");

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
        .html(`${d.month}: ${d.temp.toFixed(1)}°F`)
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
      data.forEach((d) => {
        d.month = d["Date.Month"];
        d.temp = +d["Data.Temperature.Avg Temp"];
      });
      drawGraph(data);
    })
    .catch((err) => {
      console.log("Something has gone wrong");
      console.log(err);
    });
}

draw();

// SOURCES BELOW:

// Creating Bar Charts in D3 Tutorial
// https://www.youtube.com/watch?v=Osmj2PzbgJQ

// D3.js Official Documentation
// https://d3js.org/
// For learning D3 syntax, scales, axes, and data binding


// D3 Graph Gallery
// https://d3-graph-gallery.com/
// Examples of bar charts, scatter plots, and heatmaps


// Observable D3 Tutorials
// https://observablehq.com/@d3/learn-d3
// Interactive D3 learning resources
