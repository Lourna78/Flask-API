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

  // URL par défaut pour l'image placeholder
  const DEFAULT_IMAGE =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNFNUU3RUIiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtc2l6ZT0iMTQiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGFsaWdubWVudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZmlsbD0iIzZCN0NCMCI+SW1hZ2U8L3RleHQ+PC9zdmc+";

  let isLoading = false;

  const showError = (message) => {
    errorMessage.textContent = message;
    errorMessage.style.display = "block";
  };

  const showLoading = () => {
    isLoading = true;
    loadingMessage.classList.add("active");
    errorMessage.textContent = "";
  };

  const hideLoading = () => {
    isLoading = false;
    loadingMessage.classList.remove("active");
  };

  // Gestion de la soumission du formulaire
  connectionForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (isLoading) return;

    try {
      showLoading();
      const apiKey = document.getElementById("api-key").value.trim();
      const databaseId = document.getElementById("database-id").value.trim();

      if (!apiKey || !databaseId) {
        throw new Error("Veuillez remplir tous les champs");
      }

      const isValid = await notionClient.validateCredentials(
        apiKey,
        databaseId
      );
      if (!isValid) {
        throw new Error("Identifiants Notion invalides");
      }

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
    if (isLoading) return;

    try {
      showLoading();
      const credentials = notionClient.getCredentials();
      if (!credentials) {
        throw new Error("Aucun identifiant trouvé");
      }

      const images = await notionClient.fetchDatabaseContent();
      if (!images || images.length === 0) {
        throw new Error("Aucune image trouvée");
      }

      displayImages(images);
    } catch (error) {
      console.error("Erreur de chargement:", error);
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

      const container = document.createElement("div");
      container.classList.add("image-container");

      const img = document.createElement("img");
      img.alt = "Feed Instagram";
      img.loading = "lazy"; // Chargement paresseux

      // Pré-charger l'image pour vérifier si elle est valide
      const testImg = new Image();
      testImg.onload = () => {
        img.src = image.imageUrl;
      };
      testImg.onerror = () => {
        img.src = DEFAULT_IMAGE;
      };
      testImg.src = image.imageUrl;

      const date = document.createElement("div");
      date.classList.add("date-badge");
      date.textContent = formatDate(image.date);

      container.appendChild(img);
      gridItem.appendChild(container);
      gridItem.appendChild(date);
      instagramGrid.appendChild(gridItem);
    });

    // Ajouter des cases vides si nécessaire
    const remainingSlots = 12 - images.length;
    for (let i = 0; i < remainingSlots; i++) {
      const emptyItem = document.createElement("div");
      emptyItem.classList.add("grid-item", "empty");
      instagramGrid.appendChild(emptyItem);
    }
  }

  function formatDate(dateString) {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) throw new Error("Date invalide");

      return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "short",
      }).format(date);
    } catch {
      return "";
    }
  }

  // Éviter les clics multiples rapides
  let refreshTimeout;
  refreshBtn.addEventListener("click", () => {
    if (isLoading) return;
    clearTimeout(refreshTimeout);
    refreshTimeout = setTimeout(loadInstagramFeed, 300);
  });

  // Chargement initial
  const initialCredentials = notionClient.getCredentials();
  if (initialCredentials) {
    connectionScreen.style.display = "none";
    feedScreen.style.display = "block";
    loadInstagramFeed();
  }
});
