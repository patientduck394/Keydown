# Keydown

**Keydown** is the formatting language of [Radii Office](https://radii-office.com). Instead of clicking buttons, you type short tags around your text and it turns into glossy chips, highlights, headings, tables, math, working applets and more.

```
# A title
A #C#cyan chip# and **bold**, =B=a gel orb=B=, $x^2 + 1$, and a [badge]{badge New | green}
```

Keydown is public domain (CC0 1.0 or the Unlicense, your choice), and it works with no build step.

## Use it on a web page

One file, styles included, nothing else to load:

```html
<script src="dist/Keydown.js"></script>

<!-- drawn automatically -->
<div data-keydown>#G#Hello# **world**! =B=Gel orb=B=</div>

<!-- a live editor: tags format as you type -->
<div data-keydown contenteditable></div>
```

From JavaScript:

```js
Keydown.render('# Title\n#R#highlight##')   // Keydown text to HTML
Keydown.toText(htmlOrElement)               // HTML back to Keydown text
Keydown.editor(element)                     // a live editor (Enter or Space formats, Un-format, Skills...)
```

Open `examples/index.html` and `examples/editor.html` in a browser to try it.

## Use it in Svelte

`svelte/` holds 32 components (KeydownText, KeydownEditor, KeydownBox, KeydownChip, KeydownGuide, KeydownDoc, KeydownAnnotate, KeydownSandbox, KeydownMath, KeydownTable, KeydownTabs and more). They sit next to `KeydownBox.svelte`, which carries the engine and every style, so copy the folder as it is:

```svelte
<script>
  import KeydownText from './svelte/KeydownText.svelte';
</script>

<KeydownText>
  # Hello
  #G#chip# and **bold**
</KeydownText>
```

## What is in here

| Folder | What it is |
|---|---|
| `dist/Keydown.js` | all of Keydown in one file (about 4.5 MB, mostly its 4,000+ styles) |
| `svelte/` | the Svelte 5 components |
| `docs/` | the Keydown article (`keydown.kd`) and the components article, written in Keydown itself |
| `examples/` | small pages that use `dist/Keydown.js` |

## Where the source lives

Keydown is built from the Radii Office sources (`keydown-doc.js`, `keydown.js`, `latex.js`, `annotate-ink.js` and the stylesheets) by `scripts/build_keydown_js.mjs` in [Radii-Office](https://github.com/patientduck394/Radii-Office), so a fix made there lands here the next time `dist/` is rebuilt. Math is drawn by KaTeX, loaded from a CDN the first time an equation shows up.

## License

Public domain: CC0 1.0 or the Unlicense (see `LICENSE`). Badge icons come from Vadivam (MIT, see `NOTICE.md` and `LICENSE-MIT.txt`).
