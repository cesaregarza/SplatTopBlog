import html
import re

from markdown.extensions import Extension
from markdown.preprocessors import Preprocessor


class LatexBlockPreprocessor(Preprocessor):
    START_RE = re.compile(r"^\s*\[latex\]\s*$", re.IGNORECASE)
    END_RE = re.compile(r"^\s*\[/latex\]\s*$", re.IGNORECASE)
    FENCE_RE = re.compile(r"^\s*(```|~~~)")

    def run(self, lines):
        out = []
        in_latex = False
        in_fence = False
        buffer = []

        for line in lines:
            fence_match = self.FENCE_RE.match(line)
            if fence_match and not in_latex:
                in_fence = not in_fence
                out.append(line)
                continue

            if in_latex:
                if self.END_RE.match(line):
                    content = "\n".join(buffer).strip("\n")
                    html_block = '<div class="latex-block">{}</div>'.format(
                        html.escape(content)
                    )
                    out.append(self.md.htmlStash.store(html_block))
                    buffer = []
                    in_latex = False
                else:
                    buffer.append(line)
                continue

            if not in_fence and self.START_RE.match(line):
                in_latex = True
                buffer = []
                continue

            out.append(line)

        if in_latex:
            out.append("[latex]")
            out.extend(buffer)

        return out


class LatexExtension(Extension):
    def extendMarkdown(self, md):
        md.preprocessors.register(LatexBlockPreprocessor(md), "latex_block", 27)


def makeExtension(**kwargs):
    return LatexExtension(**kwargs)
