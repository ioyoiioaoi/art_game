import { Game } from './engine/Game.js';

const game = new Game();
game.init();

// DOM Elements
const playerCanvas = document.getElementById('player-canvas');
const targetCanvas = document.getElementById('target-canvas');
const scoreDisplay = document.getElementById('score-display');

// Render Loop
function render() {
    playerCanvas.innerHTML = '';
    targetCanvas.innerHTML = '';

    game.playerRoot.render(playerCanvas);
    game.targetRoot.render(targetCanvas);
}

// Initial Render
render();

// Interaction
playerCanvas.addEventListener('click', (e) => {
    const rect = playerCanvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    game.handleInteraction(x, y);
    render();

    // Auto-update score on move? Or wait for check?
    // Let's auto-update for instant feedback
    const score = game.checkMatch();
    scoreDisplay.textContent = `Score: ${score}%`;
});

// Tools
document.getElementById('tool-split-h').addEventListener('click', (e) => {
    setTool('split-h', e.target);
});
document.getElementById('tool-split-v').addEventListener('click', (e) => {
    setTool('split-v', e.target);
});
document.getElementById('tool-paint').addEventListener('click', (e) => {
    setTool('paint', e.target);
});

function setTool(tool, btn) {
    game.selectedTool = tool;
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

// Palette
document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', (e) => {
        const color = e.target.dataset.color;
        game.selectedColor = color;
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        e.target.classList.add('selected');

        // Auto-switch to paint tool when color is picked
        setTool('paint', document.getElementById('tool-paint'));
    });
});

// Controls
document.getElementById('btn-reset').addEventListener('click', () => {
    game.reset();
    render();
    scoreDisplay.textContent = 'Score: 0%';
});

document.getElementById('btn-check').addEventListener('click', () => {
    const score = game.checkMatch();
    alert(`Match Score: ${score}%`);
    if (score > 90) {
        alert("Excellent! You are a true artist!");
        game.generateTarget(); // New level
        game.reset();
        render();
    }
});
