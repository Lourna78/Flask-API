document.addEventListener("DOMContentLoaded", () => {
    const feedContainer = document.querySelector(".feed-container");

    // Récupère les images depuis le backend Flask
    fetch("https://flask-api-0qgo.onrender.com/images")
        .then((response) => response.json())
        .then((data) => {
            if (data.error) {
                console.error("Erreur lors de la récupération des images :", data.error);
                feedContainer.innerHTML = `<p>Erreur lors de la récupération des images.</p>`;
            } else {
                // Crée dynamiquement les carrés d'images
                data.forEach((imageUrl) => {
                    const imgDiv = document.createElement("div");
                    imgDiv.style.backgroundImage = `url(${imageUrl})`;
                    imgDiv.style.backgroundSize = "cover";
                    imgDiv.style.backgroundPosition = "center";
                    feedContainer.appendChild(imgDiv);
                });
            }
        })
        .catch((error) => {
            console.error("Erreur réseau :", error);
            feedContainer.innerHTML = `<p>Impossible de charger les images.</p>`;
        });
});
