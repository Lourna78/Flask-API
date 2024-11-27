let currentPage = 1; // Page actuelle
const limit = 12; // Nombre d'images par page

// Fonction pour charger une page spécifique
function loadPage(page) {
  const grid = document.getElementById("grid");
  if (grid) {
    grid.innerHTML = "<p>Chargement du feed...</p>"; // Afficher un message de chargement
  }

  fetch(`/images?page=${page}&limit=${limit}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des images.");
      }
      return response.json();
    })
    .then((data) => {
      if (grid) {
        grid.innerHTML = ""; //  Réinitialise le contenu de la grille pour qu'elle soit vide

        // Ajouter les images
        data.images.forEach((url) => {
          const div = document.createElement("div");
          div.className = "grid-item";
          div.style.backgroundImage = `url(${url})`;
          grid.appendChild(div);
        });

        // Compléter avec des cases vides si nécessaire
        for (let i = data.images.length; i < limit; i++) {
          const emptyDiv = document.createElement("div");
          emptyDiv.className = "grid-item empty";
          grid.appendChild(emptyDiv);
        }
      }

      // Mise à jour des boutons de navigation
      const prevBtn = document.getElementById("prev-btn");
      const nextBtn = document.getElementById("next-btn");

      if (prevBtn) prevBtn.disabled = data.page <= 1;
      if (nextBtn) nextBtn.disabled = data.page >= data.pages;
    })
    .catch((error) => {
      console.error("Erreur lors de la récupération des données :", error);
      if (grid) {
        grid.innerHTML = "<p>Veuillez configurer.</p>";
      }
    });
}

// Fonction pour sauvegarder la configuration
function saveConfig(apiKey, databaseId) {
  const grid = document.getElementById("grid");  // Sélectionne la grille
  if (grid) {
    grid.innerHTML = "<p>Chargement...</p>";  // Indique à l'utilisateur que la sauvegarde est en cours
  }
  return fetch("/config", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey.trim(), // Supprimer les espaces éventuels
      database_id: databaseId.trim(),
    }),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Erreur lors de la sauvegarde de la configuration.");
      return response.json();
    })
    .then(() => {
      alert("Configuration sauvegardée !");
      hideConfig(); // Masque le panneau de configuration après sauvegarde
      loadPage(1); // Charge la première page du widget
    })
    .catch((error) => {
      console.error("Erreur lors de la sauvegarde :", error);
    });
}

// Fonction pour masquer la section Configuration après sauvegarde
function hideConfig() {
  const configContainer = document.querySelector(".config-container");

  if (configContainer) {
    configContainer.innerHTML = `
      <h3>Configuration Notion</h3>
      <p>Clé API Notion : ************</p>
      <p>ID de la base de données : ************</p>
      <button id="modify-config-btn">Modifier</button>
    `;

    // Ajoute l'événement pour le bouton "Modifier"
    const modifyConfigBtn = document.getElementById("modify-config-btn");
    if (modifyConfigBtn) {
      modifyConfigBtn.addEventListener("click", () => {
        showConfig(); // Retourne au panneau initial
      });
    }
  }
}

// Cache la grille (widget) lorsqu'on retourne au panneau de configuration
function resetGrid() {
  const grid = document.getElementById("grid"); // Sélectionne la grille à chaque appel
  if (grid) {
    grid.innerHTML = "<p>Configurez votre widget.</p>";
  } else {
    console.error("Erreur : L'élément 'grid' n'existe pas dans le DOM.");
  }
}

// Fonction pour afficher la configuration initiale
function showConfig() {
  const configContainer = document.querySelector(".config-container");
  const grid = document.getElementById("grid");  // Sélectionne la grille

  if (configContainer) {
    // Réinitialise le contenu du panneau de configuration
    configContainer.innerHTML = `
      <h3>Configuration Notion</h3>
      <label for="api-key-input">Clé API Notion :</label>
      <input type="text" id="api-key-input" placeholder="Entrez votre clé API">
      <label for="database-id-input">ID de la base de données :</label>
      <input type="text" id="database-id-input" placeholder="Entrez l'ID de la base">
      <button id="save-config-btn">Enregistrer</button>
    `;

    // Réinitialise les événements sur le bouton "Enregistrer"
    const saveConfigBtn = document.getElementById("save-config-btn");
    if (saveConfigBtn) {
      saveConfigBtn.addEventListener("click", () => {
        const apiKey = document.getElementById("api-key-input")?.value;
        const databaseId = document.getElementById("database-id-input")?.value;

        if (apiKey && databaseId) {
          saveConfig(apiKey, databaseId);
        } else {
          alert("Veuillez remplir tous les champs");
        }
      });
    }
  }
}

// Initialisation des événements
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("grid");
  const saveConfigBtn = document.getElementById("save-config-btn");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const refreshBtn = document.getElementById("refresh-btn");

  if (saveConfigBtn) {
    saveConfigBtn.addEventListener("click", () => {
      const apiKey = document.getElementById("api-key-input")?.value;
      const databaseId = document.getElementById("database-id-input")?.value;

      if (apiKey && databaseId) {
        saveConfig(apiKey, databaseId);
      } else {
        alert("Veuillez remplir les deux champs avant d'enregistrer.");
      }
    });
  }  

  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        loadPage(currentPage);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      currentPage++;
      loadPage(currentPage);
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      loadPage(currentPage); // Recharger la page actuelle
    });
  }
});

console.log("Fichier JavaScript chargé avec succès.");
