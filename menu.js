/* menú para celular y pantallas medianas: los enlaces del nav se esconden bajo 1240px, este botón los abre */
(function(){
  const nav = document.querySelector("nav"), links = nav && nav.querySelector(".links");
  if(!nav) return;
  // barra sólida después de la portada y escondida al bajar; con scroll nativo, para que funcione aunque el
  // teléfono tenga "reducir movimiento" o no cargue GSAP (antes vivía en anim.js y en esos casos no corría)
  const hero = document.querySelector(".hero");
  let last = scrollY;
  const navUp = () => { const y = Math.max(0, scrollY);
    const past = y > (hero ? hero.offsetHeight - 80 : 60);
    nav.classList.toggle("solid", past);
    if(!past || y < last - 2) nav.classList.remove("hide"); else if(y > last + 2) nav.classList.add("hide");
    last = y; };
  addEventListener("scroll", navUp, { passive:true }); addEventListener("load", navUp); addEventListener("resize", navUp); navUp();
  if(!links) return;
  const btn = document.createElement("button");
  btn.className = "menu-btn"; btn.type = "button"; btn.setAttribute("aria-label","Abrir menú"); btn.setAttribute("aria-expanded","false");
  btn.innerHTML = "<i></i><i></i>";
  nav.querySelector(".wrap").appendChild(btn);
  const panel = document.createElement("div");
  panel.className = "menu-panel"; panel.setAttribute("aria-hidden","true");
  panel.innerHTML = '<div class="menu-in">' + [...links.querySelectorAll("a")].map(a =>
    `<a href="${a.getAttribute("href")}" class="${a.classList.contains("btn")?"btn":""}">${a.textContent}</a>`).join("") + "</div>";
  document.body.appendChild(panel);
  const set = on => {
    document.documentElement.classList.toggle("menu-on", on);
    btn.setAttribute("aria-expanded", on); btn.setAttribute("aria-label", on ? "Cerrar menú" : "Abrir menú"); panel.setAttribute("aria-hidden", !on);
    if(window.__lenis) on ? window.__lenis.stop() : window.__lenis.start();
  };
  btn.addEventListener("click", () => set(!document.documentElement.classList.contains("menu-on")));
  panel.addEventListener("click", e => { if(e.target.closest("a") || e.target === panel) set(false); });
  addEventListener("keydown", e => { if(e.key === "Escape") set(false); });
})();

/* portada: botón "Siguiente" con el nombre de la próxima sección y contador, para que se entienda que hay más a la derecha */
(function(){
  const stage = document.querySelector(".hs-stage"), btn = document.getElementById("hsNext");
  if(!stage || !btn) return;
  const names = [...document.querySelectorAll(".hs-index button span")].map(s => s.textContent.trim());
  const n = stage.querySelectorAll(".hs").length;
  const cur = () => Math.round(stage.scrollLeft / (stage.clientWidth || 1));
  const upd = () => { const i = Math.min(n - 1, Math.max(0, cur())), j = (i + 1) % n;
    document.getElementById("hsCount").textContent = `${i + 1} / ${n}`;
    document.getElementById("hsName").textContent = names[j] || "";
    btn.querySelector("small").textContent = j === 0 ? "Volver al inicio" : "Siguiente"; };
  stage.addEventListener("scroll", () => requestAnimationFrame(upd), { passive:true }); addEventListener("resize", upd); upd();
  let alto = false; ["pointerdown","touchstart","wheel"].forEach(ev => stage.addEventListener(ev, () => alto = true, { passive:true }));
  btn.addEventListener("click", () => { alto = true; stage.classList.remove("drag"); stage.dispatchEvent(new KeyboardEvent("keydown")); const j = (cur() + 1) % n;
    stage.scrollTo({ left: j * stage.clientWidth, behavior: "smooth" }); });
  // una sola vez: la portada "asoma" la siguiente sección para que se note que se desliza
  if(!matchMedia("(prefers-reduced-motion: reduce)").matches) setTimeout(() => {
    if(alto || cur() !== 0 || scrollY > 50) return;
    stage.classList.add("drag"); const w = Math.min(90, stage.clientWidth * .18), t0 = performance.now();
    const f = now => { if(alto){ stage.classList.remove("drag"); return; } const p = Math.min(1, (now - t0) / 1100), e = Math.sin(p * Math.PI); stage.scrollLeft = w * e;
      if(p < 1) requestAnimationFrame(f); else { stage.scrollLeft = 0; stage.classList.remove("drag"); } };
    requestAnimationFrame(f); btn.classList.add("nudge"); setTimeout(() => btn.classList.remove("nudge"), 2600);
  }, 2600);
})();
