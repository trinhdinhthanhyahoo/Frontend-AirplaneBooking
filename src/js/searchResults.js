class SearchResults {
    constructor() {
        this.flights = [];
        this.filteredFlights = [];
        this.airports = {};
        this.airlines = {
            'VN': 'Vietnam Airlines',
            'VJ': 'Vietjet Air',
            'BL': 'Pacific Airlines',
            'QH': 'Bamboo Airways'
        };
        this.API_URL = 'http://localhost:8080/api';
        this.searchParams = new URLSearchParams(window.location.search);
        this.initialize();
        this.initializePassengerControls();
    }

    async initialize() {
        console.log('Initializing SearchResults...');
        await this.loadAirports();
        await this.loadAllFlights();
        this.applySearchCriteria();
    }

    async loadAirports() {
        try {
            console.log('Fetching airports from:', `${this.API_URL}/airports`);
            const response = await fetch(`${this.API_URL}/airports`);

            if (!response.ok) {
                throw new Error('Failed to fetch airports');
            }

            const airports = await response.json();
            console.log('Received airports data:', airports);

            this.airports = airports.reduce((acc, airport) => {
                acc[airport.airportId] = {
                    airportId: airport.airportId,
                    city: airport.city,
                    name: airport.airportName,
                    code: airport.airportCode
                };
                return acc;
            }, {});

            console.log('Processed airports data:', this.airports);

        } catch (error) {
            console.error('Error loading airports:', error);
        }
    }

    async loadAllFlights() {
        try {
            console.log('Fetching flights from:', `${this.API_URL}/flights`);
            const response = await fetch(`${this.API_URL}/flights`);

            if (!response.ok) {
                throw new Error('Failed to fetch flights');
            }

            const data = await response.json();
            console.log('Received flights data:', data);

            this.flights = data;
            console.log('Stored flights:', this.flights);

            if (Object.keys(this.airports).length > 0) {
                this.initializeFilterOptions();
                this.applyFilters();
            } else {
                console.error('Airport data not loaded yet');
            }
        } catch (error) {
            console.error('Error loading flights:', error);
            document.getElementById('flightResults').innerHTML =
                '<p class="error">Có lỗi xảy ra khi tải dữ liệu. Vui lòng thử lại sau.</p>';
        }
    }

    initializeFilterOptions() {
        try {
            const airports = Object.values(this.airports);

            const originSelect = document.getElementById('originSelect');
            originSelect.innerHTML = '<option value="">Tất cả điểm đi</option>';

            const sortedAirports = airports.sort((a, b) =>
                a.city.localeCompare(b.city, 'vi')
            );

            sortedAirports.forEach(airport => {
                originSelect.innerHTML += `
                    <option value="${airport.airportId}">
                        ${airport.city} (${airport.code})
                    </option>
                `;
            });

            const destinationSelect = document.getElementById('destinationSelect');
            destinationSelect.innerHTML = '<option value="">Tất cả điểm đến</option>';

            sortedAirports.forEach(airport => {
                destinationSelect.innerHTML += `
                    <option value="${airport.airportId}">
                        ${airport.city} (${airport.code})
                    </option>
                `;
            });

            const prices = this.flights.map(f => f.baseFare);
            const minPrice = Math.min(...prices);
            const maxPrice = Math.max(...prices);
            const priceRange = document.getElementById('priceRange');
            priceRange.min = minPrice;
            priceRange.max = maxPrice;
            priceRange.value = maxPrice;

            document.getElementById('minPrice').textContent = this.formatCurrency(minPrice);
            document.getElementById('maxPrice').textContent = this.formatCurrency(maxPrice);

            // Thêm event listeners
            document.getElementById('originSelect').addEventListener('change', () => this.applyFilters());
            document.getElementById('destinationSelect').addEventListener('change', () => this.applyFilters());
            document.getElementById('departureDate').addEventListener('change', () => this.applyFilters());
            document.getElementById('priceRange').addEventListener('input', () => this.applyFilters());

            // Khởi tạo bộ lọc thời gian nếu có
            const timeFilters = document.querySelectorAll('.time-filters input');
            timeFilters.forEach(filter => {
                filter.addEventListener('change', () => this.applyFilters());
            });

            // Thêm event listeners cho airline filters
            const airlineFilters = document.querySelectorAll('.airline-filters input[type="checkbox"]');
            airlineFilters.forEach(filter => {
                filter.addEventListener('change', () => this.applyFilters());
            });

        } catch (error) {
            console.error('Error initializing filter options:', error);
        }
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return {
            time: date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            date: date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        };
    }

    getAirlineName(flightCode) {
        const airlineCode = flightCode.substring(0, 2);
        return this.airlines[airlineCode] || airlineCode;
    }

    applyFilters() {
        try {
            console.log('Applying filters...');
            let filtered = [...this.flights];
            console.log('Initial flights:', filtered);

            const origin = document.getElementById('originSelect').value;
            console.log('Selected origin:', origin);
            if (origin) {
                filtered = filtered.filter(flight => {
                    console.log('Comparing:', flight.departureAirportId, origin);
                    return flight.departureAirportId === origin;
                });
            }

            const destination = document.getElementById('destinationSelect').value;
            console.log('Selected destination:', destination);
            if (destination) {
                filtered = filtered.filter(flight => {
                    console.log('Comparing:', flight.arrivalAirportId, destination);
                    return flight.arrivalAirportId === destination;
                });
            }

            const dateFilter = document.getElementById('departureDate').value;
            if (dateFilter) {
                const selectedDate = new Date(dateFilter);
                selectedDate.setHours(0, 0, 0, 0); // Reset time to start of day
                filtered = filtered.filter(flight => {
                    const flightDate = new Date(flight.departureDateTime);
                    flightDate.setHours(0, 0, 0, 0);
                    return flightDate.getTime() === selectedDate.getTime();
                });
            }

            const maxPrice = document.getElementById('priceRange').value;
            if (maxPrice) {
                filtered = filtered.filter(flight =>
                    flight.baseFare <= parseInt(maxPrice)
                );
            }

            // Lọc theo hãng bay
            const selectedAirlines = Array.from(document.querySelectorAll('.airline-filters input[type="checkbox"]:checked'))
                .map(checkbox => checkbox.value);

            if (selectedAirlines.length > 0) {
                filtered = filtered.filter(flight => {
                    const airlineCode = flight.flightNumber.substring(0, 2);
                    return selectedAirlines.includes(airlineCode);
                });
            }

            console.log('Filtered flights:', filtered);

            // Render kết quả
            const resultsContainer = document.getElementById('flightResults');
            if (filtered.length === 0) {
                resultsContainer.innerHTML = '<p class="no-results">Không tìm thấy chuyến bay phù hợp.</p>';
                return;
            }

            resultsContainer.innerHTML = '';
            filtered.forEach(flight => {
                const flightElement = this.createFlightElement(flight);
                resultsContainer.appendChild(flightElement);
            });

        } catch (error) {
            console.error('Error applying filters:', error);
            document.getElementById('flightResults').innerHTML =
                '<p class="error">Có lỗi xảy ra khi lọc dữ liệu.</p>';
        }
    }

    renderResults() {
        const container = document.getElementById('flightResults');
        container.innerHTML = '';

        if (this.filteredFlights.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-plane-slash"></i>
                    <p>Không tìm thấy chuyến bay phù hợp với tiêu chí tìm kiếm của bạn</p>
                    <p class="suggestion">Vui lòng thử lại với các tiêu chí khác</p>
                </div>`;
            return;
        }

        const resultHeader = document.createElement('div');
        resultHeader.className = 'results-header';
        resultHeader.innerHTML = `
            <div class="result-count">
                <i class="fas fa-plane"></i>
                <span>Tìm thấy ${this.filteredFlights.length} chuyến bay</span>
            </div>
            <div class="sort-options">
                <select id="sortSelect">
                    <option value="price-asc">Giá tăng dần</option>
                    <option value="price-desc">Giá giảm dần</option>
                    <option value="time-asc">Thời gian bay sớm nhất</option>
                    <option value="time-desc">Thời gian bay muộn nhất</option>
                </select>
            </div>
        `;
        container.appendChild(resultHeader);

        const resultsGrid = document.createElement('div');
        resultsGrid.className = 'results-grid';
        this.filteredFlights.forEach(flight => {
            resultsGrid.appendChild(this.createFlightElement(flight));
        });
        container.appendChild(resultsGrid);
    }

    createFlightElement(flight) {
        console.log('Creating flight element for:', flight);
        const element = document.createElement('div');
        element.className = 'flight-card';

        const departureTime = new Date(flight.departureDateTime);
        const arrivalTime = new Date(flight.arrivalDateTime);
        const durationInMs = arrivalTime - departureTime;
        const hours = Math.floor(durationInMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationInMs % (1000 * 60 * 60)) / (1000 * 60));

        // Tìm sân bay dựa trên departureAirportId và arrivalAirportId
        const getAirportByUUID = (uuid) => {
            return Object.values(this.airports).find(airport =>
                airport.airportId === uuid
            ) || { city: 'Unknown', code: 'XXX', name: 'Unknown Airport' };
        };

        const departureAirport = getAirportByUUID(flight.departureAirportId);
        const arrivalAirport = getAirportByUUID(flight.arrivalAirportId);

        console.log('Departure airport:', departureAirport);
        console.log('Arrival airport:', arrivalAirport);

        const airlineCode = flight.flightCode.substring(0, 2).toLowerCase();
        const airlineLogo = `
            <div class="airline-info">
                <img src="images/airlines/${airlineCode}.png" 
                     alt="${this.airlines[airlineCode.toUpperCase()]}"
                     class="airline-logo"
                     onerror="this.onerror=null; this.src='images/airlines/default.png';"
                >
                <span class="flight-code">${flight.flightCode}</span>
            </div>
        `;

        element.innerHTML = `
            <div class="flight-info">
                <div class="flight-time">
                    <h3>${this.formatTime(departureTime)}</h3>
                    <p>${this.formatDate(departureTime)}</p>
                    <span class="airport-code">${departureAirport.code}</span>
                    <div class="airport-name">${departureAirport.city}</div>
                </div>

                <div class="flight-route">
                    ${airlineLogo}
                    <div class="duration">
                        <span>${hours}h ${minutes}m</span>
                        <div class="route-line">
                            <i class="fas fa-plane"></i>
                        </div>
                        <span>Bay thẳng</span>
                    </div>
                </div>

                <div class="flight-time">
                    <h3>${this.formatTime(arrivalTime)}</h3>
                    <p>${this.formatDate(arrivalTime)}</p>
                    <span class="airport-code">${arrivalAirport.code}</span>
                    <div class="airport-name">${arrivalAirport.city}</div>
                </div>
            </div>

            <div class="flight-price">
                <div class="price-amount">${this.formatCurrency(flight.baseFare)}</div>
                <button class="select-flight-btn" onclick="searchResults.handleFlightSelection('${flight.flightId}')">
                    Chọn
                </button>
            </div>
        `;

        return element;
    }

    formatTime(date) {
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    formatDate(date) {
        return date.toLocaleDateString('vi-VN', {
            month: 'short',
            day: 'numeric'
        });
    }

    handleFlightSelection(flightId) {
        try {
            console.log('Selected flight ID:', flightId);

            // Kiểm tra đăng nhập
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user) {
                alert('Vui lòng đăng nhập để đặt vé!');
                window.location.href = 'login.html';
                return;
            }

            // Lưu flightId vào localStorage
            localStorage.setItem('selectedFlight', flightId);
            console.log('Saved to localStorage:', localStorage.getItem('selectedFlight'));

            // Chuyển đến trang booking
            window.location.href = 'booking.html';

        } catch (error) {
            console.error('Error:', error);
            alert('Có lỗi xảy ra. Vui lòng thử lại!');
        }
    }

    async searchAirportsByCity(city) {
        try {
            const response = await fetch(`${this.API_URL}/airports/city/${city}`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error searching airports by city:', error);
            throw error;
        }
    }

    async searchAirportsByCode(code) {
        try {
            const response = await fetch(`${this.API_URL}/airports/code/${code}`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error searching airport by code:', error);
            throw error;
        }
    }

    async getAirportById(id) {
        try {
            const response = await fetch(`${this.API_URL}/airports/${id}`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error fetching airport by ID:', error);
            throw error;
        }
    }

    async searchAirportsByCountry(country) {
        try {
            const response = await fetch(`${this.API_URL}/airports/country/${country}`);
            if (!response.ok) throw new Error('Network response was not ok');
            return await response.json();
        } catch (error) {
            console.error('Error searching airports by country:', error);
            throw error;
        }
    }

    async createAirport(airportData) {
        try {
            const response = await fetch(`${this.API_URL}/airports`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(airportData)
            });
            if (!response.ok) throw new Error('Failed to create airport');
            return await response.json();
        } catch (error) {
            console.error('Error creating airport:', error);
            throw error;
        }
    }

    async updateAirport(id, airportData) {
        try {
            const response = await fetch(`${this.API_URL}/airports/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(airportData)
            });
            if (!response.ok) throw new Error('Failed to update airport');
            return await response.json();
        } catch (error) {
            console.error('Error updating airport:', error);
            throw error;
        }
    }

    async deleteAirport(id) {
        try {
            const response = await fetch(`${this.API_URL}/airports/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete airport');
            return true;
        } catch (error) {
            console.error('Error deleting airport:', error);
            throw error;
        }
    }

    applySearchCriteria() {
        // Lấy các giá trị từ URL parameters
        const departureId = this.searchParams.get('departureAirportId');
        const arrivalId = this.searchParams.get('arrivalAirportId');
        const departureDate = this.searchParams.get('departureDate');
        const passengers = this.searchParams.get('passengers');

        console.log('Search criteria:', {
            departureId,
            arrivalId,
            departureDate,
            passengers
        });

        // Set giá trị cho các bộ lọc
        if (departureId) {
            document.getElementById('originSelect').value = departureId;
        }
        if (arrivalId) {
            document.getElementById('destinationSelect').value = arrivalId;
        }
        if (departureDate) {
            document.getElementById('departureDate').value = departureDate;
        }

        // Lọc chuyến bay theo tiêu chí
        this.filteredFlights = this.flights.filter(flight => {
            let matches = true;

            if (departureId) {
                matches = matches && flight.departureAirportId === departureId;
            }
            if (arrivalId) {
                matches = matches && flight.arrivalAirportId === arrivalId;
            }
            if (departureDate) {
                const flightDate = new Date(flight.departureDateTime).toISOString().split('T')[0];
                matches = matches && flightDate === departureDate;
            }

            return matches;
        });

        // Render kết quả
        this.renderResults();
    }

    initializePassengerControls() {
        const qtyBtns = document.querySelectorAll('.qty-btn');
        qtyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.dataset.type;
                const isPlus = btn.classList.contains('plus');
                this.updatePassengerCount(type, isPlus);
            });
        });

        // Khôi phục số lượng hành khách từ URL parameters
        const passengers = this.searchParams.get('passengers');
        if (passengers) {
            const [adults, children, infants] = passengers.split(',').map(Number);
            document.getElementById('adultCount').value = adults || 1;
            document.getElementById('childCount').value = children || 0;
            document.getElementById('infantCount').value = infants || 0;
        }
    }

    updatePassengerCount(type, isIncrease) {
        const input = document.getElementById(`${type}Count`);
        let value = parseInt(input.value);
        const min = parseInt(input.min);
        const max = parseInt(input.max);

        if (isIncrease) {
            value = Math.min(value + 1, max);
        } else {
            value = Math.max(value - 1, min);
        }

        input.value = value;

        // Cập nhật URL với số lượng hành khách mới
        const adults = document.getElementById('adultCount').value;
        const children = document.getElementById('childCount').value;
        const infants = document.getElementById('infantCount').value;

        const newParams = new URLSearchParams(window.location.search);
        newParams.set('passengers', `${adults},${children},${infants}`);

        // Cập nhật URL không reload trang
        window.history.replaceState({}, '', `${window.location.pathname}?${newParams}`);

        // Lưu vào localStorage để sử dụng khi đặt vé
        localStorage.setItem('passengerCount', JSON.stringify({
            adults: parseInt(adults),
            children: parseInt(children),
            infants: parseInt(infants)
        }));

        // Cập nhật lại kết quả tìm kiếm
        this.applyFilters();
    }
}

// Tạo instance toàn cục để có thể gọi từ onclick
let searchResults;
document.addEventListener('DOMContentLoaded', () => {
    searchResults = new SearchResults();
}); 