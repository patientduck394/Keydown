<!--
  KeydownCounter.svelte: live counts for a Keydown text (counted on the formatted words, so tags never count)!

  <KeydownCounter text={draft} />
  <KeydownCounter text={draft} show={['words', 'minutes']} goal={500} />

  Shows words, characters, characters without spaces, sentences, paragraphs, headings, marks (Annotate styles)
  and reading time. Props: text, show (which ones, default words / chars / sentences / minutes), wpm (reading
  speed, default 220), goal (a word goal: shows a progress bar), look ('aero' or 'pool'), class.
  Bind the numbers out with bind:counts.
  Needs KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import { onMount } from 'svelte';
    import { engine } from './KeydownCore.js';

    let { text = '', show = ['words', 'chars', 'sentences', 'minutes'], wpm = 220, goal = 0, look = 'aero', counts = $bindable({}), class: className = '' } = $props();
    let K = $state(null);
    onMount(() => { K = engine(); });
    const LABEL = { words: 'words', chars: 'characters', letters: 'without spaces', sentences: 'sentences', paragraphs: 'paragraphs', headings: 'headings', marks: 'marks', minutes: 'min read' };
    $effect(() => {
        const src = String(text || '');
        if (!K) return;
        const box = document.createElement('div');
        box.innerHTML = K.render(src);
        const plain = (box.textContent || '').replace(/​/g, '').trim();
        const words = plain ? plain.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length : 0;
        counts = {
            words,
            chars: plain.length,
            letters: plain.replace(/\s/g, '').length,
            sentences: (plain.match(/[^.!?]+[.!?]+/g) || []).length || (plain ? 1 : 0),
            paragraphs: src.split(/\n\s*\n|\n/).filter((l) => l.trim()).length,
            headings: box.querySelectorAll('h1, h2, h3, h4').length || (src.match(/^\s*#{1,4}\s/gm) || []).length,
            marks: box.querySelectorAll('mark').length,
            minutes: Math.max(words ? 1 : 0, Math.round(words / wpm))
        };
    });
    const pct = $derived(goal > 0 ? Math.min(100, Math.round(((counts.words || 0) / goal) * 100)) : 0);
</script>

<div class="kdcn kdcn-{look} {className}" aria-live="polite">
    {#each show as k (k)}
        <span class="kdcn-chip"><b>{(counts[k] || 0).toLocaleString()}</b> {LABEL[k] || k}</span>
    {/each}
    {#if goal > 0}
        <span class="kdcn-goal" title={(counts.words || 0) + ' of ' + goal + ' words'}><i style:width={pct + '%'}></i></span>
        <span class="kdcn-pct">{pct}%{pct >= 100 ? ' — goal reached!' : ''}</span>
    {/if}
</div>

<style>
    .kdcn { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font: 12.5px system-ui, sans-serif; }
    .kdcn-aero { --kc-a: #e0f2fe; --kc-b: #0284c7; --kc-ink: #075985; }
    .kdcn-pool { --kc-a: #cffafe; --kc-b: #f97316; --kc-ink: #0e7490; }
    .kdcn-chip { padding: 3px 10px; border-radius: 999px; background: linear-gradient(180deg, #fff, var(--kc-a)); border: 1px solid rgba(2, 132, 199, 0.3); color: var(--kc-ink); }
    .kdcn-chip b { font-variant-numeric: tabular-nums; }
    .kdcn-goal { flex: 1; min-width: 80px; height: 8px; border-radius: 999px; background: #e2e8f0; overflow: hidden; }
    .kdcn-goal i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #38bdf8, var(--kc-b)); transition: width 0.25s; }
    .kdcn-pct { color: var(--kc-ink); font-weight: 700; }
    /* Poolside: a water bar with an orange tip (orange never fades into the cyan) */
    .kdcn-pool .kdcn-goal i { background: linear-gradient(90deg, #67e8f9, #00b2e3); box-shadow: inset -5px 0 0 #f97316; }
</style>
