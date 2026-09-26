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
    var tabs = $("[data-tabs]");
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
    /* Reserve room for the fixed bar so no page's last line hides behind it. */
    if (tabs) document.body.classList.add("tabs-safe");
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
    /* already playing - don't stack a second element on top */
    if (card.classList.contains("is-playing")) return;

    var state = $("[data-vstate]", card);
    var setState = function (msg) {
      if (state) state.textContent = msg || "";
      card.classList.toggle("is-loading", !!msg);
    };

    var v = document.createElement("video");
    v.src = card.getAttribute("data-src");
    v.setAttribute("controls", "");
    v.setAttribute("playsinline", "");
    v.setAttribute("preload", "metadata");
    v.setAttribute("aria-label", card.getAttribute("data-title") || "Video");
    var poster = card.getAttribute("data-poster");
    if (poster) v.setAttribute("poster", poster);
    v.style.cssText = "position:absolute;inset:0;width:100%;height:100%;object-fit:cover;background:#000;z-index:3";
    v.addEventListener("loadstart", function () { setState("Loading video..."); });
    v.addEventListener("canplay", function () { setState(""); });
    v.addEventListener("waiting", function () { setState("Loading video..."); });
    v.addEventListener("playing", function () { setState(""); });
    v.addEventListener("play", function () { card.classList.add("is-playing"); });
    v.addEventListener("ended", function () { card.classList.remove("is-playing"); });
    /* A failed video must never leave a dead black rectangle behind. */
    v.addEventListener("error", function () {
      setState("");
      card.classList.add("is-error");
      if (v.parentNode) v.parentNode.removeChild(v);
      toast("This video could not load. Check your connection and try again.");
    });
    card.querySelector(".vcard__frame").appendChild(v);
    setState("Loading video...");
    var pr = v.play();
    if (pr && pr.catch) {
      pr.catch(function () {
        /* Autoplay refusal is fine - controls are present, so let them retry. */
        setState("");
        toast("Tap play to start the video.");
      });
    }
  });

  /* ------------------------------------------------- image + offline states
     A missing photograph must degrade to a labelled placeholder, never a
     broken-image icon or an empty grey box. */
  (function mediaStates() {
    $$("img").forEach(function (img) {
      var mark = function () {
        var host = img.closest(".ph, .vcard__frame, figure") || img.parentNode;
        if (host) host.classList.add("is-broken");
        img.setAttribute("data-failed", "1");
      };
      if (img.complete && img.naturalWidth === 0) mark();
      else img.addEventListener("error", mark, { once: true });
    });

    /* Connection state, shown quietly so it never looks like an error screen. */
    var net = $("[data-net]");
    if (!net) return;
    var syncNet = function () {
      var off = !navigator.onLine;
      net.hidden = !off;
      if (off) net.textContent = "You're offline. The app shell still works; photos and videos need a connection.";
    };
    window.addEventListener("online", syncNet);
    window.addEventListener("offline", syncNet);
    syncNet();
  })();

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

  /* ------------------------------------------------------------ opening gate
     A brief hook in front of the real page. It is intentionally NOT a loading
     screen: the page is already built, and the gate removes itself from the
     DOM so it can never trap scroll, focus, or the back button. */
  (function gate() {
    var el = $("[data-gate]");
    if (!el) return;
    var skip = $("[data-gate-skip]", el);
    var lines = $$("[data-gate-line]", el);
    var KEY = "mb-gate-seen";
    var seen = false;
    try { seen = window.sessionStorage.getItem(KEY) === "1"; } catch (e) { seen = false; }

    /* Reduced motion, a repeat visit, or a non-home page: never show it. */
    var home = document.body.classList.contains("p-home");
    if (reduceMotion || seen || !home) return;

    var timers = [];
    function clearTimers() { timers.forEach(clearTimeout); timers = []; }

    function close() {
      clearTimers();
      if (!el.parentNode) return;
      document.documentElement.classList.remove("is-gated");
      el.classList.add("is-out");
      try { window.sessionStorage.setItem(KEY, "1"); } catch (e) { /* private mode */ }
      var done = function () { if (el.parentNode) el.parentNode.removeChild(el); };
      if (reduceMotion) done();
      else setTimeout(done, 620);
    }

    /* Unlock scroll only while the gate is up, so the page behind never
       scrolls behind it by accident. */
    document.documentElement.classList.add("is-gated");
    el.hidden = false;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { el.classList.add("is-in"); });
    });

    /* Stagger the lines, then lift. Total ~2.6s - an invitation, not a wait. */
    lines.forEach(function (line, i) {
      timers.push(setTimeout(function () { line.classList.add("is-on"); }, 180 + i * 620));
    });
    timers.push(setTimeout(close, 2600));

    if (skip) {
      skip.addEventListener("click", close);
      /* Any deliberate interaction also moves things along. */
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" || e.key === "Enter" || e.key === " ") close();
      });
    }
    /* Safety net: if anything goes wrong, never leave the gate covering the app. */
    timers.push(setTimeout(function () {
      document.documentElement.classList.remove("is-gated");
    }, 3200));
  })();

  /* ----------------------------------------------------------- PWA install
     One card, four honest states, decided from what the browser really
     supports. There is never a button that quietly does nothing:
       - native prompt available -> button triggers the real install flow
       - iOS/iPadOS Safari        -> short "Share -> Add to Home Screen" steps
       - already installed        -> swapped for a confirmation state
       - nothing supported        -> a plain note explaining why, no button   */
  (function install() {
    /* Two surfaces: the home card and a compact button in the menu. Both are
       driven by the same state, so they can never disagree. */
    var cards = $$("[data-install], [data-install-drawer]");
    if (!cards.length) return;

    var isStandalone = function () {
      return (
        window.matchMedia("(display-mode: standalone)").matches ||
        window.matchMedia("(display-mode: fullscreen)").matches ||
        window.matchMedia("(display-mode: minimal-ui)").matches ||
        navigator.standalone === true
      );
    };
    var isIOS = function () {
      var ua = navigator.userAgent || "";
      var iOS = /iPad|iPhone|iPod/.test(ua);
      /* iPadOS 13+ reports as a Mac, so check for touch support too */
      var iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
      return iOS || iPadOS;
    };
    var isInApp = function () {
      var ua = navigator.userAgent || "";
      return /FBAN|FBAV|Instagram|Line\/|Twitter|LinkedInApp|Snapchat/.test(ua);
    };

    var deferred = null;      /* the BeforeInstallPromptEvent, held until tapped */
    var installed = false;    /* became true once the app is on the home screen  */

    function each(fn) { cards.forEach(fn); }

    function parts(card) {
      return {
        btn: $("[data-install-btn]", card),
        label: $("[data-install-label]", card),
        steps: $("[data-install-steps]", card),
        note: $("[data-install-note]", card),
        noteText: $("[data-install-note-text]", card),
        body: $("[data-install-body]", card),
      };
    }

    function showInstalled() {
      installed = true;
      each(function (card) {
        var p = parts(card);
        card.classList.add("is-installed");
        if (p.body) p.body.textContent = "Mercy's Birthday is installed. Open it from your home screen.";
        if (p.label) p.label.textContent = "Installed";
        if (p.btn) { p.btn.hidden = true; p.btn.disabled = true; }
        if (p.steps) p.steps.hidden = true;
        if (p.note) {
          p.note.hidden = false;
          if (p.noteText) p.noteText.textContent = "You can launch it like any other app.";
        }
      });
    }

    function showIOSSteps() {
      each(function (card) {
        var p = parts(card);
        card.classList.add("is-ios");
        if (p.body) p.body.textContent = "On iPhone and iPad, add it from the Share menu.";
        if (p.btn) p.btn.hidden = true;
        if (p.steps) p.steps.hidden = false;
        if (p.note) p.note.hidden = true;
      });
    }

    function showButton() {
      each(function (card) {
        var p = parts(card);
        card.classList.add("is-native");
        if (p.body) p.body.textContent = "Install Mercy's Birthday and it opens full screen, like an app.";
        if (p.btn) p.btn.hidden = false;
        if (p.steps) p.steps.hidden = true;
        if (p.note) p.note.hidden = true;
      });
    }

    function showUnsupported() {
      /* No native prompt, not iOS, not installed: say so plainly. The menu
         button and the home card get different wording, because the card can
         afford an explanation and the menu cannot. */
      each(function (card) {
        var p = parts(card);
        var compact = card.hasAttribute("data-install-drawer");
        card.classList.add("is-unsupported");
        if (p.body) p.body.textContent = "This browser can't install apps, but the whole experience still works here.";
        if (p.btn) p.btn.hidden = true;
        if (p.steps) p.steps.hidden = true;
        if (p.note) {
          p.note.hidden = false;
          if (p.noteText) {
            p.noteText.textContent = isInApp()
              ? "Open in your normal browser to install."
              : (compact
                  ? "Use your browser menu to add it."
                  : "Use your browser menu and choose “Add to Home screen”.");
          }
        }
      });
    }

    function render() {
      if (installed || isStandalone()) return showInstalled();
      if (deferred) return showButton();
      if (isIOS()) return showIOSSteps();
      if (isInApp()) return showUnsupported();
      /* Optimistic: the page is fully loaded, so the prompt is either already
         here or will never come. Show nothing rather than a dead button. */
      showButton();
      each(function (card) { var b = $("[data-install-btn]", card); if (b) b.hidden = true; });
    }

    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferred = e;
      render();
    });

    window.addEventListener("appinstalled", function () {
      deferred = null;
      showInstalled();
      toast("Mercy's Birthday is installed.");
    });

    $$("[data-install-btn]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!deferred) {
          /* The prompt was dismissed or already used - don't fake success. */
          toast("Open your browser menu to install.");
          return;
        }
        var ev = deferred;
        deferred = null;
        btn.disabled = true;
        ev.prompt();
        ev.userChoice.then(function (choice) {
          btn.disabled = false;
          if (choice && choice.outcome === "accepted") {
            toast("Installing Mercy's Birthday...");
          } else {
            /* declined: fall back to honest instructions, never nagging */
            if (isIOS()) showIOSSteps(); else showUnsupported();
          }
        }).catch(function () {
          btn.disabled = false;
          if (isIOS()) showIOSSteps(); else showUnsupported();
        });
      });
    });

    render();
    /* If no prompt arrives shortly, settle on the honest fallback wording. */
    setTimeout(function () {
      if (!installed && !deferred && !isStandalone() && !isIOS()) showUnsupported();
    }, 4000);
  })();

  /* -------------------------------------------------- "Happy Birthday" tune
     Plays audio/happy-birthday.wav, a real rendered piano take that
     tools/build.mjs generates on every build. The Web Audio synth below is
     kept only as a fallback for the rare case where that file cannot be
     fetched. Either way playback still begins from a genuine user gesture. */
  (function birthdaySong() {
    var btn = $("[data-song]");
    if (!btn) return;

    var LABEL_PLAY = "Play the birthday song";
    var LABEL_STOP = "Stop the birthday song";

    var ctx = null;
    var playing = false;
    var starting = false;
    var master = null;
    var nodes = [];
    var timers = [];

    /* Resolved against this script's own URL, exactly like the service worker
       registration below, so it works from /birthday/ and from / alike. */
    var SONG_URL = APP_SRC
      ? new URL("audio/happy-birthday.wav", new URL("../", APP_SRC)).href
      : "audio/happy-birthday.wav";

    var el = null;        /* the <audio>, built on first play */
    var fileFailed = false;

    function setLabel(text) {
      var lbl = btn.querySelector("[data-song-label]");
      if (lbl) lbl.textContent = text;
    }

    function showPlaying(on) {
      playing = on;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      setLabel(on ? LABEL_STOP : LABEL_PLAY);
    }

    /* The file is fetched on demand - nothing is downloaded until Mercy
       actually presses play, which matters on a phone. */
    function ensureEl() {
      if (el) return el;
      el = new Audio();
      el.preload = "auto";
      el.addEventListener("ended", function () { showPlaying(false); });
      el.addEventListener("error", function () { fileFailed = true; });
      el.src = SONG_URL;
      return el;
    }

    var N = {
      C4: 261.63, D4: 293.66, E4: 329.63, Fs4: 369.99, G4: 392.0,
      A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33,
      G2: 98.0, C3: 130.81, D3: 146.83
    };

    /* "Happy Birthday to You", G major. [frequency, beats]
       Each row is one line of the song. The old version of this array was
       wrong (it opened on G instead of D and never used an F#), so it did not
       sound like the birthday song at all. Correct line-by-line:
         Hap-py  birth-day  to    you  ->  D D  E D  G    F#
         Hap-py  birth-day  to    you  ->  D D  E D  A    G
         Hap-py  birth-day  dear Mercy ->  D D  D' B  G F# E
         Hap-py  birth-day  to    you  ->  C C  B G  A    G          */
    var SONG = [
      [N.D4, 0.5], [N.D4, 0.5], [N.E4, 1.0], [N.D4, 1.0], [N.G4, 1.0], [N.Fs4, 2.0],
      [N.D4, 0.5], [N.D4, 0.5], [N.E4, 1.0], [N.D4, 1.0], [N.A4, 1.0], [N.G4, 2.0],
      [N.D4, 0.5], [N.D4, 0.5], [N.D5, 1.5], [N.B4, 0.5], [N.G4, 1.0], [N.Fs4, 0.5], [N.E4, 1.0],
      [N.C5, 0.5], [N.C5, 0.5], [N.B4, 1.0], [N.G4, 1.0], [N.A4, 1.0], [N.G4, 2.0]
    ];

    /* A single master bus: one place to set the overall level, and one place
       for stopAll() to cut everything cleanly. */
    function ensureMaster() {
      if (!master) {
        master = ctx.createGain();
        master.gain.value = 0.9;
        master.connect(ctx.destination);
      }
      return master;
    }

    function note(freq, start, dur, gainVal, type) {
      var osc = ctx.createOscillator();
      var g = ctx.createGain();
      osc.type = type || "triangle";
      osc.frequency.setValueAtTime(freq, start);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(gainVal, start + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur * 0.95);
      osc.connect(g).connect(ensureMaster());
      osc.start(start);
      osc.stop(start + dur);
      /* Let each node go once it has finished. Without this every play leaves
         50+ spent oscillators wired into the graph and the song gets heavier. */
      osc.onended = function () {
        try { osc.disconnect(); g.disconnect(); } catch (e) {}
      };
      nodes.push(osc);
    }

    function stopAll() {
      nodes.forEach(function (n) {
        try { n.stop(); } catch (e) {}
        try { n.disconnect(); } catch (e) {}
      });
      nodes = [];
      timers.forEach(clearTimeout);
      timers = [];
      if (el) { try { el.pause(); } catch (e) {} }
      showPlaying(false);
      starting = false;
    }

    /* ---- fallback: the live Web Audio synth, used only if the file fails ---- */
    function playSynth() {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { toast("Audio is not supported on this device."); return; }
      if (!ctx) ctx = new AC();

      /* resume() is ASYNCHRONOUS, and it is REJECTED outright when the tap did
         not count as a user gesture. Fire it without awaiting and the context
         can stay suspended while the button still claims to be playing. */
      var ready = ctx.state === "running"
        ? Promise.resolve()
        : Promise.resolve().then(function () { return ctx.resume(); }).catch(function () {});

      starting = true;
      return ready.then(function () {
        starting = false;
        if (ctx.state !== "running") {
          toast("Tap once more and the song will play.");
          return;
        }

        showPlaying(true);
        ensureMaster();

        var beat = 0.5;
        var t = ctx.currentTime + 0.12;
        for (var i = 0; i < SONG.length; i++) {
          note(SONG[i][0], t, SONG[i][1] * beat, 0.22, "triangle");
          t += SONG[i][1] * beat;
        }
        var total = t - ctx.currentTime;

        var bassRoots = [N.G2, N.D3, N.G2, N.C3];
        var steps = Math.ceil(total / (beat * 2));
        for (var b = 0; b < steps; b++) {
          var bt = ctx.currentTime + 0.12 + b * beat * 2;
          note(bassRoots[(b >> 1) % bassRoots.length], bt, beat * 1.8, 0.09, "sine");
        }
        for (var k = 0; k * beat * 2 < total; k++) {
          note([N.D5, N.G4, N.B4, N.G4][k % 4],
               ctx.currentTime + 0.12 + k * beat * 2, beat * 1.5, 0.03, "sine");
        }

        timers.push(setTimeout(stopAll, total * 1000 + 400));
      });
    }

    /* ---- primary: the rendered WAV ---- */
    function playFile() {
      var a = ensureEl();
      try { a.currentTime = 0; } catch (e) {}
      var p = a.play();
      showPlaying(true);
      if (p && p.catch) {
        p.catch(function () {
          showPlaying(false);
          /* A hard load error means the file is not there; anything else is
             almost always "this tap did not count as a gesture". Fall back to
             the synth for the former, ask for another tap for the latter. */
          if (a.error) { fileFailed = true; playSynth(); }
          else { toast("Tap once more and the song will play."); }
        });
      }
    }

    function play() {
      if (fileFailed) { playSynth(); return; }
      playFile();
    }

    btn.addEventListener("click", function () {
      if (playing) { stopAll(); return; }
      /* Ignore repeat taps while something is still starting up, otherwise the
         song gets scheduled twice on top of itself. */
      if (starting) return;
      play();
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
    var note = $("[data-cake-note]");

    /* Blowing the candles out used to change almost nothing on screen: the
       flames dimmed a little, the toast vanished after 2.6s, and the caption
       still said "Tap the cake to make a wish." - so to a real visitor the tap
       looked like it had done nothing. Reflect the state in the words too. */
    function render(out) {
      cake.classList.toggle("is-out", out);
      var label = out ? cake.getAttribute("data-label-off") : cake.getAttribute("data-label-on");
      if (label) cake.setAttribute("aria-label", label);
      if (note) {
        var text = out ? note.getAttribute("data-note-off") : note.getAttribute("data-note-on");
        if (text) note.textContent = text;
      }
    }

    cake.addEventListener("click", function () {
      var out = !cake.classList.contains("is-out");
      render(out);
      toast(out ? "Wish made. Happy birthday, Mercy!" : "Another wish? Tap the cake.");
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
