<!--
  KeydownChip.svelte: one Keydown style around some words, without writing the tags yourself!

  <KeydownChip open="=Y=">Gel orb</KeydownChip>                       a Gel Orb          (=Y=Gel orb=Y=)
  <KeydownChip open="#C#" close="#">Bubble</KeydownChip>             a Bubble Chip      (#C#Bubble#)
  <KeydownChip open="=+G+=">Beacon</KeydownChip>                     a Gel Beacon
  <KeydownChip open="!!R!" close="!!">Ticket</KeydownChip>           a Gel Ticket
  <KeydownChip open="__BK_" close="__">Keycap</KeydownChip>          a Gel Keycap (Arrow ??GL? ... ??, Dogear ,,PK, ... ,, work the same way)
  <KeydownChip unique="pfwhitecap-3">Poolside 4</KeydownChip>         a Unique Style     (@pfwhitecap-3@Poolside 4@)
  <KeydownChip text="Or give the words as a prop" open="**" />       bold

  It sits inside a sentence like any word. Props: open, close (default: the same as open, so styles that close differently need it: Ticket, Arrow, Dogear, Keycap, Bubble Chips), unique (a Unique Style
  as family-N, like 'fdglassbtn-2'), text (instead of putting the words between the tags), class.
  Needs KeydownText.svelte, KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import { onMount } from 'svelte';
    import KeydownText from './KeydownText.svelte';

    let { children = undefined, text = undefined, open = undefined, close = undefined, unique = undefined, class: className = '', ...rest } = $props();
    let srcEl = $state();
    let src = $state('');
    onMount(() => {
        const read = () => { src = srcEl ? srcEl.textContent : ''; };
        read();
        const watch = new MutationObserver(read);
        if (srcEl) watch.observe(srcEl, { childList: true, characterData: true, subtree: true });
        return () => watch.disconnect();
    });
    const words = $derived((text !== undefined ? String(text) : src).trim());
    const markup = $derived(unique ? '@' + unique + '@' + words + '@' : (open ?? '') + words + (open === undefined ? '' : (close ?? open)));
</script>

{#if children}<span hidden bind:this={srcEl}>{@render children()}</span>{/if}<KeydownText inline text={markup} class={className} {...rest} />
