// Classe pour gérer l'interaction avec l'API Notion
export default class NotionClient {
  constructor() {
    this.STORAGE_KEY = "notion_credentials";
    this.API_BASE_URL = "https://api.notion.com/v1";
    this.PROXY_URL = "https://cors-anywhere.herokuapp.com/";
    this.NOTION_VERSION = "2022-06-28";
  }

  // Méthode pour construire l'URL avec le proxy
  _buildProxyUrl(endpoint) {
    return `${this.PROXY_URL}${this.API_BASE_URL}${endpoint}`;
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

  // Headers pour l'API Notion
  _getHeaders(apiKey) {
    return {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": this.NOTION_VERSION,
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest", // Requis pour CORS Anywhere
    };
  }

  // Validation des credentials
  async validateCredentials(apiKey, databaseId) {
    try {
      const headers = this._getHeaders(apiKey);
      const proxyUrl = this._buildProxyUrl(`/databases/${databaseId}`);

      console.log("Tentative de connexion via proxy:", proxyUrl);

      const response = await fetch(proxyUrl, {
        method: "GET",
        headers,
        mode: "cors",
      });

      if (!response.ok) {
        console.error("Erreur API:", response.status, response.statusText);
        const errorData = await response.text();
        console.error("Détails de l'erreur:", errorData);
        return false;
      }

      const data = await response.json();
      console.log("Réponse de validation:", data);
      return true;
    } catch (error) {
      console.error("Erreur de validation détaillée:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
      });
      throw new Error("Erreur de connexion à l'API Notion");
    }
  }

  // Récupération des données
  async fetchDatabaseContent(apiKey, databaseId) {
    try {
      const headers = this._getHeaders(apiKey);
      const proxyUrl = this._buildProxyUrl(`/databases/${databaseId}/query`);

      console.log("Récupération des données via proxy:", proxyUrl);

      const response = await fetch(proxyUrl, {
        method: "POST",
        headers,
        mode: "cors",
        body: JSON.stringify({
          page_size: 12,
          sorts: [
            {
              property: "Date",
              direction: "descending",
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return this._processNotionResponse(data);
    } catch (error) {
      console.error("Erreur de récupération:", error);
      throw error;
    }
  }

  _processNotionResponse(response) {
    if (!response.results || !Array.isArray(response.results)) {
      console.error("Format de réponse invalide:", response);
      return [];
    }

    return response.results
      .map((page) => {
        try {
          const fileProperty = Object.values(page.properties).find(
            (prop) => prop.type === "files"
          );
          const dateProperty = Object.values(page.properties).find(
            (prop) => prop.type === "date"
          );

          const imageUrl = fileProperty?.files[0]?.file?.url;
          const date = dateProperty?.date?.start;

          console.log("Traitement de la page:", { imageUrl, date });

          return {
            imageUrl: imageUrl || null,
            date: date || null,
            pageId: page.id,
          };
        } catch (error) {
          console.error("Erreur de traitement de la page:", error);
          return null;
        }
      })
      .filter((item) => item && item.imageUrl && item.date);
  }
}
