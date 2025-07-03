from flask import Flask, request, render_template, redirect, url_for, session, jsonify
import os, uuid, base64, subprocess, requests
from dotenv import load_dotenv
from datetime import datetime


load_dotenv()

# Azure Translator
AZURE_TRANSLATOR_KEY = os.getenv("AZURE_TRANSLATOR_KEY")
AZURE_TRANSLATOR_REGION = os.getenv("AZURE_REGION")
AZURE_TRANSLATOR_ENDPOINT = os.getenv("AZURE_TRANSLATOR_ENDPOINT")

# Azure STT
AZURE_SPEECH_KEY = os.getenv("AZURE_SPEECH_KEY")
AZURE_SPEECH_REGION = os.getenv("AZURE_SPEECH_REGION")
AZURE_SPEECH_ENDPOINT = os.getenv("AZURE_SPEECH_ENDPOINT")

# Together.ai
TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")
TOGETHER_MODEL = os.getenv("TOGETHER_MODEL")


# === Load environment variables from .env ===
load_dotenv()

# === Flask app setup ===
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "super-secret-key")  # required for session

# === Create /uploads directory if not exists ===
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# === Home Route: Language Selection Page ===
@app.route("/", methods=["GET"])
def home():
    return render_template("language.html")

# === Store User Name + Language and Redirect to /grievance (next step) ===
@app.route("/store_language", methods=["POST"])
def store_language():
    name = request.form.get("name", "Anonymous").strip()
    language = request.form.get("language", "en")
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")

    # Save data to file
    filename = f"{UPLOAD_FOLDER}/{name.replace(' ', '_')}_{timestamp}.txt"
    with open(filename, "w", encoding="utf-8") as f:
        f.write(f"Name: {name}\n")
        f.write(f"Language: {language}\n")
        f.write(f"Timestamp: {timestamp}\n")

    # Store language in session to use in next page
    session["selected_language"] = language  # ✅ correct
    session["name"] = name

    return redirect("/grievance")  # next page (to be built)

# === Future Route for Grievance Page ===
@app.route('/grievance', methods=['GET', 'POST'])
def grievance():
    if request.method == 'POST':
        problem = request.form.get("problem")
        severity = request.form.get("severity")

        if not problem:
            return "<h2>Please describe your grievance.</h2><a href='/grievance'>🡸 Try Again</a>"

        session['problem'] = problem
        session['severity'] = severity

        return redirect(url_for('generate_solution'))  # next page placeholder
    return render_template("grievance.html")

# 🎙 /transcribe Route
@app.route('/transcribe', methods=['POST'])
def transcribe_audio_base64():
    try:
        print("📩 Transcribe route hit!")

        data = request.get_json(force=True)
        print("📥 Raw incoming JSON:", data)

        audio_base64 = data.get("audio")
        language_code = data.get("language", "en-IN")

        if not audio_base64:
            print("❗ No audio data found in request.")
            return jsonify({"error": "No audio data provided"}), 400

        print("✅ Base64 and language received. Language code:", language_code)

        # Step 1: Decode base64 audio
        try:
            audio_bytes = base64.b64decode(audio_base64)
            print("✅ Audio base64 decoded.")
        except Exception as decode_err:
            print("❌ Failed to decode base64:", decode_err)
            return jsonify({"error": "Invalid base64 format"}), 400

        # Step 2: Save raw audio
        raw_audio_path = f"static/uploads/raw_{uuid.uuid4().hex}.webm"
        try:
            with open(raw_audio_path, "wb") as f:
                f.write(audio_bytes)
            print(f"💾 Raw audio saved at {raw_audio_path}")
        except Exception as file_err:
            print("❌ Failed to save raw audio:", file_err)
            return jsonify({"error": "Failed to save audio"}), 500

        # Step 3: Convert to WAV
        wav_audio_path = raw_audio_path.replace(".webm", ".wav")
        ffmpeg_cmd = ["ffmpeg", "-y", "-i", raw_audio_path, "-ac", "1", "-ar", "16000", wav_audio_path]
        print("⚙️ Running ffmpeg:", ' '.join(ffmpeg_cmd))
        try:
            subprocess.run(ffmpeg_cmd, check=True)
            print(f"🎧 Converted WAV saved at {wav_audio_path}")
        except subprocess.CalledProcessError as e:
            print("❌ FFmpeg conversion failed:", e)
            return jsonify({"error": "Audio conversion failed"}), 500

        # Step 4: Send to Azure STT
        stt_url = f"https://{AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1"
        headers = {
            "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY,
            "Content-Type": "audio/wav",
            "Accept": "application/json"
        }
        params = { "language": language_code }

        print("🌐 Sending audio to Azure STT:", stt_url)
        try:
            with open(wav_audio_path, 'rb') as audio_file:
                stt_response = requests.post(stt_url, headers=headers, params=params, data=audio_file)
        except Exception as azure_err:
            print("❌ Error calling Azure STT:", azure_err)
            return jsonify({"error": "Azure STT request failed"}), 500

        print("🔁 Azure STT Status:", stt_response.status_code)
        print("🔊 Azure STT Raw Response:", stt_response.text)

        stt_data = stt_response.json()
        original_text = stt_data.get("DisplayText", "")

        if not original_text:
            print("⚠️ Azure STT returned no text.")
            return jsonify({"error": "Speech recognition returned empty text"}), 500

        print("🗣️ Transcribed:", original_text)

        # Step 5: Translate (if not English)
        if language_code.startswith("en"):
            translated_text = original_text
            print("🌐 Translation skipped (language is English)")
        else:
            trans_url = f"{AZURE_TRANSLATOR_ENDPOINT}/translate?api-version=3.0&to=en"
            trans_headers = {
                "Ocp-Apim-Subscription-Key": AZURE_TRANSLATOR_KEY,
                "Ocp-Apim-Subscription-Region": AZURE_TRANSLATOR_REGION,
                "Content-Type": "application/json"
            }
            trans_body = [{"Text": original_text}]
            print("🌍 Sending text to Azure Translator:", trans_url)
            try:
                trans_response = requests.post(trans_url, headers=trans_headers, json=trans_body)
                print("🌍 Translator Status:", trans_response.status_code)
                print("🌍 Translator Raw Response:", trans_response.text)
                trans_data = trans_response.json()
                translated_text = trans_data[0]["translations"][0]["text"]
            except Exception as translate_err:
                print("⚠️ Translation failed. Showing original only.")
                translated_text = original_text

        print("✅ Final translated text:", translated_text)

        return jsonify({
            "original_text": original_text,
            "translated_text": translated_text
        })

    except Exception as e:
        print("🔥 General Error in /transcribe:", str(e))
        return jsonify({"error": str(e)}), 500

# === Run App ===
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
