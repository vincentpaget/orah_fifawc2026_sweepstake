import type { Flag } from '../types';

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return h;
}

interface Props {
  flag: Flag;
  size?: number;
  ring?: boolean;
}

export function FlagCrest({ flag, size = 28, ring = true }: Props) {
  const { kind, colors: c } = flag;
  const _id = 'fc' + Math.abs(hashStr(kind + c.join()));
  const W = 60, H = 60;

  let inner: React.ReactNode = null;

  if (kind === 'v') {
    inner = c.map((col, i) => <rect key={i} x={(W / c.length) * i} y={0} width={W / c.length + 0.5} height={H} fill={col} />);
  } else if (kind === 'v2') {
    inner = c.map((col, i) => <rect key={i} x={(W / 2) * i} y={0} width={W / 2 + 0.5} height={H} fill={col} />);
  } else if (kind === 'h') {
    inner = c.map((col, i) => <rect key={i} x={0} y={(H / c.length) * i} width={W} height={H / c.length + 0.5} fill={col} />);
  } else if (kind === 'h2') {
    inner = c.map((col, i) => <rect key={i} x={0} y={(H / 2) * i} width={W} height={H / 2 + 0.5} fill={col} />);
  } else if (kind === 'solid') {
    inner = <rect x={0} y={0} width={W} height={H} fill={c[0]} />;
  } else if (kind === 'disc') {
    inner = [
      <rect key="b" x={0} y={0} width={W} height={H} fill={c[0]} />,
      <circle key="d" cx={W / 2} cy={H / 2} r={15} fill={c[1]} />,
    ];
  } else if (kind === 'cross') {
    inner = [
      <rect key="b" x={0} y={0} width={W} height={H} fill={c[0]} />,
      <rect key="v" x={22} y={0} width={12} height={H} fill={c[1]} />,
      <rect key="h" x={0} y={24} width={W} height={12} fill={c[1]} />,
    ];
  } else if (kind === 'canton') {
    const stripes = [];
    for (let i = 1; i < 7; i += 2) stripes.push(<rect key={'s' + i} x={0} y={(H / 7) * i} width={W} height={H / 7} fill={c[2]} />);
    inner = [
      <rect key="b" x={0} y={0} width={W} height={H} fill={c[0]} />,
      ...stripes,
      <rect key="c" x={0} y={0} width={28} height={30} fill={c[1]} />,
    ];
  } else if (kind === 'diag') {
    inner = [
      <rect key="b" x={0} y={0} width={W} height={H} fill={c[0]} />,
      <polygon key="t" points={`${W},0 ${W},${H} 0,${H}`} fill={c[1]} opacity={0.92} />,
    ];
  } else {
    inner = <rect x={0} y={0} width={W} height={H} fill={c[0] ?? '#ccc'} />;
  }

  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', display: 'inline-block',
      overflow: 'hidden', flexShrink: 0, position: 'relative',
      boxShadow: ring ? 'inset 0 0 0 1px rgba(0,0,0,0.12)' : 'none',
      verticalAlign: 'middle',
    }}>
      <svg width={size} height={size} viewBox="0 0 60 60" style={{ display: 'block' }}>
        {inner}
      </svg>
    </span>
  );
}
