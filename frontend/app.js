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

      // Mettre à jour l'état des boutons
      const prevBtn = document.getElementById("prev-btn");
      const nextBtn = document.getElementById("next-btn");

      prevBtn.disabled = data.page <= 1;
      nextBtn.disabled = data.page >= data.pages;
    })
    .catch((error) => {
      console.error("Erreur lors de la récupération des données :", error);
    });
}

// Écouteurs d'événements pour les boutons
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

document.getElementById("refresh-btn").addEventListener("click", () => {
  loadPage(currentPage); // Recharge la page actuelle
});

// Charger la première page au démarrage
loadPage(currentPage);
