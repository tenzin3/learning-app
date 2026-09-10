/* Render the alphabet and number flashcards on learn.html. */
(() => {
  function createFlashcard(item, label, container) {
    const card = document.createElement("button");
    card.className = "learn-card";

    const character = document.createElement("span");
    character.className = "tibetan";
    character.lang = "bo";
    character.textContent = item.letter || item.numeral;

    const caption = document.createElement("small");
    caption.textContent = label;
    card.append(character, caption);

    // Number cards also display the Tibetan word for the number.
    if (item.word) {
      const word = document.createElement("small");
      word.lang = "bo";
      word.textContent = item.word;
      card.append(word);
    }

    const playLabel = document.createElement("small");
    playLabel.textContent = "♫ Listen";
    card.append(playLabel);

    card.addEventListener("click", () => {
      container.querySelectorAll("button").forEach(button => {
        button.classList.remove("correct");
      });
      card.classList.add("correct");
      Tibetan.audio.play(item);
    });
    return card;
  }

  const alphabetGrid = document.getElementById("learn-grid");
  for (const letter of Tibetan.letters) {
    alphabetGrid.append(createFlashcard(letter, `${letter.order + 1} · ${letter.name}`, alphabetGrid));
  }

  const numberGrid = document.getElementById("number-grid");
  for (const number of Tibetan.numbers) {
    numberGrid.append(createFlashcard(number, number.phonetic, numberGrid));
  }
})();
