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
  const darkModeToggle = document.getElementById("dark-mode");

  // Gérer le thème
  function setTheme(isDark) {
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light"
    );
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }

  // Charger le thème sauvegardé
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    darkModeToggle.checked = savedTheme === "dark";
    setTheme(savedTheme === "dark");
  }

  // Écouter les changements
  darkModeToggle.addEventListener("change", (e) => {
    setTheme(e.target.checked);
  });

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

    if (!Array.isArray(images) || images.length === 0) {
      // Message d'information si pas d'images
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "empty-message";
      emptyMessage.textContent = "Aucune image trouvée dans la base de données";
      instagramGrid.appendChild(emptyMessage);
      return;
    }

    // Affichage des images
    images.forEach((image) => {
      const gridItem = document.createElement("div");
      gridItem.className = "grid-item";

      if (image.imageUrl) {
        const imgContainer = document.createElement("div");
        imgContainer.className = "image-container";

        const img = document.createElement("img");
        img.loading = "lazy";
        img.alt = "Preview Instagram";

        // Préchargement de l'image
        const preloadImg = new Image();
        preloadImg.onload = () => {
          img.src = image.imageUrl;
          imgContainer.classList.add("loaded");
        };
        preloadImg.onerror = () => {
          imgContainer.classList.add("error");
        };
        preloadImg.src = image.imageUrl;

        // Badge de date
        const dateElement = document.createElement("div");
        dateElement.className = "date-badge";
        dateElement.textContent = formatDate(image.date);

        imgContainer.appendChild(img);
        gridItem.appendChild(imgContainer);
        gridItem.appendChild(dateElement);
      } else {
        // Placeholder pour les cases vides
        gridItem.classList.add("empty");
      }

      instagramGrid.appendChild(gridItem);
    });

    // Ajouter des cases vides pour compléter la grille 3x4
    const remainingSlots = 12 - images.length;
    for (let i = 0; i < remainingSlots; i++) {
      const emptyItem = document.createElement("div");
      emptyItem.className = "grid-item empty";
      instagramGrid.appendChild(emptyItem);
    }
  }

  function formatDate(dateString) {
    try {
      if (!dateString) return "";

      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        console.error("Date invalide:", dateString);
        return "";
      }

      // Formatage personnalisé pour correspondre à "5 nov" ou "Nov 5"
      return new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "short",
      })
        .format(date)
        .replace(".", ""); // Supprime le point après l'abréviation du mois
    } catch (e) {
      console.error("Erreur de formatage de date:", e);
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
