/* Browser-local game records, retained even though the Progress page is hidden.
 * Public API: Tibetan.progress.read / record / finish / summary.
 * Keep the storage STORAGE_KEY and record fields stable so existing saved scores still load.
 */
(() => {
  const STORAGE_KEY = "tibetan-learning-progress-v1";
  const createEmptyProgress = () => ({
    xp: 0,
    correct: 0,
    incorrect: 0,
    bestStreak: 0,
    dailyStreak: 0,
    lastDay: "",
    games: {},
    letters: {},
  });
  let memory = createEmptyProgress();
  function read() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (data && typeof data === "object" && !Array.isArray(data)) {
        memory = { ...createEmptyProgress(), ...data };
        for (const field of [
          "xp",
          "correct",
          "incorrect",
          "bestStreak",
          "dailyStreak",
        ]) {
          if (!Number.isFinite(memory[field]) || memory[field] < 0)
            memory[field] = 0;
        }
        for (const field of ["games", "letters"]) {
          if (
            !memory[field] ||
            typeof memory[field] !== "object" ||
            Array.isArray(memory[field])
          )
            memory[field] = {};
        }
      }
    } catch {
      /* Private browsing and damaged storage still allow play. */
    }
    return memory;
  }
  const localDateKey = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  function updateDailyStreak(data) {
    const now = new Date();
    const today = localDateKey(now);
    if (data.lastDay === today) return;
    now.setDate(now.getDate() - 1);
    data.dailyStreak =
      data.lastDay === localDateKey(now) ? data.dailyStreak + 1 : 1;
    data.lastDay = today;
  }
  function saveProgress(data) {
    memory = data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      const status = document.getElementById("storage-status");
      if (status) {
        status.textContent =
          "Progress is available for this visit only because browser storage is unavailable.";
      }
    }
    window.dispatchEvent(new Event("tibetan-progress"));
  }
  function record(id, correct, streak = 0) {
    const data = read();
    updateDailyStreak(data);
    data[correct ? "correct" : "incorrect"]++;
    if (correct) data.xp += 10;
    data.bestStreak = Math.max(data.bestStreak, streak);
    const stats = data.letters[id] || { correct: 0, incorrect: 0 };
    stats[correct ? "correct" : "incorrect"]++;
    data.letters[id] = stats;
    saveProgress(data);
  }
  function finish(game, score, accuracy, completed = true) {
    const data = read();
    updateDailyStreak(data);
    const previous = data.games[game] || { best: 0, stars: 0, plays: 0 };
    const stars = completed ? (accuracy >= 90 ? 3 : accuracy >= 70 ? 2 : 1) : 0;
    data.games[game] = {
      best: Math.max(previous.best, score),
      stars: Math.max(previous.stars, stars),
      plays: previous.plays + 1,
    };
    if (completed) data.xp += 20;
    saveProgress(data);
    return { stars, best: data.games[game].best };
  }
  function summary() {
    const data = read();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const currentStreak = [
      localDateKey(new Date()),
      localDateKey(yesterday),
    ].includes(data.lastDay)
      ? data.dailyStreak
      : 0;
    return {
      ...data,
      dailyStreak: currentStreak,
      level: Math.floor(data.xp / 100) + 1,
      accuracy:
        data.correct + data.incorrect
          ? Math.round((data.correct / (data.correct + data.incorrect)) * 100)
          : 0,
      stars: Object.values(data.games).reduce(
        (sum, game) => sum + game.stars,
        0,
      ),
    };
  }
  Tibetan.progress = { read, record, finish, summary };
})();
