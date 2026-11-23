<!--
  KeydownModes.svelte: a Keydown editor with three modes, like Writeout and Bitbook!
    View    the text, fully formatted, and no editing
    Visual  the live editor (Space or Enter formats a tag as you type)
    Source  the Keydown text itself, in a Monokai code box with syntax colors for every tag, chip, fence, divider,
            blank and block (the same colors as Writeout and Bitbook); switching back formats ALL of it

  <script>
    import KeydownModes from './KeydownModes.svelte';
    let notes = $state('# My notes\nSome *italic*, a #B.halo(halo) and $$e^{i\\pi} + 1 = 0$$');
    let mode = $state('visual');
  </script>
  <KeydownModes bind:value={notes} bind:mode height="360px" />

  Props:
    value        Keydown text, bindable (every mode reads and writes it)
    mode         'view', 'visual' or 'source', bindable (default 'visual')
    modes        which buttons to show (default ['view', 'visual', 'source'])
    height       the editing area's height (default '320px'; 'auto' grows with the text)
    placeholder  hint while the text is empty
    toolbar      format buttons above the Visual editor (default true): bold, italic, code, underline, strike,
                 highlight, Color Ink, any Annotate mark, headings, bullets, quotes, math and links. Each one writes
                 real Keydown, so Source shows **bold**, #Y#highlight##, # Heading and so on.
    onchange     called with the Keydown text each time it changes
    class, style go onto the outer box.
  Needs KeydownText.svelte, KeydownMarkPicker.svelte, KeydownMark.svelte, KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import KeydownText from './KeydownText.svelte';
    import KeydownMarkPicker from './KeydownMarkPicker.svelte';
    import { engine } from './KeydownCore.js';

    let {
        value = $bindable(''),
        mode = $bindable('visual'),
        modes = ['view', 'visual', 'source'],
        height = '320px',
        placeholder = 'Write here!',
        toolbar = true,
        onchange = undefined,
        class: className = '',
        style = undefined
    } = $props();

    const LABELS = { view: '👁 View', visual: '✏️ Visual', source: '</> Source' };
    const TITLES = { view: 'Read it, fully formatted (no editing)', visual: 'Edit the formatted text', source: 'Edit the Keydown text itself' };
    const tell = (t) => { if (typeof onchange === 'function') onchange(t); };

    /* ---------- Source: Monokai colors for the Keydown text (the same highlighter Writeout and Bitbook use) ---------- */
    const escH = function (t) { return String(t).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); };
    const sp = function (cls, t) { return '<span class="' + cls + '">' + escH(t) + '</span>'; };
    // chip and tag marks: ++R+ ++ ;;R; !!#R# #R# ##  ~X~ =R= ^^R^ %R% &&  *sp(  @family-1@  and friends
    const MARKS = '\\{(?:bar|mark|tip)(?:\\s+[#\\w-]+)*(?:\\|[^{}\\n]*)?\\}|\\{/?(?:sc|dots|dim|tip)\\}|\\+\\+[A-Z]{1,2}[+~!%?*:^=/\\-@;#&.,_]|;;[A-Z]{1,2}[;:~]|!!?[#^~=+%:;\\-?/*@!][A-Z]{1,2}[#!]?|[!?]{2}[A-Z]{1,2}[!?]|#[A-Z]{1,2}#(?:[_~=.][a-z]*)?|~[A-Z][A-Z0-9-]*~|=[A-Z]{1,2}=|\\^\\^[A-Z]{1,2}\\^|%[A-Z]{1,2}%|%\\d{1,2}%[A-Z]{1,2}%|&&|@[a-z0-9]+(?:-[1-5])?@|##|#_|#~|#=|#\\]|#-|#\\[\\[|#\\[|#>|\\+\\+|;;|\\^\\^|!!|\\?\\?|\\*>|\\+>';
    const INLINE = new RegExp('(`[^`\\n]+`(?:\\{[A-Za-z0-9|-]+\\})?)|(\\$\\$[^$\\n]+\\$\\$|\\$[^$\\n]+\\$)|(\\[\\[[^\\]\\n]+\\]\\]|\\[[^\\]\\n]+\\]\\([^)\\n]+\\))|(\\*\\*[^*\\n]+\\*\\*)|(\\{\\{[^{}\\n]*\\}\\}|\\[\\^[^\\]\\n]+\\]|\\{align=[a-z]+\\})|(#[A-Z]{1,2}(?:\\.[a-z]+)?\\(|\\*sp\\(|#[%^+:;][A-Z]{1,2}[%^+:;]|!!?[#^~=+%:;\\-?/*@!][A-Z]{1,2}#)|(' + MARKS + ')|(\\*[^*\\s][^*\\n]*\\*)|(⟪…[^⟫\\n]*⟫)|(\\[(?:__|##)\\d+(?:\\|[^\\]\\n]*)?\\])', 'g');
    // (bold, italic and the (...) forms hold more Keydown inside them, so their insides are colored too)
    function hlInline(t) {
        let out = '', last = 0, m;
        const re = new RegExp(INLINE.source, 'g');   // (its own copy: the insides are colored by calling this again)
        while ((m = re.exec(t))) {
            if (m.index > last) out += escH(t.slice(last, m.index));
            let end = m.index + m[0].length;
            if (m[4]) out += '<span class="m-b">**' + hlInline(m[0].slice(2, -2)) + '**</span>';
            else if (m[8]) out += '<span class="m-i">*' + hlInline(m[0].slice(1, -1)) + '*</span>';
            else if (m[6]) {
                // a name( ... ): the closing ) is the one that matches, counting any ( ) inside
                let depth = 1, i = end;
                const paren = m[0].charAt(m[0].length - 1) === '(';
                const closer = paren ? ')' : m[0].charAt(m[0].length - 1);   // (#:G:text: and its cousins end with the same mark that opened them)
                if (paren) { while (i < t.length && depth > 0) { if (t.charAt(i) === '(') depth++; else if (t.charAt(i) === ')') depth--; i++; } }
                else {
                    depth = 1;
                    while (i < t.length) {
                        const ch = t.charAt(i);
                        if (ch === '$') { const z = t.indexOf('$', i + 1); if (z > 0) { i = z + 1; continue; } }   // (math inside can hold the mark)
                        if (ch === closer) { depth = 0; i++; break; }
                        i++;
                    }
                }
                if (depth === 0) { out += sp('m-n', m[0]) + hlInline(t.slice(end, i - 1)) + sp('m-n', closer); end = i; re.lastIndex = i; }
                else out += sp('m-n', m[0]);
            } else out += sp(m[10] ? 'm-p' : m[9] ? 'm-f' : m[1] ? 'm-s' : m[2] ? 'm-t' : m[3] ? 'm-l' : m[5] ? 'm-p' : 'm-n', m[0]);
            last = end;
            if (m[0].length === 0) re.lastIndex++;
            else if (end !== m.index + m[0].length) re.lastIndex = end;
        }
        return out + escH(t.slice(last));
    }
    const CODE_RE = /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(\d+(?:\.\d+)?)\b|\b(fn|var|temp|if|elif|else|while|for|in|return|break|continue|and|or|not|true|false|null)\b|\b([A-Za-z_]\w*)(?=\()/g;
    function hlCode(t) {
        let out = '', last = 0, m;
        CODE_RE.lastIndex = 0;
        while ((m = CODE_RE.exec(t))) {
            if (m.index > last) out += escH(t.slice(last, m.index));
            out += sp(m[1] ? 'm-c' : m[2] ? 'm-s' : m[3] ? 'm-n' : m[4] ? 'm-k' : 'm-h', m[0]);
            last = m.index + m[0].length;
        }
        return out + escH(t.slice(last));
    }
    const PH = /⟪…[^⟫\n]*⟫/;
    function hlLines(text) {
        let fence = false;
        return String(text).split('\n').map(function (line) {
            let m;
            if (/^\s*⟪…[^⟫\n]*⟫\s*$/.test(line)) return sp('m-f', line);
            if (!fence && (m = /^(@@[a-z]+)(=?)("[^"]*")?(```)\s*$/.exec(line.trim()))) { fence = true; return sp('m-k', m[1]) + escH(m[2]) + (m[3] ? sp('m-s', m[3]) : '') + sp('m-p', m[4]); }
            if ((m = /^(\s*```)([A-Za-z0-9_+#.-]*)(\{[^}]*\})?\s*$/.exec(line)) && !fence && (m[2] || m[3])) { fence = true; return sp('m-p', m[1]) + (m[2] ? sp('m-k', m[2]) : '') + (m[3] ? sp('m-s', m[3]) : ''); }
            if (/^\s*```/.test(line)) { fence = !fence; return sp('m-p', line); }
            if (fence) return hlCode(line);
            if ((m = /^(\|+)(.*)$/.exec(line)) && !/^\|.*\|(\{[a-z]+\})?\s*$/.test(line)) return sp('m-d', m[1]) + highlight(m[2]);
            if (/^\s*([-*_=])\1{2,}\s*$/.test(line)) return sp('m-d', line);
            if ((m = /^(\s*)(#{1,4})(\s+)(.*)$/.exec(line))) return escH(m[1]) + sp('m-h', m[2] + m[3]) + '<span class="m-h">' + hlInline(m[4]) + '</span>';
            if ((m = /^(\s*)(!>|\?>|>>|%>|\*>|\+>|->|=>|~>|\$>|#>|\^>|@>|&>|>)(\s+)(.*)$/.exec(line))) return escH(m[1]) + sp('m-k', m[2]) + escH(m[3]) + hlInline(m[4]);
            if ((m = /^(\s*)([*+\-.~=])(\s+)(.*)$/.exec(line))) return escH(m[1]) + sp('m-k', m[2]) + escH(m[3]) + hlInline(m[4]);
            if ((m = /^(::[a-z]+)(\{[^}]*\})?(.*)$/.exec(line))) return sp('m-k', m[1]) + (m[2] ? sp('m-p', m[2]) : '') + hlInline(m[3]);
            if ((m = /^(@@[a-z]+)(=")(.*)(")\s*$/.exec(line))) return sp('m-k', m[1]) + escH(m[2]) + sp('m-s', m[3]) + escH(m[4]);
            if (/^\|.*\|(\{[a-z]+\})?\s*$/.test(line)) return line.split('|').map(function (c, i, a) { return hlInline(c); }).join(sp('m-k', '|'));
            return hlInline(line);
        });
    }
    function highlight(text) { return hlLines(text).join('\n'); }
    const hlHtml = $derived(highlight(String(value || '')) + '\n');
    let hlEl = $state();
    const follow = (e) => { if (hlEl) { hlEl.scrollTop = e.currentTarget.scrollTop; hlEl.scrollLeft = e.currentTarget.scrollLeft; } };

    /* ---------- the Visual mode's format buttons ---------- */
    let vis = $state();            // the Visual editor (KeydownText)
    let markOpen = $state(false);  // the Annotate mark pop-up
    let markStyle = $state('marker'), markColor = $state('yellow');
    let markWords = '';
    const MK = '\uE000';          // an invisible marker for where the caret is, while a line is rewritten
    const keep = (e) => e.preventDefault();   // buttons never take the caret out of the text
    const ed = () => (vis ? vis.editor() : null);
    const sync = () => { const e = ed(); if (!e) return; value = e.getText(); tell(value); };
    let box = $state();            // the whole component
    let saved = null;              // where the caret was when the mark pop-up opened
    const editorEl = () => (box ? box.querySelector('.kdm-visual') : null);
    // the selection, if it is inside the Visual editor (else: the end of the text)
    function here() {
        const el = editorEl(); if (!el) return null;
        const sel = window.getSelection();
        if (sel && sel.rangeCount && el.contains(sel.getRangeAt(0).commonAncestorContainer)) return sel.getRangeAt(0);
        const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); return r;
    }
    function selected() { const r = here(); return r ? r.toString() : ''; }
    // puts HTML where the selection is (replacing it) and leaves the caret just after it
    function put(html, range) {
        const r = range || here(); if (!r) return;
        r.deleteContents();
        const tpl = document.createElement('template');
        tpl.innerHTML = html;
        const last = tpl.content.lastChild;
        r.insertNode(tpl.content);
        const sel = window.getSelection();
        if (last) { const a = document.createRange(); a.setStartAfter(last); a.collapse(true); sel.removeAllRanges(); sel.addRange(a); }
        const el = editorEl(); if (el) el.focus();
    }
    // the Annotate mark the range sits in (marks written with ( ) can't hold another one inside)
    function outerMark(r) {
        if (!r) return null;
        let n = r.commonAncestorContainer;
        n = n.nodeType === 3 ? n.parentElement : n;
        const m = n && n.closest ? n.closest('mark.an-hl') : null;
        return m && editorEl() && editorEl().contains(m) ? m : null;
    }
    // a mark inside a mark: the old one is restyled instead (all of its words take the new style)
    function markOver(r, makeTag) {
        const om = outerMark(r);
        if (!om) return false;
        const whole = document.createRange(); whole.selectNode(om);
        put(engine().doc.inlineHtml(makeTag(om.textContent.replace(/[()]/g, ''))), whole);
        return true;
    }
    // wraps the selection (or a placeholder word) in Keydown, drawn formatted right away
    function wrap(open, close, empty) {
        const e = ed(); if (!e) return;
        if (/\($/.test(open) && markOver(here(), (w) => open + w + close)) { setTimeout(sync, 0); return; }
        const words = selected() || empty || 'text';
        put(engine().doc.inlineHtml(open + words + close));
        setTimeout(sync, 0);
    }
    // a whole-line format ('# ', '## ', '* ', '> '): on, or off when the line already has it
    function line(prefix) {
        const e = ed(); if (!e) return;
        // (only marks where the caret is: the selected words stay)
        const r0 = here(); if (!r0) return;
        const spot = r0.cloneRange(); spot.collapse(true);
        put(MK, spot);
        let t = e.getText();
        const at = t.indexOf(MK);
        if (at < 0) return;
        const ls = t.lastIndexOf('\n', at) + 1, le0 = t.indexOf('\n', at), le = le0 < 0 ? t.length : le0;
        const raw = t.slice(ls, le), off = raw.indexOf(MK), plain = raw.replace(MK, '');
        const m = /^(\s*)(#{1,4}\s+|\*\s+|>\s+)?/.exec(plain), lead = m[1], old = m[2] || '', rest = plain.slice(lead.length + old.length);
        const next = old.trim() === prefix.trim() ? '' : prefix;
        const pos = Math.max(lead.length + next.length, off - old.length + next.length);
        const out = lead + next + rest;
        const text = t.slice(0, ls) + out.slice(0, pos) + MK + out.slice(pos) + t.slice(le);
        e.setText(text);
        // put the caret back where the marker landed, and take the marker out
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
            const i = n.nodeValue.indexOf(MK);
            if (i < 0) continue;
            n.nodeValue = n.nodeValue.slice(0, i) + n.nodeValue.slice(i + 1);
            const r = document.createRange(); r.setStart(n, Math.min(i, n.nodeValue.length)); r.collapse(true);
            const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
            break;
        }
        setTimeout(sync, 0);
    }
    function link() {
        const words = selected() || 'link';
        const url = window.prompt('Link to (https://...)', 'https://');
        if (!url || !/^(https?:|mailto:)/i.test(url.trim())) return;
        const e = ed(); if (!e) return;
        put(engine().doc.inlineHtml('[' + words.replace(/[[\]]/g, '') + '](' + url.trim().replace(/[\s)]/g, '') + ')'));
        setTimeout(sync, 0);
    }
    function openMarks() { const r = here(); saved = r ? r.cloneRange() : null; markWords = r ? r.toString() : ''; markOpen = !markOpen; }
    function applyMark(m) {
        markOpen = false;
        const e = ed(); if (!e) return;
        if (!markOver(saved, (w) => m.wrap(w))) put(engine().doc.inlineHtml(m.wrap(markWords || 'marked')), saved);
        saved = null;
        setTimeout(sync, 0);
    }
    // small line icons (SVG, so they look the same everywhere)
    const ICON = {
        bullet: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="5" cy="7" r="1.6" fill="currentColor"/><circle cx="5" cy="17" r="1.6" fill="currentColor"/><path d="M10 7h10M10 17h10"/></svg>',
        quote: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 6v12M10 9h9M10 15h6"/></svg>',
        highlight: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h16"/><path d="M14.5 4.5l4 4L10 17H6v-4z"/></svg>',
        mark: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="7" width="18" height="10" rx="5"/><path d="M8 12h8"/></svg>',
        math: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 5H6l6 7-6 7h12"/></svg>',
        link: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/></svg>'
    };
    const TOOLS = [
        ['B', 'Bold (**text**)', () => wrap('**', '**'), 'b'], ['I', 'Italic (*text*)', () => wrap('*', '*'), 'i'], ['U', 'Underline (#B#text#_)', () => wrap('#B#', '#_'), 'u'], ['S', 'Strike (#SL#text#~)', () => wrap('#SL#', '#~'), 's'],
        ['</>', 'Code (`text`)', () => wrap('`', '`'), 'c'], '|',
        ['H1', 'Heading (# )', () => line('# '), 'h'], ['H2', 'Subheading (## )', () => line('## '), 'h'], [ICON.bullet, 'Bullet (* )', () => line('* '), 'l'], [ICON.quote, 'Quote (> )', () => line('> '), 'l'], '|',
        [ICON.highlight, 'Highlight (#Y#text##)', () => wrap('#Y#', '##'), 'k'], ['A', 'Color Ink (#R(text))', () => wrap('#R(', ')'), 'ink'], [ICON.mark, 'Annotate mark…', openMarks, 'k'], '|',
        [ICON.math, 'Math ($x^2$)', () => wrap('$', '$', 'x^2'), 'k'], [ICON.link, 'Link ([text](url))', link, 'k']
    ];
    function keyTab(e) {
        // Tab in the Source box puts one | at the start of each picked line (one | is one indent step); Shift+Tab takes one away
        if (e.key !== 'Tab' || e.metaKey || e.ctrlKey || e.altKey) return;
        e.preventDefault();
        const t = e.currentTarget, v = t.value, a = t.selectionStart, z = t.selectionEnd;
        const from = v.lastIndexOf('\n', a - 1) + 1;
        let to = v.indexOf('\n', z > a && v.charAt(z - 1) === '\n' ? z - 1 : z);
        if (to < 0) to = v.length;
        let moved = 0, first = 0;
        const out = v.slice(from, to).split('\n').map((ln, k) => {
            if (!e.shiftKey) { if (k === 0) first = 1; moved++; return '|' + ln; }
            if (/^[\t|]/.test(ln)) { if (k === 0) first = -1; moved--; return ln.slice(1); }
            return ln;
        }).join('\n');
        t.setRangeText(out, from, to, 'preserve');
        t.setSelectionRange(Math.max(from, a + first), Math.max(Math.max(from, a + first), z + moved));
        value = t.value;
        tell(value);
    }
</script>

<div class="kdm {className}" bind:this={box} {style} style:--kdm-h={height}>
    <div class="kdm-bar" role="tablist" aria-label="Editing mode">
        {#each modes as m (m)}
            <button type="button" role="tab" aria-selected={mode === m} title={TITLES[m]} onclick={() => (mode = m)}>{LABELS[m] || m}</button>
        {/each}
    </div>
    {#if mode === 'source'}
        <div class="kdm-srcwrap">
            <pre class="kdm-hl" bind:this={hlEl} aria-hidden="true">{@html hlHtml}</pre>
            <textarea class="kdm-pane kdm-src" bind:value spellcheck="false" {placeholder} oninput={() => tell(value)} onkeydown={keyTab} onscroll={follow} aria-label="Keydown source"></textarea>
        </div>
    {:else if mode === 'visual'}
        {#if toolbar}
            <div class="kdm-tools" role="toolbar" aria-label="Format">
                {#each TOOLS as t, i (i)}
                    {#if t === '|'}<span class="kdm-sep"></span>
                    {:else}<button type="button" class="kdm-t kdm-t-{t[3]}" title={t[1]} aria-label={t[1]} onmousedown={keep} onclick={t[2]}>{#if String(t[0]).startsWith('<svg')}{@html t[0]}{:else}{t[0]}{/if}</button>{/if}
                {/each}
            </div>
            {#if markOpen}
                <div class="kdm-marks"><KeydownMarkPicker bind:style={markStyle} bind:color={markColor} columns={4} onpick={applyMark} /></div>
            {/if}
        {/if}
        <KeydownText bind:this={vis} editable bind:value {placeholder} onchange={tell} class="kdm-pane kdm-visual" />
    {:else}
        <KeydownText text={value} class="kdm-pane kdm-view" />
    {/if}
</div>

<style>
    .kdm { display: flex; flex-direction: column; border: 1px solid rgba(2, 132, 199, 0.35); border-radius: 14px; overflow: hidden; background: #fff; box-shadow: 0 6px 18px rgba(3, 105, 161, 0.12); }
    .kdm-bar { display: flex; gap: 2px; padding: 5px; background: linear-gradient(180deg, #f0f9ff, #e0f2fe); border-bottom: 1px solid rgba(2, 132, 199, 0.25); }
    .kdm-bar button { font: 700 12px system-ui, sans-serif; border: 0; background: none; color: #0369a1; padding: 5px 12px; border-radius: 999px; cursor: pointer; }
    .kdm-bar button[aria-selected='true'] { background: linear-gradient(180deg, #38bdf8, #0284c7); color: #fff; box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5); }
    .kdm :global(.kdm-pane) { box-sizing: border-box; width: 100%; min-height: var(--kdm-h); height: var(--kdm-h); overflow: auto; padding: 14px 18px; margin: 0; border: 0; outline: none; }
    .kdm-tools { display: flex; flex-wrap: wrap; align-items: center; gap: 3px; padding: 5px 8px; border-bottom: 1px solid rgba(2, 132, 199, 0.2); background: #f8fbff; }
    .kdm-t { display: inline-flex; align-items: center; justify-content: center; min-width: 30px; height: 28px; padding: 0 7px; border: 1px solid rgba(2, 132, 199, 0.3); border-radius: 8px; background: linear-gradient(180deg, #ffffff, #e0f2fe); color: #075985; font: 700 13px system-ui, sans-serif; cursor: pointer; }
    .kdm-t:hover { border-color: #0284c7; background: linear-gradient(180deg, #e0f2fe, #bae6fd); }
    .kdm-t-b { font-weight: 900; } .kdm-t-i { font-style: italic; font-family: Georgia, serif; } .kdm-t-u { text-decoration: underline; } .kdm-t-s { text-decoration: line-through; }
    .kdm-t-c { font-family: ui-monospace, Menlo, monospace; font-size: 12px; } .kdm-t-ink { color: #dc2626; font-weight: 900; }
    .kdm-sep { width: 1px; height: 20px; background: rgba(2, 132, 199, 0.25); margin: 0 3px; }
    .kdm-marks { padding: 8px; border-bottom: 1px solid rgba(2, 132, 199, 0.2); background: #f0f9ff; }
    .kdm-srcwrap { position: relative; height: var(--kdm-h); background: #272822; border-top: 1px solid #3e3d32; overflow: hidden; }
    .kdm-hl, .kdm :global(.kdm-src) { box-sizing: border-box; width: 100%; height: 100%; margin: 0; padding: 14px 18px; border: 0; font: 13.5px/1.6 ui-monospace, SFMono-Regular, Menlo, 'JetBrains Mono', monospace; letter-spacing: 0; white-space: pre-wrap; overflow-wrap: break-word; word-break: normal; tab-size: 4; font-variant-ligatures: none; overflow: auto; scrollbar-width: none; }
    .kdm-hl::-webkit-scrollbar, .kdm :global(.kdm-src)::-webkit-scrollbar { display: none; }
    .kdm-hl { position: absolute; inset: 0; color: #f8f8f2; pointer-events: none; }
    .kdm :global(.kdm-src) { position: relative; display: block; resize: none; background: transparent; color: transparent; -webkit-text-fill-color: transparent; caret-color: #f8f8f0; }
    .kdm :global(.kdm-src)::selection { background: #49483e; -webkit-text-fill-color: transparent; }
    .kdm :global(.kdm-src)::placeholder { color: #75715e; -webkit-text-fill-color: #75715e; }
    .kdm-hl :global(.m-h) { color: #a6e22e; font-weight: 700; } .kdm-hl :global(.m-k) { color: #f92672; } .kdm-hl :global(.m-s) { color: #e6db74; }
    .kdm-hl :global(.m-n) { color: #ae81ff; } .kdm-hl :global(.m-c) { color: #75715e; } .kdm-hl :global(.m-t) { color: #66d9ef; }
    .kdm-hl :global(.m-p) { color: #fd971f; } .kdm-hl :global(.m-b) { color: #fd971f; font-weight: 700; } .kdm-hl :global(.m-i) { color: #fd971f; font-style: italic; }
    .kdm-hl :global(.m-l) { color: #66d9ef; text-decoration: underline; } .kdm-hl :global(.m-d) { color: #75715e; }
    .kdm-hl :global(.m-f) { color: #fd971f; background: rgba(253, 151, 31, 0.14); border-radius: 4px; padding: 0 4px; font-style: italic; }
    .kdm :global(.kdm-view) { background: #fff; }
</style>
