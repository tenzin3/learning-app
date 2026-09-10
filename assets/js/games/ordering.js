/* ordering: game rules only. Shared controls and results are in shared/game-session.js. */
Tibetan.mountGame(
  "ordering",
  "Drag letters into alphabet order. Or tap a letter, then tap its destination. Tap a filled position to return its letter. Check your order when you are ready.",
  (session) => {
    const count = [4, 8, 12][session.difficulty];
    const start = Math.floor(Math.random() * (session.pool.length - count + 1));
    const expected = session.pool.slice(start, start + count);
    const shuffled = Tibetan.shuffle(expected),
      slots = Array(count).fill(null);
    let selected = null,
      checks = 0,
      solved = false,
      sequence = 0;
    const bank = document.createElement("div");
    bank.className = "order-bank";
    bank.setAttribute("aria-label", "Letters to arrange");
    const destinations = document.createElement("div");
    destinations.className = "order-slots";
    destinations.setAttribute("aria-label", "Alphabet order");
    const place = (id, index) => {
      if (solved || session.paused || session.ended) return;
      const item = expected.find((item) => item.id === id);
      if (!item) return;
      const old = slots.findIndex((value) => value?.id === id);
      if (old !== -1) slots[old] = slots[index];
      slots[index] = item;
      selected = null;
      render();
    };
    const draggable = (button, item) => {
      button.draggable = true;
      button.addEventListener("dragstart", (event) => {
        event.dataTransfer.setData("text/plain", item.id);
        event.dataTransfer.effectAllowed = "move";
      });
    };
    const render = () => {
      bank.innerHTML = "";
      destinations.innerHTML = "";
      for (const item of shuffled.filter(
        (item) => !slots.some((value) => value?.id === item.id),
      )) {
        const button = Tibetan.letterButton(
          item,
          () => {
            selected = selected === item.id ? null : item.id;
            render();
            bank.querySelector('[aria-pressed="true"]')?.focus();
          },
          "order-tile tibetan",
        );
        button.setAttribute("aria-pressed", selected === item.id);
        draggable(button, item);
        bank.append(button);
      }
      slots.forEach((item, index) => {
        const button = Tibetan.button(
          item ? item.letter : `${index + 1}`,
          () => {
            if (solved) return;
            if (selected) place(selected, index);
            else if (item) {
              slots[index] = null;
              render();
            }
          },
          `order-slot ${item ? "tibetan" : "empty"}`,
        );
        button.setAttribute(
          "aria-label",
          `Position ${index + 1}${item ? ": " + item.letter + ", tap to return" : ", empty"}`,
        );
        if (item) {
          button.lang = "bo";
          draggable(button, item);
        }
        button.addEventListener("dragover", (event) => event.preventDefault());
        button.addEventListener("drop", (event) => {
          event.preventDefault();
          place(event.dataTransfer.getData("text/plain"), index);
        });
        destinations.append(button);
      });
      check.disabled = solved || slots.some((item) => !item);
      session.metrics({
        Letters: count,
        "Order checks": checks,
        Score: session.score,
      });
    };
    const playSequence = async () => {
      const token = ++sequence;
      for (const [index, item] of expected.entries()) {
        if (session.ended || session.paused || token !== sequence) break;
        destinations.children[index]?.classList.add("correct");
        const ok = await Tibetan.audio.play(item);
        if (!ok || session.ended || session.paused || token !== sequence) break;
      }
    };
    const check = Tibetan.button(
      "Check order",
      () => {
        if (solved || slots.some((item) => !item)) return;
        checks++;
        solved = slots.every((item, index) => item.id === expected[index].id);
        if (solved) {
          expected.forEach((item) => session.answer(item, true));
          session.feedback(
            "In the right order! Listen from left to right.",
            "good",
          );
          render();
          const actions = document.createElement("div");
          actions.className = "actions";
          actions.append(
            Tibetan.button("♫ Replay in order", playSequence, "button sound"),
          );
          actions.append(
            Tibetan.button(
              "See results",
              () =>
                session.finish("Alphabet in order!", true, {
                  "Order checks": checks,
                }),
              "button primary",
            ),
          );
          session.stage.append(actions);
          playSequence();
        } else {
          slots.forEach((item, index) => {
            if (item.id !== expected[index].id) session.answer(item, false);
          });
          session.feedback(
            "Not quite. Highlighted letters are in the right place. Move the others and check again.",
            "bad",
          );
          render();
          slots.forEach((item, index) => {
            if (item.id === expected[index].id)
              destinations.children[index].classList.add("correct");
          });
        }
      },
      "button primary",
    );
    const label = document.createElement("p");
    label.textContent = "Alphabet order →";
    label.className = "muted";
    session.stage.append(bank, label, destinations, check);
    render();
  },
);
