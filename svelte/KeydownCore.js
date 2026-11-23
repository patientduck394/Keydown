// KeydownCore.js: what the Keydown Svelte components share (they all sit next to KeydownBox.svelte, which holds the engine)!
//   prime()   makes sure the Keydown engine and every Keydown style are on the page (call it in onMount)
//   engine()  prime() and hand back window.Keydown (render, toText, editor, styleCategories, guide, file...)
//   dedent()  the text as written in a template: no blank first/last lines, and the shared indent taken off
import KeydownBox from './KeydownBox.svelte';
import { mount } from 'svelte';

let primed = false;
// KeydownBox.svelte carries the engine (window.Keydown) and every Keydown style; importing it loads the engine,
// and one hidden copy is shown once, so its styles are on the page even when your bundler injects styles on use
export function prime() {
    if (primed || typeof document === 'undefined') return;
    primed = true;
    const host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;visibility:hidden;pointer-events:none';
    document.body.appendChild(host);
    mount(KeydownBox, { target: host, props: { compact: true, toolbar: false, readonly: true, sound: false } });
}
export function engine() { prime(); return window.Keydown; }
// A Svelte action: when someone double-clicks an equation inside this element and edits it, the new LaTeX is written back
// into the text it was drawn from (so a component that only SHOWS Keydown text can still have its math edited)!
//   <div use:mathWriteBack={{ get: () => text, set: (t) => (text = t) }}>{@html html}</div>     the Nth equation of that text changes
//   <span use:mathWriteBack={{ whole: true, set: (tex) => (tex = tex) }}>                        the element shows ONE equation
// (an equation is only handled once: the inner-most element that has this action takes it)
export function mathWriteBack(node, params) {
    let p = params || {};
    const handler = (e) => {
        const d = e.detail;
        if (!d || !d.el || e.__kdMathHandled) return;
        const els = Array.from(node.querySelectorAll('.kd-math'));
        const i = els.indexOf(d.el);
        if (i < 0) return;
        if (p.whole) { if (typeof p.set === 'function') { e.__kdMathHandled = true; p.set(d.tex, d.display); } return; }
        if (typeof p.get !== 'function' || typeof p.set !== 'function' || typeof window.kdMathReplace !== 'function') return;
        const cur = String(p.get() == null ? '' : p.get());
        const next = window.kdMathReplace(cur, i, d.tex, d.display);
        e.__kdMathHandled = true;
        if (next !== cur) p.set(next);
    };
    node.addEventListener('kd-math-edited', handler);
    return { update(np) { p = np || {}; }, destroy() { node.removeEventListener('kd-math-edited', handler); } };
}
export function dedent(s) {
    const lines = String(s == null ? '' : s).replace(/\r\n?/g, '\n').split('\n');
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    const pad = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^[ \t]*/)[0].length));
    return lines.map((l) => (isFinite(pad) ? l.slice(pad) : l).replace(/[ \t]+$/, '')).join('\n');
}
