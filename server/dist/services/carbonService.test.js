"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const carbonService_1 = require("./carbonService");
describe('CarbonService - calculateWeeklyFootprint', () => {
    it('calculates carbon footprint correctly for standard average inputs', () => {
        const inputs = {
            carMiles: 100,
            vehicleType: 'gasoline',
            publicTransitMiles: 50,
            flightMiles: 0,
            electricityKwh: 100,
            gasTherms: 10,
            dietType: 'average'
        };
        const metrics = carbonService_1.CarbonService.calculateWeeklyFootprint(inputs);
        // Calculations breakdown:
        // Travel:
        // - Car: 100 * 0.40 = 40 kg CO2
        // - Transit: 50 * 0.10 = 5 kg CO2
        // - Flights: 0 * 0.25 = 0 kg CO2
        // - Total Travel = 45 kg
        // Energy:
        // - Electricity: 100 * 0.40 = 40 kg CO2
        // - Gas: 10 * 5.30 = 53 kg CO2
        // - Total Energy = 93 kg
        // Diet:
        // - Average daily: 5.0 kg * 7 days = 35 kg
        // Total = 45 + 93 + 35 = 173 kg CO2
        expect(metrics.travelCo2).toBe(45);
        expect(metrics.energyCo2).toBe(93);
        expect(metrics.dietCo2).toBe(35);
        expect(metrics.totalCo2).toBe(173);
    });
    it('calculates carbon footprint correctly for low carbon/eco-friendly options', () => {
        const inputs = {
            carMiles: 20,
            vehicleType: 'electric',
            publicTransitMiles: 100,
            flightMiles: 0,
            electricityKwh: 20,
            gasTherms: 0,
            dietType: 'vegan'
        };
        const metrics = carbonService_1.CarbonService.calculateWeeklyFootprint(inputs);
        // Calculations breakdown:
        // Travel:
        // - Car: 20 * 0.10 = 2 kg
        // - Transit: 100 * 0.10 = 10 kg
        // - Total Travel = 12 kg
        // Energy:
        // - Electricity: 20 * 0.40 = 8 kg
        // - Gas: 0 * 5.30 = 0 kg
        // - Total Energy = 8 kg
        // Diet:
        // - Vegan daily: 2.5 kg * 7 days = 17.5 kg
        // Total = 12 + 8 + 17.5 = 37.5 kg CO2
        expect(metrics.travelCo2).toBe(12);
        expect(metrics.energyCo2).toBe(8);
        expect(metrics.dietCo2).toBe(17.5);
        expect(metrics.totalCo2).toBe(37.5);
    });
    it('calculates carbon footprint correctly for meat-heavy high-emission lifestyles', () => {
        const inputs = {
            carMiles: 300,
            vehicleType: 'gasoline',
            publicTransitMiles: 0,
            flightMiles: 200,
            electricityKwh: 250,
            gasTherms: 30,
            dietType: 'meat_heavy'
        };
        const metrics = carbonService_1.CarbonService.calculateWeeklyFootprint(inputs);
        // Travel:
        // - Car: 300 * 0.40 = 120 kg
        // - Flights: 200 * 0.25 = 50 kg
        // - Total Travel = 170 kg
        // Energy:
        // - Electricity: 250 * 0.40 = 100 kg
        // - Gas: 30 * 5.30 = 159 kg
        // - Total Energy = 259 kg
        // Diet:
        // - Meat Heavy daily: 8.0 kg * 7 days = 56 kg
        // Total = 170 + 259 + 56 = 485 kg CO2
        expect(metrics.travelCo2).toBe(170);
        expect(metrics.energyCo2).toBe(259);
        expect(metrics.dietCo2).toBe(56);
        expect(metrics.totalCo2).toBe(485);
    });
});
