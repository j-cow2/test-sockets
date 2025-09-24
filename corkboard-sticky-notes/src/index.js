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
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
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

// Integrate resize interaction at the canvas level.
// This assumes you already have: canvas, notes array, requestDraw(), and (optionally) socket

import {
  isOnResizeHandle,
  startResize,
  resizeTo,
  endResize,
  drawResizeHandle
} from './canvas/stickyNote.js';

let resizingNote = null;
let pointerIdForResize = null;

canvas.addEventListener('pointerdown', (ev) => {
  // Convert screen coords to canvas coords if you have transforms / zoom
  const { x: cx, y: cy } = screenToCanvas(ev.clientX, ev.clientY); // adjust to your helper
  // find topmost note under pointer
  for (let i = notes.length - 1; i >= 0; i--) {
    const note = notes[i];
    if (isOnResizeHandle(note, cx, cy)) {
      // start resize for this note
      resizingNote = note;
      pointerIdForResize = ev.pointerId;
      startResize(note, cx, cy);
      canvas.setPointerCapture(ev.pointerId);
      ev.preventDefault();
      return;
    }
  }
  // ...existing pointerdown handlers (keep them)...
});

canvas.addEventListener('pointermove', (ev) => {
  if (!resizingNote || ev.pointerId !== pointerIdForResize) return;
  const { x: cx, y: cy } = screenToCanvas(ev.clientX, ev.clientY);
  resizeTo(resizingNote, cx, cy);
  requestDraw(); // redraw while resizing
  ev.preventDefault();
});

canvas.addEventListener('pointerup', (ev) => {
  if (!resizingNote || ev.pointerId !== pointerIdForResize) return;
  canvas.releasePointerCapture(ev.pointerId);
  endResize(resizingNote);
  // persist / broadcast the change
  if (typeof save === 'function') save(); // if your app has a save() for local state
  if (typeof socket !== 'undefined' && socket && resizingNote.id) {
    socket.emit('note:update', {
      id: resizingNote.id,
      width: resizingNote.width,
      height: resizingNote.height
    });
  }
  resizingNote = null;
  pointerIdForResize = null;
  ev.preventDefault();
});

// Ensure draw loop renders the handle for each note:
const oldDrawNotes = drawNotes; // replace as needed if your code has a drawNotes function
function drawNotesWithHandles(ctx) {
  oldDrawNotes(ctx);
  for (const n of notes) {
    drawResizeHandle(ctx, n);
  }
}
// replace your draw call with drawNotesWithHandles or integrate appropriately

init();