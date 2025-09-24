class Board {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.context = context;
        this.stickyNotes = [];
        this.yarns = [];
        this.offsetX = 0;
        this.offsetY = 0;
        this.isPanning = false;
        this.startPan = { x: 0, y: 0 };

        // Load notes (async) then draw and wire events
        this.init();
    }

    async init() {
        try {
            const { loadNotes } = await import('../storage/localStorage.js');
            const notes = await loadNotes();
            this.stickyNotes = notes.map(note => new StickyNote(note.x, note.y, note.content));
        } catch (e) {
            console.warn('Failed to load notes', e);
            this.stickyNotes = [];
        }
        this.draw();
        this.setupEventListeners();
    }

    async saveNotes() {
        try {
            const { saveNotes } = await import('../storage/localStorage.js');
            // Serialize minimal note data
            const out = this.stickyNotes.map(n => ({ x: n.x, y: n.y, content: n.content }));
            await saveNotes(out);
        } catch (e) {
            console.warn('Failed to save notes', e);
        }
    }

    draw() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawCorkboardTexture();
        this.stickyNotes.forEach(note => note.draw(this.context));
        this.yarns.forEach(yarn => yarn.draw(this.context));
    }

    drawCorkboardTexture() {
        const img = new Image();
        img.src = 'path/to/corkboard-texture.png'; // Replace with actual texture path
        img.onload = () => {
            this.context.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        };
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', this.startPanHandler.bind(this));
        this.canvas.addEventListener('mousemove', this.panHandler.bind(this));
        this.canvas.addEventListener('mouseup', this.endPanHandler.bind(this));
        this.canvas.addEventListener('dblclick', this.addStickyNote.bind(this));
    }

    startPanHandler(event) {
        this.isPanning = true;
        this.startPan.x = event.clientX - this.offsetX;
        this.startPan.y = event.clientY - this.offsetY;
    }

    panHandler(event) {
        if (this.isPanning) {
            this.offsetX = event.clientX - this.startPan.x;
            this.offsetY = event.clientY - this.startPan.y;
            this.draw();
        }
    }

    endPanHandler() {
        this.isPanning = false;
    }

    addStickyNote(event) {
        const x = event.clientX - this.offsetX;
        const y = event.clientY - this.offsetY;
        const content = prompt("Enter sticky note content:");
        if (content) {
            const note = new StickyNote(x, y, content);
            this.stickyNotes.push(note);
            this.saveNotes();
            this.draw();
        }
    }

    removeStickyNote(note) {
        this.stickyNotes = this.stickyNotes.filter(n => n !== note);
        this.saveNotes();
        this.draw();
    }
}

export default Board;