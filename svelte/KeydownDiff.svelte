<!--
  KeydownDiff.svelte: what changed between two versions of a Keydown text, word by word!

  <KeydownDiff before={oldDraft} after={newDraft} />
  <KeydownDiff before={a} after={b} view="split" />

  view: 'source' (default: the Keydown text itself, additions in green and deletions struck in red),
        'split' (the old and the new text side by side, both formatted), or 'result' (just the new text, formatted).
  It also counts what was added and taken away. Props: before, after, view (bindable), class, style.
  Long texts (over 3,000 words) are compared line by line instead, to stay quick.
  Needs KeydownText.svelte, KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import KeydownText from './KeydownText.svelte';

    let { before = '', after = '', view = $bindable('source'), class: className = '', style = undefined } = $props();
    // the longest common subsequence of two token lists, as runs of [kind, text]
    function diff(a, b) {
        const n = a.length, m = b.length;
        const L = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
        for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a[i] === b[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
        const out = [];
        let i = 0, j = 0;
        const push = (k, t) => { const last = out[out.length - 1]; if (last && last[0] === k) last[1] += t; else out.push([k, t]); };
        while (i < n && j < m) {
            if (a[i] === b[j]) { push('=', a[i]); i++; j++; }
            else if (L[i + 1][j] >= L[i][j + 1]) { push('-', a[i]); i++; }
            else { push('+', b[j]); j++; }
        }
        while (i < n) push('-', a[i++]);
        while (j < m) push('+', b[j++]);
        return out;
    }
    const result = $derived.by(() => {
        const A = String(before || ''), B = String(after || '');
        const words = (s) => s.match(/\s+|[^\s]+/g) || [];
        let a = words(A), b = words(B);
        if (a.length > 3000 || b.length > 3000) { a = A.split(/(?<=\n)/); b = B.split(/(?<=\n)/); }
        const runs = diff(a, b);
        const count = (k) => runs.filter((r) => r[0] === k).reduce((s, r) => s + (r[1].match(/\S+/g) || []).length, 0);
        return { runs, added: count('+'), removed: count('-') };
    });
</script>

<div class="kdd {className}" {style}>
    <div class="kdd-bar">
        <span class="kdd-stat"><b class="kdd-plus">+{result.added}</b> <b class="kdd-minus">−{result.removed}</b> words</span>
        <span class="kdd-seg" role="group" aria-label="View">
            {#each [['source', 'Changes'], ['split', 'Side by side'], ['result', 'New text']] as [v, label] (v)}
                <button type="button" aria-pressed={view === v} onclick={() => (view = v)}>{label}</button>
            {/each}
        </span>
    </div>
    {#if view === 'source'}
        <pre class="kdd-src">{#each result.runs as r, i (i)}{#if r[0] === '='}{r[1]}{:else if r[0] === '+'}<ins>{r[1]}</ins>{:else}<del>{r[1]}</del>{/if}{/each}</pre>
    {:else if view === 'split'}
        <div class="kdd-split">
            <div><div class="kdd-label">Before</div><KeydownText text={before} /></div>
            <div><div class="kdd-label">After</div><KeydownText text={after} /></div>
        </div>
    {:else}
        <div class="kdd-one"><KeydownText text={after} /></div>
    {/if}
</div>

<style>
    .kdd { border: 1px solid rgba(2, 132, 199, 0.35); border-radius: 14px; overflow: hidden; background: #fff; }
    .kdd-bar { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; padding: 6px 10px; background: linear-gradient(180deg, #f0f9ff, #e0f2fe); border-bottom: 1px solid rgba(2, 132, 199, 0.25); font: 13px system-ui, sans-serif; }
    .kdd-plus { color: #15803d; } .kdd-minus { color: #b91c1c; }
    .kdd-seg { display: inline-flex; gap: 2px; }
    .kdd-seg button { font: 700 12px system-ui, sans-serif; border: 0; background: none; color: #0369a1; padding: 4px 10px; border-radius: 999px; cursor: pointer; }
    .kdd-seg button[aria-pressed='true'] { background: linear-gradient(180deg, #38bdf8, #0284c7); color: #fff; }
    .kdd-src { margin: 0; padding: 12px 14px; font: 13px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap; word-break: break-word; color: #0f172a; max-height: 420px; overflow: auto; }
    .kdd-src ins { text-decoration: none; background: rgba(34, 197, 94, 0.2); color: #14532d; border-radius: 3px; box-shadow: inset 0 -2px 0 rgba(22, 163, 74, 0.5); }
    .kdd-src del { background: rgba(239, 68, 68, 0.14); color: #7f1d1d; border-radius: 3px; }
    .kdd-split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); }
    .kdd-split > div { padding: 12px 14px; min-width: 0; }
    .kdd-split > div + div { border-left: 1px solid rgba(2, 132, 199, 0.2); }
    .kdd-label { font: 800 11px system-ui, sans-serif; text-transform: uppercase; letter-spacing: 0.06em; color: #0369a1; margin-bottom: 4px; }
    .kdd-one { padding: 12px 14px; }
    @media (max-width: 640px) { .kdd-split { grid-template-columns: minmax(0, 1fr); } .kdd-split > div + div { border-left: 0; border-top: 1px solid rgba(2, 132, 199, 0.2); } }
</style>
