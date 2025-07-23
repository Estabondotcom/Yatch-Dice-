let pendingCategory = null;
let confirmMode = false;
let gameStarted = false;
let hasRolledThisTurn = false;
let yachtzCount = 0;
let loadingSavedGame = false;
let gameOver = false;

const firebaseConfig = {
  apiKey: "AIzaSyAnPIM8uH5sLkWxPSu_qa-s3ZxZF09BFT0",
  authDomain: "the-yachtz.firebaseapp.com",
  projectId: "the-yachtz",
  storageBucket: "the-yachtz.firebasestorage.app",
  messagingSenderId: "696042753866",
  appId: "1:696042753866:web:54a40aeabae6f156febbb3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let dice = [1, 1, 1, 1, 1];
let locked = [false, false, false, false, false];
let rollsLeft = 3;
let scored = {};

function saveGameState() {
  const state = {
    dice,
    locked,
    scored,
    rollsLeft,
    pendingCategory,
    confirmMode,
    gameStarted,
    hasRolledThisTurn,
    yachtzCount,
    gameOver
  };
  localStorage.setItem("yachtzGame", JSON.stringify(state));
}

function loadGameState() {
  const saved = localStorage.getItem("yachtzGame");
  if (!saved) return;

  loadingSavedGame = true;

  const state = JSON.parse(saved);
  dice = state.dice || [1, 1, 1, 1, 1];
  locked = state.locked || [false, false, false, false, false];
  scored = state.scored || {};
  rollsLeft = state.rollsLeft ?? 3;
  pendingCategory = state.pendingCategory ?? null;
  confirmMode = state.confirmMode ?? false;
  gameStarted = state.gameStarted ?? false;
  hasRolledThisTurn = state.hasRolledThisTurn ?? false;
  yachtzCount = state.yachtzCount ?? 0;
  gameOver = state.gameOver ?? false;

  renderDice();
  updateScorePreviews();

  rollBtn.textContent = gameStarted
    ? confirmMode
      ? "Confirm"
      : `Roll Dice (${rollsLeft} rolls left)`
    : "Start";

  loadingSavedGame = false;
}

function renderDice({ scramble = false } = {}) {
  diceContainer.innerHTML = "";

  dice.forEach((value, i) => {
    const die = document.createElement("div");
    die.className = "die" + (locked[i] ? " locked" : "");

    if (scramble && !locked[i]) {
      die.textContent = Math.ceil(Math.random() * 6);
      die.classList.add("rolling");

      const angle1 = (Math.random() > 0.5 ? 1 : -1) * 10 + "deg";
      const angle2 = (Math.random() > 0.5 ? 1 : -1) * 20 + "deg";
      const angle3 = (Math.random() > 0.5 ? 1 : -1) * 5 + "deg";

      die.style.setProperty("--start-rot", "0deg");
      die.style.setProperty("--mid1-rot", angle1);
      die.style.setProperty("--mid2-rot", angle2);
      die.style.setProperty("--mid3-rot", angle3);
      die.style.setProperty("--end-rot", "0deg");

      let interval = setInterval(() => {
        die.textContent = Math.ceil(Math.random() * 6);
      }, 50);

      setTimeout(() => {
        clearInterval(interval);
        die.textContent = dice[i];
        die.classList.remove("rolling");
      }, 2000);
    } else {
      die.textContent = value;
    }

    die.addEventListener("click", () => {
      if (!confirmMode && gameStarted && hasRolledThisTurn) {
        locked[i] = !locked[i];
        renderDice();
        updateScorePreviews();
        saveGameState();
      }
    });

    diceContainer.appendChild(die);
  });
}

function resetTurn() {
  locked = [false, false, false, false, false];
  rollsLeft = 3;
  hasRolledThisTurn = false;
  confirmMode = false;
  pendingCategory = null;
  rollBtn.textContent = "Roll Dice (3 rolls left)";
  renderDice();
  updateScorePreviews();
  saveGameState();
}

function rollOrConfirm() {
if (!gameStarted) {
  gameStarted = true;
  hasRolledThisTurn = false;
  resetTurn();
  return;
}
  if (confirmMode && pendingCategory) {
    const category = pendingCategory;

    if (category === "yahtzee" && isYahtzee()) {
  const currentScore = scored["yahtzee"];

  // First Yachtz — unscored and rolled 5 of a kind
  if (currentScore === undefined) {
    scored["yahtzee"] = 50;
    yachtzCount = 1;

    const scoreCell = document.getElementById("score-yahtzee");
    scoreCell.textContent = "50";
    scoreCell.className = "filled";

    triggerYachtzCelebration();
  }

  // Bonus Yachtz — already scored with 50+
 else if (currentScore >= 50) {
  yachtzCount++;
  scored["yahtzee"] = currentScore + 100;

  const scoreCell = document.getElementById("score-yahtzee");
  scoreCell.textContent = scored["yahtzee"];
  scoreCell.className = "filled";

  triggerYachtzCelebration();
}

  // Yachtz was zeroed out before — lock it as zero
  else if (currentScore === 0) {
    const scoreCell = document.getElementById("score-yahtzee");
    scoreCell.className = "filled-zero";
  }
}
    else {
      const score = parseInt(document.getElementById("score-" + category).textContent, 10);
      scored[category] = score;

      const scoreCell = document.getElementById("score-" + category);
      scoreCell.className = score === 0 ? "filled-zero" : "filled";
    }

    const upperCategories = ["ones", "twos", "threes", "fours", "fives", "sixes"];
    const upperTotal = upperCategories.reduce((sum, key) => sum + (scored[key] || 0), 0);
    document.getElementById("upper-subtotal").textContent = upperTotal;
    const bonus = upperTotal >= 63 ? 35 : 0;
    document.getElementById("upper-bonus").textContent = bonus;

    const total = Object.values(scored).reduce((a, b) => a + b, 0) + bonus;
    document.getElementById("total-score").textContent = total;

    pendingCategory = null;
    confirmMode = false;
    resetTurn();
    checkEndGame();
    saveGameState();
    return;
  }

  if (rollsLeft <= 0) return;

hasRolledThisTurn = true;

// Roll new dice values first
dice = dice.map((val, i) => (locked[i] ? val : Math.ceil(Math.random() * 6)));
rollsLeft--;
rollBtn.textContent = `Roll Dice (${rollsLeft} rolls left)`;

// Show scramble animation
renderDice({ scramble: true });

// Delay score preview update until scramble ends
setTimeout(() => {
  updateScorePreviews();
  saveGameState();

  // ✅ Bonus Yahtzee end check
  const allCats = [
    "ones", "twos", "threes", "fours", "fives", "sixes",
    "threeKind", "fourKind", "fullHouse", "smallStraight",
    "largeStraight", "yahtzee", "chance"
  ];
  const filledCount = allCats.filter(cat => scored[cat] !== undefined).length;

  if (!confirmMode && filledCount === 13 && scored["yahtzee"] >= 50 && !isYahtzee()) {
    gameOver = true;
    const total = calculateFinalScore();
    showGameCompleteBanner(total);
    saveGameState();
  }

}, 3000); // ← inside the timeout after renderDice()
}

function calculateUpperScore(n) {
  return dice.filter(d => d === n).reduce((a, b) => a + b, 0);
}
function countOccurrences() {
  return dice.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
}
function hasNOfAKind(n) {
  return Object.values(countOccurrences()).some(count => count >= n);
}
function isFullHouse() {
  const counts = Object.values(countOccurrences()).sort();
  return counts.length === 2 && counts[0] === 2 && counts[1] === 3;
}
function isSmallStraight() {
  const unique = [...new Set(dice)].sort();
  const straights = [[1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 6]];
  return straights.some(seq => seq.every(n => unique.includes(n)));
}
function isLargeStraight() {
  const sorted = [...new Set(dice)].sort().join(",");
  return sorted === "1,2,3,4,5" || sorted === "2,3,4,5,6";
}
function isYahtzee() {
  return Object.values(countOccurrences()).some(count => count === 5);
}
function sumAllDice() {
  return dice.reduce((a, b) => a + b, 0);
}
function calculateScoreForCategory(category) {
  switch (category) {
    case "ones": return calculateUpperScore(1);
    case "twos": return calculateUpperScore(2);
    case "threes": return calculateUpperScore(3);
    case "fours": return calculateUpperScore(4);
    case "fives": return calculateUpperScore(5);
    case "sixes": return calculateUpperScore(6);
    case "threeKind": return hasNOfAKind(3) ? sumAllDice() : 0;
    case "fourKind": return hasNOfAKind(4) ? sumAllDice() : 0;
    case "fullHouse": return isFullHouse() ? 25 : 0;
    case "smallStraight": return isSmallStraight() ? 30 : 0;
    case "largeStraight": return isLargeStraight() ? 40 : 0;
    case "yahtzee": return isYahtzee() ? 50 : 0;
    case "chance": return sumAllDice();
    default: return 0;
  }
}

scorecard.addEventListener("click", (e) => {
  if (!gameStarted || !hasRolledThisTurn) return;

  const row = e.target.closest("tr");
  if (!row) return;
  const labelCell = row.querySelector(".scorable");
  if (!labelCell) return;

  const category = labelCell.dataset.category;

  // Prevent selecting already scored cells — except bonus yahtzee
  if (scored[category] !== undefined) {
    const isBonusYachtz = (
      category === "yahtzee" &&
      scored["yahtzee"] >= 50 &&
      isYahtzee()
    );

    if (!isBonusYachtz) return;
  }

  // Cancel current selection if clicking same cell again
  if (pendingCategory === category) {
    const scoreCell = document.getElementById("score-" + category);
    const previewScore = calculateScoreForCategory(category);
    scoreCell.textContent = (previewScore === 0) ? "0" : previewScore;
    scoreCell.className = "preview";
    pendingCategory = null;
    confirmMode = false;
    rollBtn.textContent = `Roll Dice (${rollsLeft} rolls left)`;
    saveGameState();
    return;
  }

  // Clear previous selected cell, if any
  if (pendingCategory) {
    const prevCell = document.getElementById("score-" + pendingCategory);
    if (prevCell) {
      const prevScore = calculateScoreForCategory(pendingCategory);
      prevCell.textContent = (prevScore === 0) ? "0" : prevScore;
      prevCell.className = "preview";
    }
  }

  // Set new selection
  let score = calculateScoreForCategory(category);

  // Bonus yahtzee override
  if (category === "yahtzee" && scored["yahtzee"] >= 50 && isYahtzee()) {
    score = scored["yahtzee"] + 100;
  }

  const scoreCell = document.getElementById("score-" + category);
  scoreCell.textContent = score;
  scoreCell.className = "preview selected";

  pendingCategory = category;
  confirmMode = true;
  rollBtn.textContent = "Confirm";
  saveGameState();
});

function updateScorePreviews() {
  if (!gameStarted) return;
  document.querySelectorAll(".scorable").forEach((cell) => {
    const cat = cell.dataset.category;
    const sc = document.getElementById("score-" + cat);
    if (scored[cat] !== undefined) {
      const val = scored[cat];
      sc.textContent = val;
      sc.className = val === 0 ? "filled-zero" : "filled";
    } else {
      sc.textContent = calculateScoreForCategory(cat);
      sc.className = "preview";
    }
  });
}

function checkEndGame() {
  if (loadingSavedGame) return;

  const allCats = [
    "ones", "twos", "threes", "fours", "fives", "sixes",
    "threeKind", "fourKind", "fullHouse", "smallStraight",
    "largeStraight", "yahtzee", "chance"
  ];

  const filledCats = allCats.filter(cat => scored[cat] !== undefined);
  const filledCount = filledCats.length;
  const yahtzeeScore = scored["yahtzee"];

  const allButYachtzFilled = filledCount === 12 && yahtzeeScore === undefined;
  const allFilled = filledCount === 13;
  const yachtzWasZero = yahtzeeScore === 0;

  // ✅ ⛔️ Do not end the game yet if Yahtzee is the only one left and unscored
  if (allButYachtzFilled) {
    return; // Player still has a chance to roll a Yahtzee
  }

  // 🎯 Case 1: All 13 filled and yahtzee was 0
  if (allFilled && yachtzWasZero) {
    gameOver = true;
    const total = calculateFinalScore();
    showGameCompleteBanner(total);
    return;
  }

  // 🎯 Case 2: All 13 filled and yahtzee >= 50
  if (allFilled && yahtzeeScore >= 50) {
  // Do nothing here. Let the game wait for the next roll
  return;
}

  // 🎯 Case 3: Only yahtzee left, and player rolled a yahtzee (score it as 50)
  if (filledCount === 12 && isYahtzee()) {
    scored["yahtzee"] = 50;
    yachtzCount = 1;

    const scoreCell = document.getElementById("score-yahtzee");
    scoreCell.textContent = "50";
    scoreCell.className = "filled";

    document.getElementById("total-score").textContent = calculateFinalScore();
    triggerYachtzCelebration();
    saveGameState();
    resetTurn();
    return;
  }

  // 🎯 Case 4: Only yahtzee left, but player did NOT roll one → game ends
  if (filledCount === 12 && !isYahtzee()) {
    scored["yahtzee"] = 0;

    const scoreCell = document.getElementById("score-yahtzee");
    scoreCell.textContent = "0";
    scoreCell.className = "filled-zero";

    document.getElementById("total-score").textContent = calculateFinalScore();
    gameOver = true;
    showGameCompleteBanner(calculateFinalScore());
    return;
  }
}

function showGameCompleteBanner(score) {
  const banner = document.getElementById("game-complete-banner");
  const scoreText = document.getElementById("final-score-text");

  if (banner && scoreText) {
    scoreText.textContent = score;
    banner.style.display = "block"; // ← force visibility
    banner.classList.add("show");
  }

  // 🎊 Confetti!
  confetti({
    particleCount: 150,
    spread: 90,
    origin: { y: 0.6 }
  });
}
function calculateFinalScore() {
  const upper = ["ones", "twos", "threes", "fours", "fives", "sixes"];
  const upperTotal = upper.reduce((sum, cat) => sum + (scored[cat] || 0), 0);
  const bonus = upperTotal >= 63 ? 35 : 0;
  return Object.values(scored).reduce((a, b) => a + b, 0) + bonus;
}

function startNewGame() {
  pendingCategory = null;
  confirmMode = false;
  gameStarted = false;
  hasRolledThisTurn = false;
  scored = {};
  yachtzCount = 0;
  dice = [1, 1, 1, 1, 1];
  locked = [false, false, false, false, false];
  rollsLeft = 3;
  gameOver = false;

  document.querySelectorAll("[id^='score-']").forEach((cell) => {
    cell.textContent = "";
    cell.className = "";
  });
  document.getElementById("upper-subtotal").textContent = "0";
  document.getElementById("upper-bonus").textContent = "0";
  document.getElementById("total-score").textContent = "0";
  rollBtn.textContent = "Start";

  localStorage.removeItem("yachtzGame");
  renderDice();
  saveGameState();

  const banner = document.getElementById("game-complete-banner");
  if (banner) {
    banner.classList.remove("show");
    banner.style.display = "none";
  }

  const postBtn = document.getElementById("post-score-banner");
  if (postBtn) {
    postBtn.disabled = false;
    postBtn.style.opacity = "1";
    postBtn.style.cursor = "pointer";
    postBtn.textContent = "Post Score";
  }
}


rollBtn.addEventListener("click", rollOrConfirm);

const saved = localStorage.getItem("yachtzGame");
if (saved) {
  loadGameState();
} else {
  startNewGame();
}
// Hook up top bar buttons
document.getElementById("new-game-btn").addEventListener("click", () => {
  const popup = document.getElementById("confirm-popup");
  if (popup) popup.style.display = "block";
});

document.getElementById("rules-btn").addEventListener("click", () => {
  const modal = document.getElementById("rules-modal");
  if (modal) modal.style.display = "block";
});

document.getElementById("close-rules").addEventListener("click", () => {
  const modal = document.getElementById("rules-modal");
  if (modal) modal.style.display = "none";
});

document.getElementById("confirm-yes").addEventListener("click", () => {
  startNewGame();
  document.getElementById("confirm-popup").style.display = "none";
});

document.getElementById("confirm-cancel").addEventListener("click", () => {
  document.getElementById("confirm-popup").style.display = "none";
});

document.getElementById("help-btn").addEventListener("click", () => {
  const modal = document.getElementById("help-modal");
  if (modal) modal.style.display = "block";
});

document.getElementById("close-help").addEventListener("click", () => {
  const modal = document.getElementById("help-modal");
  if (modal) modal.style.display = "none";
});

document.getElementById("start-new-banner").addEventListener("click", () => {
  startNewGame();
  document.getElementById("game-complete-banner").style.display = "none";
  document.getElementById("game-complete-banner").classList.remove("show");
});

document.getElementById("close-leaderboard").addEventListener("click", () => {
  const modal = document.getElementById("leaderboard-modal");
  if (modal) modal.style.display = "none";
});

function generateSeparatorSquares(count = 20) {
  const container = document.querySelector(".square-separator");
  if (!container) return;

  for (let i = 0; i < count; i++) {
    const square = document.createElement("div");
    square.className = "square";
    container.appendChild(square);
  }
}

// Run when DOM is ready
generateSeparatorSquares();

function triggerYachtzCelebration() {
  // Fireworks
  for (let i = 0; i < 3; i++) {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: Math.random(), y: Math.random() * 0.8 },
    });
  }

  // Animate YACHTZ text
  const banner = document.getElementById("yachtz-zoom");
  banner.classList.remove("yachtz-active"); // reset if still animating
  void banner.offsetWidth; // force reflow
  banner.classList.add("yachtz-active");

  // Add rainbow effect to dice temporarily
  const diceEls = document.querySelectorAll(".die");
  diceEls.forEach(die => die.classList.add("rainbow"));

  setTimeout(() => {
    diceEls.forEach(die => die.classList.remove("rainbow"));
  }, 2000);
}
const bannedWords = [
  "fuck", "shit", "bitch", "ass", "dick", "cunt", "nigg", "fag", "rape", "Spook", "nazi", "jew", "jews",
  "slut", "whore", "cum", "cock", "piss", "twat", "retard", "suck", "jizz", "pussy", "homo", "chink",
  // Add more as needed — partial matches work too (e.g. "nigg" catches all variants)
];

// POST SCORE FUNCTION
function promptAndPostScore(finalScore) {
  const name = prompt("Enter a name for the leaderboard (up to 5 characters):", "PLAYER");
  if (!name || name.length > 5) {
    alert("Score not submitted. Name must be 1 to 5 characters.");
    return;
  }

  const lowerName = name.toLowerCase();

  // 🚫 Check for slurs or swears
  if (bannedWords.some(word => lowerName.includes(word))) {
    alert("Inappropriate name. Score not submitted.");
    return;
  }

  db.collection("leaderboard").add({
    name: name.toUpperCase(),
    score: finalScore,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    loadLeaderboard();
  }).catch((error) => {
    console.error("Error posting score:", error);
  });
}

// LOAD LEADERBOARD FUNCTION
function loadLeaderboard() {
  const list = document.getElementById("leaderboard-list");
  list.innerHTML = `<li>Loading...</li>`;

  db.collection("leaderboard")
    .orderBy("score", "desc")
    .limit(10)
    .get()
    .then(snapshot => {
      list.innerHTML = "";
      snapshot.forEach(doc => {
        const entry = doc.data();
        const li = document.createElement("li");
        li.textContent = `${entry.name} — ${entry.score}`;
        list.appendChild(li);
      });
    }).catch((error) => {
      list.innerHTML = `<li>Error loading leaderboard</li>`;
      console.error("Error getting leaderboard:", error);
    });
}
document.getElementById("leaderboard-btn").addEventListener("click", () => {
  loadLeaderboard();
  document.getElementById("leaderboard-modal").style.display = "block";
});

document.getElementById("close-leaderboard").addEventListener("click", () => {
  document.getElementById("leaderboard-modal").style.display = "none";
});

document.getElementById("post-score-banner").addEventListener("click", () => {
  const score = parseInt(document.getElementById("total-score").textContent);

  promptAndPostScore(score);

  const btn = document.getElementById("post-score-banner");
  btn.disabled = true;
  btn.style.opacity = "0.5";
  btn.style.cursor = "not-allowed";
  btn.textContent = "Score Posted";
});

function forceBonusYachtz() {
  // Pretend the user already scored a 50-point Yachtz
  scored["yahtzee"] = 50;
  yachtzCount = 1;
  gameStarted = true;
  hasRolledThisTurn = true;

  // Set all dice to the same number (e.g., all 6s)
  dice = [6, 6, 6, 6, 6];
  locked = [false, false, false, false, false];

  // Re-render game state
  renderDice();
  updateScorePreviews();

  // Manually trigger cell click on "yahtzee"
  const yahtzeeCell = document.querySelector('[data-category="yahtzee"]');
  yahtzeeCell.click(); // first click to preview
  yahtzeeCell.click(); // second click to confirm
}

const diceContainer = document.getElementById("dice-container");
const rollBtn = document.getElementById("roll-btn");
const scorecard = document.getElementById("scorecard");
