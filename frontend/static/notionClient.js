Untitled;

// Classe pour gérer l'interaction avec l'API Notion
export default class NotionClient {
  constructor() {
    this.STORAGE_KEY = "notion_credentials";
    this.BASE_URL = window.location.origin;
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
        throw new Error(data.error || "Erreur de validation");
      }

      return true;
    } catch (error) {
      console.error("Erreur de validation:", error);
      this.clearCredentials();
      throw error;
    }
  }

  async fetchDatabaseContent() {
    try {
      console.log("Récupération des données...");
      const credentials = this.getCredentials();

      if (!credentials) {
        throw new Error("Configuration manquante");
      }

      const response = await fetch("https://widget.artyzan-agency.com/images", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${credentials.apiKey}`,
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des données");
      }

      const data = await response.json();
      console.log("Données reçues:", data); // Log pour débug

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
      .map((image) => {
        console.log("Traitement de l'image:", image);

        // Vérification que image est un objet
        if (!image || typeof image !== "object") {
          console.error("Format d'image invalide:", image);
          return null;
        }

        // Vérification et extraction de l'URLconsole.log("Données reçues depuis l'API :", images);
        console.log("Données reçues depuis l'API :", images);
        const imageUrl = image.imageUrl || image.url;
        console.log("Vérification URL :", imageUrl, "Objet complet :", image);
        if (!imageUrl || typeof imageUrl !== "string") {
          console.error("URL invalide pour l'image:", image);
          return null;
        }

        if (!formattedDate) {
          formattedDate = new Date().toISOString().split("T")[0];
          console.warn("Date invalide détectée pour l'image :", image);
        }

        // Validation et formatage de la date
        let formattedDate = null;
        try {
          if (image.date) {
            const date = new Date(image.date);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toISOString().split("T")[0];
            }
          }
        } catch (e) {
          console.error("Erreur de formatage de date:", e);
        }

        // Si pas de date valide, utiliser la date actuelle
        if (!formattedDate) {
          formattedDate = new Date().toISOString().split("T")[0];
        }

        return {
          imageUrl: image.url,
          date: formattedDate,
          pageId: image.id || `image-${Math.random().toString(36).slice(2)}`,
        };
      })
      .filter((item) => item && item.imageUrl);
  }
}
