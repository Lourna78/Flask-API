import NotionClient from "./notionClient.js";

document.addEventListener("DOMContentLoaded", () => {
  const notionClient = new NotionClient();

  // Éléments du DOM
  const connectionForm = document.getElementById("notion-connection-form");
  const errorMessage = document.getElementById("error-message");
  const connectionScreen = document.getElementById("connection-screen");
  const feedScreen = document.getElementById("feed-screen");
  const instagramGrid = document.getElementById("instagram-grid");
  const refreshBtn = document.getElementById("refresh-btn");
  const loadingMessage = document.getElementById("loading-message");

  const showError = (message) => {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
  };

  const showLoading = () => {
    loadingMessage.classList.add("active");
    errorMessage.textContent = "";
  };

  const hideLoading = () => {
    loadingMessage.classList.remove("active");
  };

  // Gestion de la soumission du formulaire
  connectionForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      showLoading();
      const apiKey = document.getElementById("api-key").value.trim();
      const databaseId = document.getElementById("database-id").value.trim();

      if (!apiKey || !databaseId) {
        throw new Error("Veuillez remplir tous les champs");
      }

      console.log("Tentative de connexion à Notion...");
      const isValid = await notionClient.validateCredentials(
        apiKey,
        databaseId
      );

      if (!isValid) {
        throw new Error(
          "Identifiants Notion invalides. Vérifiez votre clé API et l'ID de la base."
        );
      }

      console.log("Connexion réussie, sauvegarde des credentials...");
      notionClient.saveCredentials(apiKey, databaseId);

      connectionScreen.style.display = "none";
      feedScreen.style.display = "block";

      await loadInstagramFeed();
    } catch (error) {
      console.error("Erreur de connexion:", error);
      showError(error.message);
    } finally {
      hideLoading();
    }
  });

  async function loadInstagramFeed() {
    try {
      const credentials = notionClient.getCredentials();
      if (!credentials) {
        throw new Error("Aucun identifiant trouvé");
      }

      showLoading();
      const { apiKey, databaseId } = credentials;
      const images = await notionClient.fetchDatabaseContent(
        apiKey,
        databaseId
      );

      if (!images || images.length === 0) {
        throw new Error("Aucune image trouvée dans la base de données");
      }

      displayImages(images);
    } catch (error) {
      console.error("Erreur de chargement du feed:", error);
      showError(error.message);

      if (error.message.includes("401") || error.message.includes("403")) {
        notionClient.clearCredentials();
        connectionScreen.style.display = "block";
        feedScreen.style.display = "none";
      }
    } finally {
      hideLoading();
    }
  }

  function displayImages(images) {
    instagramGrid.innerHTML = "";

    images.forEach((image) => {
      const gridItem = document.createElement("div");
      gridItem.classList.add("grid-item");

      const imgElement = document.createElement("img");
      imgElement.src = image.imageUrl;
      imgElement.alt = "Feed Instagram";
      imgElement.onerror = () => {
        imgElement.src = "placeholder.png"; // Image de remplacement en cas d'erreur
      };

      const dateElement = document.createElement("div");
      dateElement.classList.add("date-badge");
      dateElement.textContent = formatDate(image.date);

      gridItem.appendChild(imgElement);
      gridItem.appendChild(dateElement);
      instagramGrid.appendChild(gridItem);
    });

    // Ajout des cases vides
    for (let i = images.length; i < 12; i++) {
      const emptyGridItem = document.createElement("div");
      emptyGridItem.classList.add("grid-item");
      instagramGrid.appendChild(emptyGridItem);
    }
  }

  function formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return "Date invalide";
    }
  }

  // Gestion du bouton de rafraîchissement
  refreshBtn.addEventListener("click", loadInstagramFeed);

  // Vérification initiale des credentials
  const initialCredentials = notionClient.getCredentials();
  if (initialCredentials) {
    connectionScreen.style.display = "none";
    feedScreen.style.display = "block";
    loadInstagramFeed();
  }
});
