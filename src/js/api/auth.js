
async function checkLoginStatus() {
    const user = JSON.parse(localStorage.getItem('user'));
    const authButtons = document.getElementById('authButtons');
    const userProfile = document.getElementById('userProfile');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');

    if (user) {
        try {
            // Lấy thông tin user mới nhất từ server
            const response = await fetch(`http://localhost:8080/api/users/${user.userId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const userData = await response.json();

            // Cập nhật localStorage với dữ liệu mới
            localStorage.setItem('user', JSON.stringify({
                ...user,
                ...userData
            }));

            // Kiểm tra các phần tử tồn tại trước khi cập nhật nội dung
            if (userName) userName.textContent = userData.username || '';
            if (userEmail) userEmail.textContent = userData.email || '';

            // Hiển thị avatar nếu có
            const userAvatar = document.getElementById('userAvatar');
            if (userAvatar && userData.avatar) {
                userAvatar.src = userData.avatar;
            }

            // Hiển thị profile và ẩn nút auth
            if (authButtons) authButtons.style.display = 'none';
            if (userProfile) userProfile.style.display = 'flex';

        } catch (error) {
            console.error('Error fetching user data:', error);
            // Xử lý lỗi - có thể logout user nếu không lấy được dữ liệu
            localStorage.removeItem('user');
            if (authButtons) authButtons.style.display = 'flex';
            if (userProfile) userProfile.style.display = 'none';
        }
    } else {
        // Chưa đăng nhập
        if (authButtons) authButtons.style.display = 'flex';
        if (userProfile) userProfile.style.display = 'none';
    }
}

function toggleDropdown() {
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Đóng dropdown khi click ra ngoài
window.onclick = function (event) {
    if (!event.target.closest('.user-profile')) {
        const dropdowns = document.getElementsByClassName('dropdown-menu');
        Array.from(dropdowns).forEach(dropdown => {
            if (dropdown.classList.contains('show')) {
                dropdown.classList.remove('show');
            }
        });
    }
}

function handleLogout() {
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// Gọi hàm kiểm tra khi trang web load
document.addEventListener('DOMContentLoaded', checkLoginStatus);
