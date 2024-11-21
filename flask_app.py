from flask import Flask, jsonify
import requests

app = Flask(__name__)

NOTION_API_KEY = "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"
DATABASE_ID = "122a00a01f2280f0bb48ff47ff03a9b9"
NOTION_URL = "https://api.notion.com/v1/databases/122a00a01f2280f0bb48ff47ff03a9b9/query".format(DATABASE_ID)

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
    return "Hello, Flask is running on Render!"

@app.route("/images")
def get_images():
    # Remplace par ton code pour récupérer des URLs d'images depuis Notion
    return jsonify(["https://example.com/image1.jpg", "https://example.com/image2.jpg"])

if __name__ == "__main__":
    app.run(debug=True)
