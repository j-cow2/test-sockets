const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);
const PORT = Number(process.env.PORT) || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Exiting.`);
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});

const STATE_FILE = path.join(__dirname, 'state.json');

app.use(express.json({ limit: '5mb' }));

// Serve the public folder and other static assets from project root
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..')));

// Read state
app.get('/api/state', (req, res) => {
  fs.readFile(STATE_FILE, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') return res.json({});
      console.error('Failed to read state:', err);
      return res.status(500).json({ error: 'failed to read state' });
    }
    try {
      const json = JSON.parse(data || '{}');
      res.json(json);
    } catch (e) {
      console.error('Invalid JSON in state file, returning empty object', e);
      res.json({});
    }
  });
});

// Write state (merge incoming keys into existing state)
app.post('/api/state', (req, res) => {
  const incoming = req.body || {};
  fs.readFile(STATE_FILE, 'utf8', (err, data) => {
    let state = {};
    if (!err) {
      try { state = JSON.parse(data || '{}'); } catch (e) { state = {}; }
    }
    // Merge top-level keys: replace provided keys, keep others intact
    for (const key of Object.keys(incoming)) {
      state[key] = incoming[key];
    }
    fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8', err2 => {
      if (err2) {
        console.error('Failed to write state:', err2);
        return res.status(500).json({ error: 'failed to write state' });
      }
      // Broadcast merged keys to clients
      io.emit('state:merged', incoming);
      res.json({ ok: true, state });
    });
  });
});

// Notes endpoints: operate only on notes array
app.get('/api/notes', (req, res) => {
  fs.readFile(STATE_FILE, 'utf8', (err, data) => {
    let state = {};
    if (!err) {
      try { state = JSON.parse(data || '{}'); } catch (e) { state = {}; }
    }
    res.json(state.notes || []);
  });
});

app.post('/api/notes', (req, res) => {
  const note = req.body || {};
  fs.readFile(STATE_FILE, 'utf8', (err, data) => {
    let state = {};
    if (!err) {
      try { state = JSON.parse(data || '{}'); } catch (e) { state = {}; }
    }
    state.notes = state.notes || [];
    // Assign server-side id if not provided
    const id = note.id != null ? note.id : (Date.now() + Math.random());
    const newNote = Object.assign({}, note, { id });
    state.notes.push(newNote);
    fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8', err2 => {
      if (err2) {
        console.error('Failed to write state when adding note:', err2);
        return res.status(500).json({ error: 'failed to add note' });
      }
      // Emit creation event
      io.emit('note:created', newNote);
      res.status(201).json(newNote);
    });
  });
});

app.put('/api/notes/:id', (req, res) => {
  const id = isNaN(req.params.id) ? req.params.id : Number(req.params.id);
  const updates = req.body || {};
  fs.readFile(STATE_FILE, 'utf8', (err, data) => {
    let state = {};
    if (!err) {
      try { state = JSON.parse(data || '{}'); } catch (e) { state = {}; }
    }
    state.notes = state.notes || [];
    const idx = state.notes.findIndex(n => n.id === id || String(n.id) === String(id));
    if (idx === -1) return res.status(404).json({ error: 'note not found' });
    // Update only supplied fields
    state.notes[idx] = Object.assign({}, state.notes[idx], updates);
    fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8', err2 => {
      if (err2) {
        console.error('Failed to write state when updating note:', err2);
        return res.status(500).json({ error: 'failed to update note' });
      }
        // Emit update event
        io.emit('note:updated', state.notes[idx]);
        res.json(state.notes[idx]);
    });
  });
});

app.delete('/api/notes/:id', (req, res) => {
  const id = isNaN(req.params.id) ? req.params.id : Number(req.params.id);
  fs.readFile(STATE_FILE, 'utf8', (err, data) => {
    let state = {};
    if (!err) {
      try { state = JSON.parse(data || '{}'); } catch (e) { state = {}; }
    }
    state.notes = state.notes || [];
    const before = state.notes.length;
    state.notes = state.notes.filter(n => !(n.id === id || String(n.id) === String(id)));
    // Also remove yarns referencing this note id
    if (state.yarns && Array.isArray(state.yarns)) {
      state.yarns = state.yarns.filter(y => !( (y.fromType === 'note' && (y.from === id || String(y.from) === String(id))) || (y.toType === 'note' && (y.to === id || String(y.to) === String(id))) ));
    }
    if (state.notes.length === before) return res.status(404).json({ error: 'note not found' });
    fs.writeFile(STATE_FILE, JSON.stringify(state, null, 2), 'utf8', err2 => {
      if (err2) {
        console.error('Failed to write state when deleting note:', err2);
        return res.status(500).json({ error: 'failed to delete note' });
      }
        // Emit deletion event
        io.emit('note:deleted', { id });
        // Also notify yarns updated
        io.emit('yarns:updated', state.yarns || []);
        res.json({ ok: true });
    });
  });
});

// Socket.IO connection
io.on('connection', socket => {
  console.log('socket connected', socket.id);
  socket.on('disconnect', () => console.log('socket disconnected', socket.id));
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});
