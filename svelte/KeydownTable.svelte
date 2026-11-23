<!--
  KeydownTable.svelte: a table typed as text, where every cell is Keydown, and columns sort when you click them!

  <KeydownTable text={`
    | Swimmer | Club | Time |
    | --- | --- | ---: |
    | **Kai** | =B=Sharks=B= | 57.94 |
    | Marina | #O(Dolphins) | 58.21 |
  `} />
  <KeydownTable text={csv} separator="," caption="Results" />

  Rows are lines; cells are split by | (Markdown style, with an optional --- line that can set alignment with :---, :---: and ---:)
  or by the separator you give (',' or '\t' for CSV and TSV). The first row is the header.
  Props: text, separator ('|' default), caption, sortable (true), look ('aero' or 'pool'), class.
  Needs KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import { onMount } from 'svelte';
    import { engine, dedent } from './KeydownCore.js';

    let { text = '', separator = '|', caption = '', sortable = true, look = 'aero', class: className = '' } = $props();
    let K = $state(null);
    let sortCol = $state(-1), sortDir = $state(1);
    onMount(() => { K = engine(); });
    function split(line) {
        if (separator === '|') return line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
        // CSV: quotes may hold the separator ("a, b")
        const out = []; let cur = '', q = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (q) { if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch; }
            else if (ch === '"') q = true; else if (ch === separator) { out.push(cur.trim()); cur = ''; } else cur += ch;
        }
        out.push(cur.trim());
        return out;
    }
    const table = $derived.by(() => {
        const rows = dedent(text).split('\n').filter((l) => l.trim());
        let align = [];
        const body = [];
        rows.forEach((l, i) => {
            const cells = split(l);
            if (separator === '|' && i === 1 && cells.every((c) => /^:?-{2,}:?$/.test(c))) { align = cells.map((c) => (/^:-+:$/.test(c) ? 'center' : /-:$/.test(c) ? 'right' : 'left')); return; }
            body.push(cells);
        });
        const head = body.shift() || [];
        const width = Math.max(head.length, ...body.map((r) => r.length));
        return { head, rows: body.map((r) => Array.from({ length: width }, (_, j) => r[j] ?? '')), align, width };
    });
    const plain = (s) => String(s).replace(/[*_~=#%^+:;!?,@&`$\\()]/g, '').trim();
    const rows = $derived.by(() => {
        if (sortCol < 0) return table.rows;
        const c = sortCol;
        return [...table.rows].sort((a, b) => { const x = plain(a[c]), y = plain(b[c]); const nx = parseFloat(x), ny = parseFloat(y); return (!isNaN(nx) && !isNaN(ny) ? nx - ny : x.localeCompare(y, undefined, { numeric: true })) * sortDir; });
    });
    function sort(c) { if (!sortable) return; if (sortCol === c) sortDir = -sortDir; else { sortCol = c; sortDir = 1; } }
    const cell = (s) => (K ? K.doc.inlineHtml(s) : s.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])));
</script>

<div class="kdtb-wrap kdtb-{look} {className}">
    <table class="kdtb">
        {#if caption}<caption>{caption}</caption>{/if}
        <thead><tr>
            {#each Array.from({ length: table.width }) as _, j (j)}
                <th scope="col" style:text-align={table.align[j] || 'left'} aria-sort={sortCol === j ? (sortDir > 0 ? 'ascending' : 'descending') : undefined}>
                    {#if sortable}<button type="button" onclick={() => sort(j)}>{@html cell(table.head[j] || '')}<svg viewBox="0 0 12 12" aria-hidden="true" class:on={sortCol === j} class:desc={sortCol === j && sortDir < 0}><path d="M3 7.5l3-3 3 3" /></svg></button>
                    {:else}{@html cell(table.head[j] || '')}{/if}
                </th>
            {/each}
        </tr></thead>
        <tbody>
            {#each rows as r, i (i)}<tr>{#each r as c, j (j)}<td style:text-align={table.align[j] || 'left'}>{@html cell(c)}</td>{/each}</tr>{/each}
        </tbody>
    </table>
</div>

<style>
    .kdtb-wrap { overflow-x: auto; border-radius: 14px; border: 1px solid rgba(2, 132, 199, 0.35); background: #fff; box-shadow: 0 6px 18px rgba(3, 105, 161, 0.12); }
    .kdtb { width: 100%; border-collapse: collapse; font: 14px system-ui, sans-serif; color: #0c4a6e; font-variant-numeric: tabular-nums; }
    caption { caption-side: top; text-align: left; padding: 10px 14px 6px; font-weight: 800; color: #075985; }
    thead tr { background: linear-gradient(180deg, #7dd3fc, #0284c7); }
    .kdtb-pool thead tr { background: linear-gradient(180deg, #67e8f9, #00b2e3); box-shadow: inset 0 -3px 0 #f97316; }
    th { padding: 9px 14px 11px; color: #fff; font-weight: 800; text-shadow: 0 1px 2px rgba(7, 89, 133, 0.45); white-space: nowrap; }
    th button { all: unset; display: inline-flex; align-items: center; gap: 5px; cursor: pointer; border-radius: 6px; }
    th button:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
    th svg { width: 12px; height: 12px; fill: none; stroke: rgba(255, 255, 255, 0.5); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
    th svg.on { stroke: #fff; } th svg.desc { transform: rotate(180deg); }
    td { padding: 8px 14px; border-top: 1px solid #e0f2fe; }
    tbody tr:nth-child(even) td { background: #f0f9ff; }
</style>
