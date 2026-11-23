<!--
  KeydownCard.svelte: a glossy card with a Keydown title and Keydown text, in Frutiger Aero, Poolside or lime!

  <KeydownCard title="#B(Weather)" text={'Sunny, **24°**, a light #C.glow(breeze)!'} look="aero" />
  <KeydownCard title="Pool party" look="pool" href="/party">
    Saturday at *noon*, bring a =O=towel=O=!
  </KeydownCard>

  Props: title (one line of Keydown), text (or the words between the tags), look ('aero' default, 'pool' or 'lime'),
         icon (an SVG string or a short word, shown in a gel bubble), href (the card becomes a link), class, style.
  Needs KeydownText.svelte, KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import { onMount } from 'svelte';
    import KeydownText from './KeydownText.svelte';
    import { engine, mathWriteBack } from './KeydownCore.js';

    let { title = '', text = $bindable(undefined), look = 'aero', icon = '', href = undefined, children = undefined, class: className = '', style = undefined } = $props();
    let K = $state(null);
    const wb = { get: () => text, set: (t) => { text = t; } };
    onMount(() => { K = engine(); });
    const isSvg = $derived(/^\s*<svg[\s>]/i.test(String(icon)));
</script>

<svelte:element this={href ? 'a' : 'article'} {href} class="kdcard kdcard-{look} {className}" {style}>
    {#if title || icon}
        <header class="kdcard-head">
            {#if icon}<span class="kdcard-icon" aria-hidden="true">{#if isSvg}{@html icon}{:else}{icon}{/if}</span>{/if}
            <span class="kdcard-title">{#if K}{@html K.doc.inlineHtml(String(title))}{:else}{title}{/if}</span>
        </header>
    {/if}
    <div class="kdcard-body" use:mathWriteBack={wb}>
        {#if text !== undefined}<KeydownText {text} />{:else if children}<KeydownText {children} />{/if}
    </div>
</svelte:element>

<style>
    .kdcard { display: block; position: relative; border-radius: 18px; overflow: hidden; color: #0f172a; text-decoration: none; background: #fff;
        border: 1px solid var(--kc-line); box-shadow: 0 8px 22px var(--kc-shadow), inset 0 1px 0 #fff; transition: transform 0.15s, box-shadow 0.15s; }
    a.kdcard:hover { transform: translateY(-2px); box-shadow: 0 12px 28px var(--kc-shadow); }
    .kdcard-aero { --kc-a: #7dd3fc; --kc-b: #0284c7; --kc-line: rgba(2, 132, 199, 0.35); --kc-shadow: rgba(3, 105, 161, 0.18); --kc-ink: #fff; }
    /* Poolside: clear water (cyan to blue) with orange as a crisp accent, never blended into the water */
    .kdcard-pool { --kc-a: #67e8f9; --kc-b: #00b2e3; --kc-line: rgba(14, 165, 233, 0.45); --kc-shadow: rgba(8, 145, 178, 0.2); --kc-ink: #fff; }
    .kdcard-pool .kdcard-head { box-shadow: inset 0 -4px 0 #f97316; background: radial-gradient(120% 60% at 20% 0%, rgba(255, 255, 255, 0.5), transparent 60%), repeating-radial-gradient(circle at 80% 140%, rgba(255, 255, 255, 0.14) 0 6px, transparent 6px 14px), linear-gradient(180deg, var(--kc-a), var(--kc-b)); }
    .kdcard-pool .kdcard-icon { color: #c2410c; }
    .kdcard-lime { --kc-a: #e7ff9e; --kc-b: #84cc16; --kc-line: rgba(132, 204, 22, 0.5); --kc-shadow: rgba(77, 124, 15, 0.2); --kc-ink: #1a2e05; }
    .kdcard-head { display: flex; align-items: center; gap: 10px; padding: 12px 16px; color: var(--kc-ink); font: 800 16px system-ui, sans-serif;
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0.1) 48%, transparent 52%), linear-gradient(180deg, var(--kc-a), var(--kc-b));
        text-shadow: 0 1px 1px rgba(0, 0, 0, 0.25); }
    .kdcard-lime .kdcard-head { text-shadow: none; }
    .kdcard-icon { display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; flex: none; font-size: 15px;
        background: radial-gradient(circle at 35% 30%, #fff, rgba(255, 255, 255, 0.55) 45%, rgba(255, 255, 255, 0.25)); color: #075985; box-shadow: inset 0 -2px 4px rgba(0, 0, 0, 0.12); }
    .kdcard-icon :global(svg) { width: 18px; height: 18px; }
    .kdcard-title { min-width: 0; }
    .kdcard-body { padding: 12px 16px 14px; }
</style>
