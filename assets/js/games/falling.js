/* falling: game rules only. Shared controls and results are in shared/game-session.js. */
Tibetan.mountGame(
  "falling",
  "Listen, then catch the matching falling letter. A wrong catch or missed target costs a heart. The letters fall faster as you progress. Reach 20 catches to win.",
  (session) => {
    let target,
      hearts = 3,
      caught = 0,
      y = 0,
      readyAt = 0,
      active = false;
    const replay = Tibetan.button(
      "♫ Replay pronunciation",
      () => Tibetan.audio.play(target),
      "button sound",
    );
    const arena = document.createElement("div");
    arena.className = "arena falling";
    session.stage.append(replay, arena);
    const update = () =>
      session.metrics({
        Score: session.score,
        Hearts: "♥".repeat(hearts) || "0",
        Catches: `${caught} / 20`,
        Speed: `${(1 + caught * 0.07).toFixed(1)}×`,
      });
    const lose = () => {
      session.answer(target, false);
      hearts--;
      session.score = Math.max(0, session.score - 5);
      update();
      if (hearts === 0)
        session.finish("Good practice. Try another round!", false, {
          Catches: caught,
        });
    };
    const next = () => {
      if (caught >= 20) return session.finish("You caught every sound!");
      target = Tibetan.pick(session.pool);
      y = 0;
      active = true;
      readyAt = session.elapsed + 1200;
      arena.innerHTML = "";
      const label = document.createElement("span");
      label.className = "arena-label";
      label.textContent = "Catch the matching letter before this line";
      arena.append(label);
      Tibetan.choices(target, session.pool).forEach((item, index) => {
        const button = Tibetan.letterButton(
          item,
          () => {
            if (!active || session.ended || session.paused || button.disabled)
              return;
            if (item.id === target.id) {
              active = false;
              caught++;
              session.answer(target, true);
              update();
              session.feedback("Caught it! +10 points", "good");
              button.classList.add("correct");
              session.later(next, 450);
            } else {
              button.disabled = true;
              button.style.visibility = "hidden";
              session.feedback(
                "Different letter. Listen again. −5 points, −1 heart.",
                "bad",
              );
              lose();
            }
          },
          "target tibetan",
        );
        button.style.left = `${2 + index * 25}%`;
        button.style.top = "0px";
        arena.append(button);
      });
      Tibetan.audio.play(target);
      update();
    };
    session.tick((delta) => {
      if (!active || session.elapsed < readyAt) return;
      // Progress uses actual elapsed time, including delayed frames, and excludes paused time.
      const speed = (session.difficulty + 1) * 6 + 24 + caught * 2.5;
      y += (speed * delta) / 1000;
      const floor = arena.clientHeight - 100;
      arena
        .querySelectorAll(".target")
        .forEach((button) => (button.style.top = `${Math.min(y, floor)}px`));
      if (y >= floor) {
        active = false;
        session.feedback(
          "The target reached the bottom. Listen for the next one.",
          "bad",
        );
        lose();
        if (!session.ended) session.later(next, 650);
      }
    });
    next();
  },
);
