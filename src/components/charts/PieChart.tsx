import React from 'react';

interface PieChartProps {
  passed: number;
  failed: number;
  blocked: number;
}

const PieChart: React.FC<PieChartProps> = ({ passed, failed, blocked }) => {
  const total = passed + failed + blocked;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        No test results yet
      </div>
    );
  }

  const passedPercent = (passed / total) * 100;
  const failedPercent = (failed / total) * 100;
  const blockedPercent = (blocked / total) * 100;

  const passedAngle = (passedPercent / 100) * 360;
  const failedAngle = (failedPercent / 100) * 360;

  const createArc = (startAngle: number, endAngle: number) => {
    const start = (startAngle - 90) * (Math.PI / 180);
    const end = (endAngle - 90) * (Math.PI / 180);
    const x1 = 50 + 40 * Math.cos(start);
    const y1 = 50 + 40 * Math.sin(start);
    const x2 = 50 + 40 * Math.cos(end);
    const y2 = 50 + 40 * Math.sin(end);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-64 h-64">
        {passed > 0 && (
          <path d={createArc(0, passedAngle)} fill="#10b981" />
        )}
        {failed > 0 && (
          <path
            d={createArc(passedAngle, passedAngle + failedAngle)}
            fill="#ef4444"
          />
        )}
        {blocked > 0 && (
          <path
            d={createArc(passedAngle + failedAngle, 360)}
            fill="#f59e0b"
          />
        )}
        <circle cx="50" cy="50" r="25" fill="white" />
        <text
          x="50"
          y="50"
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-2xl font-bold fill-slate-800"
        >
          {total}
        </text>
        <text
          x="50"
          y="60"
          textAnchor="middle"
          className="text-xs fill-slate-500"
        >
          Total
        </text>
      </svg>
      <div className="flex gap-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm text-slate-600">
            Pass ({passed}) - {passedPercent.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm text-slate-600">
            Fail ({failed}) - {failedPercent.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-sm text-slate-600">
            Blocked ({blocked}) - {blockedPercent.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default PieChart;
