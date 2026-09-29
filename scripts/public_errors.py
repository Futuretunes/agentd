#!/usr/bin/env python3
"""Refresh the reviewed, fixed-message browser error catalog. Review its diff before committing."""
import ast
import json
from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
pattern=re.compile(r"\bError\(\s*(?P<literal>(?P<quote>['\"])(?:\\.|(?!(?P=quote)).)*?(?P=quote))\s*,?\s*\)",re.S)
messages=set()
for source in (root/'src').glob('*.ts'):
    if source.name.startswith('public-error'):continue
    for match in pattern.finditer(source.read_text()):
        try:value=ast.literal_eval(match['literal'])
        except (SyntaxError,ValueError):continue
        # Only complete fixed, short, single-line messages. Dynamic strings,
        # paths, URLs and raw subprocess output are never inferred as safe.
        if isinstance(value,str) and 0<len(value)<=350 and all(c.isprintable() for c in value) and '/' not in value and '\\' not in value:
            messages.add(value)
output='// Reviewed static messages only. Refresh with scripts/public_errors.py; review the diff.\nexport const publicMessages = new Set<string>('+json.dumps(sorted(messages),ensure_ascii=False,indent=2)+');\n'
(root/'src/public-error-messages.ts').write_text(output)
print(f'{len(messages)} fixed messages; review catalog changes before publishing.')
