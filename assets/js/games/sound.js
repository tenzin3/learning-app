/* sound: game rules only. Shared controls and results are in shared/game-session.js. */
Tibetan.mountGame(
  "sound",
  "Look at the letter. Play each sound, then choose the matching recording. A wrong answer lets you listen and try again.",
  (session) => {
    let round = 0;
    const next = () => {
      if (round === 10) return session.finish("You found the sounds!");
      round++;
      session.stage.innerHTML = "";
      session.feedback("");
      const target = Tibetan.pick(session.pool);
      const letter = document.createElement("div");
      letter.className = "prompt-letter tibetan";
      letter.lang = "bo";
      letter.textContent = target.letter;
      const grid = document.createElement("div");
      grid.className = "choices";
      let solved = false;
      const update = () =>
        session.metrics({
          Question: `${round} / 10`,
          Score: session.score,
          Streak: session.streak,
        });
      Tibetan.choices(target, session.pool).forEach((item, i) => {
        const card = document.createElement("div");
        card.className = "sound-choice";
        const play = session.replay(
          item,
          `♫ Sound ${String.fromCharCode(65 + i)}`,
        );
        const choose = Tibetan.button(
          `Choose ${String.fromCharCode(65 + i)}`,
          () => {
            if (solved || session.paused || session.ended) return;
            const correct = item.id === target.id;
            session.answer(target, correct);
            update();
            if (correct) {
              solved = true;
              card.classList.add("correct");
              grid
                .querySelectorAll("button")
                .forEach((button) => (button.disabled = true));
              session.feedback("Correct! That is the matching sound.", "good");
              session.stage.append(
                Tibetan.button(
                  round === 10 ? "See results" : "Next letter →",
                  next,
                  "button primary",
                ),
              );
            } else {
              card.classList.add("incorrect");
              choose.disabled = true;
              session.feedback(
                "Not quite. Replay the recordings and try another sound.",
                "bad",
              );
            }
          },
        );
        card.append(play, choose);
        grid.append(card);
      });
      session.stage.append(letter, grid);
      update();
    };
    next();
  },
);
