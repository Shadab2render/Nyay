let mediaRecorder;
let audioChunks = [];

// Elements
const recordBtn = document.getElementById('recordBtn');
const recordStatus = document.getElementById('recordStatus');
const problemInput = document.getElementById('problem');
const scrollBtn = document.getElementById("scrollToTopBtn");
const mobileMenuToggle = document.getElementById("mobile-menu");
const navLinks = document.querySelector(".nav-links");

// 🌐 Language mapping
const languageMap = {
  en: "en-IN",
  hi: "hi-IN",
  or: "or-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN"
};

// 🎙️ Voice recording + Transcription
recordBtn.addEventListener("click", async () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    audioChunks = [];
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunks, { type: "audio/webm" });
      const base64 = await blobToBase64(blob);

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

// 🎧 Blob to base64 helper
function blobToBase64(blob) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });
}

// ⬆️ Scroll to top button
window.addEventListener("scroll", () => {
  scrollBtn.style.display = window.scrollY > 100 ? "block" : "none";
});

scrollBtn.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// 🍔 Mobile menu toggle
if (mobileMenuToggle && navLinks) {
  mobileMenuToggle.addEventListener("click", () => {
    navLinks.classList.toggle("active");
  });
}
