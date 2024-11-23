from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS
import requests
import os

app = Flask(__name__)
CORS(app)

# Configuration utilisateur par défaut
user_config = {
    "api_key": None,
    "database_id": None
}

# Fonction pour récupérer les images et leurs dates depuis Notion
def fetch_image_urls(api_key, database_id):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
    }
    notion_url = f"https://api.notion.com/v1/databases/{database_id}/query"

    try:
        response = requests.post(notion_url, headers=headers)
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
                        "date": page["properties"].get("Date", {}).get("date", {}).get("start", "")
                    })

    return image_urls

# Endpoint pour sauvegarder la configuration utilisateur
@app.route('/config', methods=['POST'])
def save_config():
    global user_config
    data = request.json
    user_config["api_key"] = data.get("api_key")
    user_config["database_id"] = data.get("database_id")
    print("Configuration utilisateur mise à jour :", user_config)
    return jsonify({"message": "Configuration sauvegardée avec succès"}), 200

# Endpoint pour récupérer les images avec pagination
@app.route('/images', methods=['GET'])
def get_images():
    try:
        api_key = user_config.get("api_key")
        database_id = user_config.get("database_id")
        if not api_key or not database_id:
            return jsonify({"error": "Configuration utilisateur manquante."}), 400

        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 12))
        image_urls = fetch_image_urls(api_key, database_id)
        image_urls.sort(key=lambda x: x.get('date', ""), reverse=True)

        start = (page - 1) * limit
        end = start + limit
        paginated_images = image_urls[start:end]

        return jsonify({
            "images": [image["url"] for image in paginated_images],
            "total": len(image_urls),
            "page": page,
            "pages": (len(image_urls) + limit - 1) // limit
        })
    except Exception as e:
        print("Erreur lors de la récupération des images :", str(e))
        return jsonify({"error": str(e)}), 500

# Serve static files
@app.route('/')
def index():
    return send_from_directory('frontend', 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
