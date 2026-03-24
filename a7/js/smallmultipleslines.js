// Small Multiples of Lines Chart:
//   Layout: 3 columns × 2 rows (6 panels)
//   X-axis: Year (1980–2010, shared domain across all panels)
//   Y-axis: Avg song hotttnesss (shared domain, comparable across panels)
//   Panels: One per genre (top 6 genres by song count)
//   Qualitative color scale: ColorBrewer Dark2 (d3.schemeDark2)
//   Legend: d3-legend (Susie Lu)

function drawGraph(data) {
  const COLS = 3, ROWS = 2;
  const N_GENRES = COLS * ROWS; // 6 panels

  const cellW = 255, cellH = 200;
  const cellMargin = { top: 36, right: 18, bottom: 44, left: 50 };
  const panelW = cellW - cellMargin.left - cellMargin.right;
  const panelH = cellH - cellMargin.top  - cellMargin.bottom;

  const outerMargin = { top: 72, right: 215, bottom: 50, left: 20 };
  const svgW = COLS * cellW + outerMargin.left + outerMargin.right;
  const svgH = ROWS * cellH + outerMargin.top  + outerMargin.bottom;

  const canvas = d3.select("#a7-smallmultipleslines")
    .append("svg")
    .attr("width", svgW)
    .attr("height", svgH);

  // Top genre candidates (grab 10 to ensure 6 survive the point filter)
  const genreCount = d3.rollup(data, v => v.length, d => d.terms);
  const topCandidates = Array.from(genreCount, ([g, c]) => ({ g, c }))
    .sort((a, b) => b.c - a.c)
    .slice(0, 10)
    .map(d => d.g);

  // Filter to those genres + valid years
  const filtered = data.filter(d =>
    topCandidates.includes(d.terms) && d.year >= 1980 && d.year <= 2010
  );

  // Avg hotttnesss per genre per year
  const nested = d3.rollup(
    filtered,
    v => d3.mean(v, d => d.hotttnesss),
    d => d.terms,
    d => d.year
  );

  // All years across all series
  const allYears = [...new Set(filtered.map(d => d.year))].sort(d3.ascending);

  // Build series data: [{genre, values: [{year, avg}]}]
  // Require ≥3 points per panel, keep top 6
  const seriesData = topCandidates.map(genre => {
    const yearMap = nested.get(genre) || new Map();
    const values = Array.from(yearMap, ([year, avg]) => ({ year, avg }))
      .sort((a, b) => a.year - b.year);
    return { genre, values };
  })
  .filter(d => d.values.length >= 3)
  .slice(0, N_GENRES);

  const genres = seriesData.map(d => d.genre);

  // SCALES (shared across all panels for comparability)
  const xScale = d3.scaleLinear()
    .domain(d3.extent(allYears))
    .range([0, panelW]);

  const allAvgs = seriesData.flatMap(d => d.values.map(v => v.avg));
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(allAvgs) * 1.15])
    .nice()
    .range([panelH, 0]);

  // Qualitative color scale — ColorBrewer Dark2
  const colorScale = d3.scaleOrdinal()
    .domain(genres)
    .range(d3.schemeDark2);

  // LINE GENERATOR (shared across all panels)
  const lineGen = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.avg))
    .defined(d => !isNaN(d.avg))
    .curve(d3.curveMonotoneX);

  // TOOLTIP
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

  // DRAW PANELS
  seriesData.forEach((series, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const tx  = outerMargin.left + col * cellW + cellMargin.left;
    const ty  = outerMargin.top  + row * cellH  + cellMargin.top;

    const panel = canvas.append("g")
      .attr("transform", `translate(${tx},${ty})`);

    // Panel background
    panel.append("rect")
      .attr("width", panelW)
      .attr("height", panelH)
      .style("fill", "#fafafa")
      .style("stroke", "#ddd")
      .style("stroke-width", 0.8);

    // Gridlines
    panel.append("g")
      .selectAll("line")
      .data(yScale.ticks(4))
      .join("line")
      .attr("x1", 0).attr("x2", panelW)
      .attr("y1", d => yScale(d)).attr("y2", d => yScale(d))
      .style("stroke", "#e0e0e0")
      .style("stroke-width", 0.5)
      .style("stroke-dasharray", "3,3");

    // Line path
    panel.append("path")
      .datum(series.values)
      .attr("class", "line-path")
      .attr("d", lineGen)
      .style("stroke", colorScale(series.genre));

    // Dots with tooltip
    panel.selectAll(".dot")
      .data(series.values)
      .join("circle")
      .attr("class", "dot")
      .attr("cx", d => xScale(d.year))
      .attr("cy", d => yScale(d.avg))
      .attr("r", 3)
      .style("fill", colorScale(series.genre))
      .style("stroke", "white")
      .style("stroke-width", 1)
      .on("mouseover", (e, d) => {
        d3.select(e.currentTarget).attr("r", 5.5).style("stroke", "#333").style("stroke-width", 1.5);
        tooltip.style("opacity", 0.95)
          .html(`<strong>${series.genre}</strong><br/>Year: ${d.year}<br/>Avg Hotttnesss: ${d.avg.toFixed(3)}`)
          .style("left", e.pageX + 12 + "px")
          .style("top",  e.pageY - 28 + "px");
      })
      .on("mouseout", e => {
        d3.select(e.currentTarget).attr("r", 3).style("stroke", "white").style("stroke-width", 1);
        tooltip.style("opacity", 0);
      });

    // X axis
    panel.append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${panelH})`)
      .call(d3.axisBottom(xScale).ticks(4).tickFormat(d3.format("d")))
      .selectAll("text")
      .style("font-size", "10px");

    // Y axis
    panel.append("g")
      .attr("class", "axis y-axis")
      .call(d3.axisLeft(yScale).ticks(4).tickFormat(d3.format(".2f")))
      .selectAll("text")
      .style("font-size", "10px");

    // Panel title (genre name, colored)
    panel.append("text")
      .attr("x", panelW / 2)
      .attr("y", -12)
      .attr("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("fill", colorScale(series.genre))
      .text(series.genre);
  });

  // SHARED AXIS LABELS
  const panelAreaCenterX = outerMargin.left + (COLS * cellW) / 2;
  const panelAreaCenterY = outerMargin.top  + (ROWS * cellH) / 2;

  // Shared X axis label — below all panels
  canvas.append("text")
    .attr("class", "axisLabel")
    .attr("x", panelAreaCenterX)
    .attr("y", outerMargin.top + ROWS * cellH + 30)
    .attr("text-anchor", "middle")
    .text("Year");

  // Shared Y axis label — left of all panels
  canvas.append("text")
    .attr("class", "axisLabel")
    .attr("transform", "rotate(-90)")
    .attr("x", -panelAreaCenterY)
    .attr("y", 12)
    .attr("text-anchor", "middle")
    .text("Avg Song Hotttnesss");

  // TITLE
  canvas.append("text")
    .attr("x", panelAreaCenterX)
    .attr("y", 32)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Avg Song Hotttnesss Over Time by Genre (1980–2010)");

  canvas.append("text")
    .attr("x", panelAreaCenterX)
    .attr("y", 52)
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .style("fill", "#666")
    .text(`Small multiples · ${seriesData.length} genres · ColorBrewer Dark2 qualitative scale`);

  // D3-LEGEND (Susie Lu) — ordinal qualitative legend
  const legendG = canvas.append("g")
    .attr("transform", `translate(${outerMargin.left + COLS * cellW + 20}, ${outerMargin.top + 20})`);

  const legend = d3.legendColor()
    .shape("line")
    .shapeWidth(30)
    .shapePadding(8)
    .orient("vertical")
    .scale(colorScale)
    .title("Genre");

  legendG.call(legend);

  // Thicken legend lines
  legendG.selectAll(".cell .swatch")
    .style("stroke-width", "3px");

  // Legend title styling
  legendG.select(".legendTitle")
    .style("font-size", "13px")
    .style("font-weight", "bold");

  // Legend label sizing
  legendG.selectAll(".label")
    .style("font-size", "12px");
}

function draw() {
  d3.csv("music_small.csv").then(data => {
    data.forEach(d => {
      d.year       = +d["song.year"];
      d.hotttnesss = +d["song.hotttnesss"];
      d.terms      = d["artist.terms"];
    });
    const valid = data.filter(d =>
      d.year > 0 && !isNaN(d.hotttnesss) && d.hotttnesss > 0 && d.terms
    );
    drawGraph(valid);
  }).catch(err => console.error("CSV load error:", err));
}

draw();
