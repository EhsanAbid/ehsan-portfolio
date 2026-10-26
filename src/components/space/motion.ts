/*
 * Smooth scrolling (Lenis) + scroll-driven animation (GSAP ScrollTrigger).
 * Loaded lazily after the page is interactive, never for reduced-motion visitors.
 *
 * Content is visible by default (no-JS friendly). We only hide elements that are still
 * BELOW the fold at start-up, then fade them in as they enter — so nothing already on
 * screen flashes.
 */
export async function startMotion(opts: { smoothScroll: boolean; revealMs: number }) {
  const [{ gsap }, { ScrollTrigger }] = await Promise.all([import("gsap"), import("gsap/ScrollTrigger")]);
  gsap.registerPlugin(ScrollTrigger);
  const cleanups: (() => void)[] = [];

  // 1) Smooth scroll. Lenis interpolates the scroll position; GSAP's ticker drives it so
  //    both libraries agree on the same frame. Anchor links still work (lenis anchors).
  if (opts.smoothScroll && !matchMedia("(pointer: coarse)").matches) {
    const { default: Lenis } = await import("lenis");
    const lenis = new Lenis({ lerp: 0.12, anchors: { offset: -16 }, autoRaf: false });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    (window as unknown as { __lenis?: unknown }).__lenis = lenis;
    cleanups.push(() => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    });
  }

  // 2) Reveals.
  const vh = window.innerHeight;
  const items = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
  items.forEach((el) => {
    if (el.getBoundingClientRect().top < vh * 0.95) el.classList.add("revealed");
  });
  document.documentElement.style.setProperty("--reveal-ms", `${opts.revealMs}ms`);
  document.documentElement.classList.add("reveal-ready");
  const batch = ScrollTrigger.batch(
    items.filter((el) => !el.classList.contains("revealed")),
    {
      start: "top 92%",
      once: true,
      onEnter: (els) => els.forEach((el, i) => setTimeout(() => el.classList.add("revealed"), i * 80)),
    },
  );
  cleanups.push(() => batch.forEach((t) => t.kill()));

  // 3) Planets drift in and slowly turn as their section passes (scrub = tied to scroll).
  document.querySelectorAll<HTMLElement>("[data-planet-el]").forEach((el) => {
    const tween = gsap.fromTo(
      el,
      { yPercent: 40, xPercent: 25, rotate: -12, opacity: 0 },
      {
        yPercent: -40,
        xPercent: -10,
        rotate: 12,
        opacity: 1,
        ease: "none",
        scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: 0.6 },
      },
    );
    cleanups.push(() => tween.scrollTrigger?.kill());
  });

  // 4) Journey checkpoints light up as they cross the middle of the screen.
  document.querySelectorAll<HTMLElement>("[data-checkpoint]").forEach((el) => {
    const t = ScrollTrigger.create({
      trigger: el,
      start: "top 65%",
      onEnter: () => el.classList.add("lit"),
      onLeaveBack: () => el.classList.remove("lit"),
    });
    cleanups.push(() => t.kill());
  });

  return () => {
    cleanups.forEach((c) => c());
    document.documentElement.classList.remove("reveal-ready");
  };
}

/** Scroll to an element, through Lenis when it is active. */
export function scrollToTarget(target: string | HTMLElement) {
  const lenis = (window as unknown as { __lenis?: { scrollTo: (t: string | HTMLElement, o?: object) => void } }).__lenis;
  if (lenis) lenis.scrollTo(target, { offset: -16 });
  else {
    const el = typeof target === "string" ? document.querySelector(target) : target;
    el?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }
}
