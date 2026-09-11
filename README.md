Multi-PDF Smart Searcher - User Guide
🚀 Core Feature
This tool is a PDF viewer and search utility that runs entirely within your browser. It allows you to load multiple PDF files simultaneously and treat them as a single, continuous document for global search and navigation. All operations are performed locally on your device; your files are never uploaded to any server.

Third parties: the page loads Google Analytics (gtag.js) from Google's servers, so page views are reported to Google. That is the only outbound request the app makes — no part of a PDF, its filename, your search terms or your notes is ever sent anywhere. Everything else, pdf.js and pdf-lib included, is served from this site, so the viewer works offline once the page is cached.

🛠️ Interface and Operations
Q1: How do I get started?

Click the Choose one or more PDF files button in the top-left corner to select the PDF files you wish to view from your computer or mobile device. You can select multiple files at once by holding down Ctrl (Windows) or Command ⌘ (Mac).

Q2: Why does an "開啟上次檔案" button sometimes appear?

To improve your workflow, this tool features a "Remember Last Session" function.

First-Time Use: After you load one or more PDF files for the first time, the tool automatically saves a copy of these files securely within your own browser.

Next Visit: The next time you open this page, the application detects the saved files and shows an 開啟上次檔案 button in the toolbar. This allows you to restore your last session with a single click, without needing to select the files again.

Privacy & How It Works:
This feature is powered by the browser's IndexedDB technology. Copies of your files are stored only on your local device and are never uploaded to any online server. If you clear your browser's site data for this page, the saved files will also be removed.

Q3: How do I open/close the function menu on a mobile device?

On touch devices like phones or tablets, you will see a teal ☰ 選單 handle on the left side. Tap this handle to slide the function menu in or out. You can also quickly collapse the menu by tapping on the PDF content area on the right. When first opened on a mobile device, the menu defaults to expanded for your convenience.

Q4: How do I search across multiple PDF files?

Enter your keywords in the "Keyword or Regex" input box. You can separate multiple keywords with a space, e.g., company report.

Click the Search button.

Once the search is complete, a search results panel opens, listing every page that contains the keywords with a snippet of the surrounding text.

Use the file filter above the list to narrow it to a single document, and the list / thumbnail button to switch between the compact list and thumbnail previews.

Advanced Search Tip: You can use regular expressions for more powerful searches. Simply enclose your expression in slashes. For example, /Chapter \d+/i will perform a case-insensitive search for "Chapter" followed by one or more digits.

Q5: On a computer, how can I see which file a search result came from?

Each entry in the results panel shows its source filename next to the page number, whenever more than one file is loaded.

Q6: How do I navigate between pages?

Use the Previous Page / Next Page buttons to go through pages one by one.

Drag the slider next to the page number for quick navigation.

Enter a page number in the input box and click the Go button to jump directly to a specific global page number.

(Recommended) On touch devices, simply swipe left or right on the PDF to turn pages for a smoother experience.

📱 Mobile Device Experience
Q7: What are the special functions of the swipe gesture?

The swipe gesture is designed to enhance browsing efficiency on mobile devices:

Normal Mode: When you are not in search mode, swiping left or right will take you to the previous or next page.

Search Mode: After you have performed a search, swiping left or right will jump directly to the page containing the previous or next search result, allowing you to quickly browse through all matches.

Stepping through results wraps around: past the last result you land back on the first. Your position is always shown in the results bar as i / total.

Note: To avoid conflicts, the swipe-to-navigate feature is temporarily disabled when the highlighter, text selection, paragraph selection, or magnifier tools are active.

🎨 Markup and View Functions (Floating buttons in the bottom-right corner)
Q8: What do the buttons in the bottom-right corner do?

This is a set of quick action buttons for easy access to various tools while you read.

Toggle Search Underlines: If you find the wavy underlines for search results distracting, click this button to temporarily hide them. Click it again to show them.

Text Selection: By default, text selection is disabled so pinch-to-zoom and swipe-to-turn-the-page work without the drag turning into a selection instead. Click this button to make the PDF content selectable, allowing you to copy text. Click it again to disable. Copy Page Text and Paragraph Select both require it.

Highlighter: After clicking, you can freely draw on the PDF page, just like using a real highlighter.

Clear Highlights: Erases the highlighter marks on the current page. Marks on other pages are kept, and they stay put when you change pages or zoom — but they live in memory only, so they are gone once you reload.

Magnifier: When enabled, move your mouse (on a computer) or drag your finger (on a mobile device) to see a real-time magnified view.

Share Page: If your browser supports it, this allows you to share the current page (with highlights) as an image to other applications.

Paragraph Selection: Requires Text Selection. Click once on a paragraph and the whole paragraph is highlighted, with a Copy button.

Copy Page Text: Requires Text Selection. Copies every word on the current page to the clipboard.

Share App Link: Shares the address of this page, tagged so that LINE opens it in the phone's default browser.

Notes List: Lists every note saved for the loaded files; pick one to jump to its page.

Add Note: Click anywhere on the PDF to drop a note there. Desktop only — the mobile menu omits it, and notes open read-only on a phone.

Q9: Is there anything else in the results panel?

Yes — a collapsed find bar. Once you pick a result the sheet folds down to a
single strip showing 第 N 頁 · i / total with ‹ › steppers, so you can walk
through the hits without the sheet covering the page. The steppers, the arrow
keys and swipe all respect the file filter, so with one file selected they
stay inside it.

Q10: Can I install it as an app / use it offline?

Yes. It ships a web app manifest and a service worker, so a browser can install
it to the home screen or dock, and it keeps working with no network. Opening the
site from inside the LINE in-app browser shows a prompt to reopen it in a real
browser, where installing and file access work properly.

⚙️ Other Settings
Q11: How do I adjust the magnifier's zoom level?

When the magnifier is enabled, a "Magnifier Zoom" option will appear in the function menu. You can select a zoom level from 1.5x to 3.5x.

🛠️ Developing

Serve the folder over HTTP (`python3 -m http.server 8931`) rather than opening
index.html directly — it is an ES module app with a service worker, and
neither works from file://.

Before concluding a change did not work, check you are not looking at a cached
copy. There are two layers:

- The HTTP cache. style.css, script.js and db.js carry a `?v=` token, so a
  bump changes the URL and sidesteps it — run `npm run bump-cache` to move all
  three together. index.html and instructions.html have no token, so they can
  be re-served from cache instead of fetched. This bites hardest locally:
  `python3 -m http.server` sends Last-Modified and no Cache-Control, so the
  browser caches heuristically and a file untouched for weeks stays "fresh"
  for days. GitHub Pages sends `Cache-Control: max-age=600` with an ETag, so
  in production the same window is ten minutes and then a cheap 304.
  To tell whether the network was reached: `transferSize` of 0 from
  `performance.getEntriesByType('navigation')[0]` is the cross-browser signal;
  a Size of `(disk cache)` in DevTools and `deliveryType === 'cache'` say the
  same thing but are Chromium-only.
  The service worker fetches with `cache: 'no-cache'`, so once it controls the
  page every request revalidates. It cannot help with the *first* navigation
  of a fresh profile, which the browser handles before the worker exists —
  `workerStart` is 0 there (note that `workerStart` is also 0 for cross-origin
  responses without Timing-Allow-Origin, so only read it for same-origin).
  Unregistering the worker from the console does not clear the HTTP cache, so
  for a quick iteration use DevTools' Disable cache or Empty Cache and Hard
  Reload, and keep Clear site data for when you want a genuinely clean
  profile.
- The service worker cache. Bump `CACHE_VERSION` in service-worker.js whenever
  a precached file changes. To start clean: unregister the worker and clear
  the caches (Application → Storage → Clear site data).

`npm run lint` covers script.js, db.js, service-worker.js and tools/.

📄 License
The code written for this project is released under the MIT License. See LICENSE.

It bundles PDF.js (Apache-2.0), pdf-lib (MIT) and the Lucide icon paths (ISC). Their licenses, and the notices they require, are collected in THIRD-PARTY-NOTICES.md.
