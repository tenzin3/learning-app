/* shooting: game rules only. Shared controls and results are in shared/game-session.js. */
Tibetan.mountGame(
  "shooting",
  "Listen and tap the matching target. Correct hits earn 10 points. A streak of 3 earns ×2; a streak of 5 earns ×3. Wrong hits cost a heart. Make 20 correct hits to win.",
  (session) => {
    let hearts = 3,
      hits = 0,
      target,
      locked = false;
    const multiplier = (streak) => (streak >= 5 ? 3 : streak >= 3 ? 2 : 1);
    const update = () =>
      session.metrics({
        Score: session.score,
        Hearts: "♥".repeat(hearts) || "0",
        Streak: session.streak,
        Combo: `×${multiplier(session.streak)}`,
        Hits: `${hits} / 20`,
      });
    const replay = Tibetan.button(
      "♫ Replay pronunciation",
      () => Tibetan.audio.play(target),
      "button sound",
    );
    const arena = document.createElement("div");
    arena.className = "arena";
    arena.setAttribute("aria-label", "Letter targets");
    session.stage.append(replay, arena);
    const next = () => {
      if (hits >= 20) return session.finish("Sharp listening!");
      locked = false;
      target = Tibetan.pick(session.pool);
      arena.innerHTML = "";
      const positions = Tibetan.shuffle([
        [8, 8],
        [40, 8],
        [72, 8],
        [8, 39],
        [40, 39],
        [72, 39],
        [8, 70],
        [40, 70],
        [72, 70],
      ]);
      Tibetan.choices(target, session.pool, 6).forEach((item, index) => {
        const button = Tibetan.letterButton(
          item,
          () => {
            if (locked || session.ended || session.paused || button.disabled)
              return;
            if (item.id === target.id) {
              locked = true;
              const points = 10 * multiplier(session.streak + 1);
              session.answer(target, true, points);
              hits++;
              button.classList.add("correct");
              session.feedback(`On target! +${points} points`, "good");
              update();
              session.later(next, 500);
            } else {
              session.answer(target, false);
              hearts--;
              button.disabled = true;
              button.classList.add("incorrect");
              session.feedback(
                "That was a different sound. One heart lost. Replay and try again.",
                "bad",
              );
              update();
              if (!hearts)
                session.finish("Keep building your aim!", false, {
                  Hits: hits,
                });
            }
          },
          "target tibetan",
        );
        button.style.left = `${positions[index][0]}%`;
        button.style.top = `${positions[index][1]}%`;
        arena.append(button);
      });
      Tibetan.audio.play(target);
      update();
    };
    next();
  },
);
