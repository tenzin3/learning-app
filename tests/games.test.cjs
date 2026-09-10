/* Logic tests use a simulated document and clock; no browser or audio device required. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const root = path.resolve(__dirname, "..");

const { setupGame } = require("./helpers/game-harness.cjs");

test("all alphabet entries point to original, nonempty WAV files", () => {
  const app = setupGame("speed");
  try {
    assert.equal(app.w.Tibetan.letters.length, 30);
    for (const item of app.w.Tibetan.letters)
      assert.ok(fs.statSync(path.join(root, item.audio)).size > 44);
    for (let i = 0; i < 50; i++) {
      const target = app.w.Tibetan.pick(app.session.pool);
      const options = app.w.Tibetan.choices(target, app.session.pool);
      assert.equal(new Set(options.map((item) => item.id)).size, 4);
      assert.ok(options.includes(target));
    }
  } finally {
    app.close();
  }
});

test("sound practice retries wrong answers, finishes 10 questions and persists once", () => {
  const app = setupGame("sound");
  try {
    for (let round = 0; round < 10; round++) {
      const letter = app.w.document.querySelector(".prompt-letter").textContent;
      let matching;
      for (const card of app.w.document.querySelectorAll(".sound-choice")) {
        card.querySelector("button").click();
        if (app.target().letter === letter)
          matching = card.querySelectorAll("button")[1];
        else if (!round && !app.session.incorrect)
          card.querySelectorAll("button")[1].click();
      }
      matching.click();
      matching.click();
      assert.equal(
        app.session.correct,
        round + 1,
        "Repeated click cannot award twice",
      );
      app.clickText(round === 9 ? "See results" : "Next letter →");
    }
    assert.equal(app.session.ended, true);
    assert.equal(app.session.incorrect, 1);
    assert.equal(app.w.Tibetan.progress.summary().xp, 120);
    assert.equal(app.w.Tibetan.progress.read().games.sound.plays, 1);
    app.session.finish();
    assert.equal(app.w.Tibetan.progress.read().games.sound.plays, 1);
  } finally {
    app.close();
  }
});

test("memory handles same-type flips and mismatches, then retains matches and finishes", () => {
  const app = setupGame("memory");
  try {
    const cards = [...app.w.document.querySelectorAll(".memory-card")];
    const known = new Map();
    for (let i = 0; i < cards.length; i += 2) {
      for (const button of cards.slice(i, i + 2)) {
        button.click();
        const written = button.querySelector(".tibetan");
        known.set(button, {
          type: written ? "letter" : "sound",
          letter: written?.textContent || app.target().letter,
        });
      }
      app.advance(1400);
    }
    for (const [button, item] of known) {
      if (button.classList.contains("matched")) continue;
      const partner = [...known].find(
        ([other, value]) =>
          other !== button &&
          value.letter === item.letter &&
          value.type !== item.type,
      )[0];
      button.click();
      partner.click();
      assert.ok(button.classList.contains("matched"));
      assert.ok(partner.classList.contains("matched"));
    }
    app.advance(850);
    assert.equal(app.session.correct, 4);
    assert.equal(app.session.ended, true);
    assert.equal(app.w.Tibetan.progress.read().games.memory.best, 80);
  } finally {
    app.close();
  }
});

test("ordering supports tap placement, mistakes, checking and sequential original audio", async () => {
  const app = setupGame("ordering");
  try {
    const items = [...app.w.document.querySelectorAll(".order-tile")]
      .map((button) =>
        app.w.Tibetan.letters.find(
          (item) => item.letter === button.textContent,
        ),
      )
      .sort((a, b) => a.order - b.order);
    const arrange = (ordered) =>
      ordered.forEach((item, index) => {
        [...app.w.document.querySelectorAll(".order-tile")]
          .find((button) => button.textContent === item.letter)
          .click();
        app.w.document.querySelectorAll(".order-slot")[index].click();
      });
    arrange([...items].reverse());
    app.clickText("Check order");
    assert.ok(app.session.incorrect > 0);
    assert.equal(app.session.correct, 0);
    for (let i = 0; i < items.length; i++)
      app.w.document.querySelectorAll(".order-slot")[i].click();
    arrange(items);
    app.clickText("Check order");
    for (const item of items) {
      assert.equal(app.target().id, item.id);
      app.player.onended();
      await Promise.resolve();
      await Promise.resolve();
    }
    app.clickText("See results");
    assert.equal(app.session.ended, true);
    assert.equal(app.session.correct, 4);
  } finally {
    app.close();
  }
});

test("falling misses cost hearts, pause freezes motion, 20 catches win", () => {
  const app = setupGame("falling");
  try {
    Object.defineProperty(
      app.w.document.querySelector(".arena"),
      "clientHeight",
      { value: 410 },
    );
    app.clickText("Pause");
    app.advance(30000);
    assert.equal(app.session.elapsed, 0);
    assert.equal(app.session.incorrect, 0);
    app.clickText("Resume");
    app.advance(12000);
    assert.equal(app.session.incorrect, 1);
    app.advance(1000);
    for (let i = 0; i < 20; i++) {
      app.answer();
      app.advance(500);
    }
    assert.equal(app.session.ended, true);
    assert.equal(app.session.correct, 20);
    assert.equal(app.session.score, 200);
  } finally {
    app.close();
  }
});

test("shooting applies exact combo thresholds, resets streak, and ends at zero hearts", () => {
  const app = setupGame("shooting");
  try {
    for (const expected of [10, 20, 40, 60, 90]) {
      app.answer();
      app.advance(550);
      assert.equal(app.session.score, expected);
    }
    app.answer(false);
    assert.equal(app.session.streak, 0);
    app.answer();
    app.advance(550);
    assert.equal(app.session.score, 100);
    app.answer(false);
    app.answer(false);
    assert.equal(app.session.ended, true);
    assert.equal(app.w.Tibetan.progress.read().games.shooting.stars, 0);
  } finally {
    app.close();
  }
});

test("speed stops at 60 active seconds, excludes paused time, and reports misses", () => {
  const app = setupGame("speed");
  try {
    app.answer();
    app.advance(300);
    app.answer(false);
    app.advance(300);
    app.clickText("Pause");
    app.advance(60000);
    assert.equal(app.session.ended, false);
    app.clickText("Resume");
    app.advance(59400);
    assert.equal(app.session.ended, true);
    assert.equal(app.session.correct, 1);
    assert.equal(app.session.incorrect, 1);
    assert.match(app.w.document.getElementById("stats").textContent, /50%/);
    assert.equal(
      app.w.document.querySelectorAll(".review-letters button").length,
      1,
    );
    const xp = app.w.Tibetan.progress.summary().xp;
    app.advance(10000);
    assert.equal(app.w.Tibetan.progress.summary().xp, xp);
  } finally {
    app.close();
  }
});

test("boss advances through 100/120/150 HP and completes only after 37 hits", () => {
  const app = setupGame("boss");
  try {
    for (let i = 0; i < 37; i++) {
      assert.equal(app.session.ended, false);
      app.answer();
      app.advance(1150);
    }
    assert.equal(app.session.ended, true);
    assert.equal(app.session.score, 370);
    assert.match(
      app.w.document.querySelector(".result h2").textContent,
      /champion/,
    );
  } finally {
    app.close();
  }
});

test("restart cancels old timers and difficulty changes return to a fresh start", () => {
  const app = setupGame("speed");
  try {
    const previous = app.session;
    app.advance(1000);
    app.clickText("Restart");
    app.advance(1000);
    assert.equal(previous.elapsed, 1000);
    assert.equal(app.session.elapsed, 1000);
    const select = app.w.document.getElementById("difficulty");
    select.value = "2";
    select.dispatchEvent(new app.w.Event("change"));
    app.advance(100000);
    app.clickText("Start activity");
    assert.equal(app.session.pool.length, 30);
    assert.equal(app.session.score, 0);
  } finally {
    app.close();
  }
});

test("progress survives reload, counts local days once, and tolerates unavailable storage", () => {
  const app = setupGame("speed");
  try {
    app.answer();
    const first = app.w.Tibetan.progress.summary();
    assert.equal(first.dailyStreak, 1);
    app.load("shared/saved-progress");
    assert.equal(app.w.Tibetan.progress.summary().xp, 10);
    app.w.Tibetan.progress.record("ka", true, 2);
    assert.equal(app.w.Tibetan.progress.summary().dailyStreak, 1);
    const stored = app.w.Tibetan.progress.read();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    stored.lastDay = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
    app.w.localStorage.setItem(
      "tibetan-learning-progress-v1",
      JSON.stringify(stored),
    );
    app.w.Tibetan.progress.record("ka", true, 3);
    assert.equal(app.w.Tibetan.progress.summary().dailyStreak, 2);
    Object.defineProperty(app.w, "localStorage", {
      get() {
        throw new Error("blocked");
      },
    });
    app.w.Tibetan.progress.record("ka", true, 4);
    assert.equal(app.w.Tibetan.progress.summary().xp, 40);
    assert.match(
      app.w.document.getElementById("storage-status").textContent,
      /this visit only/,
    );
  } finally {
    app.close();
  }
});

test("playback failures are visible, replay recovers, and changing tabs pauses", async () => {
  const app = setupGame("speed");
  try {
    app.player.play = () =>
      Promise.reject(
        Object.assign(new Error("blocked"), { name: "NotAllowedError" }),
      );
    await app.w.Tibetan.audio.play(app.target());
    assert.match(
      app.w.document.getElementById("audio-status").textContent,
      /Tap the sound button/,
    );
    app.player.play = () => Promise.resolve();
    const pending = app.w.Tibetan.audio.play(app.target());
    assert.equal(app.w.document.getElementById("audio-status").textContent, "");
    app.player.onended();
    assert.equal(await pending, true);
    Object.defineProperty(app.w.document, "hidden", {
      configurable: true,
      value: true,
    });
    app.w.document.dispatchEvent(new app.w.Event("visibilitychange"));
    app.advance(60000);
    assert.equal(app.session.elapsed, 0);
    assert.equal(app.session.paused, true);
  } finally {
    app.close();
  }
});

test("ordering accepts drag/drop and swapping filled slots", () => {
  const app = setupGame("ordering");
  try {
    const tiles = [...app.w.document.querySelectorAll(".order-tile")];
    const letter = tiles[0].textContent;
    const transfer = {
      data: "",
      setData(type, value) {
        this.data = value;
      },
      getData() {
        return this.data;
      },
    };
    const drag = new app.w.Event("dragstart", { bubbles: true });
    Object.defineProperty(drag, "dataTransfer", { value: transfer });
    tiles[0].dispatchEvent(drag);
    const drop = new app.w.Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(drop, "dataTransfer", { value: transfer });
    app.w.document.querySelector(".order-slot").dispatchEvent(drop);
    assert.equal(
      app.w.document.querySelector(".order-slot").textContent,
      letter,
    );
    const next = app.w.document.querySelector(".order-tile");
    const second = next.textContent;
    next.click();
    app.w.document.querySelectorAll(".order-slot")[1].click();
    const dragAgain = new app.w.Event("dragstart", { bubbles: true });
    Object.defineProperty(dragAgain, "dataTransfer", { value: transfer });
    app.w.document.querySelectorAll(".order-slot")[0].dispatchEvent(dragAgain);
    const swap = new app.w.Event("drop", { bubbles: true, cancelable: true });
    Object.defineProperty(swap, "dataTransfer", { value: transfer });
    app.w.document.querySelectorAll(".order-slot")[1].dispatchEvent(swap);
    assert.equal(
      app.w.document.querySelectorAll(".order-slot")[0].textContent,
      second,
    );
    assert.equal(
      app.w.document.querySelectorAll(".order-slot")[1].textContent,
      letter,
    );
  } finally {
    app.close();
  }
});

test("listening quiz saves alphabet scores once and keeps number results separate", () => {
  for (const mode of ["alphabet", "number"]) {
    const dom = new JSDOM(
      fs.readFileSync(path.join(root, "quiz.html"), "utf8"),
      {
        url: `http://localhost/quiz.html?mode=${mode}`,
        runScripts: "outside-only",
      },
    );
    const w = dom.window;
    let audioPath;
    try {
      w.Audio = class {
        constructor(source) {
          audioPath = source;
        }
        play() {
          return Promise.resolve();
        }
      };
      w.setTimeout = () => 0;
      for (const script of w.document.querySelectorAll("script[src]")) {
        const relative = script.getAttribute("src");
        if (relative.startsWith("assets/"))
          w.eval(fs.readFileSync(path.join(root, relative), "utf8"));
      }
      for (let question = 0; question < 10; question++) {
        w.document.getElementById("play-audio").click();
        const item = [...w.Tibetan.letters, ...w.Tibetan.numbers].find(
          (item) => item.audio === audioPath,
        );
        assert.ok(item, "Quiz requests an original recording");
        const answer = [...w.document.querySelectorAll(".option-btn")].find(
          (button) => button.textContent === (item.letter || item.numeral),
        );
        answer.click();
        answer.click();
        w.document.getElementById("next-btn").click();
      }
      assert.equal(w.document.getElementById("final-score").textContent, "10");
      assert.equal(
        w.Tibetan.progress.read().correct,
        mode === "alphabet" ? 10 : 0,
      );
      assert.equal(
        w.Tibetan.progress.read().games.hear?.plays,
        mode === "alphabet" ? 1 : undefined,
      );
      w.document.getElementById("restart-btn").click();
      assert.equal(
        w.document.querySelectorAll(".option-btn:disabled").length,
        0,
      );
      assert.equal(
        w.document.getElementById("results").classList.contains("hidden"),
        true,
      );
    } finally {
      dom.window.close();
    }
  }
});
