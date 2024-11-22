import requests
import json
import os

# Clé API Notion (à récupérer depuis ton intégration)
NOTION_API_KEY = "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"
DATABASE_ID = "122a00a01f2280f0bb48ff47ff03a9b9"

# URL de l'API Notion
NOTION_URL = "https://api.notion.com/v1/databases/122a00a01f2280f0bb48ff47ff03a9b9/query".format(DATABASE_ID)

# Récupérer les données de la base de données
def fetch_notion_data():
    headers = {
        "Authorization": f"Bearer {NOTION_API_KEY}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
    }
    url = f"https://api.notion.com/v1/databases/122a00a01f2280f0bb48ff47ff03a9b9/query"
    response = requests.post(url, headers=headers)
print(response.json())

# Extraire les URLs des images
def extract_image_urls(data):
    image_urls = []
    for page in data.get("results", []):
        # Modifier "Image" par le nom exact de ta propriété dans Notion
        if "properties" in page and "Image" in page["properties"]:
            files = page["properties"]["Image"].get("files", [])
            for file in files:
                if file["type"] == "external":
                    image_urls.append(file["external"]["url"])
                elif file["type"] == "file":
                    image_urls.append(file["file"]["url"])
    return image_urls

# Mettre à jour le fichier HTML avec les nouvelles URLs
def update_html(image_urls):
    with open("index.html", "r", encoding="utf-8") as file:
        html = file.read()

    # Remplacer le tableau imageUrls
    new_image_urls = ",\n      ".join([f'"{url}"' for url in image_urls])
    updated_html = html.replace(
        "// Tableau d'exemple d'URLs des images\n    const imageUrls = [",
        f"// Tableau d'exemple d'URLs des images\n    const imageUrls = [\n      {new_image_urls},"
    )

    with open("index.html", "w", encoding="utf-8") as file:
        file.write(updated_html)

    print("Fichier HTML mis à jour avec succès.")

# Exécution
if __name__ == "__main__":
    notion_data = fetch_notion_data()
    if notion_data:
        image_urls = extract_image_urls(notion_data)
        update_html(image_urls)
