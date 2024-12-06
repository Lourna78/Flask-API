let currentPage = 1; // Page actuelle
const limit = 12; // Nombre d'images par page

function showConfig() {
  resetGrid(); // Réinitialise la grille avant d'afficher la configuration
  const configContainer = document.querySelector(".config-container");
  const configSummary = document.getElementById("config-summary");

  if (configContainer) {
    configContainer.style.display = "block"; // Affiche le formulaire de configuration
  }

  if (configSummary) {
    configSummary.style.display = "none"; // Masque le résumé de configuration
  }
}

// Fonction pour sauvegarder la configuration
function saveConfig(apiKey, databaseId) {
  const grid = document.getElementById("grid"); // Sélectionne la grille
  if (grid) {
    grid.innerHTML = "<p>Chargement en cours...</p>"; // Indique à l'utilisateur que la sauvegarde est en cours
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
      if (!response.ok) {
        console.error(
          "Erreur API /config : ",
          response.status,
          response.statusText
        );
        throw new Error("Erreur lors de la sauvegarde de la configuration.");
      }
      console.log("Configuration sauvegardée avec succès.");
      return response.json();
    })
    .then(() => {
      console.log("Chargement de la première page du feed...");
    })
    .then(() => {
      alert("Configuration sauvegardée !");
      hideConfig(); // Appelle hideConfig pour cacher le formulaire
      return loadPage(1); // Charge la première page du widget
    })
    .catch((error) => {
      console.error(
        "Erreur lors de la sauvegarde de la configuration :",
        error
      );
      resetGrid(); // Réinitialise la grille en cas d'échec de la sauvegarde
      if (grid) {
        grid.innerHTML =
          "<p>Impossible de charger le feed. Vérifiez la configuration.</p>";
      }
    });
}

// Fonction pour charger une page spécifique
function loadPage(page) {
  const grid = document.getElementById("grid");
  if (!grid) {
    // Corrigé : Vérifie si 'grid' n'existe pas
    console.error("L'élément 'grid' n'existe pas dans le DOM.");
    return;
  }

  grid.innerHTML = "<p>Chargement du feed...</p>";

  fetch(`/images?page=${page}&limit=${limit}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des images.");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Données reçues de l'API /images :", data);

      grid.innerHTML = ""; // Réinitialiser le contenu

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

      // Mise à jour des boutons de navigation
      const prevBtn = document.getElementById("prev-btn");
      const nextBtn = document.getElementById("next-btn");

      if (prevBtn) prevBtn.disabled = data.page <= 1;
      if (nextBtn) nextBtn.disabled = data.page >= data.pages;
    })
    .catch((error) => {
      console.error("Erreur lors de la récupération des données :", error);
      resetGrid(); // Réinitialise la grille en cas d'échec de chargement
      grid.innerHTML =
        "<p>Erreur lors du chargement du feed. Veuillez vérifier la clé API et/ou l'ID.</p>";
    });
}

// Fonction pour masquer la section Configuration après sauvegarde
function hideConfig() {
  const configContainer = document.querySelector(".config-container");
  console.log("hideConfig appelé :", configContainer); // Vérifie si configContainer est trouvé

  if (configContainer) {
    configContainer.style.display = "none"; // Cache le conteneur principal de configuration
    console.log("Config-container masquée.");

    // Affiche le conteneur masqué avec les valeurs masquées
    const configSummary = document.getElementById("config-summary");
    if (configSummary) {
      configSummary.style.display = "block";
      console.log("Résumé de configuration affiché.");

      const maskedApiKey = document.getElementById("masked-api-key");
      const maskedDatabaseId = document.getElementById("masked-database-id");

      if (maskedApiKey && maskedDatabaseId) {
        maskedApiKey.textContent = "************"; // Placeholder pour la clé API
        maskedDatabaseId.textContent = "************"; // Placeholder pour l'ID de la base
        console.log("Données masquées mises à jour.");
      }
    } else {
      console.error("Erreur : #config-summary n'existe pas dans le DOM.");
    }
  } else {
    console.error("Erreur : .config-container n'existe pas dans le DOM.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const configContainer = document.querySelector(".config-container");
  const configSummary = document.getElementById("config-summary");
  const editConfigBtn = document.getElementById("edit-config-btn"); // Définir ici pour éviter les erreurs

  if (editConfigBtn) {
    editConfigBtn.addEventListener("click", () => {
      console.log("Clic sur 'Modifier'.");

      if (configContainer && configSummary) {
        configContainer.style.display = "block"; // Réaffiche le formulaire de configuration
        console.log("Config-container affichée.");

        configSummary.style.display = "none"; // Masque la zone masquée
        console.log("Résumé masqué.");
      } else {
        console.error("Erreur : Un des conteneurs n'existe pas.");
      }
    });
  } else {
    console.error("Erreur : Bouton 'Modifier' introuvable.");
  }

  // Vérifie que l'état initial est correct
  if (configContainer) {
    configContainer.style.display = "block"; // Par défaut, le formulaire de configuration est visible
    console.log("Config-container affichée par défaut.");
  }

  if (configSummary) {
    configSummary.style.display = "none"; // Par défaut, le résumé est masqué
    console.log("Résumé masqué par défaut.");
  }
});

// Fonction pour afficher la configuration initiale
function showConfig() {
  const configContainer = document.querySelector(".config-container");
  const grid = document.getElementById("grid"); // Sélectionne la grille

  if (configContainer) {
    configContainer.innerHTML = `
      <h3 class="config-title">Configuration Notion</h3>
      <form id="config-form">
        <div>
          <label for="api-key-input" class="config-label">Clé API Notion :</label>
          <input type="text" id="api-key-input" class="config-input" placeholder="API">
        </div>
        <div>
          <label for="database-id-input" class="config-label">ID de la base de données :</label>
          <input type="text" id="database-id-input" class="config-input" placeholder="ID">
        </div>
        <button id="save-config-btn" class="action-btn">Enregistrer</button>
      </form>
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
  const editConfigBtn = document.getElementById("edit-config-btn"); // Ajouté ici

  if (saveConfigBtn) {
    saveConfigBtn.addEventListener("click", () => {
      console.log("Bouton 'Enregistrer' cliqué.");
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
      console.log("Bouton 'Précédent' cliqué.");
      if (currentPage > 1) {
        currentPage--;
        loadPage(currentPage);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      console.log("Bouton 'Suivant' cliqué.");
      currentPage++;
      loadPage(currentPage);
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      console.log("Bouton 'Rafraîchir' cliqué.");
      loadPage(currentPage); // Recharger la page actuelle
    });
  }

  if (editConfigBtn) {
    editConfigBtn.addEventListener("click", () => {
      console.log("Bouton 'Modifier' cliqué.");
      resetGrid(); // Réinitialise la grille
      showConfig(); // Affiche le formulaire de configuration
    });
  }
});

console.log("Fichier JavaScript chargé avec succès.");
