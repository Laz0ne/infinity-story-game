/* ═══════════════════════════════════════════════════════════════
   Infinity Story Game — app.js
   Logique frontend : appels API, typewriter, stats, navigation
═══════════════════════════════════════════════════════════════ */

'use strict';

// ── État global ───────────────────────────────────────────────
const state = {
  playerId: null,
  currentChoices: [],
  isTyping: false,
  typingTimer: null,
};

// ── Icônes de classe ──────────────────────────────────────────
const CLASS_ICONS = {
  aventurier: '🗡️',
  voleur:     '🗝️',
  marchand:   '💰',
};

// ── Sélecteurs DOM ────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const screens = {
  welcome: $('screen-welcome'),
  game:    $('screen-game'),
};

const ui = {
  form:           $('form-character'),
  btnStart:       $('btn-start'),
  storyText:      $('story-text'),
  typingCursor:   $('typing-cursor'),
  loading:        $('loading'),
  choicesContainer: $('choices-container'),
  choicesList:    $('choices-list'),
  errorOverlay:   $('error-overlay'),
  errorMessage:   $('error-message'),
  btnErrorClose:  $('btn-error-close'),
  valTurn:        $('val-turn'),
  valReputation:  $('val-reputation'),
  valArgent:      $('val-argent'),
  valInfluence:   $('val-influence'),
  valName:        $('val-name'),
  classIcon:      $('class-icon'),
};

// ── Navigation ────────────────────────────────────────────────
function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    el.classList.toggle('active', key === name);
  });
}

// ── Erreur ────────────────────────────────────────────────────
function showError(message) {
  ui.errorMessage.textContent = message;
  ui.errorOverlay.classList.remove('hidden');
}

ui.btnErrorClose.addEventListener('click', () => {
  ui.errorOverlay.classList.add('hidden');
});

// ── Mise à jour des stats ─────────────────────────────────────
function updateStats(stats) {
  const fields = [
    { el: ui.valTurn,       val: stats.turn,       neutral: true },
    { el: ui.valReputation, val: stats.reputation, neutral: false },
    { el: ui.valArgent,     val: stats.argent,     neutral: true },
    { el: ui.valInfluence,  val: stats.influence,  neutral: true },
  ];

  fields.forEach(({ el, val, neutral }) => {
    const prev = parseInt(el.textContent, 10) || 0;
    el.textContent = val;

    // Animation de changement
    el.classList.remove('bump', 'positive', 'negative');
    if (!neutral && val !== prev) {
      el.classList.add(val > prev ? 'positive' : 'negative');
    }
    void el.offsetWidth; // reflow pour relancer l'animation
    el.classList.add('bump');
    setTimeout(() => el.classList.remove('bump', 'positive', 'negative'), 400);
  });

  if (stats.name) {
    ui.valName.textContent = stats.name;
    ui.classIcon.textContent = CLASS_ICONS[stats.character_class] || '⚔️';
  }
}

// ── Effet typewriter ──────────────────────────────────────────
const TYPEWRITER_SPEED = 18; // ms par caractère

function typewrite(text, onDone) {
  if (state.typingTimer) {
    clearTimeout(state.typingTimer);
    state.typingTimer = null;
  }
  state.isTyping = true;

  // Mémoriser le texte complet pour l'accélération (clic pendant la frappe)
  ui.storyText.dataset.fullText = text;

  ui.storyText.textContent = '';
  ui.typingCursor.classList.remove('hidden');

  let i = 0;
  const chars = [...text]; // supporte Unicode/emoji

  function step() {
    if (i < chars.length) {
      ui.storyText.textContent += chars[i];
      i++;
      state.typingTimer = setTimeout(step, TYPEWRITER_SPEED);
    } else {
      state.isTyping = false;
      ui.typingCursor.classList.add('hidden');
      if (typeof onDone === 'function') onDone();
    }
  }

  step();
}

// ── Afficher les choix ────────────────────────────────────────
function renderChoices(choices) {
  ui.choicesList.innerHTML = '';

  choices.forEach((choice) => {
    const btn = document.createElement('button');
    btn.className = 'btn-choice';
    btn.dataset.idx = choice.id + '.';
    btn.textContent = choice.text;
    btn.addEventListener('click', () => onChoiceClick(choice.id));
    ui.choicesList.appendChild(btn);
  });

  ui.choicesContainer.classList.remove('hidden');
}

function hideChoices() {
  ui.choicesContainer.classList.add('hidden');
  ui.choicesList.innerHTML = '';
}

function disableChoices() {
  ui.choicesList.querySelectorAll('.btn-choice').forEach((btn) => {
    btn.disabled = true;
  });
}

// ── Affichage d'une situation ─────────────────────────────────
function displaySituation(storyText, choices, stats) {
  hideChoices();
  ui.loading.classList.add('hidden');
  updateStats(stats);

  typewrite(storyText, () => {
    renderChoices(choices);
  });

  state.currentChoices = choices;
}

// ── Appels API ────────────────────────────────────────────────
async function apiPost(path, body) {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.detail || `Erreur ${response.status}`);
  }

  return response.json();
}

async function startNewGame(name, characterClass) {
  ui.btnStart.disabled = true;

  try {
    const data = await apiPost('/api/game/new', {
      name,
      character_class: characterClass,
    });

    state.playerId = data.player_id;

    showScreen('game');
    displaySituation(data.story_text, data.choices, data.stats);
  } catch (err) {
    showError(`Impossible de démarrer la partie : ${err.message}`);
  } finally {
    ui.btnStart.disabled = false;
  }
}

async function sendChoice(choiceId) {
  if (!state.playerId) return;

  disableChoices();
  hideChoices();
  ui.loading.classList.remove('hidden');

  try {
    const data = await apiPost('/api/game/choice', {
      player_id: state.playerId,
      choice_id: choiceId,
    });

    displaySituation(data.story_text, data.choices, data.stats);
  } catch (err) {
    ui.loading.classList.add('hidden');
    showError(`Erreur lors du choix : ${err.message}`);
    // Réactiver les choix pour permettre de réessayer
    ui.choicesContainer.classList.remove('hidden');
    ui.choicesList.querySelectorAll('.btn-choice').forEach((btn) => {
      btn.disabled = false;
    });
  }
}

// ── Gestionnaires d'événements ────────────────────────────────
ui.form.addEventListener('submit', (e) => {
  e.preventDefault();

  const nameInput = document.getElementById('input-name');
  const name = nameInput.value.trim();
  if (!name) {
    nameInput.focus();
    return;
  }

  const classInput = document.querySelector('input[name="character_class"]:checked');
  const characterClass = classInput ? classInput.value : 'aventurier';

  startNewGame(name, characterClass);
});

function onChoiceClick(choiceId) {
  if (state.isTyping) {
    // Si le typewriter tourne encore, on l'arrête et on affiche tout le texte
    if (state.typingTimer) {
      clearTimeout(state.typingTimer);
      state.typingTimer = null;
    }
    state.isTyping = false;
    ui.typingCursor.classList.add('hidden');
    // Afficher le texte complet et les choix
    const fullText = ui.storyText.dataset.fullText;
    if (fullText) ui.storyText.textContent = fullText;
    renderChoices(state.currentChoices);
    return;
  }

  sendChoice(choiceId);
}

// ── Init ──────────────────────────────────────────────────────
showScreen('welcome');
