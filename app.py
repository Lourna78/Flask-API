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
        return {"error": str(e)}

    data = response.json()
    results = data.get("results", [])

    image_urls = []
    for page in results:
        if "properties" in page and "Fichiers et médias" in page["properties"]:
            files = page["properties"]["Fichiers et médias"].get("files", [])
            for file in files:
                if file["type"] == "file" or file["type"] == "external":
                    # Inclure l'URL et la date de publication
                    image_urls.append({
                        "url": file["file"]["url"] if file["type"] == "file" else file["external"]["url"],
                        "date": page["properties"].get("Date", {}).get("date", {}).get("start", "")  # Date de publication
                    })

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

from flask import request  # Import nécessaire pour gérer les paramètres GET

@app.route('/images', methods=['GET'])
def get_images():
    # Récupère les paramètres de pagination depuis la requête
    page = int(request.args.get('page', 1))  # Page actuelle (par défaut : 1)
    limit = int(request.args.get('limit', 12))  # Nombre d'images par page (par défaut : 12)

    try:
        image_urls = fetch_image_urls()

        # Trier par date descendante
        sorted_results = sorted(image_urls, reverse=False)

        # Calcul pour la pagination
        start = (page - 1) * limit  # Index de départ
        end = start + limit         # Index de fin
        paginated_images = sorted_results[start:end]

        return jsonify({
            "images": paginated_images,  # Images paginées
            "total": len(image_urls),    # Nombre total d'images
            "page": page,                # Page actuelle
            "pages": (len(image_urls) + limit - 1) // limit  # Nombre total de pages
        })
    except Exception as e:
        print("Erreur lors de la récupération des images :", str(e))
        return jsonify({"error": "Une erreur est survenue lors de la récupération des images."}), 500

if __name__ == '__main__':
    app.run()
