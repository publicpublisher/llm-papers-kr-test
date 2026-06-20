(() => {
  "use strict";

  const DATA = Array.isArray(window.TC_ORIGINAL_PARAGRAPHS) ? window.TC_ORIGINAL_PARAGRAPHS : [];
  const SOURCE_URL = window.TC_ORIGINAL_SOURCE_URL || "https://transformer-circuits.pub/";
  if (!DATA.length) return;

  const byId = new Map(DATA.map((item) => [item.id, item]));
  const SELECTOR = "[data-original-id]";
  let menu = null;
  let highlighted = [];

  function ensureStyle() {
    if (document.getElementById("tc-original-context-style")) return;
    const style = document.createElement("style");
    style.id = "tc-original-context-style";
    style.textContent = `
      [data-original-id] { scroll-margin-top: 72px; }
      [data-original-id].tc-original-active {
        outline: 2px solid rgba(37, 99, 235, 0.32);
        outline-offset: 4px;
        background: linear-gradient(90deg, rgba(59,130,246,0.085), rgba(59,130,246,0.025));
        border-radius: 5px;
      }
      .tc-original-menu {
        position: fixed;
        z-index: 2147483647;
        width: min(92vw, 620px);
        height: auto;
        min-width: 280px;
        min-height: 200px;
        max-width: 96vw;
        max-height: 82vh;
        overflow: visible;
        display: flex;
        flex-direction: column;
        color: #172033;
        background: rgba(255, 255, 255, 0.985);
        border: 1px solid rgba(15, 23, 42, 0.16);
        border-radius: 14px;
        box-shadow: 0 20px 60px rgba(15, 23, 42, 0.28), 0 2px 10px rgba(15, 23, 42, 0.12);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        line-height: 1.58;
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      .tc-original-text .tc-math:not([block]) {
        position: relative;
        top: 0.15em;
      }
      .tc-original-menu .katex { 
        color: #172033; 
        max-width: none !important;
        overflow-x: visible !important;
        overflow-y: visible !important;
      }
      .tc-original-menu .katex * { box-sizing: content-box; }
      .tc-original-menu .katex-display, .tc-original-menu d-math[block] { 
        overflow-x: auto !important; 
        overflow-y: hidden !important; 
        max-width: 100% !important;
        display: block !important;
      }
      .tc-resizer { position: absolute; z-index: 10; }
      .tc-resizer-t { top: -4px; left: 10px; right: 10px; height: 8px; cursor: n-resize; }
      .tc-resizer-b { bottom: -4px; left: 10px; right: 10px; height: 8px; cursor: s-resize; }
      .tc-resizer-l { left: -4px; top: 10px; bottom: 10px; width: 8px; cursor: w-resize; }
      .tc-resizer-r { right: -4px; top: 10px; bottom: 10px; width: 8px; cursor: e-resize; }
      .tc-resizer-tr { top: -4px; right: -4px; width: 16px; height: 16px; cursor: ne-resize; }
      .tc-resizer-br { bottom: -4px; right: -4px; width: 16px; height: 16px; cursor: se-resize; }
      .tc-resizer-bl { bottom: -4px; left: -4px; width: 16px; height: 16px; cursor: sw-resize; }
      .tc-resizer-tl { top: -4px; left: -4px; width: 16px; height: 16px; cursor: nw-resize; }
      .tc-original-menu * { box-sizing: border-box; }
      .tc-original-head {
        position: sticky;
        top: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px 10px 16px;
        border-bottom: 1px solid rgba(15, 23, 42, 0.10);
        background: rgba(248, 250, 252, 0.98);
        border-radius: 14px 14px 0 0;
        cursor: move;
        cursor: grab;
        user-select: none;
        touch-action: none;
      }
      .tc-original-head:active {
        cursor: grabbing;
      }
      .tc-original-title {
        display: flex;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
      }
      .tc-original-title strong {
        font-size: 13px;
        letter-spacing: .02em;
        color: #0f172a;
      }
      .tc-original-title a {
        max-width: 470px;
        color: #2563eb;
        font-size: 11px;
        text-decoration: none;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .tc-original-close {
        border: 0;
        border-radius: 999px;
        padding: 7px 11px;
        cursor: pointer;
        background: #0f172a;
        color: #fff;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }
      .tc-original-close:hover, .tc-original-close:focus { background: #1d4ed8; outline: none; }
      .tc-original-open {
        border:0;border-radius:999px;padding:7px 11px;cursor:pointer;
        background:#2563eb;color:#fff;font-size:12px;font-weight:700;white-space:nowrap;
      }
      .tc-original-open:hover { background:#1d4ed8; }
      .tc-original-body { 
        padding: 14px 18px 16px 20px; 
        overflow-y: auto; 
        flex: 1;
        -webkit-overflow-scrolling: touch;
      }
      .tc-original-list {
        margin: 0;
        padding: 0 0 0 1.2em;
        list-style: disc;
      }
      .tc-original-list li {
        margin: 0 0 12px 0;
        padding-left: .25em;
        border: 0 !important;
      }
      .tc-original-list li:last-child { margin-bottom: 0; }
      .tc-original-text {
        font-size: 14px;
        color: #1f2937;
        white-space: normal;
        word-break: normal;
      }
      .tc-original-label {
        display: inline-block;
        margin: 0 0 4px 0;
        padding: 1px 7px;
        border-radius: 999px;
        background: rgba(37, 99, 235, .09);
        color: #1d4ed8;
        font-size: 11px;
        font-weight: 700;
        vertical-align: middle;
      }
      .tc-original-help {
        margin-top: 12px;
        color: #64748b;
        font-size: 11px;
      }
      .tc-rubber-btn {
        position: fixed;
        bottom: 24px;
        right: 24px;
        padding: 0 16px;
        height: 48px;
        border-radius: 24px;
        background: #2563eb;
        color: white;
        border: none;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
        cursor: pointer;
        z-index: 2147483640;
        display: flex;
        align-items: center;
        gap: 8px;
        font-family: inherit;
        font-weight: 600;
        font-size: 14px;
        transition: all 0.2s;
        touch-action: manipulation;
      }
      .tc-rubber-btn.active {
        background: #dc2626;
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
      }
      body.tc-rubber-mode {
        user-select: none !important;
        -webkit-user-select: none !important;
        touch-action: none !important;
        cursor: crosshair !important;
      }
      .tc-rubber-band-box {
        position: absolute;
        border: 2px solid rgba(37, 99, 235, 0.8);
        background: rgba(37, 99, 235, 0.15);
        pointer-events: none;
        z-index: 2147483647;
      }
      [data-original-id].tc-pre-active {
        outline: 2px dashed rgba(37, 99, 235, 0.6) !important;
        outline-offset: 4px !important;
        background: rgba(59,130,246,0.05) !important;
        border-radius: 5px !important;
      }
      @media (prefers-color-scheme: dark) {
        .tc-original-menu {
          color: #e5e7eb;
          background: rgba(15, 23, 42, 0.985);
          border-color: rgba(148, 163, 184, 0.28);
          box-shadow: 0 20px 60px rgba(0,0,0,.45), 0 2px 10px rgba(0,0,0,.25);
        }
        .tc-original-head {
          background: rgba(15, 23, 42, 0.98);
          border-bottom-color: rgba(148, 163, 184, 0.20);
        }
        .tc-original-title strong { color: #f8fafc; }
        .tc-original-title a { color: #93c5fd; }
        .tc-original-close { background: #2563eb; }
        .tc-original-close:hover, .tc-original-close:focus { background: #60a5fa; color: #0f172a; }
        .tc-original-text { color: #e5e7eb; }
        .tc-original-label { background: rgba(147,197,253,.16); color: #bfdbfe; }
        .tc-original-help { color: #94a3b8; }
        .tc-original-menu .katex { color: #e5e7eb; }
      }
      @media (max-width: 640px) {
        .tc-original-menu {
          min-width: 260px;
          width: 94vw;
          max-height: 78vh;
        }
        .tc-original-body { padding: 12px 14px 14px 16px; }
        .tc-rubber-btn { bottom: 18px; right: 18px; height: 44px; font-size: 13px; }
      }
    `;
    document.head.appendChild(style);
  }

  function closeMenu() {
    if (menu) menu.remove();
    menu = null;
    highlighted.forEach((el) => el.classList.remove("tc-original-active"));
    highlighted = [];
  }

  function escapeText(text) {
    return String(text)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function rangeIntersectsElement(range, el) {
    try {
      const elementRange = document.createRange();
      elementRange.selectNodeContents(el);
      return range.compareBoundaryPoints(Range.END_TO_START, elementRange) < 0 &&
             range.compareBoundaryPoints(Range.START_TO_END, elementRange) > 0;
    } catch (_) {
      return false;
    }
  }

  function elementsFromSelection() {
    const selection = window.getSelection && window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return [];
    const range = selection.getRangeAt(0);
    const blocks = Array.from(document.querySelectorAll(SELECTOR));
    return blocks.filter((el) => rangeIntersectsElement(range, el)).slice(0, 8);
  }

  function uniqueElements(elements) {
    const seen = new Set();
    const out = [];
    for (const el of elements) {
      if (!el || !el.matches || !el.matches(SELECTOR)) continue;
      const id = el.getAttribute("data-original-id");
      if (!id || seen.has(id) || !byId.has(id)) continue;
      seen.add(id);
      out.push(el);
    }
    return out;
  }

  function pickElements(event) {
    const fromSelection = elementsFromSelection();
    const closest = event.target && event.target.closest ? event.target.closest(SELECTOR) : null;
    return uniqueElements(fromSelection.length ? fromSelection : [closest]);
  }

  function positionMenu(event) {
    if (!menu) return;
    const margin = 12;
    const rect = menu.getBoundingClientRect();
    let left = event.clientX || (rect.left || margin);
    let top = event.clientY || (rect.top || margin);
    if (left + rect.width + margin > window.innerWidth) left = window.innerWidth - rect.width - margin;
    if (top + rect.height + margin > window.innerHeight) top = window.innerHeight - rect.height - margin;
    menu.style.left = `${Math.max(margin, left)}px`;
    menu.style.top = `${Math.max(margin, top)}px`;
  }

  function showMenu(event, elements) {
    closeMenu();
    ensureStyle();

    highlighted = elements;
    highlighted.forEach((el) => el.classList.add("tc-original-active"));

    let itemsHtml = elements
      .map((el, index) => ({ index, data: byId.get(el.getAttribute("data-original-id")) }))
      .filter((item) => item.data && item.data.text)
      .map((item) => `
        <li>
          <span class="tc-original-label">원문 ${item.index + 1}</span>
          <div class="tc-original-text">${item.data.text}</div>
        </li>`)
      .join("");

    itemsHtml = itemsHtml.replace(/<d-math([^>]*)>/g, '<span class="tc-math"$1>').replace(/<\/d-math>/g, '</span>');

    menu = document.createElement("aside");
    menu.className = "tc-original-menu";
    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-label", "원문 문단 보기");
    menu.innerHTML = `
      <div class="tc-resizer tc-resizer-t" data-dir="t"></div>
      <div class="tc-resizer tc-resizer-r" data-dir="r"></div>
      <div class="tc-resizer tc-resizer-b" data-dir="b"></div>
      <div class="tc-resizer tc-resizer-l" data-dir="l"></div>
      <div class="tc-resizer tc-resizer-tr" data-dir="tr"></div>
      <div class="tc-resizer tc-resizer-br" data-dir="br"></div>
      <div class="tc-resizer tc-resizer-bl" data-dir="bl"></div>
      <div class="tc-resizer tc-resizer-tl" data-dir="tl"></div>
      <div class="tc-original-head">
        <div class="tc-original-title">
          <strong>선택한 번역 문단의 원문</strong>
          <a href="${escapeText(SOURCE_URL)}" target="_blank" rel="noopener noreferrer">${escapeText(SOURCE_URL)}</a>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <button type="button" class="tc-original-open" aria-label="원문 위치 열기">원문 위치 열기</button>
          <button type="button" class="tc-original-close" aria-label="원문 보기 닫기">닫기</button>
        </div>
      </div>
      <div class="tc-original-body">
        <ul class="tc-original-list">${itemsHtml}</ul>
        <div class="tc-original-help">번역 문단을 우클릭하거나, 여러 문단을 드래그 선택한 뒤 우클릭하면 해당 범위의 원문을 볼 수 있습니다. Esc 또는 닫기로 닫습니다.</div>
      </div>`;
    document.body.appendChild(menu);
    menu.querySelector(".tc-original-close").addEventListener("click", closeMenu);
    positionMenu(event);
    setTimeout(() => menu && menu.querySelector(".tc-original-close").focus({ preventScroll: true }), 0);
    // "원문 위치 열기" button handler
    const openBtn = menu.querySelector(".tc-original-open");
    if (openBtn) {
      openBtn.addEventListener("click", () => {
        if (!highlighted.length) return;

        let bestEl = highlighted[0];

        // Only use "closest to viewport center" when multiple paragraphs were rubber-band selected
        if (highlighted.length > 1) {
          const viewportCenterY = window.innerHeight / 2;
          let bestDist = Infinity;

          highlighted.forEach(el => {
            const rect = el.getBoundingClientRect();
            const elCenter = rect.top + rect.height / 2;
            const dist = Math.abs(elCenter - viewportCenterY);
            if (dist < bestDist) {
              bestDist = dist;
              bestEl = el;
            }
          });
        }

        const origId = bestEl.getAttribute("data-original-id");
        if (origId && byId.has(origId)) {
          const item = byId.get(origId);
          const temp = document.createElement("div");
          temp.innerHTML = item.text;
          const plain = (temp.textContent || temp.innerText || "").trim().replace(/\s+/g, " ");
          
          // Text Fragments(#:~:text=) 인코딩 전용 헬퍼.
          // encodeURIComponent()는 '-'를 인코딩하지 않지만, WICG Text Fragments 스펙은
          // start/end 토큰 안에 인코딩되지 않은 '-'가 하나라도 있으면 해당 디렉티브 전체를 파싱 실패 처리한다.
          function encodeTextFragment(str) {
            return encodeURIComponent(str).replace(/-/g, "%2D");
          }

          let fragment = "";
          if (plain.length > 0) {
            const words = plain.split(/\s+/).filter(w => w.length > 0);
            if (words.length > 0) {
              const prefix = words.slice(0, 6).join(" ");
              const suffix = words.length > 12 ? words.slice(-6).join(" ") : "";
              if (suffix) {
                fragment = `#:~:text=${encodeTextFragment(prefix)},${encodeTextFragment(suffix)}`;
              } else {
                fragment = `#:~:text=${encodeTextFragment(prefix)}`;
              }
            }
          }

          // Fallback: find closest preceding heading ID
          let closestHeadingId = "";
          let targetIndex = DATA.findIndex(d => d.id === origId);
          if (targetIndex !== -1) {
            for (let i = targetIndex; i >= 0; i--) {
              if (DATA[i].tag.match(/^h[1-6]$/i)) {
                const match = DATA[i].text.match(/id=["']([^"']+)["']/);
                if (match) {
                  closestHeadingId = match[1];
                } else {
                  // Fallback: slugify the heading text (matches distill template behavior)
                  const tempHeading = document.createElement("div");
                  tempHeading.innerHTML = DATA[i].text;
                  const plainHeading = (tempHeading.textContent || tempHeading.innerText || "").trim().toLowerCase();
                  closestHeadingId = plainHeading.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                }
                break;
              }
            }
          }

          const baseUrl = SOURCE_URL.split('#')[0];
          
          let finalUrl = baseUrl;
          // Feature detect Text Fragment support (reliable for Chromium-based browsers)
          const supportsTextFragments = ('fragmentDirective' in document);

          if (supportsTextFragments && fragment) {
            if (closestHeadingId) {
              // Combine ID and Text Fragment!
              // If text fragment fails (e.g. due to KaTeX), browser falls back to heading ID!
              finalUrl += "#" + closestHeadingId + fragment.replace("#", "");
            } else {
              finalUrl += fragment;
            }
          } else if (closestHeadingId) {
            // Fallback: use the closest heading ID for older browsers
            finalUrl += "#" + closestHeadingId;
          } else if (fragment) {
            // Last resort
            finalUrl += fragment;
          }
          
          window.open(finalUrl, "_blank");
        } else if (SOURCE_URL) {
          window.open(SOURCE_URL, "_blank");
        }
      });
    }

    // Make the menu draggable and resizable
    let activeAction = null;
    let actionStartX = 0;
    let actionStartY = 0;
    let menuStartRect = null;

    const onPointerMove = (e) => {
      if (!activeAction || !menu) return;
      const dx = e.clientX - actionStartX;
      const dy = e.clientY - actionStartY;

      if (activeAction === 'drag') {
        menu.style.left = `${menuStartRect.left + dx}px`;
        menu.style.top = `${menuStartRect.top + dy}px`;
        menu.style.right = 'auto';
        menu.style.bottom = 'auto';
      } else {
        let newWidth = menuStartRect.width;
        let newHeight = menuStartRect.height;
        let newLeft = menuStartRect.left;
        let newTop = menuStartRect.top;

        if (activeAction.includes('r')) newWidth += dx;
        if (activeAction.includes('b')) newHeight += dy;
        if (activeAction.includes('l')) {
          newWidth -= dx;
          newLeft += dx;
        }
        if (activeAction.includes('t')) {
          newHeight -= dy;
          newTop += dy;
        }

        const minW = 260;
        const minH = 200;
        if (newWidth < minW) {
          if (activeAction.includes('l')) newLeft -= (minW - newWidth);
          newWidth = minW;
        }
        if (newHeight < minH) {
          if (activeAction.includes('t')) newTop -= (minH - newHeight);
          newHeight = minH;
        }

        menu.style.width = `${newWidth}px`;
        menu.style.height = `${newHeight}px`;
        menu.style.left = `${newLeft}px`;
        menu.style.top = `${newTop}px`;
        menu.style.right = 'auto';
        menu.style.bottom = 'auto';
        menu.style.maxWidth = 'none';
        menu.style.maxHeight = 'none';
      }
    };

    const onPointerUp = () => {
      activeAction = null;
      document.body.style.userSelect = '';
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };

    const startAction = (action, e) => {
      activeAction = action;
      actionStartX = e.clientX;
      actionStartY = e.clientY;
      menuStartRect = menu.getBoundingClientRect();
      document.body.style.userSelect = 'none';
      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
      e.preventDefault();
    };

    menu.querySelector(".tc-original-head").addEventListener("pointerdown", (e) => {
      if (e.target.closest("button") || e.target.closest("a")) return;
      startAction('drag', e);
    });

    menu.querySelectorAll(".tc-resizer").forEach(el => {
      el.addEventListener("pointerdown", (e) => {
        startAction(`resize-${el.dataset.dir}`, e);
        e.stopPropagation();
      });
    });

    // Render math in the menu
    const mathSpans = menu.querySelectorAll(".tc-math");
    if (mathSpans.length > 0) {
      function renderMath() {
        for (const el of mathSpans) {
          try {
            window.katex.render(el.textContent, el, { displayMode: el.hasAttribute("block"), throwOnError: false });
          } catch (e) {
            console.error("KaTeX render error", e);
          }
        }
      }
      if (window.katex) {
        renderMath();
      } else {
        if (!document.getElementById("tc-katex-script")) {
          const script = document.createElement("script");
          script.id = "tc-katex-script";
          script.src = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js";
          script.onload = renderMath;
          document.head.appendChild(script);
          
          const css = document.createElement("link");
          css.rel = "stylesheet";
          css.href = "https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css";
          document.head.appendChild(css);
        } else {
          const script = document.getElementById("tc-katex-script");
          script.addEventListener("load", renderMath);
        }
      }
    }
  }

  document.addEventListener("contextmenu", (event) => {
    const elements = pickElements(event);
    if (!elements.length) return;
    event.preventDefault();
    event.stopPropagation();
    showMenu(event, elements);
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  // Rubber Band Mode Logic - ONE FINGER TOUCH SUPPORT
  let rubberMode = false;
  let rubberBtn = null;
  let isRubberDragging = false;
  let rubberBox = null;
  let rubberStartX = 0;
  let rubberStartY = 0;
  let preActiveElements = [];
  let cachedBlocks = [];

  function ensureRubberBtn() {
    if (rubberBtn) return;
    ensureStyle();
    rubberBtn = document.createElement('button');
    rubberBtn.className = 'tc-rubber-btn';
    rubberBtn.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
        <path d="M3 3h6v2H5v4H3V3zm12 0h6v6h-2V5h-4V3zM3 15h2v4h4v2H3v-6zm16 4h-4v2h6v-6h-2v4zM7 7h10v10H7V7z"/>
      </svg>
      <span>다중 선택</span>
    `;
    rubberBtn.addEventListener('click', () => {
      rubberMode = !rubberMode;
      if (rubberMode) {
        rubberBtn.classList.add('active');
        rubberBtn.querySelector('span').innerText = '선택 취소';
        document.body.classList.add('tc-rubber-mode');
        closeMenu();
      } else {
        rubberBtn.classList.remove('active');
        rubberBtn.querySelector('span').innerText = '다중 선택';
        document.body.classList.remove('tc-rubber-mode');
        cleanupRubber();
      }
    });
    document.body.appendChild(rubberBtn);
  }

  function cleanupRubber() {
    isRubberDragging = false;
    cancelAnimationFrame(autoScrollRaf);
    if (rubberBox) {
      rubberBox.remove();
      rubberBox = null;
    }
    preActiveElements.forEach(el => el.classList.remove('tc-pre-active'));
    preActiveElements = [];
    cachedBlocks = [];
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureRubberBtn);
  } else {
    ensureRubberBtn();
  }

  // Edge auto-scrolling logic
  let autoScrollRaf = null;
  let currentPointerY = 0;
  
  function autoScroll() {
    if (!isRubberDragging) return;
    
    const edgeSize = 60;
    const maxSpeed = 15;
    let scrolled = false;

    if (currentPointerY < edgeSize) {
      const speed = Math.max(1, maxSpeed * (1 - currentPointerY / edgeSize));
      window.scrollBy(0, -speed);
      scrolled = true;
    } else if (currentPointerY > window.innerHeight - edgeSize) {
      const distance = window.innerHeight - currentPointerY;
      const speed = Math.max(1, maxSpeed * (1 - distance / edgeSize));
      window.scrollBy(0, speed);
      scrolled = true;
    }

    if (isRubberDragging) {
      autoScrollRaf = requestAnimationFrame(autoScroll);
    }
  }

  let lastPageX = 0;
  let lastPageY = 0;

  function updateRubberBand(currentX, currentY) {
    if (!rubberBox) return;
    const left = Math.min(rubberStartX, currentX);
    const top = Math.min(rubberStartY, currentY);
    const width = Math.abs(currentX - rubberStartX);
    const height = Math.abs(currentY - rubberStartY);

    rubberBox.style.left = `${left}px`;
    rubberBox.style.top = `${top}px`;
    rubberBox.style.width = `${width}px`;
    rubberBox.style.height = `${height}px`;

    const rect = { left, top, right: left + width, bottom: top + height };
    
    preActiveElements.forEach(el => el.classList.remove('tc-pre-active'));
    preActiveElements = [];

    const seen = new Set();

    cachedBlocks.forEach(block => {
      if (
        block.right >= rect.left && block.left <= rect.right &&
        block.bottom >= rect.top && block.top <= rect.bottom
      ) {
        if (block.id && !seen.has(block.id)) {
          seen.add(block.id);
          preActiveElements.push(block.el);
          block.el.classList.add('tc-pre-active');
        }
      }
    });
  }

  // ONE FINGER TOUCH SUPPORT - pointerType check removed for touch
  document.addEventListener('pointerdown', (e) => {
    if (!rubberMode) return;
    if (e.target.closest('.tc-rubber-btn') || e.target.closest('.tc-original-menu')) return;
    
    // Allow ALL pointers (mouse left click + ALL touch including one finger)
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    isRubberDragging = true;
    rubberStartX = e.pageX;
    rubberStartY = e.pageY;
    lastPageX = e.pageX;
    lastPageY = e.pageY;
    currentPointerY = e.clientY;

    rubberBox = document.createElement('div');
    rubberBox.className = 'tc-rubber-band-box';
    rubberBox.style.left = `${rubberStartX}px`;
    rubberBox.style.top = `${rubberStartY}px`;
    rubberBox.style.width = '0px';
    rubberBox.style.height = '0px';
    document.body.appendChild(rubberBox);

    const scrollX = window.scrollX || document.documentElement.scrollLeft;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    cachedBlocks = Array.from(document.querySelectorAll(SELECTOR)).map(el => {
      const elRect = el.getBoundingClientRect();
      return {
        el,
        id: el.getAttribute("data-original-id"),
        left: elRect.left + scrollX,
        top: elRect.top + scrollY,
        right: elRect.right + scrollX,
        bottom: elRect.bottom + scrollY
      };
    });

    preActiveElements = [];
    e.preventDefault(); 
    
    cancelAnimationFrame(autoScrollRaf);
    autoScrollRaf = requestAnimationFrame(autoScroll);
  }, { passive: false });

  document.addEventListener('pointermove', (e) => {
    if (!isRubberDragging || !rubberBox) return;

    lastPageX = e.pageX;
    lastPageY = e.pageY;
    currentPointerY = e.clientY;

    updateRubberBand(lastPageX, lastPageY);
  }, { passive: false });

  window.addEventListener('scroll', () => {
    if (!isRubberDragging || !rubberBox) return;
    lastPageY = currentPointerY + (window.scrollY || document.documentElement.scrollTop);
    updateRubberBand(lastPageX, lastPageY);
  }, { passive: true });

  document.addEventListener('pointerup', (e) => {
    if (!isRubberDragging) return;
    isRubberDragging = false;
    cancelAnimationFrame(autoScrollRaf);
    
    if (rubberBox) {
      rubberBox.remove();
      rubberBox = null;
    }

    preActiveElements.forEach(el => el.classList.remove('tc-pre-active'));

    if (preActiveElements.length > 0) {
      const elementsToMenu = [...preActiveElements];
      preActiveElements = [];
      showMenu(e, elementsToMenu);
    }
  });

  // Extra safety: also listen to pointercancel for mobile
  document.addEventListener('pointercancel', () => {
    if (isRubberDragging) {
      cleanupRubber();
    }
  });

})();