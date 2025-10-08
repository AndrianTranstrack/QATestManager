import React from 'react';

interface BarChartProps {
  data: { label: string; passed: number; failed: number; blocked: number }[];
}

const BarChart: React.FC<BarChartProps> = ({ data }) => {
  if (data.length === 0 || data.every(d => d.passed === 0 && d.failed === 0 && d.blocked === 0)) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        No test results yet
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.map((d) => d.passed + d.failed + d.blocked),
    1
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-around h-64 border-b border-l border-slate-200 px-4 pb-2">
        {data.map((item, index) => {
          const total = item.passed + item.failed + item.blocked;
          const passedHeight = (item.passed / maxValue) * 100;
          const failedHeight = (item.failed / maxValue) * 100;
          const blockedHeight = (item.blocked / maxValue) * 100;

          return (
            <div key={index} className="flex flex-col items-center gap-2 flex-1">
              <div className="flex flex-col items-center justify-end h-full w-full max-w-20">
                {total > 0 && (
                  <div className="flex flex-col w-full gap-0.5">
                    {item.blocked > 0 && (
                      <div
                        className="w-full bg-amber-500 rounded-t transition-all"
                        style={{ height: `${blockedHeight}%` }}
                      ></div>
                    )}
                    {item.failed > 0 && (
                      <div
                        className="w-full bg-red-500 transition-all"
                        style={{ height: `${failedHeight}%` }}
                      ></div>
                    )}
                    {item.passed > 0 && (
                      <div
                        className="w-full bg-green-500 rounded-b transition-all"
                        style={{ height: `${passedHeight}%` }}
                      ></div>
                    )}
                  </div>
                )}
              </div>
              <span className="text-xs text-slate-600 font-medium">
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex gap-6 justify-center">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span className="text-sm text-slate-600">Pass</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-500"></div>
          <span className="text-sm text-slate-600">Fail</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-500"></div>
          <span className="text-sm text-slate-600">Blocked</span>
        </div>
      </div>
    </div>
  );
};

export default BarChart;
