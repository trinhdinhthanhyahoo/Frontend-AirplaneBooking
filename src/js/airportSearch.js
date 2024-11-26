import { airportApi } from './api/airportApi.js';

class AirportSearch {
    constructor() {
        this.originInput = document.getElementById('origin');
        this.destinationInput = document.getElementById('destination');
        this.originSuggestions = document.getElementById('origin-suggestions');
        this.destinationSuggestions = document.getElementById('destination-suggestions');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.originInput.addEventListener('input', (e) => this.handleInput(e, this.originSuggestions));
        this.destinationInput.addEventListener('input', (e) => this.handleInput(e, this.destinationSuggestions));

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-group')) {
                this.originSuggestions.classList.remove('active');
                this.destinationSuggestions.classList.remove('active');
            }
        });
    }

    async handleInput(event, suggestionsElement) {
        const value = event.target.value.trim();

        if (value.length < 2) {
            suggestionsElement.classList.remove('active');
            return;
        }

        try {
            const airports = await airportApi.searchByCity(value);
            this.displaySuggestions(airports, suggestionsElement, event.target);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    }

    displaySuggestions(airports, suggestionsElement, inputElement) {
        suggestionsElement.innerHTML = '';

        airports.forEach(airport => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';
            div.innerHTML = `
                <span class="airport-code">${airport.airportCode}</span>
                <span class="airport-name">${airport.airportName}</span>
                <div>${airport.city}, ${airport.country}</div>
            `;

            div.addEventListener('click', () => {
                inputElement.value = `${airport.city} (${airport.airportCode})`;
                suggestionsElement.classList.remove('active');
            });

            suggestionsElement.appendChild(div);
        });

        suggestionsElement.classList.add('active');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AirportSearch();
}); 