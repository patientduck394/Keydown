<!--
  KeydownEditor.svelte: KeydownText's editor version, ready to assign to a variable!

  <script>
    import KeydownEditor from './KeydownEditor.svelte';
    let notes = $state('# My notes\n#G#Type here# and Keydown formats as you go!');
  </script>

  <KeydownEditor bind:value={notes} placeholder="Write here!" />
  <pre>{notes}</pre>        (the Keydown text, always up to date)

  Also bindable: bind:html={html} (the formatted HTML). Everything KeydownText takes works here too
  (placeholder, readonly, spellcheck, sound, onchange, class, style...). Write starting text between the tags
  or pass value; bind:this={box} gives box.editor() (insertSkill, insertTable, unformat, reformat, annotate),
  box.getText(), box.setText(t) and box.focus().
  Needs KeydownText.svelte, KeydownCore.js and KeydownBox.svelte next to it. Svelte 5.
-->
<script>
    import KeydownText from './KeydownText.svelte';
    let { value = $bindable(''), html = $bindable(''), children = undefined, ...rest } = $props();
    let box;
    export function editor() { return box ? box.editor() : null; }
    export function getText() { return box ? box.getText() : value; }
    export function setText(t) { if (box) box.setText(t); }
    export function focus() { if (box) box.focus(); }
</script>

<KeydownText editable bind:this={box} bind:value bind:html {children} {...rest} />
