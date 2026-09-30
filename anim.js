/* NORTHPOINT · capa de movimiento
   GSAP + ScrollTrigger para las animaciones atadas al scroll, Lenis para el scroll suave.
   Todo arranca desde el estado visible: si algo falla, la página se ve normal. */
(function(){
  const root = document.documentElement;
  const ready = () => root.classList.add("anim-ready");
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if(!window.gsap || !window.ScrollTrigger || RM){ ready(); return; }
  gsap.registerPlugin(ScrollTrigger);
  const $ = (s, c=document) => c.querySelector(s), $$ = (s, c=document) => [...c.querySelectorAll(s)];
  const FINE = matchMedia("(pointer:fine)").matches;
  const DESK = matchMedia("(min-width: 900px)");
  const EASE = "power3.out";

  // ── scroll suave ──
  let lenis = null;
  if(window.Lenis){
    lenis = new Lenis({ lerp: 0.14, smoothWheel: true, wheelMultiplier: 1 });
    window.__lenis = lenis;   // para pruebas
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener("click", e => {
      const id = a.getAttribute("href"); const el = id.length > 1 && $(id);
      if(el){ e.preventDefault(); lenis.scrollTo(el, { offset: -8, duration: 1.4 }); }
    }));
  }

  // ── partir texto en palabras (respeta enlaces y negritas dentro) ──
  function split(el, mode="w"){
    if(el.dataset.split) return $$(mode==="ch" ? ".ch" : ".w>i", el);
    el.dataset.split = 1;
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if(n.nodeType === 3){
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(t => {
            if(!t) return;
            if(/^\s+$/.test(t)){ frag.appendChild(document.createTextNode(" ")); return; }
            if(mode === "ch"){ [...t].forEach(c => { const s = document.createElement("span"); s.className = "ch"; s.textContent = c; frag.appendChild(s); }); }
            else { const w = document.createElement("span"); w.className = "w"; const i = document.createElement("i"); i.textContent = t; w.appendChild(i); frag.appendChild(w); }
          });
          n.replaceWith(frag);
        } else if(n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    return $$(mode==="ch" ? ".ch" : ".w>i", el);
  }

  // ── 1. portada: entrada y recorrido fijo por las 4 divisiones ──
  const hero = $(".hero");
  let heroEnd = 0;
  if(hero && $(".hs", hero)){
    const slides = $$(".hs", hero), idx = $$(".hs-index button", hero), first = slides[0];
    const h1 = $("h1", first), chars = h1 ? split(h1, "ch") : [$("h2", first)], lw = split($(".lead", first));   // si la primera diapositiva no es la de NORTHPOINT, su título entra completo
    ready();
    gsap.timeline({ defaults:{ ease: EASE } })
      .from($(".hs-bg", first), { scale: 1.18, duration: 2.4, ease: "power2.out" }, 0)
      .from($(".eyebrow", first), { y: 16, opacity: 0, duration: .8 }, .25)
      .from(chars, { yPercent: 110, opacity: 0, rotateX: -60, stagger: .045, duration: 1.1 }, .35)
      .from(lw, { yPercent: 100, opacity: 0, stagger: .012, duration: .8 }, .8)
      .from($(".btn", first), { y: 20, opacity: 0, duration: .8 }, 1.1)
      .from(".hs-index button", { x: 30, opacity: 0, stagger: .08, duration: .8 }, 1)
      .from(".hs-arrows button", { scale: .6, opacity: 0, stagger: .08, duration: .6 }, 1.2);
    // carrusel horizontal que rota solo y en bucle: al final va una copia de la primera división
    // y al llegar a ella se regresa a la primera sin que se note
    const stage = $(".hs-stage", hero), n = slides.length;
    const clone = slides[0].cloneNode(true); clone.setAttribute("aria-hidden", "true"); clone.classList.add("hs-clone");
    clone.querySelectorAll("a,button").forEach(x => x.tabIndex = -1); stage.appendChild(clone);
    const W = () => stage.clientWidth || 1, pos = () => Math.round(stage.scrollLeft / W());
    let cur = 0, auto = null, pausa = null, settle = null;
    const go = i => { stage.classList.remove("drag"); stage.scrollTo({ left: Math.max(0, Math.min(n, i)) * W(), behavior: "smooth" }); };
    const enter = s => { gsap.fromTo([...$(".box", s).children], { y: 50, opacity: 0 }, { y: 0, opacity: 1, stagger: .07, duration: .8, ease: EASE, overwrite: true });
                         gsap.fromTo($(".hs-bg", s), { scale: 1.15 }, { scale: 1, duration: 1.8, ease: "power2.out", overwrite: "auto" }); };
    const mark = () => {
      const r = pos(), i = r % n;
      idx.forEach((b, k) => b.classList.toggle("on", k === i));
      if(i !== cur){ cur = i; enter(r === n ? clone : slides[i]); }
      clearTimeout(settle);
      settle = setTimeout(() => { if(pos() === n){ stage.classList.add("drag"); stage.scrollLeft = 0; requestAnimationFrame(() => stage.classList.remove("drag")); } }, 160);
    };
    stage.addEventListener("scroll", () => requestAnimationFrame(mark), { passive: true });
    // rota cada 5 s; si la persona toca, espera 6 s y sigue
    const DUR = 5;
    const run = () => { if(auto) auto.kill(); idx.forEach(b => gsap.set($("em", b), { scaleX: 0 }));
      auto = gsap.fromTo($("em", idx[cur]), { scaleX: 0 }, { scaleX: 1, duration: DUR, ease: "none", onComplete: () => { go(pos() + 1); gsap.delayedCall(1, run); } }); };
    const pause = () => { if(auto){ auto.kill(); auto = null; } clearTimeout(pausa); pausa = setTimeout(run, 6000); };
    gsap.delayedCall(2.4, run);
    document.addEventListener("visibilitychange", () => { if(!auto) return; document.hidden ? auto.pause() : auto.resume(); });
    idx.forEach((b, i) => b.addEventListener("click", () => { pause(); go(i); }));
    $$(".hs-arrows button", hero).forEach(b => b.addEventListener("click", () => { pause(); go(pos() + (+b.dataset.d)); }));
    ["touchstart", "pointerdown", "keydown"].forEach(ev => stage.addEventListener(ev, pause, { passive: true }));
    stage.addEventListener("wheel", e => { if(Math.abs(e.deltaX) > Math.abs(e.deltaY)) pause(); }, { passive: true });
    // arrastrar con el mouse
    let dragX = null, startL = 0;
    stage.addEventListener("pointerdown", e => { if(e.pointerType !== "mouse" || e.target.closest("a,button")) return; dragX = e.clientX; startL = stage.scrollLeft; stage.classList.add("drag"); });
    addEventListener("pointermove", e => { if(dragX === null) return; stage.scrollLeft = startL - (e.clientX - dragX); });
    addEventListener("pointerup", () => { if(dragX === null) return; const f = stage.scrollLeft / W(), d = f - Math.floor(f);
      stage.classList.remove("drag"); dragX = null; go(stage.scrollLeft > startL ? (d > .15 ? Math.ceil(f) : Math.floor(f)) : (d < .85 ? Math.floor(f) : Math.ceil(f))); });
    addEventListener("keydown", e => { const r = hero.getBoundingClientRect(); if(r.bottom < 100) return; if(e.key === "ArrowRight"){ pause(); go(pos() + 1); } if(e.key === "ArrowLeft"){ pause(); go(pos() - 1); } });
    // parallax vertical suave de la portada completa
    if(FINE){
      const bgs = $$(".hs-bg", hero);
      const qx = gsap.quickTo(bgs, "x", { duration: 1.2, ease: "power3" }), qy = gsap.quickTo(bgs, "y", { duration: 1.2, ease: "power3" });
      hero.addEventListener("mousemove", e => { qx((e.clientX/innerWidth - .5) * -28); qy((e.clientY/innerHeight - .5) * -18); });
    }
  } else ready();

  // ── 2. nav: vive en menu.js para que funcione también con "reducir movimiento" ──

  // ── 3. barra de progreso ──
  const bar = document.createElement("div"); bar.className = "progress"; document.body.appendChild(bar);
  gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: .3 } });

  // ── 4. la historia: frase que se enciende palabra por palabra ──
  $$(".intro .lead.serif, .banda h2").forEach(el =>
    gsap.from(el, { y: 36, opacity: 0, duration: 1.2, ease: EASE, scrollTrigger: { trigger: el, start: "top 88%", once: true } }));
  $$(".intro .lead:not(.serif)").forEach(el => gsap.from(el, { y: 30, opacity: 0, duration: 1, ease: EASE, scrollTrigger: { trigger: el, start: "top 88%" } }));

  // ── 5. cinta que acelera con la velocidad del scroll ──
  const track = $(".ticker-track");
  if(track){
    const loop = gsap.to(track, { xPercent: -50, duration: 38, ease: "none", repeat: -1 });
    let boost = gsap.quickTo(loop, "timeScale", { duration: .6, ease: "power2" });
    ScrollTrigger.create({ start: 0, end: "max", onUpdate: s => { const v = s.getVelocity(); boost(Math.max(-6, Math.min(6, 1 + v / 250))); clearTimeout(track._t); track._t = setTimeout(() => boost(1), 180); } });
  }

  // ── 6. títulos, eyebrows y párrafos entran al aparecer ──
  $$("section h2.serif, .anuncio h3.serif").forEach(h => {
    if(h.closest(".banda") || h.closest(".hero")) return;
    const w = split(h);
    gsap.from(w, { yPercent: 105, duration: 1, stagger: .035, ease: EASE, scrollTrigger: { trigger: h, start: "top 88%", once: true } });
  });
  $$("section .eyebrow, .anuncio .eyebrow").forEach(e => {
    if(e.closest(".hero")) return;
    gsap.from(e, { opacity: 0, letterSpacing: "0.5em", duration: 1.1, ease: EASE, scrollTrigger: { trigger: e, start: "top 92%", once: true } });
  });
  $$(".fund .lead, .sec-head p, .appsec .lead, .mesa .lead, .comp p, .registro p, .anuncio p, .anuncio .btn, .banda .btn, .mesa .link").forEach(p =>
    gsap.from(p, { y: 28, opacity: 0, duration: 1, ease: EASE, scrollTrigger: { trigger: p, start: "top 92%", once: true } }));

  // ── 7. "Cómo funciona": sección fija mientras avanzan los 4 pasos ──
  const pasos = $(".pasos"), como = $("#como");
  if(pasos && como){
    const line = document.createElement("i"); line.className = "pasos-line"; pasos.appendChild(line);
    const items = $$(".paso", pasos);
    gsap.to(line, { scaleX: 1, duration: 1.6, ease: "power2.inOut", scrollTrigger: { trigger: pasos, start: "top 82%", once: true } });
    gsap.from(items, { y: 40, opacity: 0, stagger: .15, duration: .9, ease: EASE, scrollTrigger: { trigger: pasos, start: "top 82%", once: true } });
  }

  // ── 8. la app: el iPhone sube y se endereza; la lista entra ──
  const phone = $(".iphone");
  if(phone){
    gsap.from(phone, { rotateX: 16, y: 90, opacity: 0, transformPerspective: 1400, duration: 1.3, ease: EASE, scrollTrigger: { trigger: "#app", start: "top 80%", once: true } });
    if(FINE){
      const rx = gsap.quickTo(phone, "rotateY", { duration: .8, ease: "power3" }), ry = gsap.quickTo(phone, "rotateX", { duration: .8, ease: "power3" });
      const box = phone.parentElement;
      box.addEventListener("mousemove", e => { const r = box.getBoundingClientRect(); rx((e.clientX - r.left)/r.width*14 - 7); ry(-((e.clientY - r.top)/r.height*10 - 5)); });
      box.addEventListener("mouseleave", () => { rx(0); ry(0); });
    }
  }
  $$(".appsec li").forEach((li, i) => gsap.from(li, { x: -40, opacity: 0, duration: .8, delay: i*.08, ease: EASE, scrollTrigger: { trigger: li, start: "top 92%" } }));

  // ── 9. tarjetas: entran escalonadas + números que cuentan ──
  const stagger = (sel, from) => $$(sel).forEach(g => {
    const kids = [...g.children];
    gsap.from(kids, { ...from, duration: 1, stagger: .12, ease: EASE, scrollTrigger: { trigger: g, start: "top 88%", once: true } });
  });
  stagger(".roles", { y: 60, opacity: 0 });
  // la mesa: íconos que se dibujan y pasos que se encienden en orden al bajar
  $$(".rol-ico").forEach(svg => {
    const paths = $$("path", svg);
    paths.forEach(p => { const L = p.getTotalLength(); gsap.set(p, { strokeDasharray: L, strokeDashoffset: L }); });
    gsap.to(paths, { strokeDashoffset: 0, duration: 1.4, stagger: .15, ease: "power2.inOut", scrollTrigger: { trigger: svg, start: "top 88%" } });
  });
  const flow = $(".roles.flow");
  if(flow){
    const rs = $$(".rol", flow);
    ScrollTrigger.create({ trigger: flow, start: "top 70%", end: "bottom 35%", onUpdate: self => {
      const n = Math.floor(self.progress * (rs.length + .5));
      rs.forEach((r, i) => r.classList.toggle("lit", i < n));
    }, onLeaveBack: () => rs.forEach(r => r.classList.remove("lit")) });
  }
  stagger("#perfilesGrid", { y: 80, opacity: 0, rotateX: 12, transformPerspective: 900 });
  stagger("#nivelesGrid", { y: 80, opacity: 0 });
  stagger("#cards", { y: 60, opacity: 0 });
  stagger(".fund-prog", { y: 70, opacity: 0 });
  const fimg = $(".fund-img img");
  if(fimg) gsap.fromTo(fimg, { scale: 1.25, yPercent: -6 }, { scale: 1, yPercent: 6, ease: "none", scrollTrigger: { trigger: ".fund-img", start: "top bottom", end: "bottom top", scrub: true } });
  const fcta = $(".fund-cta");
  if(fcta) gsap.from(fcta, { y: 50, opacity: 0, duration: 1, ease: EASE, scrollTrigger: { trigger: fcta, start: "top 90%" } });
  $$(".perfil .obj").forEach(el => {
    const m = el.textContent.match(/([+−-]?)(\d+(?:\.\d+)?)%/); if(!m) return;
    const end = parseFloat(m[2]), dec = (m[2].split(".")[1]||"").length, o = { v: 0 };
    gsap.to(o, { v: end, duration: 1.6, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 88%" },
      onUpdate: () => el.textContent = `${m[1]}${o.v.toFixed(dec)}%` });
  });

  // ── 10. inclinación 3D con brillo al pasar el mouse ──
  if(FINE){
    const tilt = el => {
      el.classList.add("tilt");
      const rx = gsap.quickTo(el, "rotateX", { duration: .5, ease: "power3" }), ry = gsap.quickTo(el, "rotateY", { duration: .5, ease: "power3" });
      gsap.set(el, { transformPerspective: 900 });
      el.addEventListener("mousemove", e => { const r = el.getBoundingClientRect(), px = (e.clientX - r.left)/r.width, py = (e.clientY - r.top)/r.height;
        ry((px - .5) * 10); rx(-(py - .5) * 8); el.style.setProperty("--gx", px*100 + "%"); el.style.setProperty("--gy", py*100 + "%"); });
      el.addEventListener("mouseleave", () => { rx(0); ry(0); });
    };
    // se aplica cuando ya existen (las tarjetas se generan con JS)
    requestAnimationFrame(() => $$(".perfil, .pq, .card, .rol, .fp, .svc").forEach(tilt));
  }

  // ── 11. banda y compromiso: parallax y recorte ──
  const banda = $(".banda");

  const cimg = $(".comp .grid>img");
  if(cimg){
    gsap.fromTo(cimg, { clipPath: "inset(10% 8% 10% 8%)", opacity: 0 }, { clipPath: "inset(0% 0% 0% 0%)", opacity: 1, duration: 1.4, ease: "power3.inOut",
      scrollTrigger: { trigger: cimg, start: "top 85%", once: true } });
  }

  // ── 12. simulador y registro ──
  const sim = $(".sim");
  if(sim) gsap.from(sim, { y: 70, opacity: 0, duration: 1.1, ease: EASE, scrollTrigger: { trigger: sim, start: "top 85%" } });
  $$(".kpis b").forEach(b => new MutationObserver(() => { b.classList.remove("pulse"); void b.offsetWidth; b.classList.add("pulse"); }).observe(b, { childList: true, characterData: true, subtree: true }));
  const form = $("#form");
  if(form) gsap.from(form, { y: 60, opacity: 0, duration: 1.1, ease: EASE, scrollTrigger: { trigger: form, start: "top 85%" } });
  $$(".oficinas .grid>div, footer p").forEach((d, i) => gsap.from(d, { y: 24, opacity: 0, duration: .8, delay: (i%3)*.08, ease: EASE, scrollTrigger: { trigger: d, start: "top 94%" } }));

  // ── 13. cursor propio + botones magnéticos ──
  if(FINE){
    root.classList.add("has-cursor");
    const dot = document.createElement("div"), ring = document.createElement("div");
    dot.className = "cur-dot"; ring.className = "cur-ring"; document.body.append(dot, ring);
    const dx = gsap.quickTo(dot, "x", { duration: .08 }), dy = gsap.quickTo(dot, "y", { duration: .08 });
    const rx = gsap.quickTo(ring, "x", { duration: .45, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: .45, ease: "power3" });
    addEventListener("mousemove", e => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); root.classList.remove("cur-out"); });
    document.addEventListener("mouseleave", () => root.classList.add("cur-out"));
    $$("iframe").forEach(f => { f.addEventListener("mouseenter", () => root.classList.add("cur-out")); f.addEventListener("mouseleave", () => root.classList.remove("cur-out")); });
    const hot = "a, button, .perfil, .pq, .card, select, input[type=range], label";
    document.addEventListener("mouseover", e => { if(e.target.closest(hot)) ring.classList.add("big"); });
    document.addEventListener("mouseout", e => { if(e.target.closest(hot)) ring.classList.remove("big"); });
    requestAnimationFrame(() => $$(".btn").forEach(b => {
      const mx = gsap.quickTo(b, "x", { duration: .5, ease: "power3" }), my = gsap.quickTo(b, "y", { duration: .5, ease: "power3" });
      b.addEventListener("mousemove", e => { const r = b.getBoundingClientRect(); mx((e.clientX - r.left - r.width/2) * .35); my((e.clientY - r.top - r.height/2) * .45); });
      b.addEventListener("mouseleave", () => { mx(0); my(0); });
    }));
  }

  // preguntas frecuentes: entrada escalonada y apertura suave
  const qas = $(".qas");
  if(qas){
    gsap.from([...qas.children], { y: 30, opacity: 0, stagger: .06, duration: .8, ease: EASE, scrollTrigger: { trigger: qas, start: "top 85%", once: true } });
    $$(".qa", qas).forEach(d => d.addEventListener("toggle", () => {
      if(d.open){ const a = $(".qa-a", d); gsap.fromTo(a, { height: 0, opacity: 0 }, { height: "auto", opacity: 1, duration: .45, ease: "power2.out" }); }
      ScrollTrigger.refresh();
    }));
  }

  // las fuentes y las imágenes cambian alturas: recalcular
  addEventListener("load", () => ScrollTrigger.refresh());
  if(document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
