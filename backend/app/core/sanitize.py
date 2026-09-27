import re


TAG_RE = re.compile(r"<[^>]+>")


def strip_html(value: str) -> str:
    return TAG_RE.sub("", value)