/* Open Edge — light progressive enhancement. No dependencies.
   Everything degrades gracefully without JS. */
(function () {
  "use strict";
  var root = document.documentElement;

  // ---- Footer year ----
  var yearEl = document.getElementById("year");
  if (yearEl) { yearEl.textContent = String(new Date().getFullYear()); }

  // ---- Theme toggle (light / dark) ----
  var toggle = document.getElementById("themeToggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) { meta.setAttribute("content", next === "dark" ? "#0e0d0c" : "#ffffff"); }
      try { localStorage.setItem("oe-theme", next); } catch (e) {}
    });
  }

  // ---- Sticky nav hairline on scroll ----
  var nav = document.getElementById("nav");

  // ================= Scroll-driven metering gauge =================
  // The gauge starts large in the hero and docks to the top-right corner as you
  // scroll out of the first screen; its metered value climbs with page progress.
  var gauge = document.getElementById("gauge");
  var gNum = document.getElementById("gaugeNum");
  var gNeedle = document.getElementById("gaugeNeedle");
  var gArc = document.getElementById("gaugeArc");
  var gChrome = document.getElementById("gaugeChrome"); // odometer box + caption
  var heroSub = document.querySelector(".hero__sub"); // gauge centres vertically on this line

  var METER_MAX = 486203;      // "units metered" at the bottom of the page
  var ODO_START = 27056;       // odometer reading at the top of the page
  var BASE_FILL = 0.68;        // resting needle/arc fill at the top (needle ~2 o'clock)
  var NEEDLE_R = 150;          // needle length (matches the gauge arc radius)
  var A0 = 135;                // start angle (lower-left), degrees
  var SWEEP = 270;             // total needle sweep, degrees
  var arcLen = 0;

  if (gArc && gArc.getTotalLength) {
    try { arcLen = gArc.getTotalLength(); } catch (e) { arcLen = 706; }
    gArc.style.strokeDasharray = arcLen;
    gArc.style.strokeDashoffset = arcLen; // start empty
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function smooth(t) { return t * t * (3 - 2 * t); } // smoothstep
  // absolute document Y of an element's vertical centre (transform/scroll-independent)
  function absCenterY(el) { var y = 0; for (var n = el; n; n = n.offsetParent) { y += n.offsetTop; } return y + el.offsetHeight / 2; }

  // num  = readout font-size (px); numTop = readout centre as a fraction of the
  // dial height (≈0.64 sits inside the odometer box; ≥1 sits just below the dial)
  var HERO, CORNER, DOCK, isMobile;
  function computeStates() {
    var vw = window.innerWidth, vh = window.innerHeight;
    isMobile = vw < 760;
    if (isMobile) {
      // small screens: no hero theater — the gauge lives in the header band
      // (nav is 60px tall) from the start, in the far right corner with the
      // theme toggle to its left; only its metered value animates with scroll
      HERO = { top: 5, right: 14, w: 40, num: 10, numTop: 1.15 };
      CORNER = HERO;
      DOCK = vh * 0.5;
    } else {
      // gauge dial centred (a touch below middle) to sit at the image's eye-level
      var gw = Math.min(vw * 0.34, 430);
      // anchor the gauge to the content column's right edge (max-width 1280),
      // not the viewport edge — otherwise it drifts far right on wide screens
      var rightInset = Math.max(48, (vw - 1280) / 2 + 40);
      // centre the dial on the hero subtitle line (fallback: viewport centre)
      var heroTop = heroSub ? absCenterY(heroSub) - gw / 2 : (vh - gw) / 2 + Math.min(16, vh * 0.02);
      HERO = { top: heroTop, right: rightInset, w: gw, num: 18, numTop: 0.64 };
      // docked into the header band (nav is 60px tall): small dial, readout below
      CORNER = { top: 4, right: 22, w: 40, num: 11, numTop: 1.15 };
      DOCK = vh * 0.72;
    }
  }

  function pad6(n) {
    n = String(n);
    while (n.length < 6) { n = "0" + n; }
    return n;
  }

  function render() {
    var y = window.pageYOffset || root.scrollTop || 0;

    if (nav) { nav.classList.toggle("is-stuck", y > 8); }
    if (!gauge) { return; }

    // dock progress (position/size): 0 in hero → 1 docked
    var p = smooth(clamp01(y / DOCK));
    var W = lerp(HERO.w, CORNER.w, p);           // current dial width (== height)
    gauge.style.top = lerp(HERO.top, CORNER.top, p) + "px";
    gauge.style.right = lerp(HERO.right, CORNER.right, p) + "px";
    gauge.style.width = W + "px";
    if (gNum) {
      gNum.style.fontSize = lerp(HERO.num, CORNER.num, p) + "px";
      gNum.style.top = (W * lerp(HERO.numTop, CORNER.numTop, p)) + "px";
    }
    // fade the odometer box + caption out as the dial shrinks into the corner
    if (gChrome) { gChrome.style.opacity = isMobile ? 0 : clamp01(1 - p * 1.7); }

    // meter fill: rests at BASE_FILL (looks "already metering") and climbs to 1
    // as the page is scrolled to the bottom
    var max = (root.scrollHeight - window.innerHeight) || 1;
    var qScroll = clamp01(y / max);
    var fill = BASE_FILL + (1 - BASE_FILL) * qScroll;
    if (gNum) { gNum.textContent = pad6(Math.round(ODO_START + (METER_MAX - ODO_START) * qScroll)); }
    if (gNeedle) {
      var rad = (A0 + fill * SWEEP) * Math.PI / 180;
      gNeedle.setAttribute("x2", (260 + NEEDLE_R * Math.cos(rad)).toFixed(1));
      gNeedle.setAttribute("y2", (260 + NEEDLE_R * Math.sin(rad)).toFixed(1));
    }
    if (gArc && arcLen) { gArc.style.strokeDashoffset = (arcLen * (1 - fill)).toFixed(1); }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) { return; }
    ticking = true;
    window.requestAnimationFrame(function () { render(); ticking = false; });
  }

  computeStates();
  render();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { computeStates(); render(); }, { passive: true });
  // recompute once fonts/layout settle (scrollHeight can shift)
  window.addEventListener("load", function () { computeStates(); render(); });

  // ================= Act item in-depth panes + permalinks =================
  // Each act lists its points on the left; clicking a point swaps the
  // long-form explanation shown in the sticky pane on the right. Every point
  // gets a stable id derived from its section (e.g. "clearing-02"), so each
  // in-depth text is directly linkable: opening the page at #clearing-02
  // reveals that pane and scrolls to it, and clicking a point reflects its id
  // in the address bar for copy/paste.
  var deepLinks = {};
  var prefersReduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Narrow screens: the sticky side pane has no place in a single column, so
  // the in-depth text opens inline, inside the tapped item (summary swaps to
  // article; tapping again swaps back). One item open at a time.
  var narrowMq = window.matchMedia ? window.matchMedia("(max-width: 900px)") : null;
  function isNarrow() { return !!(narrowMq && narrowMq.matches); }
  var inlineOpen = null; // the .item currently expanded on narrow screens

  function openInline(item, pane) {
    if (inlineOpen && inlineOpen !== item) { inlineOpen.classList.remove("is-open"); }
    var box = item.querySelector(".item__inline");
    if (!box && pane) {
      box = document.createElement("div");
      box.className = "item__inline";
      box.innerHTML = pane.innerHTML;
      var close = document.createElement("span");
      close.className = "item__close";
      close.textContent = "Close ↑";
      box.appendChild(close);
      item.querySelector(".item__body").appendChild(box);
    }
    item.classList.add("is-open");
    inlineOpen = item;
  }
  function closeInline(item) {
    item.classList.remove("is-open");
    if (inlineOpen === item) { inlineOpen = null; }
  }

  Array.prototype.forEach.call(document.querySelectorAll(".itemsplit"), function (split) {
    var items = Array.prototype.slice.call(split.querySelectorAll(".items > .item"));
    var panes = Array.prototype.slice.call(split.querySelectorAll(".detail__pane"));
    if (!items.length || items.length !== panes.length) { return; }
    var aside = split.querySelector(".detail");
    var section = split.closest("section");
    var prefix = section && section.id ? section.id : null;

    function activate(idx) {
      items.forEach(function (el, i) { el.classList.toggle("is-active", i === idx); });
      panes.forEach(function (el, i) { el.classList.toggle("is-active", i === idx); });
    }

    items.forEach(function (el, i) {
      var id = prefix ? prefix + "-0" + (i + 1) : null;
      if (id) { el.id = id; }
      el.addEventListener("click", function (ev) {
        if (ev.target && ev.target.closest && ev.target.closest("a")) { return; }
        if (isNarrow()) {
          if (el.classList.contains("is-open")) {
            closeInline(el);
            el.scrollIntoView({ behavior: prefersReduce ? "auto" : "smooth", block: "nearest" });
          } else {
            openInline(el, panes[i]);
            if (id && window.history && history.replaceState) {
              history.replaceState(null, "", "#" + id);
            }
          }
          return;
        }
        activate(i);
        if (id && window.history && history.replaceState) {
          history.replaceState(null, "", "#" + id);
        }
      });
      if (id) {
        deepLinks[id] = function (doScroll, smooth) {
          // Force-reveal in case scroll-reveal hasn't fired for this block yet.
          items.forEach(function (s) { s.classList.add("is-in"); });
          if (aside) { aside.classList.add("is-in"); }
          // Narrow screens: open the in-depth text inline in the item itself;
          // desktop: light up the sticky pane alongside.
          if (isNarrow()) { openInline(el, panes[i]); } else { activate(i); }
          if (doScroll) {
            el.scrollIntoView({ behavior: (smooth && !prefersReduce) ? "smooth" : "auto", block: "start" });
          }
        };
      }
    });
  });

  function applyDeepLink(doScroll, smooth) {
    var id = (window.location.hash || "").replace(/^#/, "");
    if (id && deepLinks[id]) { deepLinks[id](doScroll, smooth); return true; }
    return false;
  }

  // On first load, reveal the linked pane immediately, but defer the scroll to
  // the load event: images and the gauge below still shift layout, so scrolling
  // too early lands on a stale position. Later hash changes scroll smoothly.
  if (applyDeepLink(false, false)) {
    window.addEventListener("load", function () { applyDeepLink(true, false); });
  }
  window.addEventListener("hashchange", function () { applyDeepLink(true, true); });

  // ================= Scroll reveal =================
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(".reveal"));

  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) { return; }
      var el = entry.target;
      var delay = 0;
      var parent = el.parentElement;
      if (parent) {
        var sibs = Array.prototype.slice.call(parent.querySelectorAll(":scope > .reveal"));
        var idx = sibs.indexOf(el);
        if (idx > 0) { delay = Math.min(idx * 70, 280); }
      }
      el.style.transitionDelay = delay + "ms";
      el.classList.add("is-in");
      io.unobserve(el);
    });
  }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });

  revealEls.forEach(function (el) { io.observe(el); });
})();
