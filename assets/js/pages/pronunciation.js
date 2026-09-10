/* Behavior for practice.html. Page state stays private to this script. */
(() => {
  const alphabetData = Tibetan.letters;

  let currentIndex = 0;
  let correctCount = 0;
  let mediaRecorder = null;
  let audioChunks = [];
  let userRecordingBlob = null;
  let userRecordingUrl = null;
  let audioContext = null;
  let referenceAudioBuffer = null;

  const practiceContainer = document.getElementById("practice-container");
  const resultsContainer = document.getElementById("results");
  const characterDisplay = document.getElementById("character");
  const progressDisplay = document.getElementById("progress");
  const referenceSection = document.getElementById("reference-section");
  const playReferenceBtn = document.getElementById("play-reference");
  const recordBtn = document.getElementById("record-btn");
  const stopBtn = document.getElementById("stop-btn");
  const playRecordingBtn = document.getElementById("play-recording");
  const recordingStatus = document.getElementById("recording-status");
  const autoGradeSection = document.getElementById("auto-grade-section");
  const similarityScore = document.getElementById("similarity-score");
  const gradeResult = document.getElementById("grade-result");
  const nextBtn = document.getElementById("next-btn");
  const correctCountDisplay = document.getElementById("correct-count");
  const restartBtn = document.getElementById("restart-btn");

  function loadCharacter() {
    if (currentIndex >= alphabetData.length) {
      showResults();
      return;
    }

    const item = alphabetData[currentIndex];
    characterDisplay.textContent = item.letter;
    progressDisplay.textContent = currentIndex + 1;

    // Reset recording UI
    resetRecordingUI();
  }

  function playReferenceAudio() {
    const item = alphabetData[currentIndex];
    const audio = new Audio(item.audio);
    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
    });
  }

  function resetRecordingUI() {
    recordBtn.classList.remove("hidden");
    stopBtn.classList.add("hidden");
    playRecordingBtn.classList.add("hidden");
    referenceSection.classList.add("hidden");
    autoGradeSection.classList.add("hidden");
    recordingStatus.textContent = "";
    userRecordingBlob = null;
    referenceAudioBuffer = null;
    if (userRecordingUrl) {
      URL.revokeObjectURL(userRecordingUrl);
      userRecordingUrl = null;
    }
  }

  async function loadReferenceAudio() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const item = alphabetData[currentIndex];
    const response = await fetch(item.audio);
    const arrayBuffer = await response.arrayBuffer();
    referenceAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  }

  async function compareAudioSimilarity(userBlob) {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    const arrayBuffer = await userBlob.arrayBuffer();
    const userAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Compare the two amplitude profiles using the existing formula.
    const referenceData = extractAmplitudeProfile(referenceAudioBuffer);
    const userData = extractAmplitudeProfile(userAudioBuffer);

    // Calculate similarity using cosine similarity
    return calculateCosineSimilarity(referenceData, userData);
  }

  function extractAmplitudeProfile(audioBuffer) {
    const channelData = audioBuffer.getChannelData(0);

    // Preserve the existing amplitude comparison; this does not perform an FFT or recognize speech.
    const profileSize = 1024;
    const amplitudeProfile = new Float32Array(profileSize / 2);

    for (let i = 0; i < amplitudeProfile.length; i++) {
      let sum = 0;
      const step = Math.floor(channelData.length / amplitudeProfile.length);
      for (let j = 0; j < step && i * step + j < channelData.length; j++) {
        sum += Math.abs(channelData[i * step + j]);
      }
      amplitudeProfile[i] = sum / step;
    }

    return amplitudeProfile;
  }

  function calculateCosineSimilarity(arr1, arr2) {
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    const minLength = Math.min(arr1.length, arr2.length);

    for (let i = 0; i < minLength; i++) {
      dotProduct += arr1[i] * arr2[i];
      norm1 += arr1[i] * arr1[i];
      norm2 += arr2[i] * arr2[i];
    }

    norm1 = Math.sqrt(norm1);
    norm2 = Math.sqrt(norm2);

    if (norm1 === 0 || norm2 === 0) return 0;

    return dotProduct / (norm1 * norm2);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        userRecordingBlob = new Blob(audioChunks, { type: "audio/wav" });
        userRecordingUrl = URL.createObjectURL(userRecordingBlob);
        playRecordingBtn.classList.remove("hidden");
        referenceSection.classList.remove("hidden");
        recordingStatus.textContent = "Recording saved! Analyzing...";

        // Load reference audio and compare
        await loadReferenceAudio();
        const similarity = await compareAudioSimilarity(userRecordingBlob);

        // Display results
        const similarityPercent = Math.round(similarity * 100);
        similarityScore.textContent = `Similarity: ${similarityPercent}%`;

        if (similarityPercent >= 50) {
          correctCount++;
          gradeResult.textContent = "✓ Good pronunciation!";
          gradeResult.className =
            "text-center text-xl font-bold mb-3 text-emerald-600";
        } else {
          gradeResult.textContent = "✗ Keep practicing!";
          gradeResult.className =
            "text-center text-xl font-bold mb-3 text-red-600";
        }

        autoGradeSection.classList.remove("hidden");
      };

      mediaRecorder.start();
      recordBtn.classList.add("hidden");
      stopBtn.classList.remove("hidden");
      stopBtn.classList.add("pulse-recording");
      recordingStatus.textContent = "Recording...";
    } catch (error) {
      console.error("Error accessing microphone:", error);
      recordingStatus.textContent = "Error: Microphone access denied";
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }
    stopBtn.classList.remove("pulse-recording");
    stopBtn.classList.add("hidden");
  }

  function playUserRecording() {
    if (userRecordingUrl) {
      const audio = new Audio(userRecordingUrl);
      audio.play().catch((error) => {
        console.error("Error playing recording:", error);
      });
    }
  }

  function nextCharacter() {
    currentIndex++;
    loadCharacter();
  }

  function showResults() {
    practiceContainer.classList.add("hidden");
    resultsContainer.classList.remove("hidden");
    correctCountDisplay.textContent = correctCount;
  }

  function restartPractice() {
    currentIndex = 0;
    correctCount = 0;
    practiceContainer.classList.remove("hidden");
    resultsContainer.classList.add("hidden");
    loadCharacter();
  }

  playReferenceBtn.addEventListener("click", playReferenceAudio);
  recordBtn.addEventListener("click", startRecording);
  stopBtn.addEventListener("click", stopRecording);
  playRecordingBtn.addEventListener("click", playUserRecording);
  nextBtn.addEventListener("click", nextCharacter);
  restartBtn.addEventListener("click", restartPractice);

  loadCharacter();
})();
