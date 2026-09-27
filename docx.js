// DOCX → PDF, entirely in the browser, so a Word file goes through the same
// pdf.js pipeline as a PDF: search, result list, thumbnails, export, notes.
//
// docx-preview lays each page out from the file's own page size, margins,
// fonts, alignment, headers and footers, and splits pages where Word last
// broke them. Each page is an html2canvas screenshot of that, with the text
// laid over it again in render mode 3 (invisible), the way an OCR'd scan is
// built. The text font is a CID font with Identity-H encoding, a ToUnicode map
// and no embedded font file: invisible text draws no glyphs, so no CJK font
// has to be downloaded, and pdf.js still reads every character back for search.

const PT = 0.75;      // px → pt
const FONT = 'DocxText';

function loadScript(src, global) {
    if (window[global]) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = () => reject(new Error('無法載入 DOCX 轉換元件'));
        document.head.appendChild(s);
    });
}

// A file not saved by Word (generated, or from another editor) carries no
// page-break markers, so one section can run far past its page. Move the
// overflow into copies of that section, header and footer included, whole
// blocks at a time; a block taller than a page keeps a taller page.
function splitOverflow(section) {
    const pageHeight = parseFloat(getComputedStyle(section).minHeight);
    const article = section.querySelector(':scope > article');
    if (!pageHeight || !article || section.offsetHeight <= pageHeight + 1) return [section];

    const header = section.querySelector(':scope > header');
    const footer = section.querySelector(':scope > footer');
    const blocks = [...article.childNodes];
    article.replaceChildren();
    const pages = [section];
    let body = article;
    for (const block of blocks) {
        body.appendChild(block);
        const page = pages[pages.length - 1];
        if (page.offsetHeight > pageHeight + 1 && body.childNodes.length > 1) {
            body.removeChild(block);
            const next = section.cloneNode(false);
            body = article.cloneNode(false);
            if (header) next.appendChild(header.cloneNode(true));
            next.appendChild(body);
            if (footer) next.appendChild(footer.cloneNode(true));
            page.after(next);
            pages.push(next);
            body.appendChild(block);
        }
    }
    return pages;
}

const hex4 = n => n.toString(16).padStart(4, '0').toUpperCase();

// Each line of text goes out as one TJ run: the first glyph placed with Tm,
// every later one nudged by a TJ adjustment to exactly where the browser put
// it. pdf.js then keeps the line as a single text item, which its search
// underline needs (it marks whole items: glyph-by-glyph Tm split 預算 into
// two one-character items and nothing matched). The widths go to the font's
// /W array so the text-layer spans, and so the highlights, line up.
function textOps(page, widths) {
    const base = page.getBoundingClientRect();
    const height = page.offsetHeight;
    const range = document.createRange();
    const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
    const glyphs = [];
    let node;
    while ((node = walker.nextNode())) {
        const size = parseFloat(getComputedStyle(node.parentElement).fontSize) || 16;
        const text = node.nodeValue;
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i);
            if (code >= 0xD800 && code <= 0xDFFF) continue; // outside a 2-byte CID
            if (code < 32) continue;
            range.setStart(node, i);
            range.setEnd(node, i + 1);
            const r = range.getClientRects()[0];
            if (!r || !r.width) continue; // whitespace collapsed away
            if (!(code in widths)) widths[code] = Math.round(r.width / size * 1000);
            glyphs.push({
                code,
                size: size * PT,
                x: (r.left - base.left) * PT,
                y: (height - (r.bottom - base.top) + size * 0.22) * PT
            });
        }
    }

    const ops = ['BT 3 Tr'];
    let run = null;
    const flush = () => {
        if (run) ops.push(`[${run.parts.join(' ')}] TJ`);
        run = null;
    };
    for (const g of glyphs) {
        const sameLine = run && g.size === run.size &&
            Math.abs(g.y - run.y) < g.size * 0.5 && g.x >= run.penX - g.size;
        if (!sameLine) {
            flush();
            ops.push(`/${FONT} ${g.size.toFixed(2)} Tf 1 0 0 1 ${g.x.toFixed(2)} ${g.y.toFixed(2)} Tm`);
            run = { size: g.size, y: g.y, penX: g.x, parts: [] };
        } else {
            // TJ numbers are thousandths of the font size, subtracted from the pen.
            const adjust = Math.round((run.penX - g.x) * 1000 / g.size);
            if (adjust) run.parts.push(adjust);
        }
        run.parts.push(`<${hex4(g.code)}>`);
        run.penX = g.x + widths[g.code] * g.size / 1000;
    }
    flush();
    ops.push('ET');
    return ops.join('\n');
}

function toUnicodeCMap() {
    const ranges = [];
    for (let hi = 0; hi < 256; hi++) {
        const h = hi.toString(16).padStart(2, '0').toUpperCase();
        ranges.push(`<${h}00> <${h}FF> <${h}00>`);
    }
    const blocks = [];
    for (let i = 0; i < ranges.length; i += 100) {
        const part = ranges.slice(i, i + 100);
        blocks.push(`${part.length} beginbfrange\n${part.join('\n')}\nendbfrange`);
    }
    return `/CIDInit /ProcSet findresource begin
12 dict begin
begincmap
/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def
/CMapName /Adobe-Identity-UCS def
/CMapType 2 def
1 begincodespacerange
<0000> <FFFF>
endcodespacerange
${blocks.join('\n')}
endcmap
CMapName currentdict /CMap defineresource pop
end
end`;
}

function registerFont(ctx, fontRef, widths, PDFString) {
    const w = [];
    Object.keys(widths).map(Number).sort((a, b) => a - b).forEach(c => w.push(c, [widths[c]]));
    const descriptor = ctx.register(ctx.obj({
        Type: 'FontDescriptor', FontName: FONT, Flags: 4,
        FontBBox: [0, -200, 1000, 900], ItalicAngle: 0,
        Ascent: 880, Descent: -120, CapHeight: 700, StemV: 80
    }));
    const cidFont = ctx.register(ctx.obj({
        Type: 'Font', Subtype: 'CIDFontType2', BaseFont: FONT,
        CIDSystemInfo: { Registry: PDFString.of('Adobe'), Ordering: PDFString.of('Identity'), Supplement: 0 },
        FontDescriptor: descriptor, DW: 1000, W: w, CIDToGIDMap: 'Identity'
    }));
    const toUnicode = ctx.register(ctx.flateStream(toUnicodeCMap()));
    ctx.assign(fontRef, ctx.obj({
        Type: 'Font', Subtype: 'Type0', BaseFont: FONT, Encoding: 'Identity-H',
        DescendantFonts: [cidFont], ToUnicode: toUnicode
    }));
}

// The browser paints the page itself: the page and docx-preview's styles go
// into an SVG <foreignObject>, drawn onto a canvas. html2canvas re-implements
// all of CSS in script and spent ~90% of a conversion there; this is the same
// picture from the real layout engine. It stays as the fallback for a browser
// that refuses (a tainted canvas, a failed decode).
async function paintPage(page, styles, scale) {
    const w = page.offsetWidth;
    const h = page.offsetHeight;
    const xml = new XMLSerializer();
    const body = styles.map(s => xml.serializeToString(s)).join('') + xml.serializeToString(page);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
        `<foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml">${body}</div></foreignObject></svg>`;
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const g = canvas.getContext('2d');
    g.fillStyle = '#fff';
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
}

async function html2canvasPage(page, scale) {
    await loadScript('./lib/html2canvas/html2canvas.min.js', 'html2canvas');
    return window.html2canvas(page, { scale, backgroundColor: '#fff', logging: false });
}

// toBlob encodes off the main thread; toDataURL blocked it and then made a
// base64 string pdf-lib had to decode again.
function jpegBytes(canvas) {
    return new Promise((resolve, reject) => canvas.toBlob(blob => {
        if (!blob) return reject(new Error('canvas export failed'));
        blob.arrayBuffer().then(buf => resolve(new Uint8Array(buf)), reject);
    }, 'image/jpeg', 0.85));
}

export async function docxToPdf(file, isMobile, onProgress = () => {}) {
    // docx-preview picks up JSZip as it loads, so JSZip goes first.
    await loadScript('./lib/jszip/jszip.min.js', 'JSZip');
    await loadScript('./lib/docx-preview/docx-preview.min.js', 'docx');

    const host = document.createElement('div');
    host.style.cssText = 'position:fixed;left:-20000px;top:0;pointer-events:none';
    document.body.appendChild(host);
    try {
        await window.docx.renderAsync(await file.arrayBuffer(), host, host, {
            inWrapper: false,
            breakPages: true,
            ignoreLastRenderedPageBreak: false,
            experimental: true,
            useBase64URL: true
        });
        await Promise.all([...host.querySelectorAll('img')].map(img => img.decode().catch(() => {})));
        // Word records where it last broke each page as well as the explicit
        // breaks; where the two coincide docx-preview emits an empty page. A
        // 500-page file came out with scores of them, each one more page to
        // turn through.
        const hasContent = page => {
            const body = page.querySelector(':scope > article') || page;
            return body.textContent.trim() !== '' || body.querySelector('img, svg, canvas, table, hr');
        };
        const pages = [...host.querySelectorAll('section.docx')].flatMap(splitOverflow).filter(hasContent);
        if (!pages.length) throw new Error('文件沒有可顯示的內容');

        const { PDFDocument, PDFName, PDFString } = await import('./lib/pdf-lib/pdf-lib.esm.min.js');
        const pdf = await PDFDocument.create();
        const ctx = pdf.context;
        const fontRef = ctx.nextRef();
        const widths = {};
        // A phone runs out of canvas memory long before a desktop does.
        const scale = isMobile ? 1.5 : 2;

        const styles = [...host.querySelectorAll('style')];
        let native = true;
        for (const [i, page] of pages.entries()) {
            onProgress(i + 1, pages.length);
            const w = page.offsetWidth * PT;
            const h = page.offsetHeight * PT;
            let canvas, bytes;
            if (native) {
                try {
                    canvas = await paintPage(page, styles, scale);
                    bytes = await jpegBytes(canvas); // throws on a tainted canvas
                } catch (err) {
                    console.warn('Native page paint unavailable, using html2canvas:', err);
                    native = false;
                }
            }
            if (!native) {
                canvas = await html2canvasPage(page, scale);
                bytes = await jpegBytes(canvas);
            }
            const jpg = await pdf.embedJpg(bytes);
            canvas.width = canvas.height = 0;
            const out = pdf.addPage([w, h]);
            out.drawImage(jpg, { x: 0, y: 0, width: w, height: h });
            out.node.setFontDictionary(PDFName.of(FONT), fontRef);
            out.node.addContentStream(ctx.register(ctx.flateStream(textOps(page, widths))));
        }
        registerFont(ctx, fontRef, widths, PDFString);
        return await pdf.save();
    } finally {
        host.remove();
    }
}
