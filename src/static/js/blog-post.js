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

    const setupAppletFrames = () => {
      const frames = Array.from(content.querySelectorAll("iframe.applet-frame"));
      if (frames.length === 0) return;

      const ensureEmbeddedStyling = (doc) => {
        if (!doc || !doc.documentElement) return;
        doc.documentElement.classList.add("is-embedded");

        const styleId = "__applet_embed_scrollbar_theme";
        if (doc.getElementById(styleId)) return;
        const style = doc.createElement("style");
        style.id = styleId;
        style.textContent = `
          :root.is-embedded,
          :root.is-embedded body {
            height: auto;
            min-height: 0;
            overflow: auto;
            scrollbar-width: thin;
            scrollbar-gutter: stable;
            -ms-overflow-style: none;
            scrollbar-color: transparent transparent;
          }

          :root.is-embedded::-webkit-scrollbar,
          :root.is-embedded body::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }

          :root.is-embedded::-webkit-scrollbar-track,
          :root.is-embedded body::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 9999px;
          }

          :root.is-embedded::-webkit-scrollbar-thumb,
          :root.is-embedded body::-webkit-scrollbar-thumb {
            background: transparent;
            border: 1px solid transparent;
            border-radius: 9999px;
          }

          :root.is-embedded body * {
            scrollbar-width: thin;
            scrollbar-gutter: stable;
            scrollbar-color: transparent transparent;
          }

          :root.is-embedded:hover,
          :root.is-embedded:focus-within,
          :root.is-embedded body:hover,
          :root.is-embedded body:focus-within {
            scrollbar-color: rgba(217, 70, 239, 0.92) rgba(15, 23, 42, 0.36);
          }

          :root.is-embedded:hover::-webkit-scrollbar-track,
          :root.is-embedded:focus-within::-webkit-scrollbar-track,
          :root.is-embedded body:hover::-webkit-scrollbar-track,
          :root.is-embedded body:focus-within::-webkit-scrollbar-track {
            background: rgba(15, 23, 42, 0.32);
          }

          :root.is-embedded:hover::-webkit-scrollbar-thumb,
          :root.is-embedded:focus-within::-webkit-scrollbar-thumb,
          :root.is-embedded body:hover::-webkit-scrollbar-thumb,
          :root.is-embedded body:focus-within::-webkit-scrollbar-thumb {
            background: linear-gradient(
              180deg,
              rgba(217, 70, 239, 0.94),
              rgba(171, 90, 183, 0.88)
            );
            border: 1px solid rgba(15, 23, 42, 0.65);
          }

          :root.is-embedded body *::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }

          :root.is-embedded body *::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 9999px;
          }

          :root.is-embedded body *::-webkit-scrollbar-thumb {
            background: transparent;
            border: 1px solid transparent;
            border-radius: 9999px;
          }

          :root.is-embedded body *:hover,
          :root.is-embedded body *:focus,
          :root.is-embedded body *:focus-within {
            scrollbar-color: rgba(217, 70, 239, 0.92) rgba(15, 23, 42, 0.36);
          }

          :root.is-embedded body *:hover::-webkit-scrollbar-track,
          :root.is-embedded body *:focus::-webkit-scrollbar-track,
          :root.is-embedded body *:focus-within::-webkit-scrollbar-track {
            background: rgba(15, 23, 42, 0.32);
          }

          :root.is-embedded body *:hover::-webkit-scrollbar-thumb,
          :root.is-embedded body *:focus::-webkit-scrollbar-thumb,
          :root.is-embedded body *:focus-within::-webkit-scrollbar-thumb {
            background: linear-gradient(
              180deg,
              rgba(217, 70, 239, 0.94),
              rgba(171, 90, 183, 0.88)
            );
            border: 1px solid rgba(15, 23, 42, 0.65);
            border-radius: 9999px;
          }
        `;
        doc.head?.appendChild(style);
      };

      const resizeFrame = (frame) => {
        let previousInlineHeight = null;
        try {
          const doc = frame.contentDocument;
          if (!doc) return;
          ensureEmbeddedStyling(doc);
          const html = doc.documentElement;
          const body = doc.body;
          if (!html || !body) return;
          previousInlineHeight = frame.style.height;
          // Neutralize existing inline height so we measure content size, not viewport floor.
          frame.style.height = "0px";
          const measuredHeight = Math.max(
            html.scrollHeight,
            html.offsetHeight,
            body.scrollHeight,
            body.offsetHeight,
            Math.ceil(body.getBoundingClientRect().height)
          );
          if (!Number.isFinite(measuredHeight) || measuredHeight < 120) {
            frame.style.height = previousInlineHeight;
            return;
          }
          const useFullHeight = frame.getAttribute("data-applet-full-height") === "true";
          const rawMaxHeight = frame.getAttribute("data-applet-max-height");
          const parsedMaxHeight = rawMaxHeight ? Number.parseInt(rawMaxHeight, 10) : NaN;
          const hasMaxHeight = !useFullHeight && Number.isFinite(parsedMaxHeight) && parsedMaxHeight >= 120;
          const targetHeight = hasMaxHeight
            ? Math.min(Math.ceil(measuredHeight), parsedMaxHeight)
            : Math.ceil(measuredHeight);
          frame.style.maxHeight = hasMaxHeight ? `${parsedMaxHeight}px` : "";
          frame.style.height = `${targetHeight}px`;
        } catch (err) {
          // Cross-origin frame; keep CSS fallback height.
          if (previousInlineHeight !== null) {
            frame.style.height = previousInlineHeight;
          }
          if (frame.getAttribute("data-applet-full-height") === "true") {
            frame.style.maxHeight = "";
            frame.style.height = "";
          }
        }
      };

      frames.forEach((frame) => {
        const onLoad = () => {
          resizeFrame(frame);
          setTimeout(() => resizeFrame(frame), 60);
          setTimeout(() => resizeFrame(frame), 260);
          try {
            const win = frame.contentWindow;
            if (win) {
              win.addEventListener("resize", () => resizeFrame(frame));
            }
            const doc = frame.contentDocument;
            if (doc && doc.body && "ResizeObserver" in window) {
              const observer = new ResizeObserver(() => resizeFrame(frame));
              observer.observe(doc.body);
            }
          } catch (err) {
            // Ignore sizing hooks when frame internals are inaccessible.
          }
        };
        frame.addEventListener("load", onLoad);
        if (frame.contentDocument?.readyState === "complete") {
          onLoad();
        }
      });
    };

    setupAppletFrames();

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

    content.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((heading) => addAnchor(heading, "h"));

    const headings = Array.from(content.querySelectorAll("h1, h2, h3"));

    if (headings.length === 0) {
      const sidebar = toc ? toc.closest(".post-sidebar") : null;
      if (sidebar) sidebar.style.display = "none";
      if (drawerToggle) drawerToggle.style.display = "none";
    } else if (tocList && crumbEl && toc) {
      const headingMeta = [];
      let currentH1 = "";
      let currentH1Id = "";
      let currentH2 = "";
      let currentH2Id = "";
      let firstH1Id = "";

      headings.forEach((heading) => {
        const text = heading.textContent.trim();
        if (!heading.id) {
          const base = slugify(text, "h");
          heading.id = `h-${base}`;
        }
        const level = heading.tagName.toLowerCase();
        if (level === "h1") {
          currentH1 = text;
          currentH1Id = heading.id;
          currentH2 = "";
          currentH2Id = "";
          if (!firstH1Id) firstH1Id = heading.id;
        }
        if (level === "h2") {
          currentH2 = text;
          currentH2Id = heading.id;
        }
        headingMeta.push({
          id: heading.id,
          text,
          level,
          parent: level === "h2" ? currentH1 : level === "h3" ? currentH2 : "",
          parentId: level === "h2" ? currentH1Id : level === "h3" ? currentH2Id : "",
          grandparentId: level === "h3" ? currentH1Id : "",
        });
      });

      let itemRefs = [];

      const hasH1 = headingMeta.some((entry) => entry.level === "h1");
      const hasStaticToc = tocList.children.length > 0;

      if (!hasStaticToc) {
        headingMeta.forEach((meta) => {
          const li = document.createElement("li");
          li.className = "post-toc__item";
          li.classList.add(`post-toc__item--${meta.level}`);
          li.dataset.level = meta.level;
          itemRefs.push(li);

          const link = document.createElement("a");
          link.className = "post-toc__link";
          link.href = `#${meta.id}`;
          link.textContent = meta.text || meta.id;
          link.dataset.tocId = meta.id;
          if (meta.parentId) {
            link.dataset.parentId = meta.parentId;
          }
          if (meta.grandparentId) {
            link.dataset.grandparentId = meta.grandparentId;
          }
          li.appendChild(link);
          tocList.appendChild(li);
        });
        itemRefs = Array.from(tocList.querySelectorAll(".post-toc__item"));
      } else {
        itemRefs = Array.from(tocList.querySelectorAll(".post-toc__item"));
        itemRefs.forEach((item) => {
          if (item.dataset.level) return;
          if (item.classList.contains("post-toc__item--h1")) item.dataset.level = "h1";
          else if (item.classList.contains("post-toc__item--h2")) item.dataset.level = "h2";
          else if (item.classList.contains("post-toc__item--h3")) item.dataset.level = "h3";
        });
        tocList.querySelectorAll(".post-toc__link").forEach((link) => {
          if (!link.dataset.tocId) {
            const href = link.getAttribute("href") || "";
            if (href.startsWith("#")) link.dataset.tocId = href.slice(1);
          }
        });
      }

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
        let activeH1Id = firstH1Id;
        let activeH2Id = "";
        links.forEach((link) => {
          const isActive = link.dataset.tocId === id;
          link.classList.toggle("is-active", isActive);
          const item = link.closest(".post-toc__item");
          if (item) item.classList.toggle("is-active", isActive);
        });
        const meta = headingMeta.find((entry) => entry.id === id);
        if (!meta) return;
        if (meta.level === "h1") {
          crumbEl.textContent = meta.text;
          activeH1Id = meta.id;
          activeH2Id = "";
        } else if (meta.level === "h2") {
          crumbEl.textContent = meta.parent ? `${meta.parent} → ${meta.text}` : meta.text;
          activeH1Id = meta.parentId;
          activeH2Id = meta.id;
        } else {
          crumbEl.textContent = meta.parent ? `${meta.parent} → ${meta.text}` : meta.text;
          activeH1Id = meta.grandparentId || meta.parentId || firstH1Id;
          activeH2Id = meta.parentId;
        }

        itemRefs.forEach((item) => {
          const level = item.dataset.level;
          if (level === "h1") {
            item.classList.remove("is-hidden");
            return;
          }
          if (level === "h2") {
            const parentId = item.querySelector(".post-toc__link")?.dataset.parentId;
            if (hasH1) {
              item.classList.toggle("is-hidden", parentId !== activeH1Id);
            } else {
              item.classList.remove("is-hidden");
            }
            return;
          }
          if (level === "h3") {
            const parentId = item.querySelector(".post-toc__link")?.dataset.parentId;
            item.classList.toggle("is-hidden", parentId !== activeH2Id);
          }
        });
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

      const isHeadingVisible = (heading) => {
        if (!heading) return false;
        if (heading.closest("details:not([open])")) return false;
        if (heading.offsetParent === null) return false;
        if (heading.getClientRects().length === 0) return false;
        return true;
      };

      const onScroll = () => {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(() => {
          const fromTop = window.scrollY + 140;
          let current = null;
          for (const heading of headings) {
            if (!isHeadingVisible(heading)) continue;
            if (heading.offsetTop <= fromTop) {
              current = heading;
            } else if (current) {
              break;
            }
          }
          if (!current) {
            current = headings.find(isHeadingVisible) || headings[0];
          }
          if (current) updateActive(current.id);
          updateProgress();
          ticking = false;
        });
      };

      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("load", onScroll);
      const resizeObserver = "ResizeObserver" in window ? new ResizeObserver(onScroll) : null;
      if (resizeObserver) resizeObserver.observe(content);
      content.querySelectorAll("details.collapsible-block").forEach((details) => {
        details.addEventListener("toggle", onScroll);
      });
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

        const manualPattern = /\[\[([^\]]+)\]\]/g;
        const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&");

        const wireGlossaryButton = (button) => {
          if (!button || button.dataset.glossaryWired === "true") return;
          button.dataset.glossaryWired = "true";
          if (button.hasAttribute("title")) {
            button.dataset.nativeTitle = button.getAttribute("title") || "";
            button.removeAttribute("title");
          }
          let lastPointerType = null;
          button.addEventListener("mouseenter", () => showTooltip(button));
          button.addEventListener("mouseleave", hideTooltip);
          button.addEventListener("focus", () => showTooltip(button));
          button.addEventListener("blur", hideTooltip);
          button.addEventListener("pointerdown", (event) => {
            lastPointerType = event.pointerType || "mouse";
          });
          button.addEventListener(
            "touchstart",
            () => {
              lastPointerType = "touch";
            },
            { passive: true }
          );
          button.addEventListener("click", (event) => {
            event.stopPropagation();
            const pointerType = lastPointerType;
            lastPointerType = null;
            if (pointerType === "touch") {
              showTooltip(button);
              return;
            }
            if (activeTarget === button) {
              hideTooltip();
            } else {
              showTooltip(button);
            }
          });
        };

        const makeButton = (displayText, key) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "glossary-term";
          button.dataset.termKey = key;
          button.textContent = displayText;
          wireGlossaryButton(button);
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

        content.querySelectorAll(".glossary-term").forEach((button) => {
          if (!button.dataset.termKey) {
            const key = (button.textContent || "").trim().toLowerCase();
            if (glossaryTerms.has(key)) {
              button.dataset.termKey = key;
            }
          }
          if (button.dataset.termKey) {
            wireGlossaryButton(button);
          }
        });

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
