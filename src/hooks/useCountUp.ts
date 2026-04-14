import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function useCountUp(target: number, duration = 1.4, decimals = 0) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const obj = { value: 0 };
    const multiplier = Math.pow(10, decimals);
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        value: target,
        duration,
        ease: "power3.out",
        onUpdate() {
          if (ref.current) {
            const v = Math.round(obj.value * multiplier) / multiplier;
            ref.current.textContent = decimals > 0 ? v.toFixed(decimals) : String(Math.round(v));
          }
        },
      });
    });
    return () => ctx.revert();
  }, [target, duration, decimals]);

  return ref;
}
