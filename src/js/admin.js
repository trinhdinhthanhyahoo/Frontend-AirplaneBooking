// Hàm kiểm tra đăng nhập và role
const checkAdminAuth = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        window.location.href = 'admin-login.html';
        return false;
    }

    const userData = JSON.parse(user);
    if (userData.role !== "ADMIN") {
        window.location.href = '/';
        return false;
    }
    return true;
};

// Hàm load thông tin admin và cập nhật UI
const loadAdminInfo = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
        const userData = JSON.parse(user);

        // Cập nhật avatar và tên admin
        const adminAvatar = document.querySelector('.admin-info img');
        const adminName = document.querySelector('.admin-name');
        const adminRole = document.querySelector('.admin-role');

        if (adminAvatar) {
            adminAvatar.src = 'images/admin.png'; // Luôn dùng ảnh admin.png
            adminAvatar.alt = `${userData.username}'s Avatar`;
            adminAvatar.style.width = '40px';
            adminAvatar.style.height = '40px';
            adminAvatar.style.borderRadius = '50%';
            adminAvatar.style.objectFit = 'cover';
        }

        // Cập nhật tên và role
        if (adminName) {
            adminName.textContent = userData.email || 'Admin'; // Hiển thị email thay vì username
        }
        if (adminRole) {
            adminRole.textContent = 'Administrator'; // Vì đã check role ADMIN ở trên
        }
    }
};

// Xử lý đăng xuất
const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'admin-login.html';
};

// Xử lý dropdown menu
const initializeDropdown = () => {
    const adminInfo = document.querySelector('.admin-info');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (adminInfo && dropdownMenu) {
        adminInfo.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        // Đóng dropdown khi click ra ngoài
        document.addEventListener('click', () => {
            dropdownMenu.classList.remove('show');
        });
    }
};

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', () => {
    if (checkAdminAuth()) {
        loadAdminInfo();
        initializeDropdown();
        updateNotificationBadge();
    }
});

// Hàm cập nhật số thông báo
const updateNotificationBadge = () => {
    const badge = document.querySelector('.badge');
    if (badge) {
        const unreadCount = 3; // Giả lập số thông báo
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
};

// Xử lý click vào notification
const handleNotificationClick = () => {
    const notifications = document.querySelector('.notifications');
    if (notifications) {
        notifications.addEventListener('click', async () => {
            try {
                // TODO: Hiển thị danh sách thông báo trong dropdown
                console.log('Showing notifications...');
            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        });
    }
};

// Profile Dropdown
const profileTrigger = document.getElementById('profileTrigger');
const profileDropdown = document.getElementById('profileDropdown');

profileTrigger.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('show');
});

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    if (!profileDropdown.contains(e.target) && !profileTrigger.contains(e.target)) {
        profileDropdown.classList.remove('show');
    }
});

// Handle logout
