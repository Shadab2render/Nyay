document.addEventListener("DOMContentLoaded", function () {
  const popup = document.getElementById("enquiryPopup");
  const closeBtn = document.getElementById("closeEnquiry");
  const scrollBtn = document.getElementById("scrollToTopBtn");

  // Show popup on load
  popup.style.display = "flex";
  document.body.classList.add("lock-scroll");

  closeBtn.addEventListener("click", () => {
    popup.style.display = "none";
    document.body.classList.remove("lock-scroll");
  });

  // Scroll button
  window.addEventListener("scroll", () => {
    scrollBtn.style.display = window.scrollY > 100 ? "block" : "none";
  });

  scrollBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
