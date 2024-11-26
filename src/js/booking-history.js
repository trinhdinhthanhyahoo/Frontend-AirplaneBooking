class BookingHistory {
    constructor() {
        this.API_URL = 'http://localhost:8080/api';
        this.bookings = [];
        this.currentPage = 1;
        this.itemsPerPage = 5;
        this.totalPages = 0;
        this.originalBookings = [];
        this.searchTimeout = null;
        this.filters = {
            search: '',
            status: '',
            date: '',
            currentPage: 1
        };
        this.initialize();
    }

    async initialize() {
        this.showLoadingState();
        try {
            await this.checkAuth();
            await this.loadBookingHistory();
            this.setupEventListeners();
            this.hideLoadingState();
        } catch (error) {
            console.error('Error initializing booking history:', error);
            this.showErrorState(error.message);
        }
    }

    async checkAuth() {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');

        if (!user || !token) {
            window.location.href = 'login.html';
            throw new Error('Unauthorized');
        }
    }

    showLoadingState() {
        document.getElementById('loadingState').style.display = 'block';
        document.getElementById('bookingsList').style.display = 'none';
        document.getElementById('errorState').style.display = 'none';
        document.getElementById('emptyState').style.display = 'none';
    }

    hideLoadingState() {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('bookingsList').style.display = 'block';
    }

    showErrorState(message) {
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('errorState').style.display = 'block';
        document.getElementById('errorMessage').textContent = message;
    }

    showEmptyState() {
        document.getElementById('bookingsList').style.display = 'none';
        document.getElementById('emptyState').style.display = 'block';
    }

    async loadBookingHistory() {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.userId) {
                throw new Error('User information not found');
            }

            const response = await fetch(`${this.API_URL}/bookings/user/${user.userId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Accept': '*/*',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Origin, Content-Type, Accept, Authorization'
                },
                mode: 'cors',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to fetch booking history');
            }

            const bookings = await response.json();

            if (bookings.length === 0) {
                this.showEmptyState();
                return;
            }

            this.originalBookings = bookings;
            this.bookings = bookings;
            this.displayBookings(this.bookings);
        } catch (error) {
            console.error('Error loading booking history:', error);
            this.showErrorState('Không thể tải lịch sử đặt vé');
        }
    }

    calculatePagination(totalItems) {
        this.totalPages = Math.ceil(totalItems / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return {
            startIndex,
            endIndex,
            totalPages: this.totalPages
        };
    }

    displayBookings(bookings) {
        const container = document.getElementById('bookingsList');
        const paginationContainer = document.getElementById('pagination');
        if (!container || !paginationContainer) return;

        if (bookings.length === 0) {
            this.showEmptyState();
            paginationContainer.style.display = 'none';
            return;
        }

        const { startIndex, endIndex, totalPages } = this.calculatePagination(bookings.length);
        const paginatedBookings = bookings.slice(startIndex, endIndex);

        container.innerHTML = paginatedBookings.map(booking => this.createBookingCard(booking)).join('');

        this.renderPagination(totalPages);
    }

    renderPagination(totalPages) {
        const paginationContainer = document.getElementById('pagination');
        if (!paginationContainer) return;

        let paginationHTML = '';

        paginationHTML += `
            <button class="page-nav prev ${this.currentPage === 1 ? 'disabled' : ''}" 
                    onclick="bookingHistory.changePage(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        paginationHTML += '<div class="page-numbers">';

        let startPage = Math.max(1, this.currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);

        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        if (startPage > 1) {
            paginationHTML += `
                <button onclick="bookingHistory.changePage(1)">1</button>
                ${startPage > 2 ? '<span class="page-dots">...</span>' : ''}
            `;
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="${i === this.currentPage ? 'active' : ''}" 
                        onclick="bookingHistory.changePage(${i})">
                    ${i}
                </button>
            `;
        }

        if (endPage < totalPages) {
            paginationHTML += `
                ${endPage < totalPages - 1 ? '<span class="page-dots">...</span>' : ''}
                <button onclick="bookingHistory.changePage(${totalPages})">${totalPages}</button>
            `;
        }

        paginationHTML += '</div>';

        paginationHTML += `
            <button class="page-nav next ${this.currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="bookingHistory.changePage(${this.currentPage + 1})"
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        paginationContainer.innerHTML = paginationHTML;
    }

    changePage(pageNumber) {
        if (pageNumber < 1 || pageNumber > this.totalPages) return;

        this.currentPage = pageNumber;
        this.displayBookings(this.bookings);

        document.getElementById('bookingsList').scrollIntoView({ behavior: 'smooth' });
    }

    createBookingCard(booking) {
        const statusClass = this.getStatusClass(booking.status);
        const statusText = this.getStatusText(booking.status);
        const paymentStatusText = this.getPaymentStatusText(booking.paymentStatus);
        const bookingDate = new Date(booking.bookingDate).toLocaleDateString('vi-VN');

        return `
            <div class="booking-card">
                <div class="booking-header">
                    <div class="booking-info">
                        <span class="booking-date">${bookingDate}</span>
                        <span class="booking-id">Mã đặt vé: ${booking.bookingReference}</span>
                    </div>
                    <div class="booking-status ${statusClass}">
                        <i class="fas ${this.getStatusIcon(booking.status)}"></i>
                        ${statusText}
                    </div>
                </div>
                
                <div class="booking-details">
                    <div class="detail-row">
                        <span class="label">Số hành khách:</span>
                        <span class="value">${booking.passengerCount}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Số ghế:</span>
                        <span class="value">${booking.seatCodes.join(', ')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Trạng thái thanh toán:</span>
                        <span class="value ${this.getPaymentStatusClass(booking.paymentStatus)}">
                            <i class="fas ${this.getPaymentStatusIcon(booking.paymentStatus)}"></i>
                            ${paymentStatusText}
                        </span>
                    </div>
                </div>

                <div class="booking-footer">
                    <div class="price">
                        <span class="label">Tổng tiền:</span>
                        <span class="value">${this.formatCurrency(booking.totalAmount)}</span>
                    </div>
                    <div class="actions">
                        <button class="btn-detail" onclick="bookingHistory.viewBookingDetail('${booking.bookingId}')">
                            <i class="fas fa-eye"></i> Chi tiết
                        </button>
                        ${this.getActionButtons(booking)}
                    </div>
                </div>
            </div>
        `;
    }

    getActionButtons(booking) {
        let buttons = '';

        if (booking.paymentStatus === 'PAID') {
            buttons += `
                <button class="btn-download" onclick="bookingHistory.downloadTicket('${booking.bookingId}')">
                    <i class="fas fa-download"></i> Vé điện tử
                </button>
            `;
        }

        if (booking.status !== 'CANCELLED' && booking.paymentStatus === 'UNPAID') {
            buttons += `
                <button class="btn-cancel" onclick="bookingHistory.cancelBooking('${booking.bookingId}')">
                    <i class="fas fa-times"></i> Hủy vé
                </button>
            `;
        }

        return buttons;
    }

    getStatusClass(status) {
        const statusClasses = {
            'CONFIRMED': 'confirmed',
            'PENDING': 'pending',
            'CANCELLED': 'cancelled'
        };
        return statusClasses[status] || 'pending';
    }

    getStatusText(status) {
        const statusTexts = {
            'CONFIRMED': 'Đã xác nhận',
            'PENDING': 'Chờ thanh toán',
            'CANCELLED': 'Đã hủy'
        };
        return statusTexts[status] || status;
    }

    getPaymentStatusText(status) {
        const paymentTexts = {
            'PAID': 'Đã thanh toán',
            'UNPAID': 'Chưa thanh toán',
            'REFUNDED': 'Đã hoàn tiền'
        };
        return paymentTexts[status] || status;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    setupEventListeners() {
        const searchInput = document.getElementById('searchBooking');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                if (this.searchTimeout) {
                    clearTimeout(this.searchTimeout);
                }
                this.searchTimeout = setTimeout(() => {
                    this.handleSearch(e.target.value);
                }, 300);
            });
        }

        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.handleStatusFilter(e.target.value);
            });
        }

        const dateFilter = document.getElementById('dateFilter');
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.handleDateFilter(e.target.value);
            });
        }

        const resetButton = document.getElementById('resetFilters');
        if (resetButton) {
            resetButton.addEventListener('click', () => this.resetFilters());
        }
    }

    handleSearch(value) {
        this.filters.search = value.toLowerCase().trim();
        this.applyFilters();
    }

    handleStatusFilter(status) {
        this.filters.status = status;
        this.applyFilters();
    }

    handleDateFilter(date) {
        this.filters.date = date;
        this.applyFilters();
    }

    resetFilters() {
        this.filters = {
            search: '',
            status: '',
            date: '',
            currentPage: 1
        };

        document.getElementById('searchBooking').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('dateFilter').value = '';

        this.bookings = [...this.originalBookings];
        this.currentPage = 1;
        this.displayBookings(this.bookings);
        this.updateFilterResults();
    }

    applyFilters() {
        let filteredBookings = [...this.originalBookings];

        if (this.filters.search) {
            filteredBookings = filteredBookings.filter(booking => {
                const searchTerm = this.filters.search.toLowerCase();
                const searchableFields = [
                    booking.bookingReference.toLowerCase(),
                    booking.status.toLowerCase(),
                    booking.paymentStatus.toLowerCase(),
                    this.formatDate(booking.bookingDate),
                    this.formatCurrency(booking.totalAmount),
                    ...(booking.seatCodes || []).map(seat => seat.toLowerCase())
                ];
                return searchableFields.some(field => field.includes(searchTerm));
            });
        }

        if (this.filters.status) {
            filteredBookings = filteredBookings.filter(booking =>
                booking.status === this.filters.status
            );
        }

        if (this.filters.date) {
            const filterDate = this.formatDate(this.filters.date);
            filteredBookings = filteredBookings.filter(booking =>
                this.formatDate(booking.bookingDate) === filterDate
            );
        }

        this.bookings = filteredBookings;
        this.currentPage = 1;
        this.displayBookings(this.bookings);
        this.updateFilterResults();
    }

    updateFilterResults() {
        const resultCount = document.getElementById('resultCount');
        if (resultCount) {
            if (this.bookings.length === 0) {
                resultCount.textContent = 'Không tìm thấy kết quả';
                this.showEmptyState('Không tìm thấy kết quả phù hợp với bộ lọc');
            } else {
                resultCount.textContent = `Tìm thấy ${this.bookings.length} kết quả`;
            }
        }
    }

    showEmptyState(message = 'Bạn chưa có đặt vé nào') {
        const emptyState = document.getElementById('emptyState');
        const emptyStateMessage = emptyState.querySelector('p');
        if (emptyStateMessage) {
            emptyStateMessage.textContent = message;
        }
        document.getElementById('bookingsList').style.display = 'none';
        emptyState.style.display = 'flex';
        document.getElementById('pagination').style.display = 'none';
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    }

    showError(message) {
        alert(message);
    }

    getStatusIcon(status) {
        const icons = {
            'CONFIRMED': 'fa-check-circle',
            'PENDING': 'fa-clock',
            'CANCELLED': 'fa-times-circle'
        };
        return icons[status] || 'fa-clock';
    }

    getPaymentStatusIcon(status) {
        const icons = {
            'PAID': 'fa-check-circle',
            'UNPAID': 'fa-clock',
            'REFUNDED': 'fa-undo'
        };
        return icons[status] || 'fa-clock';
    }

    getPaymentStatusClass(status) {
        const classes = {
            'PAID': 'status-paid',
            'UNPAID': 'status-unpaid',
            'REFUNDED': 'status-refunded'
        };
        return classes[status] || '';
    }

    async cancelBooking(bookingId) {
        try {
            const confirmed = await this.showConfirmDialog(
                'Bạn có chắc chắn muốn hủy đặt vé này?',
                'Vé đã hủy không thể khôi phục lại.'
            );

            if (!confirmed) return;

            this.showLoadingState();

            const response = await fetch(`${this.API_URL}/bookings/${bookingId}/status`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                    'Accept': '*/*',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Origin, Content-Type, Accept, Authorization'
                },
                mode: 'cors',
                credentials: 'include',
                body: JSON.stringify({
                    status: 'CANCELLED'
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to cancel booking');
            }

            await this.loadBookingHistory();

            this.showSuccessToast('Hủy đặt vé thành công');

        } catch (error) {
            console.error('Error cancelling booking:', error);
            this.showErrorToast('Không thể hủy đặt vé. Vui lòng thử lại sau.');
        } finally {
            this.hideLoadingState();
        }
    }

    showConfirmDialog(title, message) {
        return new Promise((resolve) => {
            const dialog = document.createElement('div');
            dialog.className = 'confirm-dialog';
            dialog.innerHTML = `
                <div class="confirm-dialog-content">
                    <h3>${title}</h3>
                    <p>${message}</p>
                    <div class="confirm-dialog-actions">
                        <button class="btn-secondary" onclick="this.closest('.confirm-dialog').remove(); return false;">
                            Hủy bỏ
                        </button>
                        <button class="btn-primary" onclick="this.closest('.confirm-dialog').remove(); return true;">
                            Xác nhận
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(dialog);

            const buttons = dialog.querySelectorAll('button');
            buttons[0].onclick = () => {
                dialog.remove();
                resolve(false);
            };
            buttons[1].onclick = () => {
                dialog.remove();
                resolve(true);
            };
        });
    }

    showSuccessToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-success';
        toast.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    showErrorToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-error';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.bookingHistory = new BookingHistory();
}); 