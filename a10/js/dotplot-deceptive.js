// Deceptive Dot Plot - Assignment 10
// Dataset: Daily social media usage by age group, U.S. adults — 2024 actual vs. 2030 projected
// Source: Statista/GWI, Feb 2024 (anchors); intermediate brackets interpolated
// Variable: daily_minutes - average minutes per day spent on social media
// Manipulation techniques:
//   1. Truncated y-axis (starts at 80, not 0) exaggerates distance between 2024 and 2030 values
//   2. Alarming red for projected values implies the future is crisis
//   3. Misleading title frames interpolated projections as confirmed alarming forecasts

async function draw() {
  const width = 700, height = 460;
  const margin = { top: 80, right: 160, bottom: 60, left: 70 };

  const innerWidth  = width  - margin.left - margin.right;
  const innerHeight = height - margin.top  - margin.bottom;

  // Load dataset from JSON file
  const rawData = await d3.json("data_modified.json");

  // Build data array with actual (from JSON) 
  const projectedMap = {
    "18–20": 278, "21–24": 268, "25–29": 255, "30–34": 243,
    "35–39": 232, "40–44": 221, "45–49": 210, "50–54": 200,
    "55–59": 191, "60–64": 183, "65+": 176
  };

  const data = rawData.map(d => ({
    age_group: d.age_group,
    actual:    d.daily_minutes,
    projected: projectedMap[d.age_group]
  }));

  // Colors muted blue for 2024, alarming red for 2030 projection
  const COLOR_ACTUAL     = "#B5D4F4";
  const STROKE_ACTUAL    = "#378ADD";
  const COLOR_PROJECTED  = "#8b0000";
  const STROKE_PROJECTED = "#5a0000";

  // SVG
  const svg = d3.select("#a10-dotplot-deceptive")
    .append("svg")
    .attr("width",  width)
    .attr("height", height);

  // Manipulation #3: misleading title implies projections are confirmed
  svg.append("text")
    .attr("x", (width - margin.right) / 2 + margin.left / 2)
    .attr("y", 32)
    .attr("text-anchor", "middle")
    .style("font-size", "17px")
    .style("font-weight", "bold")
    .style("font-family", "Raleway, sans-serif")
    .style("fill", "#8b0000")
    .text("Social Media Will Consume Every Generation by 2030");

  svg.append("text")
    .attr("x", (width - margin.right) / 2 + margin.left / 2)
    .attr("y", 54)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#666")
    .style("font-family", "Nunito, sans-serif")
    .text("2024 actual vs. 2030 projected daily usage · hover for details");

  const chartG = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Scales
  const x = d3.scalePoint()
    .domain(data.map(d => d.age_group))
    .range([0, innerWidth])
    .padding(0.3);

  // Manipulation #1: truncated y-axis starts at 80 instead of 0 (makes the jump from 2024 to 2030 look far larger than it truly is)
  const y = d3.scaleLinear()
    .domain([80, 300])
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

  // Tooltip
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

  // Draw dashed connector lines between actual and projected per age group
  chartG.selectAll(".connector")
    .data(data)
    .join("line")
    .attr("class", "connector")
    .attr("x1", d => x(d.age_group))
    .attr("x2", d => x(d.age_group))
    .attr("y1", d => y(d.actual))
    .attr("y2", d => y(d.projected))
    .attr("stroke", "#ccc")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "4,3");

  // Draw 2024 actual dots (blue)
  chartG.selectAll(".dot-actual")
    .data(data)
    .join("circle")
    .attr("class", "dot-actual")
    .attr("cx", d => x(d.age_group))
    .attr("cy", d => y(d.actual))
    .attr("r", 7)
    .attr("fill", COLOR_ACTUAL)
    .attr("stroke", STROKE_ACTUAL)
    .attr("stroke-width", 1.5)
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("r", 9);
      tooltip
        .style("opacity", 0.97)
        .html(`<strong>${d.age_group}</strong> · 2024<br/>Daily usage: <strong>${d.actual} min</strong>`)
        .style("left", (event.pageX + 14) + "px")
        .style("top",  (event.pageY - 36) + "px");
    })
    .on("mousemove", event => {
      tooltip
        .style("left", (event.pageX + 14) + "px")
        .style("top",  (event.pageY - 36) + "px");
    })
    .on("mouseout", function () {
      d3.select(this).attr("r", 7);
      tooltip.style("opacity", 0);
    });

  // Manipulation #2: projected dots in alarming dark red
  chartG.selectAll(".dot-projected")
    .data(data)
    .join("circle")
    .attr("class", "dot-projected")
    .attr("cx", d => x(d.age_group))
    .attr("cy", d => y(d.projected))
    .attr("r", 7)
    .attr("fill", COLOR_PROJECTED)
    .attr("stroke", STROKE_PROJECTED)
    .attr("stroke-width", 1.5)
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      d3.select(this).attr("r", 9);
      tooltip
        .style("opacity", 0.97)
        .html(`<strong>${d.age_group}</strong> · 2030 projected<br/>Daily usage: <strong>${d.projected} min</strong>`)
        .style("left", (event.pageX + 14) + "px")
        .style("top",  (event.pageY - 36) + "px");
    })
    .on("mousemove", event => {
      tooltip
        .style("left", (event.pageX + 14) + "px")
        .style("top",  (event.pageY - 36) + "px");
    })
    .on("mouseout", function () {
      d3.select(this).attr("r", 7);
      tooltip.style("opacity", 0);
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
    .text("Year");

  [
    { color: COLOR_ACTUAL,    stroke: STROKE_ACTUAL,    label: "2024 (actual)"    },
    { color: COLOR_PROJECTED, stroke: STROKE_PROJECTED, label: "2030 (projected)" }
  ].forEach(({ color, stroke, label }, i) => {
    const row = legendG.append("g")
      .attr("transform", `translate(0, ${20 + i * 28})`);

    row.append("circle")
      .attr("cx", 8).attr("cy", 8)
      .attr("r", 7)
      .attr("fill", color)
      .attr("stroke", stroke)
      .attr("stroke-width", 1.5);

    row.append("text")
      .attr("x", 22).attr("y", 12)
      .style("font-size", "11px")
      .style("font-family", "Nunito, sans-serif")
      .style("fill", "#444")
      .text(label);
  });

  // Connector line swatch in legend
  const connRow = legendG.append("g")
    .attr("transform", `translate(0, ${20 + 2 * 28})`);

  connRow.append("line")
    .attr("x1", 1).attr("x2", 15)
    .attr("y1", 8).attr("y2", 8)
    .attr("stroke", "#ccc")
    .attr("stroke-width", 1)
    .attr("stroke-dasharray", "4,3");

  connRow.append("text")
    .attr("x", 22).attr("y", 12)
    .style("font-size", "11px")
    .style("font-family", "Nunito, sans-serif")
    .style("fill", "#444")
    .text("Projected change");
}

draw().catch(err => console.error("Load error:", err));