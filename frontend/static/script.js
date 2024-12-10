document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("config-form");
  const apiKeyInput = document.getElementById("apiKey");
  const databaseIdInput = document.getElementById("databaseId");
  const errorMsg = document.getElementById("error-msg");

  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // Empêche le rechargement de la page
    const apiKey = apiKeyInput.value.trim();
    const databaseId = databaseIdInput.value.trim();

    if (!apiKey || !databaseId) {
      errorMsg.style.display = "block";
      errorMsg.textContent = "Tous les champs sont obligatoires.";
      return;
    }

    // Test de la connexion avec l'API Notion
    try {
      const response = await fetch(
        "https://api.notion.com/v1/databases/" + databaseId,
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Notion-Version": "2022-06-28",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Connexion impossible. Vérifiez vos informations.");
      }

      // Stocke les données valides dans le localStorage
      localStorage.setItem("apiKey", apiKey);
      localStorage.setItem("databaseId", databaseId);

      // Passe à l'étape suivante (grille de feed)
      document.getElementById("widget-setup").style.display = "none";
      initializeFeedPreview(apiKey, databaseId);
    } catch (error) {
      errorMsg.style.display = "block";
      errorMsg.textContent = error.message;
    }
  });
});

function initializeFeedPreview(apiKey, databaseId) {
  console.log(
    "Connexion réussie avec l'API Key et Database ID :",
    apiKey,
    databaseId
  );
  // Ici, on affichera la grille statique dans une étape suivante
}
