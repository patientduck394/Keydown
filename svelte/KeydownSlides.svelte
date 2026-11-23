<!--
  KeydownSlides.svelte: a slide show written in Keydown! Every "---" line starts a new slide.

  <KeydownSlides text={deck} bind:index />
  <KeydownSlides look="pool">
    # Welcome!
    =B=Pool party=B= this **Saturday**!
    ---
    ## What to bring
    * a towel
    * #O.marker(sunscreen)
  </KeydownSlides>

  Props: text (or the words between the tags), index (bindable, from 0), look ('aero' default sky, 'pool' water, 'paper' white),
         ratio (default '16 / 9'), onchange(index), class, style.
  Keys (click the slide first): arrows, Page Up/Down, Space, Home, End; F or the button for full screen.
  Needs KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import { onMount } from 'svelte';
    import { engine, dedent, mathWriteBack } from './KeydownCore.js';

    let { text = $bindable(undefined), index = $bindable(0), look = 'aero', ratio = '16 / 9', onchange = undefined, children = undefined, class: className = '', style = undefined } = $props();
    let K = $state(null);
    let src = $state(''), holder = $state(), stage = $state();
    onMount(() => { K = engine(); });
    // the words between the tags are read once they are on the page
    $effect(() => { if (text !== undefined) src = dedent(text); else if (holder) src = dedent(holder.textContent || ''); });
    const slides = $derived(src.split(/\n[ \t]*-{3,}[ \t]*(?:\n|$)/).map((s) => s.trim()).filter((s, i, a) => s || a.length === 1));
    const html = $derived(K ? slides.map((s) => K.render(s)) : []);
    $effect(() => { if (index > slides.length - 1) index = Math.max(0, slides.length - 1); });
    function go(i) {
        const n = Math.min(slides.length - 1, Math.max(0, i));
        if (n === index) return;
        index = n;
        if (typeof onchange === 'function') onchange(n);
    }
    function keys(e) {
        const k = e.key;
        if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(k)) { e.preventDefault(); go(index + 1); }
        else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(k)) { e.preventDefault(); go(index - 1); }
        else if (k === 'Home') { e.preventDefault(); go(0); }
        else if (k === 'End') { e.preventDefault(); go(slides.length - 1); }
        else if (k === 'f' || k === 'F') full();
    }
    function full() { try { if (document.fullscreenElement) document.exitFullscreen(); else (stage.requestFullscreen || stage.webkitRequestFullscreen).call(stage); } catch (e) {} }
</script>

{#if text === undefined && children}<div hidden bind:this={holder}>{@render children()}</div>{/if}
<div class="kds kds-{look} {className}" {style}>
    <!-- (the slide area takes the arrow keys once it is clicked or tabbed to, like a carousel) -->
    <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
    <div class="kds-stage" use:mathWriteBack={{ get: () => (text !== undefined ? text : src), set: (t) => { if (text !== undefined) text = t; else src = t; } }} bind:this={stage} style:aspect-ratio={ratio} tabindex="0" role="region" aria-roledescription="slide show" aria-label={'Slide ' + (index + 1) + ' of ' + slides.length} onkeydown={keys}>
        {#each html as h, i (i)}
            <div class="kds-slide keydown-doc" class:on={i === index} aria-hidden={i !== index}>{@html h}</div>
        {/each}
        {#if !K}<div class="kds-slide on">{slides[0] || ''}</div>{/if}
    </div>
    <div class="kds-bar">
        <button type="button" aria-label="Previous slide" disabled={index === 0} onclick={() => go(index - 1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg></button>
        <span class="kds-dots" role="group" aria-label="Slides">
            {#each slides as _, i (i)}<button type="button" class="kds-dot" class:on={i === index} aria-label={'Go to slide ' + (i + 1)} aria-current={i === index ? 'true' : undefined} onclick={() => go(i)}></button>{/each}
        </span>
        <button type="button" aria-label="Next slide" disabled={index >= slides.length - 1} onclick={() => go(index + 1)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg></button>
        <span class="kds-count" aria-live="polite">{index + 1} / {slides.length}</span>
        <button type="button" aria-label="Full screen" title="Full screen (F)" onclick={full}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg></button>
    </div>
</div>

<style>
    .kds { font-family: system-ui, sans-serif; }
    .kds-stage { position: relative; overflow: hidden; border-radius: 16px; outline: none; border: 1px solid rgba(2, 132, 199, 0.35); box-shadow: 0 10px 26px rgba(3, 105, 161, 0.18); }
    .kds-stage:focus-visible { box-shadow: 0 0 0 3px #0ea5e9, 0 10px 26px rgba(3, 105, 161, 0.18); }
    .kds-stage:fullscreen { border-radius: 0; border: 0; aspect-ratio: auto !important; }
    .kds-aero .kds-stage { background: radial-gradient(120% 70% at 20% 0%, #ffffff 0%, transparent 55%), linear-gradient(180deg, #bae6fd 0%, #e0f2fe 55%, #ecfccb 100%); color: #0c4a6e; }
    .kds-pool .kds-stage { background: repeating-radial-gradient(circle at 80% 120%, rgba(255, 255, 255, 0.12) 0 10px, transparent 10px 26px), linear-gradient(180deg, #67e8f9, #00b2e3); color: #fff; box-shadow: inset 0 -6px 0 #f97316, 0 10px 26px rgba(3, 105, 161, 0.18); }
    .kds-paper .kds-stage { background: #fff; color: #0f172a; }
    .kds-slide { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; padding: 6% 8%; overflow: auto; font-size: clamp(14px, 2.6cqw, 30px); line-height: 1.4;
        opacity: 0; transform: translateX(3%); transition: opacity 0.3s, transform 0.3s; pointer-events: none; }
    .kds-stage { container-type: inline-size; }
    .kds-slide.on { opacity: 1; transform: none; pointer-events: auto; }
    .kds-pool .kds-slide { text-shadow: 0 1px 2px rgba(7, 89, 133, 0.5); }
    .kds-slide :global(:is(h1, .header-1)) { font-size: 2.1em; margin: 0 0 0.3em; }
    .kds-slide :global(:is(h2, .header-2)) { font-size: 1.6em; margin: 0 0 0.3em; }
    .kds-bar { display: flex; align-items: center; gap: 8px; padding: 8px 4px 0; }
    .kds-bar > button { display: inline-flex; padding: 6px; border-radius: 50%; border: 1px solid rgba(2, 132, 199, 0.35); background: linear-gradient(180deg, #fff, #e0f2fe); color: #0369a1; cursor: pointer; }
    .kds-bar > button:disabled { opacity: 0.4; cursor: default; }
    .kds-bar svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
    .kds-dots { flex: 1; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
    .kds-dot { width: 10px; height: 10px; padding: 0; border-radius: 50%; border: 1px solid #0284c7; background: #fff; cursor: pointer; }
    .kds-dot.on { background: #0284c7; transform: scale(1.25); }
    .kds-pool .kds-dot.on { background: #0284c7; box-shadow: 0 0 0 2px #f97316; }
    .kds-count { font: 700 13px system-ui, sans-serif; color: #0369a1; font-variant-numeric: tabular-nums; min-width: 44px; text-align: center; }
    button:focus-visible { outline: 3px solid #f97316; outline-offset: 2px; }
    @media (prefers-reduced-motion: reduce) { .kds-slide { transition: none; transform: none; } }
</style>
