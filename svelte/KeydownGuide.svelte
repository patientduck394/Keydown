<!--
  KeydownGuide.svelte: a live reference of every Keydown tag, with a search box! Each row shows the tag to type
  and the style it makes, drawn for real.

  <KeydownGuide />                              the whole guide
  <KeydownGuide bind:filter={q} search={false} />   your own search box: filter="orb" shows just the matching rows
  <KeydownGuide height="420px" />               scrolls inside a box that tall

  Props: filter (bindable text to search for, e.g. "bubble" or "=Y="), search (show the search box, default true),
         height (e.g. '420px', default: as tall as it needs), class.
  Needs KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import { onMount } from 'svelte';
    import { engine } from './KeydownCore.js';

    let { filter = $bindable(''), search = true, height = undefined, class: className = '' } = $props();
    let html = $state('');
    let root = $state();
    let shown = $state(0);

    onMount(() => { html = engine().guide(); });
    // hide the rows (and groups) that don't match
    $effect(() => {
        const q = filter.trim().toLowerCase();
        html;
        if (!root) return;
        queueMicrotask(() => {
            let n = 0;
            root.querySelectorAll('.kd-guide-group').forEach((g) => {
                let any = false;
                g.querySelectorAll('.kd-guide-row').forEach((r) => {
                    const ok = !q || r.textContent.toLowerCase().includes(q);
                    r.style.display = ok ? '' : 'none';
                    if (ok) { any = true; n++; }
                });
                const title = g.querySelector('.kd-guide-title');
                const titleHit = q && title && title.textContent.toLowerCase().includes(q);
                if (titleHit) { g.querySelectorAll('.kd-guide-row').forEach((r) => { r.style.display = ''; n++; }); any = true; }
                g.style.display = any || !q ? '' : 'none';
            });
            shown = n;
        });
    });
</script>

<div class="kdg {className}">
    {#if search}
        <div class="kdg-search">
            <input type="search" placeholder="Search the tags: orb, bubble, =Y=, ticket…" bind:value={filter} aria-label="Search Keydown tags" />
            {#if filter.trim()}<span class="kdg-count">{shown} {shown === 1 ? 'match' : 'matches'}</span>{/if}
        </div>
    {/if}
    <div class="kdg-body keydown-doc" bind:this={root} style:max-height={height} style:overflow-y={height ? 'auto' : undefined}>
        {@html html}
    </div>
</div>

<style>
    .kdg { font-family: 'Segoe UI', 'Frutiger', system-ui, sans-serif; color: #0f172a; }
    .kdg-search { position: sticky; top: 0; z-index: 1; display: flex; align-items: center; gap: 10px; padding: 8px 4px; background: #ffffff; }
    .kdg-search input {
        flex: 1; padding: 7px 14px; border-radius: 999px; border: 1px solid #0369a1; font: 600 14px system-ui, sans-serif; outline: none;
        background: linear-gradient(180deg, #e8f6ff, #ffffff 45%); box-shadow: inset 0 2px 3px rgba(3, 105, 161, 0.18);
    }
    .kdg-search input:focus { box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.35), inset 0 2px 3px rgba(3, 105, 161, 0.18); }
    .kdg-count { font-size: 12px; font-weight: 700; color: #0369a1; white-space: nowrap; }
    .kdg-body :global(.kd-guide-note) { padding: 8px 12px; margin: 4px 0 10px; border-radius: 10px; background: #e0f7ff; border: 1px solid #7dd3fc; color: #075985; font-size: 14px; }
    .kdg-body :global(.kd-guide-group) { margin: 0 0 16px; }
    .kdg-body :global(.kd-guide-title) { font-weight: 800; font-size: 13px; letter-spacing: 0.03em; color: #075985; padding: 4px 2px; border-bottom: 2px solid #7dd3fc; margin-bottom: 4px; }
    .kdg-body :global(.kd-guide-row) { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 5px 4px; border-bottom: 1px solid #e2e8f0; line-height: 1.9; }
    .kdg-body :global(.kd-guide-row code) { font: 600 12.5px 'JetBrains Mono', ui-monospace, monospace; color: #0f172a; background: #f1f5f9; padding: 2px 7px; border-radius: 6px; word-break: break-all; }
    .kdg-body :global(.kd-guide-row > span) { text-align: right; }
</style>
