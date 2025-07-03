// 🎙️ Voice-to-Text + Translation
let mediaRecorder;
let audioChunks = [];

const recordBtn = document.getElementById('recordBtn');
const recordStatus = document.getElementById('recordStatus');
const problemInput = document.getElementById('problem');
const severitySlider = document.getElementById('severity');
const severityValue = document.getElementById('severity-value');

// Injected language from Flask (used in Jinja in HTML)
const userLang = "{{ session.get('selected_language', 'en') }}";
const languageMap = {
  en: "en-IN",
  hi: "hi-IN",
  or: "or-IN",
  bn: "bn-IN",
  ta: "ta-IN",
  te: "te-IN"
};

recordBtn.addEventListener('click', async () => {
  if (!mediaRecorder || mediaRecorder.state === 'inactive') {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    audioChunks = [];
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);

    mediaRecorder.onstop = async () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' });
      const base64 = await blobToBase64(blob);

      recordStatus.textContent = "⏳ Transcribing...";

      const response = await fetch('/transcribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: base64,
          language: languageMap[userLang] || "en-IN"
        })
      });

      const data = await response.json();

      if (data.translated_text) {
        problemInput.value = data.translated_text;
        recordStatus.textContent = "✅ Transcribed!";
      } else if (data.original_text) {
        problemInput.value = data.original_text;
        recordStatus.textContent = "⚠️ Translation failed.";
      } else {
        recordStatus.textContent = "❌ Transcription failed.";
      }
    };

    mediaRecorder.start();
    recordStatus.textContent = "🎤 Recording...";
    recordBtn.textContent = "⏹️";

    setTimeout(() => {
      mediaRecorder.stop();
      recordBtn.textContent = "🎙️";
    }, 7000);
  }
});

// Convert blob to base64
function blobToBase64(blob) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });
}

// Severity bar visual + value
severitySlider.addEventListener('input', () => {
  severityValue.textContent = severitySlider.value;
  const val = severitySlider.value * 10;
  severitySlider.style.background = `linear-gradient(to right, #c084fc 0%, #c084fc ${val}%, #333 ${val}%, #333 100%)`;
});
