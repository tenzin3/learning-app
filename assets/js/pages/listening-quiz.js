/* Behavior for quiz.html. Page state stays private to this script. */
(() => {
  // Both quiz modes use the same data as Learn. The number quiz keeps its original first 10 numbers.
  const alphabets = Tibetan.letters.map((item) => item.letter);
  const numberItems = Tibetan.numbers.slice(0, 10);
  const numbers = numberItems.map((item) => item.numeral);
  const alphabetAudioMap = Object.fromEntries(Tibetan.letters.map(item => [item.letter, item.audio]));
  const numberAudioMap = Object.fromEntries(
    numberItems.map((item) => [item.numeral, item.audio]),
  );
  let streak = 0;
  let resultsSaved = false;

  let currentQuestion = 0;
  let score = 0;
  const totalQuestions = 10;
  let correctAnswer = "";
  let answered = false;
  let shuffledItems = [];
  let quizMode = "alphabet";

  const quizContainer = document.getElementById("quiz-container");
  const resultsContainer = document.getElementById("results");
  const optionsContainer = document.getElementById("options");
  const playAudioBtn = document.getElementById("play-audio");
  const feedback = document.getElementById("feedback");
  const nextBtnContainer = document.getElementById("next-btn-container");
  const nextBtn = document.getElementById("next-btn");
  const finalScore = document.getElementById("final-score");
  const finalTotal = document.getElementById("final-total");
  const percentage = document.getElementById("percentage");
  const restartBtn = document.getElementById("restart-btn");

  function generateOptions(correctValue) {
    const pool = quizMode === "number" ? numbers : alphabets;
    const options = [correctValue];
    const remaining = pool.filter((item) => item !== correctValue);
    const shuffledRemaining = Tibetan.shuffle(remaining);

    while (options.length < 4 && shuffledRemaining.length > 0) {
      options.push(shuffledRemaining.pop());
    }

    return Tibetan.shuffle(options);
  }

  function loadQuestion() {
    if (currentQuestion >= totalQuestions) {
      showResults();
      return;
    }

    answered = false;
    feedback.classList.add("hidden");
    nextBtnContainer.classList.add("hidden");

    correctAnswer = shuffledItems[currentQuestion];
    const options = generateOptions(correctAnswer);

    optionsContainer.innerHTML = "";
    options.forEach((option) => {
      const btn = document.createElement("button");
      btn.className =
        "option-btn bg-gray-100 hover:bg-gray-200 text-2xl md:text-4xl font-bold text-indigo-700 py-6 rounded-xl shadow-md";
      btn.textContent = option;
      btn.addEventListener("click", () => checkAnswer(option, btn));
      optionsContainer.appendChild(btn);
    });

    setTimeout(() => playAudio(), 300);
  }

  function playAudio() {
    let audioPath = "";

    if (quizMode === "number") {
      audioPath = numberAudioMap[correctAnswer] || "";
    } else {
      audioPath = alphabetAudioMap[correctAnswer] || "";
    }

    if (!audioPath) return;

    const audio = new Audio(audioPath);
    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
    });
  }

  function checkAnswer(selected, btn) {
    if (answered) return;
    answered = true;

    // Only alphabet answers contribute to the saved alphabet records.
    if (quizMode === "alphabet") {
      const correct = selected === correctAnswer;
      streak = correct ? streak + 1 : 0;
      const item = Tibetan.letters.find(
        (item) => item.letter === correctAnswer,
      );
      if (item) Tibetan.progress.record(item.id, correct, streak);
    }

    const buttons = optionsContainer.querySelectorAll(".option-btn");
    buttons.forEach((b) => {
      b.disabled = true;
      if (b.textContent === correctAnswer) {
        b.classList.add("correct");
      }
    });

    if (selected === correctAnswer) {
      score++;
      feedback.textContent = "✓ Correct!";
      feedback.className =
        "mt-6 text-center text-xl font-bold text-emerald-600";
    } else {
      btn.classList.add("incorrect");
      feedback.textContent = "✗ Incorrect";
      feedback.className = "mt-6 text-center text-xl font-bold text-red-600";
    }

    feedback.classList.remove("hidden");
    nextBtnContainer.classList.remove("hidden");
  }

  function showResults() {
    if (!resultsSaved && quizMode === "alphabet") {
      Tibetan.progress.finish(
        "hear",
        score,
        Math.round((score / totalQuestions) * 100),
      );
      resultsSaved = true;
    }
    quizContainer.classList.add("hidden");
    resultsContainer.classList.remove("hidden");
    finalScore.textContent = score;
    finalTotal.textContent = totalQuestions;
    const percent = Math.round((score / totalQuestions) * 100);
    percentage.textContent = `${percent}% - ${percent >= 80 ? "Excellent!" : percent >= 60 ? "Good job!" : "Keep practicing!"}`;
  }

  function startQuiz() {
    streak = 0;
    resultsSaved = false;
    currentQuestion = 0;
    score = 0;
    shuffledItems = Tibetan.shuffle(
      quizMode === "number" ? numbers : alphabets,
    ).slice(0, totalQuestions);
    quizContainer.classList.remove("hidden");
    resultsContainer.classList.add("hidden");
    loadQuestion();
  }

  function selectMode(mode) {
    quizMode = mode;
    quizContainer.classList.remove("hidden");
    resultsContainer.classList.add("hidden");
    startQuiz();
  }

  const params = new URLSearchParams(window.location.search);
  const initialMode = params.get("mode");
  if (initialMode === "number") {
    selectMode("number");
  } else {
    selectMode("alphabet");
  }

  playAudioBtn.addEventListener("click", playAudio);
  nextBtn.addEventListener("click", () => {
    currentQuestion++;
    loadQuestion();
  });
  restartBtn.addEventListener("click", () => selectMode(quizMode));
})();
