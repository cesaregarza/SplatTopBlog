(function () {
  const onReady = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  };

  const scheduleIdle = (fn) => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(fn, { timeout: 2000 });
    } else {
      setTimeout(fn, 0);
    }
  };

  onReady(() => {
    const setScrollOffset = () => {
      const header = document.querySelector(".site-header");
      if (!header) return;
      const height = header.getBoundingClientRect().height;
      const offset = Math.ceil(height + 16);
      document.documentElement.style.setProperty("--site-header-offset", `${offset}px`);
    };

    setScrollOffset();
    window.addEventListener("resize", setScrollOffset);

    const content = document.querySelector(".post-content");
    const readTimeEl = document.getElementById("postReadTime");
    const tocList = document.getElementById("postTocList");
    const crumbEl = document.getElementById("postTocCrumb");
    const toc = document.querySelector(".post-toc");
    const progressEl = document.getElementById("postTocProgress");
    const drawerToggle = document.getElementById("postTocDrawerToggle");
    const backdrop = document.getElementById("postTocBackdrop");

    if (!content) return;

    const anchorSlugCounts = new Map();
    const slugify = (text, prefix = "") => {
      const base = text
        .toLowerCase()
        .replace(/[^a-z0-9\\s-]/g, "")
        .trim()
        .replace(/\\s+/g, "-");
      const key = `${prefix}:${base}`;
      const count = anchorSlugCounts.get(key) || 0;
      anchorSlugCounts.set(key, count + 1);
      const suffix = count ? `-${count + 1}` : "";
      if (!base) {
        return `section-${anchorSlugCounts.size}`;
      }
      return `${base}${suffix}`;
    };

    const showCopyToast = (anchor) => {
      const toast = document.createElement("div");
      toast.className = "copy-toast";
      toast.textContent = "Link copied";
      document.body.appendChild(toast);
      const rect = anchor.getBoundingClientRect();
      const top = Math.max(12, rect.top - 28);
      const left = Math.max(12, Math.min(rect.left, window.innerWidth - 120));
      toast.style.top = `${top}px`;
      toast.style.left = `${left}px`;
      requestAnimationFrame(() => {
        toast.classList.add("is-visible");
      });
      setTimeout(() => {
        toast.classList.remove("is-visible");
        setTimeout(() => toast.remove(), 200);
      }, 1200);
    };

    const addAnchor = (el, prefix, explicitId = "", textOverride = "") => {
      if (!el || el.querySelector(".para-anchor")) return;
      const rawText = textOverride || (el.textContent || "");
      const text = rawText.trim();
      if (!text && !explicitId && !el.id) return;
      let id = el.id || explicitId;
      if (!id) {
        const slugSource = text.split(/\\s+/).slice(0, 12).join(" ");
        const base = slugify(slugSource, prefix);
        id = prefix ? `${prefix}-${base}` : base;
      }
      el.id = id;
      const anchor = document.createElement("a");
      anchor.className = "para-anchor";
      anchor.href = `#${id}`;
      anchor.textContent = "";
      anchor.setAttribute("aria-label", `Copy link to ${text || "section"}`);
      anchor.addEventListener("click", () => {
        const url = `${window.location.origin}${window.location.pathname}#${id}`;
        navigator.clipboard?.writeText(url).catch(() => {});
        showCopyToast(anchor);
      });
      el.prepend(anchor);
    };

    content.querySelectorAll("p").forEach((p) => addAnchor(p, "p"));
    content.querySelectorAll("h2, h3, h4, h5, h6").forEach((heading) => addAnchor(heading, "h"));
    content.querySelectorAll(".collapsible-block__summary").forEach((summary) => {
      const titleEl = summary.querySelector(".collapsible-block__title");
      const text = titleEl ? titleEl.textContent.trim() : summary.textContent.trim();
      if (!text) return;
      addAnchor(summary, "c", "", text);
    });

    const headings = Array.from(content.querySelectorAll("h2, h3"));

    if (headings.length === 0) {
      const sidebar = toc ? toc.closest(".post-sidebar") : null;
      if (sidebar) sidebar.style.display = "none";
      if (drawerToggle) drawerToggle.style.display = "none";
    } else if (tocList && crumbEl && toc) {
      const headingMeta = [];
      let currentH2 = "";

      headings.forEach((heading) => {
        const text = heading.textContent.trim();
        if (!heading.id) {
          const base = slugify(text, "h");
          heading.id = `h-${base}`;
        }
        const level = heading.tagName.toLowerCase();
        if (level === "h2") {
          currentH2 = text;
        }
        headingMeta.push({
          id: heading.id,
          text,
          level,
          parent: level === "h3" ? currentH2 : "",
        });
      });

      headingMeta.forEach((meta) => {
        const li = document.createElement("li");
        li.className = "post-toc__item";
        if (meta.level === "h3") {
          li.classList.add("post-toc__item--sub");
        }

        const link = document.createElement("a");
        link.className = "post-toc__link";
        link.href = `#${meta.id}`;
        link.textContent = meta.text || meta.id;
        link.dataset.tocId = meta.id;
        li.appendChild(link);
        tocList.appendChild(li);
      });

      const links = Array.from(tocList.querySelectorAll(".post-toc__link"));

      if (headings.length <= 2) {
        toc.classList.add("post-toc--compact");
      }

      const setScrollbarOffset = (value) => {
        document.documentElement.style.setProperty("--scrollbar-offset", value);
      };

      const openDrawer = () => {
        const scrollBarWidth = Math.max(
          0,
          window.innerWidth - document.documentElement.clientWidth
        );
        setScrollbarOffset(`${scrollBarWidth}px`);
        document.body.classList.add("toc-drawer-open");
        if (drawerToggle) drawerToggle.setAttribute("aria-expanded", "true");
      };

      const closeDrawer = () => {
        document.body.classList.remove("toc-drawer-open");
        setScrollbarOffset("0px");
        if (drawerToggle) drawerToggle.setAttribute("aria-expanded", "false");
      };

      if (drawerToggle) {
        drawerToggle.addEventListener("click", () => {
          if (document.body.classList.contains("toc-drawer-open")) {
            closeDrawer();
          } else {
            openDrawer();
          }
        });
      }

      if (backdrop) {
        backdrop.addEventListener("click", closeDrawer);
      }

      window.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeDrawer();
      });

      const updateActive = (id) => {
        links.forEach((link) => {
          link.classList.toggle("is-active", link.dataset.tocId === id);
        });
        const meta = headingMeta.find((entry) => entry.id === id);
        if (!meta) return;
        if (meta.level === "h3" && meta.parent) {
          crumbEl.textContent = `${meta.parent} → ${meta.text}`;
        } else {
          crumbEl.textContent = meta.text;
        }
      };

      let ticking = false;
      const updateProgress = () => {
        if (!progressEl) return;
        const top = content.offsetTop;
        const height = content.offsetHeight;
        const viewport = window.innerHeight;
        const maxScroll = Math.max(1, height - viewport);
        const scrollY = window.scrollY - top;
        const progress = Math.min(1, Math.max(0, scrollY / maxScroll));
        progressEl.style.width = `${(progress * 100).toFixed(2)}%`;
      };

      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          const fromTop = window.scrollY + 140;
          let current = headings[0];
          for (const heading of headings) {
            if (heading.offsetTop <= fromTop) {
              current = heading;
            } else {
              break;
            }
          }
          if (current) updateActive(current.id);
          updateProgress();
          ticking = false;
        });
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      const handleResize = () => {
        onScroll();
        if (window.matchMedia("(min-width: 1100px)").matches) {
          closeDrawer();
        }
      };

      window.addEventListener("resize", handleResize);
      handleResize();

      links.forEach((link) => {
        link.addEventListener("click", closeDrawer);
      });
    }

    scheduleIdle(() => {
      const wordRegex = /[A-Za-z0-9]+(?:'[A-Za-z0-9]+)?/g;
      const countWordsInString = (text) => (text.match(wordRegex) || []).length;
      const mathCharsPerWord = 8;
      const wordsPerMinute = 220;

      const countMathWords = (el) => {
        const annotations = el.querySelectorAll("annotation[encoding='application/x-tex']");
        let tex = "";
        annotations.forEach((node) => {
          if (node.textContent) tex += ` ${node.textContent}`;
        });
        if (!tex) {
          tex = el.textContent || "";
        }
        const compact = tex.replace(/\\s+/g, "");
        if (!compact) return 0;
        return Math.max(1, Math.ceil(compact.length / mathCharsPerWord));
      };

      const countTableWords = (table) => {
        let total = 0;
        table.querySelectorAll("th, td").forEach((cell) => {
          const text = (cell.textContent || "").trim();
          const words = countWordsInString(text);
          if (words === 0 && text.length > 0) {
            total += 1;
          } else {
            total += words;
          }
        });
        return total;
      };

      const shouldSkip = (el) =>
        el.matches("script, style, nav") ||
        el.classList.contains("para-anchor") ||
        el.classList.contains("post-toc") ||
        el.classList.contains("post-sidebar") ||
        el.classList.contains("glossary-data") ||
        el.classList.contains("glossary-tooltip") ||
        el.classList.contains("collapsible-block__readtime") ||
        el.classList.contains("collapsible-block__icon") ||
        el.classList.contains("copy-toast");

      const collapsibleCounts = new Map();

      const countNode = (node) => {
        if (!node) return { main: 0, deep: 0 };
        if (node.nodeType === Node.TEXT_NODE) {
          const words = countWordsInString(node.textContent || "");
          return { main: words, deep: words };
        }
        if (node.nodeType !== Node.ELEMENT_NODE) {
          return { main: 0, deep: 0 };
        }

        const el = node;
        if (shouldSkip(el)) {
          return { main: 0, deep: 0 };
        }

        if (
          el.classList.contains("katex") ||
          el.classList.contains("katex-display") ||
          el.classList.contains("latex-block")
        ) {
          const words = countMathWords(el);
          return { main: words, deep: words };
        }

        if (el.tagName === "TABLE") {
          const words = countTableWords(el);
          return { main: words, deep: words };
        }

        if (el.tagName === "DETAILS" && el.classList.contains("collapsible-block")) {
          const summary = el.querySelector(":scope > summary");
          const contentEl = el.querySelector(":scope > .collapsible-block__content");
          const summaryCounts = summary ? countNode(summary) : { main: 0, deep: 0 };
          const contentCounts = contentEl ? countNode(contentEl) : { main: 0, deep: 0 };
          const isOpen = el.hasAttribute("open");
          const main = summaryCounts.main + (isOpen ? contentCounts.deep : 0);
          const deep = summaryCounts.deep + contentCounts.deep;
          if (contentEl) {
            collapsibleCounts.set(el, contentCounts.deep);
          }
          return { main, deep };
        }

        let main = 0;
        let deep = 0;
        el.childNodes.forEach((child) => {
          const counts = countNode(child);
          main += counts.main;
          deep += counts.deep;
        });
        return { main, deep };
      };

      const formatMinutes = (words) => {
        const minutes = Math.max(1, Math.round(words / wordsPerMinute));
        return `${minutes} min`;
      };

      if (readTimeEl) {
        const counts = countNode(content);
        const mainEl = readTimeEl.querySelector(".post-readtime__main");
        const deepEl = readTimeEl.querySelector(".post-readtime__deep");
        if (mainEl) mainEl.textContent = `Main path: ${formatMinutes(counts.main)}`;
        if (deepEl) deepEl.textContent = `With deep dives: ${formatMinutes(counts.deep)}`;
      }

      if (collapsibleCounts.size > 0) {
        content.querySelectorAll(".collapsible-block__summary").forEach((summary) => {
          const details = summary.closest("details");
          if (!details) return;
          const label = summary.querySelector("[data-collapsible-readtime]");
          const words = collapsibleCounts.get(details);
          if (label && typeof words === "number") {
            label.textContent = formatMinutes(words);
          }
        });
      }

      const glossaryTerms = new Map();
      let glossaryAutoLink = false;
      const glossaryBlocks = content.querySelectorAll(".glossary-data");
      glossaryBlocks.forEach((block) => {
        if (block.dataset.auto === "true") glossaryAutoLink = true;
        block.querySelectorAll(".glossary-data__entry").forEach((entry) => {
          const term = (entry.dataset.term || "").trim();
          const definition = (entry.dataset.definition || "").trim();
          if (!term || !definition) return;
          const aliases = (entry.dataset.aliases || "")
            .split(",")
            .map((alias) => alias.trim())
            .filter(Boolean);
          const key = term.toLowerCase();
          glossaryTerms.set(key, { term, definition });
          aliases.forEach((alias) => {
            const aliasKey = alias.toLowerCase();
            if (!glossaryTerms.has(aliasKey)) {
              glossaryTerms.set(aliasKey, { term, definition });
            }
          });
        });
      });

      const bindGlossaryTerms = () => {
        if (glossaryTerms.size === 0) return;

        const tooltip = document.createElement("div");
        tooltip.className = "glossary-tooltip";
        tooltip.setAttribute("role", "tooltip");
        tooltip.innerHTML = `
          <div class="glossary-tooltip__term"></div>
          <div class="glossary-tooltip__def"></div>
        `;
        document.body.appendChild(tooltip);

        const termEl = tooltip.querySelector(".glossary-tooltip__term");
        const defEl = tooltip.querySelector(".glossary-tooltip__def");
        const katexOptions = {
          delimiters: [
            { left: "[latex]", right: "[/latex]", display: true },
            { left: "$$", right: "$$", display: true },
            { left: "\\[", right: "\\]", display: true },
            { left: "\\(", right: "\\)", display: false },
            { left: "$", right: "$", display: false },
          ],
          throwOnError: false,
        };

        let activeTarget = null;

        const positionTooltip = (target) => {
          const rect = target.getBoundingClientRect();
          const tooltipRect = tooltip.getBoundingClientRect();
          const spacing = 10;
          let top = rect.top - tooltipRect.height - spacing;
          if (top < 8) {
            top = rect.bottom + spacing;
          }
          let left = rect.left + rect.width / 2 - tooltipRect.width / 2;
          left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
          tooltip.style.top = `${top}px`;
          tooltip.style.left = `${left}px`;
        };

        const showTooltip = (target) => {
          const key = (target.dataset.termKey || "").toLowerCase();
          const data = glossaryTerms.get(key);
          if (!data) return;
          if (termEl) termEl.textContent = data.term;
          if (defEl) {
            defEl.textContent = data.definition;
            if (window.renderMathInElement) {
              window.renderMathInElement(defEl, katexOptions);
            }
          }
          tooltip.classList.add("is-visible");
          positionTooltip(target);
          activeTarget = target;
        };

        const hideTooltip = () => {
          tooltip.classList.remove("is-visible");
          activeTarget = null;
        };

        const isInteractive = (node) => node.closest("a, button, .glossary-term");

        const manualPattern = /\\[\\[([^\\]]+)\\]\\]/g;
        const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");

        const makeButton = (displayText, key) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "glossary-term";
          button.dataset.termKey = key;
          button.textContent = displayText;
          button.addEventListener("mouseenter", () => showTooltip(button));
          button.addEventListener("mouseleave", hideTooltip);
          button.addEventListener("focus", () => showTooltip(button));
          button.addEventListener("blur", hideTooltip);
          button.addEventListener("click", (event) => {
            event.stopPropagation();
            if (activeTarget === button) {
              hideTooltip();
            } else {
              showTooltip(button);
            }
          });
          return button;
        };

        const processTextNodes = (root, handler) => {
          const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
              if (!node.parentElement) return NodeFilter.FILTER_REJECT;
              if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT;
              const parent = node.parentElement;
              if (
                parent.closest(
                  "script, style, pre, code, a, button, .glossary-data, .glossary-tooltip, .post-toc, .post-sidebar"
                )
              ) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            },
          });
          const nodes = [];
          while (walker.nextNode()) {
            nodes.push(walker.currentNode);
          }
          nodes.forEach(handler);
        };

        processTextNodes(content, (node) => {
          const text = node.textContent;
          if (!text.includes("[[")) return;
          manualPattern.lastIndex = 0;
          const frag = document.createDocumentFragment();
          let lastIndex = 0;
          let match;
          while ((match = manualPattern.exec(text)) !== null) {
            const raw = match[1].trim();
            const parts = raw.split("|");
            const termRaw = (parts[0] || "").trim();
            const labelRaw = (parts[1] || "").trim();
            const termKey = termRaw.toLowerCase();
            const entry = glossaryTerms.get(termKey);
            const start = match.index;
            if (start > lastIndex) {
              frag.appendChild(document.createTextNode(text.slice(lastIndex, start)));
            }
            if (entry) {
              const label = labelRaw || entry.term;
              frag.appendChild(makeButton(label, termKey));
            } else {
              frag.appendChild(document.createTextNode(match[0]));
            }
            lastIndex = start + match[0].length;
          }
          if (lastIndex < text.length) {
            frag.appendChild(document.createTextNode(text.slice(lastIndex)));
          }
          node.parentNode.replaceChild(frag, node);
        });

        if (glossaryAutoLink) {
          const terms = Array.from(glossaryTerms.values())
            .map((entry) => entry.term)
            .sort((a, b) => b.length - a.length);
          if (terms.length > 0) {
            const pattern = new RegExp(`\\\\b(${terms.map(escapeRegExp).join("|")})\\\\b`, "gi");
            processTextNodes(content, (node) => {
              const text = node.textContent;
              pattern.lastIndex = 0;
              if (!pattern.test(text)) return;
              pattern.lastIndex = 0;
              const frag = document.createDocumentFragment();
              let lastIndex = 0;
              text.replace(pattern, (match, termMatch, offset) => {
                if (offset > lastIndex) {
                  frag.appendChild(document.createTextNode(text.slice(lastIndex, offset)));
                }
                const key = termMatch.toLowerCase();
                const entry = glossaryTerms.get(key);
                if (entry && !isInteractive(node.parentElement)) {
                  frag.appendChild(makeButton(match, key));
                } else {
                  frag.appendChild(document.createTextNode(match));
                }
                lastIndex = offset + match.length;
                return match;
              });
              if (lastIndex < text.length) {
                frag.appendChild(document.createTextNode(text.slice(lastIndex)));
              }
              node.parentNode.replaceChild(frag, node);
            });
          }
        }

        document.addEventListener(
          "scroll",
          () => {
            if (activeTarget) positionTooltip(activeTarget);
          },
          { passive: true }
        );

        document.addEventListener("click", (event) => {
          if (!activeTarget) return;
          if (event.target.closest(".glossary-tooltip") || event.target.closest(".glossary-term")) {
            return;
          }
          hideTooltip();
        });
      };

      bindGlossaryTerms();
    });
  });
})();
