// Multi-Series Area Chart (overlapping areas):
//   X-axis: Year (1980–2010)
//   Y-axis: Avg song hotttnesss
//   Series: Top 4–5 genres (overlapping, semi-transparent fills)
//   Qualitative color scale: ColorBrewer Set2 (d3.schemeSet2)
//   Legend: d3-legend (Susie Lu)
//   Tooltip: vertical crosshair via bisect

function drawGraph(data) {
  const width = 960, height = 520;
  const margin = { top: 70, right: 230, bottom: 80, left: 80 };
  const plot_width  = width  - margin.left - margin.right;
  const plot_height = height - margin.top  - margin.bottom;

  const canvas = d3.select("#a7-multiseriesarea")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const plot = canvas.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Top genre candidates (grab 8 to ensure ≥4 survive the point filter)
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

  // Build series: [{genre, values: [{year, avg}]}]
  // Fill missing years with null so .defined() can skip gaps
  const seriesData = topCandidates.map(genre => {
    const yearMap = nested.get(genre) || new Map();
    const values = allYears.map(year => ({
      year,
      avg: yearMap.has(year) ? yearMap.get(year) : null
    }));
    const defined = values.filter(d => d.avg !== null).length;
    return { genre, values, defined };
  })
  .filter(d => d.defined >= 3)
  .slice(0, 5);

  // Sort largest-area series to back so smaller ones aren't hidden
  seriesData.sort((a, b) => {
    const sumA = d3.sum(a.values, d => d.avg || 0);
    const sumB = d3.sum(b.values, d => d.avg || 0);
    return sumB - sumA;
  });

  const genres = seriesData.map(d => d.genre);

  // SCALES
  const xScale = d3.scaleLinear()
    .domain(d3.extent(allYears))
    .range([0, plot_width]);

  const allAvgs = seriesData.flatMap(d => d.values.map(v => v.avg || 0));
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(allAvgs) * 1.15])
    .nice()
    .range([plot_height, 0]);

  // Qualitative color scale — ColorBrewer Set2
  const colorScale = d3.scaleOrdinal()
    .domain(genres)
    .range(d3.schemeSet2);

  // GRIDLINES
  plot.append("g").attr("class", "grid")
    .selectAll("line")
    .data(yScale.ticks())
    .join("line")
    .attr("x1", 0).attr("x2", plot_width)
    .attr("y1", d => yScale(d)).attr("y2", d => yScale(d))
    .style("stroke", "#ddd")
    .style("stroke-width", 0.5)
    .style("stroke-dasharray", "3,3");

  // AREA + LINE GENERATORS
  const areaGen = d3.area()
    .x(d => xScale(d.year))
    .y0(plot_height)
    .y1(d => yScale(d.avg))
    .defined(d => d.avg !== null)
    .curve(d3.curveMonotoneX);

  const lineGen = d3.line()
    .x(d => xScale(d.year))
    .y(d => yScale(d.avg))
    .defined(d => d.avg !== null)
    .curve(d3.curveMonotoneX);

  // DRAW AREAS (largest → smallest so smaller are on top)
  seriesData.forEach(series => {
    // Filled area — semi-transparent so overlap shows through
    plot.append("path")
      .datum(series.values)
      .attr("class", "area-path")
      .attr("d", areaGen)
      .style("fill", colorScale(series.genre))
      .style("fill-opacity", 0.35)
      .style("stroke", "none");

    // Stroke line on top of each area for clarity
    plot.append("path")
      .datum(series.values)
      .attr("class", "line-path")
      .attr("d", lineGen)
      .style("stroke", colorScale(series.genre))
      .style("stroke-width", "2px");
  });

  // TOOLTIP + CROSSHAIR
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip");

  // Vertical crosshair line
  const crosshair = plot.append("line")
    .attr("class", "crosshair")
    .attr("y1", 0).attr("y2", plot_height)
    .style("stroke", "#999")
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

      // Build tooltip rows for each series at this year
      const rows = seriesData.map(series => {
        const pt = series.values.find(v => v.year === nearestYear);
        const val = pt && pt.avg !== null ? pt.avg.toFixed(3) : "—";
        const color = colorScale(series.genre);
        return `<span style="color:${color}; font-weight:600">${series.genre}</span>: ${val}`;
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
    .call(d3.axisLeft(yScale).ticks(8))
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
    .text("Avg Song Hotttnesss");

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
    .text(`Top ${seriesData.length} genres · Overlapping areas · ColorBrewer Set2`);

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

  // Match legend rect opacity to the area fill opacity
  legendG.selectAll(".cell .swatch")
    .style("fill-opacity", 0.7)
    .style("stroke", d => colorScale(d))
    .style("stroke-width", "1.5px");

  legendG.select(".legendTitle")
    .style("font-size", "13px")
    .style("font-weight", "bold");

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
