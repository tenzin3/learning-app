/* Render the Alphabet and Number sections on activities.html. */
(() => {
  function createGameCard(game, savedResult) {
    const link = document.createElement("a");
    link.className = "activity";
    link.href = game.href || `games/${game.id}.html`;

    const icon = document.createElement("span");
    icon.className = "activity-icon";
    icon.textContent = game.icon;
    icon.setAttribute("aria-hidden", "true");

    const title = document.createElement("h3");
    title.textContent = game.title;
    const description = document.createElement("p");
    description.textContent = game.description;

    const footer = document.createElement("div");
    footer.className = "activity-foot";
    const caption = document.createElement("span");
    caption.textContent = savedResult
      ? `Best: ${savedResult.best} · ${"★".repeat(savedResult.stars) || "Keep practicing"}`
      : game.tag;
    const arrow = document.createElement("b");
    arrow.textContent = "→";
    arrow.setAttribute("aria-hidden", "true");

    footer.append(caption, arrow);
    link.append(icon, title, description, footer);
    return link;
  }

  function renderGameSections() {
    const savedProgress = Tibetan.progress.summary();
    const sections = [
      { subject: "alphabet", gridId: "games-grid" },
      { subject: "number", gridId: "number-games-grid" },
    ];

    for (const { subject, gridId } of sections) {
      const container = document.getElementById(gridId);
      container.innerHTML = "";
      const games = Tibetan.catalog.filter(
        (game) => (game.subject || "alphabet") === subject,
      );
      for (const game of games) {
        container.append(createGameCard(game, savedProgress.games[game.id]));
      }
    }
  }

  window.addEventListener("tibetan-progress", renderGameSections);
  window.addEventListener("storage", renderGameSections);
  renderGameSections();
})();
