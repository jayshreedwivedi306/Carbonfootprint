import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Car, 
  Zap, 
  UtensilsCrossed, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle,
  Leaf
} from 'lucide-react';

interface CalculatorProps {
  onCalculationComplete: () => void;
}

export const Calculator: React.FC<CalculatorProps> = ({ onCalculationComplete }) => {
  const { token } = useAuth();
  
  // Multi-step state
  const [step, setStep] = useState<number>(1);
  
  // Form values
  const [carMiles, setCarMiles] = useState<string>('0');
  const [vehicleType, setVehicleType] = useState<string>('gasoline');
  const [publicTransitMiles, setPublicTransitMiles] = useState<string>('0');
  const [flightMiles, setFlightMiles] = useState<string>('0');
  const [electricityKwh, setElectricityKwh] = useState<string>('0');
  const [gasTherms, setGasTherms] = useState<string>('0');
  const [dietType, setDietType] = useState<string>('average');

  // Request state
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const API_URL = 'http://localhost:5000/api';

  const validateStep = () => {
    setError(null);
    if (step === 1) {
      if (Number(carMiles) < 0 || Number(publicTransitMiles) < 0 || Number(flightMiles) < 0) {
        setError('Travel miles cannot be negative.');
        return false;
      }
    }
    if (step === 2) {
      if (Number(electricityKwh) < 0 || Number(gasTherms) < 0) {
        setError('Energy consumption values cannot be negative.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setError(null);
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep()) return;

    setSubmitting(true);
    setError(null);

    const payload = {
      carMiles: Number(carMiles),
      vehicleType,
      publicTransitMiles: Number(publicTransitMiles),
      flightMiles: Number(flightMiles),
      electricityKwh: Number(electricityKwh),
      gasTherms: Number(gasTherms),
      dietType,
    };

    try {
      const res = await fetch(`${API_URL}/calculator/log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit logs.');
      }

      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error processing footprint calculation.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderProgressBar = () => {
    const percentages = [0, 33, 66, 100];
    return (
      <div style={{ width: '100%', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <span>Travel Logs</span>
          <span>Energy Draw</span>
          <span>Dietary Footprint</span>
          <span>Results Summary</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', position: 'relative' }}>
          <div 
            style={{ 
              height: '100%', 
              width: `${percentages[step - 1]}%`, 
              background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)', 
              borderRadius: '3px',
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
            }} 
          />
        </div>
      </div>
    );
  };

  if (result) {
    return (
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <CheckCircle size={48} color="var(--primary)" />
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700 }}>Calculation Success!</h2>
          <p style={{ color: 'var(--text-muted)' }}>Your weekly carbon footprint log has been saved.</p>
        </div>

        {/* Footprint breakdown stats */}
        <div style={{ background: 'rgba(11, 19, 41, 0.4)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Weekly Footprint Total:</span>
            <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent)' }}>{result.totalCo2} kg CO2</span>
          </div>
          
          <div style={{ height: '1px', background: 'var(--border-glass)' }}></div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div style={{ padding: '0.5rem', textAlign: 'center' }}>
              <Car size={20} color="var(--accent)" style={{ margin: '0 auto 0.3rem' }} />
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Travel</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--accent)' }}>{result.travelCo2} kg</strong>
            </div>
            <div style={{ padding: '0.5rem', textAlign: 'center' }}>
              <Zap size={20} color="var(--warning)" style={{ margin: '0 auto 0.3rem' }} />
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Energy</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--warning)' }}>{result.energyCo2} kg</strong>
            </div>
            <div style={{ padding: '0.5rem', textAlign: 'center' }}>
              <UtensilsCrossed size={20} color="var(--primary)" style={{ margin: '0 auto 0.3rem' }} />
              <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Diet</span>
              <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{result.dietCo2} kg</strong>
            </div>
          </div>
        </div>

        <button 
          onClick={onCalculationComplete} 
          className="btn btn-primary"
          style={{ width: '100%' }}
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto' }}>
      
      {/* Intro */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.5px' }}>Footprint Calculator</h1>
        <p style={{ color: 'var(--text-muted)' }}>Input your carbon consumption details to estimate your footprint</p>
      </div>

      <div className="glass-panel animate-fade-in">
        {renderProgressBar()}

        {error && (
          <div 
            role="alert" 
            aria-live="polite"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              color: 'var(--error)',
              padding: '0.8rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.9rem',
              fontWeight: 500,
              marginBottom: '1.5rem'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          
          {/* Step 1: Travel Info */}
          {step === 1 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Car color="var(--accent)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Travel & Commuting</h2>
              </div>

              <div className="form-group">
                <label htmlFor="carMiles">Weekly Car Driving Miles</label>
                <input
                  id="carMiles"
                  type="number"
                  min="0"
                  value={carMiles}
                  onChange={(e) => setCarMiles(e.target.value)}
                  placeholder="e.g. 50"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="vehicleType">Vehicle Fuel/Engine Type</label>
                <select
                  id="vehicleType"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                >
                  <option value="gasoline">Gasoline Vehicle</option>
                  <option value="hybrid">Hybrid Vehicle</option>
                  <option value="electric">Electric Vehicle</option>
                  <option value="none">No vehicle used (None)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="publicTransitMiles">Weekly Public Transit Miles (Bus/Train)</label>
                <input
                  id="publicTransitMiles"
                  type="number"
                  min="0"
                  value={publicTransitMiles}
                  onChange={(e) => setPublicTransitMiles(e.target.value)}
                  placeholder="e.g. 20"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="flightMiles">Annual Flights Miles (divided by 52 for weekly rate)</label>
                <input
                  id="flightMiles"
                  type="number"
                  min="0"
                  value={flightMiles}
                  onChange={(e) => setFlightMiles(e.target.value)}
                  placeholder="e.g. 1000"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button 
                  type="button" 
                  onClick={handleNext} 
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <span>Next: Energy</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Energy Info */}
          {step === 2 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Zap color="var(--warning)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Household Energy Consumption</h2>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Look up your utility bills to find weekly average metrics (or take your monthly bill and divide by 4).
              </p>

              <div className="form-group">
                <label htmlFor="electricityKwh">Weekly Electricity Consumption (kWh)</label>
                <input
                  id="electricityKwh"
                  type="number"
                  min="0"
                  value={electricityKwh}
                  onChange={(e) => setElectricityKwh(e.target.value)}
                  placeholder="e.g. 80"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="gasTherms">Weekly Heating Gas Consumption (Therms)</label>
                <input
                  id="gasTherms"
                  type="number"
                  min="0"
                  value={gasTherms}
                  onChange={(e) => setGasTherms(e.target.value)}
                  placeholder="e.g. 10"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  onClick={handlePrev} 
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <ArrowLeft size={18} />
                  <span>Back</span>
                </button>
                <button 
                  type="button" 
                  onClick={handleNext} 
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <span>Next: Diet</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Diet Info */}
          {step === 3 && (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <UtensilsCrossed color="var(--primary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Diet & Food Footprint</h2>
              </div>

              <div className="form-group">
                <label htmlFor="dietType">Primary Diet Classification</label>
                <select
                  id="dietType"
                  value={dietType}
                  onChange={(e) => setDietType(e.target.value)}
                >
                  <option value="meat_heavy">Meat Heavy (Frequent meat/poultry)</option>
                  <option value="average">Balanced/Average (Moderate meat)</option>
                  <option value="vegetarian">Vegetarian (No meat, eggs/dairy allowed)</option>
                  <option value="vegan">Vegan (Strictly plant-based)</option>
                </select>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'block' }}>
                  Diet is highly correlated to carbon footprint: meat heavy diets produce ~3x more emissions than plant-based diets.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                <button 
                  type="button" 
                  onClick={handlePrev} 
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <ArrowLeft size={18} />
                  <span>Back</span>
                </button>
                <button 
                  type="submit" 
                  className="btn btn-accent"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  disabled={submitting}
                >
                  <Leaf size={18} />
                  <span>{submitting ? 'Calculating...' : 'Submit & Calculate'}</span>
                </button>
              </div>
            </div>
          )}

        </form>
      </div>
    </div>
  );
};
