# Currency Converter

A live currency converter web app with a real-time news feed, built with HTML, CSS, and vanilla JavaScript.

## Features

- Convert between 40+ currencies using live exchange rates
- 7-day historical rate chart for major currency pairs
- Conversion history saved in the browser (localStorage)
- Copy result to clipboard
- BBC Business news feed scattered in the background
- Responsive design (mobile friendly)

## Files

| File | Purpose |
|------|---------|
| `currency-converter.html` | Page structure |
| `style.css` | All styling |
| `script.js` | Converter logic |
| `news.js` | News feed logic |
| `CurrencyConverter.java` | Original Java CLI version |

## APIs Used

- [ExchangeRate-API](https://www.exchangerate-api.com/) — live exchange rates (free, no key required)
- [Frankfurter](https://www.frankfurter.app/) — 7-day historical rates (free, no key required)
- [rss2json](https://rss2json.com/) — converts BBC Business RSS feed to JSON (free, no key required)

## How to Run

Open `currency-converter.html` in any browser. No server or installation required.

For local development with live reload, use the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) VS Code extension.

## Live Demo

Hosted on GitHub Pages: [View Live](https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/currency-converter.html)
