<!--
  KeydownCallout.svelte: a note box with a Keydown body, like OpenDB's callouts: note, tip, important, warning, caution, fact!

  <KeydownCallout kind="tip">Press **Enter** at the end of a line and its Keydown formats!</KeydownCallout>
  <KeydownCallout kind="warning" title="Slippery deck" text={'No #R(running) by the pool!'} />

  Props: kind ('note' default, 'tip', 'important', 'warning', 'caution', 'fact'), title (Keydown; default: the kind's name),
         text (or the words between the tags), class, style. Warnings and cautions are role="alert", the rest role="note".
  Needs KeydownText.svelte, KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import { onMount } from 'svelte';
    import KeydownText from './KeydownText.svelte';
    import { engine, mathWriteBack } from './KeydownCore.js';

    let { kind = 'note', title = undefined, text = $bindable(undefined), children = undefined, class: className = '', style = undefined } = $props();
    let K = $state(null);
    const wb = { get: () => text, set: (t) => { text = t; } };
    onMount(() => { K = engine(); });
    const KINDS = {
        note: ['Note', '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'],
        tip: ['Tip', '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>'],
        important: ['Important', '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>'],
        warning: ['Warning', '<path d="M12 3.5l9.5 16.5h-19z"/><path d="M12 10v4.5M12 17.2v.3"/>'],
        caution: ['Caution', '<path d="M8.5 3h7L21 8.5v7L15.5 21h-7L3 15.5v-7z"/><path d="M12 8v5M12 16v.3"/>'],
        fact: ['Did you know?', '<path d="M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4z"/><path d="M18.5 15l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z"/>']
    };
    const k = $derived(KINDS[kind] ? kind : 'note');
    const heading = $derived(title === undefined ? KINDS[k][0] : title);
</script>

<div class="kdco kdco-{k} {className}" {style} role={k === 'warning' || k === 'caution' ? 'alert' : 'note'}>
    <div class="kdco-title">
        <svg viewBox="0 0 24 24" aria-hidden="true">{@html KINDS[k][1]}</svg>
        <span>{#if K}{@html K.doc.inlineHtml(String(heading))}{:else}{heading}{/if}</span>
    </div>
    <div class="kdco-body" use:mathWriteBack={wb}>{#if text !== undefined}<KeydownText {text} />{:else if children}<KeydownText {children} />{/if}</div>
</div>

<style>
    .kdco { --co: #0284c7; --co-bg: #e0f2fe; margin: 0 0 14px; padding: 10px 16px 12px; border-radius: 12px; font: 15px/1.5 system-ui, sans-serif; color: #0f172a;
        border: 1px solid color-mix(in srgb, var(--co) 35%, transparent); border-left: 6px solid var(--co);
        background: linear-gradient(180deg, #ffffff 0%, var(--co-bg) 100%); box-shadow: 0 3px 10px color-mix(in srgb, var(--co) 14%, transparent), inset 0 1px 0 #fff; }
    .kdco-tip { --co: #059669; --co-bg: #d1fae5; }
    .kdco-important { --co: #7c3aed; --co-bg: #ede9fe; }
    /* (a warning keeps a light water body: the orange is the edge and the icon) */
    .kdco-warning { --co: #ea580c; --co-bg: #f0f9ff; }
    .kdco-caution { --co: #dc2626; --co-bg: #fee2e2; }
    .kdco-fact { --co: #0d9488; --co-bg: #ccfbf1; }
    .kdco-title { display: flex; align-items: center; gap: 8px; font-weight: 800; color: var(--co); margin-bottom: 2px; }
    .kdco-title svg { width: 20px; height: 20px; flex: none; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    .kdco-body :global(p:last-child) { margin-bottom: 0; }
</style>
