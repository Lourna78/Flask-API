from flask import Flask, jsonify, request, render_template
from flask_cors import CORS
from flask import send_from_directory
import requests
import os

# Initialisation de l'application Flask
app = Flask(
    __name__,
    template_folder="frontend/templates",  # Dossier contenant les templates HTML
    static_folder="frontend/static"       # Dossier contenant les fichiers statiques
)
CORS(app, resources={r"/static/*": {"origins": "*"}})

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
        print("Page reçue :", page)
        files = page.get("properties", {}).get("Fichiers et médias", {}).get("files", [])
        for file in files:
            if file["type"] in ["file", "external"]:
                url = file["file"]["url"] if file["type"] == "file" else file["external"]["url"]
                date = page.get("properties", {}).get("Date", {}).get("date", {}).get("start", "Inconnue")
                image_urls.append({"url": url, "date": date})

    print("Images récupérées :", image_urls)
    return image_urls

@app.before_request
def log_request_info():
    print(f"Requête : {request.path}")

# Endpoint pour sauvegarder la configuration utilisateur
@app.route('/config', methods=['POST'])
def save_config():
    global user_config
    try:
        data = request.json
        user_config["api_key"] = data.get("api_key").strip()  # Supprime les espaces éventuels
        user_config["database_id"] = data.get("database_id").strip()

        print(f"Configuration utilisateur mise à jour : {user_config}")

        # Test immédiat de la configuration
        test_result = fetch_image_urls(user_config["api_key"], user_config["database_id"])
        if "error" in test_result:
            print(f"Erreur lors du test de connexion : {test_result['error']}")
            return jsonify({"error": "Configuration incorrecte : " + test_result["error"]}), 400
        
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
            print("Configuration utilisateur manquante.")
            return jsonify({"error": "Configuration utilisateur manquante. Veuillez sauvegarder vos paramètres."}), 400

        # Récupère les paramètres de pagination
        page = int(request.args.get('page', 1))  # Page actuelle (par défaut : 1)
        limit = int(request.args.get('limit', 12))  # Nombre d'images par page (par défaut : 12)
        print(f"Requête reçue - Page: {page}, Limit: {limit}")

        # Utiliser la fonction fetch_image_urls avec les clés dynamiques
        image_urls = fetch_image_urls(api_key, database_id)

        if isinstance(image_urls, dict) and "error" in image_urls:
            print("Erreur lors de la récupération des images :", image_urls["error"])
            return jsonify({"error": image_urls["error"]}), 500

        # Trier par date descendante
        image_urls.sort(key=lambda x: x.get('date', ""), reverse=True)

        # Calcul pour la pagination
        start = (page - 1) * limit
        end = start + limit
        paginated_images = image_urls[start:end]

        print(f"Images renvoyées pour la page {page} :", paginated_images)

        return jsonify({
            "images": [image["url"] for image in paginated_images],
            "total": len(image_urls),  # Nombre total d'images
            "page": page,
            "pages": (len(image_urls) + limit - 1) // limit  # Nombre total de pages
        })

    except Exception as e:
        print("Erreur lors de la récupération des images :", str(e))
        return jsonify({"error": "Une erreur est survenue lors de la récupération des images."}), 500


# Route pour servir l'index.html
@app.route('/')
def index():
    return render_template('index.html')  # Utilisez render_templates pour interpréter les balises Jinja2


# Route pour servir les fichiers CSS, JS, et autres fichiers statiques
@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)


# Lancer l'application Flask
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)