<!--
  KeydownTabs.svelte: tabs whose labels and panels are Keydown!

  <script>
    import KeydownTabs from './KeydownTabs.svelte';
    let tabs = [
      { label: '#B(Overview)', text: '# Hello\nThe **first** panel, with =B=gel orbs=B=!' },
      { label: 'Details', text: 'More: $e^{i\\pi}+1=0$ and #Y.marker(marks)!' }
    ];
    let open = $state(0);
  </script>
  <KeydownTabs {tabs} bind:active={open} />

  Props: tabs ([{ label, text }]: label is one line of Keydown, text a whole Keydown panel), active (bindable index),
         look ('aero' default, or 'pool'), onchange(index), class, style.
  Keyboard: arrow keys move between tabs, Home / End jump to the first / last (like any good tab bar).
  Needs KeydownText.svelte, KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import { onMount } from 'svelte';
    import KeydownText from './KeydownText.svelte';
    import { engine } from './KeydownCore.js';

    let { tabs = [], active = $bindable(0), look = 'aero', onchange = undefined, class: className = '', style = undefined } = $props();
    let K = $state(null);
    let bar = $state();
    const uid = 'kdt' + Math.random().toString(36).slice(2, 8);
    onMount(() => { K = engine(); });
    function pick(i) {
        if (i < 0 || i >= tabs.length) return;
        active = i;
        if (typeof onchange === 'function') onchange(i);
    }
    function keys(e) {
        const n = tabs.length;
        let i = active;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') i = (active + 1) % n;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') i = (active - 1 + n) % n;
        else if (e.key === 'Home') i = 0;
        else if (e.key === 'End') i = n - 1;
        else return;
        e.preventDefault();
        pick(i);
        const b = bar && bar.querySelectorAll('[role="tab"]')[i];
        if (b) b.focus();
    }
</script>

<div class="kdtabs kdtabs-{look} {className}" {style}>
    <div class="kdtabs-bar" role="tablist" bind:this={bar} tabindex="-1" onkeydown={keys}>
        {#each tabs as t, i (i)}
            <button type="button" role="tab" id={uid + '-t' + i} aria-controls={uid + '-p' + i} aria-selected={active === i} tabindex={active === i ? 0 : -1} onclick={() => pick(i)}>
                {#if K}{@html K.doc.inlineHtml(String(t.label || 'Tab ' + (i + 1)))}{:else}{t.label}{/if}
            </button>
        {/each}
    </div>
    {#each tabs as t, i (i)}
        <div class="kdtabs-panel" role="tabpanel" id={uid + '-p' + i} aria-labelledby={uid + '-t' + i} hidden={active !== i}>
            {#if active === i}<KeydownText text={t.text || ''} />{/if}
        </div>
    {/each}
</div>

<style>
    .kdtabs { border-radius: 16px; overflow: hidden; border: 1px solid var(--kdtabs-line); background: #fff; box-shadow: 0 6px 18px rgba(3, 105, 161, 0.12); }
    .kdtabs-aero { --kdtabs-a: #38bdf8; --kdtabs-b: #0284c7; --kdtabs-line: rgba(2, 132, 199, 0.35); --kdtabs-bg: linear-gradient(180deg, #f0f9ff, #e0f2fe); --kdtabs-ink: #075985; }
    .kdtabs-pool { --kdtabs-a: #22d3ee; --kdtabs-b: #f97316; --kdtabs-line: rgba(14, 165, 233, 0.4); --kdtabs-bg: linear-gradient(180deg, #ecfeff, #cffafe); --kdtabs-ink: #0e7490; }
    .kdtabs-bar { display: flex; gap: 4px; padding: 6px 6px 0; background: var(--kdtabs-bg); border-bottom: 1px solid var(--kdtabs-line); overflow-x: auto; }
    .kdtabs-bar button { font: 700 13px system-ui, sans-serif; border: 1px solid transparent; border-bottom: 0; background: none; color: var(--kdtabs-ink); padding: 7px 14px; border-radius: 10px 10px 0 0; cursor: pointer; white-space: nowrap; }
    .kdtabs-bar button:hover { background: rgba(255, 255, 255, 0.6); }
    .kdtabs-bar button[aria-selected='true'] { background: #fff; border-color: var(--kdtabs-line); box-shadow: inset 0 3px 0 var(--kdtabs-a); margin-bottom: -1px; }
    .kdtabs-pool .kdtabs-bar button[aria-selected='true'] { box-shadow: inset 0 3px 0 var(--kdtabs-b); }
    .kdtabs-bar button:focus-visible { outline: 2px solid var(--kdtabs-b); outline-offset: -2px; }
    .kdtabs-panel { padding: 14px 18px; }
</style>
