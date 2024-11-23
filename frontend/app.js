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
      document.getElementById("prev-btn").disabled = data.page <= 1;
      document.getElementById("next-btn").disabled = data.page >= data.pages;
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
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          api_key: apiKey,
          database_id: databaseId
      })
  })
  .then(response => {
      if (!response.ok) {
          throw new Error("Erreur lors de la sauvegarde de la configuration.");
      }
      return response.json();
  })
  .then(data => {
      console.log("Réponse du serveur :", data);
      alert(data.message || "Configuration sauvegardée !");
      loadPage(1); // Recharge la première page avec la nouvelle configuration
  })
  .catch(error => {
      console.error("Erreur :", error);
      alert("Impossible de sauvegarder la configuration.");
  });
}

// Ajouter un gestionnaire d'événements pour le bouton "Enregistrer"
document.getElementById("save-config-btn").addEventListener("click", () => {
  const apiKey = document.getElementById("api-key-input").value;
  const databaseId = document.getElementById("database-id-input").value;

  if (apiKey && databaseId) {
    saveConfig(apiKey, databaseId);
  } else {
    alert("Veuillez remplir les deux champs avant d'enregistrer.");
  }
});

// Ajouter des événements pour les boutons de navigation
document.getElementById("prev-btn").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    loadPage(currentPage);
  }
});

document.getElementById("next-btn").addEventListener("click", () => {
  currentPage++;
  loadPage(currentPage);
});

// Ajouter un événement pour le bouton Rafraîchir
document.getElementById("refresh-btn").addEventListener("click", () => {
  loadPage(currentPage); // Recharger la page actuelle
});

// Charger la première page au démarrage
loadPage(currentPage);
