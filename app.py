from flask import Flask, jsonify
from flask_cors import CORS  # Import de CORS
import requests
import os

app = Flask(__name__)

CORS(app)

NOTION_API_KEY = os.getenv("NOTION_API_KEY")
DATABASE_ID = os.getenv("DATABASE_ID")
NOTION_URL = os.getenv("NOTION_URL", f"https://api.notion.com/v1/databases/122a00a01f2280f0bb48ff47ff03a9b9/query")

if not NOTION_API_KEY or not DATABASE_ID or not NOTION_URL:
    raise ValueError("Une ou plusieurs variables d'environnement sont manquantes : NOTION_API_KEY, DATABASE_ID, NOTION_URL")

def fetch_image_urls():
    headers = {
        "Authorization": f"Bearer {NOTION_API_KEY}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
    }
    print("=== Débogage des variables d'environnement ===")
    print("NOTION_API_KEY :", NOTION_API_KEY)
    print("DATABASE_ID :", DATABASE_ID)
    print("NOTION_URL :", NOTION_URL)
    print("=============================================")
    try:
        response = requests.post(NOTION_URL, headers=headers)
        response.raise_for_status()
    except requests.exceptions.RequestException as e:
        print("Erreur lors de la requête vers l'API Notion :", e)
        return {"error": str(e)}
    
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

@app.route("/")
def home():
    return "Hello, Flask est en ligne !"

@app.route('/images', methods=['GET'])
def get_images():
    return jsonify(["image1_url", "image2_url"])  # Exemple de réponse JSON

if __name__ == '__main__':
    app.run()