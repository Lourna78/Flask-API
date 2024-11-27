let currentPage = 1; // Page actuelle
const limit = 12; // Nombre d'images par page

/**
 * Fonction pour charger une page spécifique.
 * @param {number} page - Numéro de la page à charger.
 */
function loadPage(page) {
  const grid = document.getElementById("grid");
  if (grid) {
    grid.innerHTML = "<p>Chargement du feed...</p>"; // Affiche un message de chargement.
  }

  console.log(`Requête GET : /images?page=${page}&limit=${limit}`);

  fetch(`/images?page=${page}&limit=${limit}`)
    .then((response) => {
      console.log("Réponse reçue pour /images :", response);
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des images.");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Données reçues pour /images :", data);
      if (grid) {
        grid.innerHTML = ""; // Réinitialise la grille.

        // Ajoute les images reçues.
        data.images.forEach((url) => {
          const div = document.createElement("div");
          div.className = "grid-item";
          div.style.backgroundImage = `url(${url})`;
          grid.appendChild(div);
        });

        // Complète avec des cases vides si nécessaire.
        for (let i = data.images.length; i < limit; i++) {
          const emptyDiv = document.createElement("div");
          emptyDiv.className = "grid-item empty";
          grid.appendChild(emptyDiv);
        }
      }

      // Active ou désactive les boutons de navigation en fonction des pages disponibles.
      const prevBtn = document.getElementById("prev-btn");
      const nextBtn = document.getElementById("next-btn");

      console.log(`Pages disponibles : ${data.page}/${data.pages}`); // Log des pages disponibles.

      if (prevBtn) prevBtn.disabled = data.page <= 1;
      if (nextBtn) nextBtn.disabled = data.page >= data.pages;
    })
    .catch((error) => {
      console.error("Erreur lors de la récupération des données :", error);
      if (grid) {
        grid.innerHTML = `<p>Une erreur est survenue (${error.message}). Veuillez réessayer.</p>`;
      }
    });
}

/**
 * Fonction pour sauvegarder la configuration utilisateur.
 * @param {string} apiKey - Clé API de l'utilisateur.
 * @param {string} databaseId - ID de la base de données Notion.
 */
function saveConfig(apiKey, databaseId) {
  console.log("saveConfig appelée !");
  console.log("Clé API envoyée :", apiKey);
  console.log("ID de base envoyé :", databaseId);
  const grid = document.getElementById("grid");
  if (grid) {
    grid.innerHTML = "<p>Chargement...</p>"; // Indique à l'utilisateur que la sauvegarde est en cours.
  }

  return fetch("/config", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey.trim(),
      database_id: databaseId.trim(),
    }),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Erreur lors de la sauvegarde de la configuration.");
      return response.json();
    })
    .then(() => {
      alert("Configuration sauvegardée !");
      hideConfig(); // Masque la configuration après sauvegarde.
      loadPage(1); // Recharge la première page.
    })
    .catch((error) => {
      console.error("Erreur lors de la sauvegarde :", error);
      if (grid) {
        grid.innerHTML = `<p>Une erreur est survenue (${error.message}). Veuillez réessayer.</p>`;
      }
    });
}

/**
 * Fonction pour réinitialiser la grille.
 * Affiche un message demandant de configurer le widget.
 */
function resetGrid() {
  const grid = document.getElementById("grid");
  if (grid) {
    grid.innerHTML = "<p>Configurez votre widget.</p>";
  } else {
    console.error("Erreur : L'élément 'grid' n'existe pas dans le DOM.");
  }
}

/**
 * Fonction pour afficher la configuration initiale.
 */
function showConfig() {
  const configContainer = document.querySelector(".config-container");
  if (configContainer) {
    configContainer.innerHTML = `
      <h3>Configuration Notion</h3>
      <form id="config-form">
        <label for="api-key-input">Clé API Notion :</label>
        <input type="text" id="api-key-input" placeholder="Entrez votre clé API">
        <label for="database-id-input">ID de la base de données :</label>
        <input type="text" id="database-id-input" placeholder="Entrez l'ID de la base">
        <button id="save-config-btn" class="btn">Enregistrer</button>
      </form>
    `;

    // Ajoute l'événement au bouton "Enregistrer".
    const saveConfigBtn = document.getElementById("save-config-btn");
    if (saveConfigBtn) {
      console.log("Bouton 'Enregistrer' détecté.");
      saveConfigBtn.addEventListener("click", () => {
        console.log("Bouton 'Enregistrer' cliqué !");
        const apiKey = document.getElementById("api-key-input")?.value;
        const databaseId = document.getElementById("database-id-input")?.value;

        if (apiKey && databaseId) {
          saveConfig(apiKey, databaseId);
        } else {
          alert("Veuillez remplir tous les champs.");
        }
      });
    }
  } else {
    console.error("Erreur : Impossible de trouver le conteneur de configuration.");
  }
}


/**
 * Fonction pour masquer la configuration après sauvegarde.
 */
function hideConfig() {
  const configContainer = document.querySelector(".config-container");
  if (configContainer) {
    configContainer.innerHTML = `
      <h3>Configuration Notion</h3>
      <p>Clé API Notion : ************</p>
      <p>ID de la base de données : ************</p>
      <button id="modify-config-btn">Modifier</button>
    `;

    // Ajoute l'événement au bouton "Modifier".
    const modifyConfigBtn = document.getElementById("modify-config-btn");
    if (modifyConfigBtn) {
      modifyConfigBtn.addEventListener("click", showConfig);
    }
  }
}

// Initialisation des événements.
document.addEventListener("DOMContentLoaded", () => {
  // Ton code principal ici

  const saveConfigBtn = document.getElementById("save-config-btn");
  if (saveConfigBtn) {
      console.log("Bouton 'Enregistrer' détecté.");
      saveConfigBtn.addEventListener("click", () => {
          console.log("Bouton 'Enregistrer' cliqué !");
          const apiKey = document.getElementById("api-key-input")?.value;
          const databaseId = document.getElementById("database-id-input")?.value;

          if (apiKey && databaseId) {
              saveConfig(apiKey, databaseId); // Appelle la fonction pour sauvegarder la configuration
          } else {
              alert("Veuillez remplir tous les champs.");
          }
      });
  } else {
      console.error("Bouton 'Enregistrer' non trouvé dans le DOM.");
  }

  // Initialisation des autres événements, comme les boutons de navigation
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const refreshBtn = document.getElementById("refresh-btn");

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
          loadPage(currentPage); // Recharge la page actuelle
      });
  }
});
