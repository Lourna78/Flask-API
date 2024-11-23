from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
from flask import request, jsonify
from flask import flash, jsonify, request
import requests
import os
import json

app = Flask(__name__)
CORS(app)

# Chargement des variables d'environnement
NOTION_API_KEY = os.getenv("NOTION_API_KEY")
DATABASE_ID = os.getenv("DATABASE_ID")
NOTION_URL = os.getenv("NOTION_URL", f"https://api.notion.com/v1/databases/{DATABASE_ID}/query")

if not NOTION_API_KEY or not DATABASE_ID or not NOTION_URL:
    raise ValueError("Une ou plusieurs variables d'environnement sont manquantes : NOTION_API_KEY, DATABASE_ID, NOTION_URL")

# Fonction pour récupérer les images et leurs dates depuis Notion
def fetch_image_urls(api_key, database_id):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
    }
    notion_url = f"https://api.notion.com/v1/databases/{database_id}/query"

    try:
        print("Requête envoyée à Notion avec les données suivantes :")
        print("API Key :", api_key)
        print("Database ID :", database_id)

        response = requests.post(notion_url, headers=headers)
        print("Réponse de Notion :", response.status_code, response.text)
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
                    image_urls.append({
                        "url": file["file"]["url"] if file["type"] == "file" else file["external"]["url"],
                        "date": page["properties"].get("Date", {}).get("date", {}).get("start", "")  # Date de publication
                    })

    print("Images récupérées :", image_urls)
    return image_urls

# Variable pour stocker temporairement la configuration utilisateur
user_config = {
    "api_key": None,
    "database_id": None
}

# Endpoint pour sauvegarder la configuration
@app.route('/config', methods=['POST'])
def save_config():
    try:
        global user_config
        data = request.json
        user_config["api_key"] = data.get("api_key")
        user_config["database_id"] = data.get("database_id")
        print("Configuration utilisateur mise à jour :", user_config)
        return jsonify({"message": "Configuration sauvegardée avec succès"}), 200
    except Exception as e:
        print("Erreur lors de la sauvegarde de la configuration :", e)
        return jsonify({"error": str(e)}), 500
    
# Endpoint pour récupérer les images avec pagination
@app.route('/images', methods=['GET'])
def get_images():
    try:
        # Récupérer les paramètres utilisateur
        api_key = user_config.get("api_key")
        database_id = user_config.get("database_id")
        if not api_key or not database_id:
            return jsonify({"error": "Configuration utilisateur manquante. Veuillez sauvegarder vos paramètres."}), 400

        # Récupère les paramètres de pagination
        page = int(request.args.get('page', 1))  # Page actuelle (par défaut : 1)
        limit = int(request.args.get('limit', 12))  # Nombre d'images par page (par défaut : 12)

        # Utiliser la fonction fetch_image_urls avec les clés dynamiques
        image_urls = fetch_image_urls(api_key, database_id)

        # Trier par date descendante
        image_urls.sort(key=lambda x: x.get('date', ""), reverse=True)

        # Calcul pour la pagination
        start = (page - 1) * limit
        end = start + limit
        paginated_images = image_urls[start:end]

        return jsonify({
            "images": [image["url"] for image in paginated_images],
            "total": len(image_urls),  # Nombre total d'images
            "page": page,
            "pages": (len(image_urls) + limit - 1) // limit  # Nombre total de pages
        })

    except Exception as e:
        print("Erreur lors de la récupération des images :", str(e))
        return jsonify({"error": "Une erreur est survenue lors de la récupération des images."}), 500

# Endpoint pour servir la page d'accueil (index.html)
@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')

# Endpoint pour servir les fichiers statiques (CSS, JS, images, etc.)
@app.route('/<path:path>')
def static_files(path):
    return send_from_directory('frontend', path)

@app.route('/test')
def test():
    return "Connexion réussie via widget.artyzan-agency.com"

user_config = {}

@app.route('/set-config', methods=['POST'])
def set_config():
    global user_config
    data = request.json
    user_config['notionApiKey'] = data.get('notionApiKey')
    user_config['databaseId'] = data.get('databaseId')
    return jsonify({"message": "Configuration enregistrée"}), 200

if __name__ == '__main__':
    # Ajout de gestion dynamique du port pour Render
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)