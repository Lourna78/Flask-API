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

      const totalCases = 12; // Nombre total de cases dans la grille

      // Vérifiez si 'data.images' est un tableau avant de continuer
      if (!Array.isArray(data.images)) {
        console.error("Le format des données est invalide :", data);
        alert("Format des données incorrect.");
        return;
      }

      // Ajouter les images récupérées
      data.images.forEach((url) => {
        const div = document.createElement("div");
        div.className = "grid-item";
        div.style.backgroundImage = `url(${url})`;
        grid.appendChild(div);
      });

      // Compléter avec des cases vides si nécessaire
      for (let i = data.images.length; i < totalCases; i++) {
        const emptyDiv = document.createElement("div");
        emptyDiv.className = "grid-item empty";
        emptyDiv.setAttribute("draggable", "true");
        grid.appendChild(emptyDiv);
      }
    })
    .catch((error) => {
      console.error("Erreur lors du rafraîchissement :", error);
      alert("Impossible de rafraîchir les images.");
    });
}

// Fonction principale pour charger les données et gérer les événements
function initializeGrid() {
  fetch("https://flask-api-0qgo.onrender.com/images")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des images.");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Données récupérées :", data);

      const totalCases = 12; // Nombre total de cases dans la grille
      const grid = document.getElementById("grid");

      // Vérifiez si 'data.images' est un tableau avant de continuer
      if (!Array.isArray(data.images)) {
        console.error("Le format des données est invalide :", data);
        alert("Format des données incorrect.");
        return;
      }

      // Ajouter les images récupérées
      grid.innerHTML = ""; // Nettoie la grille existante
      data.images.forEach((url, index) => {
        const div = document.createElement("div");
        div.className = "grid-item";
        div.style.backgroundImage = `url(${url})`;
        grid.appendChild(div);
      });

      // Ajouter des cases vides pour compléter la grille
      for (let i = data.images.length; i < totalCases; i++) {
        const emptyDiv = document.createElement("div");
        emptyDiv.className = "grid-item empty";
        emptyDiv.setAttribute("draggable", "true");
        grid.appendChild(emptyDiv);
      }

      // Gestion des événements drag-and-drop
      grid.addEventListener("dragstart", (e) => {
        if (e.target.classList.contains("grid-item")) {
          e.dataTransfer.setData("text/plain", e.target.dataset.index || "");
          e.target.classList.add("dragging");
        }
      });

      grid.addEventListener("dragover", (e) => {
        e.preventDefault();
        if (e.target.classList.contains("grid-item")) {
          e.target.classList.add("drag-over");
        }
      });

      grid.addEventListener("dragleave", (e) => {
        if (e.target.classList.contains("grid-item")) {
          e.target.classList.remove("drag-over");
        }
      });

      grid.addEventListener("drop", (e) => {
        e.preventDefault();
        const draggedIndex = e.dataTransfer.getData("text/plain");
        const draggedItem = document.querySelector(`[data-index='${draggedIndex}']`);
        const targetItem = e.target;

        if (!draggedItem || !targetItem || !targetItem.classList.contains("grid-item")) {
          console.error("Élément introuvable pendant le drop.");
          return;
        }

        // Échanger les positions des images
        const draggedStyle = draggedItem.style.backgroundImage || "none";
        const targetStyle = targetItem.style.backgroundImage || "none";

        draggedItem.style.backgroundImage = targetStyle;
        targetItem.style.backgroundImage = draggedStyle;

        // Mettre à jour les classes
        if (draggedItem.style.backgroundImage === "none" || draggedItem.style.backgroundImage === "") {
          draggedItem.classList.add("empty");
        } else {
          draggedItem.classList.remove("empty");
        }

        if (targetItem.style.backgroundImage === "none" || targetItem.style.backgroundImage === "") {
          targetItem.classList.add("empty");
        } else {
          targetItem.classList.remove("empty");
        }

        // Retirer les classes d'état
        targetItem.classList.remove("drag-over");
        draggedItem.classList.remove("dragging");
      });
    })
    .catch((error) => {
      console.error("Erreur lors de la récupération des données :", error);
      alert("Impossible de charger les images.");
    });
}

// Lancer l'initialisation au chargement
initializeGrid();

// Ajouter un événement pour le bouton de rafraîchissement
document.getElementById("refresh-btn").addEventListener("click", refreshGrid);
