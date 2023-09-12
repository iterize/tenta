import os
import typing


PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXAMPLE_SRC = os.path.join(PROJECT_DIR, "example.py")
EXAMPLE_DST = os.path.join(PROJECT_DIR, "example.md")

with open(EXAMPLE_SRC, "r") as f:
    file_content = f.read()

file_blocks = file_content.split("\n\n\n")
markdown_blocks: typing.List[str] = []

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
