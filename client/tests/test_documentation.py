"""Test whether the automatically generated documentation is up to date.

This is necessary because the documentation build script does not generate
the documentation pages automatically. Otherwise we would have to set up
the full Python environment on the CI server for the documentation build."""

import hashlib
import os
import pytest

MONOREPO_DIR = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
EXAMPLE_DST = os.path.join(
    MONOREPO_DIR, "docs", "pages", "user-guide", "python-client-example.mdx"
)
API_DST = os.path.join(
    MONOREPO_DIR, "docs", "pages", "api-reference", "python-client-api.mdx"
)


@pytest.mark.order(4)
def test_documentation_sync() -> None:
    with open(EXAMPLE_DST, "r") as f:
        checksum_of_example_before = hashlib.md5(f.read().encode()).hexdigest()
    with open(API_DST, "r") as f:
        checksum_of_api_before = hashlib.md5(f.read().encode()).hexdigest()

    assert (
        os.system(
            f"python {os.path.join(MONOREPO_DIR, 'client', 'scripts', 'generate_documentation.py')}"
        )
        == 0
    )

    with open(EXAMPLE_DST, "r") as f:
        checksum_of_example_after = hashlib.md5(f.read().encode()).hexdigest()
    with open(API_DST, "r") as f:
        checksum_of_api_after = hashlib.md5(f.read().encode()).hexdigest()

    assert checksum_of_example_before == checksum_of_example_after
    assert checksum_of_api_before == checksum_of_api_after
