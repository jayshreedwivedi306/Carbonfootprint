"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarbonService = void 0;
class CarbonService {
    // Emission factors (in kg CO2)
    static CAR_FACTORS = {
        gasoline: 0.40, // kg per mile
        hybrid: 0.20,
        electric: 0.10,
        none: 0.0,
    };
    static PUBLIC_TRANSIT_FACTOR = 0.10; // kg per mile
    static FLIGHT_FACTOR = 0.25; // kg per mile
    static ELECTRICITY_FACTOR = 0.40; // kg per kWh
    static GAS_FACTOR = 5.30; // kg per therm
    static DIET_DAILY_FACTORS = {
        meat_heavy: 8.0, // kg CO2 per day
        average: 5.0,
        vegetarian: 3.5,
        vegan: 2.5,
    };
    /**
     * Calculates carbon footprint in kg CO2.
     * Inputs are expected to cover a weekly period.
     */
    static calculateWeeklyFootprint(inputs) {
        // 1. Travel calculations
        const carFactor = this.CAR_FACTORS[inputs.vehicleType] || this.CAR_FACTORS.none;
        const travelCo2 = (inputs.carMiles * carFactor) +
            (inputs.publicTransitMiles * this.PUBLIC_TRANSIT_FACTOR) +
            (inputs.flightMiles * this.FLIGHT_FACTOR);
        // 2. Energy calculations
        const energyCo2 = (inputs.electricityKwh * this.ELECTRICITY_FACTOR) +
            (inputs.gasTherms * this.GAS_FACTOR);
        // 3. Diet calculations (multiplied by 7 days for weekly footprint)
        const dietFactor = this.DIET_DAILY_FACTORS[inputs.dietType] || this.DIET_DAILY_FACTORS.average;
        const dietCo2 = dietFactor * 7;
        const totalCo2 = travelCo2 + energyCo2 + dietCo2;
        return {
            travelCo2: Math.round(travelCo2 * 100) / 100,
            energyCo2: Math.round(energyCo2 * 100) / 100,
            dietCo2: Math.round(dietCo2 * 100) / 100,
            totalCo2: Math.round(totalCo2 * 100) / 100,
        };
    }
}
exports.CarbonService = CarbonService;
