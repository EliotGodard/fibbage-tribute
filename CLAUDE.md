# CLAUDE.md

## Project Overview

Fibbage Tribute is a real-time multiplayer party game inspired by Fibbage, built with Node.js, Express, and Socket.IO. Players join a host's game room, receive trivia questions, submit fake answers ("ploys"), then try to identify the real answer among the fakes. Points are awarded for correct guesses and for fooling other players.

## Tech Stack

- **Backend**: Node.js, Express 3.x, Socket.IO 0.9
- **Frontend**: jQuery 2.0.2, vanilla CSS3, Socket.IO client
- **No build step** — raw JS/CSS/HTML served statically from `public/`
- **No test framework** configured

## Project Structure

```
index.js              Express server entry point (~38 lines)
agxgame.js            Server-side game logic and Socket.IO event handlers (~259 lines)
package.json          Dependencies and scripts
public/
  index.html          HTML templates (script templates for each game screen)
  app.js              Client-side game logic (~890 lines) — IO, App, App.Host, App.Player namespaces
  config.json         Game configuration (players, rounds, scoring, languages)
  css/styles.css      Responsive Flexbox layout, CSS variables
  images/flags/       Language flag icons (en, fr)
  libs/               Vendored libraries (jQuery, textFit, FastClick)
```

## Key Commands

```sh
npm install           # Install dependencies
npm start             # Start server (node index.js)
node index.js         # Run server directly (port from $PORT or 8080)
```

## Environment Variables

| Variable   | Purpose                                        | Default    |
|------------|------------------------------------------------|------------|
| `PORT`     | Server listen port                             | `8080`     |
| `NODE_ENV` | API URL selection (`prod` = Heroku, else local) | (unset)   |

When `NODE_ENV` is `prod`, questions are fetched from `https://fibbage-tribute-questions.herokuapp.com`. Otherwise, it expects a local questions API at `http://localhost:3000`.

## Architecture

### Server (`index.js` + `agxgame.js`)

- Express serves static files from `public/`
- Socket.IO manages real-time game rooms
- `agxgame.js` exports `initGame(io)` which binds all socket event handlers
- Two event groups: **Host events** (create/start game, manage rounds) and **Player events** (join, submit ploy, vote)
- Questions fetched from an external REST API (`fibbage-tribute-questions`)

### Client (`public/app.js`)

Organized into four namespaces:
- **IO** — Socket.IO connection and event binding
- **App** — Shared state (`gameId`, `myRole`, `currentRound`), template caching, utilities
- **App.Host** — Host screen logic (game creation, language selection, player tracking, scoring, winner display)
- **App.Player** — Player screen logic (join flow, ploy submission, answer selection)

UI screens are defined as `<script type="text/template">` blocks in `index.html`.

### Game Flow

1. Host creates game (selects language) → unique game ID generated
2. Players join with name + game ID
3. Countdown → rounds begin
4. Each round: question shown → players submit ploys → all answers shuffled and displayed → players vote → scores updated
5. After all rounds → winner(s) displayed → restart option

### Scoring (`config.json`)

- Correct answer: **+10**
- Someone picks your ploy: **+5**
- Wrong answer: **-3**

## Code Conventions

- **No TypeScript, no linter, no formatter** configured
- JavaScript uses a mix of ES5 patterns (IIFEs, `var`) and some ES6 (`let`, `const`, template literals in server code)
- Client code uses jQuery for DOM manipulation
- CSS uses custom properties (e.g., `--answer-button-margin`) and Flexbox
- Font: Google Quicksand (300, 400, 700)

## Git Conventions

- Commit messages: lowercase, imperative or descriptive, concise
- Examples: `add language selection`, `fix text fit`, `use REST fibbage-tribute-questions API to get questions`

## Development Notes

- The project has **no tests** — `npm test` just runs the server
- The `.gitignore` only excludes `node_modules`
- The app requires the separate `fibbage-tribute-questions` API to be running (locally on port 3000 for dev)
- Multi-room support via Socket.IO rooms — each game gets its own room
- Mobile-optimized with FastClick and responsive CSS
