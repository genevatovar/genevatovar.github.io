// Deceptive Area Chart - Assignment 10
// Dataset: Cumulative daily social media minutes per week, selected age groups
// Source: Statista/GWI, Feb 2024 (anchors); intermediate brackets interpolated
// Variable: cumulative_minutes - running total of minutes spent per week by day
// Manipulation techniques:
//   1. Truncated y-axis (starts at 500, not 0) exaggerates gap between age groups
//   2. Alarming red/orange fill colors implies danger
//   3. Misleading title frames normal weekly accumulation as a crisis

async function draw() {
  const width = 700, height = 420;
  const margin = { top: 80, right: 160, bottom: 60, left: 70 };

  const innerWidth  = width  - margin.left - margin.right;
  const innerHeight = height - margin.top  - margin.bottom;

  // Days of the week (x axis)
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Load dataset from JSON file
  const rawData = await d3.json("data_modified.json");

  // Select three representative age groups from the dataset: youngest, middle, oldest
  const targetGroups = ["18–20", "40–44", "65+"];
  const colors = { "18–20": "#8b0000", "40–44": "#c0392b", "65+": "#e07b54" };
  const opacities = { "18–20": 0.75, "40–44": 0.60, "65+": 0.50 };

  // Build groups array from loaded data, filtered to target age groups
  const groups = rawData
    .filter(d => targetGroups.includes(d.age_group))
    .map(d => ({
      label: d.age_group,
      daily: d.daily_minutes,
      color: colors[d.age_group],
      fillOpacity: opacities[d.age_group]
    }));

  // Build cumulative data per group
  groups.forEach(g => {
    g.values = days.map((day, i) => ({
      day,
      cumulative: g.daily * (i + 1)
    }));
  });

  // SVG
  const svg = d3.select("#a10-areachart-deceptive")
    .append("svg")
    .attr("width",  width)
    .attr("height", height);

  // Manipulation #3: misleading title frames accumulation as crisis
  svg.append("text")
    .attr("x", (width - margin.right) / 2 + margin.left / 2)
    .attr("y", 32)
    .attr("text-anchor", "middle")
    .style("font-size", "17px")
    .style("font-weight", "bold")
    .style("font-family", "Raleway, sans-serif")
    .style("fill", "#8b0000")
    .text("Weekly Screen Time Is Consuming American Lives");

  svg.append("text")
    .attr("x", (width - margin.right) / 2 + margin.left / 2)
    .attr("y", 54)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#666")
    .style("font-family", "Nunito, sans-serif")
    .text("Cumulative minutes lost to social media by day of week · hover for details");

  const chartG = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Scales
  const x = d3.scalePoint()
    .domain(days)
    .range([0, innerWidth])
    .padding(0.3);

  // Manipulation #1: truncated y-axis starts at 500 instead of 0 (Makes the gap between age groups look dramatic)
  const allValues = groups.flatMap(g => g.values.map(v => v.cumulative));
  const yMax = d3.max(allValues) + 50;

  const y = d3.scaleLinear()
    .domain([500, yMax])
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
    .text("Day of week");

  chartG.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -56)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#666")
    .style("font-family", "Nunito, sans-serif")
    .text("Cumulative minutes");

  // Area and line generators
  const area = d3.area()
    .x(d => x(d.day))
    .y0(innerHeight)
    .y1(d => y(d.cumulative))
    .curve(d3.curveMonotoneX);

  const line = d3.line()
    .x(d => x(d.day))
    .y(d => y(d.cumulative))
    .curve(d3.curveMonotoneX);

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

  // Draw areas and lines per group (back to front so smallest is on top)
  [...groups].reverse().forEach(g => {
    // Manipulation #2: red/orange fills alarming colors
    chartG.append("path")
      .datum(g.values)
      .attr("fill", g.color)
      .attr("fill-opacity", g.fillOpacity)
      .attr("d", area);

    chartG.append("path")
      .datum(g.values)
      .attr("fill", "none")
      .attr("stroke", g.color)
      .attr("stroke-width", 2)
      .attr("d", line);

    // Dots with tooltip
    chartG.selectAll(`.dot-${g.label.replace(/[^a-z0-9]/gi, "")}`)
      .data(g.values)
      .join("circle")
      .attr("class", `dot-${g.label.replace(/[^a-z0-9]/gi, "")}`)
      .attr("cx", d => x(d.day))
      .attr("cy", d => y(d.cumulative))
      .attr("r", 4)
      .attr("fill", g.color)
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("r", 6);
        tooltip
          .style("opacity", 0.97)
          .html(`<strong>Age ${g.label}</strong> · ${d.day}<br/>Cumulative: <strong>${d.cumulative} min</strong>`)
          .style("left", (event.pageX + 14) + "px")
          .style("top",  (event.pageY - 36) + "px");
      })
      .on("mousemove", event => {
        tooltip
          .style("left", (event.pageX + 14) + "px")
          .style("top",  (event.pageY - 36) + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("r", 4);
        tooltip.style("opacity", 0);
      });
  });

  // Legend
  const legendX = width - margin.right + 20;
  const legendY = margin.top + 20;
  const legendG = svg.append("g")
    .attr("transform", `translate(${legendX}, ${legendY})`);

  legendG.append("text")
    .attr("x", 0).attr("y", 0)
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .style("font-family", "Raleway, sans-serif")
    .style("fill", "#333")
    .text("Age Group");

  groups.forEach((g, i) => {
    const row = legendG.append("g")
      .attr("transform", `translate(0, ${20 + i * 28})`);

    row.append("rect")
      .attr("width", 14).attr("height", 14)
      .attr("rx", 2)
      .attr("fill", g.color)
      .attr("fill-opacity", g.fillOpacity)
      .attr("stroke", g.color)
      .attr("stroke-width", 1);

    row.append("text")
      .attr("x", 22).attr("y", 11)
      .style("font-size", "11px")
      .style("font-family", "Nunito, sans-serif")
      .style("fill", "#444")
      .text(g.label);
  });
}

draw().catch(err => console.error("Load error:", err));