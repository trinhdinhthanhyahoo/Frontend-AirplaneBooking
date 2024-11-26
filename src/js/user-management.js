// Cấu hình API base URL
const API_BASE_URL = 'http://localhost:8080/api';

// Biến toàn cục để lưu user ID đang được xử lý
let currentUserId = null;

// Biến lưu trữ tất cả users
let allUsers = [];

// Biến lưu trữ bộ lọc hiện tại
let currentFilters = {
    role: '',
    status: ''
};

// Hàm để lấy danh sách người dùng từ API
async function fetchUsers() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'GET',
            headers: {
                'Accept': '*/*',
                'Authorization': `Bearer ${getToken()}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }

        allUsers = await response.json(); // Lưu vào biến allUsers
        filterAndDisplayUsers(); // Hiển thị users đã lọc
    } catch (error) {
        console.error('Error fetching users:', error);
        showErrorMessage('Không thể tải danh sách người dùng');
    } finally {
        hideLoading();
    }
}

// Hàm để hiển thị users lên bảng
function displayUsers(users) {
    const tbody = document.querySelector('.users-table tbody');
    tbody.innerHTML = '';

    users.forEach((user, index) => {
        const row = `
            <tr>
                <td class="text-center">${index + 1}</td>
                <td>
                    <div class="user-info">
                        <img src="${user.avatar || getAvatarByRole(user.role)}" 
                             alt="${user.username}"
                             onerror="this.src='images/default-avatar.png'">
                        <span>${user.username}</span>
                    </div>
                </td>
                <td>${user.email}</td>
                <td>${user.phone}</td>
                <td><span class="badge-role ${user.role}">${getRoleDisplay(user.role)}</span></td>
                <td><span class="status-badge ${user.status}">${getStatusDisplay(user.status)}</span></td>
                <td>${formatDate(user.createdAt)}</td>
                <td>
                    <button class="btn-action view" onclick="viewUser('${user.userId}')" title="Xem chi tiết">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-action edit" onclick="editUser('${user.userId}')" title="Chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="deleteUser('${user.userId}')" title="Xóa">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
        tbody.insertAdjacentHTML('beforeend', row);
    });
}

// Hàm chuyển đổi role sang tiếng Việt
function getRoleDisplay(role) {
    const roleMap = {
        'ADMIN': 'Quản trị viên',
        'USER': 'Người dùng',
        'STAFF': 'Nhân viên'
    };
    return roleMap[role] || role;
}

// Hàm chuyển đổi status sang tiếng Việt
function getStatusDisplay(status) {
    const statusMap = {
        'ACTIVE': 'Đang hoạt động',
        'INACTIVE': 'Không hoạt động',
        'BLOCKED': 'Đã khóa'
    };
    return statusMap[status] || status;
}

// Hàm format ngày tháng
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Hàm hiển thị thông báo lỗi
function showErrorMessage(message) {
    // Tạo element thông báo
    const alert = document.createElement('div');
    alert.className = 'alert alert-error';
    alert.innerHTML = `
        <i class="fas fa-exclamation-circle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Thêm vào DOM
    document.querySelector('.dashboard-content').prepend(alert);

    // Tự động ẩn sau 5 giây
    setTimeout(() => alert.remove(), 5000);
}

// Hàm mở modal thêm user mới
function openAddUserModal() {
    currentUserId = null;
    document.getElementById('modalTitle').textContent = 'Thêm người dùng mới';
    document.getElementById('userForm').reset();

    // Khi thêm mới: password bắt buộc
    const passwordInput = document.getElementById('password');
    const passwordRequired = document.getElementById('passwordRequired');
    const passwordHelpText = document.getElementById('passwordHelpText');
    const passwordLabel = document.getElementById('passwordLabel');

    passwordInput.required = true;
    passwordInput.value = '';
    passwordRequired.style.display = 'inline';
    passwordHelpText.style.display = 'none';
    passwordLabel.textContent = 'Mật khẩu';

    document.getElementById('userModal').style.display = 'block';
}

// Hàm chỉnh sửa user
async function editUser(userId) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/users/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch user details');
        const user = await response.json();

        currentUserId = userId;
        document.getElementById('modalTitle').textContent = 'Chỉnh sửa người dùng';

        // Điền thông tin vào form
        fillFormData(user);

        // Cập nhật trạng thái password field
        const passwordInput = document.getElementById('password');
        const passwordRequired = document.getElementById('passwordRequired');
        const passwordHelpText = document.getElementById('passwordHelpText');
        const passwordLabel = document.getElementById('passwordLabel');

        // Khi sửa: password không bắt buộc
        passwordInput.required = false;
        passwordInput.value = ''; // Không hiển thị mật khẩu cũ
        passwordRequired.style.display = 'none';
        passwordHelpText.style.display = 'block';
        passwordLabel.textContent = 'Mật khẩu (tùy chọn)';

        document.getElementById('userModal').style.display = 'block';
    } catch (error) {
        showErrorMessage('Không thể tải thông tin người dùng');
    } finally {
        hideLoading();
    }
}

// Hàm xem chi tiết user
async function viewUser(userId) {
    try {
        showLoading();
        const response = await fetch(`${API_BASE_URL}/users/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch user details');
        const user = await response.json();

        document.getElementById('modalTitle').textContent = 'Chi tiết người dùng';

        // Điền thông tin vào form
        fillFormData(user);

        // Disable tất cả các trường
        enableFormFields(false);

        // Ẩn nút Lưu, chỉ hiện nút Đóng
        document.querySelector('#userForm .btn-primary').style.display = 'none';
        document.getElementById('userModal').style.display = 'block';
    } catch (error) {
        showErrorMessage('Không thể tải thông tin người dùng');
    } finally {
        hideLoading();
    }
}

// Hàm điền dữ liệu vào form
function fillFormData(user) {
    document.getElementById('username').value = user.username || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('role').value = user.role || 'USER';
    document.getElementById('status').value = user.status || 'ACTIVE';
    document.getElementById('password').value = user.password || ''; // Luôn để trống password
}

// Hàm enable/disable các trường form
function enableFormFields(enabled) {
    const inputs = document.querySelectorAll('#userForm input, #userForm select');
    inputs.forEach(input => {
        input.disabled = !enabled;
    });

    // Hiện/ẩn nút Lưu
    document.querySelector('#userForm .btn-primary').style.display = enabled ? 'block' : 'none';
}

// Hàm xử lý submit form
async function handleUserSubmit(event) {
    event.preventDefault();

    // Lấy dữ liệu từ form
    const userData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        role: document.getElementById('role').value,
        status: document.getElementById('status').value,
        password: document.getElementById('password').value // Luôn gửi password vì đã được hash
    };

    try {
        showLoading();
        const url = currentUserId
            ? `${API_BASE_URL}/users/${currentUserId}`
            : `${API_BASE_URL}/users`;

        const method = currentUserId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        if (!response.ok) throw new Error('Failed to save user');

        showSuccessMessage(
            currentUserId
                ? 'Cập nhật người dùng thành công'
                : 'Thêm người dùng mới thành công'
        );
        closeUserModal();
        fetchUsers();
    } catch (error) {
        showErrorMessage('Không thể lưu thông tin người dùng');
    } finally {
        hideLoading();
    }
}
// Hàm lấy token từ localStorage hoặc nơi lưu trữ khác
function getToken() {
    return localStorage.getItem('token');
}

// Hàm đóng modal và reset form
function closeUserModal() {
    document.getElementById('userModal').style.display = 'none';
    document.getElementById('userForm').reset();
    currentUserId = null;
    // Hiện lại nút Lưu khi đóng modal
    document.querySelector('#userForm .btn-primary').style.display = 'block';
}

// Các hàm utility
function closeDeleteModal() {
    document.getElementById('deleteModal').style.display = 'none';
    currentUserId = null;
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function showSuccessMessage(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.innerHTML = `
        <i class="fas fa-check-circle"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    document.querySelector('.dashboard-content').prepend(alert);
    setTimeout(() => alert.remove(), 3000);
}

// Thêm style cho alert success
const style = document.createElement('style');
style.textContent = `
    .alert-success {
        background-color: #dcfce7;
        border: 1px solid #bbf7d0;
        color: #15803d;
    }
`;
document.head.appendChild(style);

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', () => {
    const user = localStorage.getItem('user');
    if (!user || !localStorage.getItem('token')) {
        window.location.href = 'admin-login.html';
        return;
    }

    const userData = JSON.parse(user);
    if (userData.role !== 'ADMIN') {
        window.location.href = '/';
        return;
    }

    initializeFilters();
    fetchUsers();
});

// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleButton = document.querySelector('.toggle-password i');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleButton.classList.remove('fa-eye');
        toggleButton.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleButton.classList.remove('fa-eye-slash');
        toggleButton.classList.add('fa-eye');
    }
}

// Hàm lấy avatar dựa trên role
function getAvatarByRole(role) {
    switch (role) {
        case 'ADMIN':
            return 'images/admin.png';
        case 'STAFF':
            return 'images/staff.png';
        default:
            return 'images/user.png';
    }
}

// Khởi tạo bộ lọc và sự kiện
function initializeFilters() {
    const roleFilter = document.querySelector('select[name="roleFilter"]');
    const statusFilter = document.querySelector('select[name="statusFilter"]');

    // Thêm event listeners cho bộ lọc
    if (roleFilter) {
        roleFilter.addEventListener('change', (event) => {
            currentFilters.role = event.target.value;
            filterAndDisplayUsers();
        });
    }

    if (statusFilter) {
        statusFilter.addEventListener('change', (event) => {
            currentFilters.status = event.target.value;
            filterAndDisplayUsers();
        });
    }
}

// Reset bộ lọc
function resetFilters() {
    currentFilters = {
        role: '',
        status: ''
    };

    // Reset UI
    const filters = document.querySelectorAll('.filter-dropdown');
    filters.forEach(filter => {
        filter.value = '';
    });

    // Hiển thị lại tất cả users
    filterAndDisplayUsers();
}

// Hàm lọc và hiển thị users
function filterAndDisplayUsers() {
    let filteredUsers = allUsers;

    // Áp dụng bộ lọc
    if (currentFilters.role) {
        filteredUsers = filteredUsers.filter(user => user.role === currentFilters.role);
    }
    if (currentFilters.status) {
        filteredUsers = filteredUsers.filter(user => user.status === currentFilters.status);
    }

    // Hiển thị kết quả
    displayUsers(filteredUsers);
}

