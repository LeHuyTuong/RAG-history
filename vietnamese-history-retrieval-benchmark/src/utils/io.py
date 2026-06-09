from __future__ import annotations

from pathlib import Path
from typing import Iterable

import pandas as pd


def project_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_config(config_path: str | Path = "config.yaml") -> dict:
    path = Path(config_path)
    if not path.is_absolute():
        path = project_root() / path
    if not path.exists():
        raise FileNotFoundError(f"Config file not found: {path}")
    with path.open("r", encoding="utf-8") as f:
        config_text = f.read()
    config = _parse_yaml(config_text)
    config["_project_root"] = str(project_root())
    return config


def _parse_yaml(config_text: str) -> dict:
    try:
        import yaml

        return yaml.safe_load(config_text) or {}
    except Exception:
        parsed: dict[str, object] = {}
        for raw_line in config_text.splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or ":" not in line:
                continue
            key, value = line.split(":", 1)
            parsed[key.strip()] = _parse_scalar(value.strip())
        return parsed


def _parse_scalar(value: str) -> object:
    if value.lower() in {"true", "false"}:
        return value.lower() == "true"
    if value.lower() in {"null", "none", "~"}:
        return None
    try:
        if "." in value:
            return float(value)
        return int(value)
    except ValueError:
        return value.strip("'\"")


def resolve_path(config: dict, key: str, default: str | None = None) -> Path:
    value = config.get(key, default)
    if value is None:
        raise KeyError(f"Missing required config key: {key}")
    path = Path(value)
    if not path.is_absolute():
        path = Path(config.get("_project_root", project_root())) / path
    return path


def ensure_dir(path: str | Path) -> Path:
    path = Path(path)
    path.mkdir(parents=True, exist_ok=True)
    return path


def read_csv(path: str | Path, columns: Iterable[str] | None = None) -> pd.DataFrame:
    path = Path(path)
    if not path.exists() or path.stat().st_size == 0:
        return pd.DataFrame(columns=list(columns or []))
    return pd.read_csv(path, dtype=str, keep_default_na=False)


def write_csv(df: pd.DataFrame, path: str | Path) -> None:
    path = Path(path)
    ensure_dir(path.parent)
    df.to_csv(path, index=False)


def init_csv(path: str | Path, columns: Iterable[str], overwrite: bool = False) -> None:
    path = Path(path)
    if overwrite or not path.exists():
        write_csv(pd.DataFrame(columns=list(columns)), path)


def truthy(value: object) -> bool:
    return str(value).strip().lower() in {"1", "true", "yes", "y"}


def stringify_list(values: Iterable[object]) -> str:
    cleaned = [str(v).strip() for v in values if str(v).strip()]
    return "|".join(dict.fromkeys(cleaned))


def split_pipe(value: object) -> list[str]:
    if value is None:
        return []
    text = str(value).strip()
    if not text:
        return []
    return [part.strip() for part in text.split("|") if part.strip()]
