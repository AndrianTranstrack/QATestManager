import React from 'react';

interface LineChartProps {
  data: { label: string; value: number }[];
  color?: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, color = '#3b82f6' }) => {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        No data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);
  const width = 600;
  const height = 200;
  const padding = 40;

  const points = data.map((item, index) => {
    const x = padding + (index / (data.length - 1 || 1)) * (width - 2 * padding);
    const y = height - padding - (item.value / maxValue) * (height - 2 * padding);
    return { x, y, value: item.value };
  });

  const pathD = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  return (
    <div className="flex flex-col gap-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#e2e8f0"
          strokeWidth="2"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#e2e8f0"
          strokeWidth="2"
        />

        {data.map((item, index) => {
          const x = padding + (index / (data.length - 1 || 1)) * (width - 2 * padding);
          return (
            <text
              key={index}
              x={x}
              y={height - padding + 20}
              textAnchor="middle"
              className="text-xs fill-slate-600"
            >
              {item.label}
            </text>
          );
        })}

        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="white"
              stroke={color}
              strokeWidth="3"
            />
            <text
              x={point.x}
              y={point.y - 15}
              textAnchor="middle"
              className="text-xs font-semibold fill-slate-700"
            >
              {point.value}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
};

export default LineChart;
