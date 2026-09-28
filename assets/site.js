/* flickeep.com: the links, the page's small motions, and a deck of prints to try. */
(() => {
  "use strict";
  window.flickeepReady = true;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const still = () => motion.matches;
  const store = window.FLICKEEP || { id: "", pt: "" };

  /* ——— App Store links: a campaign token per button, counted by App Store Connect ——— */
  const storeURL = ct => !store.id ? "/get"
    : store.pt ? `https://apps.apple.com/app/apple-store/id${store.id}?pt=${store.pt}&ct=${encodeURIComponent(ct)}&mt=8`
    : `https://apps.apple.com/app/id${store.id}`;
  const link = (root = document) => $$("[data-ct]", root).forEach(a => { a.href = storeURL(a.dataset.ct); });
  link();

  /* ——— Navigation: a little firmer once the page moves ——— */
  const nav = $(".nav");
  if (nav) {
    const solid = () => nav.classList.toggle("solid", scrollY > 8);
    addEventListener("scroll", solid, { passive: true });
    solid();
  }

  /* ——— Things rise out of a little blur as they arrive ——— */
  const reveal = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    reveal.unobserve(e.target);
  }), { rootMargin: "0px 0px -8% 0px", threshold: .12 });
  $$(".rv").forEach(el => reveal.observe(el));

  /* ——— The headline develops once; then the mask goes ——— */
  const title = $(".hero h1.dev");
  if (title) {
    if (still()) title.classList.remove("dev");
    else title.addEventListener("animationend", () => title.classList.remove("dev"), { once: true });
  }

  /* ——— The field: prints at three depths; they lean toward the pointer and part as you scroll ——— */
  const hero = $(".hero"), field = hero && $(".field", hero);
  if (field) {
    // Each print develops once its photo is here: blank paper first, then the dots grow.
    $$(".fp .ph", field).forEach((ph, i) => {
      const img = $("img", ph);
      const go = () => {
        if (still()) { ph.classList.add("done"); return; }
        ph.style.setProperty("--delay", `${(.3 + (i * .37) % 1.2).toFixed(2)}s`);
        ph.classList.add("developing");
        ph.addEventListener("animationend", () => { ph.classList.add("done"); ph.classList.remove("developing"); }, { once: true });
      };
      img.complete && img.naturalWidth ? go() : img.addEventListener("load", go, { once: true });
    });
    let mx = 0, my = 0, tx = 0, ty = 0, raf = 0, near = true;
    const frame = () => {
      raf = 0;
      mx += (tx - mx) * .07;
      my += (ty - my) * .07;
      field.style.setProperty("--mx", mx.toFixed(3));
      field.style.setProperty("--my", my.toFixed(3));
      field.style.setProperty("--sy", `${Math.min(scrollY, 1600).toFixed(1)}px`);
      if (Math.abs(tx - mx) + Math.abs(ty - my) > .004) raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf && near && !still()) raf = requestAnimationFrame(frame); };
    addEventListener("pointermove", e => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX / innerWidth * 2 - 1;
      ty = e.clientY / innerHeight * 2 - 1;
      kick();
    }, { passive: true });
    addEventListener("scroll", kick, { passive: true });
    new IntersectionObserver(([e]) => { near = e.isIntersecting; }).observe(hero);
  }

  /* ——— The app, playing: short clips of the sample library, loaded when they come near ——— */
  const load = v => { if (!v.getAttribute("src")) { v.src = v.dataset.src; v.load(); } };
  const play = v => {
    if (still()) return;
    load(v);
    const p = v.play();
    if (p) p.catch(() => {});
  };
  const pause = v => { if (!v.paused) v.pause(); };

  /* ——— How it works: the phone plays the step you're reading ——— */
  const story = $(".story");
  if (story) {
    const steps = $$(".step", story), clips = $$(".story-side video", story), cards = $$(".step video", story);
    const narrow = matchMedia("(max-width: 900px)");
    let active = 0, inView = false;
    const sync = () => {
      clips.forEach((v, k) => {
        v.classList.toggle("on", k === active);
        if (k === active && inView && !narrow.matches) play(v); else pause(v);
      });
    };
    const show = i => {
      if (i === active && steps[i].classList.contains("on")) return;
      steps.forEach((s, k) => s.classList.toggle("on", k === i));
      active = i;
      const v = clips[i];
      if (v && v.readyState > 0) v.currentTime = 0;
      sync();
    };
    const stepWatch = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) show(steps.indexOf(e.target));
    }), { rootMargin: "-46% 0px -46% 0px" });
    steps.forEach(s => stepWatch.observe(s));
    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView && !narrow.matches && clips[active]) load(clips[active]);
      sync();
    }, { rootMargin: "300px 0px" }).observe(story);
    // On a phone each step has its own phone; the one in view plays.
    const cardWatch = new IntersectionObserver(entries => entries.forEach(e => {
      if (!narrow.matches) return;
      e.intersectionRatio > .6 ? play(e.target) : pause(e.target);
    }), { threshold: [0, .6, 1] });
    cards.forEach(v => cardWatch.observe(v));
    narrow.addEventListener("change", () => { cards.forEach(pause); sync(); });
    show(0);
    // The dots under the steps on a phone.
    const list = $(".steps", story), pager = $(".pager", story);
    if (list && pager && steps.length > 1) {
      pager.innerHTML = steps.map(() => "<i></i>").join("");
      const dots = $$("i", pager);
      const update = () => {
        const span = steps[1].offsetLeft - steps[0].offsetLeft || 1;
        const i = Math.max(0, Math.min(dots.length - 1, Math.round(list.scrollLeft / span)));
        dots.forEach((d, k) => d.classList.toggle("on", k === i));
      };
      list.addEventListener("scroll", update, { passive: true });
      update();
    }
  }

  /* ——— A few words, lit as you read them ——— */
  const words = $(".words p");
  if (words) {
    const wrap = node => {
      for (const n of Array.from(node.childNodes)) {
        if (n.nodeType === 1) { wrap(n); continue; }
        if (n.nodeType !== 3) continue;
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (/^\s+$/.test(t)) { frag.append(t); return; }
          const w = document.createElement("span");
          w.className = "w";
          w.textContent = t;
          frag.append(w);
        });
        n.replaceWith(frag);
      }
    };
    wrap(words);
    const ws = $$(".w", words);
    let lit = -1, raf = 0;
    const light = () => {
      raf = 0;
      const r = words.getBoundingClientRect(), vh = innerHeight;
      const p = Math.max(0, Math.min(1, (vh * .8 - r.top) / (r.height + vh * .25)));
      const n = Math.round(p * ws.length);
      if (n === lit) return;
      lit = n;
      ws.forEach((w, i) => w.classList.toggle("lit", i < n));
    };
    addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(light); }, { passive: true });
    light();
  }

  /* ——— On phones, a small bar once the first button has scrolled away ——— */
  const bar = $(".bar"), heroCta = $(".hero .cta"), final = $(".final");
  if (bar && heroCta && final) {
    let past = false, end = false;
    const update = () => bar.classList.toggle("show", past && !end);
    new IntersectionObserver(([e]) => { past = !e.isIntersecting && e.boundingClientRect.top < 0; update(); }).observe(heroCta);
    new IntersectionObserver(([e]) => { end = e.isIntersecting; update(); }, { rootMargin: "0px 0px -25% 0px" }).observe(final);
  }

  /* ——— The deck ——— */
  const deck = $("[data-deck]");
  if (deck) Deck(deck);

  function Deck(root) {
    // Sample photos from the app's sample library (Unsplash License); the backs are written the way flickeep writes them.
    const PRINTS = [
      { img: "coast", alt: "Waves on a rocky shore at dusk", day: "Jan 9, 2026", time: "5:12 PM", lines: ["Hvar, Croatia", "A Friday evening", "One of 3 photos that day"], coord: "43.173° N · 16.441° E" },
      { img: "dogbeach", alt: "A dog running along the beach at sunset", day: "Jan 6, 2026", time: "4:48 PM", lines: ["Huntington Beach, California", "A Tuesday afternoon", "One of 2 photos that day"], coord: "33.660° N · 117.999° W" },
      { img: "fruitmarket", alt: "Fruit piled high at a market stall", day: "Dec 22, 2025", time: "10:21 AM", lines: ["A Monday morning", "The only photo that day"] },
      { img: "autumnpath", alt: "A path covered in autumn leaves", day: "Dec 21, 2025", time: "3:06 PM", lines: ["Zürich, Switzerland", "A Sunday afternoon", "One of 2 photos that day"], coord: "47.377° N · 8.542° E" },
      { img: "breakfast", alt: "A croissant and a flat white on a wooden table", day: "Jan 8, 2026", time: "9:14 AM", lines: ["A Thursday morning", "One of 3 photos that day"] },
      { img: "bicycle", alt: "A bicycle leaning against a tree in a square", day: "Jan 7, 2026", time: "1:40 PM", lines: ["Malmö, Sweden", "A Wednesday afternoon", "One of 3 photos that day"], coord: "55.605° N · 13.004° E" },
      { img: "catwindow", alt: "A cat's paws on a windowsill", day: "Jan 7, 2026", time: "8:02 PM", lines: ["A Wednesday evening", "One of 3 photos that day"] },
      { img: "aerialbeach", alt: "Turquoise water over rocks, seen from above", day: "Jan 8, 2026", time: "12:30 PM", lines: ["Sagres, Portugal", "A Thursday afternoon", "One of 3 photos that day"], coord: "37.008° N · 8.940° W" }
    ];
    const N = PRINTS.length;
    const TINTS = ["#ffc2dc", "#bff5cf", "#d3c2ff"];
    const stack = $(".stack", root), fields = $$(".deck-field i", root), tally = $(".deck-tally", root), say = $("[data-live]", root);
    const help = tally.textContent;
    const vKeep = $(".verdict.keep", root), vGo = $(".verdict.go", root);
    const buttons = $$(".deck-tools button", root);
    const cards = new Map();
    const grains = new WeakMap();
    let pos = 0, kept = 0, gone = 0, field = 0, touched = false, started = 0, hints = 0, hintTimer = 0, inView = false, drag = null;

    const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
    const make = html => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };

    function printCard(p) {
      const lines = [0, 1, 2].map(k => `<p>${p.lines[k] ? esc(p.lines[k]) : "&nbsp;"}</p>`).join("");
      return make(`<div class="print" role="img">
        <div class="flip">
          <div class="face front"><div class="paper"><div class="photo"><img src="/img/p/${p.img}.webp" alt="" draggable="false" decoding="async"></div><i class="sheen"></i></div></div>
          <div class="face back">
            <div class="back-top"><div><div class="back-day">${esc(p.day)}</div><div class="back-time">${esc(p.time)}</div></div><div class="stamp"><img src="/img/p/${p.img}.webp" alt="" draggable="false" decoding="async"></div></div>
            <div class="back-lines">${lines}</div>
            <div class="back-coord"${p.coord ? "" : ' style="visibility:hidden"'}>${esc(p.coord || "·")}</div>
            <div class="back-foot"><span>More details</span><span>Share ↗</span></div>
          </div>
        </div></div>`);
    }

    function endCard() {
      const node = make(`<div class="print end">
        <div class="flip"><div class="face">
          <p class="kicker">All caught up</p>
          <h3>Now, your own.</h3>
          <p data-sum></p>
          <div class="row">
            <a class="pill big when-live" data-ct="deck-end">Get flickeep</a>
            <span class="pill big quiet when-soon">Coming soon to the App Store</span>
            <button class="pill ghost" type="button" data-again>Shuffle again</button>
          </div>
        </div></div></div>`);
      link(node);
      $("[data-again]", node).addEventListener("click", again);
      return node;
    }

    function cardAt(k) {
      if (k > N) return null;
      let node = cards.get(k);
      if (!node) {
        node = k === N ? endCard() : printCard(PRINTS[k]);
        node.dataset.d = "3";
        node.style.setProperty("--s", k % 2 ? -1 : 1);
        stack.appendChild(node);
        cards.set(k, node);
        node.getBoundingClientRect();
      }
      return node;
    }

    function layout() {
      for (let d = 0; d < 4; d++) {
        const k = pos + d, node = cardAt(k);
        if (!node) continue;
        node.dataset.d = String(d);
        node.style.setProperty("--s", d === 0 ? 0 : (k % 2 ? -1 : 1));
        node.toggleAttribute("inert", d !== 0);
        if (d === 0 && k < N) node.setAttribute("aria-label", PRINTS[k].alt);
      }
      const p = PRINTS[pos];
      if (p && fields.length === 2) {
        const next = fields[field ^ 1];
        next.style.backgroundImage = `url(/img/p/${p.img}-field.webp)`;
        next.classList.add("on");
        fields[field].classList.remove("on");
        field ^= 1;
      }
      buttons.forEach(b => { b.disabled = pos >= N; });
      if (pos >= N) {
        const secs = Math.max(1, Math.round((performance.now() - started) / 1000));
        const sum = $("[data-sum]", cards.get(N));
        if (sum) sum.textContent = `You kept ${kept} and let ${gone} go, in ${secs} seconds. Your own photos are waiting.`;
      }
    }

    function count() {
      tally.textContent = kept + gone ? `Kept ${kept} · Let go ${gone}` : help;
    }

    /* The print follows the finger: turned a little in depth, like a card going into Wallet. */
    function pose(dx, dy, W) {
      const p = Math.max(-1.2, Math.min(1.2, dx / W));
      return `translate3d(${dx}px,${dy * .1}px,0) rotateY(${-p * 16}deg) rotate(${p * 5}deg)`;
    }
    function verdicts(p) {
      vKeep.style.opacity = Math.max(0, Math.min(1, (p - .06) / .22));
      vGo.style.opacity = Math.max(0, Math.min(1, (-p - .06) / .22));
    }

    /* Letting go: the print comes apart into dots, from the left edge. */
    class Grain {
      constructor(node) {
        this.node = node;
        this.paper = $(".paper", node);
        this.img = $(".photo img", node);
        this.F = 0;
        this.ready = false;
      }
      prepare() {
        if (this.ready) return true;
        const img = this.img;
        if (!img.complete || !img.naturalWidth) return false;
        const W = this.paper.offsetWidth, H = this.paper.offsetHeight;
        const cell = W < 300 ? 6 : 5;
        const cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
        const sample = document.createElement("canvas");
        sample.width = cols; sample.height = rows;
        const c = sample.getContext("2d", { willReadFrequently: true });
        c.fillStyle = "#F6F4EF";
        c.fillRect(0, 0, cols, rows);
        const pad = W * .044 / cell, pw = cols - 2 * pad, ph = (H - 2 * W * .044) / cell;
        const iw = img.naturalWidth, ih = img.naturalHeight, s = Math.max(pw / iw, ph / ih);
        const sw = pw / s, sh = ph / s;
        c.imageSmoothingQuality = "high";
        c.drawImage(img, (iw - sw) / 2, (ih - sh) / 2, sw, sh, pad, pad, pw, ph);
        let data;
        try { data = c.getImageData(0, 0, cols, rows).data; } catch { return false; }
        const n = cols * rows;
        Object.assign(this, { W, H, cell, cols, rows, band: W * .38, x: new Float32Array(n), y: new Float32Array(n), a: new Float32Array(n), b: new Float32Array(n), c: new Float32Array(n), edge: new Uint8Array(n), color: new Array(n) });
        for (let i = 0, q = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++, q++) {
            const o = (j * cols + i) * 4;
            this.x[q] = (i + .5) * cell;
            this.y[q] = (j + .5) * cell;
            this.color[q] = `rgb(${data[o]},${data[o + 1]},${data[o + 2]})`;
            this.a[q] = Math.random(); this.b[q] = Math.random(); this.c[q] = Math.random();
            this.edge[q] = i + .5 < pad || i + .5 > cols - pad || j + .5 < pad || j + .5 > pad + ph ? 1 : 0;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.className = "grain";
        const dpr = Math.min(2, devicePixelRatio || 1);
        canvas.width = Math.round(W * 1.8 * dpr);
        canvas.height = Math.round(H * 1.44 * dpr);
        $(".front", this.node).appendChild(canvas);
        this.ctx = canvas.getContext("2d");
        this.ctx.setTransform(dpr, 0, 0, dpr, W * .8 * dpr, H * .22 * dpr);
        this.ready = true;
        return true;
      }
      /* F: how far the dots have reached from the left edge; scatter: the release. */
      draw(F, scatter = 0) {
        this.F = F;
        const { ctx, W, H, cell, band, rows } = this;
        ctx.clearRect(-W * .8, -H * .22, W * 1.8, H * 1.44);
        this.paper.style.clipPath = F > 0 ? `inset(0 0 0 ${Math.min(F, W + 2)}px)` : "";
        if (F <= 0) return;
        const R = cell * .74, last = Math.min(this.cols, Math.ceil(F / cell));
        for (let i = 0, q = 0; i < last; i++) {
          for (let j = 0; j < rows; j++, q++) {
            let t = (F - this.x[q]) / band;
            if (t <= 0) continue;
            if (t > 1) t = 1;
            const a = this.a[q], b = this.b[q], c = this.c[q], e = t * t;
            let alpha = (1 - t * .3) * (1 - scatter);
            if (this.edge[q]) alpha *= 1 - Math.min(1, t * 1.5);
            const r = R * (1 - t * (.62 - .3 * a)) * (1 - .5 * scatter);
            if (alpha < .02 || r < .2) continue;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = t > .25 && a > .985 ? "#fff" : t > .25 && a > .968 ? TINTS[(b * 3) | 0] : this.color[q];
            ctx.beginPath();
            ctx.arc(this.x[q] - e * (18 + 70 * b) - scatter * (70 + 170 * b), this.y[q] + (c - .5) * e * 26 - scatter * (24 + 70 * c), r, 0, 6.2832);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      }
    }
    function grainFor(node) {
      let g = grains.get(node);
      if (!g || (g.ready && g.W !== $(".paper", node).offsetWidth)) { g = new Grain(node); grains.set(node, g); }
      return g.prepare() ? g : null;
    }

    function run(ms, frame) {
      return new Promise(done => {
        const t0 = performance.now();
        const tick = now => {
          const t = Math.min(1, (now - t0) / ms);
          frame(t, now - t0);
          t < 1 ? requestAnimationFrame(tick) : done();
        };
        requestAnimationFrame(tick);
      });
    }

    function leaveKeep(node, dx, dy) {
      const W = node.offsetWidth, from = pose(dx, dy, W);
      node.classList.add("held");
      if (still()) {
        node.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" }).finished.then(() => node.remove());
        return;
      }
      // Lifted, a gleam across it, then away to the right.
      node.animate([
        { transform: from, "--sheen": "-160%", opacity: 1 },
        { transform: `translate3d(${dx + W * .08}px,${-W * .03}px,0) rotateY(-10deg) rotate(2deg) scale(1.04)`, "--sheen": "40%", opacity: 1, offset: .34 },
        { transform: `translate3d(${W * 1.05}px,${-W * .07}px,0) rotateY(-20deg) rotate(9deg) scale(1.01)`, "--sheen": "150%", opacity: 1, offset: .8 },
        { transform: `translate3d(${W * 1.4}px,${-W * .09}px,0) rotateY(-24deg) rotate(11deg) scale(1)`, "--sheen": "170%", opacity: 0 }
      ], { duration: 680, easing: "cubic-bezier(.45,.05,.35,1)", fill: "forwards" }).finished.then(() => node.remove());
    }

    async function leaveGo(node, dx, dy, grain) {
      const W = node.offsetWidth;
      node.classList.add("held");
      if (still() || node.classList.contains("turned") || !(grain || (grain = grainFor(node)))) {
        node.animate([{ transform: pose(dx, dy, W), opacity: 1 }, { transform: `translate3d(${dx - W * .25}px,0,0)`, opacity: 0 }], { duration: 320, easing: "ease-out", fill: "forwards" }).finished.then(() => node.remove());
        return;
      }
      // What's left comes apart, then the whole cloud drifts up and away to the left.
      const F0 = grain.F, full = grain.W + grain.band;
      await run(980, (_, ms) => {
        const a = Math.min(1, ms / 340), ea = 1 - Math.pow(1 - a, 3);
        const b = Math.max(0, Math.min(1, (ms - 180) / 780)), eb = b * b * (3 - 2 * b);
        node.style.transform = pose(dx - W * .12 * ea - W * .08 * eb, dy, W);
        grain.draw(F0 + (full - F0) * ea, eb);
      });
      node.remove();
    }

    function decide(kind, d) {
      if (pos >= N) return;
      if (!started) started = performance.now();
      const node = cards.get(pos);
      cards.delete(pos);
      node.classList.add("out");
      node.setAttribute("inert", "");
      stopHint();
      const dx = d ? d.dx : 0, dy = d ? d.dy : 0;
      kind === "keep" ? kept++ : gone++;
      const p = PRINTS[pos];
      pos++;
      layout();
      count();
      say.textContent = `${kind === "keep" ? "Kept" : "Let go"}: ${p.alt}.`;
      if (kind === "keep") leaveKeep(node, dx, dy);
      else leaveGo(node, dx, dy, d && d.grain);
    }

    function turn() {
      const node = cards.get(pos);
      if (!node || pos >= N) return;
      stopHint();
      const on = node.classList.toggle("turned");
      const p = PRINTS[pos];
      say.textContent = on ? `The back: ${p.day}, ${p.time}. ${p.lines.join(". ")}.` : `The front: ${p.alt}.`;
    }

    function settle(d) {
      const node = d.node;
      node.classList.remove("held");
      node.style.transform = "";
      node.style.removeProperty("--sheen");
      const g = d.grain;
      if (g && g.F > 0) {
        const F0 = g.F;
        run(260, t => g.draw(F0 * (1 - t) * (1 - t)));
      }
    }

    function again() {
      cards.forEach(n => n.remove());
      cards.clear();
      pos = kept = gone = started = 0;
      count();
      layout();
      develop();
      stack.focus({ preventScroll: true });
    }

    function develop() {
      if (still()) return;
      [0, 1, 2].forEach((k, n) => {
        const node = cards.get(k);
        if (!node) return;
        node.style.setProperty("--delay", `${[.2, .5, .62][n]}s`);
        // Develop once the photo is here, not over an empty frame.
        const img = $(".photo img", node);
        const go = () => {
          node.classList.add("developing");
          $(".photo", node).addEventListener("animationend", () => node.classList.remove("developing"), { once: true });
        };
        img.complete && img.naturalWidth ? go() : img.addEventListener("load", go, { once: true });
      });
    }

    /* A gentle nudge, twice at most, until someone tries it. */
    function hint() {
      if (touched || still() || pos !== 0 || hints >= 2) return;
      if (!inView) { hintTimer = setTimeout(hint, 1200); return; }
      const node = cards.get(0);
      node.classList.add("nudge");
      node.addEventListener("animationend", () => node.classList.remove("nudge"), { once: true });
      hints++;
      hintTimer = setTimeout(hint, 8000);
    }
    function stopHint() {
      touched = true;
      root.classList.add("touched");
      clearTimeout(hintTimer);
      const node = cards.get(pos);
      if (node) node.classList.remove("nudge");
    }
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; }, { threshold: .6 }).observe(stack);

    /* Pointer: drag to keep or let go, tap to turn over. Vertical moves stay with the page. */
    stack.addEventListener("pointerdown", e => {
      if (e.button > 0 || pos >= N || drag) return;
      const node = cards.get(pos);
      if (!node || !node.contains(e.target)) return;
      stopHint();
      drag = { id: e.pointerId, node, x0: e.clientX, y0: e.clientY, t0: e.timeStamp, dx: 0, dy: 0, moved: false, W: node.offsetWidth, vx: 0, lx: e.clientX, lt: e.timeStamp, grain: null };
      try { stack.setPointerCapture(e.pointerId); } catch {}
    });
    stack.addEventListener("pointermove", e => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
      if (!drag.moved) {
        if (Math.hypot(dx, dy) < 7) return;
        if (e.pointerType !== "mouse" && Math.abs(dy) > Math.abs(dx) * 1.2) { drag = null; return; }
        drag.moved = true;
        drag.node.classList.add("held");
        root.classList.add("judging");
        if (!started) started = performance.now();
      }
      const dt = e.timeStamp - drag.lt;
      if (dt > 0) drag.vx = .7 * ((e.clientX - drag.lx) / dt) + .3 * drag.vx;
      drag.lx = e.clientX; drag.lt = e.timeStamp;
      drag.dx = dx; drag.dy = dy;
      const p = dx / drag.W;
      drag.node.style.transform = pose(dx, dy, drag.W);
      drag.node.style.setProperty("--sheen", `${-160 + Math.min(1, Math.abs(p)) * 280}%`);
      verdicts(p);
      if (still() || drag.node.classList.contains("turned")) return;
      if (dx < 0) {
        drag.grain = drag.grain || grainFor(drag.node);
        if (drag.grain) drag.grain.draw(Math.min(1, -dx / (drag.W * .9)) * .95 * (drag.grain.W + drag.grain.band));
      } else if (drag.grain && drag.grain.F > 0) drag.grain.draw(0);
    });
    const release = e => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      root.classList.remove("judging");
      verdicts(0);
      if (!d.moved) {
        if (e.type === "pointerup" && e.timeStamp - d.t0 < 500) turn();
        return;
      }
      const flick = Math.abs(d.vx) > .5;
      if (d.dx > d.W * .32 || (flick && d.vx > 0 && d.dx > 24)) decide("keep", d);
      else if (d.dx < -d.W * .32 || (flick && d.vx < 0 && d.dx < -24)) decide("go", d);
      else settle(d);
    };
    stack.addEventListener("pointerup", release);
    stack.addEventListener("pointercancel", release);
    stack.addEventListener("keydown", e => {
      if (e.key === "ArrowRight") { e.preventDefault(); decide("keep"); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); decide("go"); }
      else if (e.key === " " || e.key === "Enter") { e.preventDefault(); turn(); }
    });
    buttons.forEach(b => b.addEventListener("click", () => {
      const act = b.dataset.act;
      if (act === "turn") turn(); else decide(act);
    }));

    layout();
    count();
    develop();
    hintTimer = setTimeout(hint, 2800);
  }
})();
