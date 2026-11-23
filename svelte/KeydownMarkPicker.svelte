<!--
  KeydownMarkPicker.svelte: every Annotate style, drawn for real in the color you pick, to choose one!

  <script>
    import KeydownMarkPicker from './KeydownMarkPicker.svelte';
    import KeydownMark from './KeydownMark.svelte';
    let style = $state('halo'), color = $state('blue');
  </script>
  <KeydownMarkPicker bind:style bind:color onpick={(m) => console.log(m.wrap('Hello'))} />
  <KeydownMark {style} {color}>Hello</KeydownMark>

  onpick receives { style, color, code, open, close, tag, wrap(words) }: wrap('Hi') gives '#B.halo(Hi)'.
  Props: style and color (bindable), sample (the preview words, default 'Aa marks'), columns (default 3), class.
  Needs KeydownMark.svelte, KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import { onMount } from 'svelte';
    import { engine } from './KeydownCore.js';
    import { MARK_STYLES, MARK_COLORS, markCode, markTag } from './KeydownMark.svelte';

    let { style = $bindable('highlight'), color = $bindable('yellow'), sample = 'Aa marks', columns = 3, onpick = undefined, class: className = '' } = $props();

    const SWATCH = { R: '#ef4444', O: '#f97316', GL: '#ea9f08', Y: '#ead708', L: '#84cc16', G: '#10b981', TU: '#30e5cd', T: '#06b6d4', C: '#30d3e5', B: '#3b82f6', PR: '#a855f7', PK: '#ec4899', SL: '#94a3b8' };
    let K = $state(null);
    onMount(() => { K = engine(); });
    const code = $derived(markCode(color));
    function pick(s) {
        style = s;
        const open = s === 'ink' ? '#' + code + '(' : '#' + code + '.' + s + '(';
        if (typeof onpick === 'function') onpick({ style: s, color, code, open, close: ')', tag: open + ')', wrap: (w) => markTag(s, color, w) });
    }
    function pickColor(c) { color = MARK_COLORS.find(([k]) => k === c)[1]; }
</script>

<div class="kdmp {className}">
    <div class="kdmp-colors" role="radiogroup" aria-label="Color">
        {#each MARK_COLORS as [k, n] (k)}
            <button type="button" role="radio" aria-checked={code === k} title={n + ' (' + k + ')'} style:background={SWATCH[k]} onclick={() => pickColor(k)}></button>
        {/each}
    </div>
    <div class="kdmp-grid" style:grid-template-columns={'repeat(' + columns + ', minmax(0, 1fr))'} role="listbox" aria-label="Annotate style">
        {#each MARK_STYLES as s (s)}
            <button type="button" role="option" aria-selected={style === s} class="kdmp-item" onclick={() => pick(s)} title={markTag(s, color, '…')}>
                <span class="kdmp-prev">{#if K}{@html K.doc.inlineHtml(markTag(s, color, sample))}{:else}{sample}{/if}</span>
                <span class="kdmp-name">{s}</span>
            </button>
        {/each}
    </div>
</div>

<style>
    .kdmp { border: 1px solid rgba(2, 132, 199, 0.3); border-radius: 14px; background: #fff; padding: 10px; }
    .kdmp-colors { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 10px; }
    .kdmp-colors button { width: 24px; height: 24px; border-radius: 50%; border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.25); cursor: pointer; padding: 0; }
    .kdmp-colors button[aria-checked='true'] { box-shadow: 0 0 0 3px #0284c7; }
    .kdmp-grid { display: grid; gap: 6px; max-height: 360px; overflow: auto; padding: 2px; }
    .kdmp-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 6px 6px; border: 1px solid rgba(148, 163, 184, 0.45); border-radius: 10px; background: #fff; cursor: pointer; font: 14px system-ui, sans-serif; color: #0f172a; min-width: 0; }
    .kdmp-item:hover { border-color: #38bdf8; }
    .kdmp-item[aria-selected='true'] { border-color: #0284c7; box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.3); }
    .kdmp-prev { line-height: 1.9; white-space: nowrap; }
    .kdmp-name { font-size: 11px; color: #64748b; font-family: ui-monospace, Menlo, monospace; }
</style>
