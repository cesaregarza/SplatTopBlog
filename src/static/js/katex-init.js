(function () {
  const onReady = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  };

  onReady(() => {
    if (!window.renderMathInElement) return;

    const options = {
      delimiters: [
        { left: "[latex]", right: "[/latex]", display: true },
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "\\(", right: "\\)", display: false },
        { left: "$", right: "$", display: false },
      ],
      ignoredClasses: ["latex-block"],
      throwOnError: false,
    };

    const renderLatexBlocks = (el) => {
      if (!window.katex) return;
      const blocks = el.querySelectorAll(".latex-block");
      blocks.forEach((block) => {
        if (block.dataset.katexRendered === "true") return;
        const tex = block.textContent.trim();
        if (!tex) return;
        try {
          window.katex.render(tex, block, {
            displayMode: true,
            throwOnError: false,
          });
          block.dataset.katexRendered = "true";
        } catch {
          // Leave raw text if KaTeX fails.
        }
      });
    };

    const renderTarget = (el) => {
      renderLatexBlocks(el);
      window.renderMathInElement(el, options);
    };

    const containers = document.querySelectorAll(".post-content");
    const targets = containers.length ? containers : [document.body];

    targets.forEach((el) => {
      renderTarget(el);
    });

    const detailsBlocks = document.querySelectorAll(".post-content details");
    detailsBlocks.forEach((details) => {
      details.addEventListener("toggle", () => {
        if (!details.open) return;
        renderTarget(details);
      });
    });
  });
})();
