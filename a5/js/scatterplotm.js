// Scatter Plot Matrix
// artist.familiarity
// artist.hotttnesss
// song.hotttnesss
// song.tempo
// song.loudness
// song.duration

function drawGraph(data) {
  const attrs = [
    { key: "familiarity",   label: "Artist Familiarity" },
    { key: "artistHot",     label: "Artist Hotttnesss"  },
    { key: "songHot",       label: "Song Hotttnesss"    },
    { key: "tempo",         label: "Tempo"              },
    { key: "loudness",      label: "Loudness"           },
    { key: "duration",      label: "Duration"           },
  ];

  const n = attrs.length;

  // DIMENSIONS — each cell
  const cellSize = 110;
  const padding  = 20;
  const margin   = { top: 60, right: 20, bottom: 20, left: 80 };

  const totalSize = n * cellSize + (n - 1) * padding;
  const width  = totalSize + margin.left + margin.right;
  const height = totalSize + margin.top  + margin.bottom;

  // CANVAS
  const canvas = d3.select("#a5-scatterplotm")
    .append("svg")
    .attr("width",  width)
    .attr("height", height);

  const plot = canvas.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // PER-ATTRIBUTE SCALES
  const scales = {};
  attrs.forEach(({ key }) => {
    const ext = d3.extent(data, d => d[key]);
    const pad = (ext[1] - ext[0]) * 0.05;
    scales[key] = d3.scaleLinear()
      .domain([ext[0] - pad, ext[1] + pad])
      .range([0, cellSize]);
  });

  // COLOR — by artist.familiarity
  const colorScale = d3.scaleSequential()
    .domain(d3.extent(data, d => d.familiarity))
    .interpolator(d3.interpolateViridis);

  // TOOLTIP
  const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("position", "absolute")
    .style("background", "rgba(0,0,0,0.78)")
    .style("color", "white")
    .style("padding", "6px 10px")
    .style("border-radius", "4px")
    .style("font-size", "11px")
    .style("pointer-events", "none");

  // Helper: position of cell (col, row)
  const cellX = col => col * (cellSize + padding);
  const cellY = row => row * (cellSize + padding);

  // DRAW EACH CELL
  attrs.forEach(({ key: xKey }, col) => {
    attrs.forEach(({ key: yKey, label: yLabel }, row) => {
      const gCell = plot.append("g")
        .attr("transform", `translate(${cellX(col)}, ${cellY(row)})`);

      // Cell background
      gCell.append("rect")
        .attr("width",  cellSize)
        .attr("height", cellSize)
        .attr("fill", row === col ? "#e8e8e8" : "#f9f9f9")
        .attr("stroke", "#ccc")
        .attr("stroke-width", 0.5);

      if (row === col) {
        // DIAGONAL — attribute name label
        gCell.append("text")
          .attr("x", cellSize / 2)
          .attr("y", cellSize / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .style("font-size", "10px")
          .style("font-weight", "bold")
          .style("fill", "#333")
          .text(attrs[col].label);
      } else {
        // OFF-DIAGONAL — scatter dots
        const xS = scales[xKey];
        const yS = d3.scaleLinear()
          .domain(scales[yKey].domain())
          .range([cellSize, 0]); // flip y per cell

        gCell.selectAll("circle")
          .data(data)
          .enter()
          .append("circle")
          .attr("cx", d => xS(d[xKey]))
          .attr("cy", d => yS(d[yKey]))
          .attr("r",  2.5)
          .attr("opacity", 0.55)
          .style("fill", d => colorScale(d.familiarity))
          .on("mouseover", (e, d) => {
            d3.select(e.currentTarget).attr("r", 5).attr("opacity", 1);
            tooltip.transition().duration(150).style("opacity", 0.95);
            tooltip
              .html(
                `<strong>${attrs[col].label}:</strong> ${d[xKey].toFixed(3)}<br/>
                 <strong>${attrs[row].label}:</strong> ${d[yKey].toFixed(3)}`
              )
              .style("left", e.pageX + 12 + "px")
              .style("top",  e.pageY - 28 + "px");
          })
          .on("mouseout", (e) => {
            d3.select(e.currentTarget).attr("r", 2.5).attr("opacity", 0.55);
            tooltip.transition().duration(200).style("opacity", 0);
          });
      }
    });
  });

  // COLUMN LABELS (top)
  attrs.forEach(({ label }, col) => {
    plot.append("text")
      .attr("x", cellX(col) + cellSize / 2)
      .attr("y", -8)
      .attr("text-anchor", "middle")
      .style("font-size", "9px")
      .style("fill", "#555")
      .text(label);
  });

  // ROW LABELS (left)
  attrs.forEach(({ label }, row) => {
    plot.append("text")
      .attr("x", -8)
      .attr("y", cellY(row) + cellSize / 2)
      .attr("text-anchor", "end")
      .attr("dy", "0.35em")
      .style("font-size", "9px")
      .style("fill", "#555")
      .text(label);
  });

  // TITLE
  canvas.append("text")
    .attr("x", margin.left + totalSize / 2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Scatter Plot Matrix — Music Attributes");

  // COLOR LEGEND (artist familiarity)
  const legendWidth = 180;
  const legendHeight = 10;
  const legendX = margin.left + totalSize - legendWidth;
  const legendY = 40;

  const defs = canvas.append("defs");
  const grad = defs.append("linearGradient").attr("id", "splom-gradient");
  for (let i = 0; i <= 10; i++) {
    grad.append("stop")
      .attr("offset", `${i * 10}%`)
      .attr("stop-color", colorScale(
        colorScale.domain()[0] + (colorScale.domain()[1] - colorScale.domain()[0]) * i / 10
      ));
  }

  const legendG = canvas.append("g").attr("transform", `translate(${legendX}, ${legendY})`);
  legendG.append("rect")
    .attr("width", legendWidth).attr("height", legendHeight)
    .style("fill", "url(#splom-gradient)");

  const legendScale = d3.scaleLinear()
    .domain(colorScale.domain())
    .range([0, legendWidth]);

  legendG.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(d3.axisBottom(legendScale).ticks(4).tickFormat(d3.format(".2f")))
    .selectAll("text").style("font-size", "8px");

  legendG.append("text")
    .attr("x", legendWidth / 2).attr("y", -4)
    .attr("text-anchor", "middle")
    .style("font-size", "9px").style("fill", "#555")
    .text("Color: Artist Familiarity");
}

function draw() {
  d3.csv("music_small.csv")
    .then((data) => {
      data.forEach(d => {
        d.familiarity = +d["artist.familiarity"];
        d.artistHot  = +d["artist.hotttnesss"];
        d.songHot    = +d["song.hotttnesss"];
        d.tempo      = +d["song.tempo"];
        d.loudness   = +d["song.loudness"];
        d.duration   = +d["song.duration"];
      });

      // Filter missing values
      const validData = data.filter(d =>
        !isNaN(d.familiarity) && !isNaN(d.artistHot) && !isNaN(d.songHot) &&
        !isNaN(d.tempo) && !isNaN(d.loudness) && !isNaN(d.duration) &&
        d.songHot > 0 && d.artistHot > 0
      );

      // Sample for performance
      const SAMPLE_SIZE = 500;
      const sampled = validData.length > SAMPLE_SIZE
        ? d3.shuffle(validData).slice(0, SAMPLE_SIZE)
        : validData;

      drawGraph(sampled);
    })
    .catch((err) => {
      console.log("Something has gone wrong");
      console.log(err);
    });
}

draw();

// SOURCES:
// D3.js Official Documentation — https://d3js.org/
// D3 Graph Gallery (Scatter Plot Matrix) — https://d3-graph-gallery.com/correlogram.html
// Observable SPLOM example — https://observablehq.com/@d3/splom