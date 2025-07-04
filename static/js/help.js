document.addEventListener("DOMContentLoaded", () => {
  const findBtn = document.getElementById("findBtn");
  const policeList = document.getElementById("policeList");
  const ngoList = document.getElementById("ngoList");
  const legalList = document.getElementById("legalList");

  findBtn.addEventListener("click", () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        try {
          const res = await fetch("/help", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lon })
          });

          const data = await res.json();

          // Render each category
          const render = (container, items) => {
            if (!items.length) {
              container.innerHTML = "<em>No results found nearby.</em>";
              return;
            }
            container.innerHTML = items.map(i => {
              const name = i.poi?.name || "Unnamed";
              const addr = i.address?.freeformAddress || "";
              return `<div>📍 <strong>${name}</strong><br><small>${addr}</small></div><br>`;
            }).join("");
          };

          render(policeList, data.police || []);
          render(ngoList, data.ngos || []);
          render(legalList, data.legal || []);

        } catch (err) {
          console.error("Failed to fetch help data:", err);
        }
      }, () => {
        alert("Please allow location access to find help nearby.");
      });
    } else {
      alert("Geolocation not supported in your browser.");
    }
  });

  // Scroll to Top
  const scrollBtn = document.getElementById("scrollToTopBtn");
  window.addEventListener("scroll", () => {
    scrollBtn.style.display = window.scrollY > 100 ? "block" : "none";
  });
  scrollBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
