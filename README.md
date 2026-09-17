# Bregan.nl — GitHub Pages website

A static, bilingual (English/German) corporate website for Bregan B.V. built to run directly on GitHub Pages with no AppDeploy, no paid hosting and no build step.

## Pages
- `index.html` — rich corporate homepage
- `products.html` — searchable/filterable product portfolio
- `product.html?id=...` — dynamic product details
- `solutions.html` — species and challenge-oriented feed solutions
- `about.html` — Bregan story, capabilities, worldwide/logistics and quality
- `contact.html` — inquiry form that prepares an email to `info@bregan.nl`
- `privacy.html` — static-site privacy notice

## Languages
EN/DE is controlled by `?lang=en` / `?lang=de` and remembered in local storage.

## Product data
All product content is centralized in `assets/js/data.js`. New product bag images can be added later by adding an `image` property to the relevant product object.

## Form behavior
GitHub Pages is static and cannot send email server-side on its own. To avoid dependence on a paid form backend, the site currently validates the inquiry, prepares a structured message, and opens the visitor's email application addressed to `info@bregan.nl`. The prepared message is also shown with a copy button as fallback.

## Publishing
GitHub repository: `idris6155/Bregan.nl`

Enable GitHub Pages from the `main` branch root in repository Settings → Pages. No build is required.

## Notes
- Existing Bregan public-site product information was used as the initial portfolio source and rewritten into a cleaner modern presentation.
- Current Bregan brand direction: orange primary, Dutch blue/navy secondary, bright technical backgrounds.
- Replace remote legacy Bregan hero/product image URLs with final owned assets when the new product bag images are supplied.
