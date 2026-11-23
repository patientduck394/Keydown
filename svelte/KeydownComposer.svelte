<!--
  KeydownComposer.svelte: KeydownBox's compact mode, ready for comment and post composers!
  <KeydownComposer bind:this={composer} bind:value={comment} onsubmit={({ text, html }) => send(text)} />
  <button onclick={() => composer.submit()}>Post</button>   (or Ctrl/Cmd+Enter in the box)
  Every KeydownBox prop works here too (name, required, placeholder, width, height...).
  Needs KeydownBox.svelte next to it (that one holds the Keydown engine and styles).
-->
<script>
    import KeydownBox from './KeydownBox.svelte';
    let { value = $bindable(''), html = $bindable(''), ...rest } = $props();
    let box;
    // (your own Post button: bind:this={composer}, then composer.submit())
    export function submit() { if (box) box.submit(); }
    export function editor() { return box ? box.editor() : null; }
</script>

<KeydownBox compact bind:this={box} bind:value bind:html {...rest} />
