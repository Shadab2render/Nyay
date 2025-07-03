document.addEventListener("DOMContentLoaded", function () {
  const popup = document.getElementById("enquiryPopup");
  const closeBtn = document.getElementById("closeEnquiry");
  const scrollBtn = document.getElementById("scrollToTopBtn");

  // Show popup on page load
  popup.style.display = "flex";
  document.body.classList.add("lock-scroll");

  // Close popup button
  closeBtn.addEventListener("click", () => {
    popup.style.display = "none";
    document.body.classList.remove("lock-scroll");
  });

  // Scroll-to-top button logic
  window.addEventListener("scroll", () => {
    scrollBtn.style.display = window.scrollY > 100 ? "block" : "none";
  });

  scrollBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // (Optional) Animate the popup slightly on show
  setTimeout(() => {
    popup.classList.add("fade-in");
  }, 100);
});

const mobileMenuToggle = document.getElementById("mobile-menu");
const navLinks = document.querySelector(".nav-links");

if (mobileMenuToggle && navLinks) {
  mobileMenuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}
