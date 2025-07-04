document.addEventListener("DOMContentLoaded", function () {
  const popup = document.getElementById("enquiryPopup");
  const closeBtn = document.getElementById("closeEnquiry");
  const reopenBtn = document.getElementById("reopenPopupBtn");
  const scrollBtn = document.getElementById("scrollToTopBtn");
  const mobileMenuToggle = document.getElementById("mobile-menu");
  const navLinks = document.querySelector(".nav-links");

  // Define global popup trigger (from Get Started button)
  window.openPopup = function () {
    popup.style.display = "flex";
    popup.classList.add("fade-in");
    document.body.classList.add("lock-scroll");
    reopenBtn.style.display = "none";
  };

  // Close popup
  closeBtn.addEventListener("click", () => {
    popup.style.display = "none";
    document.body.classList.remove("lock-scroll");
    reopenBtn.style.display = "block";
    reopenBtn.classList.add("pop-in");
  });

  // Reopen popup manually
  reopenBtn.addEventListener("click", () => {
    popup.style.display = "flex";
    popup.classList.add("fade-in");
    document.body.classList.add("lock-scroll");
    reopenBtn.style.display = "none";
  });

  // Scroll-to-top button
  window.addEventListener("scroll", () => {
    if (window.scrollY > 100) {
      scrollBtn.classList.add("show");
    } else {
      scrollBtn.classList.remove("show");
    }
  });

  scrollBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Mobile nav toggle
  if (mobileMenuToggle && navLinks) {
    mobileMenuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }
});
