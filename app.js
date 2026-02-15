const fileCandidates = [
  "content/InsightHub-Skit-ShortVersion.txt",
  "Content/InsightHub-Skit-ShortVersion.txt",
];

const characterSelect = document.getElementById("character-select");
const startBtn = document.getElementById("start-btn");
const loadError = document.getElementById("load-error");
const setupPanel = document.getElementById("setup-panel");
const practicePanel = document.getElementById("practice-panel");
const progressText = document.getElementById("progress-text");
const contextText = document.getElementById("context-text");
const lineInput = document.getElementById("line-input");
const checkBtn = document.getElementById("check-btn");
const nextBtn = document.getElementById("next-btn");
const restartBtn = document.getElementById("restart-btn");
const resultBox = document.getElementById("result-box");
const expectedLine = document.getElementById("expected-line");
const otherLine = document.getElementById("other-line");

let scriptLines = [];
let selectedCharacter = "";
let promptIndices = [];
let promptCursor = 0;

async function loadSkitText() {
  for (const filePath of fileCandidates) {
    try {
      const response = await fetch(filePath);
      if (response.ok) return await response.text();
    } catch (error) {
      // Try next candidate path.
    }
  }
  throw new Error("Could not load skit file from content folder.");
}

function parseScript(rawText) {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const splitIndex = line.indexOf(":");
      if (splitIndex === -1) return null;
      const speaker = line.slice(0, splitIndex).trim();
      const text = line.slice(splitIndex + 1).trim();
      if (!speaker || !text) return null;
      return { speaker, text };
    })
    .filter(Boolean);
}

function uniqueSpeakers(lines) {
  return [...new Set(lines.map((item) => item.speaker))];
}

function setCharacters(characters) {
  characterSelect.innerHTML = '<option value="">Select a character</option>';
  characters.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    characterSelect.append(option);
  });
}

function getPromptIndices(character) {
  return scriptLines
    .map((line, index) => ({ ...line, index }))
    .filter((line) => line.speaker === character)
    .map((line) => line.index);
}

function nearestContext(index) {
  const prev = scriptLines[index - 1];
  if (!prev) return "Beginning of skit.";
  return `${prev.speaker}: ${prev.text}`;
}

function nextOtherCharacterLine(index, character) {
  for (let i = index + 1; i < scriptLines.length; i += 1) {
    if (scriptLines[i].speaker !== character) {
      return `${scriptLines[i].speaker}: ${scriptLines[i].text}`;
    }
  }
  return "No following line from another character.";
}

function updatePromptView() {
  const done = promptCursor >= promptIndices.length;
  if (done) {
    progressText.textContent = `Completed ${promptIndices.length} of ${promptIndices.length} lines.`;
    contextText.textContent = "Practice complete.";
    lineInput.value = "";
    lineInput.disabled = true;
    checkBtn.hidden = true;
    nextBtn.hidden = true;
    restartBtn.hidden = false;
    resultBox.hidden = true;
    return;
  }

  const index = promptIndices[promptCursor];
  progressText.textContent = `Line ${promptCursor + 1} of ${promptIndices.length}`;
  contextText.textContent = nearestContext(index);
  lineInput.value = "";
  lineInput.disabled = false;
  lineInput.focus();
  checkBtn.hidden = false;
  nextBtn.hidden = true;
  restartBtn.hidden = true;
  resultBox.hidden = true;
}

function startPractice() {
  selectedCharacter = characterSelect.value;
  promptIndices = getPromptIndices(selectedCharacter);
  promptCursor = 0;

  setupPanel.hidden = true;
  practicePanel.hidden = false;

  updatePromptView();
}

function checkCurrentLine() {
  const index = promptIndices[promptCursor];
  const current = scriptLines[index];

  expectedLine.textContent = `${selectedCharacter}: ${current.text}`;
  otherLine.textContent = nextOtherCharacterLine(index, selectedCharacter);
  resultBox.hidden = false;

  lineInput.disabled = true;
  checkBtn.hidden = true;
  nextBtn.hidden = false;
}

function advancePrompt() {
  promptCursor += 1;
  updatePromptView();
}

function resetToSetup() {
  practicePanel.hidden = true;
  setupPanel.hidden = false;
  characterSelect.value = "";
  startBtn.disabled = true;
}

characterSelect.addEventListener("change", () => {
  startBtn.disabled = !characterSelect.value;
});

startBtn.addEventListener("click", startPractice);
checkBtn.addEventListener("click", checkCurrentLine);
nextBtn.addEventListener("click", advancePrompt);
restartBtn.addEventListener("click", resetToSetup);

(async function init() {
  try {
    const raw = await loadSkitText();
    scriptLines = parseScript(raw);
    if (!scriptLines.length) throw new Error("No valid lines found in skit file.");
    setCharacters(uniqueSpeakers(scriptLines));
    startBtn.disabled = true;
  } catch (error) {
    loadError.hidden = false;
    loadError.textContent = error.message;
    characterSelect.innerHTML = '<option value="">Unable to load characters</option>';
    startBtn.disabled = true;
  }
})();
