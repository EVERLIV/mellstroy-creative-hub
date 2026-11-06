"""Adapt Kokonut UI components (built for Tailwind v4 + a neutral zinc palette)
to this project: Tailwind v3 syntax + shadcn theme tokens.

Run after every `npx shadcn@latest add @kokonutui/<name>`:
    python scripts/kokonut-compat.py src/components/kokonutui/<name>.tsx
    python scripts/kokonut-compat.py            # every Kokonut file

Idempotent. Prints classes it could NOT convert so you can review them by hand.
Drawn illustrations (fill-*/stroke-*) intentionally keep their own palette.
"""
import re
import sys
from pathlib import Path

KOKONUT_DIR = Path("src/components/kokonutui")
NEUTRAL = r"(?:zinc|neutral)"
VARIANTS = r"((?:[\w-]+(?:/\w+)?:)*)"  # keeps prefixes such as hover: or group-hover/zone:

# Order matters: the first matching rule wins for a given class.
TOKEN_RULES = [
    (VARIANTS + rf"text-{NEUTRAL}-(?:950|900|800)", r"\1text-foreground"),
    (VARIANTS + rf"text-{NEUTRAL}-(?:700|600|500|400)", r"\1text-muted-foreground"),
    (VARIANTS + rf"text-{NEUTRAL}-(?:300|200)", r"\1text-muted-foreground/60"),
    (VARIANTS + rf"bg-{NEUTRAL}-50", r"\1bg-muted/50"),
    (VARIANTS + rf"bg-{NEUTRAL}-(?:100|200)", r"\1bg-muted"),
    (VARIANTS + rf"bg-{NEUTRAL}-(?:900|950)", r"\1bg-primary"),
    (VARIANTS + r"bg-white", r"\1bg-card"),
    (VARIANTS + rf"(divide|border)-{NEUTRAL}-(?:100|200|300)", r"\1\2-border"),
    (VARIANTS + rf"border-{NEUTRAL}-(?:400|500)", r"\1border-ring"),
    (VARIANTS + rf"border-{NEUTRAL}-(?:800|900|950)", r"\1border-primary"),
    (VARIANTS + rf"decoration-{NEUTRAL}-(?:100|200|300|400)", r"\1decoration-muted-foreground/40"),
    (VARIANTS + rf"decoration-{NEUTRAL}-(?:500|600|700|800|900|950)", r"\1decoration-foreground"),
    (VARIANTS + r"ring-offset-white", r"\1ring-offset-background"),
    (VARIANTS + rf"(ring|outline)-{NEUTRAL}-\d+", r"\1\2-ring"),
    (VARIANTS + rf"placeholder:text-{NEUTRAL}-\d+", r"\1placeholder:text-muted-foreground"),
]

V4_TO_V3_RULES = [
    (r"shadow-xs", "shadow-sm"),
    (r"starting:[\w/-]+", ""),                                  # no v3 equivalent: drop enter fade
    (r"(group|peer)-data-([a-z][a-z-]*)(/\w+)?:", r"\1-data-[\2]\3:"),
    (r"data-([a-z][a-z-]*):", r"data-[\1]:"),
    (r"bg-current/\d+", "bg-foreground/10"),                    # v3 can't put alpha on currentColor
    (r"bg-linear-to-", "bg-gradient-to-"),
    (r"([\w-]+)-\((--[\w-]+)\)", r"\1-[var(\2)]"),     # w-(--x) -> w-[var(--x)]
]

# Neutral dark: overrides are redundant once tokens theme light/dark (illustrations excluded).
DARK_NEUTRAL = re.compile(
    r"\s*(?<![\w-])dark:(?![\w:/-]*(?:fill|stroke)-)[\w:/\[\]-]*?(?:zinc|neutral|white|black)[\w/\[\]-]*"
)
BOUNDARY_BEFORE = r"(?<![\w\[-])"
BOUNDARY_AFTER = r"(?![\w-])"


def convert_classes(text: str) -> str:
    text = DARK_NEUTRAL.sub("", text)
    for pattern, repl in TOKEN_RULES + V4_TO_V3_RULES:
        text = re.sub(BOUNDARY_BEFORE + pattern + (BOUNDARY_AFTER if not pattern.endswith(":") else ""), repl, text)
    if re.search(r"(?<![\w-])bg-primary(?![\w/-])", text):
        text = re.sub(r"(?<![\w-])text-white(?![\w-])", "text-primary-foreground", text)
    return re.sub(r"  +", " ", text)


def convert_file(path: Path) -> list[str]:
    source = path.read_text(encoding="utf-8")
    result = re.sub(r'"([^"\n]*)"', lambda m: '"' + convert_classes(m.group(1)) + '"', source)
    result = re.sub(r"`([^`]*)`", lambda m: "`" + convert_classes(m.group(1)) + "`", result)
    if result != source:
        path.write_text(result, encoding="utf-8")
    found = re.findall(r"[\w:/\[\]-]*(?:zinc|neutral)-\d+[\w/]*", result)
    return sorted({c for c in found if not re.search(r"(?:^|:)(?:fill|stroke)-", c)})


def main() -> int:
    targets = [Path(a) for a in sys.argv[1:]] or sorted(KOKONUT_DIR.glob("*.tsx"))
    missing = [t for t in targets if not t.is_file()]
    if missing:
        print("Not found:", ", ".join(map(str, missing)))
        return 1
    for target in targets:
        leftovers = convert_file(target)
        print(f"{target.name:28} {'review by hand: ' + ' '.join(leftovers) if leftovers else 'ok'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
