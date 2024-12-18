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
# Améliorons la configuration CORS pour être plus spécifique
CORS(app, resources={
    r"/*": {
        "origins": ["https://widget.artyzan-agency.com"],  # Remplace * par ton sous-dom
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Configuration utilisateur par défaut
user_config = {
    "api_key": None,
    "database_id": None
}

# Fonction pour récupérer les images et leurs dates depuis Notion
def fetch_image_urls(api_key, database_id):
    # Headers pour l'API Notion
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
    }
    notion_url = f"https://api.notion.com/v1/databases/{database_id}/query"

    try:
        # Corps de la requête pour trier par date
        body = {
            "sorts": [{
                "property": "Date",
                "direction": "descending"  # Tri par date décroissante
            }],
            "page_size": 12  # Limite à 12 images pour la grille 3x4
        }

        response = requests.post(notion_url, headers=headers, json=body)
        
        if not response.ok:
            print(f"Erreur Notion {response.status_code}:", response.text)
            return {"error": f"Impossible de se connecter à cette base. Vérifiez vos identifiants ou consultez le guide."}

        data = response.json()
        results = data.get("results", [])

        print("Nombre de résultats reçus:", len(results))  # Debug log

        formatted_images = []
        for page in results:
            # Récupération de la propriété "Fichiers et médias"
            media_files = page.get("properties", {}).get("Fichiers et médias", {}).get("files", [])
            date = page.get("properties", {}).get("Date", {}).get("date", {}).get("start")

            for file in media_files:
                if file.get("type") == "file":
                    url = file.get("file", {}).get("url")
                elif file.get("type") == "external":
                    url = file.get("external", {}).get("url")
                else:
                    continue

                if url and date:
                    formatted_images.append({
                        "imageUrl": url,
                        "date": date
                    })
                    print(f"Image ajoutée - URL: {url}, Date: {date}")  # Debug log

        return formatted_images

    except Exception as e:
        print("Erreur lors de la récupération:", str(e))
        return {"error": "Impossible de récupérer les données. Veuillez réessayer."}

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



# Endpoint pour récupérer les images
@app.route('/images', methods=['GET'])
def get_images():
    try:
        # Récupérer les paramètres utilisateur
        api_key = user_config.get("api_key")
        database_id = user_config.get("database_id")

        if not api_key or not database_id:
            return jsonify({
                "error": "Configuration utilisateur manquante. Veuillez sauvegarder vos paramètres."
            }), 401

        # Récupérer les images
        images = fetch_image_urls(api_key, database_id)
        # Si une erreur est retournée
        if isinstance(images, dict) and "error" in images:
            return jsonify({"error": images["error"]}), 500
        
                # S'assurer que les images sont dans le bon format
        formatted_images = []
        for img in images:
            if isinstance(img, dict):
                formatted_images.append({
                    "imageUrl": img.get("url", ""),  # Changé de "url" à "imageUrl"
                    "date": img.get("date", ""),
                    "id": img.get("id", "")
                })

        return jsonify({
            "images": formatted_images,
            "total": len(formatted_images)
        }), 200

    except Exception as e:
        print(f"Erreur: {str(e)}")
        return jsonify({"error": str(e)}), 500


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