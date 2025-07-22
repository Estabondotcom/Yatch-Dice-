let pendingCategory = null;
let confirmMode = false;
let gameStarted = false;
let hasRolledThisTurn = false;
let yachtzCount = 0;
let loadingSavedGame = false;
let gameOver = false;

const diceContainer = document.getElementById("dice-container");
const rollBtn = document.getElementById("roll-btn");
const scorecard = document.getElementById("scorecard");

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
      // Start with a temporary placeholder (real value will come later)
      die.textContent = Math.ceil(Math.random() * 6);
      die.classList.add("rolling");

      // Keep updating with random numbers during the scramble
      let interval = setInterval(() => {
        die.textContent = Math.ceil(Math.random() * 6);
      }, 50);

      // Stop the scramble after 400ms and show real value
      setTimeout(() => {
        clearInterval(interval);
        die.textContent = dice[i]; // final value
        die.classList.remove("rolling");
      }, 400);
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
    resetTurn();
    hasRolledThisTurn = true;
    dice = dice.map(() => Math.ceil(Math.random() * 6));
    rollsLeft--;
    rollBtn.textContent = `Roll Dice (${rollsLeft} rolls left)`;
    renderDice();
    updateScorePreviews();
    saveGameState();
    return;
  }

  if (confirmMode && pendingCategory) {
    const category = pendingCategory;

    if (category === "yahtzee" && isYahtzee()) {
      const currentScore = scored["yahtzee"] || 0;

      if (currentScore === 0) {
        const scoreCell = document.getElementById("score-yahtzee");
        scoreCell.className = "filled-zero";
      } else {
        yachtzCount++;
        const newScore = 50 + (yachtzCount - 1) * 100;
        scored["yahtzee"] = newScore;

        const scoreCell = document.getElementById("score-yahtzee");
        scoreCell.textContent = newScore;
        scoreCell.className = "filled";
      }
    } else {
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
}, 2000);

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
  if (scored[category]) return;

  if (pendingCategory) {
    const old = document.getElementById("score-" + pendingCategory);
    old.className = "preview";
  }

  pendingCategory = category;
  const score = calculateScoreForCategory(category);
  const scoreCell = document.getElementById("score-" + category);
  scoreCell.textContent = score;
  scoreCell.className = "preview selected";

  rollBtn.textContent = "Confirm";
  confirmMode = true;
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

  const requiredCategories = [
    "ones", "twos", "threes", "fours", "fives", "sixes",
    "threeKind", "fourKind", "fullHouse", "smallStraight",
    "largeStraight", "yahtzee", "chance"
  ];

  const allScored = requiredCategories.every(cat => scored[cat] !== undefined);
  if (!allScored) return;

  gameOver = true;

  const total = parseInt(document.getElementById("total-score").textContent, 10) || 0;
  showGameCompleteBanner(total);
  saveGameState();
}

function showGameCompleteBanner(score) {
  const banner = document.createElement("div");
  banner.id = "game-complete-banner";
  banner.innerHTML = `
    <div>
      <h2>🎉 Game Complete!</h2>
      <p>You scored <strong>${score}</strong> points.</p>
      <button id="start-new-banner">Start New Game</button>
      <button id="post-score-banner">Post Score</button>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById("start-new-banner").addEventListener("click", () => {
    startNewGame();
    banner.remove();
  });

  document.getElementById("post-score-banner").addEventListener("click", () => {
    alert("Feature coming soon: Post to leaderboard!");
  });
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
  if (banner) banner.remove();
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
