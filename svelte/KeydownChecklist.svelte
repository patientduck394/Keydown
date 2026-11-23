<!--
  KeydownChecklist.svelte: a to-do list written in Keydown, where ticking a box writes the [x] back into the text!

  <KeydownChecklist bind:value={todo} />
  with todo =
    ## Pool party
    - [x] Book the **pool**
    - [ ] Buy =O=towels=O=
    - [ ] Tell #B(everyone)!

  Lines starting "- [ ]" or "- [x]" (also "* [ ]") are tasks; every other line is drawn as Keydown (headings, notes...).
  Props: value (bindable Keydown text), editable (true: an "Add a task" box and remove buttons), look ('aero' or 'pool'),
         onchange(value), class. It shows how many are done, as text and as a bar.
  Needs KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import { onMount } from 'svelte';
    import { engine } from './KeydownCore.js';

    let { value = $bindable(''), editable = true, look = 'aero', onchange = undefined, class: className = '' } = $props();
    let K = $state(null);
    let draft = $state('');
    onMount(() => { K = engine(); });
    const TASK = /^(\s*[-*]\s+)\[( |x|X)\]\s?(.*)$/;
    const lines = $derived(String(value || '').replace(/\r/g, '').split('\n'));
    const items = $derived(lines.map((l, i) => { const m = TASK.exec(l); return m ? { i, task: true, done: m[2] !== ' ', text: m[3] } : { i, task: false, text: l }; }));
    const tasks = $derived(items.filter((x) => x.task));
    const done = $derived(tasks.filter((x) => x.done).length);
    function write(next) { value = next.join('\n'); if (typeof onchange === 'function') onchange(value); }
    function flip(it) { const next = lines.slice(); next[it.i] = next[it.i].replace(/\[( |x|X)\]/, it.done ? '[ ]' : '[x]'); write(next); }
    function drop(it) { const next = lines.slice(); next.splice(it.i, 1); write(next); }
    function addTask(e) {
        e.preventDefault();
        const t = draft.trim();
        if (!t) return;
        const next = String(value || '') === '' ? [] : lines.slice();
        while (next.length && !next[next.length - 1].trim()) next.pop();
        next.push('- [ ] ' + t);
        write(next);
        draft = '';
    }
    const inline = (t) => (K ? K.doc.inlineHtml(t) : t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])));
</script>

<div class="kdcl kdcl-{look} {className}">
    {#if tasks.length}
        <div class="kdcl-progress"><span>{done} of {tasks.length} done{done === tasks.length ? '!' : ''}</span><span class="kdcl-bar" aria-hidden="true"><i style:width={(done / tasks.length) * 100 + '%'}></i></span></div>
    {/if}
    <ul class="kdcl-list">
        {#each items as it (it.i)}
            {#if it.task}
                <li class="kdcl-task" class:done={it.done}>
                    <label><input type="checkbox" checked={it.done} onchange={() => flip(it)} /><span class="kdcl-text">{@html inline(it.text)}</span></label>
                    {#if editable}<button type="button" class="kdcl-x" aria-label={'Remove task: ' + it.text} onclick={() => drop(it)}><svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 2.5l7 7M9.5 2.5l-7 7" /></svg></button>{/if}
                </li>
            {:else if it.text.trim()}
                <li class="kdcl-note keydown-doc">{@html K ? K.render(it.text) : it.text}</li>
            {/if}
        {/each}
    </ul>
    {#if editable}
        <form class="kdcl-add" onsubmit={addTask}>
            <input bind:value={draft} placeholder="Add a task (Keydown works: **bold**, =B=orb=B=…)" aria-label="New task" />
            <button type="submit" disabled={!draft.trim()}>Add</button>
        </form>
    {/if}
</div>

<style>
    .kdcl { font: 15px/1.45 system-ui, sans-serif; color: #0c4a6e; border-radius: 16px; padding: 12px 14px; border: 1px solid rgba(2, 132, 199, 0.35); background: linear-gradient(180deg, #fff, #f0f9ff); }
    .kdcl-pool { background: linear-gradient(180deg, #fff, #ecfeff); }
    .kdcl-progress { display: flex; align-items: center; gap: 10px; font: 700 13px system-ui, sans-serif; color: #0369a1; margin-bottom: 8px; }
    .kdcl-bar { flex: 1; height: 8px; border-radius: 999px; background: #e0f2fe; overflow: hidden; }
    .kdcl-bar i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #38bdf8, #0284c7); transition: width 0.25s; }
    .kdcl-pool .kdcl-bar i { background: linear-gradient(90deg, #67e8f9, #00b2e3); box-shadow: inset -4px 0 0 #f97316; }
    .kdcl-list { list-style: none; margin: 0; padding: 0; }
    .kdcl-task { display: flex; align-items: center; gap: 6px; padding: 4px 6px; border-radius: 10px; }
    .kdcl-task:hover { background: rgba(186, 230, 253, 0.4); }
    .kdcl-task label { flex: 1; display: flex; align-items: flex-start; gap: 9px; cursor: pointer; }
    .kdcl-task input { width: 18px; height: 18px; margin-top: 2px; accent-color: #0284c7; flex: none; }
    .done .kdcl-text { opacity: 0.6; text-decoration: line-through; text-decoration-color: #0284c7; }
    .kdcl-note { padding: 6px 6px 2px; }
    .kdcl-note :global(:is(h1, h2, h3, .header-1, .header-2, .header-3)) { margin: 0.3em 0 0.1em; }
    .kdcl-x { display: inline-flex; padding: 5px; border: 0; border-radius: 50%; background: none; color: #0369a1; cursor: pointer; opacity: 0.55; }
    .kdcl-x:hover, .kdcl-x:focus-visible { opacity: 1; background: rgba(2, 132, 199, 0.12); }
    .kdcl-x svg { width: 10px; height: 10px; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; }
    .kdcl-add { display: flex; gap: 6px; margin-top: 10px; }
    .kdcl-add input { flex: 1; min-width: 0; padding: 7px 12px; border-radius: 999px; border: 1px solid rgba(2, 132, 199, 0.35); font: inherit; font-size: 14px; }
    .kdcl-add input:focus { outline: 2px solid #38bdf8; outline-offset: 0; }
    .kdcl-add button { padding: 7px 16px; border-radius: 999px; border: 1px solid #0369a1; font: 700 13px system-ui, sans-serif; color: #fff; background: linear-gradient(180deg, #38bdf8, #0284c7); cursor: pointer; }
    .kdcl-add button:disabled { opacity: 0.45; cursor: default; }
    button:focus-visible { outline: 3px solid #f97316; outline-offset: 2px; }
</style>
