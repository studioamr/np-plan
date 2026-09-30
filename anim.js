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
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
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

  // ── 1. hero: entrada + parallax con scroll y mouse ──
  const hero = $(".hero");
  if(hero){
    const h1 = $("h1", hero), eb = $(".eyebrow", hero), lead = $(".lead", hero), bg = $(".hero-bg", hero);
    const chars = split(h1, "ch"), lw = split(lead);
    ready();
    gsap.timeline({ defaults:{ ease: EASE } })
      .from(bg, { scale: 1.18, duration: 2.4, ease: "power2.out" }, 0)
      .from(eb, { y: 16, opacity: 0, duration: .8 }, .25)
      .from(chars, { yPercent: 110, opacity: 0, rotateX: -60, stagger: .045, duration: 1.1 }, .35)
      .from(lw, { yPercent: 100, opacity: 0, stagger: .012, duration: .8 }, .8);
    gsap.to(bg, { yPercent: 14, scale: 1.08, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    gsap.to($(".wrap", hero), { yPercent: -30, opacity: 0, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: true } });
    if(FINE){
      const qx = gsap.quickTo(bg, "x", { duration: 1.2, ease: "power3" }), qy = gsap.quickTo(bg, "y", { duration: 1.2, ease: "power3" });
      hero.addEventListener("mousemove", e => { const r = hero.getBoundingClientRect(); qx((e.clientX/r.width - .5) * -28); qy((e.clientY/r.height - .5) * -18); });
    }
  } else ready();

  // ── 2. nav: sólida después del hero, se esconde al bajar ──
  const nav = $("nav");
  if(nav){
    let last = 0;
    const navUp = y => {
      const past = y > (hero ? hero.offsetHeight - 80 : 60);
      nav.classList.toggle("solid", past);
      nav.classList.toggle("hide", past && y > last + 2);
      if(y < last - 2 || !past) nav.classList.remove("hide");
      last = y;
    };
    ScrollTrigger.create({ start: 0, end: "max", onUpdate: self => navUp(self.scroll()), onRefresh: self => navUp(self.scroll()) });
    addEventListener("load", () => navUp(scrollY));
  }

  // ── 3. barra de progreso ──
  const bar = document.createElement("div"); bar.className = "progress"; document.body.appendChild(bar);
  gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: .3 } });

  // ── 4. la historia: frase que se enciende palabra por palabra ──
  $$(".intro .lead.serif, .banda h2").forEach(el => {
    const w = split(el);
    gsap.fromTo(w, { opacity: .14 }, { opacity: 1, stagger: .08, ease: "none",
      scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 45%", scrub: true } });
  });
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
    gsap.from(w, { yPercent: 105, duration: 1, stagger: .035, ease: EASE, scrollTrigger: { trigger: h, start: "top 86%" } });
  });
  $$("section .eyebrow, .anuncio .eyebrow").forEach(e => {
    if(e.closest(".hero")) return;
    gsap.from(e, { opacity: 0, letterSpacing: "0.5em", duration: 1.1, ease: EASE, scrollTrigger: { trigger: e, start: "top 90%" } });
  });
  $$(".fund .lead, .sec-head p, .appsec .lead, .mesa .lead, .comp p, .registro p, .anuncio p, .anuncio .btn, .banda .btn, .mesa .link").forEach(p =>
    gsap.from(p, { y: 28, opacity: 0, duration: 1, ease: EASE, scrollTrigger: { trigger: p, start: "top 90%" } }));

  // ── 7. "Cómo funciona": sección fija mientras avanzan los 4 pasos ──
  const pasos = $(".pasos"), como = $("#como");
  if(pasos && como){
    const line = document.createElement("i"); line.className = "pasos-line"; pasos.appendChild(line);
    const items = $$(".paso", pasos);
    ScrollTrigger.matchMedia({
      "(min-width: 900px)": () => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: como, start: "top top", end: "+=170%", pin: true, scrub: .6, anticipatePin: 1 } });
        tl.to(line, { scaleX: 1, ease: "none", duration: items.length }, 0);
        items.forEach((p, i) => {
          tl.fromTo(p, { opacity: .12, y: 50 }, { opacity: 1, y: 0, duration: .6, ease: "power2.out" }, i)
            .fromTo($(".n", p), { color: "#B8C2D6" }, { color: "#2251FF", duration: .4 }, i);
        });
      },
      "(max-width: 899px)": () => {
        items.forEach(p => gsap.from(p, { y: 40, opacity: 0, duration: .9, ease: EASE, scrollTrigger: { trigger: p, start: "top 88%" } }));
        gsap.to(line, { scaleX: 1, ease: "none", scrollTrigger: { trigger: pasos, start: "top 85%", end: "bottom 50%", scrub: true } });
      }
    });
  }

  // ── 8. la app: el iPhone sube y se endereza; la lista entra ──
  const phone = $(".iphone");
  if(phone){
    gsap.fromTo(phone, { rotateX: 22, rotateZ: -4, y: 140, scale: .9, transformPerspective: 1400 },
      { rotateX: 0, rotateZ: 0, y: 0, scale: 1, ease: "none", scrollTrigger: { trigger: "#app", start: "top 95%", end: "center 55%", scrub: .8 } });
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
    gsap.from(kids, { ...from, duration: 1, stagger: .12, ease: EASE, scrollTrigger: { trigger: g, start: "top 85%" } });
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
    requestAnimationFrame(() => $$(".perfil, .pq, .card, .rol").forEach(tilt));
  }

  // ── 11. banda y compromiso: parallax y recorte ──
  const banda = $(".banda");
  if(banda) gsap.fromTo(banda, { backgroundPositionY: "20%" }, { backgroundPositionY: "80%", ease: "none", scrollTrigger: { trigger: banda, start: "top bottom", end: "bottom top", scrub: true } });
  const cimg = $(".comp .grid>img");
  if(cimg){
    gsap.fromTo(cimg, { clipPath: "inset(18% 12% 18% 12%)", scale: 1.15 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, ease: "none",
      scrollTrigger: { trigger: cimg, start: "top 92%", end: "center 55%", scrub: .8 } });
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

  // las fuentes y las imágenes cambian alturas: recalcular
  addEventListener("load", () => ScrollTrigger.refresh());
  if(document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
})();
