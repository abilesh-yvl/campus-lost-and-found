# Found It — Campus Lost & Found

A lightweight web app for posting and finding lost items on campus. Post what you lost or found, search and filter by item, and message the other student directly — no notice boards, no guessing.

## Features

- **Post items** — report something as lost or found, with a photo, category, description, and contact details
- **Search & filter** — search by keyword, filter by status (lost / found / returned) or category, and sort by newest, oldest, or name
- **Item detail view** — see full details for a post and reveal the reporter's contact info on demand, with one-tap copy to clipboard
- **Mark as returned** — close out a post once an item is reunited with its owner, with a confirm step to prevent accidental taps
- **Data persistence** — posts are saved to the browser's local storage, so they're still there when you come back
- **Keyboard shortcuts** — press `/` to jump to search, `Esc` to close any open panel
- **Accessible & responsive** — keyboard-navigable cards, visible focus states, and a layout that adapts down to mobile

## Tech stack

Plain HTML, CSS, and JavaScript — no build step, no framework, no backend. Data lives in the browser's `localStorage`.

## Getting started

Clone the repo and open `index.html` in a browser:

```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
open index.html   # or just double-click the file
```

No installation or build step required.

### Deploying with GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set the source to **Deploy from a branch**, pick your default branch and the `/ (root)` folder.
4. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

## Project structure

```
.
├── index.html      # Markup
├── styles.css      # Styling
├── script.js       # App logic (state, rendering, filters, drawers)
├── favicon.svg
└── README.md
```

## Notes

This is a front-end-only demo: there's no server, and posted data — including phone numbers entered into the report form — stays in the visitor's own browser rather than being sent anywhere. Don't use it to collect or store real contact information for other people without their knowledge.

## License

Released under the [MIT License](LICENSE).
