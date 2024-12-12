// Classe pour gérer l'interaction avec l'API Notion
export default class NotionClient {
  constructor() {
    this.STORAGE_KEY = "notion_credentials";
    // Utilisez l'URL de votre backend Flask au lieu de l'API Notion directement
    this.API_BASE_URL = ""; // L'URL vide utilisera le même domaine que le frontend
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
      const response = await fetch("/config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ api_key: apiKey, database_id: databaseId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur de validation");
      }

      return true;
    } catch (error) {
      console.error("Erreur de validation:", error.message);
      return false;
    }
  }

  async fetchDatabaseContent(apiKey, databaseId) {
    try {
      console.log("Récupération des données...");
      const response = await fetch("/images", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur de récupération des données");
      }

      const data = await response.json();
      return this._processImages(data.images);
    } catch (error) {
      console.error("Erreur de récupération:", error);
      throw error;
    }
  }

  _processImages(images) {
    return images.map((imageUrl, index) => ({
      imageUrl,
      date: new Date(Date.now() - index * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      pageId: `image-${index}`,
    }));
  }
}
