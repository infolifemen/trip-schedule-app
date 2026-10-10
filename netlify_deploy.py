"""
Netlify Deploy через API с file digest
"""
import os
import sys
import json
import hashlib
import requests
from pathlib import Path

TOKEN = os.environ.get("NETLIFY_AUTH_TOKEN", "nfp_x6FxZYkJshu5FF85XpCmDBiHeYpaWH5L8b7a")
SITE_ID = "5048941d-4176-4da6-80cc-228ad037455b"
OUT_DIR = Path(__file__).parent / "out"
API_BASE = "https://api.netlify.com/api/v1"

def sha1_file(path: Path) -> str:
    h = hashlib.sha1()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()

def collect_files(root: Path) -> dict:
    """Собирает все файлы с SHA1 хэшами"""
    files = {}
    for path in root.rglob("*"):
        if path.is_file():
            rel = "/" + path.relative_to(root).as_posix()
            files[rel] = sha1_file(path)
    return files

def deploy():
    print(f"📦 Собираю файлы из {OUT_DIR}...")
    files = collect_files(OUT_DIR)
    print(f"   Найдено {len(files)} файлов")
    
    # 1. Создаём deploy с file digest
    print("📤 Создаю deploy...")
    headers = {"Authorization": f"Bearer {TOKEN}"}
    resp = requests.post(
        f"{API_BASE}/sites/{SITE_ID}/deploys",
        headers=headers,
        json={"files": files}
    )
    resp.raise_for_status()
    deploy_data = resp.json()
    deploy_id = deploy_data["id"]
    required = deploy_data.get("required", [])
    print(f"   Deploy ID: {deploy_id}")
    print(f"   Нужно загрузить {len(required)} файлов")
    
    # 2. Загружаем требуемые файлы
    if required:
        sha_to_path = {v: k for k, v in files.items()}
        for i, sha in enumerate(required):
            rel_path = sha_to_path[sha]
            local_path = OUT_DIR / rel_path.lstrip("/")
            print(f"   [{i+1}/{len(required)}] {rel_path}...", end=" ", flush=True)
            with open(local_path, "rb") as f:
                resp = requests.put(
                    f"{API_BASE}/deploys/{deploy_id}/files{rel_path}",
                    headers={
                        "Authorization": f"Bearer {TOKEN}",
                        "Content-Type": "application/octet-stream"
                    },
                    data=f.read()
                )
                resp.raise_for_status()
                print("✅")
    
    # 3. Проверяем статус
    resp = requests.get(f"{API_BASE}/deploys/{deploy_id}", headers=headers)
    state = resp.json()["state"]
    print(f"\n🏁 Deploy state: {state}")
    print(f"🌐 https://trip-schedule-app.netlify.app")
    
    if state == "ready":
        print("✅ Deploy успешен!")
    else:
        print(f"⏳ Deploy ещё в процессе, проверь позже")

if __name__ == "__main__":
    deploy()
