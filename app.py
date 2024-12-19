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
        print("\n=== Début fetch_image_urls ===")
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",
        }
        
        notion_url = f"https://api.notion.com/v1/databases/{database_id}/query"
        print(f"🌐 URL Notion: {notion_url}")
        
        body = {
            "sorts": [{"property": "Date", "direction": "descending"}],
            "page_size": 12
        }
        print("📝 Body de la requête:", body)

        response = requests.post(notion_url, headers=headers, json=body)
        print(f"📥 Réponse Notion: Status {response.status_code}")
        
        if not response.ok:
            error_content = response.text
            print(f"❌ Erreur Notion: {error_content}")
            return {"error": f"Erreur Notion ({response.status_code}): {error_content}"}

        data = response.json()
        results = data.get("results", [])
        print(f"\n📦 Nombre de résultats: {len(results)}")

        images = []
        for index, page in enumerate(results):
            try:
                print(f"\n🔄 Traitement page {index + 1}")
                files = page.get("properties", {}).get("Fichiers et médias", {}).get("files", [])
                date = page.get("properties", {}).get("Date", {}).get("date", {}).get("start")
                
                print(f"📅 Date trouvée: {date}")
                print(f"📷 Nombre de fichiers: {len(files)}")

                for file_index, file in enumerate(files):
                    url = None
                    if file.get("type") == "file":
                        url = file.get("file", {}).get("url")
                        type_str = "file"
                    elif file.get("type") == "external":
                        url = file.get("external", {}).get("url")
                        type_str = "external"
                    else:
                        type_str = "unknown"
                    
                    print(f"   Fichier {file_index + 1}: Type={type_str}, URL={'✅' if url else '❌'}")

                    if url and date:
                        images.append({
                            "url": url,
                            "date": date,
                            "id": f"{page.get('id')}_{file_index}"
                        })
                        print(f"   ✅ Image ajoutée")

            except Exception as e:
                print(f"❌ Erreur traitement page {index + 1}: {str(e)}")
                continue

        print(f"\n📤 Total images trouvées: {len(images)}")
        print("=== Fin fetch_image_urls ===\n")
        return images

    except Exception as e:
        print(f"\n❌ Erreur générale fetch_image_urls: {str(e)}")
        import traceback
        print("Stacktrace:", traceback.format_exc())
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
        print("\n=== Début de la requête /images ===")
        print("Headers reçus:", dict(request.headers))
    
        # Debug logs pour la configuration
        print("Configuration actuelle:", {
            "api_key": "***" if user_config.get("api_key") else None,
            "database_id": user_config.get("database_id")
        })

        # Vérification des credentials
        api_key = user_config.get("api_key")
        database_id = user_config.get("database_id")

        if not api_key or not database_id:
            print("❌ Credentials manquants")
            return jsonify({
                "error": "Configuration utilisateur manquante"
            }), 401

        # Récupérer les images
        print("\n📥 Récupération des images via fetch_image_urls...")
        images = fetch_image_urls(api_key, database_id)
        
       # Debug des images reçues
        print(f"\n📦 Images brutes reçues: {len(images) if isinstance(images, list) else 'Error'}")

        if isinstance(images, dict) and "error" in images:
            print(f"❌ Erreur retournée par fetch_image_urls: {images['error']}")
            return jsonify({"error": images["error"]}), 500

     # Formatage des images
        formatted_images = []
        print("\n🔄 Début du formatage des images")
        for i, img in enumerate(images):
            if isinstance(img, dict):
                formatted_img = {
                    "imageUrl": img.get("url", ""),
                    "date": img.get("date", ""),
                    "id": img.get("id", str(i))
                }
                formatted_images.append(formatted_img)
                print(f"✅ Image {i+1} formatée: {formatted_img}")

        result = {
            "images": formatted_images,
            "total": len(formatted_images)
        }

        print(f"\n📤 Envoi de {len(formatted_images)} images au frontend")
        print("=== Fin de la requête /images ===\n")
        
        return jsonify(result), 200

    except Exception as e:
        print(f"\n❌ Erreur dans /images: {str(e)}")
        import traceback
        print("Stacktrace:", traceback.format_exc())
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