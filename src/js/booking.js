class Booking {
    constructor() {
        this.selectedFlightId = localStorage.getItem('selectedFlight');
        console.log('Selected flight ID:', this.selectedFlightId);

        const passengerCount = localStorage.getItem('passengerCount');
        this.passengerCount = passengerCount ? JSON.parse(passengerCount) : {
            adults: 1,
            children: 0,
            infants: 0
        };
        console.log('Passenger count:', this.passengerCount);

        this.API_URL = 'http://localhost:8080/api';
        this.paymentMethods = [];
        this.airports = {};
        this.selectedSeats = new Map();
        this.initialize();
    }

    async initialize() {
        try {
            if (!this.selectedFlightId) {
                alert('Không tìm thấy thông tin chuyến bay!');
                window.location.href = 'search-results.html';
                return;
            }

            if (!this.passengerCount) {
                alert('Không tìm thấy thông tin hành khách!');
                window.location.href = 'search-results.html';
                return;
            }

            await Promise.all([
                this.loadAirports(),
                this.loadFlightDetails(),
                this.loadPaymentMethods(),
                this.loadAvailableSeats()
            ]);

            this.displayFlightSummary();
            this.createPassengerForms();
            this.displayPriceSummary();
            this.displayPaymentMethods();
            this.setupFormSubmission();
            this.setupSeatSelection();
        } catch (error) {
            console.error('Error initializing booking:', error);
            alert('Có lỗi xảy ra khi tải thông tin chuyến bay!');
            window.location.href = 'search-results.html';
        }
    }

    async loadFlightDetails() {
        try {
            const response = await fetch(`${this.API_URL}/flights/${this.selectedFlightId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch flight details');
            }
            this.selectedFlight = await response.json();
            console.log('Loaded flight details:', this.selectedFlight);
        } catch (error) {
            console.error('Error loading flight details:', error);
            throw error;
        }
    }

    async loadPaymentMethods() {
        try {
            const response = await fetch(`${this.API_URL}/payment-methods/active`);
            if (!response.ok) {
                throw new Error('Failed to fetch payment methods');
            }
            this.paymentMethods = await response.json();
            console.log('Loaded payment methods:', this.paymentMethods);
        } catch (error) {
            console.error('Error loading payment methods:', error);
            throw error;
        }
    }

    displayPaymentMethods() {
        const container = document.querySelector('.payment-methods');
        container.innerHTML = this.paymentMethods.map(method => `
            <label class="payment-method">
                <input type="radio" name="paymentMethod" value="${method.paymentMethodId}" 
                    ${method === this.paymentMethods[0] ? 'checked' : ''}>
                <span>${method.methodName}</span>
                <div class="payment-details">
                    <p>${method.description}</p>
                    ${this.getPaymentInstructions(method.methodCode)}
                </div>
            </label>
        `).join('');
    }

    getPaymentInstructions(methodCode) {
        switch (methodCode) {
            case 'BANK_TRANSFER':
                return `
                    <div class="bank-details">
                        <p>Ngân hàng: VietcomBank</p>
                        <p>Số tài khoản: 1234567890</p>
                        <p>Chủ tài khoản: CÔNG TY AIRBOOK</p>
                        <p>Nội dung: [Mã đặt chỗ]</p>
                    </div>
                `;
            case 'MOMO':
                return `
                    <div class="momo-details">
                        <p>Quét mã QR hoặc chuyển khoản đến số điện thoại:</p>
                        <p>SĐT: 0123456789</p>
                        <p>Tên: AIRBOOK</p>
                    </div>
                `;
            case 'VISA':
                return `
                    <div class="visa-details">
                        <p>Bạn sẽ được chuyển đến cổng thanh toán an toàn của VISA</p>
                    </div>
                `;
            default:
                return '';
        }
    }

    displayFlightSummary() {
        const departureAirport = this.airports[this.selectedFlight.departureAirportId];
        const arrivalAirport = this.airports[this.selectedFlight.arrivalAirportId];

        const flightDetails = document.querySelector('.flight-details');
        flightDetails.innerHTML = `
            <div class="flight-route">
                <div class="departure">
                    <h3>${departureAirport.city}</h3>
                    <p class="airport-name">${departureAirport.airportName}</p>
                    <p class="datetime">${new Date(this.selectedFlight.departureDateTime).toLocaleString()}</p>
                </div>
                <div class="arrow">
                    <i class="fas fa-plane"></i>
                </div>
                <div class="arrival">
                    <h3>${arrivalAirport.city}</h3>
                    <p class="airport-name">${arrivalAirport.airportName}</p>
                    <p class="datetime">${new Date(this.selectedFlight.arrivalDateTime).toLocaleString()}</p>
                </div>
            </div>
            <div class="flight-info">
                <p>
                    <i class="fas fa-plane-departure"></i>
                    Chuyến bay: ${this.selectedFlight.flightCode}
                </p>
                <p>
                    <i class="fas fa-clock"></i>
                    Thời gian bay: ${this.calculateFlightDuration()}
                </p>
            </div>
        `;
    }

    createPassengerForms() {
        const container = document.getElementById('passengersContainer');
        let formHtml = '';

        for (let i = 0; i < this.passengerCount.adults; i++) {
            formHtml += this.createPassengerForm('Người lớn', i);
        }

        for (let i = 0; i < this.passengerCount.children; i++) {
            formHtml += this.createPassengerForm('Trẻ em', i + this.passengerCount.adults);
        }

        for (let i = 0; i < this.passengerCount.infants; i++) {
            formHtml += this.createPassengerForm('Em bé', i + this.passengerCount.adults + this.passengerCount.children);
        }

        container.innerHTML = formHtml;
    }

    createPassengerForm(type, index) {
        return `
            <div class="passenger-card">
                <h3>${type} #${index + 1}</h3>
                <div class="form-group">
                    <label>Họ và tên</label>
                    <input type="text" name="passengers[${index}].fullName" required>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Ngày sinh</label>
                        <input type="date" name="passengers[${index}].birthDate" required>
                    </div>
                    <div class="form-group">
                        <label>Giới tính</label>
                        <select name="passengers[${index}].gender" required>
                            <option value="">Chọn giới tính</option>
                            <option value="male">Nam</option>
                            <option value="female">Nữ</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label>Số CCCD/Hộ chiếu</label>
                    <input type="text" name="passengers[${index}].idNumber" required>
                </div>
            </div>
        `;
    }

    displayPriceSummary() {
        const totalPassengers =
            this.passengerCount.adults +
            this.passengerCount.children +
            this.passengerCount.infants;

        const summary = document.querySelector('.price-summary');
        summary.innerHTML = `
            <div class="price-row">
                <span>Giá vé cơ bản</span>
                <span>${this.formatCurrency(this.selectedFlight.baseFare)}</span>
            </div>
            <div class="price-row">
                <span>Số lượng hành khách</span>
                <span>${totalPassengers}</span>
            </div>
            <div class="price-row total">
                <span>Tổng tiền</span>
                <span>${this.formatCurrency(this.selectedFlight.baseFare * totalPassengers)}</span>
            </div>
        `;
    }

    setupFormSubmission() {
        const form = document.getElementById('bookingForm');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Validate seats selection
            if (this.selectedSeats.size < this.getTotalPassengers()) {
                alert('Vui lòng chọn đủ ghế ngồi cho tất cả hành khách!');
                return;
            }

            try {
                const submitBtn = form.querySelector('button[type="submit"]');
                this.setLoadingState(submitBtn, true);

                const formData = new FormData(form);
                const bookingData = {
                    passengers: this.getPassengersData(formData),
                    contactEmail: formData.get('contactEmail'),
                    contactPhone: formData.get('contactPhone'),
                    paymentMethod: formData.get('paymentMethod'),
                    selectedSeats: Array.from(this.selectedSeats.keys())
                };

                // Validate contact information
                if (!this.validateContactInfo(bookingData)) {
                    return;
                }

                const result = await this.submitBooking(bookingData);
                if (result && result.bookingReference) {
                    // Lưu thông tin booking và flight ID vào localStorage
                    const bookingInfo = {
                        bookingReference: result.bookingReference,
                        flightId: this.selectedFlightId,
                        totalAmount: result.totalAmount
                    };
                    localStorage.setItem('bookingInfo', JSON.stringify(bookingInfo));

                    // Chuyển đến trang xác nhận
                    window.location.href = `booking-confirmation.html?ref=${result.bookingReference}`;
                } else {
                    throw new Error('Không nhận được mã đặt chỗ');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Có lỗi xảy ra khi đặt vé. Vui lòng thử lại!');
            } finally {
                this.setLoadingState(submitBtn, false);
            }
        });
    }

    setLoadingState(button, isLoading) {
        button.disabled = isLoading;
        button.innerHTML = isLoading
            ? '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...'
            : 'Xác nhận đặt vé';
    }

    validateContactInfo(bookingData) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;

        if (!emailRegex.test(bookingData.contactEmail)) {
            alert('Email không hợp lệ!');
            return false;
        }

        if (!phoneRegex.test(bookingData.contactPhone)) {
            alert('Số điện thoại không hợp lệ!');
            return false;
        }

        return true;
    }

    getPassengersData(formData) {
        const passengers = [];
        const totalPassengers =
            this.passengerCount.adults +
            this.passengerCount.children +
            this.passengerCount.infants;

        for (let i = 0; i < totalPassengers; i++) {
            const passenger = {
                fullName: formData.get(`passengers[${i}].fullName`),
                birthDate: formData.get(`passengers[${i}].birthDate`),
                gender: formData.get(`passengers[${i}].gender`),
                idNumber: formData.get(`passengers[${i}].idNumber`) || null
            };

            // Validate dữ liệu
            if (!passenger.fullName || !passenger.birthDate || !passenger.gender) {
                throw new Error('Vui lòng điền đầy đủ thông tin hành khách');
            }

            passengers.push(passenger);
        }
        return passengers;
    }

    async submitBooking(bookingData) {
        try {
            // 1. Tạo/tìm hành khách
            const passengers = await this.createPassengers(bookingData.passengers);

            // Kiểm tra flightId
            if (!this.selectedFlightId) {
                throw new Error('Không tìm thấy thông tin chuyến bay');
            }

            // 2. Tạo booking
            const booking = {
                userId: JSON.parse(localStorage.getItem('user')).userId,
                // Đảm bảo flightId được gán đúng từ selectedFlight
                flightId: this.selectedFlight.flightId, // Sửa lại chỗ này
                bookingReference: this.generateBookingReference(),
                totalAmount: this.calculateTotalAmount(passengers.length),
                status: "PENDING",
                paymentStatus: "UNPAID",
                passengerCount: this.getTotalPassengers(),
                seatCodes: Array.from(this.selectedSeats.values()).map(seat => seat.seatCode),
                contactEmail: bookingData.contactEmail,
                contactPhone: bookingData.contactPhone,
                paymentMethodId: bookingData.paymentMethod,
                createdAt: new Date().toISOString()
            };

            // Log để debug
            console.log('Selected Flight:', this.selectedFlight);
            console.log('Flight ID:', this.selectedFlight.flightId);
            console.log('Sending booking data:', booking);

            const response = await fetch(`${this.API_URL}/bookings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(booking)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to create booking: ${errorData.message || response.statusText}`);
            }

            const result = await response.json();

            // Lưu thông tin vào localStorage
            localStorage.setItem('bookingInfo', JSON.stringify({
                bookingReference: result.bookingReference,
                flightId: this.selectedFlight.flightId,
                totalAmount: result.totalAmount
            }));

            return result;
        } catch (error) {
            console.error('Error creating booking:', error);
            throw error;
        }
    }

    // Thêm phương thức tính tổng tiền
    calculateTotalAmount(passengerCount) {
        let totalAmount = this.selectedFlight.baseFare * passengerCount;

        // Cộng thêm giá ghế nếu có
        this.selectedSeats.forEach(seat => {
            totalAmount += seat.price || 0;
        });

        return totalAmount;
    }

    async createPassengers(passengersData) {
        try {
            const createdPassengers = [];

            for (const passenger of passengersData) {
                // Log dữ liệu trưc khi gửi
                console.log('Sending passenger data:', {
                    fullName: passenger.fullName,
                    gender: passenger.gender.toUpperCase(),
                    dateOfBirth: passenger.birthDate,
                    citizenId: passenger.idNumber
                });

                // Kiểm tra hành khách đã tn tại chưa
                if (passenger.idNumber) {  // Chỉ tìm kiếm nếu có citizenId
                    const existingPassenger = await this.findPassengerByCitizenId(passenger.idNumber);
                    if (existingPassenger) {
                        console.log('Using existing passenger:', existingPassenger);
                        createdPassengers.push(existingPassenger);
                        continue;  // Chuyển sang hành khách tiếp theo
                    }
                }

                // Tạo payload cho API
                const passengerData = {
                    fullName: passenger.fullName.trim(),
                    gender: passenger.gender.toUpperCase(),
                    dateOfBirth: new Date(passenger.birthDate).toISOString().split('T')[0],
                    citizenId: passenger.idNumber || null  // Nếu không có thì gửi null
                };

                // Tạo hành khách mi
                const response = await fetch(`${this.API_URL}/passengers`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(passengerData)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Server error:', errorData);
                    throw new Error(`Failed to create passenger: ${errorData.message || response.statusText}`);
                }

                const newPassenger = await response.json();
                console.log('Created new passenger:', newPassenger);
                createdPassengers.push(newPassenger);
            }

            return createdPassengers;
        } catch (error) {
            console.error('Error handling passengers:', error);
            throw error;
        }
    }

    async findPassengerByCitizenId(citizenId) {
        try {
            const response = await fetch(`${this.API_URL}/passengers/citizen/${citizenId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (response.status === 404) {
                return null;
            }

            if (!response.ok) {
                throw new Error('Failed to search passenger');
            }

            const passenger = await response.json();
            console.log('Found existing passenger:', passenger);
            return passenger;

        } catch (error) {
            console.error('Error searching passenger:', error);
            return null;
        }
    }

    generateBookingReference() {
        // Tạo mã booking 8 ký tự: 2 chữ + 6 số
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numbers = '0123456789';

        let reference = '';

        // Thêm 2 chữ cái
        for (let i = 0; i < 2; i++) {
            reference += letters.charAt(Math.floor(Math.random() * letters.length));
        }

        // Thêm 6 số
        for (let i = 0; i < 6; i++) {
            reference += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }

        return reference;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    async loadAirports() {
        try {
            const response = await fetch(`${this.API_URL}/airports`);
            if (!response.ok) {
                throw new Error('Failed to fetch airports');
            }
            const airports = await response.json();

            // Chuyển đổi mảng thành object với key là airportId
            this.airports = airports.reduce((acc, airport) => {
                acc[airport.airportId] = airport;
                return acc;
            }, {});

            console.log('Loaded airports:', this.airports);
        } catch (error) {
            console.error('Error loading airports:', error);
            throw error;
        }
    }

    calculateFlightDuration() {
        const departure = new Date(this.selectedFlight.departureDateTime);
        const arrival = new Date(this.selectedFlight.arrivalDateTime);
        const duration = arrival - departure;

        const hours = Math.floor(duration / (1000 * 60 * 60));
        const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

        return `${hours}h ${minutes}m`;
    }

    async loadAvailableSeats() {
        try {
            const response = await fetch(`${this.API_URL}/seats/flight/${this.selectedFlightId}/available`);
            if (!response.ok) {
                throw new Error('Failed to fetch available seats');
            }
            this.availableSeats = await response.json();
            console.log('Available seats:', this.availableSeats);

            // Gọi setupSeatSelection sau khi đã load được dữ liệu ghế
            this.setupSeatSelection();
        } catch (error) {
            console.error('Error loading seats:', error);
            throw error;
        }
    }

    setupSeatSelection() {
        const seatMap = document.getElementById('seatMap');
        if (!seatMap) {
            console.error('Seat map container not found');
            return;
        }

        // Tạo layout ghế
        const rows = 30; // Số hàng
        const cols = ['A', 'B', 'C', 'D', 'E', 'F']; // Các cột

        let html = '<div class="exit-row">Lối thoát hiểm phía trước</div>';

        for (let row = 1; row <= rows; row++) {
            html += '<div class="seat-row">';
            html += `<div class="row-number">${row}</div>`;

            cols.forEach((col, index) => {
                const seatCode = `${row}${col}`;
                const seat = this.availableSeats.find(s => s.seatCode === seatCode);

                // Thêm lối đi giữa ghế C và D
                if (col === 'D') {
                    html += '<div class="aisle"></div>';
                }

                html += this.createSeatHTML(seat, seatCode);
            });

            html += '</div>';

            // Thêm lối thoát hiểm ở hàng 12
            if (row === 12) {
                html += '<div class="exit-row">Lối thoát hiểm</div>';
            }
        }

        html += '<div class="exit-row">Lối thoát hiểm phía sau</div>';
        seatMap.innerHTML = html;

        // Thêm event listeners cho các ghế
        const seats = seatMap.querySelectorAll('.seat');
        seats.forEach(seat => {
            if (seat.classList.contains('available')) {
                seat.addEventListener('click', () => this.handleSeatSelection(seat));
            }
        });
    }

    createSeatHTML(seat, seatCode) {
        if (!seat) {
            return `<div class="seat unavailable" data-seat-code="${seatCode}">
                <span class="seat-code">${seatCode}</span>
            </div>`;
        }

        const statusClass = seat.seatStatus === 'AVAILABLE' ? 'available' : 'occupied';
        const seatClass = seat.seatClass.toLowerCase();

        return `
            <div class="seat ${statusClass} ${seatClass}"
                 data-seat-id="${seat.seatId}"
                 data-seat-code="${seat.seatCode}"
                 data-price="${seat.seatPrice}">
                <span class="seat-code">${seat.seatCode}</span>
                <span class="seat-price">${this.formatCurrency(seat.seatPrice)}</span>
            </div>
        `;
    }

    handleSeatSelection(seatElement) {
        if (!seatElement.classList.contains('available')) {
            return;
        }

        const seatId = seatElement.dataset.seatId;
        const seatCode = seatElement.dataset.seatCode;
        const remainingSeats = this.getTotalPassengers() - this.selectedSeats.size;

        if (seatElement.classList.contains('selected')) {
            seatElement.classList.remove('selected');
            this.selectedSeats.delete(seatId);
        } else if (remainingSeats > 0) {
            seatElement.classList.add('selected');
            this.selectedSeats.set(seatId, {
                seatCode: seatCode,
                price: parseFloat(seatElement.dataset.price)
            });

            if (remainingSeats > 1) {
                this.showNotification(`Vui lòng chọn thêm ${remainingSeats - 1} ghế nữa`);
            }
        } else {
            this.showNotification('Bạn đã chọn đủ số ghế cho số hành khách!', 'warning');
            return;
        }

        this.updateSelectedSeatsList();
        this.updateSubmitButtonState();
        this.updateTotalPrice();
    }

    updateTotalPrice() {
        let totalPrice = 0;
        this.selectedSeats.forEach(seat => {
            totalPrice += seat.price;
        });

        const summary = document.querySelector('.price-summary');
        if (summary) {
            const totalElement = summary.querySelector('.total span:last-child');
            if (totalElement) {
                totalElement.textContent = this.formatCurrency(totalPrice);
            }
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `seat-notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'warning' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
            ${message}
        `;

        const container = document.querySelector('.seat-selection');
        container.appendChild(notification);

        // Animation
        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    updateSelectedSeatsList() {
        const selectedSeatsContainer = document.getElementById('selectedSeatsList');
        selectedSeatsContainer.innerHTML = '';

        if (this.selectedSeats.size === 0) {
            selectedSeatsContainer.innerHTML = '<p>Chưa chọn chỗ ngồi</p>';
            return;
        }

        // Tạo bảng hiển thị ghế đã chọn
        const table = document.createElement('table');
        table.className = 'selected-seats-table';

        // Tạo header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Số ghế</th>
                <th>Vị trí</th>
                <th>Hành khách</th>
                <th></th>
            </tr>
        `;
        table.appendChild(thead);

        // Tạo body
        const tbody = document.createElement('tbody');
        const passengers = this.getPassengersData(new FormData(document.getElementById('bookingForm')));

        Array.from(this.selectedSeats.entries()).forEach(([seatId, seatNumber], index) => {
            const row = document.createElement('tr');
            const passenger = passengers[index] || { fullName: 'Chưa chỉ định' };

            row.innerHTML = `
                <td>${seatNumber}</td>
                <td>${this.getSeatPosition(seatNumber)}</td>
                <td>${passenger.fullName}</td>
                <td>
                    <button type="button" class="btn-remove-seat" data-seat-id="${seatId}">
                        <i class="fas fa-times"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        selectedSeatsContainer.appendChild(table);

        // Thêm event listeners cho các nút xóa
        const removeButtons = selectedSeatsContainer.querySelectorAll('.btn-remove-seat');
        removeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const seatId = button.dataset.seatId;
                const seatElement = document.querySelector(`[data-seat-id="${seatId}"]`);
                if (seatElement) {
                    this.handleSeatSelection(seatElement);
                }
            });
        });
    }

    getSeatPosition(seatNumber) {
        // Chuyển đổi số ghế thành vị trí (ví dụ: 1A -> Cửa sổ, 1C -> Lối đi)
        const position = seatNumber.slice(-1);
        switch (position) {
            case 'A':
            case 'F':
                return 'Cửa sổ';
            case 'B':
            case 'E':
                return 'Giữa';
            case 'C':
            case 'D':
                return 'Lối đi';
            default:
                return 'Không xác định';
        }
    }

    getTotalPassengers() {
        return this.passengerCount.adults +
            this.passengerCount.children +
            this.passengerCount.infants;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Booking();
}); 