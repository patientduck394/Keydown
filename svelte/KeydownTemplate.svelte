<!--
  KeydownTemplate.svelte: Keydown with blanks to fill in! Write {{name}} (or {{name|what to show when empty}}) in the text,
  hand in the values, and it renders the finished Keydown. With form, it also shows a box for every blank.

  <KeydownTemplate text={'# Hi {{name}}!\nYour lane is =B={{lane|not picked yet}}=B= at **{{time}}**!'} values={{ name: 'Marina', lane: 4 }} />
  <KeydownTemplate text={letter} bind:values form />

  Values are Keydown too ("**4**" is bold). A blank with no value and no fallback shows as a dashed chip with its name,
  so it is easy to spot. Props: text, values (bindable object), form (show the boxes), fields (bindable, read-only: the
  blank names found, in order), look ('aero' or 'pool'), class.
  Needs KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import { onMount } from 'svelte';
    import { engine, dedent } from './KeydownCore.js';

    let { text = '', values = $bindable({}), form = false, fields = $bindable([]), look = 'aero', class: className = '' } = $props();
    let K = $state(null);
    onMount(() => { K = engine(); });
    const BLANK = /\{\{\s*([\w.-]+)\s*(?:\|([^}]*))?\}\}/g;
    $effect(() => {
        const found = [];
        for (const m of String(text).matchAll(BLANK)) if (!found.includes(m[1])) found.push(m[1]);
        if (found.join('\u0000') !== fields.join('\u0000')) fields = found;
    });
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const get = (name) => name.split('.').reduce((o, k) => (o == null ? undefined : o[k]), values);
    const html = $derived.by(() => {
        // an empty blank becomes a marker that Keydown leaves alone, swapped for the dashed chip afterwards
        const missing = [];
        const src = dedent(text).replace(BLANK, (m, name, fallback) => {
            const v = get(name);
            if (v !== undefined && v !== null && String(v) !== '') return String(v);
            if (fallback !== undefined) return fallback;
            missing.push(name);
            return '\u0002' + (missing.length - 1) + '\u0003';
        });
        if (!K) return esc(src);
        return K.render(src).replace(/\u0002(\d+)\u0003/g, (_, i) => '<span class="kdtpl-blank" title="Fill in ' + esc(missing[+i]) + '">' + esc(missing[+i]) + '</span>');
    });
    function set(name, v) { values = Object.assign({}, values, { [name]: v }); }
    const nice = (name) => name.replace(/[._-]+/g, ' ').replace(/^./, (c) => c.toUpperCase());
</script>

<div class="kdtpl kdtpl-{look} {className}">
    {#if form && fields.length}
        <div class="kdtpl-form">
            {#each fields as name (name)}
                <label><span>{nice(name)}</span><input value={get(name) ?? ''} oninput={(e) => set(name, e.currentTarget.value)} spellcheck="false" /></label>
            {/each}
        </div>
    {/if}
    <div class="kdtpl-out keydown-doc" aria-live="polite">{@html html}</div>
</div>

<style>
    .kdtpl { font: 15px/1.5 system-ui, sans-serif; color: #0f172a; }
    .kdtpl-form { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 8px 12px; padding: 12px; margin-bottom: 10px; border-radius: 14px; border: 1px solid rgba(2, 132, 199, 0.3); background: linear-gradient(180deg, #fff, #f0f9ff); }
    .kdtpl-pool .kdtpl-form { background: linear-gradient(180deg, #fff, #ecfeff); box-shadow: inset 4px 0 0 #f97316; }
    .kdtpl-form label { display: flex; flex-direction: column; gap: 3px; font: 700 12px system-ui, sans-serif; color: #0369a1; }
    .kdtpl-form input { padding: 6px 10px; border-radius: 9px; border: 1px solid rgba(2, 132, 199, 0.35); font: 14px system-ui, sans-serif; color: #0c4a6e; }
    .kdtpl-form input:focus { outline: 2px solid #38bdf8; outline-offset: 0; }
    .kdtpl-out { padding: 4px 2px; }
    .kdtpl-out :global(.kdtpl-blank) { display: inline-block; padding: 0 8px; border-radius: 999px; border: 1.5px dashed #0284c7; color: #0369a1; background: #f0f9ff; font: 600 0.85em ui-monospace, Menlo, monospace; line-height: 1.6; }
</style>
