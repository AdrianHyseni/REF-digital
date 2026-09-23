// Small inline icon set (no external icon library needed for this demo).
import { SVGProps } from 'react';

function Svg(props: SVGProps<SVGSVGElement>) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props} />;
}

export function IconLock(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props} width="14" height="14">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Svg>
  );
}
