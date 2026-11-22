(function () {
  "use strict";
  var S = window.SURVEY, CFG = window.FIREBASE_CONFIG || {}, MIN = window.MIN_RESPONSES || 6;
  var PREVIEW = !CFG.apiKey || CFG.apiKey.indexOf("PASTE") === 0;
  var FB = "https://www.gstatic.com/firebasejs/10.12.2/";
  var HIGH = 3.5, GROUP_MIN = 4, ITEM_MIN = 3;
  var app = document.getElementById("app");
  var ALL = [], SELFDOC = null, filter = "all";

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
  function card(title) { var c = el("div", { "class": "card" }); if (title) c.appendChild(el("h3", { text: title })); return c; }
  function fmt(x) { return x == null ? "–" : x.toFixed(1); }
  function label(opts, code) { for (var i = 0; i < opts.length; i++) if (opts[i][0] === code) return opts[i][1]; return null; }

  // ---- statistics ----
  function itemStat(it, key, rows) {
    var obs = [], no = 0;
    rows.forEach(function (r) {
      var v = r[key] && r[key][it.id];
      if (v === 0) no++; else if (Number.isInteger(v) && v >= 1 && v <= 5) obs.push(v);
    });
    var mean = obs.length >= ITEM_MIN ? obs.reduce(function (a, b) { return a + b; }, 0) / obs.length : null;
    var fav = mean == null ? null : (it.r ? 6 - mean : mean);
    var sv = SELFDOC && SELFDOC[key] ? SELFDOC[key][it.id] : null;
    if (!(Number.isInteger(sv) && sv >= 1 && sv <= 5)) sv = null;
    var sfav = sv == null ? null : (it.r ? 6 - sv : sv);
    var q = null;
    if (obs.length + no > 0 && no / (obs.length + no) >= 0.5) q = ["Not seen by most", ""];
    else if (fav != null && sfav != null) {
      if (sfav >= HIGH && fav >= HIGH) q = ["Open strength", "open"];
      else if (sfav >= HIGH && fav < HIGH) q = ["Blind spot", "blind"];
      else if (sfav < HIGH && fav >= HIGH) q = ["Unrecognised strength", "unrec"];
      else q = ["Known weakness", "known"];
    }
    return { it: it, n: obs.length, no: no, mean: mean, fav: fav, self: sv, sfav: sfav, gap: (fav != null && sfav != null) ? fav - sfav : null, q: q };
  }
  function counts(rows, get, opts) {
    var c = {}, tot = 0;
    opts.forEach(function (o) { c[o[0]] = 0; });
    rows.forEach(function (r) {
      var v = get(r); if (v == null || v === "") return;
      var arr = Array.isArray(v) ? v : [v], hit = false;
      arr.forEach(function (x) { if (Object.prototype.hasOwnProperty.call(c, x)) { c[x]++; hit = true; } });
      if (hit) tot++;
    });
    return { c: c, tot: tot };
  }
  function distBlock(title, rows, get, opts, selfVal) {
    var d = counts(rows, get, opts), box = card(title);
    opts.forEach(function (o) {
      var n = d.c[o[0]], pct = d.tot ? Math.round(100 * n / d.tot) : 0;
      var mine = selfVal != null && (Array.isArray(selfVal) ? selfVal.indexOf(o[0]) >= 0 : selfVal === o[0]);
      var m = el("div", { "class": "meter" }, el("i")); m.firstChild.style.width = pct + "%";
      box.appendChild(el("div", { "class": "dist" }, el("span", { text: o[1] + (mine ? "  ◀ you" : "") }), m, el("span", { "class": "mute", text: n + " (" + pct + "%)" })));
    });
    box.appendChild(el("p", { "class": "mute", text: d.tot + " answered" }));
    return box;
  }
  function itemTable(title, items, key, rows) {
    var box = card(title), t = el("table"), wrap = el("div", { "class": "tablewrap" }, t);
    t.appendChild(el("tr", null, el("th", { text: "Statement" }), el("th", { text: "Others" }), el("th", { text: "You" }), el("th", { text: "Gap" }), el("th", { text: "Reading" }), el("th", { text: "Seen by" })));
    items.map(function (it) { return itemStat(it, key, rows); }).forEach(function (s) {
      var m = el("div", { "class": "meter" }, el("i")); m.firstChild.style.width = (s.fav == null ? 0 : s.fav / 5 * 100) + "%";
      var st = el("td", null, el("span", { text: s.it.t + (s.it.r ? "  (unfavourable wording)" : "") }), m);
      t.appendChild(el("tr", null, st,
        el("td", { "class": "num", text: s.mean == null ? "too few" : fmt(s.mean) }),
        el("td", { "class": "num", text: s.self == null ? "–" : String(s.self) }),
        el("td", { "class": "num", text: s.gap == null ? "–" : (s.gap > 0 ? "+" : "") + fmt(s.gap) }),
        el("td", null, s.q ? el("span", { "class": "tag " + s.q[1], text: s.q[0] }) : el("span", { text: "–" })),
        el("td", { "class": "num", text: s.n + " of " + (s.n + s.no) })));
    });
    box.appendChild(wrap);
    box.appendChild(el("p", { "class": "mute", text: "Others and You are average frequency, 1 (almost never) to 5 (almost always). The bar and the Gap convert this to a favourable score, so a longer bar is always better and a negative gap means others rate you lower than you rate yourself. Averages need at least " + ITEM_MIN + " people who observed the behaviour." }));
    return box;
  }

  // ---- page ----
  function render() {
    app.innerHTML = "";
    app.appendChild(el("h1", { text: "Feedback results" }));
    if (PREVIEW) app.appendChild(el("div", { "class": "note", text: "Sample data. These figures are randomly generated to show the layout. Real results appear after config.js is filled in." }));
    var n = ALL.length;
    if (n < MIN) {
      var c = card();
      c.appendChild(el("div", { "class": "big", text: n + " of " + MIN }));
      c.appendChild(el("p", { text: "responses received. Results stay locked until " + MIN + " people have responded, so that no individual's answers can be identified." }));
      c.appendChild(el("p", { "class": "mute", text: SELFDOC ? "Your self-rating is saved." : "Your self-rating is not done yet. Open index.html?self to complete it." }));
      app.appendChild(c); return;
    }
    // group split is offered only when every group present has enough people, so no group can be worked out by subtraction
    var g = counts(ALL, function (r) { return r.rel; }, S.ice[1].opts).c, canSplit = true, present = 0;
    Object.keys(g).forEach(function (k) { if (g[k] > 0) { present++; if (g[k] < GROUP_MIN) canSplit = false; } });
    canSplit = canSplit && present > 1;
    if (!canSplit) filter = "all";
    var rows = filter === "all" ? ALL : ALL.filter(function (r) { return r.rel === filter; });

    var head = card();
    head.appendChild(el("div", { "class": "big", text: String(rows.length) }));
    head.appendChild(el("p", { text: "responses" + (filter === "all" ? "" : " in this group") + ". " + (SELFDOC ? "Self-rating included." : "Self-rating missing, so the You, Gap and Reading columns are empty. Open index.html?self to complete it.") }));
    if (canSplit) {
      var sel = el("select", { on: { change: function (e) { filter = e.target.value; render(); } } }, el("option", { value: "all", text: "Everyone" }));
      S.ice[1].opts.forEach(function (o) { if (g[o[0]] > 0) sel.appendChild(el("option", { value: o[0], text: o[1] + " (" + g[o[0]] + ")" })); });
      sel.value = filter; head.appendChild(sel);
    } else head.appendChild(el("p", { "class": "mute", text: "Results by respondent group are shown only when every group has at least " + GROUP_MIN + " responses." }));
    app.appendChild(head);

    // blind spots summary
    var stats = S.behaviour.map(function (it) { return itemStat(it, "b", rows); }).concat(S.work.map(function (it) { return itemStat(it, "w", rows); }));
    var blind = stats.filter(function (s) { return s.gap != null && s.gap <= -1; }).sort(function (a, b) { return a.gap - b.gap; }).slice(0, 6);
    var bs = card("Largest gaps: where others rate you lower than you rate yourself");
    if (!SELFDOC) bs.appendChild(el("p", { "class": "mute", text: "Needs your self-rating." }));
    else if (!blind.length) bs.appendChild(el("p", { text: "No statement shows a gap of one point or more." }));
    else blind.forEach(function (s) { bs.appendChild(el("p", null, el("span", { "class": "tag blind", text: fmt(s.gap) }), el("span", { text: "  " + s.it.t }))); });
    app.appendChild(bs);

    app.appendChild(itemTable("Working with people", S.behaviour, "b", rows));
    var g2 = el("div", { "class": "grid2" });
    S.situ.forEach(function (q) { g2.appendChild(distBlock(q.q, rows, function (r) { return r[q.id]; }, q.opts, SELFDOC && SELFDOC[q.id])); });
    app.appendChild(g2);

    // adjectives: Johari window
    var words = S.adjectives.pos.concat(S.adjectives.neg), wc = {}, mine = (SELFDOC && Array.isArray(SELFDOC.adj)) ? SELFDOC.adj : [];
    words.forEach(function (w) { wc[w] = 0; });
    rows.forEach(function (r) { if (Array.isArray(r.adj)) r.adj.forEach(function (w) { if (Object.prototype.hasOwnProperty.call(wc, w)) wc[w]++; }); });
    var cut = Math.max(2, Math.ceil(rows.length * 0.2));
    function list(f) { return words.filter(f).sort(function (a, b) { return wc[b] - wc[a]; }).map(function (w) { return w + " (" + wc[w] + ")"; }).join(", ") || "none"; }
    var jw = card("Five words: Johari window");
    var jg = el("div", { "class": "grid2" });
    [["Open: chosen by you and by others", function (w) { return mine.indexOf(w) >= 0 && wc[w] >= cut; }, "open"],
     ["Blind: chosen by others, not by you", function (w) { return mine.indexOf(w) < 0 && wc[w] >= cut; }, "blind"],
     ["Hidden: chosen by you, rarely by others", function (w) { return mine.indexOf(w) >= 0 && wc[w] < cut; }, "unrec"],
     ["Chosen by few or none", function (w) { return mine.indexOf(w) < 0 && wc[w] < cut; }, ""]].forEach(function (x) {
      jg.appendChild(el("div", null, el("p", null, el("span", { "class": "tag " + x[2], text: x[0] })), el("p", { text: list(x[1]) })));
    });
    jw.appendChild(jg);
    jw.appendChild(el("p", { "class": "mute", text: "Number in brackets is how many respondents chose the word. A word counts as chosen by others when at least " + cut + " picked it." }));
    app.appendChild(jw);

    var wrows = rows.filter(function (r) { return r.rel === "client" || r.rel === "peer" || r.rel === "both"; });
    app.appendChild(itemTable("Work (" + wrows.length + " respondents who have worked with you)", S.work, "w", wrows));
    var g3 = el("div", { "class": "grid2" });
    g3.appendChild(distBlock("Compared with consultants of similar seniority", wrows, function (r) { return r.w_comp; }, S.comp.opts, SELFDOC && SELFDOC.w_comp));
    g3.appendChild(distBlock("Work they would think of you first for", wrows, function (r) { return r.first; }, S.first.opts, SELFDOC && SELFDOC.first));
    app.appendChild(g3);

    // outcomes
    var recs = rows.map(function (r) { return r.rec; }).filter(function (v) { return Number.isInteger(v) && v >= 0 && v <= 10; });
    var oc = card("Likelihood to recommend");
    oc.appendChild(el("div", { "class": "big", text: recs.length ? (recs.reduce(function (a, b) { return a + b; }, 0) / recs.length).toFixed(1) + " / 10" : "–" }));
    [["9 to 10, would actively recommend", 9, 10], ["7 to 8, passive", 7, 8], ["0 to 6, unlikely to recommend", 0, 6]].forEach(function (b) {
      var k = recs.filter(function (v) { return v >= b[1] && v <= b[2]; }).length, pct = recs.length ? Math.round(100 * k / recs.length) : 0;
      var m = el("div", { "class": "meter" }, el("i")); m.firstChild.style.width = pct + "%";
      oc.appendChild(el("div", { "class": "dist" }, el("span", { text: b[0] }), m, el("span", { "class": "mute", text: k + " (" + pct + "%)" })));
    });
    var g4 = el("div", { "class": "grid2" });
    g4.appendChild(oc);
    g4.appendChild(distBlock("Would work with you again (or would want to, if they have not yet)", rows, function (r) { return r.again; }, S.again.opts));
    g4.appendChild(distBlock("Main reservation (those with reservations)", rows, function (r) { return r.resv; }, S.resv.opts));
    g4.appendChild(distBlock(S.held.q, rows, function (r) { return r.held; }, S.held.opts));
    app.appendChild(g4);

    var g5 = el("div", { "class": "grid2" });
    g5.appendChild(distBlock("Who responded", rows, function (r) { return r.rel; }, S.ice[1].opts));
    g5.appendChild(distBlock("How long they have known you", rows, function (r) { return r.known; }, S.ice[0].opts));
    g5.appendChild(distBlock("In a game of cricket, where they place you", rows, function (r) { return r.cricket; }, S.ice[2].opts));
    app.appendChild(g5);
  }

  // ---- sample data for preview ----
  function sample() {
    function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }
    function row(self) {
      var b = {}, w = {}, r = {};
      S.behaviour.forEach(function (i) { var base = i.r ? (self ? 2 : 3) : (self ? 4 : 3); b[i.id] = Math.max(self ? 1 : 0, Math.min(5, base + rnd([-1, 0, 0, 1, 1]) + (!self && Math.random() < 0.08 ? -9 : 0))); });
      S.work.forEach(function (i) { w[i.id] = Math.max(1, Math.min(5, (i.r ? 2 : 4) + rnd([-1, 0, 0, 1]))); });
      var pool = S.adjectives.pos.concat(self ? S.adjectives.pos : S.adjectives.neg.slice(0, 5), S.adjectives.neg), adj = [];
      while (adj.length < 5) { var x = rnd(pool); if (adj.indexOf(x) < 0) adj.push(x); }
      r = { v: 1, b: b, s1: rnd(["once", "argue", "argue"]), s2: rnd(["private", "group", "group"]), adj: adj, w: w, w_comp: rnd(["best", "above", "above", "avg"]), first: [rnd(["baseline", "mne", "training"]), "audit"] };
      if (!self) {
        r.rel = rnd(["client", "client", "peer", "both", "social"]); r.known = rnd(["2to5", "5to10", "gt10"]); r.cricket = rnd(["captain", "umpire", "allrounder", "commentator"]);
        r.rec = rnd([5, 6, 7, 8, 8, 9, 10]); r.again = rnd(["yes", "yes", "reservations", "reservations", "no"]); r.resv = r.again === "yes" ? "" : rnd(["manner", "manner", "nowork", "unsure"]); r.held = rnd(["yes", "no", "no"]);
        if (r.rel === "social") { r.w = {}; r.w_comp = ""; r.first = []; }
      } else r.s1 = "once", r.s2 = "private";
      return r;
    }
    for (var i = 0; i < 11; i++) ALL.push(row(false));
    SELFDOC = row(true);
  }

  function login() {
    app.innerHTML = "";
    var c = card();
    c.appendChild(el("h1", { text: "Feedback results" }));
    c.appendChild(el("p", { "class": "mute", text: "Sign in with the account created in Firebase Authentication." }));
    var em = el("input", { type: "email", placeholder: "Email", autocomplete: "username" });
    var pw = el("input", { type: "password", placeholder: "Password", autocomplete: "current-password" });
    var err = el("p", { "class": "err" }), b = el("button", { "class": "btn", type: "button", text: "Sign in" });
    b.addEventListener("click", function () {
      b.disabled = true; err.textContent = "";
      Promise.all([import(FB + "firebase-app.js"), import(FB + "firebase-firestore.js"), import(FB + "firebase-auth.js")]).then(function (m) {
        var a = m[0].initializeApp(CFG), db = m[1].getFirestore(a);
        return m[2].signInWithEmailAndPassword(m[2].getAuth(a), em.value.trim(), pw.value).then(function () {
          return Promise.all([m[1].getDocs(m[1].collection(db, "responses")), m[1].getDoc(m[1].doc(db, "self", "me"))]);
        });
      }).then(function (res) {
        // Only the answers are kept in memory, shuffled, so document order and ids are never shown.
        res[0].forEach(function (d) { ALL.push(d.data()); });
        ALL.sort(function () { return Math.random() - 0.5; });
        SELFDOC = res[1].exists() ? res[1].data() : null;
        render();
      }).catch(function (e) {
        err.textContent = (e && e.code && String(e.code).indexOf("auth/") === 0) ? "Sign-in failed. Check the email and password." : "Signed in, but the data could not be read. Check that the published security rules contain your email.";
        b.disabled = false;
      });
    });
    c.appendChild(em); c.appendChild(pw); c.appendChild(err); c.appendChild(b);
    app.appendChild(c);
  }

  if (PREVIEW) { sample(); render(); } else login();
})();
