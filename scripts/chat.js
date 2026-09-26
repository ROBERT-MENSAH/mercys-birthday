/* =============================================================================
   Live chat - message store.

   The site's visitor messages live behind a tiny driver interface:

       list()  -> Promise<message[]>
       add(m)  -> Promise<message>
       ready() -> Promise<void>

   `localDriver` is what ships today. It keeps everything in this browser only,
   which is honest for a static site: there is no server, so nothing written
   here reaches another visitor. When a real datastore is chosen, implement the
   same three methods and swap the driver at the bottom of this file. Nothing
   in chat.js needs to change.

   Every value that reaches the DOM is escaped at render time, and nothing here
   trusts a stored record - a payload edited by hand in devtools is treated the
   same as one written by the form.
   ========================================================================== */
(function (global) {
  "use strict";

  var KEY = "mercy.chat.v1";
  var MAX = 200;          /* keep the list bounded so storage never fills up  */
  var NAME_MAX = 40;
  var TEXT_MAX = 600;
  var REL_MAX = 40;
  var COOLDOWN = 5000;    /* ms between posts from one visitor               */

  /* ------------------------------------------------------------------ utils */

  function clean(s, max) {
    return String(s == null ? "" : s)
      .replace(/[\u0000-\u001F\u007F]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);
  }

  /* Multi-line text: keep the line breaks a person actually typed, but still
     strip control characters so stored text cannot smuggle anything odd. */
  function cleanText(s, max) {
    return String(s == null ? "" : s)
      .replace(/\r\n?/g, "\n")
      .replace(/[\u0000-\u001F\u007F]/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .slice(0, max);
  }

  /* A short id, without needing crypto.randomUUID which is not everywhere. */
  function uid() {
    return "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  /* Shape a record into exactly the fields the UI reads. Anything unexpected
     becomes an empty string rather than undefined, so the renderer can rely on
     a string being present. */
  function normalise(raw) {
    if (!raw || typeof raw !== "object") return null;
    var text = cleanText(raw.text, TEXT_MAX);
    if (!text) return null;
    var at = Number(raw.at);
    return {
      id: clean(raw.id, 40) || uid(),
      name: clean(raw.name, NAME_MAX) || "Someone",
      relation: clean(raw.relation, REL_MAX),
      text: text,
      at: isFinite(at) && at > 0 && at < 8.64e15 ? at : Date.now(),
    };
  }

  function read() {
    var out = [];
    try {
      var raw = global.localStorage.getItem(KEY);
      if (!raw) return out;
      var parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return out;
      for (var i = 0; i < parsed.length; i++) {
        var m = normalise(parsed[i]);
        if (m) out.push(m);
      }
    } catch (e) {
      /* Private mode, disabled storage, or corrupt JSON. Start clean rather
         than throwing - the chat still has to render. */
      return [];
    }
    return out;
  }

  function write(list) {
    global.localStorage.setItem(KEY, JSON.stringify(list.slice(-MAX)));
  }

  /* ------------------------------------------------------------- driver */

  function localDriver() {
    var last = 0;

    return {
      storage: "local",
      list: function () {
        return Promise.resolve(read());
      },
      add: function (m) {
        var now = Date.now();
        if (now - last < COOLDOWN) {
          return Promise.reject(new Error("Please wait a moment before posting again."));
        }
        last = now;
        var msg = normalise(m);
        if (!msg) return Promise.reject(new Error("Write a message first."));
        var list = read();
        list.push(msg);
        try {
          write(list);
        } catch (e) {
          return Promise.reject(new Error("This browser is not letting the page save messages."));
        }
        return Promise.resolve(msg);
      },
      ready: function () { return Promise.resolve(); },
    };
  }

  /* The one line that changes when a real backend arrives. */
  var driver = localDriver();

  global.MBChat = {
    list: function () { return driver.list(); },
    add: function (m) { return driver.add(m); },
    ready: function () { return driver.ready(); },
    storage: driver.storage,
    limits: { NAME_MAX: NAME_MAX, TEXT_MAX: TEXT_MAX, REL_MAX: REL_MAX, COOLDOWN: COOLDOWN },
  };
})(window);
