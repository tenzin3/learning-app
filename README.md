# Tibetan Learning

A static HTML, CSS, and JavaScript learning app using the **30 original recordings in `alphabets/`**. No generated pronunciation, account, backend, framework, or build step is required.

The existing public site is https://tenzin3.github.io/learning-app/. Local edits must be published separately before they appear there.

## Open the app

Open `activities.html` for the games hub, or `learn.html` for alphabet and number flashcards. All new pages also work directly from disk. For consistent browser storage and a local preview, run `python3 -m http.server 8765` and visit http://localhost:8765/activities.html.

The duplicate `index.html` page has been removed. Use `/learn.html` or `/activities.html` as the entry URL; the site no longer has a default root index page.

The new navigation links from the original pages to Learn and Games. The original alphabet/number quiz and pronunciation recorder remain available.

## Pages and game modules

| Activity | Page | Independent game logic |
| --- | --- | --- |
| Learn all 30 letters and 20 numbers | `learn.html` | `assets/js/pages/learn.js` |
| Games hub | `activities.html` | `assets/js/pages/games.js` |
| Hear It → Pick the Letter (existing) | `quiz.html?mode=alphabet` | Existing inline quiz; `assets/js/legacy-progress.js` adds progress |
| Number Quiz | `quiz.html?mode=number` | Existing inline quiz, listed in the Number section below Alphabet games |
| Letter → Pick the Sound | `games/sound.html` | `assets/js/games/sound.js` |
| Alphabet Ordering | `games/ordering.html` | `assets/js/games/ordering.js` |
| Memory Match | `games/memory.html` | `assets/js/games/memory.js` |
| Falling Letters | `games/falling.html` | `assets/js/games/falling.js` |
| Letter Targets (shooting) | `games/shooting.html` | `assets/js/games/shooting.js` |
| Speed Challenge | `games/speed.html` | `assets/js/games/speed.js` |
| Boss Battle | `games/boss.html` | `assets/js/games/boss.js` |

## Shared files

- `assets/js/data/alphabet.js`: ordered letter data and exact audio filenames.
- `assets/js/data/numbers.js`: number flashcards and their original recording paths.
- `assets/js/data/game-catalog.js`: the list of visible games, their descriptions, and links.
- `assets/js/shared/random.js`: choice and shuffle helpers used by quizzes and games.
- `assets/js/shared/audio-player.js`: one recording player, replay, cancellation, and visible playback errors. It stops old audio before playing another recording.
- `assets/js/shared/saved-progress.js`: local XP, levels, daily streaks, answer counts, accuracy, missed letters, stars, and best scores.
- `assets/js/shared/game-session.js`: session setup, difficulty, scoring hooks, pause/resume, active-time timers, cleanup, and results. Each game calls `Tibetan.mountGame(id, instructions, session => { ... })`.
- `assets/js/shared/navigation.js`: shared navigation links and active-page state.
- `assets/css/site.css`: shared layout, typography, controls, and game styles. Game-specific sections use classes such as `.memory-grid`, `.arena`, and `.order-slots`.

Scripts use a shared `Tibetan` namespace and deferred script tags rather than JavaScript module imports so the static pages can also be opened from disk. New pages have no third-party runtime dependency. The original quiz and pronunciation recorder retain their existing Tailwind CDN dependency.

## Game rules

- **Letter sets:** beginner uses the first 8 letters, intermediate the first 16, and challenge all 30. Changing the set starts a fresh activity. Restart discards the unfinished round; XP already earned remains.
- **Pick the Sound:** 10 letters per round. Replay and select are separate controls. Wrong answers allow retries; previously rejected choices cannot be submitted again for that question.
- **Ordering:** arrange a random consecutive group of 4, 8, or 12 letters. Drag and drop, or tap a letter and then an empty position. Tap a filled position to return its letter to the bank. Every misplaced letter counts as an incorrect answer on a check. Solving awards each letter once and plays its recording in order. Replay the sequence after pausing if needed.
- **Memory:** 4, 6, or 8 letter–sound pairs. Each pair of flips is one move; only letter–sound mismatches count as incorrect answers. Same-type flips still count as moves. Matched sound cards remain replayable. Completion time excludes pauses.
- **Falling:** 3 hearts, 20 correct catches to win, +10 per catch. A wrong catch or missed target costs a heart and 5 points, with a score floor of zero. Each wave includes the target and three distractors. Speed increases with catches.
- **Targets:** 3 hearts and 20 correct hits to win. The third consecutive hit earns 20 points; the fifth and later hits earn 30 points. Wrong hits cost a heart and reset the combo. Targets occupy randomized positions.
- **Speed:** 60 seconds of active play, +10 per correct answer, immediate next question after brief feedback. Results show score, accuracy, correct/incorrect counts, best streak, and missed letters with replay.
- **Boss:** 5 hearts, three enemies with 100, 120, and 150 HP. Every correct answer does 10 damage. A wrong answer costs a heart. Defeating an enemy restores one heart, capped at five.

All new games have manual pause/resume. Switching tabs pauses them automatically; returning requires Resume. Audio stops while paused. The original quiz retains its existing behavior.

## Saved game data

The Progress page, navigation item, hub summary, and XP notices are currently removed from the interface. The shared scoring/storage module remains in place for game results and future restoration; existing saved data is preserved.

Progress is stored under `tibetan-learning-progress-v1` in this browser's local storage. It does not sync across devices, browser profiles, or website origins. Opening from disk may have browser-specific storage behavior. Clearing site data removes progress. If storage is unavailable, play continues and a message explains that progress lasts only for the visit.

- Correct answer: **10 XP**, regardless of the game's score multiplier.
- Completed activity with at least one correct answer: **20 bonus XP**.
- Level increases every **100 XP**.
- Stars: **1** for completing, **2** at 70% accuracy, **3** at 90%. Losing all hearts records a best score but no stars or completion bonus.
- Each activity keeps its best score and highest star count across letter sets. The original quiz scores out of 10; the new games use their own point rules.
- A daily streak counts consecutive local calendar days with an answer or finished round; repeated play on the same day does not increase it.
- Missed-letter counts are attributed to the requested letter, except ordering, which records the letters placed incorrectly.
- The original alphabet quiz participates through a small adapter. Number practice and microphone recordings do not affect alphabet progress.

## Add letters or recordings

1. Add the original audio file to `alphabets/`.
2. Add the letter and display name to `assets/js/data/alphabet.js` in the correct alphabet order. The default audio path is built from the exact letter string, including punctuation. To use other filenames, provide an explicit `audio` path in the mapped record.
3. Keep each `id` stable and unique: saved progress uses it. All new games and Learn read this list automatically. Update the visible alphabet counts in `learn.html` and the game difficulty labels if the total changes.
4. The original quiz and pronunciation recorder retain their independent data lists; update those separately if you want the added letters there too.

## Change, remove, or add a game

To change rules, edit only that game's `assets/js/games/<id>.js`. To hide an activity, remove its entry from `assets/js/data/game-catalog.js`. To remove it entirely, also delete its page and matching script. Other game modules do not import it. Previous saved scores can remain harmlessly in storage.

To add an activity, copy a game HTML shell and add a new independent game script, then register its ID in `data/game-catalog.js`. Load the shared scripts before `shared/game-session.js` and the game script. Use session `answer`, `later`, `tick`, and `finish` helpers so progress, pausing, and cleanup stay consistent.

## Optional automated checks

The site needs no installation to run. The development tests use Node.js and jsdom to simulate game actions and time; they do not perform a real-browser visual or audio-device check.

```sh
npm install --no-save --package-lock=false jsdom@29.1.1
node --test tests/games.test.cjs
```

Tests cover original audio references, unique choices, retries, completed rounds, memory pairs, tap ordering and sequential audio, falling misses, combos, boss progression, 60-second timing, pause, restart, and saved progress.
