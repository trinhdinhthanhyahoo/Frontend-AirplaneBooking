export const STATUS = {
    BOOKING: {
        PENDING: 'PENDING',
        CONFIRMED: 'CONFIRMED',
        CANCELLED: 'CANCELLED',
        COMPLETED: 'COMPLETED'
    },
    PAYMENT: {
        PENDING: 'PENDING',
        PAID: 'PAID',
        FAILED: 'FAILED',
        CANCELLED: 'CANCELLED'
    },
    TICKET: {
        ACTIVE: 'ACTIVE',
        PENDING: 'PENDING',
        CANCELLED: 'CANCELLED'
    }
};

export const STATUS_TEXT = {
    BOOKING: {
        PENDING: 'Chờ xác nhận',
        CONFIRMED: 'Đã xác nhận',
        CANCELLED: 'Đã hủy',
        COMPLETED: 'Hoàn thành'
    },
    PAYMENT: {
        PENDING: 'Chờ thanh toán',
        PAID: 'Đã thanh toán',
        FAILED: 'Thanh toán thất bại',
        CANCELLED: 'Đã hủy'
    },
    TICKET: {
        ACTIVE: 'Đã kích hoạt',
        PENDING: 'Chờ xử lý',
        CANCELLED: 'Đã hủy'
    }
}; 