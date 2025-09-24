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

export default StickyNote;