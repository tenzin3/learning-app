/* memory: game rules only. Shared controls and results are in shared/game-session.js. */
Tibetan.mountGame(
  "memory",
  "Turn over two cards. Match a written letter with its sound. Tap a revealed sound card to replay it. Each pair of flips counts as one move.",
  (session) => {
    const count = [4, 6, 8][session.difficulty];
    const selected = Tibetan.shuffle(session.pool).slice(0, count);
    const cards = Tibetan.shuffle(
      selected.flatMap((item) => [
        { item, type: "letter" },
        { item, type: "sound" },
      ]),
    );
    const grid = document.createElement("div");
    grid.className = "memory-grid";
    session.stage.append(grid);
    let open = [],
      moves = 0,
      matched = 0,
      locked = false,
      lastSecond = -1;
    const update = () =>
      session.metrics({
        Pairs: `${matched} / ${count}`,
        Moves: moves,
        Time: `${Math.floor(session.elapsed / 1000)}s`,
      });
    session.tick(() => {
      const sec = Math.floor(session.elapsed / 1000);
      if (sec !== lastSecond) {
        lastSecond = sec;
        update();
      }
    });
    cards.forEach((card, index) => {
      const button = Tibetan.button(
        "?",
        () => {
          if (session.paused || session.ended) return;
          if (card.revealed || card.matched) {
            if (card.type === "sound") Tibetan.audio.play(card.item);
            return;
          }
          if (locked) return;
          card.revealed = true;
          button.classList.add("revealed");
          button.innerHTML = "";
          if (card.type === "letter") {
            const letter = document.createElement("span");
            letter.className = "tibetan";
            letter.lang = "bo";
            letter.textContent = card.item.letter;
            button.append(letter);
            button.setAttribute(
              "aria-label",
              `Letter card ${index + 1}: ${card.item.letter}`,
            );
          } else {
            button.textContent = "♫";
            const small = document.createElement("small");
            small.textContent = "Replay";
            button.append(small);
            button.setAttribute(
              "aria-label",
              `Sound card ${index + 1}, replay recording`,
            );
            Tibetan.audio.play(card.item);
          }
          open.push(card);
          if (open.length !== 2) return;
          moves++;
          locked = true;
          const [a, b] = open;
          const correct = a.item.id === b.item.id && a.type !== b.type;
          if (correct) {
            session.answer(a.item, true, 20);
            matched++;
            for (const item of open) {
              item.matched = true;
              item.button.classList.add("matched");
            }
            session.feedback("A match! Nicely remembered.", "good");
            open = [];
            locked = false;
            if (matched === count)
              session.later(
                () =>
                  session.finish("Every pair found!", true, {
                    Moves: moves,
                    Time: `${Math.floor(session.elapsed / 1000)}s`,
                  }),
                800,
              );
          } else {
            // A letter–sound mismatch is an answer attempt; two cards of the same type are only a move.
            if (a.type !== b.type)
              session.answer((a.type === "letter" ? a : b).item, false);
            session.feedback(
              a.type === b.type
                ? "Look for one letter and one sound."
                : "Different sounds. Remember their places and try again.",
              "bad",
            );
            session.later(() => {
              for (const item of open) {
                item.revealed = false;
                item.button.textContent = "?";
                item.button.classList.remove("revealed");
                item.button.setAttribute(
                  "aria-label",
                  `Face-down card ${item.index + 1}`,
                );
              }
              open = [];
              locked = false;
            }, 1300);
          }
          update();
        },
        "memory-card",
      );
      card.button = button;
      card.index = index;
      button.setAttribute("aria-label", `Face-down card ${index + 1}`);
      grid.append(button);
    });
    update();
  },
);
