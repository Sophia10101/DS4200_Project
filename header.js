// load shared header from index.html into any page that includes this script
document.addEventListener("DOMContentLoaded", function () {

  // fetch the full index.html so we can extract the shared header
  fetch("index.html")
    .then(response => response.text())
    .then(html => {

      // convert the HTML string into a DOM object (aka document)
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // pull the #shared-header block from index.html
      const sharedHeader = doc.querySelector("#shared-header");

      // find placeholder in the current page
      const placeholder = document.getElementById("header-placeholder");

      // inject header markup
      placeholder.innerHTML = sharedHeader.innerHTML;

      // get filename of current page (e.g., d3_1.html)
      const currentPage = window.location.pathname.split("/").pop();

      // find all nav links in the injected header
      const links = placeholder.querySelectorAll("nav a");

      links.forEach(link => {
        const href = link.getAttribute("href");

        // if nav link matches current page, make it active
        if (href === currentPage) {
          link.classList.add("active");
        } else {
          link.classList.remove("active");
        }
      });
    })
    .catch(err => console.error("error loading shared header:", err));

});
