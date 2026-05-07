import { getEquippedDecorationId, getEquippedUsernameColor } from './seasonPass';

/** Build combined decorations string (e.g. "star,purple_name") */
export function buildDecorationsString(): string | null {
  const parts: string[] = [];
  const decoId = getEquippedDecorationId();
  if (decoId && decoId !== 'purple_name' && decoId !== 'pulse_name' && decoId !== 'gold_pulse_name' && decoId !== 'rainbow_name') {
    parts.push(decoId);
  }
  const color = getEquippedUsernameColor();
  if (color === 'violet') {
    parts.push('purple_name');
  } else if (color === 'pulse') {
    parts.push('pulse_name');
  } else if (color === 'gold_pulse') {
    parts.push('gold_pulse_name');
  } else if (color === 'rainbow') {
    parts.push('rainbow_name');
  }
  return parts.length > 0 ? parts.join(',') : null;
}
