interface Props {
  name: string;
  size?: number;
  color?: string;
  tint?: string;
}

export function Avatar({ name, size = 28, color = '#0073E6', tint = '#BBDEFB' }: Props) {
  const initials = name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: tint, color, display: 'inline-flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'var(--font-open-sans)',
      fontSize: Math.round(size * 0.38), fontWeight: 700, letterSpacing: '0.01em',
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.08)',
    }}>
      {initials}
    </span>
  );
}
