import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Fades every [data-reveal] descendant up as it scrolls in, staggered per section.
export default function useReveal() {
  const scope = useRef(null);

  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(scope.current?.querySelectorAll("[data-reveal]") ?? [], { opacity: 1 });
      return;
    }

    const ctx = gsap.context((self) => {
      const groups = new Map();
      for (const el of self.selector("[data-reveal]")) {
        const key = el.closest("[data-reveal-group]") ?? el;
        groups.set(key, [...(groups.get(key) ?? []), el]);
      }

      for (const items of groups.values()) {
        gsap.fromTo(
          items,
          { opacity: 0, y: 24 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            ease: "power2.out",
            stagger: 0.09,
            scrollTrigger: { trigger: items[0], start: "top 88%", once: true },
          },
        );
      }
    }, scope);

    return () => ctx.revert();
  }, []);

  return scope;
}
