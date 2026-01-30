# CLAUDE.md

## Project Overview

Fibbage Tribute is a multiplayer party game (inspired by Fibbage from JackBox Party Pack 2) built with Node.js, Express, and Socket.IO. One player hosts on a large screen while others join via mobile devices. Players submit fake answers ("ploys") to fill blanks in sentences, then vote on which answer is real.

## Tech Stack

- **Backend:** Node.js, Express 3.x, Socket.IO 0.9
- **Frontend:** jQuery 2.0.2, vanilla JS (ES5), Handlebars-style templates in HTML
- **External API:** Questions fetched from `fibbage-tribute-questions.herokuapp.com`

## Project Structure

```
index.js          # Express server entry point (port 8080 or $PORT)
agxgame.js        # Server-side game logic, Socket.IO event handlers
public/
  index.html      # Main HTML with <script> templates for UI screens
  app.js          # Client-side game logic (IO, App, Host, Player objects)
  config.json     # Game settings (scoring, rounds, languages)
  css/styles.css  # Responsive styles
  libs/           # Vendored JS libraries (jQuery, TextFit, FastClick)
```

## Running the Project

```bash
npm install
npm start        # runs: node index.js
```

Server starts at `http://127.0.0.1:8080`.

## Testing

There is no test suite. `npm test` just runs the server (`node index.js`).

## Key Architecture

- **Socket.IO event-driven:** Server (`agxgame.js`) and client (`public/app.js`) communicate via named events (e.g., `hostCreateNewGame`, `playerJoinGame`, `newQuestion`, `playerSendPloy`).
- **Dual-role client:** `app.js` uses a single `App` object with nested `Host` and `Player` sub-objects to handle both roles.
- **Template rendering:** UI screens are defined as `<script type="text/template">` blocks in `index.html` and swapped into `#gameArea` via jQuery.

## Code Conventions

- ES5 JavaScript (no transpilation or bundling)
- IIFE + jQuery ready wrapper in client code
- Namespace/object pattern (`IO`, `App`, `App.Host`, `App.Player`)
- Server exports functions via `exports.initGame`
- No linter or formatter configured
