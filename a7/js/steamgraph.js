// Streamgraph:
//   X-axis: Year (1980–2010)
//   Y-axis: Stacked avg song hotttnesss (wiggle offset)
//   Series: Top 5 genres — stacked with d3.stackOffsetWiggle
//   Qualitative color scale: ColorBrewer Set2 (d3.schemeSet2)
//   Legend: d3-legend (Susie Lu)
//   Tooltip: vertical crosshair via bisect

function drawGraph(data) {
  const width = 960, height = 520;
  const margin = { top: 70, right: 230, bottom: 80, left: 80 };
  const plot_width  = width  - margin.left - margin.right;
  const plot_height = height - margin.top  - margin.bottom;

  const canvas = d3.select("#a7-steamgraph")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const plot = canvas.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Top genre candidates (grab 8 to ensure ≥5 survive the point filter)
  const genreCount = d3.rollup(data, v => v.length, d => d.terms);
  const topCandidates = Array.from(genreCount, ([g, c]) => ({ g, c }))
    .sort((a, b) => b.c - a.c)
    .slice(0, 8)
    .map(d => d.g);

  // Filter to those genres + valid year range
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

  // All years present across all series
  const allYears = [...new Set(filtered.map(d => d.year))].sort(d3.ascending);

  // Keep genres that have data in ≥3 years, take top 5
  const genres = topCandidates
    .filter(genre => {
      const yearMap = nested.get(genre) || new Map();
      return yearMap.size >= 3;
    })
    .slice(0, 5);

  // Wide format for d3.stack(): [{year, genre1: val, genre2: val, ...}]
  // Missing years filled with 0
  const wideData = allYears.map(year => {
    const row = { year };
    genres.forEach(genre => {
      const yearMap = nested.get(genre) || new Map();
      row[genre] = yearMap.has(year) ? yearMap.get(year) : 0;
    });
    return row;
  });

  // STACK with wiggle offset for the streamgraph silhouette effect
  const stack = d3.stack()
    .keys(genres)
    .offset(d3.stackOffsetWiggle)
    .order(d3.stackOrderInsideOut);

  const stackedData = stack(wideData);

  // SCALES
  const xScale = d3.scaleLinear()
    .domain(d3.extent(allYears))
    .range([0, plot_width]);

  const yMin = d3.min(stackedData, layer => d3.min(layer, d => d[0]));
  const yMax = d3.max(stackedData, layer => d3.max(layer, d => d[1]));
  const yScale = d3.scaleLinear()
    .domain([yMin, yMax])
    .range([plot_height, 0]);

  // Qualitative color scale — ColorBrewer Set2
  const colorScale = d3.scaleOrdinal()
    .domain(genres)
    .range(d3.schemeSet2);

  // AREA GENERATOR
  const areaGen = d3.area()
    .x(d => xScale(d.data.year))
    .y0(d => yScale(d[0]))
    .y1(d => yScale(d[1]))
    .curve(d3.curveBasis);

  // DRAW STREAMS
  stackedData.forEach(layer => {
    plot.append("path")
      .datum(layer)
      .attr("class", "area-path")
      .attr("d", areaGen)
      .style("fill", colorScale(layer.key))
      .style("fill-opacity", 0.85)
      .style("stroke", "white")
      .style("stroke-width", 0.5);
  });

  // TOOLTIP + CROSSHAIR
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

  // Vertical crosshair line
  const crosshair = plot.append("line")
    .attr("y1", 0).attr("y2", plot_height)
    .style("stroke", "#555")
    .style("stroke-width", 1)
    .style("stroke-dasharray", "4,3")
    .style("opacity", 0)
    .style("pointer-events", "none");

  // Invisible overlay rect to capture mouse events
  plot.append("rect")
    .attr("width", plot_width)
    .attr("height", plot_height)
    .style("fill", "none")
    .style("pointer-events", "all")
    .on("mousemove", function(e) {
      const [mx] = d3.pointer(e);
      const year = Math.round(xScale.invert(mx));

      // Snap to nearest actual year in data
      const nearestYear = allYears.reduce((prev, curr) =>
        Math.abs(curr - year) < Math.abs(prev - year) ? curr : prev
      );

      crosshair
        .attr("x1", xScale(nearestYear))
        .attr("x2", xScale(nearestYear))
        .style("opacity", 1);

      // Build tooltip rows for each genre at this year
      const rows = genres.map(genre => {
        const yearMap = nested.get(genre) || new Map();
        const val = yearMap.has(nearestYear) ? yearMap.get(nearestYear).toFixed(3) : "—";
        const color = colorScale(genre);
        return `<span style="color:${color}; font-weight:600">${genre}</span>: ${val}`;
      }).join("<br/>");

      tooltip.style("opacity", 0.95)
        .html(`<strong>Year: ${nearestYear}</strong><br/>${rows}`)
        .style("left", e.pageX + 14 + "px")
        .style("top",  e.pageY - 36 + "px");
    })
    .on("mouseleave", () => {
      crosshair.style("opacity", 0);
      tooltip.style("opacity", 0);
    });

  // AXES
  plot.append("g")
    .attr("class", "axis x-axis")
    .attr("transform", `translate(0,${plot_height})`)
    .call(d3.axisBottom(xScale).ticks(10).tickFormat(d3.format("d")))
    .selectAll("text")
    .style("font-size", "12px");

  plot.append("g")
    .attr("class", "axis y-axis")
    .call(d3.axisLeft(yScale).ticks(6))
    .selectAll("text")
    .style("font-size", "12px");

  // AXIS LABELS
  plot.append("text")
    .attr("class", "axisLabel")
    .attr("x", plot_width / 2)
    .attr("y", plot_height + 55)
    .attr("text-anchor", "middle")
    .text("Year");

  plot.append("text")
    .attr("class", "axisLabel")
    .attr("transform", "rotate(-90)")
    .attr("x", -plot_height / 2)
    .attr("y", -60)
    .attr("text-anchor", "middle")
    .text("Avg Song Hotttnesss (stacked)");

  // TITLE
  plot.append("text")
    .attr("x", plot_width / 2)
    .attr("y", -35)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Avg Song Hotttnesss Over Time by Genre (1980–2010)");

  plot.append("text")
    .attr("x", plot_width / 2)
    .attr("y", -14)
    .attr("text-anchor", "middle")
    .style("font-size", "11px")
    .style("fill", "#666")
    .text(`Top ${genres.length} genres · Streamgraph · ColorBrewer Set2`);

  // D3-LEGEND (Susie Lu) — ordinal qualitative legend
  const legendG = canvas.append("g")
    .attr("transform", `translate(${margin.left + plot_width + 20}, ${margin.top + 20})`);

  const legend = d3.legendColor()
    .shape("rect")
    .shapeWidth(16)
    .shapeHeight(16)
    .shapePadding(8)
    .orient("vertical")
    .scale(colorScale)
    .title("Genre");

  legendG.call(legend);

  // Match legend rect opacity to stream fill opacity
  legendG.selectAll(".cell .swatch")
    .style("fill-opacity", 0.85)
    .style("stroke", d => colorScale(d))
    .style("stroke-width", "1px");

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
