/* boss: game rules only. Shared controls and results are in shared/game-session.js. */
Tibetan.mountGame(
  "boss",
  "Listen and choose a letter to attack. Correct answers deal 10 damage; wrong answers cost one heart. Beat three monsters with 100, 120, and 150 HP. Each victory restores one heart.",
  (session) => {
    const enemies = [
      { name: "Cloud Sprite", icon: "👾", hp: 100 },
      { name: "Mountain Guardian", icon: "👹", hp: 120 },
      { name: "Snow Dragon", icon: "🐲", hp: 150 },
    ];
    let level = 0,
      hp = enemies[0].hp,
      hearts = 5,
      locked = false;
    const update = () =>
      session.metrics({
        Stage: `${level + 1} / 3`,
        Hearts: "♥".repeat(hearts) || "0",
        Score: session.score,
        Streak: session.streak,
      });
    const next = () => {
      locked = false;
      session.stage.innerHTML = "";
      const enemy = enemies[level];
      const name = document.createElement("h2");
      name.textContent = enemy.name;
      const icon = document.createElement("div");
      icon.className = "boss-emoji";
      icon.textContent = enemy.icon;
      icon.setAttribute("aria-hidden", "true");
      const health = document.createElement("div");
      health.className = "health";
      const label = document.createElement("p");
      label.textContent = `${hp} / ${enemy.hp} HP`;
      const bar = document.createElement("progress");
      bar.max = enemy.hp;
      bar.value = hp;
      bar.setAttribute("aria-label", `${enemy.name} health`);
      health.append(label, bar);
      const target = Tibetan.pick(session.pool);
      session.stage.append(name, icon, health, session.replay(target));
      const grid = session.choices(target, (item, button) => {
        if (locked || session.ended || session.paused) return;
        locked = true;
        const correct = item.id === target.id;
        session.answer(target, correct);
        button.classList.add(correct ? "correct" : "incorrect");
        grid
          .querySelectorAll("button")
          .forEach((button) => (button.disabled = true));
        if (correct) {
          hp = Math.max(0, hp - 10);
          label.textContent = `${hp} / ${enemy.hp} HP`;
          bar.value = hp;
          session.feedback("A strong answer! 10 damage.", "good");
        } else {
          hearts--;
          session.feedback(
            `The sound was ${target.letter}. You lost one heart.`,
            "bad",
          );
        }
        update();
        if (!hearts)
          return session.later(
            () =>
              session.finish("Rest up for another battle!", false, {
                "Monsters defeated": level,
              }),
            700,
          );
        if (hp === 0) {
          if (level === enemies.length - 1)
            return session.later(
              () =>
                session.finish("Alphabet champion!", true, {
                  "Monsters defeated": 3,
                }),
              700,
            );
          session.feedback(
            `${enemy.name} defeated! One heart restored.`,
            "good",
          );
          session.later(() => {
            level++;
            hearts = Math.min(5, hearts + 1);
            hp = enemies[level].hp;
            next();
          }, 1100);
        } else session.later(next, 700);
      });
      Tibetan.audio.play(target);
      update();
    };
    next();
  },
);
