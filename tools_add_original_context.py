#!/usr/bin/env python3
"""Build original paragraph mappings and inject the context-menu helper.

This script pairs translated Transformer Circuits pages with their original
English pages, writes compact JS data files, and annotates translated paragraph-
like blocks with stable data attributes.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from urllib.request import Request, urlopen
from bs4 import BeautifulSoup, Tag

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "assets"
DATA_DIR = ASSETS / "original-context-data"

PAPERS = [
    {
        "id": "nla",
        "translated": ROOT / "non_linear_attention/2026/nla/index.html",
        "original": ROOT / "original_pages/nla.html",
        "original_url": "https://transformer-circuits.pub/2026/nla/index.html",
        "asset_prefix": "../../../",
    },
    {
        "id": "math-framework",
        "translated": ROOT / "mathematical_framework.html",
        "original": ROOT / "original_pages/mathematical_framework.html",
        "original_url": "https://transformer-circuits.pub/2021/framework/index.html",
        "asset_prefix": "",
    },
    {
        "id": "biology-llm",
        "translated": ROOT / "biology_of_llm.html",
        "original": ROOT / "original_pages/biology_of_llm.html",
        "original_url": "https://transformer-circuits.pub/2025/attribution-graphs/biology.html",
        "asset_prefix": "",
    },
    {
        "id": "icl-induction-heads",
        "translated": ROOT / "in_context_learning_and_induction_heads.html",
        "original": ROOT / "original_pages/in_context_learning_and_induction_heads.html",
        "original_url": "https://transformer-circuits.pub/2022/in-context-learning-and-induction-heads/index.html",
        "asset_prefix": "",
    },
    {
        "id": "toy-models-superposition",
        "translated": ROOT / "toy_models_of_superposition.html",
        "original": ROOT / "original_pages/toy_models.html",
        "original_url": "https://transformer-circuits.pub/2022/toy_model/index.html",
        "asset_prefix": "",
    },
    {
        "id": "toy-double-descent",
        "translated": ROOT / "toy_double_descent.html",
        "original": ROOT / "original_pages/toy_double_descent.html",
        "original_url": "https://transformer-circuits.pub/2023/toy-double-descent/index.html",
        "asset_prefix": "",
    },
    {
        "id": "monosemantic-features",
        "translated": ROOT / "monosemantic_features/2023/monosemantic-features/index.html",
        "original": ROOT / "original_pages/monosemantic_features.html",
        "original_url": "https://transformer-circuits.pub/2023/monosemantic-features/index.html",
        "asset_prefix": "../../../",
    },
    {
        "id": "scaling-monosemanticity",
        "translated": ROOT / "scaling_monosemanticity/index.html",
        "original": ROOT / "original_pages/scaling_monosemanticity.html",
        "original_url": "https://transformer-circuits.pub/2024/scaling-monosemanticity/index.html",
        "asset_prefix": "../",
    },
    {
        "id": "solu",
        "translated": ROOT / "solu/index.html",
        "original": ROOT / "original_pages/solu.html",
        "original_url": "https://transformer-circuits.pub/2022/solu/index.html",
        "asset_prefix": "../",
    },
]

SELECTOR_TAGS = {"p", "li", "h2", "h3", "h4"}
DATA_SCRIPT_RE = re.compile(r'\s*<script\s+src="[^"]*assets/original-context-data/[^">]+\.js"\s*>\s*</script>\s*', re.I)
HELPER_SCRIPT_RE = re.compile(r'\s*<script\s+src="[^"]*assets/original-context-menu\.js"\s*>\s*</script>\s*', re.I)
SOURCE_SCRIPT_RE = re.compile(r'\s*<script>window\.TC_ORIGINAL_SOURCE_URL\s*=\s*[^<]+;</script>\s*', re.I)


def clean_text(el: Tag) -> str:
    clone = BeautifulSoup(str(el), "html.parser")
    root = clone.find(el.name)
    if root is None:
        return ""
    for bad in root.find_all(["script", "style", "template"]):
        bad.decompose()
    text = root.get_text(" ", strip=True)
    text = re.sub(r"\s+", " ", text)
    return text


def extract_html(el: Tag) -> str:
    clone = BeautifulSoup(str(el), "html.parser")
    root = clone.find(el.name)
    if root is None:
        return ""
    for bad in root.find_all(["script", "style", "template"]):
        if bad.name == "script" and "math/tex" in bad.get("type", ""):
            new_tag = clone.new_tag("d-math")
            if bad.string:
                new_tag.string = bad.string
            if "mode=display" in bad.get("type", ""):
                new_tag["block"] = ""
            bad.replace_with(new_tag)
        else:
            bad.decompose()
    
    html = "".join(str(c) for c in root.contents).strip()
    html = re.sub(r"\s+", " ", html)
    return html


def article(soup: BeautifulSoup) -> Tag:
    return soup.find("d-article") or soup.body or soup


def element_path(el: Tag, root: Tag) -> str:
    parts: list[str] = []
    cur: Tag | None = el
    while cur is not None and cur is not root:
        parent = cur.parent
        if not isinstance(parent, Tag):
            break
        same_tag_siblings = [child for child in parent.find_all(cur.name, recursive=False)]
        idx = same_tag_siblings.index(cur)
        parts.append(f"{cur.name}:{idx}")
        cur = parent
    return "/".join(reversed(parts))


def candidates(root: Tag) -> list[Tag]:
    out: list[Tag] = []
    for el in root.find_all(list(SELECTOR_TAGS)):
        if not clean_text(el):
            continue
        # Avoid tagging tiny utility-only paragraphs if they are not in the article body.
        out.append(el)
    return out


def build_mapping(translated_html: str, original_html: str):
    tr_soup = BeautifulSoup(translated_html, "html.parser")
    or_soup = BeautifulSoup(original_html, "html.parser")
    tr_root = article(tr_soup)
    or_root = article(or_soup)

    tr_blocks = candidates(tr_root)
    or_blocks = candidates(or_root)
    by_path = {element_path(el, or_root): el for el in or_blocks}

    # Sequential fallback by tag for rare cases where SingleFile slightly changed a path.
    sequential_by_tag: dict[str, list[Tag]] = {}
    for el in or_blocks:
        sequential_by_tag.setdefault(el.name, []).append(el)
    sequential_pos: dict[str, int] = {tag: 0 for tag in SELECTOR_TAGS}

    data: list[dict[str, str]] = []
    direct = fallback = missing = 0
    for idx, el in enumerate(tr_blocks):
        original_el = by_path.get(element_path(el, tr_root))
        method = "path"
        if original_el is None or original_el.name != el.name:
            method = "sequential"
            lst = sequential_by_tag.get(el.name, [])
            pos = sequential_pos.get(el.name, 0)
            original_el = lst[pos] if pos < len(lst) else None
        sequential_pos[el.name] = sequential_pos.get(el.name, 0) + 1

        if original_el is not None:
            text = clean_text(original_el)
            html_content = extract_html(original_el)
            if method == "path":
                direct += 1
            else:
                fallback += 1
        else:
            text = ""
            html_content = ""
            missing += 1
        original_id = f"orig-{idx}"
        el["data-original-id"] = original_id
        el["data-original-kind"] = el.name
        if text:
            data.append({"id": original_id, "tag": el.name, "text": html_content})

    return tr_soup, data, {"translated_blocks": len(tr_blocks), "original_blocks": len(or_blocks), "path": direct, "fallback": fallback, "missing": missing}


def inject_scripts(html: str, paper_id: str, prefix: str, original_url: str) -> str:
    html = SOURCE_SCRIPT_RE.sub("", html)
    html = DATA_SCRIPT_RE.sub("", html)
    html = HELPER_SCRIPT_RE.sub("", html)
    
    # Remove Content-Security-Policy meta tags that block external scripts on SingleFile snapshots
    html = re.sub(r'<meta[^>]*http-equiv="?content-security-policy"?[^>]*>', '', html, flags=re.I)
    
    snippet = (
        f'\n<script>window.TC_ORIGINAL_SOURCE_URL = {json.dumps(original_url)};</script>\n'
        f'<script src="{prefix}assets/original-context-data/{paper_id}.js"></script>\n'
        f'<script src="{prefix}assets/original-context-menu.js"></script>\n'
    )

    # Fix relative image URLs (./png/ or png/) to point to the original site since images aren't included in the repo
    base_url = original_url.rsplit('/', 1)[0] + '/'
    html = html.replace('src="./png/', f'src="{base_url}png/')
    html = html.replace('src="png/', f'src="{base_url}png/')

    lower = html.lower()
    pos = lower.rfind("</body>")
    
    global_css = "\n<style>d-math:not([block]) { position: relative; top: 0.15em; }</style>\n"
    
    if pos != -1:
        return html[:pos] + global_css + snippet + html[pos:]
    return html + global_css + snippet


def ensure_original_file(paper: dict) -> None:
    """Download the original Transformer Circuits HTML if it is not present."""
    original_path = paper["original"]
    if original_path.exists():
        return
    original_path.parent.mkdir(parents=True, exist_ok=True)
    req = Request(paper["original_url"], headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(req, timeout=60) as response:
        html = response.read().decode("utf-8", errors="ignore")
    original_path.write_text(html, encoding="utf-8")


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    for paper in PAPERS:
        ensure_original_file(paper)
        translated_html = paper["translated"].read_text(encoding="utf-8", errors="ignore")
        original_html = paper["original"].read_text(encoding="utf-8", errors="ignore")
        tr_soup, data, stats = build_mapping(translated_html, original_html)
        data_js = "window.TC_ORIGINAL_PARAGRAPHS = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n"
        (DATA_DIR / f"{paper['id']}.js").write_text(data_js, encoding="utf-8")
        html = str(tr_soup)
        html = inject_scripts(html, paper["id"], paper["asset_prefix"], paper["original_url"])
        paper["translated"].write_text(html, encoding="utf-8")
        print(paper["id"], stats, "data", len(data))


if __name__ == "__main__":
    main()
