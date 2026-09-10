/* speed: game rules only. Shared controls and results are in shared/game-session.js. */
Tibetan.mountGame(
  "speed",
  "You have 60 seconds. Listen and choose a letter. Every answer brings a new sound. Correct answers earn 10 points. Your results show accuracy, streaks, and sounds to revisit.",
  (session) => {
    const duration = 60000;
    let target,
      locked = false,
      lastSecond = -1;
    const update = () =>
      session.metrics({
        Time: `${Math.max(0, Math.ceil((duration - session.elapsed) / 1000))}s`,
        Score: session.score,
        Streak: session.streak,
      });
    const end = () => session.finish("Time’s up!");
    const next = () => {
      if (session.elapsed >= duration) return end();
      locked = false;
      target = Tibetan.pick(session.pool);
      session.stage.innerHTML = "";
      session.stage.append(session.replay(target));
      const grid = session.choices(target, (item, button) => {
        if (locked || session.ended || session.paused) return;
        if (session.elapsed >= duration) return end();
        locked = true;
        const correct = item.id === target.id;
        session.answer(target, correct);
        button.classList.add(correct ? "correct" : "incorrect");
        grid
          .querySelectorAll("button")
          .forEach((button) => (button.disabled = true));
        session.feedback(
          correct
            ? "Correct! +10 points"
            : `The sound was ${target.letter}. Keep going.`,
          correct ? "good" : "bad",
        );
        update();
        session.later(next, 250);
      });
      Tibetan.audio.play(target);
      update();
    };
    session.tick(() => {
      if (session.elapsed >= duration) return end();
      const second = Math.ceil((duration - session.elapsed) / 1000);
      if (second !== lastSecond) {
        lastSecond = second;
        update();
      }
    });
    next();
  },
);
