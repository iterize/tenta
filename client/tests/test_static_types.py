import os
import shutil

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _rmdir(path: str) -> None:
    path = os.path.join(PROJECT_DIR, path)
    if os.path.isdir(path):
        shutil.rmtree(path)


def test_static_types() -> None:
    _rmdir(".mypy_cache/3.*/tenta")
    _rmdir(".mypy_cache/3.*/tests")

    for path in ["tenta/", "tests/"]:
        assert os.system(f"cd {PROJECT_DIR} && .venv/bin/python -m mypy {path}") == 0
