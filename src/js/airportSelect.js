class AirportSelect {
    constructor() {
        console.log('AirportSelect initialized');
        this.originSelect = document.getElementById('origin');
        this.destinationSelect = document.getElementById('destination');
        this.loadAirports();
    }

    async loadAirports() {
        try {
            console.log('Fetching airports...');
            const response = await fetch('http://localhost:8080/api/airports', {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                mode: 'cors'
            });
            const airports = await response.json();
            console.log('Airports loaded:', airports);
            this.populateSelects(airports);
        } catch (error) {
            console.error('Error loading airports:', error);
        }
    }

    populateSelects(airports) {
        // Sort airports by city name
        airports.sort((a, b) => a.city.localeCompare(b.city));

        const options = airports.map(airport =>
            `<option value="${airport.airportCode}">
                ${airport.city} (${airport.airportCode}) - ${airport.airportName}
            </option>`
        );

        // Add options to both selects
        const optionsHtml = '<option value="">Select airport</option>' + options.join('');
        this.originSelect.innerHTML = optionsHtml;
        this.destinationSelect.innerHTML = optionsHtml;

        // Add event listeners
        this.originSelect.addEventListener('change', () => this.handleOriginChange());
        this.destinationSelect.addEventListener('change', () => this.handleDestinationChange());
    }

    handleOriginChange() {
        const selectedValue = this.originSelect.value;
        // Enable all options in destination
        Array.from(this.destinationSelect.options).forEach(option => {
            option.disabled = false;
        });
        // Disable the selected origin in destination
        if (selectedValue) {
            const option = this.destinationSelect.querySelector(`option[value="${selectedValue}"]`);
            if (option) option.disabled = true;
        }
    }

    handleDestinationChange() {
        const selectedValue = this.destinationSelect.value;
        // Enable all options in origin
        Array.from(this.originSelect.options).forEach(option => {
            option.disabled = false;
        });
        // Disable the selected destination in origin
        if (selectedValue) {
            const option = this.originSelect.querySelector(`option[value="${selectedValue}"]`);
            if (option) option.disabled = true;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AirportSelect();
}); 