# Corkboard Sticky Notes

This project simulates a corkboard with sticky notes that can be placed, removed, and saved to local storage. Users can interact with the canvas to create a virtual workspace for their notes.

## Features

- **Sticky Notes**: Create, move, and delete sticky notes on the corkboard.
- **Corkboard Background**: A seamless corkboard texture serves as the background.
- **Red Yarn Connections**: Connect sticky notes with red yarn for organization.
- **Panning**: Click and drag to pan around the canvas.
- **Local Storage**: Sticky notes' positions and data are saved in the browser's local storage, allowing persistence across sessions.

## Project Structure

```
corkboard-sticky-notes
├── src
│   ├── index.js          # Main entry point of the application
│   ├── canvas
│   │   ├── board.js      # Handles corkboard drawing and sticky note management
│   │   ├── stickyNote.js  # Represents individual sticky notes
│   │   └── yarn.js       # Manages red yarn connections
│   ├── storage
│   │   └── localStorage.js # Functions for saving and retrieving notes
│   ├── styles
│   │   └── corkboard.css  # CSS styles for the corkboard and notes
│   └── utils
│       └── helpers.js     # Utility functions for common tasks
├── public
│   └── index.html        # Main HTML file with canvas element
├── package.json          # npm configuration file
└── README.md             # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd corkboard-sticky-notes
   ```
3. Install the dependencies:
   ```
   npm install
   ```

## Usage

1. Open `public/index.html` in your web browser.
2. Click on the canvas to create a sticky note.
3. Drag notes to reposition them.
4. Click on the edges of the canvas to pan around.
5. Notes will be saved automatically in local storage.

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes. 

## License

This project is open-source and available under the MIT License.