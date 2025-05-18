import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { MonthlySpending, SpendingCategory } from '@/types';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface SpendingTrendsProps {
  spendingData: MonthlySpending[];
  categories: SpendingCategory[];
}

export default function SpendingTrends({ spendingData, categories }: SpendingTrendsProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const [activeTimeframe, setActiveTimeframe] = useState<'3M' | '6M' | '1Y' | 'All'>('3M');
  const [chart, setChart] = useState<Chart<'line'> | null>(null);
  
  useEffect(() => {
    // Clean up previous chart instance
    if (chart) {
      chart.destroy();
    }
    
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      
      if (ctx) {
        const newChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: spendingData.map(data => data.month),
            datasets: [
              {
                label: 'Income',
                data: spendingData.map(data => data.income),
                borderColor: '#43A047',
                backgroundColor: 'rgba(67, 160, 71, 0.1)',
                fill: true,
                tension: 0.4
              },
              {
                label: 'Expenses',
                data: spendingData.map(data => data.expenses),
                borderColor: '#E53E3E',
                backgroundColor: 'rgba(229, 62, 62, 0.1)',
                fill: true,
                tension: 0.4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                align: 'end'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return '$' + value.toLocaleString();
                  }
                }
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
  }, [spendingData, chartRef, activeTimeframe]);
  
  return (
    <Card className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h3 className="text-lg font-semibold">Monthly Spending Trends</h3>
        <div className="flex items-center space-x-2 mt-2 sm:mt-0">
          <button 
            className={`text-sm ${activeTimeframe === '3M' ? 'text-primary-500 bg-primary-50' : 'text-neutral-500 hover:bg-neutral-50'} px-3 py-1 rounded-md`}
            onClick={() => setActiveTimeframe('3M')}
          >
            3M
          </button>
          <button 
            className={`text-sm ${activeTimeframe === '6M' ? 'text-primary-500 bg-primary-50' : 'text-neutral-500 hover:bg-neutral-50'} px-3 py-1 rounded-md`}
            onClick={() => setActiveTimeframe('6M')}
          >
            6M
          </button>
          <button 
            className={`text-sm ${activeTimeframe === '1Y' ? 'text-primary-500 bg-primary-50' : 'text-neutral-500 hover:bg-neutral-50'} px-3 py-1 rounded-md`}
            onClick={() => setActiveTimeframe('1Y')}
          >
            1Y
          </button>
          <button 
            className={`text-sm ${activeTimeframe === 'All' ? 'text-primary-500 bg-primary-50' : 'text-neutral-500 hover:bg-neutral-50'} px-3 py-1 rounded-md`}
            onClick={() => setActiveTimeframe('All')}
          >
            All
          </button>
        </div>
      </div>
      
      <div className="h-64">
        <canvas ref={chartRef}></canvas>
      </div>
      
      {/* Spending Categories */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {categories.map((category, index) => (
          <div key={index} className="text-center">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${category.color} mb-2`}>
              <span className="material-icons text-sm">{category.icon}</span>
            </div>
            <p className="text-xs text-neutral-500">{category.name}</p>
            <p className="text-sm font-medium tabular-nums">${category.amount.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
