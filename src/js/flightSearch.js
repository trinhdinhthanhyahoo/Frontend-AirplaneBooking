// Tạo biến global
let flightSearch;

class FlightSearch {
    constructor() {
        this.api = new FlightAPI();
        this.airportCache = new Map();
        this.itemsPerPage = 5;
        this.currentPage = 1;
        this.allFlights = [];
        this.passengerCounts = {
            adult: 1,
            child: 0,
            infant: 0
        };

        // Khởi tạo khi DOM loaded
        this.initWhenReady();
    }

    initWhenReady() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    init() {
        this.form = document.getElementById('flight-search-form');
        this.tripTypeInputs = document.getElementsByName('tripType');
        this.returnDateGroup = document.getElementById('returnDateGroup');
        this.returnDateInput = document.getElementById('returnDate');
        this.departureDateInput = document.getElementById('departureDate');
        this.originSelect = document.getElementById('origin');
        this.destinationSelect = document.getElementById('destination');

        this.initializeEventListeners();
        this.setMinDates();
        this.loadAirports();
        this.loadFlights();
    }

    initializeEventListeners() {
        this.tripTypeInputs.forEach(input => {
            input.addEventListener('change', () => this.handleTripTypeChange());
        });

        this.form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Thêm event listeners cho passenger dropdown
        const passengerTrigger = document.getElementById('passengerTrigger');
        const passengerMenu = document.getElementById('passengerMenu');
        const doneBtn = document.getElementById('donePassengers');

        // Toggle dropdown
        passengerTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            passengerMenu.style.display = passengerMenu.style.display === 'block' ? 'none' : 'block';
        });

        // Đóng dropdown khi click bên ngoài
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.passenger-dropdown')) {
                passengerMenu.style.display = 'none';
            }
        });

        // Xử lý nút tăng/giảm
        document.querySelectorAll('.count-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = btn.dataset.type;
                const isPlus = btn.classList.contains('plus');
                this.updatePassengerCount(type, isPlus);
            });
        });

        // Nút Done
        doneBtn.addEventListener('click', () => {
            passengerMenu.style.display = 'none';
            this.updatePassengerSummary();
        });
    }

    handleTripTypeChange() {
        const isRoundTrip = this.form.querySelector('input[name="tripType"]:checked').value === 'roundTrip';
        this.returnDateGroup.style.display = isRoundTrip ? 'block' : 'none';
        this.returnDateInput.required = isRoundTrip;
    }

    setMinDates() {
        if (this.departureDateInput && this.returnDateInput) {
            const today = new Date().toISOString().split('T')[0];
            this.departureDateInput.min = today;
            this.returnDateInput.min = today;
        }
    }

    async loadAirports() {
        try {
            const airports = await this.api.getAirports();
            this.populateAirportSelects(airports);
        } catch (error) {
            console.error('Error loading airports:', error);
        }
    }

    populateAirportSelects(airports) {
        airports.sort((a, b) => a.city.localeCompare(b.city));
        const options = airports.map(airport =>
            `<option value="${airport.airportId}">
                ${airport.city} (${airport.airportCode}) - ${airport.airportName}
            </option>`
        );
        const defaultOption = '<option value="">Select airport</option>';
        this.originSelect.innerHTML = defaultOption + options.join('');
        this.destinationSelect.innerHTML = defaultOption + options.join('');
    }

    async loadFlights() {
        try {
            const flights = await this.api.getAllFlights();
            this.allFlights = flights;
            this.displayFlights();
        } catch (error) {
            console.error('Error loading flights:', error);
        }
    }

    async getAirportInfo(airportId) {
        if (this.airportCache.has(airportId)) {
            return this.airportCache.get(airportId);
        }

        try {
            const response = await fetch(`http://localhost:8080/api/airports/${airportId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch airport');
            }
            const airport = await response.json();
            this.airportCache.set(airportId, airport);
            return airport;
        } catch (error) {
            console.error('Error fetching airport:', error);
            return null;
        }
    }

    handleSubmit(e) {
        e.preventDefault();

        const formData = {
            departureAirportId: this.originSelect.value,
            arrivalAirportId: this.destinationSelect.value,
            departureDate: this.departureDateInput.value,
            isRoundTrip: this.form.querySelector('input[name="tripType"]:checked').value === 'roundTrip',
            passengers: document.getElementById('passengers').value || '1'
        };

        if (formData.isRoundTrip) {
            formData.returnDate = this.returnDateInput.value;
        }

        // Tạo URL với query parameters
        const searchParams = new URLSearchParams({
            departureAirportId: formData.departureAirportId,
            arrivalAirportId: formData.arrivalAirportId,
            departureDate: formData.departureDate,
            isRoundTrip: formData.isRoundTrip,
            passengers: formData.passengers
        });

        if (formData.returnDate) {
            searchParams.append('returnDate', formData.returnDate);
        }

        // Chuyển hướng đến trang kết quả tìm kiếm
        window.location.href = `search-results.html?${searchParams.toString()}`;
    }

    displayFlights() {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const paginatedFlights = this.allFlights.slice(start, end);

        const totalPages = Math.ceil(this.allFlights.length / this.itemsPerPage);

        this.generateFlightCards(paginatedFlights).then(html => {
            document.getElementById('departure-flights').innerHTML = html;
            this.renderPagination(totalPages);
        });
    }

    renderPagination(totalPages) {
        const pagination = document.querySelector('.pagination');
        let html = '';

        html += `
            <button class="page-btn prev-btn ${this.currentPage === 1 ? 'disabled' : ''}"
                    onclick="handlePageChange(${this.currentPage - 1})"
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                Previous
            </button>
        `;

        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= this.currentPage - 1 && i <= this.currentPage + 1)
            ) {
                html += `
                    <button class="page-btn number-btn ${i === this.currentPage ? 'active' : ''}"
                            onclick="handlePageChange(${i})">
                        ${i}
                    </button>
                `;
            } else if (
                i === this.currentPage - 2 ||
                i === this.currentPage + 2
            ) {
                html += `<span class="page-dots">...</span>`;
            }
        }

        html += `
            <button class="page-btn next-btn ${this.currentPage === totalPages ? 'disabled' : ''}"
                    onclick="handlePageChange(${this.currentPage + 1})"
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                Next
            </button>
        `;

        pagination.innerHTML = html;
    }

    changePage(page) {
        if (page < 1 || page > Math.ceil(this.allFlights.length / this.itemsPerPage)) {
            return;
        }
        this.currentPage = page;
        this.displayFlights();
    }

    async generateFlightCards(flights) {
        console.log('Generating cards for flights:', flights);
        if (!flights || flights.length === 0) {
            return '<div class="no-flights">No flights available</div>';
        }

        const flightCards = await Promise.all(flights.map(async flight => {
            const departureAirport = await this.getAirportInfo(flight.departureAirportId);
            const arrivalAirport = await this.getAirportInfo(flight.arrivalAirportId);
            console.log('Airport info:', departureAirport, arrivalAirport);

            return `
                <div class="flight-card">
                    <div class="flight-info">
                        <div class="flight-time">
                            <h3>${this.formatTime(flight.departureDateTime)}</h3>
                            <p>${this.formatDate(flight.departureDateTime)}</p>
                            <span class="airport-code">${departureAirport ? departureAirport.airportCode : '---'}</span>
                            <div class="airport-name">${departureAirport ? departureAirport.city : '---'}</div>
                        </div>
                        <div class="flight-route">
                            <span class="flight-code">${flight.flightCode}</span>
                            <div class="route-line"></div>
                        </div>
                        <div class="flight-time">
                            <h3>${this.formatTime(flight.arrivalDateTime)}</h3>
                            <p>${this.formatDate(flight.arrivalDateTime)}</p>
                            <span class="airport-code">${arrivalAirport ? arrivalAirport.airportCode : '---'}</span>
                            <div class="airport-name">${arrivalAirport ? arrivalAirport.city : '---'}</div>
                        </div>
                    </div>
                    <div class="flight-price">
                        <div class="price-amount">${flight.baseFare}VNĐ</div>
                        <button class="select-flight-btn" onclick="selectFlight('${flight.flightId}')">
                            Select
                        </button>
                    </div>
                </div>
            `;
        }));

        return flightCards.join('');
    }

    formatTime(dateTime) {
        return new Date(dateTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    formatDate(dateTime) {
        return new Date(dateTime).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }

    updatePassengerCount(type, isIncrease) {
        const currentCount = this.passengerCounts[type];
        const totalPassengers = Object.values(this.passengerCounts).reduce((a, b) => a + b, 0);

        if (isIncrease) {
            // Kiểm tra điều kiện tăng
            if (totalPassengers >= 9) return; // Giới hạn tổng số hành khách
            if (type === 'infant' && this.passengerCounts.infant >= this.passengerCounts.adult) return;
            this.passengerCounts[type]++;
        } else {
            // Kiểm tra điều kiện giảm
            if (type === 'adult' && currentCount <= 1) return; // Phải có ít nhất 1 người lớn
            if (currentCount <= 0) return;
            if (type === 'adult' && this.passengerCounts.infant >= (currentCount - 1)) return;
            this.passengerCounts[type]--;
        }

        // Cập nhật UI
        document.getElementById(`${type}Count`).textContent = this.passengerCounts[type];
        this.updatePassengerSummary();
        this.updateCountButtons();
    }

    updatePassengerSummary() {
        const total = Object.values(this.passengerCounts).reduce((a, b) => a + b, 0);
        const summary = `${total} Passenger${total > 1 ? 's' : ''}`;
        document.getElementById('totalPassengers').textContent = summary;
        document.getElementById('passengers').value = total;
    }

    updateCountButtons() {
        const totalPassengers = Object.values(this.passengerCounts).reduce((a, b) => a + b, 0);

        // Disable/enable minus buttons
        document.querySelectorAll('.count-btn.minus').forEach(btn => {
            const type = btn.dataset.type;
            const count = this.passengerCounts[type];
            btn.disabled = (type === 'adult' && count <= 1) || count <= 0;
        });

        // Disable/enable plus buttons
        document.querySelectorAll('.count-btn.plus').forEach(btn => {
            const type = btn.dataset.type;
            btn.disabled = totalPassengers >= 9 ||
                (type === 'infant' && this.passengerCounts.infant >= this.passengerCounts.adult);
        });
    }
}

// Hàm xử lý sự kiện click pagination
function handlePageChange(page) {
    if (flightSearch) {
        flightSearch.changePage(page);
    }
}

// Khởi tạo instance và gán vào biến global
flightSearch = new FlightSearch(); 