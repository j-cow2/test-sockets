class Yarn {
    constructor(context) {
        this.context = context;
        this.connections = [];
    }

    addConnection(note1, note2) {
        this.connections.push({ note1, note2 });
    }

    removeConnection(note1, note2) {
        this.connections = this.connections.filter(conn => 
            !(conn.note1 === note1 && conn.note2 === note2) &&
            !(conn.note1 === note2 && conn.note2 === note1)
        );
    }

    draw() {
        this.context.strokeStyle = 'red';
        this.context.lineWidth = 2;

        this.connections.forEach(conn => {
            const { note1, note2 } = conn;
            this.context.beginPath();
            this.context.moveTo(note1.x + note1.width / 2, note1.y + note1.height / 2);
            this.context.lineTo(note2.x + note2.width / 2, note2.y + note2.height / 2);
            this.context.stroke();
        });
    }
}

export default Yarn;