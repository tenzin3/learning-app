/* Logic tests use a simulated document and clock; no browser or audio device required. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");
const root = path.resolve(__dirname, "../..");

function setupGame(id) {
  const dom = new JSDOM(
    fs.readFileSync(path.join(root, `games/${id}.html`), "utf8"),
    {
      url: `http://localhost/games/${id}.html`,
      runScripts: "outside-only",
      pretendToBeVisual: true,
    },
  );
  const w = dom.window;
  let now = 0,
    session,
    seed = 25;
  const intervals = new Map();
  let nextTimer = 0;
  w.Math.random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  w.performance.now = () => now;
  w.setInterval = (fn) => {
    intervals.set(++nextTimer, fn);
    return nextTimer;
  };
  w.clearInterval = (id) => intervals.delete(id);
  let player;
  w.Audio = class {
    constructor() {
      player = this;
    }
    pause() {}
    play() {
      return Promise.resolve();
    }
  };
  function load(name) {
    Object.defineProperty(w.document, "currentScript", {
      configurable: true,
      value: { src: `http://localhost/assets/js/${name}.js` },
    });
    w.eval(fs.readFileSync(path.join(root, `assets/js/${name}.js`), "utf8"));
  }
  for (const script of w.document.querySelectorAll("script[src]")) {
    const name = script
      .getAttribute("src")
      .split("assets/js/")[1]
      ?.replace(/\.js$/, "");
    if (name && !name.startsWith("games/")) load(name);
  }
  const original = w.Tibetan.mountGame;
  w.Tibetan.mountGame = (id, rules, start) =>
    original(id, rules, (s) => {
      session = s;
      start(s);
    });
  load(`games/${id}`);
  function clickText(text) {
    const button = [...w.document.querySelectorAll("button")].find(
      (button) => button.textContent === text,
    );
    assert.ok(button, `Button exists: ${text}`);
    button.click();
    return button;
  }
  function advance(ms) {
    for (let remaining = ms; remaining > 0;) {
      const delta = Math.min(50, remaining);
      remaining -= delta;
      now += delta;
      for (const fn of [...intervals.values()]) fn();
    }
  }
  function target() {
    return w.Tibetan.letters.find((item) =>
      player.src?.endsWith(encodeURI(item.audio)),
    );
  }
  function answer(correct = true) {
    const item = target();
    assert.ok(item, "A target recording was requested");
    const buttons = [
      ...w.document.querySelectorAll(".letter-choice,.target"),
    ].filter((button) => !button.disabled);
    const button = buttons.find((button) =>
      correct
        ? button.textContent === item.letter
        : button.textContent !== item.letter,
    );
    assert.ok(button, "A suitable answer exists");
    button.click();
  }
  const api = {
    w,
    load,
    clickText,
    advance,
    target,
    answer,
    get session() {
      return session;
    },
    get player() {
      return player;
    },
    close() {
      session?.dispose();
      dom.window.close();
    },
  };
  clickText("Start activity");
  return api;
}

module.exports = { setupGame };
