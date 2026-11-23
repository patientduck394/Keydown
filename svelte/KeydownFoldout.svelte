<!--
  KeydownFoldout.svelte: a section that folds open and shut, with a Keydown title and a Keydown body!

  <KeydownFoldout title="#TU(Read more)" bind:open>
    ## Inside
    Anything **Keydown**, written between the tags (indent it like HTML)!
  </KeydownFoldout>
  <KeydownFoldout title="FAQ" text={answer} />

  Props: title (one line of Keydown), text (instead of the words between the tags), open (bindable, default false),
         look ('aero' or 'pool'), class, style. The body is only drawn while open.
  Needs KeydownText.svelte, KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import { onMount } from 'svelte';
    import KeydownText from './KeydownText.svelte';
    import { engine, mathWriteBack } from './KeydownCore.js';

    let { title = 'More', text = $bindable(undefined), open = $bindable(false), look = 'aero', children = undefined, class: className = '', style = undefined } = $props();
    let K = $state(null);
    const wb = { get: () => text, set: (t) => { text = t; } };
    const uid = 'kdf' + Math.random().toString(36).slice(2, 8);
    onMount(() => { K = engine(); });
</script>

<section class="kdfo kdfo-{look} {className}" class:kdfo-open={open} {style}>
    <button type="button" class="kdfo-head" aria-expanded={open} aria-controls={uid} onclick={() => (open = !open)}>
        <svg class="kdfo-chev" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        <span class="kdfo-title">{#if K}{@html K.doc.inlineHtml(String(title))}{:else}{title}{/if}</span>
    </button>
    <div class="kdfo-body" id={uid} hidden={!open} use:mathWriteBack={wb}>
        {#if open}
            {#if text !== undefined}<KeydownText {text} />{:else if children}<KeydownText {children} />{/if}
        {/if}
    </div>
</section>

<style>
    .kdfo { border-radius: 14px; overflow: hidden; border: 1px solid var(--kdfo-line); background: #fff; margin: 6px 0; box-shadow: 0 3px 10px rgba(3, 105, 161, 0.1); }
    .kdfo-aero { --kdfo-a: #e0f2fe; --kdfo-b: #bae6fd; --kdfo-line: rgba(2, 132, 199, 0.35); --kdfo-ink: #075985; }
    /* Poolside: water colors in the bar, orange only as an accent (the edge and the arrow) */
    .kdfo-pool { --kdfo-a: #ecfeff; --kdfo-b: #a5f3fc; --kdfo-line: rgba(14, 165, 233, 0.4); --kdfo-ink: #0e7490; }
    .kdfo-pool .kdfo-head { box-shadow: inset 4px 0 0 #f97316, inset 0 1px 0 rgba(255, 255, 255, 0.9); }
    .kdfo-pool .kdfo-chev { color: #ea580c; }
    .kdfo-head { display: flex; align-items: center; gap: 8px; width: 100%; padding: 10px 14px; border: 0; cursor: pointer; text-align: left; font: 700 14px system-ui, sans-serif; color: var(--kdfo-ink);
        background: linear-gradient(180deg, #ffffff 0%, var(--kdfo-a) 50%, var(--kdfo-b) 100%); box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.9); }
    .kdfo-head:focus-visible { outline: 2px solid #0284c7; outline-offset: -2px; }
    .kdfo-chev { flex: none; transition: transform 0.2s; }
    .kdfo-open .kdfo-chev { transform: rotate(90deg); }
    .kdfo-title { flex: 1; min-width: 0; }
    .kdfo-body { padding: 12px 16px; border-top: 1px solid var(--kdfo-line); }
</style>
