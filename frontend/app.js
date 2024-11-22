let currentPage = 1; // Page actuelle
const limit = 12; // Nombre d'images par page
// Fonction pour rafraîchir la grille
function refreshGrid() {
  fetch("https://flask-api-0qgo.onrender.com/images")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des images.");
      }
      return response.json();
    })
    .then((data) => {
      const grid = document.getElementById("grid");
      grid.innerHTML = ""; // Vider la grille actuelle

      // Ajouter les images triées par date
      data.images.forEach((url) => {
        const div = document.createElement("div");
        div.className = "grid-item";
        div.style.backgroundImage = `url(${url})`;
        grid.appendChild(div);
      });

      // Compléter avec des cases vides si nécessaire
      const totalCases = 12;
      for (let i = data.images.length; i < totalCases; i++) {
        const emptyDiv = document.createElement("div");
        emptyDiv.className = "grid-item empty";
        grid.appendChild(emptyDiv);
      }
    })
    .catch((error) => {
      console.error("Erreur lors de la récupération des données :", error);
    });
}

// Ajouter un événement pour rafraîchir
document.getElementById("refresh-btn").addEventListener("click", refreshGrid);

// Fonction principale pour charger les données et gérer les événements
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

      // Désactiver les boutons si nécessaire
      document.getElementById("prev-btn").disabled = data.page <= 1;
      document.getElementById("next-btn").disabled = data.page >= data.pages;
    })
    .catch((error) => {
      console.error("Erreur lors de la récupération des données :", error);
    });
}

// Événements pour les boutons de navigation
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

// Charger la première page au démarrage
loadPage(currentPage);

// Ajouter un événement pour le bouton de rafraîchissement
document.getElementById("refresh-btn").addEventListener("click", refreshGrid);