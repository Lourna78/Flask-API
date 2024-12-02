// Variables globales
let currentPage = 1; // Page actuelle
const limit = 12; // Nombre d'images par page

console.log("Le script JS fonctionne correctement !");

/**
 * Fonction pour afficher ou masquer un état de chargement sur le bouton "Enregistrer".
 * @param {boolean} isLoading - True pour afficher l'état de chargement, False pour le désactiver.
 */
function toggleLoading(isLoading) {
  const saveConfigBtn = document.getElementById("save-config-btn");
  if (saveConfigBtn) {
    saveConfigBtn.disabled = isLoading;
    saveConfigBtn.textContent = isLoading ? "Chargement..." : "Enregistrer";
  } else {
    console.error("Bouton 'Enregistrer' introuvable.");
  }
}

/**
 * Fonction pour valider et sauvegarder la configuration.
 * @param {string} apiKey - Clé API à valider.
 * @param {string} databaseId - ID de la base à valider.
 */
function validateAndSaveConfig(apiKey, databaseId) {
  const apiKeyInput = document.getElementById("apiKeyField");
  const databaseIdInput = document.getElementById("databaseIdField");

  // Validation des champs
  if (!apiKey || !databaseId) {
    if (!apiKey && apiKeyInput) apiKeyInput.style.border = "1px solid red";
    if (!databaseId && databaseIdInput)
      databaseIdInput.style.border = "1px solid red";
    alert("Veuillez remplir tous les champs.");
    return;
  }

  // Réinitialise les bordures si les champs sont remplis
  if (apiKeyInput) apiKeyInput.style.border = "";
  if (databaseIdInput) databaseIdInput.style.border = "";

  console.log("Validation réussie. Chargement en cours...");
  toggleLoading(true);

  // Charge une seule page d'images après la validation
  loadPage(apiKey, databaseId)
    .then(() => {
      console.log("Données chargées avec succès !");
      hideConfig(apiKey, databaseId); // Masque la configuration après succès
    })
    .catch((error) => {
      console.error("Erreur lors du chargement des données :", error);
      alert("Erreur lors du chargement. Vérifiez votre clé API.");
    })
    .finally(() => {
      toggleLoading(false);
    });
}

/**
 * Fonction pour sauvegarder la configuration utilisateur.
 * @param {string} apiKey - Clé API de l'utilisateur.
 * @param {string} databaseId - ID de la base de données.
 */
function saveConfig(apiKey, databaseId) {
  console.log("saveConfig appelée !");
  console.log("Clé API envoyée :", apiKey);
  console.log("ID de base envoyé :", databaseId);

  // Simule un appel réseau pour sauvegarder les données
  return fetch("/config", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      database_id: databaseId,
    }),
  })
    .then((response) => {
      if (!response.ok) throw new Error("Erreur lors de la sauvegarde.");
      return response.json();
    })
    .catch((error) => {
      console.error("Erreur lors de la sauvegarde :", error);
      throw error;
    });
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
        <label for="apiKeyField">Clé API Notion :</label>
        <input type="text" id="apiKeyField" placeholder="Entrez votre clé API">
        <label for="databaseIdField">ID de la base de données :</label>
        <input type="text" id="databaseIdField" placeholder="Entrez l'ID de la base">
        <button id="save-config-btn" class="btn">Enregistrer</button>
      </form>
    `;

    const saveConfigBtn = document.getElementById("save-config-btn");
    if (saveConfigBtn) {
      saveConfigBtn.addEventListener("click", (event) => {
        event.preventDefault();
        const apiKey = document.getElementById("apiKeyField")?.value.trim();
        const databaseId = document
          .getElementById("databaseIdField")
          ?.value.trim();
        validateAndSaveConfig(apiKey, databaseId);
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
function hideConfig(apiKey, databaseId) {
  const configContainer = document.querySelector(".config-container");
  if (configContainer) {
    configContainer.innerHTML = `
      <h3>Configuration Notion</h3>
      <p>Clé API Notion : ************</p>
      <p>ID de la base de données : ************</p>
      <button id="modify-config-btn" class="btn">Modifier</button>
    `;

    const modifyConfigBtn = document.getElementById("modify-config-btn");
    if (modifyConfigBtn) {
      modifyConfigBtn.addEventListener("click", showConfig);
    }
  }
}

/**
 * Fonction pour charger une seule page d'images.
 * @param {string} apiKey - Clé API pour l'autorisation.
 * @param {string} databaseId - ID de la base à utiliser.
 */
function loadPage(apiKey, databaseId) {
  const grid = document.getElementById("grid");
  if (grid) grid.innerHTML = "<p>Chargement des images...</p>";

  return fetch(
    `https://widget.artyzan-agency.com/images?page=1&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Database-ID": databaseId,
      },
    }
  )
    .then((response) => {
      if (!response.ok)
        throw new Error("Erreur lors de la récupération des données.");
      return response.json();
    })
    .then((data) => {
      if (grid) {
        grid.innerHTML = ""; // Réinitialise la grille
        if (data.images && data.images.length > 0) {
          data.images.forEach((url) => {
            const div = document.createElement("div");
            div.className = "grid-item";
            div.style.backgroundImage = `url(${url})`;
            grid.appendChild(div);
          });
        } else {
          grid.innerHTML = "<p>Aucune image trouvée.</p>";
        }
      }
    })
    .catch((error) => {
      console.error("Erreur lors de la récupération des données :", error);
      if (grid) grid.innerHTML = `<p>Erreur : ${error.message}</p>`;
      throw error;
    });
}

// Initialisation des événements
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM entièrement chargé et analysé.");
  showConfig();
});
