# NIGHT SHIFT — Co-op Horror Prototype

Browser-first 3D cooperative horror prototype. This is an early playable foundation, not a finished commercial game.

## Requirements
- Node.js 18+ (20 LTS recommended)
- Internet access on first load for Three.js CDN
- For online play between different networks: deploy the Node server to a host that supports WebSockets and HTTPS/WSS.

## Run locally
1. Install Node.js.
2. Extract this folder.
3. Open a terminal in the folder.
4. Run `npm install`
5. Run `npm start`
6. Open `http://localhost:8080`

To test with a friend on the same Wi-Fi, use your computer's local IP and port 8080, and allow Node through your firewall. For friends on different networks, deploy it to a public host with WebSocket support. Don't share private server credentials.

## Controls
- Desktop: WASD/arrow keys to move, click game to capture mouse, mouse to look, E to collect.
- Mobile: directional buttons to move; tap LOOK MODE then drag the game area to look; COLLECT to pick up nearby evidence.
- Create a room and send the 4-character code to friends. Max 4 players.

## Important prototype limits
- Multiplayer currently synchronizes room membership, player positions, and evidence collection.
- This first build uses simple placeholder geometry and a basic stalking enemy.
- No account system, matchmaking, voice chat, anti-cheat, persistent progress, or production security.
- Room codes are temporary and rooms disappear when everyone leaves.
- For a public release, add server-side validation/rate limits, authoritative movement and item-distance checks, reconnection handling, and hosting monitoring.

## Build an Android APK (Capacitor wrapper)
You need Android Studio, Android SDK, and a JDK supported by your installed Android Gradle Plugin.

1. Copy `public/` to a web app folder named `www/` (the client expects to be served from the same origin as the WebSocket server, so see note below).
2. In a separate wrapper folder:
   ```bash
   npm init -y
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init "Night Shift" "com.example.nightshift"
   ```
3. Configure Capacitor's `webDir` as `www`, then:
   ```bash
   npx cap add android
   npx cap open android
   ```
4. Build > Build APK in Android Studio.

**Online APK note:** an APK cannot use `localhost` to reach a server on your public host. Configure the client to connect to your deployed `wss://YOUR-HOST` WebSocket endpoint and serve the Three.js dependency reliably. Use HTTPS/WSS for production. A Capacitor wrapper alone does not deploy the multiplayer server; the server must be hosted separately.

## Architecture
- `server.js`: static web server + WebSocket room server.
- `public/index.html`: menu and HUD.
- `public/game.js`: Three.js scene, controls, evidence, other players.
- `public/style.css`: responsive UI.

## Suggested next milestones
1. Fix server-side proximity checks for evidence collection and add proper collision.
2. Improve mobile look controls and add audio/flashlight battery.
3. Add a proper monster state machine, hiding places, jumpscares (non-graphic).
4. Build a production-ready mobile wrapper and deploy server.
