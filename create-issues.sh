#!/usr/bin/env bash
# Creates all improvement issues on the GitHub repo.
# Prerequisites: gh auth login
set -euo pipefail

REPO="EliotGodard/fibbage-tribute"

gh issue create --repo "$REPO" \
  --title "Global game state breaks multiplayer" \
  --label "bug" \
  --body "$(cat <<'EOF'
## Problem

`agxgame.js` stores `questions` as a single module-level array. If two hosts create games simultaneously, they overwrite each other's question set.

## Suggested fix

Store game state in a `Map` keyed by `gameId` so each room has its own isolated state (questions, round counter, ploys, etc.).
EOF
)"

gh issue create --repo "$REPO" \
  --title "Fix package.json metadata (still says Anagrammatix)" \
  --label "chore" \
  --body "$(cat <<'EOF'
## Problem

`package.json` still references the original upstream project:

- `name`: "Anagrammatix"
- `description`: "Anagram Multiplayer Game"
- `repository.url`, `bugs.url`, `homepage`: all point to `ericterpstra/anagrammatix`

## Suggested fix

Update all fields to reflect "Fibbage Tribute" and point to `EliotGodard/fibbage-tribute`.
EOF
)"

gh issue create --repo "$REPO" \
  --title "External questions API may be dead (Heroku free tier sunset)" \
  --label "bug" \
  --body "$(cat <<'EOF'
## Problem

Questions are fetched from `fibbage-tribute-questions.herokuapp.com`. Heroku removed its free tier in November 2022, so this endpoint is likely down, which makes the game completely non-functional.

## Suggested fix

- Bundle a local set of questions as a fallback (e.g. a JSON file in the repo).
- Optionally keep the external API as a configurable option, but don't depend on it.
EOF
)"

gh issue create --repo "$REPO" \
  --title "No error feedback to players when question fetch fails" \
  --label "bug" \
  --body "$(cat <<'EOF'
## Problem

If the `fetch()` call for questions fails in `agxgame.js`, the error is only logged to the server console. The host and players see nothing — the game silently stalls.

## Suggested fix

Emit an error event to the room so the host screen can display a meaningful message (e.g. "Failed to load questions. Please try again.").
EOF
)"

gh issue create --repo "$REPO" \
  --title "XSS vulnerability: player names and ploys are not sanitized" \
  --label "security" \
  --body "$(cat <<'EOF'
## Problem

Player names and ploys are passed through Socket.IO and injected into the DOM via jQuery `.html()`. A player could submit `<script>alert(1)</script>` as their name or ploy and execute arbitrary JavaScript on all connected clients.

## Suggested fix

Sanitize all user input before rendering. Use `.text()` instead of `.html()` for user-supplied content, or apply HTML entity escaping server-side before broadcasting.
EOF
)"

gh issue create --repo "$REPO" \
  --title "Modernize to ES6+ and add a linter" \
  --label "enhancement" \
  --body "$(cat <<'EOF'
## Problem

The codebase uses ES5 throughout (var, function expressions, manual prototype patterns). There is no linter or formatter, making it easy to introduce bugs.

## Suggested improvements

- Convert to ES6+ (`const`/`let`, arrow functions, `async`/`await`, template literals).
- Add an ESLint config with a standard ruleset.
- Optionally add Prettier for consistent formatting.
EOF
)"

gh issue create --repo "$REPO" \
  --title "Add a test suite" \
  --label "enhancement" \
  --body "$(cat <<'EOF'
## Problem

There are no tests. `npm test` just starts the server.

## Suggested improvements

- Add a test framework (e.g. Jest or Mocha).
- Write unit tests for core game logic: scoring, shuffle, ploy aggregation, round progression.
- Update `npm test` to actually run the test suite.
EOF
)"

gh issue create --repo "$REPO" \
  --title "Update or remove vendored jQuery 2.0.2" \
  --label "enhancement" \
  --body "$(cat <<'EOF'
## Problem

jQuery 2.0.2 (2013) is vendored in `public/libs/`. It has known security vulnerabilities and is far behind current releases.

## Suggested fix

The jQuery usage is light (DOM selection, event binding, `.html()`/`.text()`, `.css()`). Either:
- Replace with vanilla JS (preferred — reduces bundle size to zero).
- Or update to jQuery 3.x via CDN.
EOF
)"

gh issue create --repo "$REPO" \
  --title "No reconnection handling for dropped players" \
  --label "enhancement" \
  --body "$(cat <<'EOF'
## Problem

If a player's connection drops mid-game, they are permanently lost. Socket.IO 4 supports automatic reconnection, but the app does not restore player state on reconnect.

## Suggested fix

- Track player state server-side by a persistent identifier (e.g. a cookie or reconnection token).
- On reconnect, restore the player to their room and current game phase.
- Optionally show a "reconnecting..." indicator on the client.
EOF
)"

gh issue create --repo "$REPO" \
  --title "Hardcoded port and API URL should be configurable" \
  --label "enhancement" \
  --body "$(cat <<'EOF'
## Problem

The server port (8080) is partially configurable via `$PORT`, but the external questions API URL is hardcoded in `agxgame.js`. Other settings like scoring values are in `config.json` but the API base URL is not.

## Suggested fix

Move the API base URL to `config.json` or environment variables so deployments can point to different question sources without modifying code.
EOF
)"

echo ""
echo "All 10 issues created successfully."
