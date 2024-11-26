const API_URL = 'http://localhost:8080/api';

const airportApi = {
    getAllAirports: async () => {
        try {
            const response = await fetch(`${API_URL}/airports`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error fetching airports:', error);
            throw error;
        }
    },

    searchByCity: async (city) => {
        try {
            const response = await fetch(`${API_URL}/airports/city/${city}`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error searching airports by city:', error);
            throw error;
        }
    },

    searchByCode: async (code) => {
        try {
            const response = await fetch(`${API_URL}/airports/code/${code}`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error searching airport by code:', error);
            throw error;
        }
    }
}; 