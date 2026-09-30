/* menú para celular y pantallas medianas: los enlaces del nav se esconden bajo 1240px, este botón los abre */
(function(){
  const nav = document.querySelector("nav"), links = nav && nav.querySelector(".links");
  if(!nav) return;
  // barra sólida después de la portada y escondida al bajar; con scroll nativo, para que funcione aunque el
  // teléfono tenga "reducir movimiento" o no cargue GSAP (antes vivía en anim.js y en esos casos no corría)
  const hero = document.querySelector(".hero");
  let last = scrollY;
  const navUp = () => { const y = Math.max(0, scrollY);
    const box = hero && hero.parentElement && hero.parentElement.classList.contains("pin-spacer") ? hero.parentElement : hero;
    const past = y > (box ? box.offsetHeight - 80 : 60);
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
