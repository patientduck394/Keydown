<!--
  KeydownText.svelte: write Keydown inside it and it shows up formatted!

  <script>
    import KeydownText from './KeydownText.svelte';
    let name = 'Ada';
  </script>

  <KeydownText>
    # Hello, {name}!
    #G#Keydown# works **right here**, with =B=gel orbs=B=, @pfwhitecap-3@unique styles@ and more!
  </KeydownText>

  The text between the tags is read as Keydown (blank lines at the top and bottom and the shared indent are
  trimmed, so you can indent it like HTML). It updates by itself when {name} or any other value inside changes.
  No children? Give it text instead: <KeydownText text={post.body} />

  EDITOR VERSION: add `editable` and the same box becomes a live editor, assigned to a variable with bind:value!

  <KeydownText editable bind:value={notes} placeholder="Write here!" />
  (KeydownEditor.svelte is the same thing with editable already on.) Space or Enter formats a tag as you type,
  and Skills, tables and drawings work too (see the methods below).

  Props:
    text         Keydown text to show (instead of putting it inside the tags)
    value        Keydown text, bindable: the editor writes to it, and changing it redraws the editor
    html         the formatted HTML, bindable (read it, or save it)
    editable     false (default): just shows the text / true: a live editor
    readonly     an editable box that can't be typed in, but whose Skills (dice, flashcards...) still work
    tag          the element to draw into (default 'div'); inline makes it a <span> that sits inside a sentence
    inline       true: tag is 'span' and it flows with the surrounding text
    placeholder  hint shown while an editor is empty
    spellcheck   red squiggles in the editor (default true)
    sound        Aero click sounds for applets (default true)
    onchange     called with the Keydown text each time it changes
    class, style and any other attribute go onto the element.
  Methods (bind:this={box}): box.editor() hands over the whole editor (insertSkill, insertTable, unformat,
  reformat, annotate, getText, setText), box.getText(), box.setText(t), box.focus().

  Needs KeydownCore.js and KeydownBox.svelte in the same folder: KeydownBox holds the Keydown engine and every Keydown style.
  Svelte 5.
-->
<script>
    import { onMount, untrack } from 'svelte';
    import { prime, dedent } from './KeydownCore.js';

    let {
        children = undefined,
        text = undefined,
        value = $bindable(''),
        html = $bindable(''),
        editable = false,
        readonly = false,
        tag = 'div',
        inline = false,
        placeholder = undefined,
        spellcheck = true,
        sound = true,
        onchange = undefined,
        class: className = '',
        ...rest
    } = $props();

    let el = $state();          // the element Keydown draws into
    let srcEl = $state();       // the hidden copy of what you wrote between the tags
    let src = $state('');       // ...as text
    let ready = $state(false);
    let ed = null;
    let shown = null;           // the text the element holds right now

    const element = $derived(inline ? 'span' : tag);
    // what to show: an editor follows `value`; a plain view follows text, then value, then what is between the tags
    const source = $derived(editable ? value : (text !== undefined ? text : (value !== '' ? value : src)));

    onMount(() => {
        prime();
        const K = window.Keydown;
        K.sound = sound;
        const readSrc = () => { src = dedent(srcEl ? srcEl.textContent : ''); };
        readSrc();
        const watch = new MutationObserver(readSrc);
        if (srcEl) watch.observe(srcEl, { childList: true, characterData: true, subtree: true });
        // an editor starts from value, then text, then what is between the tags (and hands it to value)
        const first = editable ? (value !== '' ? value : (text !== undefined ? dedent(text) : src)) : (text !== undefined ? text : (value !== '' ? value : src));
        shown = first;
        if (editable && value === '' && first !== '') value = first;
        ed = K.editor(el, {
            value: first,
            spellcheck,
            onChange: (t) => {
                shown = t;
                html = el.innerHTML;
                if (editable) value = t;
                // (a view that only shows text calls onchange too: an equation edited by double-click is a change)
                if (typeof onchange === 'function') onchange(t);
            },
        });
        // not editable: still an editor underneath (so dice, flashcards and timers answer clicks), but nobody can type in it
        if (!editable || readonly) el.setAttribute('contenteditable', 'false');
        html = el.innerHTML;
        ready = true;
        return () => { watch.disconnect(); if (ed) ed.destroy(); ed = null; };
    });

    // new text from outside (or from the tags' contents) redraws the element
    $effect(() => {
        const s = source;
        if (!ed || s === shown) return;
        untrack(() => { shown = s; ed.setText(s); html = el.innerHTML; });
    });
    $effect(() => { if (ready && window.Keydown) window.Keydown.sound = sound; });
    $effect(() => {
        if (!ready) return;
        if (!editable || readonly) el.setAttribute('contenteditable', 'false'); else el.setAttribute('contenteditable', 'true');
    });

    export function editor() { return ed; }
    export function getText() { return ed ? ed.getText() : source; }
    export function setText(t) { if (editable) value = t; else if (ed) { shown = t; ed.setText(t); html = el.innerHTML; } }
    export function focus() { if (el) el.focus(); }
</script>

<!-- what you wrote between the tags: shown as plain text until Keydown is ready, then hidden (it keeps feeding the element) -->
{#if children}
    <span bind:this={srcEl} class="kdt-src" hidden={ready} style:display={ready ? 'none' : undefined}>{@render children()}</span>
{/if}
<svelte:element
    this={element}
    bind:this={el}
    class="keydown-doc kdt {className}"
    class:kdt-editable={editable && !readonly}
    class:kdt-inline={inline}
    data-placeholder={placeholder}
    style:display={children && !ready ? 'none' : undefined}
    role={editable ? 'textbox' : undefined}
    aria-multiline={editable ? 'true' : undefined}
    {...rest}
></svelte:element>

<style>
    .kdt { word-wrap: break-word; line-height: 1.6; }
    .kdt-inline { display: inline; }
    /* (Keydown draws each line in a <div>: inline text keeps them in the sentence) */
    .kdt-inline :global(div) { display: inline; }
    .kdt-editable { min-height: 1.6em; cursor: text; outline: none; border-radius: 6px; transition: box-shadow 0.2s ease; }
    .kdt-editable:focus { box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.35); }
    .kdt-editable:empty::before { content: attr(data-placeholder); opacity: 0.5; pointer-events: none; }
</style>
