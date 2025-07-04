let mediaRecorder;
let audioChunks = [];

// 🌐 Language logic
const userLang = document.body.getAttribute("data-lang") || "en";
const languageMap = {
  en: "en-IN", hi: "hi-IN", or: "or-IN",
  bn: "bn-IN", ta: "ta-IN", te: "te-IN"
};
const labels = {
  en: { speak: "Speak", continue: "Continue", title: "Describe Your Grievance" },
  hi: { speak: "बोलना", continue: "आगे जारी रखें", title: "अपनी समस्या बताएं" },
  or: { speak: "କହନ୍ତୁ", continue: "ଆଗକୁ ବଢନ୍ତୁ", title: "ଆପଣଙ୍କର ସମସ୍ୟା ବର୍ଣ୍ଣନା କରନ୍ତୁ" },
  bn: { speak: "বলুন", continue: "চালিয়ে যান", title: "আপনার সমস্যা বলুন" },
  ta: { speak: "பேசவும்", continue: "தொடரவும்", title: "உங்கள் பிரச்சனை சொல்லுங்கள்" },
  te: { speak: "మాట్లాడండి", continue: "కొనసాగించండి", title: "మీ సమస్యను వివరించండి" },
};

// 🎯 DOM elements
const recordBtn = document.getElementById('recordBtn');
const recordStatus = document.getElementById('recordStatus');
const problemInput = document.getElementById('problem');
const scrollBtn = document.getElementById("scrollToTopBtn");
const mobileMenuToggle = document.getElementById("mobile-menu");
const navLinks = document.querySelector(".nav-links");
const translationLoader = document.getElementById("translationLoader");

// 🎙 Voice Transcription Logic
recordBtn.addEventListener("click", async () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];

    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunks, { type: "audio/webm" });
      const base64 = await blobToBase64(blob);

      // Show loader
      translationLoader.style.display = "flex";
      recordStatus.textContent = "Transcribing...";

      try {
        const response = await fetch("/transcribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audio: base64,
            language: languageMap[userLang] || "en-IN"
          })
        });

        const data = await response.json();

        // Hide loader
        translationLoader.style.display = "none";

        if (data.translated_text) {
          problemInput.value = data.translated_text;
          recordStatus.textContent = "✔️ Transcribed";
        } else if (data.original_text) {
          problemInput.value = data.original_text;
          recordStatus.textContent = "⚠️ Raw Transcription";
        } else {
          recordStatus.textContent = "❌ Failed to transcribe";
        }
      } catch (err) {
        console.error(err);
        translationLoader.style.display = "none";
        recordStatus.textContent = "❌ Error occurred";
      }
    };

    mediaRecorder.start();
    recordStatus.textContent = "🎙️ Recording...";
    recordBtn.textContent = "⏹️";

    setTimeout(() => {
      mediaRecorder.stop();
      recordBtn.textContent = "🎙️";
    }, 7000);
  }
});

// 🔄 Base64 Helper
function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });
}

// 🆙 Scroll-to-top
window.addEventListener("scroll", () => {
  scrollBtn.style.display = window.scrollY > 100 ? "block" : "none";
});
scrollBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// 🍔 Mobile menu
if (mobileMenuToggle && navLinks) {
  mobileMenuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}

// 🈯 Apply labels after DOM loaded
document.addEventListener("DOMContentLoaded", () => {
  const langSet = labels[userLang] || labels["en"];
  document.getElementById("recordBtn").textContent = langSet.speak;
  document.getElementById("continueBtn").textContent = langSet.continue;
  document.getElementById("form-title").textContent = langSet.title;
});
