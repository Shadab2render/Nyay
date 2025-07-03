// Animation for each solution box
window.addEventListener("DOMContentLoaded", () => {
  const boxes = document.querySelectorAll(".solution-box");

  boxes.forEach((box, index) => {
    setTimeout(() => {
      box.classList.add("fade-in");
    }, index * 150);
  });
});

// Add glow + pop-out on hover/tap
document.querySelectorAll(".solution-box").forEach(box => {
  box.addEventListener("mouseenter", () => {
    box.style.transform = "scale(1.02)";
    box.style.boxShadow = "0 8px 24px rgba(96, 165, 250, 0.4)";
    box.style.transition = "all 0.3s ease";
  });

  box.addEventListener("mouseleave", () => {
    box.style.transform = "scale(1)";
    box.style.boxShadow = "none";
  });

  box.addEventListener("touchstart", () => {
    box.style.transform = "scale(1.015)";
    box.style.boxShadow = "0 0 16px rgba(168, 85, 247, 0.5)";
  });

  box.addEventListener("touchend", () => {
    box.style.transform = "scale(1)";
    box.style.boxShadow = "none";
  });
});
