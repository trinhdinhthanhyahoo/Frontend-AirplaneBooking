class FlightAPI {
    constructor() {
        this.baseUrl = 'http://localhost:8080/api';
    }

    async getAirports() {
        const response = await fetch(`${this.baseUrl}/airports`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error('Failed to load airports');
        }

        return response.json();
    }

    async getAllFlights() {
        const response = await fetch(`${this.baseUrl}/flights`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            mode: 'cors'
        });

        if (!response.ok) {
            throw new Error('Failed to load flights');
        }

        return response.json();
    }

    async getAirportById(airportId) {
        try {
            const response = await fetch(`${this.baseUrl}/airports/${airportId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch airport info');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching airport:', error);
            return {
                city: '---',
                airportCode: '---'
            };
        }
    }
} 