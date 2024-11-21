from flask import Flask, jsonify
import requests

app = Flask(__name__)

import os

NOTION_API_KEY = os.getenv("NOTION_API_KEY")
DATABASE_ID = os.getenv("DATABASE_ID")
NOTION_URL = f"NOTION_URL"

def fetch_image_urls():
    headers = {
        "Authorization": f"Bearer {NOTION_API_KEY}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
    }
    print("URL utilisée :", NOTION_URL)
    response = requests.post(NOTION_URL, headers=headers)
    data = response.json()
    image_urls = []

    for page in data.get("results", []):
        if "properties" in page and "Fichiers et médias" in page["properties"]:
            files = page["properties"]["Fichiers et médias"].get("files", [])
            for file in files:
                # Ajoute l'URL du fichier s'il est présent
                if file["type"] == "file":
                    image_urls.append(file["file"]["url"])
                elif file["type"] == "external":
                    image_urls.append(file["external"]["url"])

    return image_urls

@app.route("/")
def home():
    return "Hello, Flask is running"

@app.route("/images")
def get_images():
    return jsonify(fetch_image_urls())

if __name__ == "__main__":
    app.run(debug=True)