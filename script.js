// Block Class
class Block {
    constructor(x, y, width, height, parent = null) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = '#F0F0F0'; // Default white
        this.children = []; // If split, contains [child1, child2]
        this.parent = parent;
        this.splitAxis = null; // 'h' or 'v'
    }

    // Split the block at a relative ratio (0.1 to 0.9)
    split(axis, ratio = 0.5) {
        if (this.children.length > 0) return false; // Already split

        this.splitAxis = axis;

        if (axis === 'h') {
            // Horizontal split (creates top and bottom)
            const h1 = this.height * ratio;
            const h2 = this.height - h1;
            this.children = [
                new Block(this.x, this.y, this.width, h1, this),
                new Block(this.x, this.y + h1, this.width, h2, this)
            ];
        } else {
            // Vertical split (creates left and right)
            const w1 = this.width * ratio;
            const w2 = this.width - w1;
            this.children = [
                new Block(this.x, this.y, w1, this.height, this),
                new Block(this.x + w1, this.y, w2, this.height, this)
            ];
        }
        return true;
    }

    setColor(color) {
        if (this.children.length > 0) return false; // Can only color leaf blocks
        this.color = color;
        return true;
    }

    // Find the leaf block at specific coordinates (relative to canvas)
    findBlockAt(x, y) {
        if (this.children.length === 0) {
            return this;
        }

        // Check which child contains the point
        for (const child of this.children) {
            if (x >= child.x && x < child.x + child.width &&
                y >= child.y && y < child.y + child.height) {
                return child.findBlockAt(x, y);
            }
        }
        return null;
    }

    // Render the block and its children to DOM elements
    render(container) {
        if (this.children.length > 0) {
            this.children.forEach(child => child.render(container));
        } else {
            const el = document.createElement('div');
            el.className = 'block';
            el.style.left = `${this.x * 100}%`;
            el.style.top = `${this.y * 100}%`;
            el.style.width = `${this.width * 100}%`;
            el.style.height = `${this.height * 100}%`;
            el.style.backgroundColor = this.color;

            el.style.borderRight = 'var(--border-width) solid var(--color-black)';
            el.style.borderBottom = 'var(--border-width) solid var(--color-black)';

            container.appendChild(el);
        }
    }
}

// Game Class
class Game {
    constructor() {
        this.playerRoot = new Block(0, 0, 1, 1);
        this.targetRoot = new Block(0, 0, 1, 1);
        this.selectedColor = '#E30022'; // Default Red
        this.selectedTool = 'paint'; // 'paint', 'split-h', 'split-v'

        this.level = 1;
        this.totalScore = 0; // Cumulative score
        this.timeLeft = 30; // Fixed 30s
        this.timerInterval = null;
        this.isPlaying = false;
        this.onRender = null; // Callback for rendering
    }

    init() {
        // Don't start level immediately. Wait for user.
        this.updateUI(); // Show initial 0s/Level 1
    }

    startGame() {
        document.getElementById('start-screen').classList.add('hidden');
        this.startLevel(1, true);
    }

    startLevel(level, resetTotalScore = false) {
        this.level = level;
        if (resetTotalScore) this.totalScore = 0;

        this.generateTarget();
        this.playerRoot = new Block(0, 0, 1, 1); // Reset player canvas

        // Fixed 30 seconds per level
        this.timeLeft = 30;

        this.isPlaying = true;
        this.startTimer();
        this.updateUI();
        this.hideModal();

        // Play success sound if advancing levels (not resetting)
        if (this.level > 1 && !resetTotalScore) {
            playSuccessSound();
        }

        if (this.onRender) this.onRender();
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (!this.isPlaying) return;

            this.timeLeft--;
            this.updateUI();

            if (this.timeLeft <= 0) {
                this.handleTimeout();
            }
        }, 1000);
    }

    handleTimeout() {
        this.isPlaying = false;
        clearInterval(this.timerInterval);

        const score = this.checkMatch();
        if (score >= 60) {
            this.handleLevelComplete(score);
        } else {
            this.handleGameOver(score);
        }
        if (this.onRender) this.onRender();
    }

    handleLevelComplete(score) {
        // playSuccessSound(); // Moved to startLevel
        this.totalScore += score;
        // Auto-advance on success (no modal)
        this.startLevel(this.level + 1);
    }

    handleGameOver(score) {
        this.saveScore(this.totalScore);
        this.showModal(
            'Game Over / 遊戲結束',
            `Level Score: ${score}% (Failed)<br>Final Total Score: ${this.totalScore}`,
            'Continue Challenge / 繼續挑戰',
            () => this.startLevel(1, true), // Restart from Level 1
            true // Show leaderboard
        );
    }

    saveScore(score) {
        const leaderboard = this.getLeaderboard();
        leaderboard.push({ score: score, date: new Date().toLocaleDateString() });
        leaderboard.sort((a, b) => b.score - a.score);
        const top5 = leaderboard.slice(0, 5);
        localStorage.setItem('mondrian_leaderboard', JSON.stringify(top5));
    }

    getLeaderboard() {
        const stored = localStorage.getItem('mondrian_leaderboard');
        return stored ? JSON.parse(stored) : [];
    }

    showModal(title, message, btnText, action, showLeaderboard = false) {
        const modal = document.getElementById('game-modal');
        document.getElementById('modal-title').textContent = title.split(' / ')[0];
        document.getElementById('modal-title').innerHTML = title.replace(' / ', '<br><span class="cn" style="font-size:0.6em">') + '</span>';
        document.getElementById('modal-message').innerHTML = message;

        const btn = document.getElementById('modal-action-btn');
        btn.innerHTML = btnText.replace(' / ', '<br><span class="cn" style="font-size:0.6em">') + '</span>';

        // Remove old listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', action);

        const leaderboardSection = document.getElementById('leaderboard-section');
        if (showLeaderboard) {
            leaderboardSection.classList.remove('hidden');
            const list = document.getElementById('leaderboard-list');
            list.innerHTML = '';
            const scores = this.getLeaderboard();
            scores.forEach((s, index) => {
                const li = document.createElement('li');
                li.innerHTML = `<span>#${index + 1}</span> <span>${s.score} pts</span>`;
                list.appendChild(li);
            });
        } else {
            leaderboardSection.classList.add('hidden');
        }

        modal.classList.remove('hidden');
    }

    hideModal() {
        document.getElementById('game-modal').classList.add('hidden');
    }

    generateTarget() {
        this.targetRoot = new Block(0, 0, 1, 1);

        // Difficulty based on level
        const depth = Math.min(5, 1 + Math.ceil(this.level / 2));

        // Always force at least one split
        this.forceSplit(this.targetRoot);
        this.randomSplit(this.targetRoot, depth);
        this.randomColor(this.targetRoot);
    }

    forceSplit(block) {
        const axis = Math.random() > 0.5 ? 'h' : 'v';
        const ratio = 0.3 + Math.random() * 0.4;
        block.split(axis, ratio);
    }

    randomSplit(block, depth) {
        if (depth <= 0) return;

        if (block.children.length > 0) {
            block.children.forEach(child => this.randomSplit(child, depth - 1));
            return;
        }

        // Higher chance to split at higher depths/levels
        const chance = 0.7;

        if (Math.random() < chance) {
            const axis = Math.random() > 0.5 ? 'h' : 'v';
            const ratio = 0.2 + Math.random() * 0.6;

            if (block.split(axis, ratio)) {
                block.children.forEach(child => this.randomSplit(child, depth - 1));
            }
        }
    }

    randomColor(block) {
        if (block.children.length > 0) {
            block.children.forEach(child => this.randomColor(child));
        } else {
            // Ensure variety: Weighted random
            const colors = [
                '#F0F0F0', '#F0F0F0', // White
                '#E30022', '#E30022', // Red
                '#0078BF', '#0078BF', // Blue
                '#FFD100', '#FFD100', // Yellow
                '#111111'             // Black
            ];
            const color = colors[Math.floor(Math.random() * colors.length)];
            block.setColor(color);
        }
    }

    handleInteraction(x, y) {
        if (!this.isPlaying) return;

        const block = this.playerRoot.findBlockAt(x, y);
        if (!block) return;

        if (this.selectedTool === 'paint') {
            block.setColor(this.selectedColor);
        } else if (this.selectedTool === 'split-h') {
            block.split('h', 0.5);
        } else if (this.selectedTool === 'split-v') {
            block.split('v', 0.5);
        }
    }

    checkMatch() {
        let matchCount = 0;
        const samples = 150;

        for (let i = 0; i < samples; i++) {
            const x = Math.random();
            const y = Math.random();

            const pBlock = this.playerRoot.findBlockAt(x, y);
            const tBlock = this.targetRoot.findBlockAt(x, y);

            if (pBlock && tBlock && pBlock.color === tBlock.color) {
                matchCount++;
            }
        }

        return Math.floor((matchCount / samples) * 100);
    }

    updateUI() {
        const timerDisplay = document.getElementById('timer-display');
        const levelDisplay = document.getElementById('level-display');
        const totalScoreDisplay = document.getElementById('total-score-display');

        if (timerDisplay) timerDisplay.textContent = `${this.timeLeft}s`;
        this.updateUI();
        this.hideModal();

        if (this.onRender) this.onRender();
    }

    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (!this.isPlaying) return;

            this.timeLeft--;
            this.updateUI();

            if (this.timeLeft <= 0) {
                this.handleTimeout();
            }
        }, 1000);
    }

    handleTimeout() {
        this.isPlaying = false;
        clearInterval(this.timerInterval);

        const score = this.checkMatch();
        if (score >= 60) {
            this.handleLevelComplete(score);
        } else {
            this.handleGameOver(score);
        }
        if (this.onRender) this.onRender();
    }

    handleLevelComplete(score) {
        this.totalScore += score;
        // Auto-advance on success (no modal)
        this.startLevel(this.level + 1);
    }

    handleGameOver(score) {
        this.saveScore(this.totalScore);
        this.showModal(
            'Game Over / 遊戲結束',
            `Level Score: ${score}% (Failed)<br>Final Total Score: ${this.totalScore}`,
            'Continue Challenge / 繼續挑戰',
            () => this.startLevel(1, true), // Restart from Level 1
            true // Show leaderboard
        );
    }

    saveScore(score) {
        const leaderboard = this.getLeaderboard();
        leaderboard.push({ score: score, date: new Date().toLocaleDateString() });
        leaderboard.sort((a, b) => b.score - a.score);
        const top5 = leaderboard.slice(0, 5);
        localStorage.setItem('mondrian_leaderboard', JSON.stringify(top5));
    }

    getLeaderboard() {
        const stored = localStorage.getItem('mondrian_leaderboard');
        return stored ? JSON.parse(stored) : [];
    }

    showModal(title, message, btnText, action, showLeaderboard = false) {
        const modal = document.getElementById('game-modal');
        document.getElementById('modal-title').textContent = title.split(' / ')[0];
        document.getElementById('modal-title').innerHTML = title.replace(' / ', '<br><span class="cn" style="font-size:0.6em">') + '</span>';
        document.getElementById('modal-message').innerHTML = message;

        const btn = document.getElementById('modal-action-btn');
        btn.innerHTML = btnText.replace(' / ', '<br><span class="cn" style="font-size:0.6em">') + '</span>';

        // Remove old listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', action);

        const leaderboardSection = document.getElementById('leaderboard-section');
        if (showLeaderboard) {
            leaderboardSection.classList.remove('hidden');
            const list = document.getElementById('leaderboard-list');
            list.innerHTML = '';
            const scores = this.getLeaderboard();
            scores.forEach((s, index) => {
                const li = document.createElement('li');
                li.innerHTML = `<span>#${index + 1}</span> <span>${s.score} pts</span>`;
                list.appendChild(li);
            });
        } else {
            leaderboardSection.classList.add('hidden');
        }

        modal.classList.remove('hidden');
    }

    hideModal() {
        document.getElementById('game-modal').classList.add('hidden');
    }

    generateTarget() {
        this.targetRoot = new Block(0, 0, 1, 1);

        // Difficulty based on level
        const depth = Math.min(5, 1 + Math.ceil(this.level / 2));

        // Always force at least one split
        this.forceSplit(this.targetRoot);
        this.randomSplit(this.targetRoot, depth);
        this.randomColor(this.targetRoot);
    }

    forceSplit(block) {
        const axis = Math.random() > 0.5 ? 'h' : 'v';
        const ratio = 0.3 + Math.random() * 0.4;
        block.split(axis, ratio);
    }

    randomSplit(block, depth) {
        if (depth <= 0) return;

        if (block.children.length > 0) {
            block.children.forEach(child => this.randomSplit(child, depth - 1));
            return;
        }

        // Higher chance to split at higher depths/levels
        const chance = 0.7;

        if (Math.random() < chance) {
            const axis = Math.random() > 0.5 ? 'h' : 'v';
            const ratio = 0.2 + Math.random() * 0.6;

            if (block.split(axis, ratio)) {
                block.children.forEach(child => this.randomSplit(child, depth - 1));
            }
        }
    }

    randomColor(block) {
        if (block.children.length > 0) {
            block.children.forEach(child => this.randomColor(child));
        } else {
            // Ensure variety: Weighted random
            const colors = [
                '#F0F0F0', '#F0F0F0', // White
                '#E30022', '#E30022', // Red
                '#0078BF', '#0078BF', // Blue
                '#FFD100', '#FFD100', // Yellow
                '#111111'             // Black
            ];
            const color = colors[Math.floor(Math.random() * colors.length)];
            block.setColor(color);
        }
    }

    handleInteraction(x, y) {
        if (!this.isPlaying) return;

        const block = this.playerRoot.findBlockAt(x, y);
        if (!block) return;

        if (this.selectedTool === 'paint') {
            block.setColor(this.selectedColor);
        } else if (this.selectedTool === 'split-h') {
            block.split('h', 0.5);
        } else if (this.selectedTool === 'split-v') {
            block.split('v', 0.5);
        }
    }

    checkMatch() {
        let matchCount = 0;
        const samples = 150;

        for (let i = 0; i < samples; i++) {
            const x = Math.random();
            const y = Math.random();

            const pBlock = this.playerRoot.findBlockAt(x, y);
            const tBlock = this.targetRoot.findBlockAt(x, y);

            if (pBlock && tBlock && pBlock.color === tBlock.color) {
                matchCount++;
            }
        }

        return Math.floor((matchCount / samples) * 100);
    }

    updateUI() {
        const timerDisplay = document.getElementById('timer-display');
        const levelDisplay = document.getElementById('level-display');
        const totalScoreDisplay = document.getElementById('total-score-display');

        if (timerDisplay) timerDisplay.textContent = `${this.timeLeft}s`;
        if (levelDisplay) levelDisplay.textContent = `${this.level}`;
        if (totalScoreDisplay) totalScoreDisplay.textContent = `${this.totalScore}`;
    }
}

// Sound Manager (Web Audio API)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playClickSound() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime); // Start at 800Hz
    oscillator.frequency.exponentialRampToValueAtTime(300, audioCtx.currentTime + 0.1); // Drop to 300Hz

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
}

function playSuccessSound() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Classic 8-bit "Level Up" / "Coin" Sound
    // Quick arpeggio: C5, E5, G5, C6
    const notes = [
        { freq: 523.25, time: 0, dur: 0.1 },
        { freq: 659.25, time: 0.1, dur: 0.1 },
        { freq: 783.99, time: 0.2, dur: 0.1 },
        { freq: 1046.50, time: 0.3, dur: 0.4 }
    ];

    notes.forEach(({ freq, time, dur }) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = 'square'; // "8-bit" game sound, very distinct
        oscillator.frequency.value = freq;

        // Envelope
        gainNode.gain.setValueAtTime(0.1, now + time);
        gainNode.gain.linearRampToValueAtTime(0.1, now + time + dur - 0.05);
        gainNode.gain.linearRampToValueAtTime(0, now + time + dur);

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.start(now + time);
        oscillator.stop(now + time + dur);
    });
}

function playFailSound() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sawtooth'; // Harsh "wrong" sound
    oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.3); // Pitch drop

    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.3);
}

// Initialize Game on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const playerCanvas = document.getElementById('player-canvas');
    const targetCanvas = document.getElementById('target-canvas');
    const scoreDisplay = document.getElementById('score-display');

    // Main Logic
    const game = new Game();

    // Render Loop
    function render() {
        if (!playerCanvas || !targetCanvas) return;
        playerCanvas.innerHTML = '';
        targetCanvas.innerHTML = '';

        game.playerRoot.render(playerCanvas);
        game.targetRoot.render(targetCanvas);
    }

    // Connect render callback
    game.onRender = render;

    // Initialize
    game.init();
    render();

    // Interaction
    playerCanvas.addEventListener('click', (e) => {
        // playClickSound(); // Removed per user request
        const rect = playerCanvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        game.handleInteraction(x, y);
        render();

        const score = game.checkMatch();
        scoreDisplay.textContent = `Score / 分數: ${score}%`;
    });

    // Tools
    document.getElementById('tool-split-h').addEventListener('click', (e) => {
        playClickSound();
        setTool('split-h', e.target);
    });
    document.getElementById('tool-split-v').addEventListener('click', (e) => {
        playClickSound();
        setTool('split-v', e.target);
    });
    document.getElementById('tool-paint').addEventListener('click', (e) => {
        playClickSound();
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
            playClickSound();
            const color = e.target.dataset.color;
            game.selectedColor = color;
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
            e.target.classList.add('selected');

            setTool('paint', document.getElementById('tool-paint'));
        });
    });

    // Controls
    document.getElementById('btn-check').addEventListener('click', () => {
        // Don't play generic click sound here, wait for result
        const score = game.checkMatch();

        if (score >= 60) {
            // Success sound is played in handleLevelComplete
            game.handleLevelComplete(score);
        } else {
            playFailSound(); // Play "Wrong" sound
            // For manual check, we don't end the game, just warn
            alert(`Score: ${score}%. You need at least 60% to pass.\n分數：${score}%。你需要至少 60% 才能過關。`);
        }
    });

    // Start Screen Logic
    document.getElementById('btn-start-game').addEventListener('click', () => {
        playClickSound();
        game.startGame();
    });
});
