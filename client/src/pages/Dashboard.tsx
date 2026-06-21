import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Download, 
  Leaf, 
  TrendingDown, 
  Calendar, 
  Car, 
  Zap, 
  UtensilsCrossed,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface CarbonLog {
  id: string;
  recordedAt: string;
  travelCo2: number;
  energyCo2: number;
  dietCo2: number;
  totalCo2: number;
}

interface AnalyticsData {
  logs: CarbonLog[];
  summary: {
    totalSavings: number;
    baseline: number;
  };
}

interface DashboardProps {
  onNavigateToCalculator: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToCalculator }) => {
  const { token } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);

  const API_URL = 'http://localhost:5000/api';

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_URL}/calculator/analytics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to retrieve analytics data.');
      }

      const result = await res.json();
      setData(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [token]);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API_URL}/calculator/export`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carbon-footprint-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Could not export CSV report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <div style={{ border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--accent)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        <span style={{ marginLeft: '1rem', color: 'var(--text-muted)' }}>Generating dashboard insights...</span>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
        <h2 style={{ color: 'var(--error)' }}>Dashboard Load Error</h2>
        <p style={{ margin: '1rem 0', color: 'var(--text-muted)' }}>{error}</p>
        <button onClick={fetchAnalytics} className="btn btn-primary">Try Again</button>
      </div>
    );
  }

  const logs = data?.logs || [];
  const summary = data?.summary || { totalSavings: 0, baseline: 350 };
  const hasLogs = logs.length > 0;

  // Latest log metrics
  const latestLog = hasLogs ? logs[logs.length - 1] : null;
  const currentTotal = latestLog ? latestLog.totalCo2 : 0;
  const carbonDelta = latestLog ? Math.round((currentTotal - summary.baseline) * 100) / 100 : 0;
  const isBelowBaseline = carbonDelta <= 0;

  // Chart configs
  const chartLabels = logs.map(l => new Date(l.recordedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
  
  const lineChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Total CO2 (kg)',
        data: logs.map(l => l.totalCo2),
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#06b6d4',
        pointBorderColor: '#ffffff',
        pointHoverRadius: 6,
      },
      {
        label: 'Global Average Baseline',
        data: logs.map(() => summary.baseline),
        borderColor: 'rgba(239, 68, 68, 0.4)',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#e2e8f0', font: { family: 'Outfit' } }
      },
      tooltip: {
        bodyFont: { family: 'Outfit' },
        titleFont: { family: 'Outfit' }
      }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' }, title: { display: true, text: 'kg CO2', color: '#94a3b8' } }
    }
  };

  const barChartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Travel',
        data: logs.map(l => l.travelCo2),
        backgroundColor: 'rgba(6, 182, 212, 0.85)',
        borderRadius: 4,
      },
      {
        label: 'Energy',
        data: logs.map(l => l.energyCo2),
        backgroundColor: 'rgba(245, 158, 11, 0.85)',
        borderRadius: 4,
      },
      {
        label: 'Diet',
        data: logs.map(l => l.dietCo2),
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderRadius: 4,
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#e2e8f0', font: { family: 'Outfit' } }
      }
    },
    scales: {
      x: { stacked: true, grid: { display: false }, ticks: { color: '#94a3b8' } },
      y: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' }, title: { display: true, text: 'kg CO2', color: '#94a3b8' } }
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Top Banner Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Footprint Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Visualize your environmental footprint metrics and trends</p>
        </div>
        
        {hasLogs && (
          <button 
            onClick={handleExportCSV} 
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            disabled={exporting}
          >
            <Download size={18} />
            <span>{exporting ? 'Exporting...' : 'Export CSV Report'}</span>
          </button>
        )}
      </div>

      {/* Conditional Rendering: Empty State */}
      {!hasLogs ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '1.5rem', borderRadius: '50%', display: 'inline-flex' }}>
            <Leaf size={48} color="var(--accent)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 600, marginBottom: '0.5rem' }}>No Footprint History Found</h2>
            <p style={{ color: 'var(--text-muted)', maxWidth: '500px', margin: '0 auto' }}>
              You haven't logged any activity details yet. Submit your first travel, energy, and diet logs using our interactive carbon footprint calculator to view detailed analytics graphs.
            </p>
          </div>
          <button onClick={onNavigateToCalculator} className="btn btn-accent" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Run Carbon Calculator</span>
            <ArrowRight size={18} />
          </button>
        </div>
      ) : (
        <>
          {/* Key Metric Cards */}
          <div className="grid-container">
            
            {/* Metric 1 */}
            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <TrendingDown size={30} color="var(--accent)" />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                  Cumulative CO2 Savings
                </span>
                <strong style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent)' }}>
                  {summary.totalSavings} kg
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                  Relative to standard baseline
                </span>
              </div>
            </div>

            {/* Metric 2 */}
            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ background: isBelowBaseline ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                {isBelowBaseline ? <TrendingDown size={30} color="var(--primary)" /> : <TrendingUp size={30} color="var(--error)" />}
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                  Latest Emission Status
                </span>
                <strong style={{ fontSize: '1.8rem', fontWeight: 700, color: isBelowBaseline ? 'var(--primary)' : 'var(--error)' }}>
                  {currentTotal} kg CO2
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                  {isBelowBaseline 
                    ? `${Math.abs(carbonDelta)} kg under global baseline`
                    : `${carbonDelta} kg above global baseline`}
                </span>
              </div>
            </div>

            {/* Metric 3 */}
            <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
                <Calendar size={30} color="var(--warning)" />
              </div>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 600 }}>
                  Total Logs Logged
                </span>
                <strong style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--warning)' }}>
                  {logs.length} weeks
                </strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                  Active tracking history
                </span>
              </div>
            </div>

          </div>

          {/* Graphs Grid */}
          <div className="grid-container" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))' }}>
            
            {/* Chart 1: Trend Line */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Carbon Footprint Trend</h2>
              <div style={{ height: '300px', position: 'relative' }}>
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            </div>

            {/* Chart 2: Category Bar */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Emissions Breakdown by Source</h2>
              <div style={{ height: '300px', position: 'relative' }}>
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>

          </div>

          {/* Breakdown / Data Table */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowX: 'auto' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Detailed Footprint History</h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }} role="table">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-glass)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.8rem' }} role="columnheader">Date Recorded</th>
                  <th style={{ padding: '0.8rem' }} role="columnheader">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Car size={16} /> Travel</span>
                  </th>
                  <th style={{ padding: '0.8rem' }} role="columnheader">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><Zap size={16} /> Energy</span>
                  </th>
                  <th style={{ padding: '0.8rem' }} role="columnheader">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}><UtensilsCrossed size={16} /> Diet</span>
                  </th>
                  <th style={{ padding: '0.8rem' }} role="columnheader">Total Weekly CO2</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background-color 0.2s' }} hover-bg="rgba(255,255,255,0.01)" role="row">
                    <td style={{ padding: '0.8rem' }} role="cell">{new Date(log.recordedAt).toLocaleDateString()}</td>
                    <td style={{ padding: '0.8rem', color: 'var(--accent)' }} role="cell">{log.travelCo2} kg</td>
                    <td style={{ padding: '0.8rem', color: 'var(--warning)' }} role="cell">{log.energyCo2} kg</td>
                    <td style={{ padding: '0.8rem', color: 'var(--primary)' }} role="cell">{log.dietCo2} kg</td>
                    <td style={{ padding: '0.8rem', fontWeight: 700 }} role="cell">{log.totalCo2} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

    </div>
  );
};
