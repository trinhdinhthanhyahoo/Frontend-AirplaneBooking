// Constants
const API_BASE_URL = 'http://localhost:8080/api';
let currentFlightId = null;
let allFlights = [];
let aircrafts = [];
let airports = [];

// Utility Functions
function getToken() {
    return localStorage.getItem('token');
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showSuccessMessage(message) {
    alert(message); // Tạm thời dùng alert
}

function showErrorMessage(message) {
    alert(message); // Tạm thời dùng alert
}

// Fetch Flights
async function fetchFlights() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/flights`, {
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch flights');
        }

        const data = await response.json();
        allFlights = data;
        filterAndDisplayFlights();
    } catch (error) {
        console.error('Error fetching flights:', error);
        showErrorMessage('Không thể tải danh sách chuyến bay');
    } finally {
        hideLoading();
    }
}

// Display Flights
function displayFlights(flights) {
    const tbody = document.querySelector('.flights-table tbody');
    tbody.innerHTML = '';


    flights.forEach(flight => {
        const row = `
            <tr>
                <td>${flight.flightCode}</td>
                <td>${aircrafts.find(a => a.aircraftId === flight.aircraftId).aircraftCode}</td>
                <td>${getAirportInfo(flight.departureAirportId)}</td>
                <td>${getAirportInfo(flight.arrivalAirportId)}</td>
                <td>${flight.departureDateTime}</td>
                <td>${flight.arrivalDateTime}</td>
                <td>${formatCurrency(flight.baseFare)}</td>
                <td>${flight.availableSeats}</td>
                <td><span class="status-badge ${flight.status}">${getStatusDisplay(flight.status)}</span></td>
                <td>
                    <button class="btn-action edit" onclick="editFlight('${flight.flightId}')" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="deleteFlight('${flight.flightId}')" title="Xóa">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// Filter Functions
function filterAndDisplayFlights() {
    const statusFilter = document.querySelector('select[name="statusFilter"]').value;
    let filteredFlights = allFlights;

    if (statusFilter) {
        filteredFlights = filteredFlights.filter(flight => flight.status === statusFilter);
    }

    displayFlights(filteredFlights);
}

// Modal Functions
function openAddFlightModal() {
    currentFlightId = null;
    document.getElementById('modalTitle').textContent = 'Thêm chuyến bay mới';
    document.getElementById('flightForm').reset();
    document.getElementById('flightModal').style.display = 'block';
}

function closeFlightModal() {
    document.getElementById('flightModal').style.display = 'none';
    document.getElementById('flightForm').reset();
}

// CRUD Operations
async function handleFlightSubmit(event) {
    event.preventDefault();

    const formData = {
        flightCode: document.getElementById('flight_code').value,
        aircraftId: document.getElementById('aircraft_id').value,
        departureAirportId: document.getElementById('departure_airport_id').value,
        arrivalAirportId: document.getElementById('arrival_airport_id').value,
        departureDateTime: document.getElementById('departure_datetime').value,
        arrivalDateTime: document.getElementById('arrival_datetime').value,
        baseFare: parseFloat(document.getElementById('base_fare').value),
        availableSeats: parseInt(document.getElementById('available_seats').value),
        status: document.getElementById('status').value
    };

    try {
        showLoading();
        const url = currentFlightId
            ? `${API_BASE_URL}/flights/${currentFlightId}`
            : `${API_BASE_URL}/flights`;

        const method = currentFlightId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error('Failed to save flight');
        }

        showSuccessMessage(
            currentFlightId
                ? 'Cập nhật chuyến bay thành công'
                : 'Thêm chuyến bay mới thành công'
        );
        closeFlightModal();
        fetchFlights();
    } catch (error) {
        console.error('Error saving flight:', error);
        showErrorMessage('Không thể lưu thông tin chuyến bay');
    } finally {
        hideLoading();
    }
}

// Utility Functions
function formatDateTime(dateString) {
    return new Date(dateString).toLocaleString('vi-VN');
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

function getStatusDisplay(status) {
    const statusMap = {
        'SCHEDULED': 'Đã lên lịch',
        'DELAYED': 'Bị hoãn',
        'CANCELLED': 'Đã hủy',
        'COMPLETED': 'Đã hoàn thành'
    };
    return statusMap[status] || status;
}

// Thêm các hàm xử lý xóa
function deleteFlight(flightId) {
    currentFlightId = flightId;
    document.getElementById('deleteModal').style.display = 'block';
}

function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
}

async function confirmDelete() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/flights/${currentFlightId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to delete flight');
        }

        showSuccessMessage('Xóa chuyến bay thành công');
        closeDeleteModal();
        fetchFlights();
    } catch (error) {
        console.error('Error deleting flight:', error);
        showErrorMessage('Không thể xóa chuyến bay');
    } finally {
        hideLoading();
    }
}

// Thêm hàm edit
async function editFlight(flightId) {
    try {
        showLoading();
        currentFlightId = flightId;

        const response = await fetch(`${API_BASE_URL}/flights/${flightId}`, {
            headers: {
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch flight details');
        }

        const flight = await response.json();

        // Cập nhật form với dữ liệu mới
        document.getElementById('modalTitle').textContent = 'Chỉnh sửa chuyến bay';
        document.getElementById('flight_code').value = flight.flightCode;
        document.getElementById('aircraft_id').value = flight.aircraft_id;
        document.getElementById('departure_airport_id').value = flight.departureAirportId;
        document.getElementById('arrival_airport_id').value = flight.arrivalAirportId;
        document.getElementById('departure_datetime').value = formatDateTimeForInput(flight.departureDateTime);
        document.getElementById('arrival_datetime').value = formatDateTimeForInput(flight.arrivalDateTime);
        document.getElementById('base_fare').value = flight.baseFare;
        document.getElementById('available_seats').value = flight.availableSeats;
        document.getElementById('status').value = flight.status;

        document.getElementById('flightModal').style.display = 'block';
    } catch (error) {
        console.error('Error fetching flight details:', error);
        showErrorMessage('Không thể tải thông tin chuyến bay');
    } finally {
        hideLoading();
    }
}

// Thêm hàm format datetime cho input
function formatDateTimeForInput(dateString) {
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
}

// Thêm hàm load data cho select boxes
async function loadSelectData() {
    try {
        const [aircraftResponse, airportResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/airplanes`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            }),
            fetch(`${API_BASE_URL}/airports`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            })
        ]);

        if (!aircraftResponse.ok || !airportResponse.ok) {
            throw new Error('Failed to fetch select data');
        }

        aircrafts = await aircraftResponse.json();
        airports = await airportResponse.json();

        updateSelectOptions();
    } catch (error) {
        console.error('Error loading select data:', error);
        showErrorMessage('Không thể tải dữ liệu máy bay và sân bay');
    }
}

function updateSelectOptions() {
    // Update aircraft select
    const aircraftSelect = document.getElementById('aircraft_id');
    aircraftSelect.innerHTML = '<option value="">Chọn máy bay</option>' +
        aircrafts.map(aircraft =>
            `<option value="${aircraft.aircraftId}">${aircraft.aircraftCode} - ${aircraft.aircraftName}</option>`
        ).join('');

    // Update airport selects (giữ nguyên phần này)
    const departureSelect = document.getElementById('departure_airport_id');
    const arrivalSelect = document.getElementById('arrival_airport_id');
    const airportOptions = '<option value="">Chọn sân bay</option>' +
        airports.map(airport =>
            `<option value="${airport.airportId}">${airport.airportCode} - ${airport.airportName}</option>`
        ).join('');

    departureSelect.innerHTML = airportOptions;
    arrivalSelect.innerHTML = airportOptions;
}

// Thêm hàm helper để lấy thông tin sân bay
function getAirportInfo(airportId) {
    const airport = airports.find(a => a.airportId === airportId);
    return airport ? `${airport.airportCode} - ${airport.airportName}` : airportId;
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const token = getToken();
    if (!token) {
        showErrorMessage('Vui lòng đăng nhập lại');
        window.location.href = 'login.html';
        return;
    }

    loadSelectData();
    fetchFlights();

    const statusFilter = document.querySelector('select[name="statusFilter"]');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterAndDisplayFlights);
    }
}); 