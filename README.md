# Card Club

A browser-based card night for friends. Five playable games, 8-character room codes, invite links, private hands, host-validated moves, table chat, and practice bots. Responsive on mobile and desktop.

## Games

- Color Clash: Uno-style color matching, wilds, reverse, skip, draw two/four; mixed +2/+4 stacking across colors, with the full penalty paid by the player who draws. Original visual design, not affiliated with UNO or Mattel.
- Poker: five-card draw, 5-chip ante, two fixed 10-chip betting rounds (3 raises maximum), one draw of up to 3 cards, ranked showdown and split pots. Each hand resets to 100 play chips. No money.
- Go Fish: collect all 13 books, with correct ask-again and lucky-draw turns.
- Scum: matching-rank climbing with passes and President-to-Scum finish order. Independent hands, no rank trading.
- Crazy Eights: suit/rank matching and chosen-suit wild eights.

In-app Rules explain the house rules before playing.

## Run

Node.js 22+ recommended.

```sh
npm ci
npm run dev
npm test
npm run build
```

## Multiplayer

The host runs an authoritative game engine in their browser. PeerJS Cloud provides WebRTC signaling; hands and actions travel over encrypted direct WebRTC data connections. Clients receive only their own cards and public state. No login or backend credentials required. A host can see all hands by inspecting their own browser memory; this is for casual play among trusted friends.

The host **must keep the tab open**. Rooms live in memory and disappear on host refresh/close. Guests can rejoin the same seat using the same code in the same tab (session token). Rooms admit new players only in the lobby, maximum eight (six for Poker/Go Fish). The host can remove disconnected seats in the lobby. This version has no host migration, persistent rooms, or TURN relay. Some corporate/mobile networks with restrictive NAT/firewalls may block peer connections; try another network. PeerJS Cloud availability affects room creation/joining. Practice mode works without signaling.

Chat and nicknames are rendered as escaped text. Player identity is bound to a host-issued connection and a per-tab reconnect token. Bots are clearly labeled. No analytics or account system; nickname saved locally and guest reconnect tokens stored per tab. Never use play chips for real-money gambling.

## Hosting

GitHub Actions tests, builds, and deploys `dist` to GitHub Pages on pushes to main. Set repository Settings → Pages → Source to GitHub Actions. Vite uses relative asset paths for repository subpaths.

For Vercel, import this repository, select Vite, build with `npm run build`, and publish `dist`. No environment variables are required.

## Verification

`npm test` checks rules, turn validation, secrecy of guest views, poker rankings/chip conservation, and repeated complete games using legal bot moves. Browser checks cover desktop/mobile layout, practices, dialog behavior and two-client room connectivity.

Card dealing, draws, plays and Go Fish transfers animate between the stock, hands and table. Opponent draws use card backs only. Motion respects the device’s reduced-motion preference.
