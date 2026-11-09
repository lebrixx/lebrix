// Idle choreography for the hero on the pre-game screen.
// The sprite sheet only has run cycles, so the lobby holds the front-facing
// standing frame and brings it to life by deforming the sprite mesh:
// breathing, weight shift, head tilt, swinging arms, flowing skirt, plus a
// showcase turn and a "challenge the crowd" gesture on a loop.

export const HERO_LOOP = 12;
/** Sheet rows, turning from the front: S, SW, W, NW, N, NE, E, SE. */
const TURN = [2, 3, 4, 5, 6, 7, 0, 1];

export type HeroPose = {
  row: number;
  /** 0..1: how much of the mesh deformation applies (0 while turning). */
  amp: number;
  breath: number; sway: number; head: number;
  /** Arm rotations in radians; positive = outward from the body. */
  armL: number; armR: number;
  cloth: number;
  /** Small hop of the whole sprite, in scene units. */
  hop: number;
};

const bell = (t: number, start: number, length: number) => {
  const k = (t - start) / length;
  return k <= 0 || k >= 1 ? 0 : Math.sin(Math.PI * k);
};

export function heroPose(seconds: number): HeroPose {
  const t = ((seconds % HERO_LOOP) + HERO_LOOP) % HERO_LOOP;
  const breath = Math.sin(seconds * 2.1) * 0.5 + 0.5;
  const sway = Math.sin(seconds * 0.85);
  // Arms swing gently, slightly out of phase, never folding into the body.
  let armL = 0.07 + Math.sin(seconds * 1.3) * 0.05;
  let armR = 0.07 + Math.sin(seconds * 1.3 + 0.9) * 0.05;
  let head = Math.sin(seconds * 0.7) * 0.05;
  let hop = 0;
  let row = 2, amp = 1;

  // Showcase turn (5.0 s → 6.4 s): spin through the eight baked views.
  if (t >= 5 && t < 6.4) {
    row = TURN[Math.floor(((t - 5) / 1.4) * TURN.length) % TURN.length] ?? 2;
    amp = 0;
  }
  // Challenge gesture (8.0 s → 10.2 s): arms spread, chest out, a little hop, then a nod.
  const g = bell(t, 8, 2.2);
  if (g > 0) {
    armL += 0.45 * g; armR += 0.45 * g;
    head += -0.06 * g;
    hop = Math.max(0, Math.sin(Math.PI * Math.min(1, (t - 8.7) / 0.5))) * 0.08 * (t > 8.7 && t < 9.2 ? 1 : 0);
  }
  // Quick one-arm wave to the crowd (2.2 s → 3.6 s).
  const wave = bell(t, 2.2, 1.4);
  if (wave > 0) armR += wave * (0.36 + Math.sin(seconds * 14) * 0.1);

  return { row, amp, breath: breath + g * 0.8, sway, head, armL, armR, cloth: Math.sin(seconds * 1.9) + sway * 0.4, hop };
}

/** GLSL injected into the sprite material: deforms the 128 px cell around a skeleton. */
export const HERO_VERTEX_DECL = /* glsl */ `
uniform float uBreath, uSway, uArmL, uArmR, uHead, uCloth, uAmp, uSize;
vec2 heroRot(vec2 q, vec2 c, float a) { vec2 r = q - c; float cs = cos(a), sn = sin(a); return c + vec2(r.x * cs - r.y * sn, r.x * sn + r.y * cs); }
// Rotates the pixels of one arm around its shoulder; side = -1 for the arm on the image's left.
vec2 heroArm(vec2 q, vec2 p, vec2 s, vec2 h, float a, float side) {
  vec2 d = h - s; float L = length(d); vec2 n = d / L;
  float along = dot(p - s, n);
  vec2 c = s + n * clamp(along, 0.0, L + 3.0);
  float dist = length(p - c);
  float lateral = (p.x - c.x) * side;
  float w = (1.0 - smoothstep(3.0, 5.5, dist)) * smoothstep(-1.0, 0.3 * L, along) * (1.0 - smoothstep(L + 3.0, L + 6.0, along));
  w *= smoothstep(-3.2, -1.8, lateral);
  // Rotation in image space (y down): positive turns the hand toward -x.
  return heroRot(q, s, a * side * -1.0 * w);
}
`;

export const HERO_VERTEX_BODY = /* glsl */ `
vec3 transformed = vec3(position);
vec2 p = vec2(uv.x * 128.0, (1.0 - uv.y) * 128.0);
vec2 q = p;
float upper = 1.0 - smoothstep(58.0, 90.0, p.y);
// Breathing: chest and fur collar widen, upper body rises.
float chest = smoothstep(18.0, 26.0, p.y) * (1.0 - smoothstep(46.0, 56.0, p.y));
q.x = 64.0 + (q.x - 64.0) * (1.0 + uBreath * 0.03 * chest * uAmp);
q.y -= uBreath * 1.1 * upper * uAmp;
// Weight shift over planted feet.
q.x += uSway * 1.6 * upper * uAmp;
// Head tilt around the neck.
float headW = 1.0 - smoothstep(17.0, 24.0, p.y);
q = heroRot(q, vec2(64.0, 23.0), uHead * headW * uAmp);
// Arms (shoulder -> hand, measured on the standing frame).
q = heroArm(q, p, vec2(54.0, 33.0), vec2(49.0, 63.0), uArmL * uAmp, -1.0);
q = heroArm(q, p, vec2(72.0, 33.0), vec2(77.0, 62.0), uArmR * uAmp, 1.0);
// Long skirt panel flutters from the belt.
float cloth = smoothstep(63.0, 69.0, p.x) * smoothstep(52.0, 60.0, p.y) * (1.0 - smoothstep(84.0, 90.0, p.y));
q.x += uCloth * cloth * clamp((p.y - 52.0) / 32.0, 0.0, 1.0) * 2.2 * uAmp;
transformed.x += (q.x - p.x) / 128.0 * uSize;
transformed.y -= (q.y - p.y) / 128.0 * uSize;
`;
