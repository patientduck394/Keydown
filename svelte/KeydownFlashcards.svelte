<!--
  KeydownFlashcards.svelte: study cards written in Keydown! One card per line: front :: back.

  <KeydownFlashcards text={`
    $e^{i\\pi} + 1$ :: =B=0=B=
    Capital of #G(Portugal) :: **Lisbon**
    Poolside colors :: #C(cyan), #B(blue) and #O(orange)
  `} />

  Click a card (or press Space) to flip it, then "Again" or "Got it". Cards you got leave the pile; the others come back.
  Props: text, shuffle (start shuffled, default false), look ('aero' or 'pool'), class. Bind:score for { got, total }.
  Needs KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import { onMount } from 'svelte';
    import { engine, dedent } from './KeydownCore.js';

    let { text = '', shuffle = false, look = 'aero', score = $bindable({ got: 0, total: 0 }), class: className = '' } = $props();
    let K = $state(null);
    onMount(() => { K = engine(); });
    const cards = $derived(dedent(text).split('\n').map((l) => l.split(/\s+::\s+/)).filter((p) => p.length >= 2 && p[0].trim()).map((p, i) => ({ id: i, front: p[0].trim(), back: p.slice(1).join(' :: ').trim() })));
    let pile = $state([]), got = $state(0), flipped = $state(false);
    const mix = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
    function restart(doShuffle) { pile = (doShuffle ? mix(cards) : cards.slice()).map((c) => c.id); got = 0; flipped = false; }
    $effect(() => { cards; restart(shuffle); });
    $effect(() => { score = { got, total: cards.length }; });
    const card = $derived(cards.find((c) => c.id === pile[0]) || null);
    function answer(knew) {
        if (!card) return;
        const [first, ...rest] = pile;
        pile = knew ? rest : [...rest, first];
        if (knew) got++;
        flipped = false;
    }
    function keys(e) {
        if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); flipped = !flipped; }
        else if (flipped && (e.key === 'ArrowRight' || e.key === 'g')) answer(true);
        else if (flipped && (e.key === 'ArrowLeft' || e.key === 'a')) answer(false);
    }
    const show = (t) => (K ? K.doc.inlineHtml(t) : t);
</script>

<div class="kdfc kdfc-{look} {className}">
    <div class="kdfc-top"><span>{got} of {cards.length} learned</span><span class="kdfc-bar" aria-hidden="true"><i style:width={cards.length ? (got / cards.length) * 100 + '%' : '0'}></i></span></div>
    {#if card}
        <button type="button" class="kdfc-card" class:flipped onclick={() => (flipped = !flipped)} onkeydown={keys} aria-label={(flipped ? 'Back of the card' : 'Front of the card') + ', press to flip'} aria-live="polite">
            <span class="kdfc-face kdfc-front" aria-hidden={flipped}>{@html show(card.front)}</span>
            <span class="kdfc-face kdfc-back" aria-hidden={!flipped}>{@html show(card.back)}</span>
        </button>
        <div class="kdfc-actions">
            {#if flipped}
                <button type="button" class="kdfc-again" onclick={() => answer(false)}>Again</button>
                <button type="button" class="kdfc-got" onclick={() => answer(true)}>Got it!</button>
            {:else}<span class="kdfc-hint">Think of the answer, then flip the card!</span>{/if}
        </div>
    {:else if cards.length}
        <div class="kdfc-done"><b>All {cards.length} learned!</b><button type="button" class="kdfc-got" onclick={() => restart(true)}>Shuffle and go again</button></div>
    {:else}
        <div class="kdfc-done">Write one card per line, like <code>front :: back</code>!</div>
    {/if}
</div>

<style>
    .kdfc { font: 15px/1.45 system-ui, sans-serif; color: #0c4a6e; max-width: 520px; }
    .kdfc-top { display: flex; align-items: center; gap: 10px; font: 700 13px system-ui, sans-serif; color: #0369a1; margin-bottom: 10px; }
    .kdfc-bar { flex: 1; height: 8px; border-radius: 999px; background: #e0f2fe; overflow: hidden; }
    .kdfc-bar i { display: block; height: 100%; background: linear-gradient(90deg, #38bdf8, #0284c7); transition: width 0.25s; }
    .kdfc-pool .kdfc-bar i { box-shadow: inset -4px 0 0 #f97316; }
    .kdfc-card { position: relative; display: block; width: 100%; aspect-ratio: 5 / 3; padding: 0; border: 0; background: none; cursor: pointer; perspective: 900px; font: inherit; color: inherit; }
    .kdfc-face { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; text-align: center; padding: 20px; border-radius: 18px; font-size: 22px; backface-visibility: hidden; transition: transform 0.45s; box-shadow: 0 10px 24px rgba(3, 105, 161, 0.2); }
    .kdfc-front { background: radial-gradient(120% 70% at 20% 0%, #fff, transparent 60%), linear-gradient(180deg, #e0f2fe, #bae6fd); border: 1px solid rgba(2, 132, 199, 0.35); }
    .kdfc-back { background: linear-gradient(180deg, #fff, #f0f9ff); border: 2px solid #0284c7; transform: rotateY(180deg); }
    .kdfc-pool .kdfc-front { background: repeating-radial-gradient(circle at 80% 130%, rgba(255, 255, 255, 0.14) 0 8px, transparent 8px 20px), linear-gradient(180deg, #67e8f9, #00b2e3); color: #fff; text-shadow: 0 1px 2px rgba(7, 89, 133, 0.5); box-shadow: inset 0 -5px 0 #f97316, 0 10px 24px rgba(3, 105, 161, 0.2); }
    .flipped .kdfc-front { transform: rotateY(-180deg); }
    .flipped .kdfc-back { transform: rotateY(0); }
    .kdfc-card:focus-visible .kdfc-face { outline: 3px solid #f97316; outline-offset: 3px; }
    .kdfc-actions { display: flex; justify-content: center; gap: 10px; min-height: 40px; margin-top: 12px; align-items: center; }
    .kdfc-hint { color: #4b7a94; font-size: 13px; }
    .kdfc-actions button, .kdfc-done button { padding: 8px 20px; border-radius: 999px; font: 700 14px system-ui, sans-serif; cursor: pointer; border: 1px solid; }
    .kdfc-again { color: #0369a1; border-color: rgba(2, 132, 199, 0.4) !important; background: #fff; }
    .kdfc-got { color: #fff; border-color: #0369a1 !important; background: linear-gradient(180deg, #38bdf8, #0284c7); }
    button:focus-visible { outline: 3px solid #f97316; outline-offset: 2px; }
    .kdfc-done { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 30px 16px; border-radius: 18px; border: 1px dashed rgba(2, 132, 199, 0.5); background: #f0f9ff; text-align: center; }
    @media (prefers-reduced-motion: reduce) { .kdfc-face { transition: none; } }
</style>
