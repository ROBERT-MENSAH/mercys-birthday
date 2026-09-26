/* =============================================================================
   Live chat - UI.
   Renders the message wall and handles the compose form. All storage access
   goes through MBChat (see chat.js), so this file never touches localStorage
   and never needs changing when a real backend is wired in.

   Nothing here builds HTML from a message. Every field is written with
   textContent, so a message can never inject markup.
   ========================================================================== */
(function () {
  "use strict";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var form = $("[data-chat-form]");
  var wall = $("[data-chat-wall]");
  var countEl = $("[data-chat-count]");
  var emptyEl = $("[data-chat-empty]");
  if (!form || !wall || !window.MBChat) return;

  var store = window.MBChat;
  var toast = window.mbToast || function () {};

  /* ------------------------------------------------------------- rendering */

  /* "just now" / "12m ago" / "3 Nov". Never implies more precision than a
     rounded relative time actually carries. */
  function ago(ts) {
    var s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
    if (s < 45) return "just now";
    if (s < 3600) return Math.floor(s / 60) + "m ago";
    if (s < 86400) return Math.floor(s / 3600) + "h ago";
    if (s < 604800) return Math.floor(s / 86400) + "d ago";
    try {
      return new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short" });
    } catch (e) {
      return "earlier";
    }
  }

  /* First letter of the name for the avatar, or a neutral glyph so the tile is
     never empty. */
  function initial(name) {
    var ch = (name || "").trim().charAt(0);
    return ch ? ch.toUpperCase() : "?";
  }

  /* Cap the wall at 60 entries: past that it is a performance problem on a
     phone, and the newest are the ones people came to read. */
  function render(list) {
    wall.textContent = "";
    var shown = list.slice(-60).reverse();

    shown.forEach(function (m) {
      var li = document.createElement("li");
      /* Deliberately NOT the `.rv` reveal class. Scroll reveal is wired up once
         at page load (app.js collects `.rv` on boot), so elements added later
         would never be observed and would sit at opacity 0 - a blank wall. The
         `is-new` highlight below gives the feedback instead. */
      li.className = "chatmsg";

      var av = document.createElement("span");
      av.className = "chatmsg__av";
      av.setAttribute("aria-hidden", "true");
      av.textContent = initial(m.name);

      var main = document.createElement("div");
      main.className = "chatmsg__main";

      var head = document.createElement("p");
      head.className = "chatmsg__head";
      var nm = document.createElement("b");
      nm.textContent = m.name;
      head.appendChild(nm);
      /* Only shown when the person actually said how they know her. */
      if (m.relation) {
        var rel = document.createElement("span");
        rel.className = "chatmsg__rel";
        rel.textContent = m.relation;
        head.appendChild(rel);
      }
      var when = document.createElement("time");
      when.className = "chatmsg__when";
      when.dateTime = new Date(m.at).toISOString();
      when.textContent = ago(m.at);
      head.appendChild(when);

      var body = document.createElement("p");
      body.className = "chatmsg__text";
      /* textContent, never innerHTML - this is untrusted visitor text. */
      body.textContent = m.text;

      main.appendChild(head);
      main.appendChild(body);
      li.appendChild(av);
      li.appendChild(main);
      wall.appendChild(li);
    });

    if (emptyEl) emptyEl.classList.toggle("is-on", shown.length === 0);
    if (countEl) {
      countEl.textContent = list.length === 1 ? "1 message" : list.length + " messages";
    }
  }

  function load() {
    return store.list().then(render, function () {
      if (emptyEl) emptyEl.classList.add("is-on");
    });
  }


  /* ------------------------------------------------------------------ form */

  var nameEl = $("[data-chat-name]", form);
  var relEl = $("[data-chat-relation]", form);
  var textEl = $("[data-chat-text]", form);
  var submit = $("[data-chat-submit]", form);
  var counter = $("[data-chat-counter]", form);
  var limits = store.limits || { TEXT_MAX: 600, NAME_MAX: 40 };

  /* A prompt card fills the box and hands over focus, so the visitor can edit
     straight away instead of having to find the textarea. */
  $$("[data-chat-seed]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var t = $("[data-chat-text]");
      if (!t) return;
      /* Append rather than overwrite, so tapping a second card adds to the
         first instead of silently replacing what they wrote. */
      t.value = t.value.trim() ? t.value.trim() + " " + btn.getAttribute("data-chat-seed") : btn.getAttribute("data-chat-seed");
      if (t.value.length > limits.TEXT_MAX) t.value = t.value.slice(0, limits.TEXT_MAX);
      count();
      t.focus();
      /* The wall is below the form on a phone, so make sure the box is seen. */
      try {
        t.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
      } catch (e) {
        t.scrollIntoView();
      }
    });
  });

  /* Live character count, so the cap is visible before it is hit. */
  function count() {
    if (!counter || !textEl) return;
    var n = textEl.value.length;
    counter.textContent = n + " / " + limits.TEXT_MAX;
    counter.classList.toggle("is-near", n > limits.TEXT_MAX * 0.85);
  }
  if (textEl) {
    textEl.addEventListener("input", count);
    count();
  }
  if (nameEl) {
    nameEl.addEventListener("input", function () {
      if (nameEl.value.length > limits.NAME_MAX) {
        nameEl.value = nameEl.value.slice(0, limits.NAME_MAX);
      }
    });
  }

  var busy = false;
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (busy) return;

    var text = (textEl.value || "").trim();
    if (!text) {
      toast("Write your message first.");
      if (textEl) textEl.focus();
      return;
    }

    busy = true;
    if (submit) {
      submit.disabled = true;
      submit.textContent = "Posting…";
    }

    store
      .add({
        name: (nameEl && nameEl.value) || "",
        relation: (relEl && relEl.value) || "",
        text: text,
        at: Date.now(),
      })
      .then(function () {
        form.reset();
        if (textEl) textEl.value = "";
        count();
        /* Re-read rather than pushing locally, so the visitor sees exactly
           what was stored. */
        return load().then(function () {
          toast("Your message is up.");
          if (wall.firstElementChild) wall.firstElementChild.classList.add("is-new");
        });
      })
      .catch(function (err) {
        toast((err && err.message) || "That did not save. Try again.");
      })
      .then(function () {
        busy = false;
        if (submit) {
          submit.disabled = false;
          submit.textContent = "Post message";
        }
      });
  });

  /* Reload the wall when messages change in another tab. */
  window.addEventListener("storage", function (e) {
    /* key === null means the whole store was cleared, which is also a change. */
    if (!e.key || e.key === "mercy.chat.v1") load();
  });

  /* The wall must appear even if the store is slow or partially broken, so
     both the success and failure path render, and a throw inside render
     cannot leave the page half-built with no explanation. */
  store.ready().then(load, load).then(null, function () {
    if (emptyEl) emptyEl.classList.add("is-on");
  });
})();
