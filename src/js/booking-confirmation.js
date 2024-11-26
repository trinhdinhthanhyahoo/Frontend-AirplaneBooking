class BookingConfirmation {
    constructor() {
        this.API_URL = 'http://localhost:8080/api';
        const urlParams = new URLSearchParams(window.location.search);
        this.bookingRef = urlParams.get('ref');

        if (!this.bookingRef) {
            this.showError('Không tìm thấy mã đặt vé!');
            setTimeout(() => window.location.href = 'index.html', 3000);
            return;
        }

        this.initialize();
    }

    async initialize() {
        try {
            this.showLoading(true);

            const booking = await this.getBookingDetails();
            this.booking = booking;

            if (!this.booking) {
                throw new Error('Không tìm thấy thông tin đặt vé');
            }

            console.log('Booking data:', this.booking);

            this.displayBookingReference();
            await Promise.all([
                this.displayFlightDetails(),
                this.displayPassengerList()
            ]);

            this.setupActionButtons();
            this.startPaymentCountdown();
            this.startStatusRefresh();

        } catch (error) {
            console.error('Error initializing booking confirmation:', error);
            this.showError(this.getErrorMessage(error));

            if (error.message.includes('Booking not found')) {
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 3000);
            }
        } finally {
            this.showLoading(false);
        }
    }

    async getBookingDetails() {
        try {
            const response = await fetch(`${this.API_URL}/bookings/reference/${this.bookingRef}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(response.status === 404 ? 'Booking not found' : 'Failed to fetch booking');
            }

            const booking = await response.json();

            const bookingInfo = JSON.parse(localStorage.getItem('bookingInfo'));

            if (!booking.flightId && bookingInfo?.flightId) {
                booking.flightId = bookingInfo.flightId;
            }

            console.log('Loaded booking with flight:', booking);
            this.booking = booking;
            return booking;
        } catch (error) {
            console.error('Error fetching booking:', error);
            throw error;
        }
    }

    getErrorMessage(error) {
        switch (error.message) {
            case 'Booking not found':
                return 'Không tìm thấy thông tin đặt vé. Bạn sẽ được chuyển về trang chủ...';
            case 'Failed to fetch':
                return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet của bạn.';
            default:
                return 'Có lỗi xảy ra. Vui lòng thử lại sau.';
        }
    }

    showError(message) {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    showLoading(show) {
        const loadingElement = document.getElementById('loading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'flex' : 'none';
        }
    }

    setupActionButtons() {
        const downloadBtn = document.querySelector('.btn-download');
        const emailBtn = document.querySelector('.btn-email');

        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadTicket());
        }

        if (emailBtn) {
            emailBtn.addEventListener('click', () => this.sendConfirmationEmail());
        }
    }

    async downloadTicket() {
        if (!this.booking || !this.booking.id) {
            alert('Không thể tải vé. Thông tin đặt vé không hợp lệ!');
            return;
        }

        try {
            const response = await fetch(`${this.API_URL}/bookings/${this.booking.id}/ticket`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to download ticket');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ticket-${this.bookingRef}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading ticket:', error);
            alert('Có lỗi xảy ra khi tải vé. Vui lòng thử lại sau!');
        }
    }

    async sendConfirmationEmail() {
        try {
            const response = await fetch(`${this.API_URL}/bookings/${this.booking.id}/send-confirmation`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) throw new Error('Failed to send confirmation email');

            alert('Email xác nhận đã được gửi thành công!');
        } catch (error) {
            console.error('Error sending confirmation email:', error);
            alert('Có lỗi xảy ra khi gửi email. Vui lòng thử lại sau!');
        }
    }

    displayBookingReference() {
        const element = document.getElementById('bookingReference');
        if (element && this.booking) {
            element.textContent = this.bookingRef;
        }
    }

    async displayFlightDetails() {
        try {
            // Lấy flightId từ booking hoặc localStorage
            const bookingInfo = JSON.parse(localStorage.getItem('bookingInfo'));
            const flightId = this.booking?.flightId || bookingInfo?.flightId;

            if (!flightId) {
                throw new Error('No flight information available');
            }

            const response = await fetch(`${this.API_URL}/flights/${flightId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch flight details');
            }

            const flight = await response.json();
            console.log('Flight data:', flight);

            // Lấy thông tin sân bay
            const [departure, arrival] = await Promise.all([
                fetch(`${this.API_URL}/airports/${flight.departureAirportId}`).then(res => res.json()),
                fetch(`${this.API_URL}/airports/${flight.arrivalAirportId}`).then(res => res.json())
            ]);

            const flightDetails = document.getElementById('flightDetails');
            if (!flightDetails) return;

            flightDetails.innerHTML = `
                <div class="flight-route">
                    <div class="departure">
                        <h3>${departure.city}</h3>
                        <p class="airport-name">${departure.airportName}</p>
                        <p class="datetime">${new Date(flight.departureDateTime).toLocaleString()}</p>
                    </div>
                    <div class="arrow">
                        <i class="fas fa-plane"></i>
                    </div>
                    <div class="arrival">
                        <h3>${arrival.city}</h3>
                        <p class="airport-name">${arrival.airportName}</p>
                        <p class="datetime">${new Date(flight.arrivalDateTime).toLocaleString()}</p>
                    </div>
                </div>
                <div class="flight-info">
                    <p><i class="fas fa-plane-departure"></i> Chuyến bay: ${flight.flightCode}</p>
                </div>
            `;
        } catch (error) {
            console.error('Error displaying flight details:', error);
            throw error;
        }
    }

    async displayTicketDetails() {
        try {
            // Lấy thông tin vé từ API
            const response = await fetch(`${this.API_URL}/tickets/booking/${this.booking.bookingId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch ticket details');
            }

            const tickets = await response.json();

            // Hiển thị thông tin vé
            const ticketDetails = document.getElementById('ticketDetails');
            if (!ticketDetails) return;

            ticketDetails.innerHTML = `
                <div class="ticket-info">
                    <h3>Thông tin vé</h3>
                    <div class="ticket-details">
                        <p><strong>Mã đặt chỗ:</strong> ${this.booking.bookingReference}</p>
                        <p><strong>Ngày đặt:</strong> ${new Date(this.booking.bookingDate).toLocaleString()}</p>
                        <p><strong>Trạng thái:</strong> 
                            <span class="status ${this.booking.status.toLowerCase()}">
                                ${this.getBookingStatusText(this.booking.status)}
                            </span>
                        </p>
                        <p><strong>Trạng thái thanh toán:</strong> 
                            <span class="payment-status ${this.booking.paymentStatus.toLowerCase()}">
                                ${this.getPaymentStatusText(this.booking.paymentStatus)}
                            </span>
                        </p>
                    </div>

                    <div class="price-details">
                        <h4>Chi tiết giá</h4>
                        <div class="price-row">
                            <span>Tổng tiền:</span>
                            <span class="total-amount">${this.formatCurrency(this.booking.totalAmount)}</span>
                        </div>
                    </div>

                    <div class="payment-deadline">
                        <p><strong>Thời hạn thanh toán:</strong></p>
                        <div id="countdown" class="countdown"></div>
                    </div>

                    <div class="ticket-actions">
                        <button class="btn-download">
                            <i class="fas fa-download"></i> Tải vé điện tử
                        </button>
                        <button class="btn-email">
                            <i class="fas fa-envelope"></i> Gửi email xác nhận
                        </button>
                    </div>
                </div>
            `;

            // Setup các nút hành động
            this.setupActionButtons();

        } catch (error) {
            console.error('Error displaying ticket details:', error);
            throw error;
        }
    }

    getPaymentStatusText(status) {
        const statusMap = {
            'PENDING': 'Chờ thanh toán',
            'PAID': 'Đã thanh toán',
            'FAILED': 'Thanh toán thất bại',
            'CANCELLED': 'Đã hủy'
        };
        return statusMap[status] || status;
    }

    getBookingStatusText(status) {
        const statusMap = {
            'PENDING': 'Chờ xác nhận',
            'CONFIRMED': 'Đã xác nhận',
            'CANCELLED': 'Đã hủy',
            'COMPLETED': 'Hoàn thành'
        };
        return statusMap[status] || status;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    startPaymentCountdown() {
        if (!this.booking.bookingDate) return;

        const deadline = new Date(this.booking.bookingDate);
        deadline.setHours(deadline.getHours() + 24); // 24 giờ để thanh toán

        this.countdown = setInterval(() => {
            const now = new Date().getTime();
            const distance = deadline - now;

            if (distance < 0) {
                clearInterval(this.countdown);
                document.getElementById('countdown').innerHTML = 'Đã hết hạn thanh toán';
                return;
            }

            const hours = Math.floor(distance / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const countdownElement = document.getElementById('countdown');
            if (countdownElement) {
                countdownElement.innerHTML = `${hours}h ${minutes}m ${seconds}s`;
            }
        }, 1000);
    }

    startStatusRefresh() {
        this.refreshInterval = setInterval(async () => {
            if (this.payment.paymentStatus === 'PENDING') {
                const updatedPayment = await this.getPaymentDetails(this.payment.paymentId);
                if (updatedPayment.paymentStatus !== this.payment.paymentStatus) {
                    this.payment = updatedPayment;
                    this.displayPaymentDetails();
                }
            }
        }, 30000); // Kiểm tra mỗi 30 giây
    }

    cleanup() {
        if (this.countdown) clearInterval(this.countdown);
        if (this.refreshInterval) clearInterval(this.refreshInterval);
    }

    async createTickets(booking) {
        try {
            const ticketPromises = booking.passengerIds.map(async (passengerId) => {
                const ticketData = {
                    bookingId: booking.bookingId,
                    passengerId: passengerId,
                    seatId: this.getPassengerSeat(passengerId),
                    price: this.calculateTicketPrice(passengerId),
                    status: 'PENDING'
                };

                const response = await fetch(`${this.API_URL}/tickets`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(ticketData)
                });

                if (!response.ok) {
                    throw new Error('Failed to create ticket');
                }

                return response.json();
            });

            const tickets = await Promise.all(ticketPromises);
            console.log('Created tickets:', tickets);
            return tickets;
        } catch (error) {
            console.error('Error creating tickets:', error);
            throw error;
        }
    }

    getPassengerSeat(passengerId) {
        // Lấy thông tin ghế đã chọn cho hành khách từ booking
        const seatAssignment = this.booking.seatAssignments.find(
            assignment => assignment.passengerId === passengerId
        );
        return seatAssignment ? seatAssignment.seatId : null;
    }

    calculateTicketPrice(passengerId) {
        // Tính giá vé dựa trên loại hành khách và ghế đã chọn
        const passenger = this.booking.passengers.find(p => p.passengerId === passengerId);
        const seatAssignment = this.booking.seatAssignments.find(
            a => a.passengerId === passengerId
        );

        let basePrice = this.booking.baseFare;
        if (seatAssignment) {
            basePrice += seatAssignment.seatPrice;
        }

        // Áp dụng giảm giá cho trẻ em nếu có
        if (passenger.passengerType === 'CHILD') {
            basePrice *= 0.75; // Giảm 25% cho trẻ em
        } else if (passenger.passengerType === 'INFANT') {
            basePrice *= 0.1; // Giảm 90% cho em bé
        }

        return basePrice;
    }

    async updateBookingStatus(status) {
        try {
            const response = await fetch(`${this.API_URL}/bookings/${this.booking.id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ status })
            });

            if (!response.ok) {
                throw new Error('Failed to update booking status');
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating booking status:', error);
            throw error;
        }
    }

    async displayPassengerList() {
        try {
            console.log('Starting displayPassengerList');
            const passengerList = document.getElementById('passengerList');
            if (!passengerList) return;

            // Lấy thông tin chuyến bay
            const flightResponse = await fetch(`${this.API_URL}/flights/${this.booking.flightId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const flight = await flightResponse.json();
            console.log('Flight data:', flight);

            // Lấy thông tin vé
            const ticketsResponse = await fetch(`${this.API_URL}/tickets/booking/${this.booking.bookingId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            const tickets = await ticketsResponse.json();
            console.log('Tickets data:', tickets);

            // Tạo HTML cho danh sách vé
            const html = tickets.map(ticket => `
                <div class="passenger-item">
                    <div class="passenger-info">
                        <div class="info-row">
                            <span class="label">Họ tên:</span>
                            <span class="value">${ticket.passenger?.fullName || 'N/A'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Số ghế:</span>
                            <span class="value seat-number">${ticket.seatId || 'Chưa chọn ghế'}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Giá vé:</span>
                            <span class="value">${this.formatCurrency(ticket.price || 0)}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Trạng thái:</span>
                            <span class="value">${this.getTicketStatusText(ticket.status)}</span>
                        </div>
                    </div>
                </div>
            `).join('');

            console.log('Generated HTML:', html);
            passengerList.innerHTML = html;

        } catch (error) {
            console.error('Error in displayPassengerList:', error);
            throw error;
        }
    }

    getTicketStatusText(status) {
        const statusMap = {
            'ACTIVE': 'Đã kích hoạt',
            'PENDING': 'Chờ x lý',
            'CANCELLED': 'Đã hủy'
        };
        return statusMap[status] || status;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BookingConfirmation();
}); 