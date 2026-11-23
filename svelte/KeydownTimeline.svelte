<!--
  KeydownTimeline.svelte: a timeline written in Keydown! One event per line: when :: what happened.

  <KeydownTimeline text={`
    2004 :: Frutiger Aero begins: =B=glossy=B= buttons everywhere!
    2007 :: **Windows Vista** and its #C.glow(Aero glass)
    2026 :: Radii Office brings it back!
  `} />

  Lines without " :: " join the event above as more details (any Keydown). Props: text, look ('aero' or 'pool'),
  reverse (newest first), class. It is a list (ol) for screen readers, with each date in a <time>-like label.
  Needs KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import { onMount } from 'svelte';
    import { engine, dedent } from './KeydownCore.js';

    let { text = '', look = 'aero', reverse = false, class: className = '' } = $props();
    let K = $state(null);
    onMount(() => { K = engine(); });
    const events = $derived.by(() => {
        const out = [];
        dedent(text).split('\n').forEach((l) => {
            const m = /^(.+?)\s+::\s+(.*)$/.exec(l);
            if (m) out.push({ when: m[1].trim(), what: m[2].trim(), more: [] });
            else if (l.trim() && out.length) out[out.length - 1].more.push(l);
        });
        return reverse ? out.reverse() : out;
    });
</script>

<ol class="kdtl kdtl-{look} {className}">
    {#each events as ev, i (i)}
        <li>
            <span class="kdtl-dot" aria-hidden="true"></span>
            <span class="kdtl-when">{@html K ? K.doc.inlineHtml(ev.when) : ev.when}</span>
            <div class="kdtl-what">{@html K ? K.doc.inlineHtml(ev.what) : ev.what}</div>
            {#if ev.more.length}<div class="kdtl-more keydown-doc">{@html K ? K.render(ev.more.join('\n')) : ev.more.join('\n')}</div>{/if}
        </li>
    {/each}
</ol>

<style>
    .kdtl { list-style: none; margin: 0; padding: 0 0 0 26px; position: relative; font: 15px/1.45 system-ui, sans-serif; color: #0f172a; }
    .kdtl::before { content: ''; position: absolute; left: 8px; top: 8px; bottom: 8px; width: 4px; border-radius: 2px; background: linear-gradient(180deg, #7dd3fc, #0284c7); }
    /* Poolside: the line is a lane rope, orange and white floats (not a cyan-to-orange blend) */
    .kdtl-pool::before { background: repeating-linear-gradient(180deg, #f97316 0 8px, #fff 8px 14px); box-shadow: 0 0 0 1px rgba(194, 65, 12, 0.25); }
    li { position: relative; padding: 0 0 18px 10px; }
    li:last-child { padding-bottom: 0; }
    .kdtl-dot { position: absolute; left: -24px; top: 3px; width: 16px; height: 16px; border-radius: 50%; border: 3px solid #fff;
        background: radial-gradient(circle at 35% 30%, #fff 0 18%, transparent 24%), linear-gradient(180deg, #7dd3fc, #0284c7); box-shadow: 0 0 0 1px #0284c7, 0 2px 5px rgba(3, 105, 161, 0.35); }
    .kdtl-pool .kdtl-dot { background: radial-gradient(circle at 35% 30%, #fff 0 18%, transparent 24%), linear-gradient(180deg, #67e8f9, #00b2e3); }
    .kdtl-when { display: inline-block; padding: 0 10px; border-radius: 999px; font: 800 12.5px system-ui, sans-serif; color: #fff; background: linear-gradient(180deg, #38bdf8, #0284c7); text-shadow: 0 1px 1px rgba(7, 89, 133, 0.45); }
    .kdtl-what { margin-top: 3px; font-weight: 600; }
    .kdtl-more { margin-top: 4px; color: #334155; font-size: 14px; }
</style>
