<!--
  KeydownSplit.svelte: Keydown text on one side, the formatted result on the other, updating as you type!

  <script>
    import KeydownSplit from './KeydownSplit.svelte';
    let post = $state('# Title\nWrite **Keydown** here, with #Y.marker(marks) and $x^2$!');
  </script>
  <KeydownSplit bind:value={post} height="320px" />

  Props:
    value     Keydown text, bindable
    vertical  true: text on top, preview below (default false: side by side; narrow screens stack anyway)
    height    the height of each side (default '300px')
    delay     milliseconds to wait after typing before redrawing (default 150)
    onchange  called with the text each time it changes
    class, style go onto the outer box.
  Needs KeydownText.svelte, KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import KeydownText from './KeydownText.svelte';
    import { mathWriteBack } from './KeydownCore.js';

    let { value = $bindable(''), vertical = false, height = '300px', delay = 150, onchange = undefined, class: className = '', style = undefined } = $props();
    let shown = $state(value);
    let timer = 0;
    $effect(() => {
        const v = value;
        clearTimeout(timer);
        timer = setTimeout(() => { shown = v; }, delay);
        return () => clearTimeout(timer);
    });
</script>

<div class="kds {className}" class:kds-v={vertical} {style} style:--kds-h={height}>
    <textarea class="kds-src" bind:value spellcheck="false" aria-label="Keydown text" oninput={() => { if (typeof onchange === 'function') onchange(value); }}></textarea>
    <div class="kds-out" aria-label="Preview" aria-live="polite" use:mathWriteBack={{ get: () => value, set: (t) => { value = t; if (typeof onchange === 'function') onchange(t); } }}><KeydownText text={shown} /></div>
</div>

<style>
    .kds { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); border: 1px solid rgba(2, 132, 199, 0.35); border-radius: 14px; overflow: hidden; background: #fff; }
    .kds-v { grid-template-columns: minmax(0, 1fr); }
    .kds-src { box-sizing: border-box; width: 100%; height: var(--kds-h); margin: 0; border: 0; border-right: 1px solid rgba(2, 132, 199, 0.25); padding: 12px 14px; resize: none; outline: none; font: 13px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; background: #fbfdff; color: #0f172a; }
    .kds-v .kds-src { border-right: 0; border-bottom: 1px solid rgba(2, 132, 199, 0.25); }
    .kds-out { height: var(--kds-h); overflow: auto; padding: 12px 16px; box-sizing: border-box; }
    @media (max-width: 640px) {
        .kds { grid-template-columns: minmax(0, 1fr); }
        .kds-src { border-right: 0; border-bottom: 1px solid rgba(2, 132, 199, 0.25); }
    }
</style>
