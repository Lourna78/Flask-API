let currentPage = 1; // Page actuelle
let apiKey = ""; // Clé API de l'utilisateur
let databaseId = ""; // ID de la base Notion
const limit = 12; // Nombre d'images affichées

/**
 * Fonction pour charger une page spécifique.
 * @param {number} page - Numéro de la page à charger.
 */
function loadImages() {
  const grid = document.getElementById("grid");

  // Affiche un état de chargement
  if (grid) grid.innerHTML = "<p>Chargement des images...</p>";

  fetch(`/proxy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey, databaseId }),
  })
    .then((response) => {
      if (!response.ok)
        throw new Error("Erreur lors de la récupération des données.");
      return response.json();
    })
    .then((data) => {
      console.log("Images récupérées :", data);

      // Réinitialise la grille
      grid.innerHTML = "";

      // Parcourt les images et les affiche
      data.results.forEach((item) => {
        const imageUrl =
          item.properties["Fichiers et médias"]?.files[0]?.file?.url;
        if (imageUrl) {
          const div = document.createElement("div");
          div.className = "grid-item";
          div.style.backgroundImage = `url(${imageUrl})`;
          grid.appendChild(div);
        }
      });

      // Complète avec des cases vides
      for (let i = data.results.length; i < limit; i++) {
        const emptyDiv = document.createElement("div");
        emptyDiv.className = "grid-item empty";
        grid.appendChild(emptyDiv);
      }
    })
    .catch((error) => {
      console.error("Erreur :", error);
      if (grid) grid.innerHTML = `<p>Erreur : ${error.message}</p>`;
    });
}

/**
 * Fonction pour sauvegarder la configuration utilisateur.
 * @param {string} apiKey - Clé API de l'utilisateur.
 * @param {string} databaseId - ID de la base de données Notion.
 */
function saveConfig(apiKeyInput, databaseIdInput) {
  apiKey = apiKeyInput.trim();
  databaseId = databaseIdInput.trim();

  if (!apiKey || !databaseId) {
    alert("Veuillez remplir tous les champs !");
    return;
  }

  console.log("Configuration sauvegardée :", { apiKey, databaseId });

  // Appelle la fonction pour charger les images
  loadImages();
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
    console.error(
      "Erreur : Impossible de trouver le conteneur de configuration."
    );
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
  const connectButton = document.getElementById("save-config-btn");

  if (connectButton) {
    connectButton.addEventListener("click", (event) => {
      event.preventDefault();
      const apiKeyInput = document.getElementById("api-key-input").value;
      const databaseIdInput =
        document.getElementById("database-id-input").value;
      saveConfig(apiKeyInput, databaseIdInput);
    });
  } else {
    console.error("Bouton de connexion introuvable !");
  }
});
