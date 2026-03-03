// Line Chart
// X axis - song.year
// Y axis - avg song.hotttnesss per year

function drawGraph(data) {
  // DIMENSIONS
  const width = 900;
  const height = 500;
  const margin = { top: 60, right: 30, bottom: 80, left: 80 };
  const plot_width = width - margin.left - margin.right;
  const plot_height = height - margin.top - margin.bottom;

  // CANVAS AND PLOT
  const canvas = d3.select("#a5-linechart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const plot = canvas.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // ORGANIZE DATA — average hotttnesss per year
  const byYear = d3.rollup(
    data,
    v => d3.mean(v, d => d.hotttnesss),
    d => d.year
  );

  const lineData = Array.from(byYear, ([year, hotttnesss]) => ({ year, hotttnesss }))
    .sort((a, b) => a.year - b.year);

  // SCALES
  let xScale = d3.scaleLinear()
    .domain(d3.extent(lineData, d => d.year))
    .range([0, plot_width]);

  let yScale = d3.scaleLinear()
    .domain([0, d3.max(lineData, d => d.hotttnesss) * 1.1])
    .range([plot_height, 0]);

  // GRIDLINES
  plot.append("g")
    .attr("class", "grid-line")
    .selectAll("line")
    .data(yScale.ticks())
    .join("line")
    .attr("x1", 0)
    .attr("x2", plot_width)
    .attr("y1", d => yScale(d))
    .attr("y2", d => yScale(d))
    .style("stroke", "gray")
    .style("stroke-width", 0.3)
    .style("stroke-dasharray", "3,3");

  // LINE GENERATOR
  const line = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.hotttnesss))
    .curve(d3.curveMonotoneX); // smooth curve

  // DRAW LINE
  plot.append("path")
    .datum(lineData)
    .attr("fill", "none")
    .attr("stroke", "steelblue")
    .attr("stroke-width", 2.5)
    .attr("d", line);

  // DOTS
  let dots = plot.selectAll(".dot")
    .data(lineData)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", d => xScale(d.year))
    .attr("cy", d => yScale(d.hotttnesss))
    .attr("r", 4)
    .style("fill", "steelblue")
    .style("stroke", "white")
    .style("stroke-width", 1.5);

  // AXES
  let xAx = d3.axisBottom(xScale).tickFormat(d3.format("d")); // no commas on years
  let yAx = d3.axisLeft(yScale);

  plot.append("g")
    .attr("transform", `translate(0, ${plot_height})`)
    .attr("class", "axes")
    .call(xAx);

  plot.append("g")
    .attr("class", "axes")
    .call(yAx);

  // AXIS LABELS
  plot.append("text")
    .attr("class", "axisLabel")
    .attr("x", plot_width / 2)
    .attr("y", plot_height + margin.bottom * 0.75)
    .attr("text-anchor", "middle")
    .text("Year");

  plot.append("text")
    .attr("class", "axisLabel")
    .attr("x", 0)
    .attr("y", -(margin.left * 0.75))
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text("Avg Song Hotttnesss");

  // TITLE
  plot.append("text")
    .attr("x", plot_width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Average Song Hotttnesss by Year");

  // TOOLTIP
  let tooltip = d3
    .select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "rgba(0,0,0,0.75)")
    .style("color", "white")
    .style("padding", "6px 10px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("pointer-events", "none");

  dots
    .on("mouseover", (e, d) => {
      d3.select(e.currentTarget).attr("r", 7).style("fill", "orange");
      tooltip.transition().duration(200).style("opacity", 0.95);
      tooltip
        .html(`<strong>${d.year}</strong><br/>Avg Hotttnesss: ${d.hotttnesss.toFixed(3)}`)
        .style("left", e.pageX + 12 + "px")
        .style("top", e.pageY - 28 + "px");
    })
    .on("mouseout", (e) => {
      d3.select(e.currentTarget).attr("r", 4).style("fill", "steelblue");
      tooltip.transition().duration(300).style("opacity", 0);
    });
}

function draw() {
  d3.csv("music_small.csv")
    .then(function(data) {
      data.forEach(d => {
        d.year      = +d["song.year"];
        d.hotttnesss = +d["song.hotttnesss"];
      });

      // Filter out missing or zero-year rows
      const validData = data.filter(d => d.year > 0 && !isNaN(d.hotttnesss) && d.hotttnesss > 0);

      drawGraph(validData);
    })
    .catch((err) => {
      console.log("data loading error");
      console.log(err);
    });
}

draw();

// SOURCES:
// D3.js Official Documentation — https://d3js.org/
// D3 Graph Gallery (Line Chart) — https://d3-graph-gallery.com/line.html
// Observable D3 Tutorials — https://observablehq.com/@d3/learn-d3