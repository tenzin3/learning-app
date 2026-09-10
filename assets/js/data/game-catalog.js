/* Games shown on activities.html.
 * Remove an entry to hide a game. Its id also identifies its saved score.
 * subject defaults to "alphabet"; use "number" for the Number section.
 * href defaults to games/<id>.html. Set it explicitly for the shared quiz page.
 */
Tibetan.catalog = [
  {
    id: "hear",
    title: "Hear It → Pick the Letter",
    icon: "◖",
    description: "Listen closely. Find the letter you hear.",
    href: "quiz.html?mode=alphabet",
    tag: "Listening",
  },
  {
    id: "number-quiz",
    title: "Number Quiz",
    subject: "number",
    icon: "༡",
    description: "Listen to a number and choose the matching Tibetan numeral.",
    href: "quiz.html?mode=number",
    tag: "10 questions",
  },
  {
    id: "sound",
    title: "Letter → Pick the Sound",
    icon: "♫",
    description: "See a letter. Listen to the choices and find its sound.",
    tag: "10 questions",
  },
  {
    id: "ordering",
    title: "Alphabet Ordering",
    icon: "↔",
    description: "Put the letters in order, then hear them together.",
    tag: "3 difficulties",
  },
  {
    id: "memory",
    title: "Memory Match",
    icon: "▦",
    description: "Turn over cards. Pair each letter with its recording.",
    tag: "Take your time",
  },
  {
    id: "falling",
    title: "Falling Letters",
    icon: "↓",
    description: "Catch the sound before its letter reaches the bottom.",
    tag: "3 hearts",
  },
  {
    id: "shooting",
    title: "Letter Targets",
    icon: "◎",
    description: "Listen, aim, and tap. Build a combo for extra points.",
    tag: "Combo challenge",
  },
  {
    id: "speed",
    title: "Speed Challenge",
    icon: "◷",
    description: "How many sounds can you recognize in 60 seconds?",
    tag: "60 seconds",
  },
  {
    id: "boss",
    title: "Boss Battle",
    icon: "⚔",
    description: "Use your alphabet skills to defeat three friendly monsters.",
    tag: "3 stages",
  },
];
