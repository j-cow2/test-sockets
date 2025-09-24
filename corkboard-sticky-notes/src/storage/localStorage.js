const API_BASE = '/api/state';

async function saveNotes(notes) {
    // Try writing notes into the server-side state, preserving other keys
    try {
        const res = await fetch(API_BASE);
        let state = {};
        if (res.ok) state = await res.json();
        state.notes = notes;
        const wr = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state)
        });
        if (!wr.ok) throw new Error('server write failed');
        return true;
    } catch (err) {
        // Fallback to localStorage
        try {
            localStorage.setItem('stickyNotes', JSON.stringify(notes));
            return true;
        } catch (e) {
            console.warn('Failed to save notes to server and localStorage', e);
            return false;
        }
    }
}

async function loadNotes() {
    try {
        const res = await fetch(API_BASE);
        if (res.ok) {
            const state = await res.json();
            return state.notes || [];
        }
    } catch (err) {
        console.warn('Failed to load notes from server, falling back to localStorage');
    }

    try {
        const notes = localStorage.getItem('stickyNotes');
        return notes ? JSON.parse(notes) : [];
    } catch (e) {
        console.warn('Failed to parse localStorage stickyNotes', e);
        return [];
    }
}

export { saveNotes, loadNotes };