// Polished chrome, as GLSL: what a mirror finish reflects. One studio for
// everything chrome in the journey (the knob on the career's line, the Apple
// logo it melts into), so the two are the same metal and the hand-over from
// one to the other cannot be seen.
//
// The studio, as in a product shot of a chrome ball: a bright white floor
// sweeping up to the horizon, a dark band of far wall just above it, and a
// darker room overhead lit by tall windows (their frames read as the curved
// lines a real chrome ball shows) and a softbox right above.

export const CHROME_GLSL = /* glsl */ `
vec3 studio(vec3 d) {
  float y = d.y;
  float az = atan(d.x, d.z);
  // The floor: a white sweep, a little greyer far off toward the horizon.
  vec3 floorC = mix(vec3(0.62, 0.63, 0.65), vec3(1.0, 1.0, 1.02), smoothstep(-0.05, -0.6, y));
  // The room: the far wall dark near the horizon, lighter grey higher up.
  vec3 room = mix(vec3(0.045, 0.047, 0.055), vec3(0.24, 0.25, 0.28), smoothstep(0.05, 0.6, y));
  vec3 col = mix(floorC, room, smoothstep(-0.008, 0.008, y));
  // Two tall windows, each split by mullions and a transom: bright panes in
  // dark frames.
  float pane = 0.0;
  for (int w = 0; w < 2; w++) {
    float c = w == 0 ? 0.85 : -1.05;
    float half_ = w == 0 ? 0.55 : 0.42;
    float u = (az - c) / half_;
    if (abs(u) < 1.0 && y > 0.12 && y < 0.78) {
      float bars = step(0.07, abs(fract(u * 1.5 + 0.5) - 0.5) * 2.0);
      float transom = step(0.025, abs(y - 0.44));
      pane = max(pane, bars * transom * smoothstep(0.12, 0.2, y) * smoothstep(0.78, 0.7, y));
    }
  }
  col = mix(col, vec3(1.5, 1.52, 1.56), pane);
  // The softbox overhead.
  col += vec3(1.0, 0.995, 0.985) * smoothstep(0.78, 0.95, y) * 1.4;
  // A thin bright line where the floor meets the wall.
  col += vec3(0.9) * exp(-pow(y * 90.0, 2.0)) * 0.5;
  return col;
}

// Mirror metal at a surface with normal n, seen along v.
vec3 chrome(vec3 v, vec3 n) {
  vec3 r = reflect(v, n);
  vec3 c = studio(r) * vec3(0.93, 0.945, 0.965);
  // Grazing angles reflect more (a touch of Fresnel).
  float f = pow(1.0 - max(dot(-v, n), 0.0), 4.0);
  c += studio(r) * f * 0.35;
  // Filmic shoulder, then to sRGB.
  c = 1.0 - exp(-c * 1.35);
  return pow(c, vec3(1.0 / 2.2));
}
`;
