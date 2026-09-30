/* páginas de división (fundación, inmobiliario): portada con parallax y entradas escalonadas */
(function(){
  if(!window.gsap || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const bg = $(".phero-bg"), box = $(".phero .box");
  if(bg){
    gsap.from(bg, { scale: 1.2, duration: 2.4, ease: "power2.out" });
    gsap.to(bg, { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".phero", start: "top top", end: "bottom top", scrub: true } });
    if(matchMedia("(pointer:fine)").matches){
      const qx = gsap.quickTo(bg, "x", { duration: 1.2, ease: "power3" }), qy = gsap.quickTo(bg, "y", { duration: 1.2, ease: "power3" });
      $(".phero").addEventListener("mousemove", e => { qx((e.clientX/innerWidth - .5) * -24); qy((e.clientY/innerHeight - .5) * -14); });
    }
  }
  if(box) gsap.from([...box.children], { y: 50, opacity: 0, stagger: .12, duration: 1.1, ease: "power3.out", delay: .2 });
  $$(".stat3, .cols3, .steps4").forEach(g => gsap.from([...g.children], { y: 60, opacity: 0, stagger: .12, duration: 1, ease: "power3.out", scrollTrigger: { trigger: g, start: "top 85%" } }));
  $$(".ledger tr").forEach((r, i) => gsap.from(r, { x: -30, opacity: 0, duration: .7, delay: i * .08, ease: "power3.out", scrollTrigger: { trigger: ".ledger", start: "top 88%" } }));
  $$(".stat3 b").forEach(b => gsap.from(b, { scale: .8, opacity: 0, duration: 1.2, ease: "back.out(1.6)", scrollTrigger: { trigger: b, start: "top 88%" } }));
})();
