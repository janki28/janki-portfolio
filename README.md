# Janki Patel: portfolio (version 1)

A hand-coded static site. No build step, no framework, no dependencies.
Light theme (sun, rose scroller, sparkle trail) and dark theme (moon, owl scroller, star trail).

## Run it in VS Code

1. Open this folder in VS Code (`File > Open Folder`).
2. Install the recommended extension **Live Server** (VS Code will offer it).
3. Right-click `index.html` and choose **Open with Live Server**.

No VS Code extension? In a terminal inside this folder run `python3 -m http.server 8000` and open http://localhost:8000.

## Structure

```
index.html            Home, one scrolling page: hero > 3 projects (Explore more) > flip postcard > polaroids > Contact
work.html             Projects: equal-size cards, filter chips
about.html            Flip postcard (landmark front, you + message on the back) and polaroids
contact.html          Footer-style contact band: email + LinkedIn / Gmail logos
projects/             One case study page per project (same template)
css/tokens.css        Colours, fonts, spacing. Light + dark values live here
css/base.css          Reset, header/footer, buttons, cursor, scroll indicator
css/pages.css         Page-specific styles
js/theme.js           Sun/moon toggle, remembers choice, follows system theme at first
js/cursor.js          Sun/moon cursor + sparkle/star trail
js/scroller.js        Rose/owl scroll indicator
js/filter.js          Work page filter chips
js/gallery.js         Tilted auto-scrolling gallery on case studies (never pauses)
js/home.js            Home page: sticky header, reveal-on-scroll, nav highlight
js/postcard.js        Tap-to-flip for the About postcard on touch screens (hover flips it on desktop)
assets/images/        Your photos (see assets/images/README.md)
```

## Things to fill in (search the project for `[` and `your@email.com`)

- [ ] `assets/resume.pdf` (the Resume buttons point here)
- [ ] Photos and your autograph (`assets/images/signature.png`, transparent PNG in dark ink): see `assets/images/README.md`
- [ ] Postcard front photos: they load from Wikimedia Commons for now. Download the originals (see `assets/images/CREDITS.md`) or use your own Grand Canyon / Taj Mahal photos
- [ ] `your@email.com` in `build` pages: search the project for it (index, about, contact). It also feeds the Gmail link
- [ ] Logos: add `assets/icons/linkedin.svg` and `assets/icons/gmail.svg` (or .png). They replace the dashed placeholder circles on the postcard and the Contact page
- [ ] Case study text in `projects/*.html`: replace the grey prompt text. Role / team / tools / status are filled for the ones I knew. Check them, and the ones marked `[ ... ]`
- [ ] Postcard text and polaroid captions in `about.html`

## Customising

- **Colours / fonts:** `css/tokens.css`.
- **Gallery tilt per project:** in a case study, `<div class="band" style="--tilt: -12deg" ...>`. Default is -27deg.
- **Add a project:** copy a file in `projects/`, add a card in `work.html` (copy one `<a class="card">`), and update the "Next project" link at the bottom of the case studies.
- **Cursor / trail:** sizes, spacing and the 40-particle cap are at the top of `js/cursor.js`.

## Notes

- Fonts (Instrument Serif, Inter, Caveat on About) load from Google Fonts. Everything else is local.
- `prefers-reduced-motion` turns off the trail, twinkles and gallery movement.
- The custom cursor only appears with a real mouse. Touch devices keep the trail under the finger and the toggle, rose and owl still work.
- The header and footer are repeated in each HTML file. If you change the nav, change it in all pages (search for `site-header`).

## Deploy (free)

Drag this folder into Netlify Drop, or push it to GitHub and enable GitHub Pages or Cloudflare Pages. Then add your real domain, set `<meta property="og:image">` to a 1200x630 image, and add Google Analytics before `</head>` if you want it.
