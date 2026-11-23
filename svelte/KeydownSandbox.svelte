<!--
  KeydownSandbox.svelte: a BitLang / BBML sandbox, like the program editor in Bitbook!

  <script>
    import KeydownSandbox from './KeydownSandbox.svelte';
    let code = $state('fn onstart():\n    renderRT("=Y=Hello=Y= from **BitLang**!", line="1")');
  </script>
  <KeydownSandbox bind:code title="My program" height="520px" />

  Left: the code, with BitLang's own colors and keys (Tab indents by 4, Backspace undoes a whole tab...).
  Right: the page the program plays on. ▶ Run takes the page over (Esc or ■ Stop gives it back), and
  Ctrl/Cmd+Enter runs from inside the editor.
  BitLang | BBML switches what you are writing: BitLang is the program, BBML is the little markup that sets up
  the page before onstart runs (<line>, <btn do="fn">, <textbox var="x">, {expressions}...).
  ✏️ Draw opens a blank page the size of the output page; draw with Annotate's inks, press Done, and the drawing
  lands in the code as an @@ink line, just like in Bitbook. ? Guide opens the full BitLang guide.

  Props: code (bindable, the BitLang code; empty starts with BitLang's sample), bbml (bindable, the BBML markup),
         title (bindable, the program's name), mode (bindable, 'bitlang' or 'bbml'), height ('520px'),
         autorun (run once when it appears), readonly (look, run and draw nothing new), showTitle (true),
         onrun(), onstop(), class.
  Methods (bind:this={box}): box.run(), box.stop(), box.focus().
  Needs KeydownCore.js and KeydownBox.svelte in the same folder (KeydownBox holds BitLang, Annotate and the Keydown
  engine). Svelte 5.
-->
<script>
    import { onMount } from 'svelte';
    import { prime } from './KeydownCore.js';

    let {
        code = $bindable(''),
        bbml = $bindable(''),
        title = $bindable('Sandbox'),
        mode = $bindable('bitlang'),
        height = '520px',
        autorun = false,
        readonly = false,
        showTitle = true,
        onrun = undefined,
        onstop = undefined,
        class: className = '',
    } = $props();

    let ta = $state();      // the code box
    let hl = $state();      // the colored copy behind it
    let page = $state();    // the page the program plays on
    let progEl = null;      // the program (a hidden BitLang chip inside the page)
    let running = $state(false);
    let canDraw = $state(false);
    let timer = 0;

    const BL = () => window.BitLang;
    const text = () => (mode === 'bbml' ? bbml : code);
    function paint() {
        if (!ta || !hl || !BL()) return;
        hl.innerHTML = (mode === 'bbml' ? BL().highlightBBML(ta.value) : BL().highlight(ta.value)) + '\n';
        hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft;
    }
    function onInput() {
        if (mode === 'bbml') bbml = ta.value; else code = ta.value;
        paint();
    }
    // new code from outside (or a tab switch) goes into the box
    $effect(() => {
        const v = text();
        if (ta && ta.value !== v) { ta.value = v; paint(); }
    });
    $effect(() => { mode; if (ta) { paint(); } });

    function feed() {
        // the hidden BitLang chip holds what the program runs (BitLang reads it when it starts)
        const t = progEl.querySelector('.bl-code');
        t.value = code; t.textContent = '\n' + code;
        let b = progEl.querySelector('.bl-bbml');
        if (bbml.trim()) {
            if (!b) { b = document.createElement('textarea'); b.className = 'bl-bbml'; b.hidden = true; b.setAttribute('spellcheck', 'false'); progEl.appendChild(b); }
            b.value = bbml; b.textContent = '\n' + bbml;
        } else if (b) b.remove();
        progEl.setAttribute('data-bl-title', title || 'Program');
    }
    export function run() {
        if (!progEl || !BL()) return;
        stop(true);
        feed();
        BL().play(progEl);
        running = true;
        if (typeof onrun === 'function') onrun();
    }
    export function stop(quiet) {
        if (!progEl || !BL()) return;
        try { BL().stop(progEl, true); } catch (e) {}
        const was = running;
        running = false;
        if (was && !quiet && typeof onstop === 'function') onstop();
    }
    export function focus() { if (ta) ta.focus(); }

    // ✏️ Draw: Bitbook's own blank page (the size of the output page) with Annotate's inks
    function draw() {
        if (readonly || !progEl || !BL() || !window.AnnotateInk) return;
        stop(true);
        if (mode !== 'bitlang') { mode = 'bitlang'; }
        queueMicrotask(() => {
            BL().openDraw(progEl, (line) => {
                // the drawing goes in at the caret, on a line of its own (with the indent of the line above, so a drawing in onstart() stays in it)
                const at = ta.selectionStart, before = ta.value.slice(0, at);
                const cur = before.slice(before.lastIndexOf('\n') + 1);
                const prev = before.split('\n').reverse().find((ln) => ln.trim()) || '';
                const ind = /^\s*/.exec(cur.trim() ? cur : prev)[0] + (!cur.trim() && /:\s*$/.test(prev) ? '    ' : '');
                ta.focus();
                ta.setRangeText((cur.trim() ? '\n' : '') + ind + line + '\n', at, ta.selectionEnd, 'end');
                onInput();
            });
        });
    }
    function sample() { code = BL().sample; mode = 'bitlang'; }
    function onKey(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); run(); }
    }

    onMount(() => {
        prime();
        const B = BL();
        if (!code && !bbml) code = B.sample;
        // the hidden BitLang chip lives inside the page: when it plays, the page is what the program takes over
        const tmp = document.createElement('div');
        tmp.innerHTML = B.blockHTML(code, undefined, title);
        progEl = tmp.firstElementChild;
        progEl.style.display = 'none';
        page.appendChild(progEl);
        canDraw = !!(window.AnnotateInk && B.openDraw);
        ta.value = text();
        B.codeKeys(ta);
        paint();
        timer = setInterval(() => { const on = !!(progEl && progEl.classList.contains('bl-playing')); if (on !== running) { const was = running; running = on; if (was && !on && typeof onstop === 'function') onstop(); } }, 250);
        if (autorun) setTimeout(run, 50);
        return () => { clearInterval(timer); try { B.stop(progEl, true); } catch (e) {} if (progEl) progEl.remove(); progEl = null; };
    });
</script>

<div class="kds {className}" style:--kds-height={height}>
    <div class="kds-bar">
        {#if showTitle}
            <input class="kds-title" bind:value={title} maxlength="40" spellcheck="false" aria-label="Program name" readonly={readonly} />
        {:else}
            <span class="kds-title-gap"></span>
        {/if}
        <span class="kds-seg" role="tablist" aria-label="Code language">
            <button type="button" class:on={mode === 'bitlang'} role="tab" aria-selected={mode === 'bitlang'} onclick={() => { mode = 'bitlang'; }}>BitLang</button>
            <button type="button" class:on={mode === 'bbml'} role="tab" aria-selected={mode === 'bbml'} onclick={() => { mode = 'bbml'; }}>BBML</button>
        </span>
        <span class="kds-sp"></span>
        <button type="button" class="kds-btn" title="BitLang guide" onclick={() => BL().openDocs()}>? Guide</button>
        {#if canDraw && !readonly}
            <button type="button" class="kds-btn" title="Draw on a blank page the size of the output page: Done puts the drawing into your code" onclick={draw}>✏️ Draw</button>
        {/if}
        {#if !readonly}
            <button type="button" class="kds-btn" title="Start over with BitLang's sample program" onclick={sample}>Sample</button>
        {/if}
        {#if running}
            <button type="button" class="kds-btn kds-stop" onclick={() => stop()}>■ Stop</button>
        {:else}
            <button type="button" class="kds-btn kds-run" title="Run (Ctrl/Cmd+Enter)" onclick={run}>▶ Run</button>
        {/if}
    </div>
    <div class="kds-body">
        <div class="kds-editor">
            <pre class="bl-hl kds-hl" bind:this={hl} aria-hidden="true"></pre>
            <textarea
                class="bl-edit-code kds-code"
                bind:this={ta}
                spellcheck="false"
                autocomplete="off"
                autocapitalize="off"
                aria-label={mode === 'bbml' ? 'BBML markup' : 'BitLang code'}
                readonly={readonly}
                oninput={onInput}
                onkeydown={onKey}
                onscroll={() => { if (hl) { hl.scrollTop = ta.scrollTop; hl.scrollLeft = ta.scrollLeft; } }}
            ></textarea>
            {#if mode === 'bbml'}
                <div class="kds-note">BBML sets up the page before <b>onstart</b> runs: <code>&lt;line&gt;</code>, <code>&lt;btn do="fn"&gt;</code>, <code>&lt;textbox var="x"&gt;</code>, <code>{'{expressions}'}</code>…</div>
            {/if}
        </div>
        <div class="kds-out">
            <!-- the program's page: it takes this over while it runs, and hands it back after -->
            <div class="page-paper kds-page" bind:this={page}>
                <div class="kds-hint">Press <b>▶ Run</b> and your program plays here!</div>
            </div>
        </div>
    </div>
</div>

<style>
    .kds {
        display: flex; flex-direction: column; height: var(--kds-height, 520px); min-height: 280px;
        border-radius: 14px; overflow: hidden; border: 1px solid #0369a1;
        background: #0b1220; box-shadow: 0 10px 28px rgba(3, 105, 161, 0.25);
        font-family: 'Segoe UI', 'Frutiger', system-ui, sans-serif; color: #e2e8f0;
    }
    .kds-bar {
        display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 7px 10px;
        background: linear-gradient(180deg, #e0f7ff, #9bdcfb 55%, #7cc9f2); border-bottom: 1px solid #0369a1;
    }
    .kds-title {
        font: 700 13px 'JetBrains Mono', monospace; padding: 4px 9px; border-radius: 8px; width: 170px;
        border: 1px solid #0369a1; background: rgba(255, 255, 255, 0.9); color: #053b5c; outline: none;
    }
    .kds-title:focus { box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.4); }
    .kds-title-gap { width: 2px; }
    .kds-sp { flex: 1; }
    .kds-seg { display: inline-flex; border: 1px solid #0369a1; border-radius: 999px; overflow: hidden; box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.7); }
    .kds-seg button {
        font: 800 11px 'JetBrains Mono', monospace; padding: 4px 13px; border: 0; cursor: pointer;
        background: linear-gradient(180deg, #ffffff, #e0f2fe); color: #075985;
    }
    .kds-seg button + button { border-left: 1px solid #0369a1; }
    .kds-seg button.on { background: linear-gradient(180deg, #38bdf8, #0284c7); color: #ffffff; text-shadow: 0 1px 1px rgba(0, 0, 0, 0.35); }
    .kds-btn {
        font: 800 12px 'Segoe UI', system-ui, sans-serif; padding: 5px 12px; border-radius: 999px; cursor: pointer;
        border: 1px solid #0369a1; background: linear-gradient(180deg, #ffffff, #d7effd); color: #075985;
        box-shadow: 0 1px 2px rgba(3, 105, 161, 0.3), inset 0 1px 0 #ffffff;
    }
    .kds-btn:hover { filter: brightness(1.05); }
    .kds-run { background: linear-gradient(180deg, #86efac, #16a34a); border-color: #15803d; color: #052e16; }
    .kds-stop { background: linear-gradient(180deg, #fca5a5, #dc2626); border-color: #b91c1c; color: #ffffff; text-shadow: 0 1px 1px rgba(0, 0, 0, 0.35); }
    .kds-body { flex: 1; min-height: 0; display: flex; }
    .kds-editor { position: relative; flex: 1 1 52%; min-width: 0; background: #0f172a; display: flex; flex-direction: column; }
    .kds-editor :global(.kds-hl), .kds-editor :global(.kds-code) { height: 100% !important; font-size: 13px; }
    .kds-editor :global(.kds-hl) { position: absolute; inset: 0; }
    .kds-editor :global(.kds-code) { position: relative; flex: 1; }
    .kds-note { position: absolute; left: 10px; right: 10px; bottom: 8px; padding: 6px 10px; border-radius: 8px; font-size: 11px; line-height: 1.5; background: rgba(14, 165, 233, 0.18); color: #bae6fd; border: 1px solid rgba(56, 189, 248, 0.4); pointer-events: none; }
    .kds-note code { color: #fde68a; }
    .kds-out { flex: 1 1 48%; min-width: 0; border-left: 1px solid #0369a1; background: #cbd5e1; padding: 10px; display: flex; }
    .kds-page {
        flex: 1; min-width: 0; overflow: auto; position: relative; padding: 16px 18px; border-radius: 8px;
        background: #ffffff; color: #0f172a; box-shadow: 0 2px 10px rgba(15, 23, 42, 0.25); font-size: 15px; line-height: 1.6;
    }
    .kds-hint { color: #64748b; font-size: 14px; }
    @media (max-width: 720px) {
        .kds-body { flex-direction: column; }
        .kds-out { border-left: 0; border-top: 1px solid #0369a1; }
    }
</style>
