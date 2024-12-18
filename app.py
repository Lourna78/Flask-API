from flask import Flask, jsonify, request, render_template
from flask_cors import CORS # type: ignore
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
    try:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",
        }
        
        notion_url = f"https://api.notion.com/v1/databases/{database_id}/query"
        
        body = {
            "sorts": [{"property": "Date", "direction": "descending"}],
            "page_size": 12
        }

        print(f"Requête Notion vers: {notion_url}")
        response = requests.post(
            notion_url,
            headers=headers,
            json=body
        )

        print(f"Réponse Notion: Status {response.status_code}")
        if not response.ok:
            print(f"Erreur Notion: {response.text}")
            return {"error": "Erreur lors de la récupération des données Notion"}

        data = response.json()
        results = data.get("results", [])

        images = []
        for page in results:
            try:
                files = page.get("properties", {}).get("Fichiers et médias", {}).get("files", [])
                date = page.get("properties", {}).get("Date", {}).get("date", {}).get("start")

                for file in files:
                    url = None
                    if file.get("type") == "file":
                        url = file.get("file", {}).get("url")
                    elif file.get("type") == "external":
                        url = file.get("external", {}).get("url")

                    if url:
                        images.append({
                            "url": url,  # Sera converti en imageUrl plus tard
                            "date": date,
                            "id": page.get("id")
                        })

            except Exception as e:
                print(f"Erreur traitement page: {e}")
                continue

        print(f"Images trouvées: {len(images)}")
        return images

    except Exception as e:
        print(f"Erreur fetch_image_urls: {str(e)}")
        return {"error": str(e)}

@app.before_request
def log_request_info():
    print(f"Requête : {request.path}")

# Endpoint pour sauvegarder la configuration utilisateur
@app.route('/config', methods=['POST'])
def save_config():
    try:
        # Log pour débug
        print("Données reçues:", request.json)
        
        data = request.json
        if not data:
            return jsonify({
                "error": "Données manquantes"
            }), 400

        api_key = data.get("api_key")
        database_id = data.get("database_id")

        if not api_key or not database_id:
            return jsonify({
                "error": "Clé API et ID de base de données requis"
            }), 400

        # Test immédiat de la configuration avec l'API Notion
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json"
        }

        # Tester l'accès à la base de données
        test_url = f"https://api.notion.com/v1/databases/{database_id}"
        response = requests.get(test_url, headers=headers)
        
        print("Réponse Notion:", response.status_code)
        print("Contenu:", response.text)

        if not response.ok:
            return jsonify({
                "error": f"Erreur de connexion à Notion: {response.status_code}"
            }), 400

        # Si tout va bien, sauvegarder la configuration
        global user_config
        user_config = {
            "api_key": api_key,
            "database_id": database_id
        }

        return jsonify({
            "message": "Configuration sauvegardée avec succès"
        }), 200

    except Exception as e:
        print("Erreur lors de la configuration:", str(e))
        return jsonify({
            "error": str(e)
        }), 500

# Endpoint pour récupérer les images
@app.route('/images', methods=['GET'])
def get_images():
    try:
        # Debug logs
        print("Configuration actuelle:", {
            "api_key": "***" if user_config.get("api_key") else None,
            "database_id": user_config.get("database_id")
        })

        # Vérifier les paramètres utilisateur
        api_key = user_config.get("api_key")
        database_id = user_config.get("database_id")

        if not api_key or not database_id:
            return jsonify({
                "error": "Configuration utilisateur manquante. Veuillez sauvegarder vos paramètres."
            }), 401

        # Récupérer les images
        images = fetch_image_urls(api_key, database_id)
        
        # Log pour debug
        print("Images récupérées:", images)

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

        print(f"Nombre d'images formatées: {len(formatted_images)}")

        return jsonify({
            "images": formatted_images,
            "total": len(formatted_images)
        }), 200

    except Exception as e:
        print(f"Erreur dans /images: {str(e)}")
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