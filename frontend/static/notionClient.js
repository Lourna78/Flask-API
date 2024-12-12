// Classe pour gérer l'interaction avec l'API Notion
export default class NotionClient {
  constructor() {
    this.STORAGE_KEY = "notion_credentials";
    this.API_BASE_URL = "https://api.notion.com/v1";
    this.NOTION_VERSION = "2022-06-28";
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

  _getHeaders(apiKey) {
    return {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": this.NOTION_VERSION,
      "Content-Type": "application/json",
    };
  }

  async _handleNotionResponse(response) {
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erreur API Notion:", {
        status: response.status,
        statusText: response.statusText,
        details: errorText,
      });

      if (response.status === 401) {
        throw new Error("Clé API invalide");
      } else if (response.status === 404) {
        throw new Error("Base de données non trouvée");
      } else if (response.status === 403) {
        throw new Error("Accès refusé - Vérifiez les permissions de la base");
      } else {
        throw new Error(`Erreur API Notion: ${response.status}`);
      }
    }
    return response.json();
  }

  async validateCredentials(apiKey, databaseId) {
    try {
      console.log("Validation des identifiants...");
      const response = await fetch(
        `${this.API_BASE_URL}/databases/${databaseId}`,
        {
          method: "GET",
          headers: this._getHeaders(apiKey),
          credentials: "omit",
        }
      );

      await this._handleNotionResponse(response);
      console.log("Validation réussie");
      return true;
    } catch (error) {
      console.error("Erreur de validation:", error.message);
      throw error;
    }
  }

  async fetchDatabaseContent(apiKey, databaseId) {
    try {
      console.log("Récupération des données de la base...");
      const response = await fetch(
        `${this.API_BASE_URL}/databases/${databaseId}/query`,
        {
          method: "POST",
          headers: this._getHeaders(apiKey),
          credentials: "omit",
          body: JSON.stringify({
            page_size: 12,
            sorts: [
              {
                property: "Date",
                direction: "descending",
              },
            ],
          }),
        }
      );

      const data = await this._handleNotionResponse(response);
      return this._processNotionResponse(data);
    } catch (error) {
      console.error("Erreur de récupération:", error);
      throw error;
    }
  }

  _processNotionResponse(response) {
    try {
      if (!response.results || !Array.isArray(response.results)) {
        console.error("Format de réponse invalide:", response);
        return [];
      }

      return response.results
        .map((page) => {
          const fileProperty = Object.values(page.properties).find(
            (prop) => prop.type === "files"
          );
          const dateProperty = Object.values(page.properties).find(
            (prop) => prop.type === "date"
          );

          const imageUrl = fileProperty?.files[0]?.file?.url;
          const date = dateProperty?.date?.start;

          if (imageUrl && date) {
            console.log("Page traitée:", { imageUrl, date });
          }

          return {
            imageUrl: imageUrl || null,
            date: date || null,
            pageId: page.id,
          };
        })
        .filter((item) => item.imageUrl && item.date);
    } catch (error) {
      console.error("Erreur lors du traitement des données:", error);
      return [];
    }
  }
}
