// js/sankey.js creates  a sankey diagram of artist -> genre -> year flows filtered by audio features

// ensure DOM is loaded before running script
document.addEventListener("DOMContentLoaded", () => {
  console.log("[sankey] loading sankey_tracks.json...");

  // set up SVG and sankey layout 
  const container = d3.select("#sankey-chart");
  const node = document.getElementById("sankey-chart");

  // dimensions
  const width = node.clientWidth || 900;
  const height = 480;
  const margin = { top: 10, right: 10, bottom: 10, left: 10 };

  // SVG setup
  const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height);

  // main group
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // sankey layout setup (node width, padding, extent)
  const sankey = d3.sankey()
    .nodeWidth(16)
    .nodePadding(10)
    .extent([[0, 0], [width - 20, height - 20]]);

  // color scale for node types
  const color = d3.scaleOrdinal()
    .domain(["artist", "genre", "year"])
    .range(["#4f9dff", "#36fba1", "#ff6bd5"]);

  let tracks = [];

  // slider refs
  const danceSlider = document.getElementById("dance-slider");
  const energySlider = document.getElementById("energy-slider");
  const popSlider = document.getElementById("pop-slider");
  const danceVal = document.getElementById("dance-val");
  const energyVal = document.getElementById("energy-val");
  const popVal = document.getElementById("pop-val");

  // update slider value labels function
  function updateLabels() {
    danceVal.textContent = Number(danceSlider.value).toFixed(2);
    energyVal.textContent = Number(energySlider.value).toFixed(2);
    popVal.textContent = popSlider.value;
  }

  // helper used for mapping artist -> genre -> year flows
  function buildGraph(data) {
    const nodes = [];
    const links = [];
    const index = new Map();

    // function to add node if not exists, return index
    function addNode(name, type) {
      const key = `${type}|${name}`;
      if (!index.has(key)) {
        index.set(key, nodes.length);
        nodes.push({ name, type });
      }
      return index.get(key);
    }

    // maps for aggregating counts
    const ag = new Map(); // artist -> genre
    const gy = new Map(); // genre -> year

    // aggregate counts for artist->genre and genre->year
    data.forEach(d => {
      const artist = d.artist;
      const genre = d.genre;
      const year = String(d.year);

      // skip if missing data
      if (!artist || !genre || !year) return;

      const k1 = `${artist}|${genre}`;
      ag.set(k1, (ag.get(k1) || 0) + 1);

      const k2 = `${genre}|${year}`;
      gy.set(k2, (gy.get(k2) || 0) + 1);
    });

    // artist -> genre links
    ag.forEach((value, key) => {
      const [artist, genre] = key.split("|");
      const a = addNode(artist, "artist");
      const g = addNode(genre, "genre");
      links.push({ source: a, target: g, value });
    });

    // genre -> year links
    gy.forEach((value, key) => {
      const [genre, year] = key.split("|");
      const g = addNode(genre, "genre");
      const y = addNode(year, "year");
      links.push({ source: g, target: y, value });
    });

    return { nodes, links };
  }

  // now we can draw the sankey diagram!!
  function drawSankey() {
    if (!tracks.length) return;

    const minDance = +danceSlider.value;
    const minEnergy = +energySlider.value;
    const minPop = +popSlider.value;

    updateLabels();

    const filtered = tracks.filter(t =>
      t.danceability >= minDance &&
      t.energy >= minEnergy &&
      t.track_popularity >= minPop
    );

    const graph = buildGraph(filtered);

    sankey(graph);

    // clear previous
    g.selectAll("*").remove();

    // links (flows)
    g.append("g")
      .selectAll("path")
      .data(graph.links)
      .join("path")
      .attr("d", d3.sankeyLinkHorizontal())
      .attr("stroke", d => color(graph.nodes[d.source.index].type))
      .attr("stroke-width", d => Math.max(1, d.width))
      .attr("fill", "none")
      .attr("opacity", 0.4)
      .on("mouseover", function () {
        d3.select(this).attr("opacity", 0.8);
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.4);
      })
      .append("title")
      .text(d => `${graph.nodes[d.source.index].name} -> 
        ${graph.nodes[d.target.index].name}
        Count: ${d.value}`);

    // nodes
    const node = g.append("g")
      .selectAll("g")
      .data(graph.nodes)
      .join("g");

    // node
    node.append("rect")
      .attr("x", d => d.x0)
      .attr("y", d => d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => color(d.type))
      .append("title")
      .text(d => `${d.name} (${d.type})`);

    // node labels
    node.append("text")
      .attr("x", d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr("y", d => (d.y0 + d.y1) / 2)
      .attr("dy", "0.35em")
      .style("fill", "rgba(230,235,255,0.9)")
      .style("font-size", "11px")
      .attr("text-anchor", d => d.x0 < width / 2 ? "start" : "end")
      .text(d => d.name);
  }

  // load data
  d3.json("cleandata/sankey_tracks.json").then(data => {
    data.forEach(d => {
      d.danceability = +d.danceability;
      d.energy = +d.energy;
      d.track_popularity = +d.track_popularity;
    });

    tracks = data;
    drawSankey();
  });

  // update on slider moves
  [danceSlider, energySlider, popSlider].forEach(sl =>
    sl.addEventListener("input", drawSankey)
  );
});
