// Diverging Bar Chart:
  // X-axis: Artist genre (top 15 by count)
  // Y-axis: Deviation of avg song hotttnesss from overall mean
  // Diverging color scale: RdBu — red = below mean, blue = above mean
  // Using ColorBrewer RdBu via d3.interpolateRdBu

  function drawGraph(data) {
    const width = 960, height = 520;
    const margin = { top: 70, right: 220, bottom: 130, left: 80 };
    const plot_width  = width  - margin.left - margin.right;
    const plot_height = height - margin.top  - margin.bottom;

    const canvas = d3.select("#a6-divergingbarchart")
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const plot = canvas.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Compute overall mean
    const overallMean = d3.mean(data, d => d.hotttnesss);

    // Average hotttnesss per genre (top 15 genres by song count)
    const byGenre = d3.rollup(
      data,
      v => ({ avg: d3.mean(v, d => d.hotttnesss), count: v.length }),
      d => d.terms
    );

    let genreData = Array.from(byGenre, ([genre, vals]) => ({
      genre,
      avg: vals.avg,
      count: vals.count,
      deviation: vals.avg - overallMean
    }))
    .filter(d => d.count >= 5)                          // at least 5 songs
    .sort((a, b) => b.count - a.count)                  // sort by count
    .slice(0, 15)                                       // top 15
    .sort((a, b) => a.deviation - b.deviation);         // sort by deviation for display

    // SCALES
    const xScale = d3.scaleBand()
      .domain(genreData.map(d => d.genre))
      .range([0, plot_width])
      .padding(0.25);

    const devExtent = d3.max(genreData, d => Math.abs(d.deviation));
    const yScale = d3.scaleLinear()
      .domain([-devExtent * 1.2, devExtent * 1.2])
      .range([plot_height, 0]);

    // DIVERGING color scale (ColorBrewer RdBu)
    const colorScale = d3.scaleDiverging()
      .domain([-devExtent, 0, devExtent])
      .interpolator(d3.interpolateRdBu);

    // ZERO LINE
    plot.append("line")
      .attr("x1", 0).attr("x2", plot_width)
      .attr("y1", yScale(0)).attr("y2", yScale(0))
      .style("stroke", "#555").style("stroke-width", 1.5)
      .style("stroke-dasharray", "4,4");

    // GRIDLINES
    plot.append("g")
      .selectAll("line")
      .data(yScale.ticks())
      .join("line")
      .attr("x1", 0).attr("x2", plot_width)
      .attr("y1", d => yScale(d)).attr("y2", d => yScale(d))
      .style("stroke", "#ddd").style("stroke-width", 0.5);

    // BARS
    const bars = plot.selectAll(".bar")
      .data(genreData)
      .join("rect")
      .attr("class", "bar")
      .attr("x", d => xScale(d.genre))
      .attr("width", xScale.bandwidth())
      .attr("y", d => d.deviation >= 0 ? yScale(d.deviation) : yScale(0))
      .attr("height", d => Math.abs(yScale(d.deviation) - yScale(0)))
      .style("fill", d => colorScale(d.deviation))
      .style("stroke", "#fff")
      .style("stroke-width", 0.5);

    // AXES
    plot.append("g")
      .attr("transform", `translate(0,${plot_height})`)
      .call(d3.axisBottom(xScale))
      .selectAll("text")
      .attr("transform", "rotate(-35)")
      .style("text-anchor", "end")
      .style("font-size", "11px");

    plot.append("g").call(d3.axisLeft(yScale).tickFormat(d3.format(".3f")));

    // AXIS LABELS
    plot.append("text").attr("class","axisLabel")
      .attr("x", plot_width / 2).attr("y", plot_height + 120)
      .attr("text-anchor","middle").text("Artist Genre");

    plot.append("text").attr("class","axisLabel")
      .attr("transform","rotate(-90)")
      .attr("x", -plot_height / 2).attr("y", -62)
      .attr("text-anchor","middle").text("Deviation from Mean Hotttnesss");

    // MEAN ANNOTATION
    plot.append("text")
      .attr("x", plot_width + 5).attr("y", yScale(0) + 4)
      .style("font-size","10px").style("fill","#555")
      .text(`mean = ${overallMean.toFixed(3)}`);

    // TITLE
    plot.append("text")
      .attr("x", plot_width / 2).attr("y", -35)
      .attr("text-anchor","middle")
      .style("font-size","16px").style("font-weight","bold")
      .text("Song Hotttnesss Deviation from Mean by Genre");

    plot.append("text")
      .attr("x", plot_width / 2).attr("y", -15)
      .attr("text-anchor","middle")
      .style("font-size","12px").style("fill","#666")
      .text("Top 15 genres by song count · ColorBrewer RdBu diverging scale");

    // D3-LEGEND (Susie Lu) — continuous diverging legend
    const legendScale = d3.scaleSequential()
      .domain([-devExtent, devExtent])
      .interpolator(t => d3.interpolateRdBu(t));   // map [0,1] → [-dev, dev]

    const legendG = canvas.append("g")
      .attr("transform", `translate(${margin.left + plot_width + 20}, ${margin.top + 20})`);

    const legend = d3.legendColor()
      .shapeWidth(20)
      .cells(7)
      .orient("vertical")
      .scale(d3.scaleSequential()
        .domain([-devExtent, devExtent])
        .interpolator(t => d3.interpolateRdBu((t + devExtent) / (2 * devExtent))))
      .labelFormat(d3.format(".3f"))
      .title("Deviation");

    legendG.call(legend);

    // TOOLTIP
    const tooltip = d3.select("body").append("div").attr("class","tooltip");

    bars
      .on("mouseover", (e, d) => {
        d3.select(e.currentTarget).style("opacity", 0.8);
        tooltip.style("opacity", 0.95)
          .html(`<strong>${d.genre}</strong><br/>
                 Avg Hotttnesss: ${d.avg.toFixed(3)}<br/>
                 Deviation: ${d.deviation >= 0 ? "+" : ""}${d.deviation.toFixed(3)}<br/>
                 Songs: ${d.count}`)
          .style("left", e.pageX + 12 + "px").style("top", e.pageY - 28 + "px");
      })
      .on("mouseout", (e) => {
        d3.select(e.currentTarget).style("opacity", 1);
        tooltip.style("opacity", 0);
      });
  }

  function draw() {
    d3.csv("music_small.csv").then(data => {
      data.forEach(d => {
        d.hotttnesss = +d["song.hotttnesss"];
        d.terms      = d["artist.terms"];
      });
      const valid = data.filter(d => !isNaN(d.hotttnesss) && d.hotttnesss > 0 && d.terms);
      drawGraph(valid);
    }).catch(err => console.error(err));
  }
  draw();