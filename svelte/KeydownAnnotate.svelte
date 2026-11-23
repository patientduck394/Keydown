<!--
  KeydownAnnotate.svelte: draw on top of anything with Bitbook's Annotate inks (Gel Ink, Felt Pen, Highlighter, Neon,
  Crayon, and every theme pack: Frutiger Aero 1-4, Poolside 1-4, Cosmic, Metallic)!

  <KeydownAnnotate bind:ink>
    <p>Anything goes in here: text, a picture, a card, a KeydownText...</p>
  </KeydownAnnotate>
  <button onclick={() => (ink = '')}>Clear my drawing</button>

  Press ✏️ Draw, pick an ink and a color on the ink bar, draw over the content, then press Done (or Esc). The drawing
  is saved as text in `ink`, so you can keep it (a database, localStorage, a form field) and give it back later:
  start with <KeydownAnnotate ink={saved}> and the drawing is there again.

  Props: ink (bindable text: the strokes, '' for none), drawing (bindable, true while the ink bar is open),
         button (show the ✏️ Draw button, default true), readonly (show the drawing, but no drawing), class.
  Methods (bind:this={a}): a.draw() starts drawing, a.done() ends it, a.clear() erases everything.
  Needs KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import { onMount, untrack } from 'svelte';
    import { prime } from './KeydownCore.js';

    let { children = undefined, ink = $bindable(''), drawing = $bindable(false), button = true, readonly = false, class: className = '' } = $props();
    let wrap = $state();
    let ready = $state(false);
    let shown = null;

    const AI = () => window.AnnotateInk;
    const layer = () => wrap && wrap.querySelector(':scope > svg.an-ink-layer');
    function show(text) {
        const old = layer(); if (old) old.remove();
        let list = [];
        try { list = text ? JSON.parse(text) : []; } catch (e) { list = []; }
        if (!Array.isArray(list) || !list.length || !AI()) return;
        const t = document.createElement('div');
        t.innerHTML = AI().layerHtml(list);
        const svg = t.firstElementChild;
        svg.setAttribute('width', Math.max(wrap.scrollWidth, wrap.clientWidth));
        svg.setAttribute('height', Math.max(wrap.scrollHeight, wrap.clientHeight));
        wrap.appendChild(svg);
    }
    export function draw() {
        if (!ready || readonly || !AI() || drawing) return;
        drawing = true;
        AI().start(wrap, { onStop: () => {
            const l = layer();
            const list = l ? AI().strokesOf(l) : [];
            shown = list.length ? JSON.stringify(list) : '';
            ink = shown;
            drawing = false;
        } });
    }
    export function done() { if (drawing && AI()) AI().stop(); }
    export function clear() { done(); ink = ''; }

    onMount(() => { prime(); ready = true; shown = ink; show(ink); return () => { if (drawing) done(); }; });
    // a drawing from outside (saved earlier, or cleared) is shown
    $effect(() => {
        const v = ink;
        if (!ready || v === shown) return;
        untrack(() => { shown = v; show(v); });
    });
</script>

<div class="kda {className}" bind:this={wrap}>
    {@render children?.()}
    {#if button && !readonly}
        <button type="button" class="kda-btn" class:on={drawing} title={drawing ? 'Done drawing' : 'Draw on this with Annotate inks'} onclick={() => (drawing ? done() : draw())}>{drawing ? '✔ Done' : '✏️ Draw'}</button>
    {/if}
</div>

<style>
    .kda { position: relative; }
    .kda-btn {
        position: absolute; top: 6px; right: 6px; z-index: 5; padding: 4px 12px; border-radius: 999px; cursor: pointer; font: 800 12px 'Segoe UI', system-ui, sans-serif;
        border: 1px solid #0369a1; background: linear-gradient(180deg, #ffffff, #d7effd); color: #075985; box-shadow: 0 1px 3px rgba(3, 105, 161, 0.35);
    }
    .kda-btn.on { background: linear-gradient(180deg, #86efac, #16a34a); border-color: #15803d; color: #052e16; }
</style>
