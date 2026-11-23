<!--
  KeydownExport.svelte: buttons that take a Keydown text out of the page: as a .kd file, a web page that keeps every style,
  plain text, copied HTML, or printed (or saved as a PDF from the print window).

  <KeydownExport text={notes} name="pool-notes" />
  <KeydownExport text={notes} show={['html', 'print']} title="Pool notes" />

  Props: text (Keydown), name (the file name without its ending, default 'keydown'), title (the web page's title),
         show (which buttons: 'kd', 'html', 'txt', 'copy', 'print'; default all), look ('aero' or 'pool'), class.
  The web page carries the Keydown styles it needs, so it looks the same when opened anywhere.
  Needs KeydownCore.js and KeydownBox.svelte in the same folder. Svelte 5.
-->
<script>
    import { onMount } from 'svelte';
    import { engine } from './KeydownCore.js';

    let { text = '', name = 'keydown', title = '', show = ['kd', 'html', 'txt', 'copy', 'print'], look = 'aero', class: className = '' } = $props();
    let K = $state(null);
    let said = $state('');
    onMount(() => { K = engine(); });
    const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const body = () => (K ? K.render(String(text || '')) : esc(text));
    // every style rule on the page that Keydown's output uses (the ones whose class names appear in it), plus KaTeX's sheet for math
    function styles(html) {
        const used = new Set((html.match(/class="([^"]+)"/g) || []).flatMap((m) => m.slice(7, -1).split(/\s+/)));
        const out = [];
        for (const sheet of Array.from(document.styleSheets)) {
            let rules;
            try { rules = sheet.cssRules; } catch (e) { continue; }
            for (const r of Array.from(rules || [])) {
                const sel = r.selectorText;
                if (!sel) { if (r.type === CSSRule.KEYFRAMES_RULE || r.type === CSSRule.FONT_FACE_RULE) out.push(r.cssText); continue; }
                const names = sel.match(/\.[\w-]+/g);
                if (names && names.some((n) => used.has(n.slice(1)))) out.push(r.cssText);
            }
        }
        return out.join('\n');
    }
    function page() {
        const html = body();
        const katex = /class="katex/.test(html) ? '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">' : '';
        return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + esc(title || name) + '</title>' + katex +
            '<style>body{max-width:760px;margin:40px auto;padding:0 20px;font:16px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;color:#0f172a;background:#fff}\n' + styles(html) + '</style></head><body><main class="keydown-doc">' + html + '</main></body></html>';
    }
    // (innerText only keeps line breaks for text that is laid out, so the text sits off-screen for a moment)
    function plain() {
        const d = document.createElement('div');
        d.style.cssText = 'position:fixed;left:-30000px;top:0;width:700px;opacity:0;pointer-events:none';
        d.innerHTML = body();
        document.body.appendChild(d);
        const t = (d.innerText || d.textContent || '').replace(/\u200B/g, '').replace(/\n{3,}/g, '\n\n').trim();
        d.remove();
        return t;
    }
    function save(file, data, type) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([data], { type: type + ';charset=utf-8' }));
        a.download = file;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    }
    function tell(m) { said = m; setTimeout(() => { if (said === m) said = ''; }, 2500); }
    const ACTIONS = {
        kd: ['.kd file', () => { save(name + '.kd', String(text || ''), 'text/plain'); tell('Saved ' + name + '.kd!'); }],
        html: ['Web page', () => { save(name + '.html', page(), 'text/html'); tell('Saved ' + name + '.html!'); }],
        txt: ['Plain text', () => { save(name + '.txt', plain(), 'text/plain'); tell('Saved ' + name + '.txt!'); }],
        copy: ['Copy', async () => {
            try {
                const html = body();
                if (window.ClipboardItem) await navigator.clipboard.write([new ClipboardItem({ 'text/html': new Blob([html], { type: 'text/html' }), 'text/plain': new Blob([plain()], { type: 'text/plain' }) })]);
                else await navigator.clipboard.writeText(plain());
                tell('Copied, with its formatting!');
            } catch (e) { tell('The browser would not let me copy!'); }
        }],
        print: ['Print', () => {
            // a hidden frame holds the finished page, so only the text is printed
            const f = document.createElement('iframe');
            f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
            f.srcdoc = page();
            f.onload = () => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {} setTimeout(() => f.remove(), 60000); };
            document.body.appendChild(f);
        }]
    };
    const ICON = {
        kd: '<path d="M6 3.5h8l4.5 4.5v12.5H6z"/><path d="M14 3.5V8h4.5M12 11v6m0 0l-2.5-2.5M12 17l2.5-2.5"/>',
        html: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 2.5 14.4 0 17M12 3.5c-2.5 2.6-2.5 14.4 0 17"/>',
        txt: '<path d="M6 3.5h12v17H6z"/><path d="M9 8h6M9 11.5h6M9 15h4"/>',
        copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
        print: '<path d="M7 9V3.5h10V9M7 17H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2"/><path d="M7 14h10v6.5H7z"/>'
    };
</script>

<div class="kdex kdex-{look} {className}" role="group" aria-label="Export">
    {#each show.filter((k) => ACTIONS[k]) as k (k)}
        <button type="button" onclick={ACTIONS[k][1]}><svg viewBox="0 0 24 24" aria-hidden="true">{@html ICON[k]}</svg>{ACTIONS[k][0]}</button>
    {/each}
    <span class="kdex-said" role="status">{said}</span>
</div>

<style>
    .kdex { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font: 13px system-ui, sans-serif; }
    button { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 999px; cursor: pointer; font: 700 13px system-ui, sans-serif; color: #075985;
        border: 1px solid rgba(2, 132, 199, 0.4); background: linear-gradient(180deg, #ffffff 0%, #e0f2fe 50%, #bae6fd 100%); box-shadow: inset 0 1px 0 #fff; }
    button:hover { filter: brightness(1.04); }
    .kdex-pool button { background: linear-gradient(180deg, #ffffff 0%, #ecfeff 50%, #a5f3fc 100%); box-shadow: inset 0 1px 0 #fff, inset 0 -2px 0 #f97316; }
    button:focus-visible { outline: 3px solid #f97316; outline-offset: 2px; }
    svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
    .kdex-said { color: #0369a1; font-weight: 700; }
</style>
