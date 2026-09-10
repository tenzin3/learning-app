/* Shared runtime for the seven games in assets/js/games/.
 * mountGame creates the start screen and owns restart/difficulty changes.
 * GameSession owns one round: timers, answers, feedback, pause, and results.
 * Each game supplies its rules through mountGame(id, instructions, startRound).
 */
(() => {
  Tibetan.button = (label, onClick, className = "button") => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  };
  Tibetan.letterButton = (
    item,
    onClick,
    className = "letter-choice tibetan",
  ) => {
    const button = Tibetan.button(item.letter, onClick, className);
    button.lang = "bo";
    return button;
  };
  class GameSession {
    constructor(id, difficulty, restart) {
      this.id = id;
      this.difficulty = difficulty;
      this.restart = restart;
      this.pool = Tibetan.letters.slice(
        0,
        [8, 16, Tibetan.letters.length][difficulty],
      );
      this.score = 0;
      this.correct = 0;
      this.incorrect = 0;
      this.streak = 0;
      this.bestStreak = 0;
      this.misses = new Map();
      this.ended = false;
      this.paused = false;
      this.elapsed = 0;
      this.jobs = [];
      this.tickers = [];
      this.lastTick = performance.now();
      this.stage = document.getElementById("stage");
      this.stage.innerHTML = "";
      this.stats = document.getElementById("stats");
      this.stats.innerHTML = "";
      this.feedback("");
      this.clock = setInterval(() => {
        const now = performance.now();
        const delta = now - this.lastTick;
        this.lastTick = now;
        if (this.paused || this.ended) return;
        this.elapsed += delta;
        const due = this.jobs.filter((job) => job.at <= this.elapsed);
        this.jobs = this.jobs.filter((job) => job.at > this.elapsed);
        for (const job of due) {
          if (!this.ended) job.fn();
        }
        for (const tick of this.tickers) {
          if (!this.ended) tick(delta);
        }
      }, 50);
      this.visibility = () => {
        if (document.hidden && !this.ended) this.pause(true);
      };
      document.addEventListener("visibilitychange", this.visibility);
      this.pauseButton = document.getElementById("pause");
      this.pauseButton.hidden = false;
      this.pauseButton.textContent = "Pause";
      this.pauseButton.onclick = () => this.pause(!this.paused);
    }
    // Schedule work in active game time. Pausing also pauses this delay.
    later(fn, ms = 700) {
      this.jobs.push({ fn, at: this.elapsed + ms });
    }
    // Subscribe to the shared clock; fn receives elapsed milliseconds for this tick.
    tick(fn) {
      this.tickers.push(fn);
    }
    pause(value) {
      if (this.ended) return;
      this.paused = value;
      this.lastTick = performance.now();
      this.stage.inert = value;
      document.getElementById("pause-banner").hidden = !value;
      this.pauseButton.textContent = value ? "Resume" : "Pause";
      if (value) Tibetan.audio.stop();
    }
    metrics(values) {
      this.stats.innerHTML = "";
      for (const [label, value] of Object.entries(values)) {
        const el = document.createElement("div");
        el.className = "metric";
        const strong = document.createElement("strong");
        strong.textContent = value;
        const span = document.createElement("span");
        span.textContent = label;
        el.append(strong, span);
        this.stats.append(el);
      }
    }
    feedback(text, tone = "") {
      const node = document.getElementById("feedback");
      node.textContent = text;
      node.dataset.tone = tone;
    }
    // Update this round and save the answer. A combo can change points, but not XP.
    answer(item, correct, points = 10) {
      if (this.ended || this.paused) return false;
      if (correct) {
        this.correct++;
        this.streak++;
        this.score += points;
        this.bestStreak = Math.max(this.bestStreak, this.streak);
      } else {
        this.incorrect++;
        this.streak = 0;
        this.misses.set(item.id, (this.misses.get(item.id) || 0) + 1);
      }
      Tibetan.progress.record(item.id, correct, this.streak);
      return true;
    }
    replay(item, text = "♫ Replay pronunciation") {
      return Tibetan.button(
        text,
        () => Tibetan.audio.play(item),
        "button sound",
      );
    }
    choices(target, onAnswer, container = this.stage) {
      const choices = document.createElement("div");
      choices.className = "choices";
      for (const item of Tibetan.choices(target, this.pool)) {
        choices.append(
          Tibetan.letterButton(item, (event) =>
            onAnswer(item, event.currentTarget),
          ),
        );
      }
      container.append(choices);
      return choices;
    }
    // Cancel callbacks and audio before replacing a round or leaving the page.
    dispose() {
      clearInterval(this.clock);
      this.jobs = [];
      this.tickers = [];
      document.removeEventListener("visibilitychange", this.visibility);
      Tibetan.audio.stop();
      this.stage.inert = false;
      document.getElementById("pause-banner").hidden = true;
    }
    // Save once, stop the round, and show the same result layout for every game.
    finish(title = "Well done!", completed = true, details = {}) {
      if (this.ended) return;
      this.ended = true;
      this.dispose();
      this.pauseButton.hidden = true;
      const attempts = this.correct + this.incorrect;
      const accuracy = attempts
        ? Math.round((this.correct / attempts) * 100)
        : 0;
      const reward = Tibetan.progress.finish(
        this.id,
        this.score,
        accuracy,
        completed && this.correct > 0,
      );
      this.stage.innerHTML = "";
      this.feedback("");
      const result = document.createElement("div");
      result.className = "result";
      const heading = document.createElement("h2");
      heading.textContent = title;
      heading.tabIndex = -1;
      const stars = document.createElement("div");
      stars.className = "stars";
      stars.textContent =
        "★".repeat(reward.stars) + "☆".repeat(3 - reward.stars);
      stars.setAttribute("aria-label", `${reward.stars} of 3 stars`);
      const score = document.createElement("div");
      score.className = "result-score";
      score.textContent = this.score;
      const caption = document.createElement("p");
      caption.textContent = `Points · Best score: ${reward.best}`;
      result.append(heading, stars, score, caption);
      this.metrics({
        Accuracy: `${accuracy}%`,
        Correct: this.correct,
        Incorrect: this.incorrect,
        "Best streak": this.bestStreak,
        ...details,
      });
      if (this.misses.size) {
        const text = document.createElement("p");
        text.textContent = "A little more practice with these sounds:";
        result.append(text);
        const review = document.createElement("div");
        review.className = "review-letters";
        for (const [id, count] of [...this.misses].sort(
          (a, b) => b[1] - a[1],
        )) {
          const item = Tibetan.letters.find((letter) => letter.id === id);
          const button = Tibetan.letterButton(
            item,
            () => Tibetan.audio.play(item),
            "button tibetan",
          );
          button.title = `${item.name}: ${count} missed. Play recording`;
          review.append(button);
        }
        result.append(review);
      }
      const actions = document.createElement("div");
      actions.className = "actions";
      actions.append(
        Tibetan.button("Play again", this.restart, "button primary"),
      );
      const back = document.createElement("a");
      back.href = "../activities.html#games";
      back.className = "button";
      back.textContent = "Choose an activity";
      actions.append(back);
      result.append(actions);
      this.stage.append(result);
      heading.focus();
    }
  }
  Tibetan.Session = GameSession;
  Tibetan.mountGame = (id, rules, start) => {
    const config = Tibetan.catalog.find((game) => game.id === id);
    document.title = `${config.title} · Tibetan Learning`;
    document.getElementById("game-title").textContent = config.title;
    document.getElementById("game-description").textContent = rules;
    const difficulty = document.getElementById("difficulty");
    const stage = document.getElementById("stage");
    let session;
    const begin = () => {
      session?.dispose();
      session = new GameSession(id, Number(difficulty.value), begin);
      document.getElementById("restart").hidden = false;
      start(session);
    };
    const intro = () => {
      session?.dispose();
      session = null;
      stage.innerHTML = "";
      document.getElementById("stats").innerHTML = "";
      document.getElementById("feedback").textContent = "";
      document.getElementById("pause").hidden = true;
      document.getElementById("restart").hidden = true;
      const icon = document.createElement("div");
      icon.className = "activity-icon";
      icon.style.margin = "10px auto 22px";
      icon.textContent = config.icon;
      const text = document.createElement("p");
      text.className = "instruction";
      text.textContent =
        "Take a moment to turn up your sound. You can replay every recording.";
      stage.append(
        icon,
        text,
        Tibetan.button("Start activity", begin, "button primary"),
      );
    };
    difficulty.addEventListener("change", intro);
    document.getElementById("restart").onclick = begin;
    window.addEventListener("pagehide", () => session?.dispose());
    intro();
  };
})();
