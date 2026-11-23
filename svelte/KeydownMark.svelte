<!--
  KeydownMark.svelte: words marked with any Annotate style, by name, in any of the 13 colors!

  <KeydownMark style="halo" color="blue">this glows softly</KeydownMark>
  <KeydownMark style="marker" color="Y">key idea</KeydownMark>
  <KeydownMark style="ink" color="turquoise" text={word} />

  Styles (Keydown writes them as #COLOR.style(text)): highlight underline strike box brackets select ink
  marker glow lasso halo spotlight accent bubble dusk prism complement ticket neon stamp washi checker
  halftone aurora mild wrap belt bucket torpedo bottle packet capsule frost pixel flag gem
  Colors, by name or by code: red R, orange O, gold GL, yellow Y, lime L, green G, turquoise TU, teal T,
  cyan C, blue B, purple PR, pink PK, slate SL.

  Props: style (default 'highlight'), color (default 'yellow'), text (instead of the words between the tags),
         class, style attributes go onto the mark (use markStyle for an inline CSS style).
  The words can't contain ( or ): Keydown's mark ends at the first ). Needs KeydownCore.js and KeydownBox.svelte. Svelte 5.
-->
<script module>
    export const MARK_STYLES = ['highlight', 'underline', 'strike', 'box', 'brackets', 'select', 'ink', 'marker', 'glow', 'lasso', 'halo', 'spotlight', 'accent', 'bubble', 'dusk', 'prism', 'complement', 'ticket', 'neon', 'stamp', 'washi', 'checker', 'halftone', 'aurora', 'mild', 'wrap', 'belt', 'bucket', 'torpedo', 'bottle', 'packet', 'capsule', 'frost', 'pixel', 'flag', 'gem'];
    export const MARK_COLORS = [['R', 'red'], ['O', 'orange'], ['GL', 'gold'], ['Y', 'yellow'], ['L', 'lime'], ['G', 'green'], ['TU', 'turquoise'], ['T', 'teal'], ['C', 'cyan'], ['B', 'blue'], ['PR', 'purple'], ['PK', 'pink'], ['SL', 'slate']];
    // the color's Keydown code (from a name or a code)
    export function markCode(color) {
        const c = String(color || 'Y').trim();
        const hit = MARK_COLORS.find(([k, n]) => k === c.toUpperCase() || n === c.toLowerCase());
        return hit ? hit[0] : 'Y';
    }
    // the Keydown text for words in a style: markTag('halo', 'blue', 'hi') gives '#B.halo(hi)'
    export function markTag(style, color, words) {
        const s = MARK_STYLES.includes(style) ? style : 'highlight';
        const inner = String(words == null ? '' : words).replace(/[()]/g, '');
        return '#' + markCode(color) + (s === 'ink' ? '(' : '.' + s + '(') + inner + ')';
    }
</script>

<script>
    import { onMount } from 'svelte';
    import { engine } from './KeydownCore.js';

    let { style = 'highlight', color = 'yellow', text = undefined, children = undefined, class: className = '', markStyle = undefined } = $props();

    let srcEl = $state();
    let words = $state('');
    let K = $state(null);
    onMount(() => {
        K = engine();
        const read = () => { words = srcEl ? srcEl.textContent.replace(/\s+/g, ' ').trim() : ''; };
        read();
        const mo = new MutationObserver(read);
        if (srcEl) mo.observe(srcEl, { childList: true, characterData: true, subtree: true });
        return () => mo.disconnect();
    });
    const html = $derived(K ? K.doc.inlineHtml(markTag(style, color, text !== undefined ? text : words)) : '');
</script>

{#if children}<span bind:this={srcEl} hidden>{@render children()}</span>{/if}
<span class="kdmk {className}" style={markStyle}>{#if K}{@html html}{:else}{text !== undefined ? text : ''}{/if}</span>
