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
    saveConfigBtn.disabled = isLoading; // Désactive ou réactive le bouton
    saveConfigBtn.textContent = isLoading ? "Chargement..." : "Enregistrer"; // Change le texte du bouton
  } else {
    console.error(
      "Bouton 'Enregistrer' introuvable pour basculer l'état de chargement."
    );
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

  if (!apiKey || !databaseId) {
    // Marque les champs non remplis en rouge
    if (!apiKey || !databaseId) {
      if (!apiKey && apiKeyInput) apiKeyInput.style.border = "1px solid red";
      if (!databaseId && databaseIdInput)
        databaseIdInput.style.border = "1px solid red";
      alert("Veuillez remplir tous les champs."); // Message d'alerte utilisateur
      return;
    }

    // Réinitialise les bordures si les champs sont remplis
    if (apiKeyInput) apiKeyInput.style.border = "";
    if (databaseIdInput) databaseIdInput.style.border = "";

    console.log("Validation réussie. Sauvegarde en cours...");
    toggleLoading(true); // Active l'état de chargement
    saveConfig(apiKey, databaseId)
      .then(() => {
        console.log("Configuration sauvegardée avec succès !");
        alert("Configuration sauvegardée !");
      })
      .catch((error) => {
        console.error("Erreur lors de la sauvegarde :", error);
        alert(`Erreur : ${error.message}`);
      })
      .finally(() => {
        toggleLoading(false); // Désactive l'état de chargement
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
        if (!response.ok)
          throw new Error("Erreur lors de la sauvegarde de la configuration.");
        return response.json();
      })
      .then(() => {
        alert("Configuration sauvegardée !");
        hideConfig(); // Masque la configuration après sauvegarde.
        loadPage(1); // Recharge la première page.

        // Affiche les boutons une fois la configuration réussie
        const buttonContainer = document.querySelector(".button-container");
        if (buttonContainer) {
          console.log("Affichage des boutons après configuration.");
          buttonContainer.classList.remove("hidden");
        } else {
          console.error("Impossible de trouver le conteneur des boutons.");
        }
      })
      .catch((error) => {
        console.error("Erreur lors de la sauvegarde :", error);
        if (grid) {
          grid.innerHTML = `<p>Une erreur est survenue (${error.message}). Veuillez réessayer.</p>`;
        }
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

      // Ajoute l'événement au bouton "Enregistrer".
      const saveConfigBtn = document.getElementById("save-config-btn");
      if (saveConfigBtn) {
        console.log("Bouton 'Enregistrer' détecté.");
        saveConfigBtn.addEventListener("click", () => {
          console.log("Bouton 'Enregistrer' cliqué !");
          const apiKeyField = document.getElementById("apiKeyField")?.value;
          const databaseIdField =
            document.getElementById("databaseIdField")?.value;

          if (apiKeyField && databaseIdField) {
            saveConfig(apiKeyField, databaseIdField);
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
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des images.");
        }
        return response.json();
      })
      .then((data) => {
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

        // **Active ou désactive les boutons de navigation**
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

  // Initialisation des événements
  document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM entièrement chargé et analysé.");

    // Gestion du bouton Enregistrer
    const saveConfigBtn = document.getElementById("save-config-btn");
    if (saveConfigBtn) {
      saveConfigBtn.addEventListener("click", (event) => {
        event.preventDefault(); // Empêche la soumission par défaut
        console.log("Bouton 'Enregistrer' cliqué !");

        const apiKey = document.getElementById("apiKeyField")?.value.trim();
        const databaseId = document
          .getElementById("databaseIdField")
          ?.value.trim();

        validateAndSaveConfig(apiKey, databaseId); // Valide et sauvegarde
      });
    } else {
      console.error("Bouton 'Enregistrer' non trouvé dans le DOM.");
    }

    // Gestion des boutons de navigation (prev, next, refresh)
    const buttons = {
      prev: document.getElementById("prev-btn"),
      next: document.getElementById("next-btn"),
      refresh: document.getElementById("refresh-btn"),
    };

    if (buttons.prev) {
      buttons.prev.addEventListener("click", () => {
        if (currentPage > 1) {
          currentPage--;
          loadPage(currentPage);
        }
      });
    }

    if (buttons.next) {
      buttons.next.addEventListener("click", () => {
        currentPage++;
        loadPage(currentPage);
      });
    }

    if (buttons.refresh) {
      buttons.refresh.addEventListener("click", () => {
        loadPage(currentPage); // Recharge la page actuelle
      });
    }
  });
}
