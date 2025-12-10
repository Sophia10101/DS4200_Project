// js/d3_radar.js creates a radar chart of audio features by genre and popularity bucket

// ensure DOM is loaded before running script
document.addEventListener("DOMContentLoaded", function () {
  console.log("[d3_radar] DOM loaded, loading cleandata/radar_data.json...");

  // load pre-aggregated radar data
  d3.json("cleandata/radar_data.json").then(function (radarData) {
    if (!radarData) {
      console.error("radarData is undefined or empty");
      return;
    }

    // data extraction
    const features = radarData.features;        // ["danceability", ...]
    const genres = radarData.genres;            // list of genre names
    const rows = radarData.data;                // array of records

    // pretty labels for feature names
    function formatFeatureName(f) {
      const mapping = {
        danceability: "Danceability",
        energy: "Energy",
        valence: "Valence",
        acousticness: "Acousticness",
        speechiness: "Speechiness",
        liveness: "Liveness"
      };
      // returns mapped name or capitalized original
      return mapping[f] || (f.charAt(0).toUpperCase() + f.slice(1));
    }

    // unique popularity buckets
    const allBuckets = Array.from(new Set(rows.map(d => d.popularity_bucket)))
      .sort((a, b) => a - b);

    // fixed color palette by popularity bucket
    const bucketColorScale = d3.scaleOrdinal()
      .domain(allBuckets)
      .range([
        "#ff6bd5", // pink
        "#ff9ff3", // light pink
        "#ff4f81", // hot pink
        "#ffb347", // orange
        "#ffd54f", // yellow
        "#36fba1", // green
        "#7fff7f", // light green
        "#00d4ff", // cyan
        "#4f9dff", // blue
        "#b266ff"  // purple
      ]);

    // ----- DOM elements -----
    // references to container and dropdown
    const containerEl = document.getElementById("radar-chart");
    const container = d3.select("#radar-chart");
    const genreSelect = document.getElementById("genre-select");  

    // populate genre dropdown
    genres.forEach(g => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = g;
      genreSelect.appendChild(opt);
    });

    // ----- SVG layout -----
    // responsive sizing
    const containerWidth = containerEl.clientWidth || 800;

    // limit chart size to max 550x550
    const chartSize = Math.min(containerWidth * 0.7, 550);
    const legendWidth = 190;
    const spacing = 40;
    const margin = 50;

    // total SVG size
    const width = chartSize + legendWidth + spacing + margin * 2;
    const height = chartSize + margin * 2;
    const radius = chartSize / 2 - 10;

    // clear any previous SVG
    container.selectAll("svg").remove();

    // create SVG
    const svg = container.append("svg")
      .attr("width", width)
      .attr("height", height);

    // group centered for radar chart (on left side)
    const g = svg.append("g")
      .attr("transform", "translate(" + (margin + chartSize / 2) + "," + (height / 2) + ")");

    // radar chart components
    const numAxes = features.length;
    const angleSlice = (Math.PI * 2) / numAxes;

    // radius scale 0–1 -> 0–radius
    const rScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, radius]);

    // ----- background grid -----
    // concentric circles
    const levels = 5;
    for (let level = 1; level <= levels; level++) {
      const r = radius * (level / levels);
      g.append("circle")
        .attr("r", r)
        .attr("fill", "none")
        .attr("stroke", "rgba(170,170,200,0.4)")
        .attr("stroke-width", 0.8);
    }

    // radial tick labels (0.2 ... 1.0)
    const tickValues = [0.2, 0.4, 0.6, 0.8, 1.0];
    g.selectAll(".radial-label")
      .data(tickValues)
      .enter()
      .append("text")
      .attr("class", "radial-label")
      .attr("x", 0)
      .attr("y", d => -rScale(d))
      .attr("dy", "-0.2em")
      .style("font-size", "10px")
      .style("fill", "rgba(200,210,240,0.9)")
      .style("text-anchor", "middle")
      .text(d => d.toFixed(1));

    // ----- axes + feature labels -----
    // axes
    const axis = g.selectAll(".axis")
      .data(features)
      .enter()
      .append("g")
      .attr("class", "axis");

    // draw axis lines and labels
    axis.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) => rScale(1.05) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y2", (d, i) => rScale(1.05) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("stroke", "rgba(190,195,230,0.9)")
      .attr("stroke-width", 1.0);

    // feature labels
    axis.append("text")
      .attr("x", (d, i) => rScale(1.2) * Math.cos(angleSlice * i - Math.PI / 2))
      .attr("y", (d, i) => rScale(1.2) * Math.sin(angleSlice * i - Math.PI / 2))
      .attr("dy", "0.35em")
      .style("font-size", "13px")
      .style("fill", "rgba(230,235,255,0.95)")
      .style("text-anchor", "middle")
      .text(d => formatFeatureName(d));

    // layer where bucket lines will be drawn
    const bucketLayer = g.append("g").attr("class", "bucket-layer");

    // helper: get sorted rows for a given genre
    function getGenreRows(genre) {
      const filtered = rows.filter(d => d.playlist_genre === genre);
      filtered.sort((a, b) => a.popularity_bucket - b.popularity_bucket);
      return filtered;
    }

    // draw legend for popularity buckets
    function drawLegend(bucketsForGenre) {
      svg.selectAll(".bucket-legend").remove();

      const uniqueBuckets = Array.from(new Set(bucketsForGenre))
        .sort((a, b) => a - b);

      // legend group
      const legend = svg.append("g")
        .attr("class", "bucket-legend")
        .attr("transform", "translate(" + (margin + chartSize + spacing) + "," + margin + ")");

      const boxHeight = 24 + uniqueBuckets.length * 18;

      // legend background
      legend.append("rect")
        .attr("width", legendWidth)
        .attr("height", boxHeight)
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("fill", "rgba(5,8,22,0.9)")
        .attr("stroke", "rgba(180,190,230,0.8)")
        .attr("stroke-width", 1);

      // legend title
      legend.append("text")
        .attr("x", 10)
        .attr("y", 18)
        .style("font-size", "11px")
        .style("fill", "rgba(230,235,255,0.95)")
        .text("Popularity range");

      // legend items
      const items = legend.selectAll(".bucket-item")
        .data(uniqueBuckets)
        .enter()
        .append("g")
        .attr("class", "bucket-item")
        .attr("transform", (d, i) => "translate(10," + (28 + i * 18) + ")");

      // legend lines + labels
      items.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 26)
        .attr("y2", 0)
        .attr("stroke", d => bucketColorScale(d))
        .attr("stroke-width", 2);

      // legend
      items.append("text")
        .attr("x", 32)
        .attr("y", 4)
        .style("font-size", "10px")
        .style("fill", "rgba(220,225,255,0.95)")
        .text(d => d + "–" + (d + 9));
    }

    // draw radar chart for selected genre
    function drawRadar(genre) {
      bucketLayer.selectAll("*").remove();

      const genreRows = getGenreRows(genre);

      // draw polygons for each popularity bucket
      genreRows.forEach(row => {
        const bucket = row.popularity_bucket;

        // compute points around the circle (sharp edges)
        const points = features.map((f, i) => {
          const value = row[f] != null ? row[f] : 0;
          const angle = angleSlice * i - Math.PI / 2;
          const x = rScale(value) * Math.cos(angle);
          const y = rScale(value) * Math.sin(angle);
          return [x, y];
        });

        // close polygon by repeating first point
        points.push(points[0]);

        // straight-line polygon (no smoothing)
        const lineGen = d3.line()
          .x(d => d[0])
          .y(d => d[1])
          .curve(d3.curveLinearClosed);

        bucketLayer.append("path")
          .datum(points)
          .attr("d", lineGen)
          .attr("fill", "none")
          .attr("stroke", bucketColorScale(bucket))
          .attr("stroke-width", 2)
          .attr("opacity", 0.95)
          .append("title")
          .text("Popularity " + bucket + "–" + (bucket + 9));
      });

      drawLegend(genreRows.map(r => r.popularity_bucket));
    }

    // initial genre + interaction
    const initialGenre = genres[0];
    genreSelect.value = initialGenre;
    drawRadar(initialGenre);

    genreSelect.addEventListener("change", function () {
      drawRadar(this.value);
    });

  // catch error (debuggin issues data load)
  }).catch(function (err) {
    console.error("Error loading cleandata/radar_data.json:", err);
  });
});
