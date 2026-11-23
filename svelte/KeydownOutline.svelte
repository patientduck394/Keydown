<!--
  KeydownOutline.svelte: a table of contents built from a Keydown document's headings (#, ##, ###, ####)!

  <script>
    import KeydownOutline from './KeydownOutline.svelte';
    import KeydownText from './KeydownText.svelte';
    let doc = $state('# Intro\n...\n## Setup\n...\n## Use\n### Tips');
    let page = $state();
  </script>
  <KeydownOutline text={doc} target={page} />
  <div bind:this={page}><KeydownText text={doc} /></div>

  With target (the element the document is drawn in), a click scrolls to that heading; onjump is called
  either way with { level, title, index }. Headings inside ``` code fences are skipped.
  Props: text (Keydown), target (an element), title (default 'Contents'), numbered (1, 1.1, 1.2... default false),
         onjump(heading), class.
  No other files needed (it reads the text itself). Svelte 5.
-->
<script>
    let { text = '', target = undefined, title = 'Contents', numbered = false, onjump = undefined, class: className = '' } = $props();

    const items = $derived.by(() => {
        const out = [];
        let fence = false;
        const nums = [0, 0, 0, 0];
        String(text || '').split('\n').forEach((line) => {
            if (/^\s*```/.test(line)) { fence = !fence; return; }
            if (fence) return;
            const m = /^\s*(#{1,4})\s+(.+?)\s*#*\s*$/.exec(line);
            if (!m) return;
            const level = m[1].length === 4 ? 1 : m[1].length;
            nums[level - 1]++;
            for (let k = level; k < 4; k++) nums[k] = 0;
            // the heading's words, without Keydown tags
            const words = m[2].replace(/#[A-Z]{1,2}[#(.][a-z]*\(?|[*_~`=@^]+|\)|##/g, '').replace(/\s+/g, ' ').trim();
            out.push({ level, title: words || m[2], index: out.length, num: nums.slice(0, level).join('.') });
        });
        return out;
    });
    function jump(h) {
        if (target) {
            const heads = target.querySelectorAll('h1, h2, h3, h4');
            const el = heads[h.index];
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                el.animate([{ backgroundColor: 'rgba(56,189,248,.35)' }, { backgroundColor: 'transparent' }], { duration: 1200 });
            }
        }
        if (typeof onjump === 'function') onjump(h);
    }
</script>

<nav class="kdo {className}" aria-label={title}>
    {#if title}<div class="kdo-title">{title}</div>{/if}
    {#if items.length}
        <ul>
            {#each items as h (h.index)}
                <li style:padding-left={(h.level - 1) * 14 + 'px'} class="kdo-l{h.level}">
                    <button type="button" onclick={() => jump(h)}>{#if numbered}<span class="kdo-num">{h.num}</span>{/if}{h.title}</button>
                </li>
            {/each}
        </ul>
    {:else}
        <p class="kdo-empty">No headings yet! Start a line with # to add one!</p>
    {/if}
</nav>

<style>
    .kdo { border: 1px solid rgba(2, 132, 199, 0.3); border-radius: 12px; background: linear-gradient(180deg, #f0f9ff, #fff); padding: 8px 6px; font: 13px/1.4 system-ui, sans-serif; }
    .kdo-title { font-weight: 800; color: #0369a1; padding: 2px 8px 6px; text-transform: uppercase; font-size: 11.5px; letter-spacing: 0.06em; }
    ul { list-style: none; margin: 0; padding: 0; }
    button { display: block; width: 100%; text-align: left; border: 0; background: none; padding: 4px 8px; border-radius: 7px; color: #0f172a; cursor: pointer; font: inherit; }
    button:hover { background: rgba(56, 189, 248, 0.15); color: #0369a1; }
    .kdo-l1 button { font-weight: 700; }
    .kdo-l3 button, .kdo-l4 button { color: #475569; font-size: 12.5px; }
    .kdo-num { color: #0284c7; font-weight: 700; margin-right: 6px; font-variant-numeric: tabular-nums; }
    .kdo-empty { color: #64748b; margin: 4px 8px; }
</style>
