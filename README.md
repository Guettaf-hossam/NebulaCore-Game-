# NEBULA CORE · Green Holo Hackgame

A browser-based terminal puzzle game set inside the "Nebula Core" digital ark.
Solve ciphers, number sequences and steganography riddles to purge the viral entity **Azathoth**.

Built with vanilla HTML/CSS/JS and [Three.js](https://threejs.org/) (loaded from a CDN).

## Run locally

No build step needed. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Project structure

```
.
├── index.html      # page markup
├── css/
│   └── style.css   # all styles
├── js/
│   └── main.js     # game logic, Three.js globe, terminal
├── .gitignore
└── README.md
```

## Deploy on GitHub Pages

1. Push the repo to GitHub.
2. Settings → Pages → Source: `main` branch, `/ (root)`.
3. Your game will be live at `https://<username>.github.io/<repo>/`.

## Credits

Created by Rem and Mena.
