class StickyNote {
    constructor(x, y, content) {
        this.x = x;
        this.y = y;
        this.content = content || "New Note";
        this.width = 100;
        this.height = 100;
        this.color = "yellow";
        this.isDragging = false;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = "black";
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = "black";
        ctx.fillText(this.content, this.x + 10, this.y + 20);
    }

    isMouseOver(mouseX, mouseY) {
        return mouseX > this.x && mouseX < this.x + this.width &&
               mouseY > this.y && mouseY < this.y + this.height;
    }

    startDragging(mouseX, mouseY) {
        this.isDragging = true;
        this.offsetX = mouseX - this.x;
        this.offsetY = mouseY - this.y;
    }

    drag(mouseX, mouseY) {
        if (this.isDragging) {
            this.x = mouseX - this.offsetX;
            this.y = mouseY - this.offsetY;
        }
    }

    stopDragging() {
        this.isDragging = false;
    }
}

// Add resize helper functions and draw hint for resize handle.

const RESIZE_HANDLE_SIZE = 12;
const MIN_NOTE_WIDTH = 40;
const MIN_NOTE_HEIGHT = 30;

function isOnResizeHandle(note, canvasX, canvasY) {
  // canvasX/Y are in canvas coordinates (same space as note.x/note.y)
  const localX = canvasX - note.x;
  const localY = canvasY - note.y;
  return (
    localX >= note.width - RESIZE_HANDLE_SIZE &&
    localX <= note.width + 2 &&
    localY >= note.height - RESIZE_HANDLE_SIZE &&
    localY <= note.height + 2
  );
}

function startResize(note, startCanvasX, startCanvasY) {
  note._resizing = {
    startCanvasX,
    startCanvasY,
    origWidth: note.width,
    origHeight: note.height
  };
}

function resizeTo(note, canvasX, canvasY) {
  if (!note._resizing) return;
  const newW = Math.max(MIN_NOTE_WIDTH, Math.round(canvasX - note.x));
  const newH = Math.max(MIN_NOTE_HEIGHT, Math.round(canvasY - note.y));
  note.width = newW;
  note.height = newH;
}

function endResize(note) {
  if (note._resizing) delete note._resizing;
}

// If your drawing code doesn't already draw a little visual affordance,
// draw a small triangle/box in the bottom-right so users know they can resize.
function drawResizeHandle(ctx, note) {
  const x = Math.round(note.x + note.width);
  const y = Math.round(note.y + note.height);
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.moveTo(x - RESIZE_HANDLE_SIZE, y);
  ctx.lineTo(x, y - RESIZE_HANDLE_SIZE);
  ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Export or attach these helpers so the rest of the client can use them.
// If this file exports an object/class, add these functions to the export accordingly.
// Example: module.exports = { drawStickyNote, isOnResizeHandle, startResize, resizeTo, endResize, drawResizeHandle };
export {
  isOnResizeHandle,
  startResize,
  resizeTo,
  endResize,
  drawResizeHandle
};