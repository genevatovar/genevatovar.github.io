// Deceptive Line Chart - Assignment 10
// Dataset: Average daily social media usage by age group, U.S. adults (Feb 2024)
// Source: Statista/GWI, Feb 2024 (anchors); intermediate brackets interpolated
// Variable: daily_minutes - average minutes per day spent on social media
// Manipulation techniques:
//   1. Truncated y-axis (starts at 90, not 0) it exaggerates the decline
//   2. Red color gradient implies alarm at higher usage
//   3. Misleading title frames trend as a crisis

async function draw() {
  const width = 700, height = 420;
  const margin = { top: 80, right: 40, bottom: 60, left: 70 };

  const innerWidth  = width  - margin.left - margin.right;
  const innerHeight = height - margin.top  - margin.bottom;

  // Load dataset from JSON file
  const data = await d3.json("data_modified.json");

  // Manipulation #2: red color gradient darker red = higher usage = "more dangerous"
  const colorScale = d3.scaleSequential()
    .domain([102, 192])
    .interpolator(d3.interpolateRgb("#f4a58a", "#8b0000"));

  // SVG
  const svg = d3.select("#a10-linechart-deceptive")
    .append("svg")
    .attr("width",  width)
    .attr("height", height);

  // Manipulation #3: misleading title frames gradual trend as a crisis
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 32)
    .attr("text-anchor", "middle")
    .style("font-size", "17px")
    .style("font-weight", "bold")
    .style("font-family", "Raleway, sans-serif")
    .style("fill", "#8b0000")
    .text("America's Social Media Crisis Is Spiraling Out of Control");

  svg.append("text")
    .attr("x", width / 2)
    .attr("y", 54)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#666")
    .style("font-family", "Nunito, sans-serif")
    .text("Daily usage remains at alarming levels across every age group · hover for details");

  const chartG = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Scales
  const x = d3.scalePoint()
    .domain(data.map(d => d.age_group))
    .range([0, innerWidth])
    .padding(0.3);

  // Manipulation #1: truncated y-axis — starts at 90 instead of 0 makes the 90 min range look like a big drop
  const y = d3.scaleLinear()
    .domain([90, 200])
    .range([innerHeight, 0]);

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

  // Draw line using midpoint color so it reads as "alarming red"
  chartG.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#b03030")
    .attr("stroke-width", 2.5)
    .attr("d", line);

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

  // Draw dots with red gradient fill
  chartG.selectAll(".dot")
    .data(data)
    .join("circle")
    .attr("class", "dot")
    .attr("cx", d => x(d.age_group))
    .attr("cy", d => y(d.daily_minutes))
    .attr("r", 6)
    .attr("fill", d => colorScale(d.daily_minutes))
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

  // Color legend
  const legendWidth = 200, legendHeight = 12;
  const legendX = width - margin.right - legendWidth;
  const legendY = margin.top - 10;

  const legendG = svg.append("g")
    .attr("transform", `translate(${legendX}, ${legendY})`);

  legendG.append("text")
    .attr("x", legendWidth / 2).attr("y", -14)
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .style("font-weight", "bold")
    .style("font-family", "Raleway, sans-serif")
    .style("fill", "#333")
    .text("Usage Level");

  // Gradient bar
  const defs = svg.append("defs");
  const grad = defs.append("linearGradient").attr("id", "red-gradient");
  const nStops = 10;
  d3.range(nStops + 1).forEach(i => {
    grad.append("stop")
      .attr("offset", `${(i / nStops) * 100}%`)
      .attr("stop-color", colorScale(192 - (i / nStops) * (192 - 102)));
  });

  legendG.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#red-gradient)")
    .attr("rx", 2);

  const legendScale = d3.scaleLinear()
    .domain([192, 102])
    .range([0, legendWidth]);

  legendG.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(
      d3.axisBottom(legendScale)
        .ticks(4)
        .tickFormat(d => d + " min")
    )
    .call(g => g.select(".domain").remove())
    .call(g => g.selectAll("text")
      .style("font-size", "10px")
      .style("font-family", "Nunito, sans-serif")
      .style("fill", "#555"));

  legendG.append("text")
    .attr("x", 0).attr("y", legendHeight + 30)
    .style("font-size", "10px")
    .style("font-family", "Nunito, sans-serif")
    .style("fill", "#8b0000")
    .text("Critical");

  legendG.append("text")
    .attr("x", legendWidth).attr("y", legendHeight + 30)
    .attr("text-anchor", "end")
    .style("font-size", "10px")
    .style("font-family", "Nunito, sans-serif")
    .style("fill", "#f4a58a")
    .text("Lower");
}

draw().catch(err => console.error("Load error:", err));