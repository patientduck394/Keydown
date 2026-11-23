<!--
  KeydownTooltip.svelte: words that show a Keydown-formatted bubble when you point at them (or tab to them)!

  <p>Water boils at <KeydownTooltip tip={'**100 °C** at sea level, *less* up a #B(mountain)!'}>100 degrees</KeydownTooltip>.</p>

  Props: tip (Keydown text for the bubble), place ('top' default or 'bottom'), look ('aero' or 'pool'), class.
  The words are focusable, and Escape hides the bubble (it follows the WAI-ARIA tooltip pattern).
  Needs KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import { onMount } from 'svelte';
    import { engine } from './KeydownCore.js';

    let { tip = '', place = 'top', look = 'aero', children = undefined, class: className = '' } = $props();
    let K = $state(null);
    let shown = $state(false);
    const uid = 'kdtt' + Math.random().toString(36).slice(2, 8);
    onMount(() => { K = engine(); });
</script>

<span class="kdtt kdtt-{look} kdtt-{place} {className}" role="button" tabindex="0" aria-describedby={uid}
    onmouseenter={() => (shown = true)} onmouseleave={() => (shown = false)} onfocus={() => (shown = true)} onblur={() => (shown = false)}
    onkeydown={(e) => { if (e.key === 'Escape') shown = false; }}>
    {#if children}{@render children()}{/if}
    <span class="kdtt-bubble" role="tooltip" id={uid} class:on={shown}>{#if K}{@html K.doc.inlineHtml(String(tip))}{:else}{tip}{/if}</span>
</span>

<style>
    .kdtt { position: relative; display: inline; border-bottom: 2px dotted var(--kdtt-line); cursor: help; outline: none; }
    .kdtt:focus-visible { background: rgba(56, 189, 248, 0.2); border-radius: 3px; }
    .kdtt-aero { --kdtt-line: #0ea5e9; --kdtt-a: #ffffff; --kdtt-b: #e0f2fe; --kdtt-edge: rgba(2, 132, 199, 0.5); }
    .kdtt-pool { --kdtt-line: #f97316; --kdtt-a: #ffffff; --kdtt-b: #cffafe; --kdtt-edge: rgba(14, 165, 233, 0.55); }
    .kdtt-bubble { position: absolute; left: 50%; z-index: 40; width: max-content; max-width: 280px; padding: 8px 12px; border-radius: 12px; font: 13px/1.45 system-ui, sans-serif; color: #0f172a; white-space: normal;
        background: linear-gradient(180deg, var(--kdtt-a), var(--kdtt-b)); border: 1px solid var(--kdtt-edge); box-shadow: 0 8px 20px rgba(3, 105, 161, 0.25);
        opacity: 0; pointer-events: none; transition: opacity 0.15s, transform 0.15s; }
    .kdtt-top .kdtt-bubble { bottom: calc(100% + 8px); transform: translate(-50%, 4px); }
    .kdtt-bottom .kdtt-bubble { top: calc(100% + 8px); transform: translate(-50%, -4px); }
    .kdtt-bubble.on { opacity: 1; transform: translate(-50%, 0); }
</style>
