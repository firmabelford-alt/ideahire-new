# Gambit — saved homepage marketplace design

The user named this design **gambit** on 2026-11-01. When they ask to return to
"gambit", restore this marketplace panel's presentation from the snapshot below.

- Repository: `firmabelford-alt/ideahire-new`
- Checkpoint branch: `design/gambit`
- Immutable commit: `11ed891cde9ee813f6bf8be061550a2b10ed3465`
- `src/HomeMarketplace.jsx`: blob `49d7333eae2fa593b5f7d26f5a1c46251e964706`
- `src/HomeMarketplace.css`: blob `429f5c15ced933f49ce1df9d36083c2bafd965d3`

Appearance: a single rounded dark hero with the canonical flat IH mark,
"Twój pomysł. Właściwi ludzie.", a joined white pair of navigation buttons, and
an attached white project preview. On desktop the preview sits on the right;
on mobile it follows the hero. The selected site palette remains authoritative.

Restore only the two presentation files, adapting their existing prop contract
if later homepage changes require it. Keep later changes to authentication,
data, accessibility, security, payments and other pages. Do not reset the whole
repository or move main back to the checkpoint commit. Build and check the
restored panel at mobile and desktop widths before deploying.
