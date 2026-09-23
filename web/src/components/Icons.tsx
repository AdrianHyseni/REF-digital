// Small inline icon set (no external icon library needed for this demo).
import { SVGProps } from 'react';

function Svg(props: SVGProps<SVGSVGElement>) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" strokeWidth="1.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props} />;
}

export function IconUser(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" />
    </Svg>
  );
}

export function IconDirectory(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <circle cx="10" cy="10" r="6" />
      <path d="M20 20l-4.35-4.35" />
    </Svg>
  );
}

export function IconOpportunities(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </Svg>
  );
}

export function IconMessages(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <path d="M21 12a8 8 0 1 1-3.2-6.4L21 4l-1 4.3A7.9 7.9 0 0 1 21 12Z" />
    </Svg>
  );
}

export function IconLock(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props} width="14" height="14">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </Svg>
  );
}

export function IconMentor(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props} width="14" height="14">
      <path d="M12 2l3 6 6 1-4.5 4.2L17.5 20 12 16.8 6.5 20l1-6.8L3 9l6-1 3-6Z" />
    </Svg>
  );
}

export function IconAdmin(props: SVGProps<SVGSVGElement>) {
  return (
    <Svg {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
    </Svg>
  );
}
