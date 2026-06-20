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
        width: min(620px, calc(100vw - 24px));
        max-height: min(72vh, 680px);
        overflow: auto;
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
      .tc-original-body { padding: 14px 18px 16px 20px; }
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
    let left = event.clientX;
    let top = event.clientY;
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

    // Prevent Distill's auto-renderer from interfering by renaming <d-math> to <span class="tc-math">
    itemsHtml = itemsHtml.replace(/<d-math([^>]*)>/g, '<span class="tc-math"$1>').replace(/<\/d-math>/g, '</span>');

    menu = document.createElement("aside");
    menu.className = "tc-original-menu";
    menu.setAttribute("role", "dialog");
    menu.setAttribute("aria-label", "원문 문단 보기");
    menu.innerHTML = `
      <div class="tc-original-head">
        <div class="tc-original-title">
          <strong>선택한 번역 문단의 원문</strong>
          <a href="${escapeText(SOURCE_URL)}" target="_blank" rel="noopener noreferrer">${escapeText(SOURCE_URL)}</a>
        </div>
        <button type="button" class="tc-original-close" aria-label="원문 보기 닫기">닫기</button>
      </div>
      <div class="tc-original-body">
        <ul class="tc-original-list">${itemsHtml}</ul>
        <div class="tc-original-help">번역 문단을 우클릭하거나, 여러 문단을 드래그 선택한 뒤 우클릭하면 해당 범위의 원문을 볼 수 있습니다. Esc 또는 닫기로 닫습니다.</div>
      </div>`;
    document.body.appendChild(menu);
    menu.querySelector(".tc-original-close").addEventListener("click", closeMenu);
    positionMenu(event);
    setTimeout(() => menu && menu.querySelector(".tc-original-close").focus({ preventScroll: true }), 0);

    // Make the menu draggable
    const head = menu.querySelector(".tc-original-head");
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let menuStartX = 0;
    let menuStartY = 0;

    const onPointerMove = (e) => {
      if (!isDragging || !menu) return;
      let left = menuStartX + (e.clientX - dragStartX);
      let top = menuStartY + (e.clientY - dragStartY);
      menu.style.left = `${left}px`;
      menu.style.top = `${top}px`;
      menu.style.right = 'auto';
      menu.style.bottom = 'auto';
    };

    const onPointerUp = () => {
      isDragging = false;
      document.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerup", onPointerUp);
    };

    head.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button") || e.target.closest("a")) return;
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      const rect = menu.getBoundingClientRect();
      menuStartX = rect.left;
      menuStartY = rect.top;
      document.addEventListener("pointermove", onPointerMove);
      document.addEventListener("pointerup", onPointerUp);
      e.preventDefault();
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

  document.addEventListener("mousedown", (event) => {
    if (menu && !event.target.closest(".tc-original-menu") && event.button === 0) closeMenu();
  });

  window.addEventListener("resize", closeMenu);
  window.addEventListener("scroll", () => { if (menu) closeMenu(); }, { passive: true });
})();
