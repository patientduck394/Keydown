<!--
  KeydownMath.svelte: LaTeX math, typeset (KaTeX, from the Keydown engine)!

  <KeydownMath tex="e^{i\pi} + 1 = 0" />                      inline, inside a sentence
  <KeydownMath display tex={'\\int_0^1 x^2\\,dx = \\tfrac13'} />  centered on its own line
  <KeydownMath display editable bind:tex />                     with a box to type the LaTeX in
  <KeydownMath bind:tex />                                      double-click the equation to edit it (it writes to tex)

  Props:
    tex       the LaTeX (bindable; with editable, the box writes to it). Several lines work in display mode.
    display   true: a centered equation; false (default): inline
    editable  shows a text box under the math (with a live preview)
    class     goes onto the outer element
  Needs KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import { onMount } from 'svelte';
    import { engine, mathWriteBack } from './KeydownCore.js';

    let { tex = $bindable(''), display = false, editable = false, class: className = '' } = $props();
    let K = $state(null);
    onMount(() => { K = engine(); });
    // double-click the equation to edit it (even when this is just showing it): the new LaTeX goes into tex
    const wb = { whole: true, set: (t) => { tex = t; } };
    const html = $derived(K && String(tex).trim() ? K.doc.inlineHtml(display ? '$$' + tex + '$$' : '$' + String(tex).replace(/\n/g, ' ') + '$') : '');
</script>

{#if editable}
    <div class="kdmath-ed {className}">
        <div class="kdmath-out" class:kdmath-display={display} use:mathWriteBack={wb}>{#if html}{@html html}{:else}<span class="kdmath-empty">Type some LaTeX below!</span>{/if}</div>
        <textarea bind:value={tex} rows={display ? 3 : 1} spellcheck="false" placeholder={'e^{i\\pi} + 1 = 0'} aria-label="LaTeX"></textarea>
    </div>
{:else if display}
    <div class="kdmath-display {className}" use:mathWriteBack={wb}>{@html html}</div>
{:else}
    <span class={className} use:mathWriteBack={wb}>{@html html}</span>
{/if}

<style>
    .kdmath-display { display: block; text-align: center; margin: 8px 0; overflow-x: auto; }
    .kdmath-ed { border: 1px solid rgba(2, 132, 199, 0.35); border-radius: 12px; overflow: hidden; background: #fff; }
    .kdmath-out { padding: 12px 14px; min-height: 2.4em; }
    .kdmath-empty { color: #94a3b8; font-style: italic; }
    .kdmath-ed textarea { display: block; box-sizing: border-box; width: 100%; border: 0; border-top: 1px solid rgba(2, 132, 199, 0.25); padding: 8px 12px; font: 13px/1.5 ui-monospace, Menlo, monospace; background: #f8fbff; resize: vertical; outline: none; }
</style>
