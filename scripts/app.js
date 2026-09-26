/* =============================================================================
   Mercy's Birthday - progressive enhancement.
   No framework, no dependencies. Every feature degrades gracefully.
   ========================================================================== */
(function () {
  "use strict";

  /* The absolute location of this script, captured while it is still
     executing. Everything else here runs later (on load, on click) when
     document.currentScript is already null, so it has to be saved now. */
  var APP_SRC = (function () {
    var s = document.currentScript;
    return s && s.src ? s.src : "";
  })();

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------- toast */
  var toastEl = $("[data-toast]");
  var toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("is-on"); }, 2600);
  }
  window.mbToast = toast;

  /* --------------------------------------------- best navbar behaviour */
  (function navbar() {
    var top = $("[data-top]");
    if (!top) return;
    var progress = $("[data-scroll-progress]", top);
    var pill = $("[data-nav-pill]", top);
    var menuBtn = $("[data-menu-btn]", top);
    var menu = $("[data-menu]", top);
    var links = $$("[data-nav-link]", top);
    var lastY = window.scrollY || 0;
    var ticking = false;
    var MQ = window.matchMedia("(min-width: 860px)");
    var SIDEBAR_MQ = window.matchMedia("(min-width: 860px)");

    function movePill() {
      if (!pill || !links.length) return;
      var active = null;
      for (var i = 0; i < links.length; i++) {
        if (links[i].classList.contains("is-on")) { active = links[i]; break; }
      }
      /* pill only exists on laptop where .top__nav is visible */
      if (!active || !MQ.matches || SIDEBAR_MQ.matches) { pill.classList.remove("is-on"); return; }
      var box = active.getBoundingClientRect();
      pill.style.width = box.width + "px";
      /* pill lives inside the padded <ul>: offsetLeft is already exact */
      pill.style.transform = "translateX(" + active.offsetLeft + "px)";
      pill.classList.add("is-on");
    }

    function onScroll() {
      var y = window.scrollY || 0;
      top.classList.toggle("is-stuck", y > 8);
      /* hide on scroll down, show on scroll up */
      var open = top.classList.contains("is-open");
      var hide = !SIDEBAR_MQ.matches && !open && y > 220 && y > lastY + 4;
      var show = y < lastY - 4 || y <= 220;
      if (hide) top.classList.add("is-hide");
      else if (show) top.classList.remove("is-hide");
      lastY = y;
      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var p = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
        progress.style.transform = "scaleX(" + p.toFixed(4) + ")";
      }
      ticking = false;
    }

    function requestScroll() {
      if (ticking) return;
      ticking = true;
      if ("requestAnimationFrame" in window) requestAnimationFrame(onScroll);
      else onScroll();
    }

    function setMenu(open) {
      if (!menu || !menuBtn) return;
      top.classList.toggle("is-open", open);
      if (open) top.classList.remove("is-hide");
      if (open && !menu.open) menu.showModal();
      else if (!open && menu.open) menu.close();
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    if (menuBtn && menu) {
      menuBtn.addEventListener("click", function () {
        setMenu(!menu.open);
      });
      menu.addEventListener("cancel", function (e) {
        e.preventDefault();
        setMenu(false);
        menuBtn.focus();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && menu.open) {
          e.preventDefault();
          setMenu(false);
          menuBtn.focus();
        }
      });
      menu.addEventListener("click", function (e) {
        if (e.target === menu) setMenu(false);
        var close = e.target.closest && e.target.closest("[data-menu-close]");
        if (close) { setMenu(false); menuBtn.focus(); }
      });
    }

    onScroll();
    movePill();
    window.addEventListener("scroll", requestScroll, { passive: true });
    var onResize = function () {
      /* laptop owns inline links: never leave the phone drawer open */
      if (MQ.matches) setMenu(false);
      movePill();
    };
    if (MQ.addEventListener) MQ.addEventListener("change", onResize);
    else if (MQ.addListener) MQ.addListener(onResize);
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("load", movePill);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill).catch(function () {});
  })();

  /* ------------------------------------------------------------ lightbox */
  var lb = $("[data-lightbox]");
  if (lb) {
    var lbImg = $(".lb__img", lb);
    var lbCap = $(".lb__cap", lb);
    var lbTitle = $(".lb__title", lb);
    var lbDesc = $(".lb__desc", lb);
    var lbCount = $(".lb__count", lb);
    var lbX = $(".lb__x", lb);
    var set = [];
    var idx = 0;
    var lastFocus = null;

    /* collect the visible grid so prev/next follows what the visitor sees */
    function collect() {
      set = $$("[data-zoom]").filter(function (b) {
        return b.offsetParent !== null;
      });
    }

    function render() {
      var btn = set[idx];
      if (!btn) return;
      var img = $(".ph__img", btn);
      lbImg.src = img.getAttribute("src");
      lbImg.srcset = img.getAttribute("srcset") || "";
      lbImg.alt = img.getAttribute("alt") || "";
      /* title = the photo's short caption, description = its full alt text.
         The description line hides itself when it would repeat the title. */
      var title = btn.getAttribute("data-caption") || img.getAttribute("alt") || "";
      var desc = img.getAttribute("alt") || "";
      if (desc === title) desc = "";
      lbCap.hidden = !(title || desc);
      if (lbTitle) lbTitle.textContent = title;
      if (lbDesc) lbDesc.textContent = desc;
      if (lbCount) lbCount.textContent = set.length > 1 ? (idx + 1) + " / " + set.length : "";
      if (!lbTitle) lbCap.textContent = title; /* markup without title/desc spans */
    }

    function open(i) {
      collect();
      if (!set.length) return;
      idx = (i + set.length) % set.length;
      render();
      lastFocus = document.activeElement;
      lb.hidden = false;
      document.body.classList.add("lb-open");
      if (lbX) lbX.focus();
    }

    function close() {
      lb.hidden = true;
      document.body.classList.remove("lb-open");
      lbImg.removeAttribute("src");
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.addEventListener("click", function (e) {
      var z = e.target.closest && e.target.closest("[data-zoom]");
      if (z) {
        collect();
        var i = set.indexOf(z);
        if (i > -1) { e.preventDefault(); open(i); }
        return;
      }
      if (e.target.closest && e.target.closest("[data-lb-prev]")) {
        e.preventDefault();
        if (set.length) { idx = (idx - 1 + set.length) % set.length; render(); }
        return;
      }
      if (e.target.closest && e.target.closest("[data-lb-next]")) {
        e.preventDefault();
        if (set.length) { idx = (idx + 1) % set.length; render(); }
        return;
      }
      if (e.target.closest && e.target.closest("[data-lb-close]")) { e.preventDefault(); close(); }
    });

    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") { idx = (idx + 1) % set.length; render(); }
      if (e.key === "ArrowLeft") { idx = (idx - 1 + set.length) % set.length; render(); }
      /* keep focus inside the dialog */
      if (e.key === "Tab") {
        var f = $$("button", lb).filter(function (b) { return b.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    /* swipe between photos on touch devices */
    var sx = 0, sy = 0;
    lb.addEventListener("touchstart", function (e) {
      sx = e.changedTouches[0].clientX; sy = e.changedTouches[0].clientY;
    }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      var dx = e.changedTouches[0].clientX - sx;
      var dy = e.changedTouches[0].clientY - sy;
      if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) {
        idx = (idx + (dx < 0 ? 1 : -1) + set.length) % set.length;
        render();
      }
    }, { passive: true });
  }


  /* ------------------------------------------------ poster-first video */
  /* The <video> element is only created after a deliberate press, so no
     mp4 bytes are ever fetched during page load. */
  document.addEventListener("click", function (e) {
    var play = e.target.closest && e.target.closest("[data-play]");
    if (!play) return;
    e.preventDefault();
    var card = play.closest("[data-video]");
    if (!card) return;

    var v = document.createElement("video");
    v.src = card.getAttribute("data-src");
    v.setAttribute("controls", "");
    v.setAttribute("playsinline", "");
    v.setAttribute("preload", "metadata");
    v.setAttribute("aria-label", card.getAttribute("data-title") || "Video");
    var poster = card.getAttribute("data-poster");
    if (poster) v.setAttribute("poster", poster);
    v.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#000;z-index:3";
    v.addEventListener("play", function () { card.classList.add("is-playing"); });
    v.addEventListener("ended", function () { card.classList.remove("is-playing"); });
    card.querySelector(".vcard__frame").appendChild(v);
    var pr = v.play();
    if (pr && pr.catch) pr.catch(function () { toast("Tap play again to start the video."); });
  });

  /* ------------------------------------------------------ memory filters */
  var chips = $$("[data-filter]");
  if (chips.length) {
    var items = $$("[data-group]");
    var countEl = $("[data-count]");
    var emptyEl = $("[data-empty]");

    function apply(id) {
      var shown = 0;
      items.forEach(function (it) {
        var ok = id === "all" || it.getAttribute("data-group") === id;
        it.classList.toggle("is-hidden", !ok);
        if (ok) shown++;
      });
      chips.forEach(function (c) {
        var on = c.getAttribute("data-filter") === id;
        c.classList.toggle("is-on", on);
        c.setAttribute("aria-pressed", on ? "true" : "false");
      });
      if (countEl) countEl.innerHTML = "Showing <b>" + shown + "</b> of " + items.length + " photographs";
      if (emptyEl) emptyEl.classList.toggle("is-on", shown === 0);
      if (lb && !lb.hidden) { lb.hidden = true; document.body.classList.remove("lb-open"); }
      try {
        var u = new URL(window.location.href);
        if (id === "all") u.searchParams.delete("f"); else u.searchParams.set("f", id);
        history.replaceState(null, "", u);
      } catch (err) { /* file:// - ignore */ }
    }

    chips.forEach(function (c) {
      c.addEventListener("click", function () { apply(c.getAttribute("data-filter")); });
    });

    var initial = "all";
    try {
      var f = new URL(window.location.href).searchParams.get("f");
      if (f && chips.some(function (c) { return c.getAttribute("data-filter") === f; })) initial = f;
    } catch (err) { /* noop */ }
    apply(initial);
  }

  /* ------------------------------------------------------ scroll reveal */
  var reveals = $$(".rv");
  if (reveals.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      reveals.forEach(function (el) { el.classList.add("is-in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }


  /* ------------------------------------------------------------- sharing */
  function shareText() {
    var m = document.querySelector('meta[name="description"]');
    return m ? m.getAttribute("content") : "A birthday experience made just for you.";
  }

  function fallbackShare() {
    var url = window.location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(
        function () { toast("Link copied. Send it to Mercy!"); },
        function () { toast("Copy this link: " + url); }
      );
    } else {
      toast("Copy this link: " + url);
    }
  }

  document.addEventListener("click", function (e) {
    var btn = e.target.closest && e.target.closest("[data-share]");
    if (!btn) return;
    var payload = { title: document.title, text: shareText(), url: window.location.href };
    if (navigator.share) {
      navigator.share(payload).catch(function () { /* visitor dismissed */ });
    } else {
      fallbackShare();
    }
  });

  /* -------------------------------------------------- "Happy Birthday" tune
     Rendered live with the Web Audio API, so the site ships no audio file
     and playback still begins only from a genuine user gesture. */
  (function birthdaySong() {
    var btn = $("[data-song]");
    if (!btn) return;

    var ctx = null;
    var playing = false;
    var nodes = [];
    var timers = [];

    var N = {
      C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0,
      A4: 440.0, B4: 493.88, C5: 523.25, G3: 196.0, C3: 130.81, G2: 98.0
    };

    /* "Happy Birthday to You" in G major. [frequency, beats] */
    var SONG = [
      [N.G4, 0.5], [N.G4, 0.25], [N.G4, 0.25], [N.G4, 0.25], [N.A4, 0.5], [N.A4, 0.5],
      [N.G4, 0.25], [N.G4, 0.25], [N.C5, 1.0],
      [N.F4, 0.5], [N.F4, 0.25], [N.F4, 0.25], [N.E4, 0.25], [N.E4, 0.25], [N.D4, 0.5], [N.D4, 0.5],
      [N.C4, 0.5], [N.C4, 0.5], [N.G4, 0.5], [N.G4, 0.5], [N.E4, 0.5], [N.E4, 0.5],
      [N.D4, 0.5], [N.D4, 0.5], [N.C4, 1.0]
    ];

    function note(freq, start, dur, gainVal, type) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = type || "triangle";
      osc.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(gainVal, start + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur * 0.95);
      osc.connect(g).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + dur);
      nodes.push(osc);
    }

    function stopAll() {
      nodes.forEach(function (n) { try { n.stop(); } catch (e) {} });
      nodes = [];
      timers.forEach(clearTimeout);
      timers = [];
      playing = false;
      btn.setAttribute("aria-pressed", "false");
      var lbl = btn.querySelector("[data-song-label]");
      if (lbl) lbl.textContent = "Play the birthday song";
    }

    function play() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { toast("Audio is not supported on this device."); return; }
      if (!ctx) ctx = new AC();
      if (ctx.state === "suspended") ctx.resume();

      playing = true;
      btn.setAttribute("aria-pressed", "true");
      var lbl = btn.querySelector("[data-song-label]");
      if (lbl) lbl.textContent = "Stop the birthday song";

      var beat = 0.28;
      var t = ctx.currentTime + 0.08;
      for (var i = 0; i < SONG.length; i++) {
        note(SONG[i][0], t, SONG[i][1] * beat, 0.16, "triangle");
        t += SONG[i][1] * beat;
      }
      var total = t - ctx.currentTime;

      /* gentle accompaniment so it sounds like a gift, not a test tone */
      var bt = ctx.currentTime + 0.08;
      for (var b = 0; b < 10; b++) {
        note(N.G2, bt, beat * 1.7, 0.05, "sine");
        note(N.C3, bt + beat, beat * 1.7, 0.04, "sine");
        bt += beat * 2;
      }
      var at = ctx.currentTime + 0.08;
      for (var k = 0; k * beat < total; k += 2) {
        note([N.C4, N.E4, N.G4, N.E4][(k / 2) % 4], at + k * beat, beat * 1.4, 0.028, "sine");
      }

      timers.push(setTimeout(stopAll, total * 1000 + 250));
    }

    btn.addEventListener("click", function () {
      if (playing) { stopAll(); } else { play(); }
    });
  })();

  /* ----------------------------------------------------------- confetti */
  (function confetti() {
    var btn = $("[data-confetti]");
    if (!btn) return;
    var COLORS = ["#E83E8C", "#F75FA5", "#FFC2DD", "#E7B168", "#6FA8FF", "#FFFFFF"];
    btn.addEventListener("click", function () {
      if (reduceMotion) { toast("Happy birthday, Mercy!"); return; }
      var host = document.createElement("div");
      host.className = "confetti";
      host.setAttribute("aria-hidden", "true");
      for (var i = 0; i < 70; i++) {
        var p = document.createElement("i");
        p.style.left = Math.random() * 100 + "vw";
        p.style.background = COLORS[i % COLORS.length];
        p.style.animationDuration = 2.4 + Math.random() * 2.2 + "s";
        p.style.animationDelay = Math.random() * 0.7 + "s";
        p.style.setProperty("--dx", Math.random() * 24 - 12 + "vw");
        p.style.setProperty("--rot", 360 + Math.random() * 720 + "deg");
        p.style.width = 6 + Math.random() * 7 + "px";
        p.style.height = 10 + Math.random() * 10 + "px";
        p.style.borderRadius = Math.random() > 0.6 ? "50%" : "2px";
        host.appendChild(p);
      }
      document.body.appendChild(host);
      setTimeout(function () { host.remove(); }, 6000);
      toast("Happy birthday, Mercy!");
    });
  })();

  /* ------------------------------------------------------- candle blow-out */
  (function candles() {
    var cake = $("[data-cake]");
    if (!cake) return;
    cake.addEventListener("click", function () {
      if (cake.classList.contains("is-out")) {
        cake.classList.remove("is-out");
        toast("Another wish? Tap the cake.");
      } else {
        cake.classList.add("is-out");
        toast("Wish made. Happy birthday, Mercy!");
      }
    });
  })();

  /* -------------------------------------------------- service worker */
  /* app.js lives in /scripts/, so the worker is resolved relative to *this
     script* rather than the page. A page-relative "sw.js" would look for
     /story/faith/sw.js on nested routes and silently register nothing. */
  if ("serviceWorker" in navigator && location.protocol !== "file:" && APP_SRC) {
    window.addEventListener("load", function () {
      try {
        var root = new URL("../", APP_SRC);        /* site root */
        navigator.serviceWorker.register(
          new URL("sw.js", root).pathname,         /* /sw.js */
          { scope: root.pathname }                 /* scope: /  */
        ).catch(function () {
          /* offline support is a bonus, never a requirement */
        });
      } catch (e) {
        /* no-op */
      }
    });
  }
})();
