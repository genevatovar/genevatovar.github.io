// Multi-Line Chart:
  // X-axis: Year
  // Y-axis: Avg song hotttnesss
  // Lines: Top 5 genres over time (one line per genre)
  // Qualitative color scale: ColorBrewer Dark2 (d3.schemeDark2)

  function drawGraph(data) {
    const width = 960, height = 520;
    const margin = { top: 70, right: 230, bottom: 80, left: 80 };
    const plot_width  = width  - margin.left - margin.right;
    const plot_height = height - margin.top  - margin.bottom;

    const canvas = d3.select("#a6-linechart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const plot = canvas.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Identify top 5 genres by song count
    const genreCount = d3.rollup(data, v => v.length, d => d.terms);
    const topGenres = Array.from(genreCount, ([g, c]) => ({ g, c }))
      .sort((a, b) => b.c - a.c)
      .slice(0, 5)
      .map(d => d.g);

    // Filter to those genres + valid years
    const filtered = data.filter(d =>
      topGenres.includes(d.terms) && d.year >= 1980 && d.year <= 2010
    );

    // Avg hotttnesss per genre per year
    const nested = d3.rollup(
      filtered,
      v => d3.mean(v, d => d.hotttnesss),
      d => d.terms,
      d => d.year
    );

    // Build line data: [{genre, values: [{year, avg}]}]
    const lineData = topGenres.map(genre => {
      const yearMap = nested.get(genre) || new Map();
      const values = Array.from(yearMap, ([year, avg]) => ({ year, avg }))
        .sort((a, b) => a.year - b.year);
      return { genre, values };
    }).filter(d => d.values.length >= 5); // need enough points for a line

    // All years across all lines
    const allYears = [...new Set(filtered.map(d => d.year))].sort(d3.ascending);

    // SCALES
    const xScale = d3.scaleLinear()
      .domain(d3.extent(allYears))
      .range([0, plot_width]);

    const allAvgs = lineData.flatMap(d => d.values.map(v => v.avg));
    const yScale = d3.scaleLinear()
      .domain([0, d3.max(allAvgs) * 1.15])
      .range([plot_height, 0]);

    // QUALITATIVE color scale — ColorBrewer Dark2
    const colorScale = d3.scaleOrdinal()
      .domain(topGenres)
      .range(d3.schemeDark2);

    // GRIDLINES
    plot.append("g").selectAll("line").data(yScale.ticks()).join("line")
      .attr("x1",0).attr("x2",plot_width)
      .attr("y1",d=>yScale(d)).attr("y2",d=>yScale(d))
      .style("stroke","#ddd").style("stroke-width",0.5).style("stroke-dasharray","3,3");

    // LINE GENERATOR
    const lineGen = d3.line()
      .x(d => xScale(d.year))
      .y(d => yScale(d.avg))
      .defined(d => !isNaN(d.avg))
      .curve(d3.curveMonotoneX);

    // DRAW LINES
    lineData.forEach(series => {
      plot.append("path")
        .datum(series.values)
        .attr("class","line-path")
        .attr("d", lineGen)
        .style("stroke", colorScale(series.genre));
    });

    // DRAW DOTS
    const tooltip = d3.select("body").append("div").attr("class","tooltip");

    lineData.forEach(series => {
      plot.selectAll(`.dot-${series.genre.replace(/\s+/g,"-")}`)
        .data(series.values)
        .join("circle")
        .attr("class","dot")
        .attr("cx", d => xScale(d.year))
        .attr("cy", d => yScale(d.avg))
        .attr("r", 3.5)
        .style("fill", colorScale(series.genre))
        .style("stroke","white").style("stroke-width",1.2)
        .on("mouseover",(e,d)=>{
          d3.select(e.currentTarget).attr("r",6).style("stroke","#333").style("stroke-width",1.5);
          tooltip.style("opacity",0.95)
            .html(`<strong>${series.genre}</strong><br/>Year: ${d.year}<br/>Avg Hotttnesss: ${d.avg.toFixed(3)}`)
            .style("left",e.pageX+12+"px").style("top",e.pageY-28+"px");
        })
        .on("mouseout",(e)=>{
          d3.select(e.currentTarget).attr("r",3.5).style("stroke","white").style("stroke-width",1.2);
          tooltip.style("opacity",0);
        });
    });

    // AXES
    plot.append("g")
      .attr("transform",`translate(0,${plot_height})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
    plot.append("g")
      .call(d3.axisLeft(yScale));

    // AXIS LABELS
    plot.append("text").attr("class","axisLabel")
      .attr("x",plot_width/2).attr("y",plot_height+55)
      .attr("text-anchor","middle").text("Year");
    plot.append("text").attr("class","axisLabel")
      .attr("transform","rotate(-90)")
      .attr("x",-plot_height/2).attr("y",-58)
      .attr("text-anchor","middle").text("Avg Song Hotttnesss");

    // TITLE
    plot.append("text")
      .attr("x",plot_width/2).attr("y",-35)
      .attr("text-anchor","middle")
      .style("font-size","16px").style("font-weight","bold")
      .text("Avg Song Hotttnesss Over Time by Genre (1980–2010)");
    plot.append("text")
      .attr("x",plot_width/2).attr("y",-14)
      .attr("text-anchor","middle")
      .style("font-size","11px").style("fill","#666")
      .text(`Top ${lineData.length} genres · ColorBrewer Dark2 qualitative scale`);

    // D3-LEGEND (Susie Lu) — ordinal qualitative legend
    const legendG = canvas.append("g")
      .attr("transform",`translate(${margin.left + plot_width + 20}, ${margin.top + 20})`);

    const legend = d3.legendColor()
      .shape("line")
      .shapeWidth(30)
      .shapePadding(6)
      .orient("vertical")
      .scale(colorScale)
      .title("Genre");

    // Override to use colored lines instead of squares
    // (d3-legend "line" shape uses a path; we enhance it after)
    legendG.call(legend);

    // Make legend lines thicker
    legendG.selectAll(".swatch")
      .style("stroke-width","3px")
      .style("stroke", function() { return d3.select(this).style("stroke"); });
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
    }).catch(err => console.error(err));
  }
  draw();