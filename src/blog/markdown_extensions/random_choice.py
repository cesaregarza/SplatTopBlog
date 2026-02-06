import hashlib
import re

from markdown.extensions import Extension
from markdown.preprocessors import Preprocessor


class RandomChoicePreprocessor(Preprocessor):
    START_RE = re.compile(r"^\s*\[random\]\s*$", re.IGNORECASE)
    END_RE = re.compile(r"^\s*\[/random\]\s*$", re.IGNORECASE)
    FENCE_RE = re.compile(r"^\s*(```|~~~)")
    LIST_MARKER_RE = re.compile(r"^\s*(?:[-*]|\d+\.)\s+")
    INLINE_RE = re.compile(r"\[random:(.+?)\]", re.IGNORECASE)

    @staticmethod
    def _pick(options):
        if not options:
            return ""
        seed = "||".join(options).encode("utf-8")
        digest = hashlib.sha256(seed).digest()
        index = int.from_bytes(digest[:8], byteorder="big") % len(options)
        return options[index]

    def run(self, lines):
        out = []
        in_block = False
        in_fence = False
        buffer = []

        for line in lines:
            fence_match = self.FENCE_RE.match(line)
            if fence_match and not in_block:
                in_fence = not in_fence
                out.append(line)
                continue

            if in_block:
                if self.END_RE.match(line):
                    choice = self._choose(buffer)
                    if choice is None:
                        out.append("[random]")
                        out.extend(buffer)
                        out.append("[/random]")
                    else:
                        out.append(choice)
                    buffer = []
                    in_block = False
                else:
                    buffer.append(line)
                continue

            if not in_fence and self.START_RE.match(line):
                in_block = True
                buffer = []
                continue

            if not in_fence:
                line = self.INLINE_RE.sub(lambda m: self._choose_inline(m.group(1)), line)
            out.append(line)

        if in_block:
            out.append("[random]")
            out.extend(buffer)

        return out

    def _choose(self, buffer):
        options = []
        for line in buffer:
            stripped = line.strip()
            if not stripped:
                continue
            stripped = self.LIST_MARKER_RE.sub("", stripped).strip()
            if stripped:
                options.append(stripped)
        if not options:
            return None
        if len(options) == 1 and " | " in options[0]:
            parts = [part.strip() for part in options[0].split("|") if part.strip()]
            if parts:
                options = parts
        return self._pick(options)

    def _choose_inline(self, raw):
        if raw is None:
            return ""
        parts = [part.strip() for part in raw.split("|") if part.strip()]
        if not parts:
            return ""
        return self._pick(parts)


class RandomChoiceExtension(Extension):
    def extendMarkdown(self, md):
        md.preprocessors.register(RandomChoicePreprocessor(md), "random_choice", 26)


def makeExtension(**kwargs):
    return RandomChoiceExtension(**kwargs)
