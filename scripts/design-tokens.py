"""Design-token guard for RhinoFit.

    python scripts/design-tokens.py            # check: list hardcoded colors (exit 1 if any)
    python scripts/design-tokens.py --fix      # migrate known hardcoded colors to theme tokens
    python scripts/design-tokens.py --fix pages/HomePage.tsx   # limit to given files

Hardcoded palette classes (bg-white, text-gray-*, bg-blue-*, bg-[#FF6B35], ...) break dark mode
and drift from the brand. See DESIGN_SYSTEM.md section 6 for the token table.
Generated/vendor folders (src/components/ui, src/components/kokonutui) are skipped.
"""
from __future__ import annotations

import re
import sys
from dataclasses import dataclass
from pathlib import Path

SCAN_GLOBS = ("pages/*.tsx", "components/*.tsx", "src/pages/*.tsx", "src/components/layout/*.tsx",
              "src/components/form/*.tsx", "App.tsx")

NEUTRAL = r"(?:gray|slate|zinc|neutral)"
BRAND = r"(?:blue|orange|indigo|\[#FF6B35\]|\[#ff6b35\]|\[#e55a2b\]|\[#E55A2B\])"
BRAND_LIGHT = r"\[#FF8C42\]"  # lighter brand stop used in gradients
PREFIX = r"((?:[\w-]+(?:/\w+)?:)*)"  # keeps hover:, focus:, dark:, group-hover/x: ...


@dataclass(frozen=True)
class Rule:
    pattern: str
    replacement: str


# First match wins per class; specific (hover/focus) rules come before generic ones.
RULES: tuple[Rule, ...] = (
    # neutral dark: overrides are redundant once tokens handle the theme
    Rule(r"dark:[\w:/-]*" + NEUTRAL + r"-\d+(?:/\d+)?", ""),
    Rule(r"dark:(?:bg|text|border)-(?:white|black)(?:/\d+)?", ""),
    # lighter brand gradient stop keeps the gradient visible
    Rule(PREFIX + r"(from|to|via)-" + BRAND_LIGHT, r"\1\2-primary/70"),
    # brand hover = darker brand
    Rule(PREFIX + r"hover:bg-" + BRAND + r"(?:-(?:500|600|700|800))?(?=[\s\"'`]|$)", r"\1hover:bg-primary/90"),
    Rule(PREFIX + r"hover:text-" + BRAND + r"(?:-(?:600|700|800))?(?=[\s\"'`]|$)", r"\1hover:text-primary/80"),
    # brand solids
    Rule(PREFIX + r"(bg|text|border|fill|stroke|from|to|via|ring|outline|decoration|accent|caret)-"
         + BRAND + r"(?:-(?:400|500|600|700|800|900))?(?=[\s\"'`/]|$)", r"\1\2-primary"),
    # brand tints
    Rule(PREFIX + r"(bg|from|to|via)-" + BRAND + r"-(?:50|100|200)", r"\1\2-primary/10"),
    Rule(PREFIX + r"border-" + BRAND + r"-(?:100|200|300)", r"\1border-primary/30"),
    Rule(PREFIX + r"text-" + BRAND + r"-(?:300)", r"\1text-primary/70"),
    # focus rings always use the ring token
    Rule(PREFIX + r"(focus(?:-visible|-within)?:)ring-(?:primary|" + NEUTRAL + r"-\d+)", r"\1\2ring-ring"),
    # neutral text
    Rule(PREFIX + r"text-" + NEUTRAL + r"-(?:950|900|800)", r"\1text-foreground"),
    Rule(PREFIX + r"text-" + NEUTRAL + r"-(?:700|600|500)", r"\1text-muted-foreground"),
    Rule(PREFIX + r"text-" + NEUTRAL + r"-(?:400|300|200)", r"\1text-muted-foreground/70"),
    Rule(PREFIX + r"placeholder(?:-|:text-)" + NEUTRAL + r"-\d+", r"\1placeholder:text-muted-foreground"),
    # neutral surfaces
    Rule(PREFIX + r"bg-white(?=[\s\"'`]|$)", r"\1bg-card"),
    Rule(PREFIX + r"bg-" + NEUTRAL + r"-50", r"\1bg-muted/50"),
    Rule(PREFIX + r"bg-" + NEUTRAL + r"-(?:100|200)", r"\1bg-muted"),
    Rule(PREFIX + r"bg-" + NEUTRAL + r"-300", r"\1bg-muted-foreground/30"),
    # neutral lines
    Rule(PREFIX + r"(border|divide)(-[trblxy])?-" + NEUTRAL + r"-(?:50|100|200|300)", r"\1\2\3-border"),
    Rule(PREFIX + r"(border|divide)(-[trblxy])?-" + NEUTRAL + r"-(?:400|500|600)", r"\1\2\3-input"),
    Rule(PREFIX + r"ring-" + NEUTRAL + r"-(?:100|200|300)", r"\1ring-border"),
)

# Anything still matching this after --fix needs a human decision (dark surfaces, odd shades).
FORBIDDEN = re.compile(
    r"(?<![\w/-])(?:[\w-]+(?:/\w+)?:)*(?:bg-white(?![\w/-])|(?:bg|text|border|divide|ring|from|to|via)-"
    r"(?:" + NEUTRAL + r"|blue|orange|indigo)-\d+|[\w-]+-\[#[0-9a-fA-F]{3,8}\])"
)
STRING_LITERAL = re.compile(r"\"[^\"\n]*\"|'[^'\n]*'|`[^`]*`")


def fix_classes(literal: str) -> str:
    text = literal
    for rule in RULES:
        text = re.sub(r"(?<![\w/\[-])" + rule.pattern, rule.replacement, text)
    if text == literal:
        return literal  # untouched literals keep their exact whitespace
    # tidy only the gaps left by removed classes: spaces/tabs, never newlines
    text = re.sub(r"(?<=\S)[ \t]{2,}(?=\S)", " ", text)
    return re.sub(r"(?<=[\w\]/)])[ \t]+(?=[\"'`]$)", "", text)


def fix_file(path: Path) -> bool:
    # read_bytes keeps CRLF/LF exactly as on disk (read_text would normalise line endings)
    source = path.read_bytes().decode("utf-8")
    result = STRING_LITERAL.sub(lambda m: fix_classes(m.group(0)), source)
    if result != source:
        path.write_text(result, encoding="utf-8", newline="")
        return True
    return False


def violations(path: Path) -> list[tuple[int, str]]:
    found = []
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        for match in FORBIDDEN.finditer(line):
            found.append((number, match.group(0)))
    return found


def target_files(args: list[str]) -> list[Path]:
    if args:
        return [Path(a) for a in args]
    return sorted({p for pattern in SCAN_GLOBS for p in Path(".").glob(pattern)})


def main(argv: list[str]) -> int:
    should_fix = "--fix" in argv
    files = target_files([a for a in argv if a != "--fix"])
    missing = [f for f in files if not f.is_file()]
    if missing:
        print("Not found:", ", ".join(map(str, missing)))
        return 2

    if should_fix:
        changed = [f for f in files if fix_file(f)]
        print(f"fixed {len(changed)} of {len(files)} files")

    total = 0
    for path in files:
        hits = violations(path)
        total += len(hits)
        for number, cls in hits:
            print(f"{path}:{number}: {cls}")
    print(f"{total} hardcoded color classes remaining")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
