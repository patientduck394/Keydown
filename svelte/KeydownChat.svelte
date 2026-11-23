<!--
  KeydownChat.svelte: a chat thread whose messages are Keydown (gel chips, marks, math...), with a composer!

  <script>
    import KeydownChat from './KeydownChat.svelte';
    let messages = $state([
      { who: 'Ada', text: 'Has anyone tried the new #B.halo(halo) mark?', at: Date.now() - 60000 },
      { who: 'You', text: 'Yes! And **math**: $e^{i\\pi}+1=0$', mine: true }
    ]);
  </script>
  <KeydownChat bind:messages me="You" onsend={(m) => saveMessage(m)} height="420px" />

  saveMessage is YOUR function (not part of the component): whatever sends the message on, like
    async function saveMessage(m) { await fetch('/api/messages', { method: 'POST', body: JSON.stringify(m) }); }
  or Radii Office's collab, or a WebSocket. Leave onsend out and the chat just keeps the messages on the page.

  Each message: { who, text (Keydown), at (a time in ms, optional), mine (true for your own) }.
  Sending adds { who: me, text, at: now, mine: true } to messages and calls onsend with it
  (return false from onsend to keep it out of the list, for instance if your server adds it back itself).

  Props: messages (bindable), me (your name, default 'You'), height (default '400px'), placeholder,
         readonly (no composer), onsend(message), class, style.
  Needs KeydownText.svelte, KeydownComposer.svelte, KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import { tick } from 'svelte';
    import KeydownText from './KeydownText.svelte';
    import KeydownComposer from './KeydownComposer.svelte';

    let { messages = $bindable([]), me = 'You', height = '400px', placeholder = 'Write a message… (Ctrl+Enter sends)', readonly = false, onsend = undefined, class: className = '', style = undefined } = $props();
    let list = $state();
    const COLORS = ['#0284c7', '#16a34a', '#d97706', '#9333ea', '#db2777', '#0d9488', '#dc2626', '#4f46e5'];
    const colorOf = (n) => COLORS[[...String(n || '?')].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7) % COLORS.length];
    const initials = (n) => String(n || '?').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    const time = (t) => (t ? new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
    const mine = (m) => m.mine === true || (m.mine === undefined && m.who === me);
    async function scrollDown() { await tick(); if (list) list.scrollTop = list.scrollHeight; }
    $effect(() => { messages.length; scrollDown(); });
    function send({ text }) {
        const t = String(text || '').trim();
        if (!t) return false;
        const m = { who: me, text: t, at: Date.now(), mine: true };
        const keep = typeof onsend === 'function' ? onsend(m) : undefined;
        if (keep !== false) messages = [...messages, m];
        return true;
    }
</script>

<div class="kdc {className}" {style} style:--kdc-h={height}>
    <div class="kdc-list" bind:this={list} role="log" aria-live="polite">
        {#each messages as m, i (i)}
            {@const own = mine(m)}
            {@const same = i > 0 && messages[i - 1].who === m.who}
            <div class="kdc-row" class:kdc-mine={own} class:kdc-same={same}>
                {#if !own}<span class="kdc-av" style:background={colorOf(m.who)} style:visibility={same ? 'hidden' : 'visible'} aria-hidden="true">{initials(m.who)}</span>{/if}
                <div class="kdc-bubble">
                    {#if !same && !own}<div class="kdc-who" style:color={colorOf(m.who)}>{m.who}</div>{/if}
                    <KeydownText text={m.text} />
                    {#if m.at}<div class="kdc-time">{time(m.at)}</div>{/if}
                </div>
            </div>
        {:else}
            <p class="kdc-empty">No messages yet! Say hi!</p>
        {/each}
    </div>
    {#if !readonly}
        <div class="kdc-compose"><KeydownComposer onsubmit={send} {placeholder} /></div>
    {/if}
</div>

<style>
    .kdc { display: flex; flex-direction: column; height: var(--kdc-h); border: 1px solid rgba(2, 132, 199, 0.35); border-radius: 16px; overflow: hidden; background: linear-gradient(180deg, #f0f9ff, #ffffff 30%); }
    .kdc-list { flex: 1; overflow: auto; padding: 12px; display: flex; flex-direction: column; gap: 6px; }
    .kdc-row { display: flex; align-items: flex-end; gap: 8px; max-width: 86%; }
    .kdc-row.kdc-same { margin-top: -3px; }
    .kdc-mine { align-self: flex-end; flex-direction: row-reverse; }
    .kdc-av { flex: none; width: 30px; height: 30px; border-radius: 50%; color: #fff; font: 800 12px system-ui, sans-serif; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.45); }
    .kdc-bubble { padding: 7px 12px 5px; border-radius: 16px 16px 16px 6px; background: #fff; border: 1px solid rgba(148, 163, 184, 0.4); box-shadow: 0 2px 6px rgba(15, 23, 42, 0.06); min-width: 0; }
    .kdc-mine .kdc-bubble { border-radius: 16px 16px 6px 16px; background: linear-gradient(180deg, #e0f2fe, #bae6fd); border-color: rgba(2, 132, 199, 0.35); }
    .kdc-who { font: 800 12px system-ui, sans-serif; margin-bottom: 1px; }
    .kdc-time { font-size: 10.5px; color: #64748b; text-align: right; margin-top: 1px; }
    .kdc-bubble :global(.keydown-doc) { line-height: 1.5; }
    .kdc-empty { margin: auto; color: #64748b; }
    .kdc-compose { border-top: 1px solid rgba(2, 132, 199, 0.2); padding: 8px; background: #f8fbff; }
</style>
