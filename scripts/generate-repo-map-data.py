#!/usr/bin/env python3
import os, re, json, pathlib, posixpath, mimetypes, hashlib, collections, time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "data", "repo-map-data.json")
SKIP_DIRS = {'.git', 'node_modules', 'dist', 'build', '.next', 'coverage', '__pycache__'}

EDGE_RULES = [
    ("fetch", re.compile(r"""fetch\s*\(\s*["']([^"']+)["']""", re.I), "fetches"),
    ("iframe", re.compile(r"""<iframe[^>]+src\s*=\s*["']([^"']+)["']""", re.I), "embeds"),
    ("script", re.compile(r"""<script[^>]+src\s*=\s*["']([^"']+)["']""", re.I), "loads script"),
    ("link", re.compile(r"""<link[^>]+href\s*=\s*["']([^"']+)["']""", re.I), "loads style/resource"),
    ("asset", re.compile(r"""(?:src|href)\s*=\s*["']([^"']+\.(?:png|jpg|jpeg|gif|webp|svg|ico|mp3|wav|ogg|mp4|webm|json|html|js|css))["']""", re.I), "references asset"),
    ("js-import", re.compile(r"""import\s+(?:[^'\"]+from\s+)?["']([^"']+)["']""", re.I), "imports"),
    ("json", re.compile(r"""["']([^"']+\.json)["']""", re.I), "references data"),
]

def read_text(path):
    for enc in ("utf-8", "latin-1"):
        try:
            with open(path, "r", encoding=enc) as f:
                return f.read()
        except Exception:
            pass
    return ""

def sha1_short(path):
    h = hashlib.sha1()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(65536)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()[:10]

def classify(rel, is_dir=False):
    if rel == ".":
        return "root"
    if is_dir:
        return "folder"
    ext = pathlib.Path(rel).suffix.lower()
    return {
        ".html": "html", ".js": "js", ".json": "json",
        ".png": "image", ".jpg": "image", ".jpeg": "image", ".gif": "image", ".webp": "image", ".svg": "image", ".ico": "image",
        ".yml": "workflow", ".yaml": "workflow", ".css": "css", ".md": "doc", ".txt": "doc",
        ".mp3": "media", ".wav": "media", ".ogg": "media", ".mp4": "media", ".webm": "media",
    }.get(ext, "file")

def role_for(rel, is_dir=False):
    if rel == ".":
        return "repo root"
    if is_dir:
        return "folder"
    name = os.path.basename(rel)
    if rel == "index.html":
        return "entry shell"
    if rel == "overlay.html":
        return "shared top overlay"
    if rel == "repo-map.html":
        return "repo visualizer"
    if rel.startswith(".github/workflows/"):
        return "automation workflow"
    if rel.startswith("data/"):
        return "runtime data"
    if rel.startswith("themes/") and rel.endswith("theme.json"):
        return "theme manifest"
    if rel.startswith("themes/"):
        return "theme asset"
    if rel.startswith("images/link-thumbnails/"):
        return "preview asset"
    if rel.startswith("images/"):
        return "image asset"
    if rel.endswith(".html") and name.startswith("tektite-"):
        return "wrapper page"
    if rel.endswith(".html"):
        return "page"
    if rel.endswith(".js"):
        return "script"
    if rel.endswith(".json"):
        return "data/config"
    return "asset"

def resolve_ref(source_rel, raw_ref, file_set):
    ref = raw_ref.split("#")[0].split("?")[0].strip()
    if (not ref) or ("${" in ref) or ref.startswith(("data:", "javascript:", "mailto:", "tel:", "#")):
        return None, None
    if ref.startswith("//") or re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*://", ref):
        return "external", ref
    if ref.startswith("/"):
        candidate = ref.lstrip("/")
    else:
        candidate = posixpath.normpath(posixpath.join(posixpath.dirname(source_rel), ref))
    candidate = candidate.replace("\\", "/")
    if candidate in file_set:
        return "internal", candidate
    return "missing", candidate

def add_edge(edges, seen, source, target, kind, label, strength=1.0, style="solid"):
    key = (source, target, kind, label)
    if key in seen:
        return
    seen.add(key)
    edges.append({
        "source": source, "target": target, "kind": kind, "label": label,
        "strength": strength, "style": style,
    })

def main():
    all_files = []
    for dp, dns, fns in os.walk(ROOT):
        dns[:] = [d for d in dns if d not in SKIP_DIRS]
        for fn in fns:
            rel = os.path.relpath(os.path.join(dp, fn), ROOT).replace("\\", "/")
            all_files.append(rel)
    all_files = sorted(all_files)
    file_set = set(all_files)

    dirs = {"."}
    for rel in all_files:
        parent = os.path.dirname(rel)
        while True:
            dirs.add(parent if parent else ".")
            if not parent:
                break
            parent = os.path.dirname(parent)

    all_nodes = sorted(dirs | set(all_files))
    nodes, edges, seen = [], [], set()

    for rel in all_nodes:
        is_dir = rel in dirs
        path = ROOT if rel == "." else os.path.join(ROOT, rel)
        node = {
            "id": rel,
            "path": rel,
            "name": "." if rel == "." else os.path.basename(rel),
            "parent": None if rel == "." else (os.path.dirname(rel) or "."),
            "kind": classify(rel, is_dir),
            "role": role_for(rel, is_dir),
            "depth": 0 if rel == "." else rel.count("/") + 1,
            "size": 0 if is_dir else os.path.getsize(path),
            "mtime": int(os.path.getmtime(path)),
        }
        if not is_dir:
            ext = pathlib.Path(rel).suffix.lower()
            node["ext"] = ext
            text = read_text(path) if ext in {".html", ".js", ".json", ".css", ".yml", ".yaml", ".md", ".txt"} else ""
            if text:
                node["lines"] = text.count("\n") + 1
            node["sha"] = sha1_short(path)
            node["mime"] = mimetypes.guess_type(rel)[0] or ""
        nodes.append(node)

    for rel in all_nodes:
        if rel == ".":
            continue
        parent = os.path.dirname(rel) or "."
        add_edge(edges, seen, parent, rel, "tree", "contains", 1.6, "solid")

    node_ids = {n["id"] for n in nodes}
    for rel in all_files:
        ext = pathlib.Path(rel).suffix.lower()
        if ext not in {".html", ".js", ".json", ".css", ".yml", ".yaml"}:
            continue
        text = read_text(os.path.join(ROOT, rel))
        for kind, pattern, label in EDGE_RULES:
            for match in pattern.finditer(text):
                status, target = resolve_ref(rel, match.group(1), file_set)
                if status == "internal":
                    add_edge(edges, seen, rel, target, kind, label,
                             1.2 if kind in {"fetch", "iframe", "script", "js-import"} else 0.9,
                             "dashed" if kind in {"asset", "link", "json"} else "solid")
                elif status in {"external", "missing"}:
                    ghost = target if status == "external" else f"(missing) {target}"
                    if ghost not in node_ids:
                        nodes.append({
                            "id": ghost, "path": ghost, "name": ghost.split("/")[-1][:80],
                            "parent": ".", "kind": "external" if status == "external" else "missing",
                            "role": "external resource" if status == "external" else "missing reference",
                            "depth": 1, "size": 0, "mtime": int(time.time()),
                        })
                        node_ids.add(ghost)
                    add_edge(edges, seen, rel, ghost, status, label, 0.5, "dotted")

    incoming = collections.Counter(e["target"] for e in edges if e["kind"] != "tree")
    outgoing = collections.Counter(e["source"] for e in edges if e["kind"] != "tree")
    out_edges = collections.defaultdict(list)
    in_edges = collections.defaultdict(list)
    for e in edges:
        out_edges[e["source"]].append(e)
        in_edges[e["target"]].append(e)

    for n in nodes:
        nid = n["id"]
        n["incoming"] = incoming[nid]
        n["outgoing"] = outgoing[nid]
        deps = [e for e in out_edges[nid] if e["kind"] != "tree"]
        used_by = [e for e in in_edges[nid] if e["kind"] != "tree"]
        parts = []
        if n["role"] != "folder":
            parts.append(n["role"])
        if deps:
            targets = ", ".join(e["target"] for e in deps[:4])
            parts.append(f"reads/loads {len(deps)} item(s): {targets}" + ("..." if len(deps) > 4 else ""))
        if used_by:
            sources = ", ".join(e["source"] for e in used_by[:4])
            parts.append(f"used by {len(used_by)} item(s): {sources}" + ("..." if len(used_by) > 4 else ""))
        n["summary"] = ". ".join(parts) if parts else ("Directory container" if n["kind"] == "folder" else "Standalone file")

    payload = {
        "generatedAt": int(time.time()),
        "root": "repo-map.html",
        "stats": {
            "nodeCount": len(nodes),
            "edgeCount": len(edges),
            "fileCount": len(all_files),
            "folderCount": len(dirs),
            "kindCounts": dict(collections.Counter(n["kind"] for n in nodes)),
        },
        "nodes": nodes,
        "edges": edges,
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)
    print(f"Wrote {OUT} with {len(nodes)} nodes and {len(edges)} edges")

if __name__ == "__main__":
    main()
