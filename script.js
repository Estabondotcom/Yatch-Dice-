// DOM Elements
const diceContainer = document.getElementById("dice-container");
const rollBtn = document.getElementById("roll-btn");
const scorecard = document.getElementById("scorecard");

// Game State
let dice = [1, 1, 1, 1, 1];
let locked = [false, false, false, false, false];
let rollsLeft = 3;
let scored = {};

// Render Dice to Page
function renderDice() {
  diceContainer.innerHTML = "";
  dice.forEach((value, i) => {
    const die = document.createElement("div");
    die.className = "die" + (locked[i] ? " locked" : "");
    die.textContent = value;
    die.addEventListener("click", () => {
      locked[i] = !locked[i];
      renderDice();
      updateScorePreviews(); // update score previews when dice are locked/unlocked
    });
    diceContainer.appendChild(die);
  });
}

// Roll Dice (with lock handling)
function rollDice() {
  if (rollsLeft <= 0) return;
  dice = dice.map((val, i) => locked[i] ? val : Math.ceil(Math.random() * 6));
  rollsLeft--;
  rollBtn.textContent = `Roll Dice (${rollsLeft} rolls left)`;
  renderDice();
  updateScorePreviews();
}

// Reset Turn After Scoring
function resetTurn() {
  locked = [false, false, false, false, false];
  rollsLeft = 3;
  rollBtn.textContent = `Roll Dice (${rollsLeft} rolls left)`;
  renderDice();
  updateScorePreviews();
}

// Scoring Helpers
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
  const straights = [
    [1, 2, 3, 4],
    [2, 3, 4, 5],
    [3, 4, 5, 6]
  ];
  return straights.some(straight => straight.every(n => unique.includes(n)));
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

// Handle Scoring Clicks
scorecard.addEventListener("click", (e) => {
  const cell = e.target.closest(".scorable");
  if (!cell) return;

  const category = cell.dataset.category;
  if (scored[category]) return;

  const score = calculateScoreForCategory(category);
  document.getElementById("score-" + category).textContent = score;
  scored[category] = score;

  // Calculate upper section total
  const upperCategories = ["ones", "twos", "threes", "fours", "fives", "sixes"];
  const upperTotal = upperCategories.reduce((sum, key) => sum + (scored[key] || 0), 0);
  document.getElementById("upper-subtotal").textContent = upperTotal;
  const bonus = upperTotal >= 63 ? 35 : 0;
  document.getElementById("upper-bonus").textContent = bonus;

  // Calculate total score with bonus
  const total = Object.values(scored).reduce((a, b) => a + b, 0) + bonus;
  document.getElementById("total-score").textContent = total;

  updateScorePreviews();
  checkEndGame();
  resetTurn();
});

// Score Preview Display
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

// Init
rollBtn.addEventListener("click", rollDice);
renderDice();
updateScorePreviews();

const endModal = document.getElementById("end-modal");
const finalScoreText = document.getElementById("final-score");
const restartBtn = document.getElementById("restart-btn");

function checkEndGame() {
  const totalCategories = 13; // 6 upper + 7 lower
  if (Object.keys(scored).length === totalCategories) {
    const finalTotal = parseInt(document.getElementById("total-score").textContent, 10) || 0;
    finalScoreText.textContent = `You scored ${finalTotal} points!`;
    endModal.style.display = "flex";
  }
}
function startNewGame() {
  dice = [1, 1, 1, 1, 1];
  locked = [false, false, false, false, false];
  rollsLeft = 3;
  scored = {};

  // Clear all score fields and classes
  document.querySelectorAll("[id^='score-']").forEach(cell => {
    cell.textContent = "";
    cell.className = "";
  });

  document.getElementById("upper-bonus").textContent = "0";
  document.getElementById("total-score").textContent = "0";
  endModal.style.display = "none";

  renderDice();
  updateScorePreviews();
}

restartBtn.addEventListener("click", startNewGame);
const endModal = document.getElementById("end-modal");
const finalScoreText = document.getElementById("final-score");
const restartBtn = document.getElementById("restart-btn");

function checkEndGame() {
  const totalCategories = 13;
  if (Object.keys(scored).length === totalCategories) {
    const finalTotal = parseInt(document.getElementById("total-score").textContent, 10) || 0;
    finalScoreText.textContent = `You scored ${finalTotal} points!`;
    endModal.style.display = "flex";
  }
}

function startNewGame() {
  dice = [1, 1, 1, 1, 1];
  locked = [false, false, false, false, false];
  rollsLeft = 3;
  scored = {};

  document.querySelectorAll("[id^='score-']").forEach(cell => {
    cell.textContent = "";
    cell.className = "";
  });

  document.getElementById("upper-bonus").textContent = "0";
  document.getElementById("upper-subtotal").textContent = "0";
  document.getElementById("total-score").textContent = "0";
  endModal.style.display = "none";

  renderDice(); 
  updateScorePreviews();
}

restartBtn.addEventListener("click", startNewGame);
