/* Random choices for games and quizzes. Always return a new array. */
Tibetan.shuffle = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
Tibetan.pick = (pool) => pool[Math.floor(Math.random() * pool.length)];
Tibetan.choices = (target, pool, count = 4) =>
  Tibetan.shuffle([
    target,
    ...Tibetan.shuffle(pool.filter((item) => item.id !== target.id)).slice(
      0,
      count - 1,
    ),
  ]);
