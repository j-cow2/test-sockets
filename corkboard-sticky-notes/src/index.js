const canvas = document.getElementById('corkboard');
const ctx = canvas.getContext('2d');
const notes = [];
let isPanning = false;
let startX, startY;

function init() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    loadNotes();
    drawBoard();
    drawNotes();
    setupEventListeners();
}

function setupEventListeners() {
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('dblclick', onDoubleClick);
    window.addEventListener('resize', init);
}

function onMouseDown(event) {
    const { offsetX, offsetY } = event;
    if (!isNoteClicked(offsetX, offsetY)) {
        isPanning = true;
        startX = offsetX;
        startY = offsetY;
    }
}

function onMouseUp() {
    isPanning = false;
}

function onMouseMove(event) {
    if (isPanning) {
        const { offsetX, offsetY } = event;
        const dx = offsetX - startX;
        const dy = offsetY - startY;
        ctx.translate(dx, dy);
        startX = offsetX;
        startY = offsetY;
        drawBoard();
        drawNotes();
    }
}

function onDoubleClick(event) {
    const { offsetX, offsetY } = event;
    const note = createStickyNote(offsetX, offsetY);
    notes.push(note);
    saveNotes();
    drawBoard();
    drawNotes();
}

function isNoteClicked(x, y) {
    return notes.some(note => note.isClicked(x, y));
}

function createStickyNote(x, y) {
    const content = prompt("Enter note content:");
    return new StickyNote(x, y, content);
}

function drawBoard() {
    // Draw corkboard texture here
}

function drawNotes() {
    notes.forEach(note => note.draw(ctx));
}

function loadNotes() {
    const savedNotes = loadNotesFromStorage();
    savedNotes.forEach(noteData => {
        const note = new StickyNote(noteData.x, noteData.y, noteData.content);
        notes.push(note);
    });
}

function saveNotes() {
    saveNotesToStorage(notes);
}

init();