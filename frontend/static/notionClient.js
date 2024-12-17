// Classe pour gérer l'interaction avec l'API Notion
export default class NotionClient {
  constructor() {
    this.STORAGE_KEY = "notion_credentials";
    // Vérifier et nettoyer le localStorage au démarrage
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
      throw new Error("API Key et Database ID sont requis");
    }
    const encrypted = this._encryptCredentials(apiKey, databaseId);
    try {
      localStorage.clear(); // Nettoyer d'abord tout le localStorage
      localStorage.setItem(this.STORAGE_KEY, encrypted);
      console.log("Credentials sauvegardés avec succès");
    } catch (e) {
      console.error("Erreur lors de la sauvegarde des credentials:", e);
    }
  }

  getCredentials() {
    try {
      const encrypted = localStorage.getItem(this.STORAGE_KEY);
      if (!encrypted) {
        console.log("Aucun credential trouvé");
        return null;
      }
      const credentials = this._decryptCredentials(encrypted);
      if (!credentials || !credentials.apiKey || !credentials.databaseId) {
        console.log("Credentials invalides ou incomplets");
        this.clearCredentials();
        return null;
      }
      return credentials;
    } catch (e) {
      console.error("Erreur lors de la récupération des credentials:", e);
      return null;
    }
  }

  clearCredentials() {
    try {
      localStorage.clear();
      console.log("Credentials effacés avec succès");
    } catch (e) {
      console.error("Erreur lors de la suppression des credentials:", e);
    }
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
        this.clearCredentials(); // Nettoyer en cas d'erreur
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

      const response = await fetch("/images", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store", // Désactiver le cache
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur de récupération des données");
      }

      const data = await response.json();
      return this._processImages(data.images);
    } catch (error) {
      console.error("Erreur de récupération:", error);
      // Si l'erreur est liée aux credentials, les nettoyer
      if (error.message.includes("Configuration utilisateur manquante")) {
        this.clearCredentials();
      }
      throw error;
    }
  }

  _processImages(images) {
    if (!Array.isArray(images)) {
      console.error("Format de données invalide:", images);
      return [];
    }

    return images
      .map((imageUrl, index) => ({
        imageUrl,
        date: new Date().toISOString().split("T")[0], // Fallback date
        pageId: `image-${index}`,
      }))
      .filter((item) => item.imageUrl);
  }
}
