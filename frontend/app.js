let currentPage = 1; // Page actuelle
const limit = 12; // Nombre d'images par page

// Fonction pour charger une page spécifique
function loadPage(page) {
  fetch(`https://flask-api-0qgo.onrender.com/images?page=${page}&limit=${limit}`)
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

document.getElementById("config-form").addEventListener("submit", (e) => {
  e.preventDefault();

  // Récupérer les valeurs du formulaire
  const apiKey = document.getElementById("api-key").value;
  const databaseId = document.getElementById("database-id").value;

  // Enregistrer les valeurs dans le stockage local
  localStorage.setItem("notionApiKey", apiKey);
  localStorage.setItem("notionDatabaseId", databaseId);

  alert("Configuration enregistrée avec succès !");
});

document.getElementById("config-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const apiKey = document.getElementById("api-key").value;
  const databaseId = document.getElementById("database-id").value;

  // Envoi de la configuration à Flask via POST
  fetch("https://widget.artyzan-agency.com/set-config", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      notionApiKey: apiKey,
      databaseId: databaseId,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      alert("Configuration enregistrée : " + data.message);
    })
    .catch((error) => {
      console.error("Erreur lors de l'enregistrement de la configuration :", error);
    });
});

// Ajouter un événement pour le bouton Rafraîchir
document.getElementById("refresh-btn").addEventListener("click", () => {
  loadPage(currentPage); // Recharger la page actuelle
});

// Charger la première page au démarrage
loadPage(currentPage);