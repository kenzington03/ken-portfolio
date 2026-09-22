/**
 * Liquid Glass distortion filter — mounted once at the app root.
 *
 * Ported directly from lucasromerodb/liquid-glass-effect-macos (the WWDC
 * 2025 "Liquid Glass" recreation) — same feTurbulence -> feSpecularLighting
 * -> feDisplacementMap graph, same literal baseFrequency/seed/scale values.
 * It refracts whatever sits behind the glass surface and adds a specular
 * sheen; a plain backdrop-blur can't do either. Every glass surface (Dock,
 * menu bar, window toolbars) references this one filter via
 * `filter: url(#glass-distortion)` on its `.glassDistort` layer — see
 * global.css — so the primitives only need to exist once in the DOM.
 */
export default function GlassFilterDefs() {
  return (
    <svg aria-hidden focusable="false" style={{ position: 'absolute', width: 0, height: 0 }}>
      <filter
        id="glass-distortion"
        x="0%"
        y="0%"
        width="100%"
        height="100%"
        filterUnits="objectBoundingBox"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.01 0.01"
          numOctaves="1"
          seed="5"
          result="turbulence"
        />
        {/* This componentTransfer branch ("mapped") is unused downstream in
            the source repo too — feGaussianBlur reads from "turbulence"
            directly, not "mapped". Kept as-is for an exact port rather than
            "fixing" a graph that isn't ours to redesign. */}
        <feComponentTransfer in="turbulence" result="mapped">
          <feFuncR type="gamma" amplitude="1" exponent="10" offset="0.5" />
          <feFuncG type="gamma" amplitude="0" exponent="1" offset="0" />
          <feFuncB type="gamma" amplitude="0" exponent="1" offset="0.5" />
        </feComponentTransfer>
        <feGaussianBlur in="turbulence" stdDeviation="3" result="softMap" />
        <feSpecularLighting
          in="softMap"
          surfaceScale="5"
          specularConstant="1"
          specularExponent="100"
          lightingColor="white"
          result="specLight"
        >
          <fePointLight x="-200" y="-200" z="300" />
        </feSpecularLighting>
        <feComposite
          in="specLight"
          operator="arithmetic"
          k1="0"
          k2="1"
          k3="1"
          k4="0"
          result="litImage"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="softMap"
          scale="150"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
