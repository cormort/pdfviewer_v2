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

// One positioned glyph per character. The widths go to the font's /W array so
// pdf.js sizes its text-layer spans, and so the search highlights, to match.
function textOps(page, widths) {
    const base = page.getBoundingClientRect();
    const height = page.offsetHeight;
    const range = document.createRange();
    const walker = document.createTreeWalker(page, NodeFilter.SHOW_TEXT);
    const ops = ['BT 3 Tr'];
    let lastSize = 0;
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
            if (size !== lastSize) {
                ops.push(`/${FONT} ${(size * PT).toFixed(2)} Tf`);
                lastSize = size;
            }
            const x = (r.left - base.left) * PT;
            const y = (height - (r.bottom - base.top) + size * 0.22) * PT;
            ops.push(`1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm <${hex4(code)}> Tj`);
        }
    }
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

export async function docxToPdf(file, isMobile) {
    // docx-preview picks up JSZip as it loads, so JSZip goes first.
    await loadScript('./lib/jszip/jszip.min.js', 'JSZip');
    await Promise.all([
        loadScript('./lib/docx-preview/docx-preview.min.js', 'docx'),
        loadScript('./lib/html2canvas/html2canvas.min.js', 'html2canvas')
    ]);

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
        const pages = [...host.querySelectorAll('section.docx')].flatMap(splitOverflow);
        if (!pages.length) throw new Error('文件沒有可顯示的內容');

        const { PDFDocument, PDFName, PDFString } = await import('./lib/pdf-lib/pdf-lib.esm.min.js');
        const pdf = await PDFDocument.create();
        const ctx = pdf.context;
        const fontRef = ctx.nextRef();
        const widths = {};
        // A phone runs out of canvas memory long before a desktop does.
        const scale = isMobile ? 1.5 : 2;

        for (const page of pages) {
            const w = page.offsetWidth * PT;
            const h = page.offsetHeight * PT;
            const canvas = await window.html2canvas(page, { scale, backgroundColor: '#fff', logging: false });
            const jpg = await pdf.embedJpg(canvas.toDataURL('image/jpeg', 0.85));
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
