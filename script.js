let pendingCategory = null;
let confirmMode = false;
let gameStarted = false;
let hasRolledThisTurn = false;

// DOM Elements
const diceContainer = document.getElementById("dice-container");
const rollBtn = document.getElementById("roll-btn");
const scorecard = document.getElementById("scorecard");
const endModal = document.getElementById("end-modal");
const finalScoreText = document.getElementById("final-score");
const restartBtn = document.getElementById("restart-btn");

// Game State
let dice = [1, 1, 1, 1, 1];
let locked = [false, false, false, false, false];
let rollsLeft = 3;
let scored = {};

// 🎲 Render Dice
function renderDice() {
  diceContainer.innerHTML = "";
  dice.forEach((value, i) => {
    const die = document.createElement("div");
    die.className = "die" + (locked[i] ? " locked" : "");
    die.textContent = value;
    die.addEventListener("click", () => {
      if (!confirmMode && gameStarted && hasRolledThisTurn) {
        locked[i] = !locked[i];
        renderDice();
        updateScorePreviews();
      }
    });
    diceContainer.appendChild(die);
  });
}

// 🔁 Reset Turn
function resetTurn() {
  locked = [false, false, false, false, false];
  rollsLeft = 3;
  hasRolledThisTurn = false;
  confirmMode = false;
  pendingCategory = null;
  rollBtn.textContent = "Roll Dice (3 rolls left)";
  renderDice();
  updateScorePreviews();
}

// ▶️ Button Logic: Start, Roll, or Confirm
function rollOrConfirm() {
  // First-time start
  if (!gameStarted) {
    gameStarted = true;
    hasRolledThisTurn = true;
    dice = dice.map(() => Math.ceil(Math.random() * 6));
    rollsLeft = 2;
    rollBtn.textContent = `Roll Dice (2 rolls left)`;
    renderDice();
    updateScorePreviews();
    return;
  }

  // Confirm score
  if (confirmMode && pendingCategory) {
    const category = pendingCategory;
    const score = parseInt(document.getElementById("score-" + category).textContent, 10);
    scored[category] = score;

    const scoreCell = document.getElementById("score-" + category);
    scoreCell.className = score === 0 ? "filled-zero" : "filled";

    const upperCategories = ["ones", "twos", "threes", "fours", "fives", "sixes"];
    const upperTotal = upperCategories.reduce((sum, key) => sum + (scored[key] || 0), 0);
    document.getElementById("upper-subtotal").textContent = upperTotal;
    const bonus = upperTotal >= 63 ? 35 : 0;
    document.getElementById("upper-bonus").textContent = bonus;

    const total = Object.values(scored).reduce((a, b) => a + b, 0) + bonus;
    document.getElementById("total-score").textContent = total;

    pendingCategory = null;
    confirmMode = false;
    checkEndGame();
    resetTurn();
    return;
  }

  // Rolling
  if (rollsLeft <= 0) return;

  hasRolledThisTurn = true;
  dice = dice.map((val, i) => locked[i] ? val : Math.ceil(Math.random() * 6));
  rollsLeft--;
  rollBtn.textContent = `Roll Dice (${rollsLeft} rolls left)`;
  renderDice();
  updateScorePreviews();
}

// 🧠 Score Calculations
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

// 🖱️ Handle Score Selection
scorecard.addEventListener("click", (e) => {
  if (!gameStarted || !hasRolledThisTurn) return;

  const cell = e.target.closest(".scorable");
  if (!cell) return;

  const category = cell.dataset.category;
  if (scored[category]) return;

  if (pendingCategory) {
    const oldCell = document.getElementById("score-" + pendingCategory);
    oldCell.className = "preview";
  }

  pendingCategory = category;
  const score = calculateScoreForCategory(category);

  const scoreCell = document.getElementById("score-" + category);
  scoreCell.textContent = score;
  scoreCell.className = "preview selected";

  rollBtn.textContent = "Confirm";
  confirmMode = true;
});

// 🔍 Score Previews
function updateScorePreviews() {
  const allCells = document.querySelectorAll(".scorable");

  allCells.forEach(cell => {
    const category = cell.dataset.category;
    const scoreCell = document.getElementById("score-" + category);

    if (scored[category] !== undefined) {
      const value = scored[category];
      scoreCell.textContent = value;
      scoreCell.className = value === 0 ? "filled-zero" : "filled";
    } else {
      const previewScore = calculateScoreForCategory(category);
      scoreCell.textContent = previewScore;
      scoreCell.className = "preview";
    }
  });
}

// 🏁 End Game
function checkEndGame() {
  if (Object.keys(scored).length < 13) return;

  const finalTotal = parseInt(document.getElementById("total-score").textContent, 10) || 0;
  finalScoreText.textContent = `You scored ${finalTotal} points!`;
  endModal.style.display = "flex";
}

// 🔁 Restart Game
function startNewGame() {
  pendingCategory = null;
  confirmMode = false;
  gameStarted = false;
  hasRolledThisTurn = false;
  scored = {};
  dice = [1, 1, 1, 1, 1];
  locked = [false, false, false, false, false];
  rollsLeft = 3;

  document.querySelectorAll("[id^='score-']").forEach(cell => {
    cell.textContent = "";
    cell.className = "";
  });

  document.getElementById("upper-subtotal").textContent = "0";
  document.getElementById("upper-bonus").textContent = "0";
  document.getElementById("total-score").textContent = "0";
  rollBtn.textContent = "Start";
  endModal.style.display = "none";

  renderDice();
  updateScorePreviews();
}

// 🔘 Init
rollBtn.addEventListener("click", rollOrConfirm);
restartBtn.addEventListener("click", startNewGame);
renderDice();
updateScorePreviews();
