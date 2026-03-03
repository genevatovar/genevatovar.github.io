// Bubble Chart
// X axis - artist.familiarity
// Y axis - song.hotttnesss
// Bubble size - song.tempo
// Color - artist.terms

function drawGraph(data) {
  // DIMENSIONS
  const width = 700;
  const height = 400;
  const margin = { top: 40, right: 120, bottom: 80, left: 70 };
  const plot_width = width - margin.left - margin.right;
  const plot_height = height - margin.top - margin.bottom;

  // CANVAS
  var canvas = d3
    .select("#a5-bubblechart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // PLOT
  var plot = canvas
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // SCALES
  let xScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.familiarity) * 1.05])
    .range([0, plot_width]);

  let yScale = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.hotttnesss) * 1.05])
    .range([plot_height, 0]);

  // Bubble size scale (radius in pixels)
  let sizeScale = d3.scaleSqrt()
    .domain([d3.min(data, d => d.tempo), d3.max(data, d => d.tempo)])
    .range([3, 20]);

  // Color scale for artist terms (genres)
  const terms = [...new Set(data.map(d => d.terms))];
  let colorScale = d3.scaleOrdinal()
    .domain(terms)
    .range(d3.schemeTableau10);

  // GRIDLINES
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
      .style("stroke-width", 0.3)
      .style("stroke-dasharray", "3,3");
  };

  let xGrid = (g) => {
    g.attr("class", "grid-line")
      .selectAll("line")
      .data(xScale.ticks())
      .join("line")
      .attr("x1", d => xScale(d))
      .attr("x2", d => xScale(d))
      .attr("y1", 0)
      .attr("y2", plot_height)
      .style("stroke", "gray")
      .style("stroke-width", 0.3)
      .style("stroke-dasharray", "3,3");
  };

  plot.append("g").call(yGrid);
  plot.append("g").call(xGrid);

  // BUBBLES
  let viz = plot
    .selectAll(".bubble")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "bubble")
    .attr("cx", d => xScale(d.familiarity))
    .attr("cy", d => yScale(d.hotttnesss))
    .attr("r", d => sizeScale(d.tempo))
    .style("fill", d => colorScale(d.terms))
    .style("opacity", 0.7)
    .style("stroke", "white")
    .style("stroke-width", 0.5);

  // AXES
  let xAx = d3.axisBottom(xScale);
  let yAx = d3.axisLeft(yScale);

  plot
    .append("g")
    .attr("transform", `translate(0, ${plot_height})`)
    .attr("class", "axes")
    .call(xAx);

  plot
    .append("g")
    .attr("class", "axes")
    .call(yAx);

  // AXIS LABELS
  plot
    .append("text")
    .attr("class", "axisLabel")
    .attr("x", plot_width / 2)
    .attr("y", plot_height + margin.bottom * 0.75)
    .attr("text-anchor", "middle")
    .text("Artist Familiarity");

  plot
    .append("text")
    .attr("class", "axisLabel")
    .attr("x", 0)
    .attr("y", -(margin.left * 0.67))
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle")
    .text("Song Hotttnesss");

  // TITLE
  plot
    .append("text")
    .attr("x", plot_width / 2)
    .attr("y", -10)
    .attr("text-anchor", "middle")
    .style("font-size", "16px")
    .style("font-weight", "bold")
    .text("Artist Familiarity vs. Song Hotttnesss");

  // COLOR LEGEND (artist.terms / genre)
  const legend = plot.append("g")
    .attr("transform", `translate(${plot_width + 10}, 0)`);

  legend.append("text")
    .attr("x", 0)
    .attr("y", -5)
    .style("font-size", "11px")
    .style("font-weight", "bold")
    .text("Genre");

  terms.slice(0, 8).forEach((term, i) => {
    legend.append("circle")
      .attr("cx", 6)
      .attr("cy", i * 18 + 10)
      .attr("r", 6)
      .style("fill", colorScale(term))
      .style("opacity", 0.8);

    legend.append("text")
      .attr("x", 16)
      .attr("y", i * 18 + 14)
      .style("font-size", "10px")
      .text(term.length > 12 ? term.slice(0, 12) + "…" : term);
  });

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

  viz
    .on("mouseover", (e, d) => {
      d3.select(e.currentTarget)
        .style("opacity", 1)
        .style("stroke", "black")
        .style("stroke-width", 1.5);
      tooltip.transition().duration(200).style("opacity", 0.95);
      tooltip
        .html(
          `<strong>${d.artist_name || "Unknown Artist"}</strong><br/>
           Genre: ${d.terms}<br/>
           Familiarity: ${d.familiarity.toFixed(2)}<br/>
           Hotttnesss: ${d.hotttnesss.toFixed(2)}<br/>
           Tempo: ${d.tempo.toFixed(1)} BPM`
        )
        .style("left", e.pageX + 12 + "px")
        .style("top", e.pageY - 28 + "px");
    })
    .on("mouseout", (e) => {
      d3.select(e.currentTarget)
        .style("opacity", 0.7)
        .style("stroke", "white")
        .style("stroke-width", 0.5);
      tooltip.transition().duration(300).style("opacity", 0);
    });
}

function draw() {
  d3.csv("music_small.csv")
    .then((data) => {
      // Filter out rows with missing values
      data = data.filter(d =>
        d["artist.familiarity"] && d["song.hotttnesss"] &&
        d["song.tempo"] && d["artist.terms"]
      );

      // Randomly sample 500 rows for performance
      const SAMPLE_SIZE = 500;
      if (data.length > SAMPLE_SIZE) {
        data = d3.shuffle(data).slice(0, SAMPLE_SIZE);
      }

      data.forEach((d) => {
        d.familiarity = +d["artist.familiarity"];
        d.hotttnesss  = +d["song.hotttnesss"];
        d.tempo       = +d["song.tempo"];
        d.terms       = d["artist.terms"];
        d.artist_name = d["artist.name"] || "";
      });

      drawGraph(data);
    })
    .catch((err) => {
      console.log("Something has gone wrong");
      console.log(err);
    });
}

draw();

// SOURCES:
// D3.js Official Documentation — https://d3js.org/
// D3 Graph Gallery (Bubble Chart) — https://d3-graph-gallery.com/bubble.html
// Observable D3 Tutorials — https://observablehq.com/@d3/learn-d3