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
   });
    diceContainer.appendChild(die);
  });
}

// Reset Turn After Scoring
function resetTurn() {
  locked = [false, false, false, false, false];
  rollsLeft = 3;
  rollBtn.textContent = `Roll Dice (${rollsLeft} rolls left)`;
  renderDice();
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

  let score = 0;
  switch (category) {
    // Upper section
    case "ones": score = calculateUpperScore(1); break;
    case "twos": score = calculateUpperScore(2); break;
    case "threes": score = calculateUpperScore(3); break;
    case "fours": score = calculateUpperScore(4); break;
    case "fives": score = calculateUpperScore(5); break;
    case "sixes": score = calculateUpperScore(6); break;

    // Lower section
    case "threeKind":
      score = hasNOfAKind(3) ? sumAllDice() : 0;
      break;
    case "fourKind":
      score = hasNOfAKind(4) ? sumAllDice() : 0;
      break;
    case "fullHouse":
      score = isFullHouse() ? 25 : 0;
      break;
    case "smallStraight":
      score = isSmallStraight() ? 30 : 0;
      break;
    case "largeStraight":
      score = isLargeStraight() ? 40 : 0;
      break;
    case "yahtzee":
      score = isYahtzee() ? 50 : 0;
      break;
    case "chance":
      score = sumAllDice();
      break;
  }

  // Save and display the score
  document.getElementById("score-" + category).textContent = score;
  scored[category] = score;

  scored[category] = score;

  // Calculate upper section total
  const upperCategories = ["ones", "twos", "threes", "fours", "fives", "sixes"];
  const upperTotal = upperCategories.reduce((sum, key) => scored[key] || sum, 0);
  const bonus = upperTotal >= 63 ? 35 : 0;
  document.getElementById("upper-bonus").textContent = bonus;

  // Calculate total score with bonus
  const total = Object.values(scored).reduce((a, b) => a + b, 0) + bonus;
  document.getElementById("total-score").textContent = total;
  updateScorePreviews();
  // Reset for next turn
  resetTurn();
});

// Set up button and initial dice
rollBtn.addEventListener("click", rollDice);
renderDice();

function updateScorePreviews() {
  const allCells = document.querySelectorAll(".scorable");

  allCells.forEach(cell => {
    const category = cell.dataset.category;
    const scoreCell = document.getElementById("score-" + category);

    if (scored[category] !== undefined) {
      // Already scored — color it
      const value = scored[category];
      scoreCell.className = value === 0 ? "filled-zero" : "filled";
    } else {
      // Not yet scored — show preview
      const previewScore = calculateScoreForCategory(category);
      scoreCell.textContent = previewScore;
      scoreCell.className = "preview";
    }
  });
}
document.getElementById("upper-subtotal").textContent = upperTotal;
