<!--
  KeydownDoc.svelte: show a whole Keydown document, or the contents of a Writeout / Bitbook / OpenDB file (.kd, .kn)!

  <KeydownDoc source={fileText} />                         the text of a .kd or .kn file (headings, lists, tables, math,
                                                             chips, Skills... all drawn; a file's tabs get tab buttons)
  <KeydownDoc source={'# Title\n#G#Hello# **world**'} />   plain Keydown text works too
  <KeydownDoc source={text} showTitle={false} />           skip the file's title

  Props: source (the text), showTitle (the file's title and summary above the text, default true), class.
  A document made in Writeout or Bitbook (HTML inside the file) is cleaned first: scripts, frames and on... handlers
  never come through. Clicking dice, flashcards, timers and BitLang programs works like in the editors.
  Needs KeydownText.svelte, KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import { onMount, untrack } from 'svelte';
    import { engine } from './KeydownCore.js';
    import KeydownText from './KeydownText.svelte';

    let { source = '', showTitle = true, class: className = '' } = $props();
    let ready = $state(false);
    let tab = $state(0);

    function clean(html) {
        const d = new DOMParser().parseFromString('<body>' + html + '</body>', 'text/html');
        d.querySelectorAll('script, iframe, object, embed, link, meta, style, base, form').forEach((n) => n.remove());
        d.querySelectorAll('*').forEach((n) => [].slice.call(n.attributes).forEach((a) => {
            if (/^on/i.test(a.name) || (/^(href|src|xlink:href|action|formaction)$/i.test(a.name) && /^\s*(javascript|vbscript|data:text\/html)/i.test(a.value))) n.removeAttribute(a.name);
        }));
        return d.body.innerHTML;
    }
    const doc = $derived.by(() => {
        if (!ready) return null;
        const K = window.Keydown;
        const p = K.file.parse(source);
        const pages = p.kind === 'html'
            ? [{ name: 'Page 1', html: clean(p.body) }].concat((p.tabs || []).map((t) => ({ name: t.name || 'Tab', html: clean(t.html || '') })))
            : [{ name: 'Page 1', text: p.body }];
        return { meta: p.meta || {}, kind: p.kind, pages };
    });
    $effect(() => { source; untrack(() => { tab = 0; }); });
    onMount(() => { engine(); ready = true; });
</script>

{#if doc}
    <article class="kdd {className}">
        {#if showTitle && (doc.meta.title || doc.meta.summary)}
            <header class="kdd-head">
                {#if doc.meta.title}<h1>{doc.meta.title}</h1>{/if}
                {#if doc.meta.summary}<p>{doc.meta.summary}</p>{/if}
            </header>
        {/if}
        {#if doc.pages.length > 1}
            <div class="kdd-tabs" role="tablist">
                {#each doc.pages as pg, i (i)}
                    <button type="button" role="tab" aria-selected={tab === i} class:on={tab === i} onclick={() => (tab = i)}>{pg.name}</button>
                {/each}
            </div>
        {/if}
        {#if doc.kind === 'keydown'}
            <KeydownText text={doc.pages[0].text} />
        {:else}
            <div class="keydown-doc kdd-html">{@html doc.pages[tab].html}</div>
        {/if}
    </article>
{/if}

<style>
    .kdd { font-family: 'Segoe UI', 'Frutiger', system-ui, sans-serif; color: #0f172a; line-height: 1.6; }
    .kdd-head h1 { margin: 0 0 2px; font-size: 1.9em; color: #0369a1; }
    .kdd-head p { margin: 0 0 14px; color: #475569; }
    .kdd-tabs { display: flex; gap: 4px; margin: 6px 0 10px; border-bottom: 2px solid #7dd3fc; }
    .kdd-tabs button {
        font: 700 13px system-ui, sans-serif; padding: 6px 14px; border: 1px solid #7dd3fc; border-bottom: 0; border-radius: 9px 9px 0 0; cursor: pointer;
        background: linear-gradient(180deg, #ffffff, #e0f2fe); color: #075985;
    }
    .kdd-tabs button.on { background: linear-gradient(180deg, #38bdf8, #0284c7); color: #ffffff; }
</style>
