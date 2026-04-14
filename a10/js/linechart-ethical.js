// Ethical Line Chart - Assignment 10
// Dataset: Average daily social media usage by age group, U.S. adults (Feb 2024)
// Source: Statista/GWI, Feb 2024 (anchors); intermediate brackets interpolated
// Variable: daily_minutes - average minutes per day spent on social media
// Corrections applied vs. deceptive version:
//   1. Y-axis starts at 0 to show true proportion of the decline
//   2. Neutral single color so there is no emotional encoding
//   3. Accurate descriptive title so there is no editorial framing

async function draw() {
  const width = 700, height = 420;
  const margin = { top: 80, right: 40, bottom: 60, left: 70 };

  const innerWidth  = width  - margin.left - margin.right;
  const innerHeight = height - margin.top  - margin.bottom;

  // Load dataset from JSON file
  const data = await d3.json("data_modified.json");

  // Single neutral color (no emotional judgment encoded)
  const DOT_COLOR  = "#1D9E75";
  const LINE_COLOR = "#1D9E75";

  // SVG
  const svg = d3.select("#a10-linechart-ethical")
    .append("svg")
    .attr("width",  width)
    .attr("height", height);

  // Accurate neutral title
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 32)
    .attr("text-anchor", "middle")
    .style("font-size", "17px")
    .style("font-weight", "bold")
    .style("font-family", "Raleway, sans-serif")
    .style("fill", "#333")
    .text("Daily Social Media Usage by Age Group, U.S. Adults (2024)");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 54)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#666")
    .style("font-family", "Nunito, sans-serif")
    .text("Average minutes per day · hover for details · Source: Statista/GWI, Feb 2024");

  const chartG = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Scales
  const x = d3.scalePoint()
    .domain(data.map(d => d.age_group))
    .range([0, innerWidth])
    .padding(0.3);

  // Correction #1: y-axis starts at 0 to reveal the true scale of variation
  const y = d3.scaleLinear()
    .domain([0, 220])
    .range([innerHeight, 0]);

  // Gridlines for readability
  chartG.append("g")
    .attr("class", "gridline")
    .call(
      d3.axisLeft(y)
        .ticks(5)
        .tickSize(-innerWidth)
        .tickFormat("")
    )
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll("line")
      .attr("stroke", "#e8e8e2")
      .attr("stroke-dasharray", "3,3"));

  // Axes
  chartG.append("g")
    .attr("class", "axis x-axis")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .style("font-family", "Nunito, sans-serif")
    .style("font-size", "11px")
    .attr("dy", "1.2em");

  chartG.append("g")
    .attr("class", "axis y-axis")
    .call(
      d3.axisLeft(y)
        .ticks(5)
        .tickFormat(d => d + " min")
    )
    .selectAll("text")
    .style("font-family", "Nunito, sans-serif")
    .style("font-size", "11px");

  // Axis labels
  chartG.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 48)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#666")
    .style("font-family", "Nunito, sans-serif")
    .text("Age group");

  chartG.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -56)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#666")
    .style("font-family", "Nunito, sans-serif")
    .text("Minutes per day");

  // Line generator
  const line = d3.line()
    .x(d => x(d.age_group))
    .y(d => y(d.daily_minutes))
    .curve(d3.curveMonotoneX);

  chartG.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", LINE_COLOR)
    .attr("stroke-width", 2.5)
    .attr("d", line);

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

  // Draw dots single neutral color, no gradient
  chartG.selectAll(".dot")
    .data(data)
    .join("circle")
    .attr("class", "dot")
    .attr("cx", d => x(d.age_group))
    .attr("cy", d => y(d.daily_minutes))
    .attr("r", 6)
    .attr("fill", DOT_COLOR)
    .attr("stroke", "#fff")
    .attr("stroke-width", 1.5)
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("r", 8);
      tooltip
        .style("opacity", 0.97)
        .html(`<strong>${d.age_group}</strong><br/>Daily usage: <strong>${d.daily_minutes} min</strong>`)
        .style("left", (event.pageX + 14) + "px")
        .style("top",  (event.pageY - 36) + "px");
    })
    .on("mousemove", event => {
      tooltip
        .style("left", (event.pageX + 14) + "px")
        .style("top",  (event.pageY - 36) + "px");
    })
    .on("mouseout", function () {
      d3.select(this).attr("r", 6);
      tooltip.style("opacity", 0);
    });

  // Color legend single swatch, no alarming labels
  const legendG = svg.append("g")
    .attr("transform", `translate(${width - margin.right - 160}, ${margin.top - 10})`);

  legendG.append("text")
    .attr("x", 0).attr("y", -14)
    .style("font-size", "11px")
    .style("font-weight", "bold")
    .style("font-family", "Raleway, sans-serif")
    .style("fill", "#333")
    .text("Daily usage");

  legendG.append("circle")
    .attr("cx", 8).attr("cy", 6)
    .attr("r", 6)
    .attr("fill", DOT_COLOR)
    .attr("stroke", "#fff")
    .attr("stroke-width", 1);

  legendG.append("text")
    .attr("x", 20).attr("y", 10)
    .style("font-size", "11px")
    .style("font-family", "Nunito, sans-serif")
    .style("fill", "#555")
    .text("Minutes per day (adults 18+)");
}

draw().catch(err => console.error("Load error:", err));