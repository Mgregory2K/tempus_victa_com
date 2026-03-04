"""Local-first records persistence.

This is intentionally simple: a single JSON file on disk acts as the system-of-record.
It is designed for a local LAN app with no auth yet.
"""

from __future__ import annotations

from pathlib import Path
import json
import time
import threading
from typing import Any, Dict, List, Optional


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


class RecordsStore:
    def __init__(self, path: Path):
        self.path = path
        self._lock = threading.Lock()

    def _read_all(self) -> List[Dict[str, Any]]:
        if not self.path.exists():
            return []
        try:
            raw = self.path.read_text(encoding="utf-8")
            data = json.loads(raw) if raw.strip() else []
            return data if isinstance(data, list) else []
        except Exception:
            return []

    def _write_all(self, records: List[Dict[str, Any]]) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")

    def list(self, type: Optional[str] = None, workspace_id: Optional[str] = None) -> List[Dict[str, Any]]:
        with self._lock:
            all_r = self._read_all()
            if type:
                all_r = [r for r in all_r if r.get("type") == type]
            if workspace_id:
                all_r = [r for r in all_r if r.get("workspaceId") == workspace_id]
            # newest first
            all_r.sort(key=lambda r: r.get("updatedAt") or "", reverse=True)
            return all_r

    def get(self, record_id: str) -> Optional[Dict[str, Any]]:
        with self._lock:
            for r in self._read_all():
                if r.get("id") == record_id:
                    return r
            return None

    def upsert(self, record: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update a record.

        Assumes the client is providing a mostly-normalized record.
        Server guarantees updatedAt.
        """
        if not isinstance(record, dict):
            raise ValueError("record must be an object")
        rid = str(record.get("id") or "").strip()
        if not rid:
            raise ValueError("record.id is required")

        with self._lock:
            all_r = self._read_all()
            now = _now_iso()
            idx = next((i for i, r in enumerate(all_r) if r.get("id") == rid), -1)
            if idx >= 0:
                merged = {**all_r[idx], **record}
                merged["updatedAt"] = now
                all_r[idx] = merged
                self._write_all(all_r)
                return merged
            else:
                created = {**record}
                created.setdefault("createdAt", now)
                created["updatedAt"] = now
                all_r.insert(0, created)
                self._write_all(all_r)
                return created

    def delete(self, record_id: str) -> bool:
        with self._lock:
            all_r = self._read_all()
            nxt = [r for r in all_r if r.get("id") != record_id]
            if len(nxt) == len(all_r):
                return False
            self._write_all(nxt)
            return True
