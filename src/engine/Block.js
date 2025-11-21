export class Block {
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
            
            // Add borders based on position to avoid double borders
            // This is a simplified approach; a robust one might need more logic
            // or just rely on the container's background for borders (gap approach)
            // For now, let's use the CSS border-top:0 border-left:0 approach
            // and ensure the container has a border.
            
            // Actually, to get the "Mondrian" look with thick lines, 
            // using gaps and a black background for the container is often easier.
            // But let's stick to the CSS border approach for now.
            el.style.borderRight = 'var(--border-width) solid var(--color-black)';
            el.style.borderBottom = 'var(--border-width) solid var(--color-black)';

            container.appendChild(el);
        }
    }
    
    // Serialize for comparison
    serialize() {
        if (this.children.length > 0) {
            return {
                split: this.splitAxis,
                children: this.children.map(c => c.serialize())
            };
        }
        return {
            color: this.color
        };
    }
}
