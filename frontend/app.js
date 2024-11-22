fetch("https://flask-api-0qgo.onrender.com/images")
  .then((response) => {
    if (!response.ok) {
      throw new Error("Erreur lors de la récupération des images.");
    }
    return response.json();
  })
  .then((data) => {
    console.log("Données récupérées :", data); // Vérifie les données ici

    const totalCases = 12; // Nombre total de cases dans la grille
    const grid = document.getElementById("grid");

    // Ajouter les images récupérées
    data.forEach((url, index) => {
      const div = document.createElement("div");
      div.className = "grid-item";
      div.style.backgroundImage = `url(${url})`; // Appliquer l'image comme fond
      div.setAttribute("draggable", "true"); // Rendre l'élément déplaçable
      div.dataset.index = index; // Stocker l'index
      grid.appendChild(div);
    });

    // Ajouter des cases vides pour compléter la grille
    for (let i = data.length; i < totalCases; i++) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "grid-item empty";
      emptyDiv.setAttribute("draggable", "true"); // Rendre les cases vides déplaçables
      emptyDiv.dataset.index = i; // Stocker un index pour les cases vides
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
      e.preventDefault(); // Permettre le drop
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
        return; // Arrête l'exécution si un des éléments est introuvable
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
