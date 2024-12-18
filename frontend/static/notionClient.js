// Classe pour gérer l'interaction avec l'API Notion
export default class NotionClient {
  constructor() {
    this.STORAGE_KEY = "notion_credentials";
    this.BASE_URL = window.location.origin; // URL de base dynamique
    this.clearInvalidCredentials();
  }

  clearInvalidCredentials() {
    const credentials = this.getCredentials();
    if (credentials && (!credentials.apiKey || !credentials.databaseId)) {
      this.clearCredentials();
    }
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
    if (!apiKey || !databaseId) {
      this.clearCredentials();
      return false;
    }
    try {
      const encrypted = this._encryptCredentials(apiKey, databaseId);
      localStorage.setItem(this.STORAGE_KEY, encrypted);
      return true;
    } catch (e) {
      console.error("Erreur lors de la sauvegarde des credentials:", e);
      return false;
    }
  }

  getCredentials() {
    try {
      const encrypted = localStorage.getItem(this.STORAGE_KEY);
      if (!encrypted) return null;

      const credentials = this._decryptCredentials(encrypted);
      if (!credentials || !credentials.apiKey || !credentials.databaseId) {
        this.clearCredentials();
        return null;
      }
      return credentials;
    } catch {
      this.clearCredentials();
      return null;
    }
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
        const data = await response.json();
        throw new Error(data.error || "Erreur de validation");
      }

      return true;
    } catch (error) {
      console.error("Erreur de validation:", error);
      this.clearCredentials();
      throw error;
    }
  }

  async fetchDatabaseContent(apiKey, databaseId) {
    try {
      console.log("Récupération des données...");
      const credentials = this.getCredentials();

      if (!credentials) {
        throw new Error(
          "Configuration utilisateur manquante. Veuillez vous reconnecter."
        );
      }

      console.log("Récupération des données...");
      const response = await fetch(`${this.BASE_URL}/images`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${credentials.apiKey}`,
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 401 || response.status === 403) {
          this.clearCredentials();
        }
        throw new Error(data.error || "Erreur serveur");
      }

      const data = await response.json();
      if (!data.images) {
        throw new Error("Format de données invalide");
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
      .map((image) => ({
        imageUrl: image.url || image,
        date: image.date || new Date().toISOString().split("T")[0],
        pageId: image.id || `image-${Math.random().toString(36).substring(7)}`,
      }))
      .filter((item) => item.imageUrl);
  }
}
