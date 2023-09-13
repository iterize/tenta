import os
import typing


MONOREPO_DIR = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
EXAMPLE_SRC = os.path.join(MONOREPO_DIR, "client", "example.py")
EXAMPLE_DST = os.path.join(
    MONOREPO_DIR, "docs", "pages", "user-guide", "python-client-example.mdx"
)
API_DST = os.path.join(
    MONOREPO_DIR, "docs", "pages", "api-reference", "python-client-api.mdx"
)


# convert example code to markdown


with open(EXAMPLE_SRC, "r") as f:
    file_content = f.read().strip(" \n\t").replace("# fmt: off\n", "")

file_blocks = file_content.split("\n\n\n")
markdown_blocks: typing.List[str] = ["# Example Usage of the Tenta Python Client"]

for block in file_blocks:
    is_comment_block = all([l.startswith("#") for l in block.split("\n")])
    if is_comment_block:
        markdown_blocks.append(
            "\n".join([l[1:].lstrip(" ") for l in block.split("\n")])
        )
    else:
        markdown_blocks.append(f"```python\n{block}\n```")

with open(EXAMPLE_DST, "w") as f:
    f.write("\n\n".join(markdown_blocks))


# generate automatic API reference and prettify output


os.system(
    f"cd {os.path.join(MONOREPO_DIR, 'client')} && pydoc-markdown --module=tenta > {API_DST}"
)

with open(API_DST, "r") as f:
    raw_api_reference_content = f.read()

api_reference_content = "\n".join(
    list(
        filter(
            lambda line: not line.startswith('<a id="'),
            (
                ["# Tenta Python Client API Reference"]
                + raw_api_reference_content.split("\n")[7:]
            ),
        )
    )
)

with open(API_DST, "w") as f:
    f.write(api_reference_content)
