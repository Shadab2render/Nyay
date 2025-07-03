import os
from dotenv import load_dotenv
from flask import Flask, render_template, request, redirect, session
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
@app.route("/grievance")
def grievance():
    return "<h2>Grievance page coming soon...</h2>"

# === Run App ===
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
