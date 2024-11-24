let currentPage = 1; // Page actuelle
const limit = 12; // Nombre d'images par page

// Fonction pour charger une page spécifique
function loadPage(page) {
  fetch(`/images?page=${page}&limit=${limit}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des images.");
      }
      return response.json();
    })
    .then((data) => {
      const grid = document.getElementById("grid");
      if (!grid) {
        console.error("Erreur : élément 'grid' introuvable.");
        return;
      }
      grid.innerHTML = ""; // Vider la grille actuelle

      // Ajouter les images de la page actuelle
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

      // Mettre à jour l'état des boutons de pagination
      const prevBtn = document.getElementById("prev-btn");
      const nextBtn = document.getElementById("next-btn");

      if (prevBtn) prevBtn.disabled = data.page <= 1;
      if (nextBtn) nextBtn.disabled = data.page >= data.pages;
    })
    .catch((error) => {
      console.error("Erreur lors de la récupération des données :", error);
    });
}

// Sauvegarder la configuration
function saveConfig(apiKey, databaseId) {
  fetch('/config', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: apiKey.trim(), // Supprime les espaces éventuels
      database_id: databaseId.trim(),
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde de la configuration.");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Configuration sauvegardée :", data);
      alert(data.message || "Configuration sauvegardée !");
      loadPage(1); // Recharge la première page avec la nouvelle configuration
    })
    .catch((error) => {
      console.error("Erreur :", error);
      alert("Impossible de sauvegarder la configuration.");
    });
}

// Vérification des éléments DOM avant d'ajouter les événements
document.addEventListener("DOMContentLoaded", () => {
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
  document.getElementById("save-config-btn").addEventListener("click", () => {
    alert("Configuration enregistrée. Essayez de recharger la page !");
});

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

  // Charger la première page au démarrage
  loadPage(currentPage);
});

console.log("Fichier JavaScript chargé avec succès.");