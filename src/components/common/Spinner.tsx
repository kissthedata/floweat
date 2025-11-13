interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export default function Spinner({ size = 'sm', color = '#4ae523' }: SpinnerProps) {
  const sizeMap = {
    sm: '1.25em',
    md: '2em',
    lg: '3.25em',
  };

  return (
    <svg
      viewBox="0 0 50 50"
      style={{
        width: sizeMap[size],
        transformOrigin: 'center',
        animation: 'rotate4 2s linear infinite',
      }}
    >
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeDasharray="1, 200"
        strokeDashoffset="0"
        strokeLinecap="round"
        style={{
          animation: 'dash4 1.5s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes rotate4 {
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes dash4 {
          0% {
            stroke-dasharray: 1, 200;
            stroke-dashoffset: 0;
          }

          50% {
            stroke-dasharray: 90, 200;
            stroke-dashoffset: -35px;
          }

          100% {
            stroke-dashoffset: -125px;
          }
        }
      `}</style>
    </svg>
  );
}
