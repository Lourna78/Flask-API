// Classe pour gérer l'interaction avec l'API Notion
export default class NotionClient {
  constructor() {
    this.STORAGE_KEY = "notion_credentials";
  }

  _encryptCredentials(apiKey, databaseId) {
    return btoa(JSON.stringify({ apiKey, databaseId }));
  }

  _decryptCredentials(encrypted) {
    try {
      return JSON.parse(atob(encrypted));
    } catch {
      return null;
    }
  }

  saveCredentials(apiKey, databaseId) {
    const encrypted = this._encryptCredentials(apiKey, databaseId);
    localStorage.setItem(this.STORAGE_KEY, encrypted);
  }

  getCredentials() {
    const encrypted = localStorage.getItem(this.STORAGE_KEY);
    return encrypted ? this._decryptCredentials(encrypted) : null;
  }

  clearCredentials() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  async validateCredentials(apiKey, databaseId) {
    try {
      console.log("Validation des identifiants...");
      // Utiliser le endpoint de votre backend au lieu de l'API Notion directement
      const response = await fetch("/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: apiKey,
          database_id: databaseId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur de validation des identifiants");
      }

      console.log("Validation réussie");
      return true;
    } catch (error) {
      console.error("Erreur de validation:", error.message);
      return false;
    }
  }

  async fetchDatabaseContent(apiKey, databaseId) {
    try {
      console.log("Récupération des données...");
      // Utiliser le endpoint de votre backend pour récupérer les images
      const response = await fetch("/images", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur de récupération des données");
      }

      return this._processImages(data.images);
    } catch (error) {
      console.error("Erreur de récupération:", error);
      throw error;
    }
  }

  _processImages(images) {
    if (!Array.isArray(images)) {
      console.error("Format de données invalide:", images);
      return [];
    }

    return images
      .map((imageData, index) => {
        return {
          imageUrl: imageData.url,
          date: imageData.date,
          pageId: `image-${index}`,
        };
      })
      .filter((item) => item.imageUrl && item.date);
  }
}
