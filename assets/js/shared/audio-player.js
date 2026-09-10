/* One player for every activity. Never synthesize or replace the recordings. */
(() => {
  const root = new URL("../../../", document.currentScript.src);
  const player = new Audio();
  let cancel = null;
  function stop() {
    player.pause();
    if (cancel) cancel();
    cancel = null;
  }
  function play(item) {
    stop();
    const message = document.getElementById("audio-status");
    if (message) message.textContent = "";
    player.src = new URL(item.audio, root).href;
    return new Promise((resolve) => {
      let settled = false;
      const done = (ok) => {
        if (settled) return;
        settled = true;
        player.onended = null;
        player.onerror = null;
        cancel = null;
        resolve(ok);
      };
      cancel = () => done(false);
      const fail = (error) => {
        if (settled) return;
        if (message)
          message.textContent =
            error?.name === "NotAllowedError"
              ? "Tap the sound button to hear the recording."
              : "This recording could not play. Check your connection, then tap to retry.";
        done(false);
      };
      player.onended = () => done(true);
      player.onerror = fail;
      player.play().catch(fail);
    });
  }
  Tibetan.audio = { play, stop };
  window.addEventListener("pagehide", stop);
})();
