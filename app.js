(function () {
  "use strict";
  var S = window.SURVEY, CFG = window.FIREBASE_CONFIG || {};
  var QS = new URLSearchParams(location.search);
  var REVIEW = QS.has("review");   // owner's review mode: jump to any screen, nothing is saved
  var PREVIEW = REVIEW || !CFG.apiKey || CFG.apiKey.indexOf("PASTE") === 0;
  var SELF = QS.has("self");
  var FB = "https://www.gstatic.com/firebasejs/10.12.2/";
  var A = {};            // answers
  // Progress is kept in this browser tab only, so a refresh resumes at the same screen. It is cleared on Submit or Stop.
  var saved = null;
  try { saved = JSON.parse(sessionStorage.getItem("pf_state") || "null"); } catch (e) {}
  if (!saved || SELF || saved.review !== REVIEW) saved = null;
  var seed = saved ? saved.seed : Math.floor(Math.random() * 4294967296);
  var rs = seed;
  function rand() { rs = (rs + 0x6D2B79F5) | 0; var t = Math.imul(rs ^ (rs >>> 15), 1 | rs); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
  function keep() { if (SELF) return; try { sessionStorage.setItem("pf_state", JSON.stringify({ seed: seed, A: A, idx: idx, review: REVIEW })); } catch (e) {} }
  function forget() { try { sessionStorage.removeItem("pf_state"); } catch (e) {} }
  var fb = null;         // firebase handles, loaded lazily
  var app = document.getElementById("app"), bar = document.getElementById("bar");

  function el(tag, attrs) {
    var n = document.createElement(tag), i, k;
    for (k in (attrs || {})) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "on") for (i in attrs.on) n.addEventListener(i, attrs.on[i]);
      else n.setAttribute(k, attrs[k]);
    }
    for (i = 2; i < arguments.length; i++) if (arguments[i]) n.appendChild(arguments[i]);
    return n;
  }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function worked() { return SELF || A.rel === "client" || A.rel === "peer" || A.rel === "both"; }

  // ---- build the list of screens ----
  var screens = [];
  if (SELF) { if (!PREVIEW) screens.push({ type: "login" }); screens.push({ type: "selfintro" }); }
  else { screens.push({ type: "intro" }); S.ice.forEach(function (q) { screens.push(Object.assign({ type: "single", sec: "To begin" }, q)); }); }
  S.behaviour.slice(0, 2).concat(shuffle(S.behaviour.slice(2))).forEach(function (it) {
    screens.push(Object.assign({ type: "scale", sec: "Working with people" }, it));
  });
  S.situ.forEach(function (q) { screens.push(Object.assign({ type: "single", sec: "Working with people" }, q)); });
  screens.push({ type: "adj", sec: "In five words" });
  shuffle(S.work).forEach(function (it) { screens.push(Object.assign({ type: "scale", sec: "His work", cond: worked }, it)); });
  screens.push(Object.assign({ type: "single", sec: "His work", cond: worked }, S.comp));
  screens.push(Object.assign({ type: "multi", sec: "His work", cond: worked }, S.first));
  if (!SELF) {
    screens.push(Object.assign({ type: "nps", sec: "Last few" }, S.rec));
    screens.push(Object.assign({ type: "single", sec: "Last few" }, S.again));
    screens.push(Object.assign({ type: "single", sec: "Last few", cond: function () { return A.again && A.again !== "yes"; } }, S.resv));
    screens.push(Object.assign({ type: "single", sec: "Last few" }, S.held));
  }
  screens.push({ type: "submit" });
  var adjList = shuffle(S.adjectives.pos.concat(S.adjectives.neg));
  var idx = 0;
  if (saved) { Object.assign(A, saved.A || {}); if (saved.idx >= 0 && saved.idx < screens.length) idx = saved.idx; }

  function visible(i) { return !screens[i].cond || screens[i].cond(); }
  function go(d) {
    var i = idx + d;
    while (i >= 0 && i < screens.length && !visible(i)) i += d;
    if (i < 0 || i >= screens.length) return;
    idx = i; render();
  }
  function progress() {
    var tot = 0, done = 0;
    screens.forEach(function (s, i) { if (visible(i)) { tot++; if (i < idx) done++; } });
    bar.style.width = Math.round(100 * done / Math.max(1, tot - 1)) + "%";
  }
  function nav(canNext, onNext) {
    var first = idx === 0 || screens[idx].type === "selfintro";
    return el("div", { "class": "nav" },
      first ? el("span") : el("button", { "class": "btn ghost", type: "button", text: "← Back", on: { click: function () { go(-1); } } }),
      onNext ? el("button", Object.assign({ "class": "btn", type: "button", text: "Continue", on: { click: onNext } }, canNext ? {} : { disabled: "" })) : null);
  }
  function pick(id, val) { A[id] = val; render(); setTimeout(function () { go(1); }, 170); }
  function selfBanner() { return SELF ? el("p", { "class": "mute", text: "Self-rating: answer about yourself, as honestly as you would want others to." }) : null; }

  var R = {
    intro: function (c) {
      var min = window.MIN_RESPONSES || 6;
      function para(head, body) { var p = el("p"); p.appendChild(el("strong", { text: head + " " })); p.appendChild(document.createTextNode(body)); return p; }
      c.appendChild(el("h1", { text: "Six minutes for Prakash" }));
      c.appendChild(el("p", { text: "Prakash has asked people who know him and his work to describe how he comes across. He wants to learn what he cannot see himself." }));
      c.appendChild(para("What is recorded:", "only the options you tap. No name, phone number, email or time of response."));
      c.appendChild(para("What he sees:", "combined results from everyone, and only once at least " + min + " people have responded. Individual responses are not shown to him."));
      c.appendChild(para("What helps him:", "your answers as you have seen things, including where he falls short. Agreeable answers will leave him where he is. If you have not seen something, choose \u201cNot observed\u201d."));
      c.appendChild(para("Your choice:", "taking part is voluntary. You can press Stop at any point and nothing will be saved. Nothing is sent until you press Submit at the end."));
      c.appendChild(el("div", { "class": "nav" }, el("button", { "class": "btn ghost", type: "button", text: "No, thank you", on: { click: stop } }), el("button", { "class": "btn", type: "button", text: "Start", on: { click: function () { go(1); } } })));
    },
    selfintro: function (c) {
      c.appendChild(el("h1", { text: "Your self-rating" }));
      c.appendChild(el("p", { text: "These are the same statements your respondents see, reworded for you. The results page compares your answers with theirs, so rate yourself as you believe you are, not as you would like to be." }));
      c.appendChild(el("p", { "class": "mute", text: "You can redo this later. The latest submission replaces the earlier one." }));
      c.appendChild(el("div", { "class": "nav" }, el("span"), el("button", { "class": "btn", type: "button", text: "Start", on: { click: function () { go(1); } } })));
    },
    login: function (c) {
      c.appendChild(el("h1", { text: "Sign in" }));
      c.appendChild(el("p", { "class": "mute", text: "Self-rating is only for Prakash. Sign in with the account created in Firebase Authentication." }));
      var em = el("input", { type: "email", placeholder: "Email", autocomplete: "username" });
      var pw = el("input", { type: "password", placeholder: "Password", autocomplete: "current-password" });
      var err = el("p", { "class": "err" });
      var b = el("button", { "class": "btn", type: "button", text: "Sign in" });
      b.addEventListener("click", function () {
        b.disabled = true; err.textContent = "";
        loadFb().then(function () { return fb.auth.signInWithEmailAndPassword(fb.authInst, em.value.trim(), pw.value); })
          .then(function () { go(1); })
          .catch(function () { err.textContent = "Sign-in failed. Check the email and password."; b.disabled = false; });
      });
      c.appendChild(em); c.appendChild(pw); c.appendChild(err); c.appendChild(el("div", { "class": "nav" }, el("span"), b));
    },
    single: function (c, s) {
      c.appendChild(el("h2", { text: SELF && s.sq ? s.sq : (s.qn && !worked() ? s.qn : s.q) }));
      if (s.hint) c.appendChild(el("p", { "class": "mute", text: s.hint }));
      s.opts.forEach(function (o) {
        c.appendChild(el("button", { "class": "opt" + (A[s.id] === o[0] ? " on" : ""), type: "button", text: o[1], on: { click: function () { pick(s.id, o[0]); } } }));
      });
      c.appendChild(nav(A[s.id] !== undefined, A[s.id] !== undefined ? function () { go(1); } : null));
    },
    scale: function (c, s) {
      c.appendChild(el("p", { "class": "ctx", text: "How often is this true?" }));
      c.appendChild(el("h2", { text: SELF ? s.s : s.t }));
      S.scale.forEach(function (o) {
        if (SELF && o[0] === 0) return;
        c.appendChild(el("button", { "class": "opt" + (o[0] === 0 ? " na" : "") + (A[s.id] === o[0] ? " on" : ""), type: "button", text: o[1], on: { click: function () { pick(s.id, o[0]); } } }));
      });
      c.appendChild(nav(A[s.id] !== undefined, A[s.id] !== undefined ? function () { go(1); } : null));
    },
    multi: function (c, s) {
      var cur = A[s.id] || [];
      c.appendChild(el("h2", { text: SELF && s.sq ? s.sq : s.q }));
      c.appendChild(el("p", { "class": "mute", text: s.hint }));
      s.opts.forEach(function (o) {
        c.appendChild(el("button", { "class": "opt" + (cur.indexOf(o[0]) >= 0 ? " on" : ""), type: "button", text: o[1], on: { click: function () {
          var n = cur.slice(), k = n.indexOf(o[0]);
          if (o[0] === "none") n = k >= 0 ? [] : ["none"];
          else { n = n.filter(function (x) { return x !== "none"; }); k = n.indexOf(o[0]); if (k >= 0) n.splice(k, 1); else n.push(o[0]); }
          A[s.id] = n; render();
        } } }));
      });
      c.appendChild(nav(cur.length > 0, function () { go(1); }));
    },
    adj: function (c) {
      var cur = A.adj || [];
      c.appendChild(el("h2", { text: SELF ? "Choose the five words that describe you best." : "Choose the five words that describe him best." }));
      c.appendChild(el("p", { "class": "mute", text: "Exactly five. " + cur.length + " of 5 chosen." }));
      var box = el("div", { "class": "chips" });
      adjList.forEach(function (w) {
        box.appendChild(el("button", { "class": "chip" + (cur.indexOf(w) >= 0 ? " on" : ""), type: "button", text: w, on: { click: function () {
          var n = cur.slice(), k = n.indexOf(w);
          if (k >= 0) n.splice(k, 1); else if (n.length < 5) n.push(w);
          A.adj = n; render();
        } } }));
      });
      c.appendChild(box);
      c.appendChild(nav(cur.length === 5, function () { go(1); }));
    },
    nps: function (c, s) {
      c.appendChild(el("h2", { text: s.q }));
      var g = el("div", { "class": "nps" });
      for (var i = 0; i <= 10; i++) (function (v) {
        g.appendChild(el("button", { "class": "opt" + (A[s.id] === v ? " on" : ""), type: "button", text: String(v), on: { click: function () { pick(s.id, v); } } }));
      })(i);
      c.appendChild(g);
      c.appendChild(el("div", { "class": "ends" }, el("span", { text: "0 = Not at all" }), el("span", { text: "10 = Certainly" })));
      c.appendChild(nav(A[s.id] !== undefined, A[s.id] !== undefined ? function () { go(1); } : null));
    },
    submit: function (c) {
      c.appendChild(el("h1", { text: "That is everything" }));
      c.appendChild(el("p", { text: SELF ? "Submit to save your self-rating." : "Press Submit to send your answers. You can go back and change anything first." }));
      var err = el("p", { "class": "err" });
      var b = el("button", { "class": "btn", type: "button", text: "Submit" });
      b.addEventListener("click", function () {
        b.disabled = true; b.textContent = "Sending…"; err.textContent = "";
        save().then(done).catch(function () { err.textContent = "Could not send. Check your connection and press Submit again."; b.disabled = false; b.textContent = "Submit"; });
      });
      c.appendChild(err);
      c.appendChild(el("div", { "class": "nav" }, el("button", { "class": "btn ghost", type: "button", text: "← Back", on: { click: function () { go(-1); } } }), b));
    }
  };

  function payload() {
    var b = {}, w = {}, d;
    S.behaviour.forEach(function (i) { b[i.id] = A[i.id]; });
    if (worked()) S.work.forEach(function (i) { w[i.id] = A[i.id]; });
    d = { v: 1, b: b, s1: A.s1, s2: A.s2, adj: A.adj, w: w, w_comp: worked() ? A.w_comp : "", first: worked() ? A.first : [] };
    if (!SELF) { d.known = A.known; d.rel = A.rel; d.cricket = A.cricket; d.rec = A.rec; d.again = A.again; d.resv = A.again !== "yes" ? (A.resv || "") : ""; d.held = A.held; }
    return d;
  }
  function loadFb() {
    if (fb) return Promise.resolve(fb);
    return Promise.all([import(FB + "firebase-app.js"), import(FB + "firebase-firestore.js"), import(FB + "firebase-auth.js")]).then(function (m) {
      var a = m[0].initializeApp(CFG);
      fb = { fs: m[1], db: m[1].getFirestore(a), auth: m[2], authInst: m[2].getAuth(a) };
      return fb;
    });
  }
  function save() {
    var d = payload();
    if (PREVIEW) { console.log("PREVIEW payload", d); return Promise.resolve(); }
    return loadFb().then(function () {
      // No name, contact detail or timestamp field is written.
      return SELF ? fb.fs.setDoc(fb.fs.doc(fb.db, "self", "me"), d) : fb.fs.addDoc(fb.fs.collection(fb.db, "responses"), d);
    });
  }
  function stop() {
    for (var k in A) delete A[k];
    forget();
    bar.style.width = "0%";
    app.innerHTML = "";
    var c = el("div", { "class": "card" });
    c.appendChild(el("h1", { text: "Stopped" }));
    c.appendChild(el("p", { text: "Nothing has been saved or sent, and Prakash will not know that you opened this page. You can close it now." }));
    c.appendChild(el("p", { "class": "mute", text: "If you change your mind, reload the page to start again." }));
    app.appendChild(c);
  }
  function done() {
    if (!SELF && !PREVIEW) { try { localStorage.setItem("pf_done", "1"); } catch (e) {} }
    forget();
    bar.style.width = "100%";
    app.innerHTML = "";
    var c = el("div", { "class": "card" });
    c.appendChild(el("h1", { text: SELF ? "Self-rating saved" : "Thank you" }));
    c.appendChild(el("p", { text: SELF ? "Open the results page to compare it with what others said." : "Your answers have been recorded anonymously. You can close this page." }));
    if (PREVIEW) c.appendChild(el("div", { "class": "note", text: "Preview mode: nothing was saved, because the Firebase values in config.js have not been filled in yet." }));
    app.appendChild(c);
  }
  function render() {
    var s = screens[idx];
    app.innerHTML = "";
    if (REVIEW) {
      var sel = el("select", { style: "width:100%;margin-bottom:10px", on: { change: function (e) { idx = +e.target.value; render(); } } });
      screens.forEach(function (x, i) { var t = (i + 1) + ". " + (x.q || x.t || { intro: "Welcome", adj: "Five words", submit: "Submit" }[x.type] || x.type); sel.appendChild(el("option", { value: String(i), text: t.length > 60 ? t.slice(0, 58) + "…" : t })); });
      sel.value = String(idx);
      app.appendChild(el("div", { "class": "note" }, el("strong", { text: "Review mode. Nothing is saved. Jump to any screen:" }), sel));
    } else if (PREVIEW) app.appendChild(el("div", { "class": "note", text: "Preview mode. Answers are not saved." }));
    var c = el("div", { "class": "card" });
    if (s.sec) c.appendChild(el("p", { "class": "sec", text: SELF && s.sec === "His work" ? "My work" : s.sec }));
    var b = selfBanner(); if (b && (s.type === "scale")) c.appendChild(b);
    R[s.type](c, s);
    app.appendChild(c);
    if (!SELF && s.type !== "intro") app.appendChild(el("p", { style: "text-align:center" }, el("button", { "class": "btn ghost", type: "button", text: "Stop, I would rather not take part", on: { click: stop } })));
    progress();
    keep();
    window.scrollTo(0, 0);
  }

  var already = false;
  try { already = !SELF && !PREVIEW && localStorage.getItem("pf_done") === "1"; } catch (e) {}
  if (already) {
    var c = el("div", { "class": "card" });
    c.appendChild(el("h1", { text: "Already submitted" }));
    c.appendChild(el("p", { text: "A response has already been sent from this device. Thank you." }));
    app.appendChild(c); bar.style.width = "100%";
  } else render();
})();
