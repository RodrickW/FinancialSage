import { Card } from '@/components/ui/card';
import { CreditScoreData } from '@/types';
import { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { Button } from '@/components/ui/button';

Chart.register(...registerables);

interface CreditScoreProps {
  data: CreditScoreData;
}

export default function CreditScore({ data }: CreditScoreProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const [chart, setChart] = useState<Chart<'doughnut'> | null>(null);
  
  useEffect(() => {
    // Clean up previous chart instance
    if (chart) {
      chart.destroy();
    }
    
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      
      if (ctx) {
        const newChart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            datasets: [{
              data: [data.score, 850 - data.score],
              backgroundColor: [
                '#1E88E5',
                '#E4E7EB'
              ],
              borderWidth: 0,
              cutout: '80%'
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                enabled: false
              }
            }
          }
        });
        
        setChart(newChart);
      }
    }
    
    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  }, [data.score, chartRef]);
  
  return (
    <Card className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Credit Score</h3>
        <span className="text-xs bg-primary-50 text-primary-500 py-1 px-2 rounded-full">
          Updated {data.lastUpdated}
        </span>
      </div>
      
      <div className="flex flex-col items-center mb-4">
        <div className="relative w-32 h-32 mb-2">
          <canvas ref={chartRef} className="w-full h-full"></canvas>
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <p className="text-3xl font-bold">{data.score}</p>
            <p className="text-xs text-neutral-500">{data.rating}</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-3 mb-4">
        {data.factors.map((factor, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-1">
              <p className="text-sm text-neutral-500">{factor.name}</p>
              <p className="text-sm font-semibold">{factor.rating}</p>
            </div>
            <div className="w-full bg-neutral-100 rounded-full h-1.5">
              <div 
                className={`${factor.rating === 'Excellent' ? 'bg-success-500' : 
                  factor.rating === 'Good' ? 'bg-secondary-500' : 
                  factor.rating === 'Fair' ? 'bg-accent-500' : 'bg-error-500'} 
                  h-1.5 rounded-full transition-all duration-500`} 
                style={{ width: `${factor.percentage}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      
      <Button 
        variant="outline"
        className="w-full border-primary-500 text-primary-500 hover:bg-primary-50 transition-colors"
      >
        View Full Report
      </Button>
    </Card>
  );
}
