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
    session["lang"] = language
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
def transcribe_audio():
    try:
        data = request.get_json(force=True)
        audio_base64 = data.get("audio")
        language_code = data.get("language", "en-IN")

        if not audio_base64:
            return jsonify({"error": "No audio provided"}), 400

        # Save raw audio
        raw_path = f"static/uploads/{uuid.uuid4().hex}.webm"
        with open(raw_path, "wb") as f:
            f.write(base64.b64decode(audio_base64))

        # Convert to WAV
        wav_path = raw_path.replace(".webm", ".wav")
        subprocess.run(["ffmpeg", "-y", "-i", raw_path, "-ac", "1", "-ar", "16000", wav_path], check=True)

        # Azure STT
        stt_url = f"https://{AZURE_SPEECH_REGION}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1"
        headers = {
            "Ocp-Apim-Subscription-Key": AZURE_SPEECH_KEY,
            "Content-Type": "audio/wav",
            "Accept": "application/json"
        }
        params = { "language": language_code }

        with open(wav_path, 'rb') as audio_file:
            stt_response = requests.post(stt_url, headers=headers, params=params, data=audio_file)

        stt_data = stt_response.json()
        original_text = stt_data.get("DisplayText", "")

        if not original_text:
            return jsonify({"error": "No text transcribed"}), 500

        # Translate if not English
        if language_code.startswith("en"):
            return jsonify({ "original_text": original_text, "translated_text": original_text })

        trans_url = f"{AZURE_TRANSLATOR_ENDPOINT}/translate?api-version=3.0&to=en"
        trans_headers = {
            "Ocp-Apim-Subscription-Key": AZURE_TRANSLATOR_KEY,
            "Ocp-Apim-Subscription-Region": AZURE_TRANSLATOR_REGION,
            "Content-Type": "application/json"
        }
        trans_body = [{ "Text": original_text }]
        trans_response = requests.post(trans_url, headers=trans_headers, json=trans_body)
        translated_text = trans_response.json()[0]["translations"][0]["text"]

        return jsonify({ "original_text": original_text, "translated_text": translated_text })

    except subprocess.CalledProcessError as e:
        return jsonify({ "error": "Audio conversion failed", "details": str(e) }), 500
    except Exception as e:
        return jsonify({ "error": str(e) }), 500

# === Run App ===
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
