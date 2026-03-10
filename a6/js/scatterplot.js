// Scatterplot:
  // X-axis: artist.familiarity (quantitative)
  // Y-axis: song.hotttnesss (quantitative)
  // Color: artist.terms / genre (qualitative)
  // Qualitative ColorBrewer Set1 palette (via d3.schemeSet1)

  function drawGraph(data) {
    const width = 900, height = 520;
    const margin = { top: 60, right: 220, bottom: 80, left: 80 };
    const plot_width  = width  - margin.left - margin.right;
    const plot_height = height - margin.top  - margin.bottom;

    const canvas = d3.select("#a6-scatterplot")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const plot = canvas.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Top 8 genres by count
    const genreCount = d3.rollup(data, v => v.length, d => d.terms);
    const topGenres = Array.from(genreCount, ([genre, count]) => ({ genre, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map(d => d.genre);

    const filtered = data.filter(d => topGenres.includes(d.terms));

    // SCALES
    const xScale = d3.scaleLinear()
      .domain([0, d3.max(filtered, d => d.familiarity) * 1.05])
      .range([0, plot_width]);

    const yScale = d3.scaleLinear()
      .domain([0, d3.max(filtered, d => d.hotttnesss) * 1.05])
      .range([plot_height, 0]);

    // QUALITATIVE color scale — ColorBrewer Set1
    const colorScale = d3.scaleOrdinal()
      .domain(topGenres)
      .range(d3.schemeSet1);

    // GRIDLINES
    plot.append("g").selectAll("line").data(yScale.ticks()).join("line")
      .attr("x1",0).attr("x2",plot_width)
      .attr("y1",d=>yScale(d)).attr("y2",d=>yScale(d))
      .style("stroke","#ddd").style("stroke-width",0.5);
    plot.append("g").selectAll("line").data(xScale.ticks()).join("line")
      .attr("x1",d=>xScale(d)).attr("x2",d=>xScale(d))
      .attr("y1",0).attr("y2",plot_height)
      .style("stroke","#ddd").style("stroke-width",0.5);

    // DOTS
    const dots = plot.selectAll(".dot")
      .data(filtered)
      .join("circle")
      .attr("class","dot")
      .attr("cx", d => xScale(d.familiarity))
      .attr("cy", d => yScale(d.hotttnesss))
      .attr("r", 4)
      .style("fill", d => colorScale(d.terms))
      .style("opacity", 0.65)
      .style("stroke","white")
      .style("stroke-width", 0.5);

    // AXES
    plot.append("g")
      .attr("transform",`translate(0,${plot_height})`)
      .call(d3.axisBottom(xScale));
    plot.append("g")
      .call(d3.axisLeft(yScale));

    // AXIS LABELS
    plot.append("text").attr("class","axisLabel")
      .attr("x", plot_width/2).attr("y", plot_height+55)
      .attr("text-anchor","middle").text("Artist Familiarity");

    plot.append("text").attr("class","axisLabel")
      .attr("transform","rotate(-90)")
      .attr("x",-plot_height/2).attr("y",-55)
      .attr("text-anchor","middle").text("Song Hotttnesss");

    // TITLE
    plot.append("text")
      .attr("x",plot_width/2).attr("y",-30)
      .attr("text-anchor","middle")
      .style("font-size","16px").style("font-weight","bold")
      .text("Artist Familiarity vs. Song Hotttnesss by Genre");
    plot.append("text")
      .attr("x",plot_width/2).attr("y",-12)
      .attr("text-anchor","middle")
      .style("font-size","11px").style("fill","#666")
      .text("Top 8 genres · ColorBrewer Set1 qualitative scale");

    // D3-LEGEND (Susie Lu) — qualitative / ordinal legend
    const legendG = canvas.append("g")
      .attr("transform",`translate(${margin.left + plot_width + 20}, ${margin.top + 10})`);

    const legend = d3.legendColor()
      .shape("circle")
      .shapeRadius(7)
      .shapePadding(4)
      .orient("vertical")
      .scale(colorScale)
      .title("Genre");

    legendG.call(legend);

    // TOOLTIP
    const tooltip = d3.select("body").append("div").attr("class","tooltip");

    dots
      .on("mouseover",(e,d)=>{
        d3.select(e.currentTarget).attr("r",7).style("opacity",1).style("stroke","black").style("stroke-width",1.5);
        tooltip.style("opacity",0.95)
          .html(`<strong>${d.artist_name||"Unknown"}</strong><br/>
                 Genre: ${d.terms}<br/>
                 Familiarity: ${d.familiarity.toFixed(3)}<br/>
                 Hotttnesss: ${d.hotttnesss.toFixed(3)}`)
          .style("left",e.pageX+12+"px").style("top",e.pageY-28+"px");
      })
      .on("mouseout",(e)=>{
        d3.select(e.currentTarget).attr("r",4).style("opacity",0.65).style("stroke","white").style("stroke-width",0.5);
        tooltip.style("opacity",0);
      });
  }

  function draw() {
    d3.csv("music_small.csv").then(data => {
      data = data.filter(d =>
        d["artist.familiarity"] && d["song.hotttnesss"] && d["artist.terms"]
      );
      const SAMPLE = 600;
      if (data.length > SAMPLE) data = d3.shuffle(data).slice(0, SAMPLE);
      data.forEach(d => {
        d.familiarity  = +d["artist.familiarity"];
        d.hotttnesss   = +d["song.hotttnesss"];
        d.terms        = d["artist.terms"];
        d.artist_name  = d["artist.name"] || "";
      });
      drawGraph(data);
    }).catch(err => console.error(err));
  }
  draw();