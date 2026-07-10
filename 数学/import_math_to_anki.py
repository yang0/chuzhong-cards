# -*- coding: utf-8 -*-
"""
将数学知识卡导入 Anki（通过 AnkiConnect）
答案中包含 webp 配图
"""
import os
import re
import json
import shutil
import urllib.request
from pathlib import Path

ANKI_URL = "http://localhost:8765"
DECK_NAME = "数学"
MODEL_NAME = "Basic"
ROOT = Path("G:/初中/数学")
BATCH_SIZE = 30


def invoke_anki(action, params=None):
    payload = {"action": action, "version": 6}
    if params is not None:
        payload["params"] = params
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        ANKI_URL,
        data=data,
        headers={"Content-Type": "application/json"},
    )
    try:
        resp = urllib.request.urlopen(req, timeout=120)
        result = json.load(resp)
        if result.get("error"):
            return {"error": result["error"]}
        return {"result": result.get("result")}
    except Exception as e:
        return {"error": str(e)}


def get_media_dir():
    r = invoke_anki("getMediaDirPath")
    if "error" in r:
        raise RuntimeError(f"无法获取 Anki 媒体文件夹: {r['error']}")
    return Path(r["result"])


def parse_cards(md_path):
    """解析 md 文件，返回卡片列表"""
    text = md_path.read_text(encoding="utf-8")
    folder_name = md_path.stem
    unit_label = str(md_path.parent.relative_to(ROOT) / folder_name).replace("/", "_").replace("\\", "_")

    pattern = re.compile(r"###\s+卡(\d+)\s*\n")
    parts = pattern.split(text)

    cards = []
    for i in range(1, len(parts), 2):
        card_num = int(parts[i])
        block = parts[i + 1]

        img_match = re.search(r"\*\*配图：\*\*\s*!\[.*?\]\((.*?)\)", block)
        img_rel = img_match.group(1) if img_match else None

        q_match = re.search(r"\*\*提问：\*\*(.*?)(?=\*\*答案：\*\*)", block, re.S)
        question = q_match.group(1).strip() if q_match else ""

        a_match = re.search(r"\*\*答案：\*\*(.*?)(?=\*\*易错分析：\*\*)", block, re.S)
        answer = a_match.group(1).strip() if a_match else ""

        e_match = re.search(r"\*\*易错分析：\*\*(.*?)(?=\*\*记忆钩子：\*\*|\n###|\Z)", block, re.S)
        error_analysis = e_match.group(1).strip() if e_match else ""

        h_match = re.search(r"\*\*记忆钩子：\*\*(.*?)(?=\n###|\Z)", block, re.S)
        hook = h_match.group(1).strip() if h_match else ""

        cards.append({
            "num": card_num,
            "unit_label": unit_label,
            "folder_name": folder_name,
            "img_rel": img_rel,
            "question": question,
            "answer": answer,
            "error_analysis": error_analysis,
            "hook": hook,
        })
    return cards


def convert_inline_math(text):
    """将 $...$ 行内公式转换为 Anki 支持的 \\(...\\) 格式。
    跳过 $$...$$ 和 \\[...\\] 显示公式块，只转换单 $ 行内公式。
    同时跳过已转义的美元符号。"""
    # 匹配单 $ 包裹的行内公式（不以 $ 开头/结尾，不与相邻 $ 连在一起）
    # (?<!\$) - 前面不是 $
    # \$(?!\$) - 一个 $ 且后面不是 $
    # (.*?) - 非贪婪匹配公式内容
    # (?<!\$)\$(?!\$) - 一个 $ 且前面不是 $ 且后面不是 $
    return re.sub(r'(?<!\$)\$(?!\$)(.*?)(?<!\$)\$(?!\$)', r'\(\1\)', text)


def preserve_display_math(text):
    """把 \\[...\\]、$$...$$ 显示公式块内部的换行替换成空格，防止导入时被转成 <br> 破坏 MathJax。"""
    def flatten(m):
        return m.group(0).replace(chr(10), " ")
    text = re.sub(r"\\\[[\s\S]*?\\\]", flatten, text)
    text = re.sub(r"\$\$[\s\S]*?\$\$", flatten, text)
    return text


def html_field(text):
    """把字段文本转成 Anki 兼容的 HTML：转换行内公式、保留换行、保护显示公式块。"""
    # 1. 先转换行内公式 $...$ → \\(...\\)
    text = convert_inline_math(text)
    # 2. 保护显示公式块内部的换行
    text = preserve_display_math(text)
    # 3. 其它换行转为 <br>
    return text.replace(chr(10), "<br>")


def build_note(card, md_path, media_dir):
    """构建 Anki note，并把图片复制到媒体文件夹"""
    folder = md_path.with_suffix("")
    img_html = ""

    if card["img_rel"]:
        img_path = folder / Path(card["img_rel"]).name
        if img_path.exists():
            safe_unit = card["unit_label"].replace(" ", "_")
            ext = img_path.suffix.lower()
            img_filename = f"{safe_unit}_{card['num']:02d}{ext}"
            dest = media_dir / img_filename
            if not dest.exists():
                shutil.copy2(img_path, dest)
            img_html = f"<div style='margin-top:10px;'><img src='{img_filename}'></div>"

    back_parts = []
    if card["answer"]:
        back_parts.append(f"<div><b>答案：</b><br>{html_field(card['answer'])}</div>")
    if card["error_analysis"]:
        back_parts.append(f"<div style='margin-top:10px;color:#c00;'><b>易错分析：</b><br>{html_field(card['error_analysis'])}</div>")
    if card["hook"]:
        back_parts.append(f"<div style='margin-top:10px;color:#080;'><b>记忆钩子：</b>{html_field(card['hook'])}</div>")
    if img_html:
        back_parts.append(img_html)

    back_html = "\n".join(back_parts)

    note = {
        "deckName": DECK_NAME,
        "modelName": MODEL_NAME,
        "fields": {
            "Front": convert_inline_math(card["question"]),
            "Back": back_html,
            "link": card["unit_label"],
        },
        "options": {
            "allowDuplicate": True,
            "duplicateScope": "deck",
        },
        "tags": ["数学", card["unit_label"]],
        "audio": [],
        "video": [],
        "picture": [],
    }
    return note


def clear_deck(deck_name):
    """清空牌组中的卡片"""
    print(f"清空牌组 '{deck_name}' 中的现有卡片...")
    r = invoke_anki("findNotes", {"query": f'deck:"{deck_name}"'})
    if "error" in r:
        print(f"查询卡片失败: {r['error']}")
        return
    note_ids = r.get("result", [])
    if not note_ids:
        print("牌组为空，无需清空")
        return
    print(f"找到 {len(note_ids)} 张现有卡片，删除中...")
    r = invoke_anki("deleteNotes", {"notes": note_ids})
    if "error" in r:
        print(f"删除卡片失败: {r['error']}")
    else:
        print(f"已删除 {len(note_ids)} 张卡片")


def main():
    # 检查/创建牌组
    decks = invoke_anki("deckNames").get("result", [])
    if DECK_NAME not in decks:
        print(f"牌组 '{DECK_NAME}' 不存在，创建中...")
        r = invoke_anki("createDeck", {"deck": DECK_NAME})
        if "error" in r:
            print(f"创建牌组失败: {r['error']}")
            return
    else:
        clear_deck(DECK_NAME)

    media_dir = get_media_dir()
    print(f"Anki 媒体文件夹: {media_dir}")

    md_files = sorted(ROOT.rglob("*.md"))

    all_notes = []
    for md_path in md_files:
        cards = parse_cards(md_path)
        if not cards:
            continue
        print(f"解析: {md_path.relative_to(ROOT)} ({len(cards)} 张卡)")
        for card in cards:
            note = build_note(card, md_path, media_dir)
            all_notes.append(note)

    total = len(all_notes)
    print(f"\n共 {total} 张卡片待导入，每批 {BATCH_SIZE} 张")

    ok = 0
    fail = 0
    for i in range(0, total, BATCH_SIZE):
        batch = all_notes[i:i + BATCH_SIZE]
        result = invoke_anki("addNotes", {"notes": batch})
        if "error" in result:
            print(f"\n[FAIL] 批次 {i//BATCH_SIZE + 1} 失败: {result['error']}")
            fail += len(batch)
        else:
            results = result.get("result", [])
            batch_ok = sum(1 for r in results if r is not None)
            batch_fail = len(batch) - batch_ok
            ok += batch_ok
            fail += batch_fail
            print(f"[批次 {i//BATCH_SIZE + 1}/{(total-1)//BATCH_SIZE + 1}] 成功 {batch_ok}/{len(batch)}")

    print(f"\n=== 导入完成 ===")
    print(f"总计: {total} | 成功: {ok} | 失败: {fail}")


if __name__ == "__main__":
    main()
