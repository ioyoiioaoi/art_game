import { Block } from './Block.js';

export class Game {
    constructor() {
        this.playerRoot = new Block(0, 0, 1, 1);
        this.targetRoot = new Block(0, 0, 1, 1);
        this.selectedColor = '#E30022'; // Default Red
        this.selectedTool = 'paint'; // 'paint', 'split-h', 'split-v'
    }

    init() {
        this.generateTarget();
    }

    generateTarget() {
        this.targetRoot = new Block(0, 0, 1, 1);
        this.randomSplit(this.targetRoot, 3); // 3 levels of recursion
        this.randomColor(this.targetRoot);
    }

    randomSplit(block, depth) {
        if (depth <= 0) return;

        if (Math.random() > 0.3) { // 70% chance to split
            const axis = Math.random() > 0.5 ? 'h' : 'v';
            // Random ratio between 0.3 and 0.7
            const ratio = 0.3 + Math.random() * 0.4;

            if (block.split(axis, ratio)) {
                block.children.forEach(child => this.randomSplit(child, depth - 1));
            }
        }
    }

    randomColor(block) {
        if (block.children.length > 0) {
            block.children.forEach(child => this.randomColor(child));
        } else {
            const colors = ['#F0F0F0', '#F0F0F0', '#F0F0F0', '#E30022', '#0078BF', '#FFD100', '#111111'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            block.setColor(color);
        }
    }

    handleInteraction(x, y) { // x, y are 0-1 relative coordinates
        const block = this.playerRoot.findBlockAt(x, y);
        if (!block) return;

        if (this.selectedTool === 'paint') {
            block.setColor(this.selectedColor);
        } else if (this.selectedTool === 'split-h') {
            block.split('h', 0.5); // Default split center
        } else if (this.selectedTool === 'split-v') {
            block.split('v', 0.5);
        }
    }

    checkMatch() {
        // Simple comparison: check if leaf nodes match roughly?
        // Or strict structure match?
        // For a simple game, let's just check visual similarity by sampling points?
        // Or compare the structure serialization.

        // Let's do a sampling approach for robustness against slight ratio differences.
        let matchCount = 0;
        const samples = 100;

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

    reset() {
        this.playerRoot = new Block(0, 0, 1, 1);
    }
}
