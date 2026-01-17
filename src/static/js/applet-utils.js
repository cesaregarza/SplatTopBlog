(function () {
  function isEmbedded() {
    try {
      return window.self !== window.top;
    } catch (err) {
      return true;
    }
  }

  function initEmbed() {
    if (isEmbedded()) {
      document.documentElement.classList.add("is-embedded");
    }
  }

  function setRangeFill(inputEl) {
    if (!inputEl) return;
    const min = parseFloat(inputEl.min);
    const max = parseFloat(inputEl.max);
    const val = parseFloat(inputEl.value);
    if (Number.isNaN(min) || Number.isNaN(max) || max === min) {
      inputEl.style.setProperty("--range-fill", "50%");
      return;
    }
    const pct = ((val - min) / (max - min)) * 100;
    inputEl.style.setProperty("--range-fill", `${pct.toFixed(1)}%`);
  }

  window.AppletUtils = {
    initEmbed,
    setRangeFill,
  };
})();
