<!--
  KeydownProgram.svelte: a BitLang / BBML program as a button. Click it and a large pop-up covers the screen and
  the program plays in it (the pop-up is the document)! Esc, ■ Stop or the ✕ button closes it again.

  <script>
    import KeydownProgram from './KeydownProgram.svelte';
    const game = 'fn onstart():\n    renderRT("=Y=Hello=Y= from **BitLang**!", line="1")';
  </script>
  <KeydownProgram title="Hello" code={game} />

  A program with a BBML page and a nicer label:
  <KeydownProgram title="Counter" label="Play the counter!" code={game} bbml={'<line>Clicks: {clicks}</line>'} />

  Props: code (the BitLang program), bbml (BBML markup that sets up the page before onstart, optional),
         title (the program's name, default 'Program'), label (the button's words, default the title),
         icon (default '▶'), autostart (open as soon as it appears), onclose(), class.
  Methods (bind:this={prog}): prog.open(), prog.close().
  BitLang runs just like in Bitbook: onstart / onframe / onkey, buttons, text boxes, sounds, drawings...
  (the program's text can use Keydown, too: =Y=gel=Y=, **bold**, #C#chips#). The code goes in the code prop
  (a JavaScript string), because braces and indentation inside a Svelte template get in the way.
  Needs KeydownCore.js and KeydownBox.svelte in the same folder (KeydownBox holds BitLang and the Keydown engine).
  Svelte 5.
-->
<script>
    import { onMount } from 'svelte';
    import { prime } from './KeydownCore.js';

    let {
        code = '',
        bbml = '',
        title = 'Program',
        label = undefined,
        icon = '▶',
        autostart = false,
        onclose = undefined,
        class: className = '',
    } = $props();

    let overlay = null, page = null, prog = null, watch = null, started = false, beforeScroll = '';

    export function open() {
        if (overlay || typeof document === 'undefined') return;
        prime();
        const BL = window.BitLang;
        if (!BL) return;
        overlay = document.createElement('div');
        overlay.className = 'kdp-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', title || 'Program');
        const x = document.createElement('button');
        x.type = 'button'; x.className = 'kdp-close'; x.textContent = '✕'; x.title = 'Close (Esc)'; x.setAttribute('aria-label', 'Close');
        x.addEventListener('click', close);
        // the page the program takes over: BitLang plays on the nearest .page-paper
        page = document.createElement('div');
        page.className = 'page-paper kdp-page';
        // the program itself: a hidden BitLang chip holding the code (and the BBML)
        const tmp = document.createElement('div');
        tmp.innerHTML = BL.blockHTML(code, undefined, title);
        prog = tmp.firstElementChild;
        prog.style.display = 'none';
        const t = prog.querySelector('.bl-code');
        t.value = code; t.textContent = '\n' + code;
        if (String(bbml).trim()) {
            const b = document.createElement('textarea');
            b.className = 'bl-bbml'; b.hidden = true; b.value = bbml; b.textContent = '\n' + bbml;
            prog.appendChild(b);
        }
        page.appendChild(prog);
        overlay.appendChild(page);
        overlay.appendChild(x);
        document.body.appendChild(overlay);
        beforeScroll = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        // when the program ends (■ Stop, Esc, or it finishes), the pop-up goes with it
        started = false;
        watch = new MutationObserver(() => {
            const view = page.querySelector(':scope > .bl-view');
            if (view) started = true;
            else if (started) close();
        });
        watch.observe(page, { childList: true });
        BL.play(prog);
    }
    export function close() {
        if (!overlay) return;
        const BL = window.BitLang;
        if (watch) { watch.disconnect(); watch = null; }
        try { if (BL && prog) BL.stop(prog, true); } catch (e) {}
        overlay.remove();
        document.body.style.overflow = beforeScroll;
        overlay = null; page = null; prog = null; started = false;
        if (typeof onclose === 'function') onclose();
    }

    onMount(() => {
        prime();
        if (autostart) setTimeout(open, 50);
        return () => close();
    });
</script>

<button type="button" class="kdp-chip {className}" title="Click to play the program" onclick={open}>
    <span class="kdp-icon" aria-hidden="true">{icon}</span>
    <span class="kdp-text">{label ?? title}</span>
</button>

<style>
    .kdp-chip {
        display: inline-flex; align-items: center; gap: 7px; vertical-align: middle; margin: 2px 3px; padding: 4px 11px 4px 5px;
        border-radius: 999px; border: 1px solid #0f172a; cursor: pointer;
        background: linear-gradient(180deg, #475569, #1e293b 55%, #0f172a); color: #e2e8f0;
        font: 700 13px 'JetBrains Mono', ui-monospace, monospace;
        box-shadow: 0 2px 5px rgba(15, 23, 42, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25);
    }
    .kdp-chip:hover { filter: brightness(1.12); }
    .kdp-chip:active { transform: translateY(1px); }
    .kdp-icon {
        display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; font-size: 10px;
        background: radial-gradient(circle at 35% 28%, #ffffff, #86efac 35%, #16a34a); color: #052e16; box-shadow: 0 0 6px rgba(74, 222, 128, 0.7);
    }
    /* the pop-up (made in code, so its styles are global) */
    :global(.kdp-overlay) {
        position: fixed; inset: 0; z-index: 2147483000; display: flex; background: #ffffff;
        animation: kdp-in 0.16s ease-out;
    }
    :global(.kdp-page) {
        flex: 1; min-width: 0; height: 100%; overflow: auto; box-sizing: border-box; padding: 28px 32px; position: relative;
        background: #ffffff; color: #0f172a; font-size: 16px; line-height: 1.6;
    }
    :global(.kdp-close) {
        position: fixed; top: 12px; right: 14px; z-index: 2; width: 34px; height: 34px; border-radius: 50%; cursor: pointer;
        border: 1px solid #0369a1; background: linear-gradient(180deg, #ffffff, #cfeafc); color: #075985; font: 800 15px system-ui, sans-serif;
        box-shadow: 0 2px 6px rgba(3, 105, 161, 0.35);
    }
    :global(.kdp-close:hover) { filter: brightness(1.06); }
    @keyframes -global-kdp-in { from { opacity: 0; transform: scale(0.985); } to { opacity: 1; transform: none; } }
</style>
