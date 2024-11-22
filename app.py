from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
import requests
import os
import time

app = Flask(__name__)
CORS(app)

# Chargement des variables d'environnement
NOTION_API_KEY = os.getenv("NOTION_API_KEY")
DATABASE_ID = os.getenv("DATABASE_ID")
NOTION_URL = os.getenv("NOTION_URL", f"https://api.notion.com/v1/databases/{DATABASE_ID}/query")

if not NOTION_API_KEY or not DATABASE_ID or not NOTION_URL:
    raise ValueError("Une ou plusieurs variables d'environnement sont manquantes : NOTION_API_KEY, DATABASE_ID, NOTION_URL")

# Fonction pour récupérer les URLs des images depuis Notion
def fetch_image_urls():
    headers = {
        "Authorization": f"Bearer {NOTION_API_KEY}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
    }
    try:
        response = requests.post(NOTION_URL, headers=headers)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print("Erreur lors de la requête vers l'API Notion :", e)
        return []

    data = response.json()
    image_urls = []

    for page in data.get("results", []):
        if "properties" in page and "Fichiers et médias" in page["properties"]:
            files = page["properties"]["Fichiers et médias"].get("files", [])
            for file in files:
                if file["type"] == "file":
                    image_urls.append(file["file"]["url"])
                elif file["type"] == "external":
                    image_urls.append(file["external"]["url"])

    return image_urls

# Endpoint pour servir le frontend
@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('frontend', path)

# Endpoint pour vérifier que Flask est en ligne
@app.route('/health')
def health_check():
    return "Hello, Flask est en ligne !"

# Endpoint pour récupérer les images depuis Notion
@app.route('/images', methods=['GET'])
def fetch_images():
    try:
        image_urls = fetch_image_urls()
        return jsonify({"images": image_urls, "timestamp": time.time()})
    except Exception as e:
        print("Erreur lors de la récupération des images :", str(e))
        return jsonify({"error": "Une erreur est survenue lors de la récupération des images."}), 500

if __name__ == '__main__':
    app.run()
