// Header scroll effect
window.addEventListener('scroll', function () {
    const header = document.querySelector('header');
    const scrollPosition = window.scrollY;

    if (scrollPosition > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const searchResults = new SearchResults();

    // Giả sử bạn có dữ liệu từ một nguồn nào đó
    const flightData = [
        {
            flightId: "d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
            flightCode: "VN100",
            departureAirportId: "HAN",
            arrivalAirportId: "SGN",
            departureDateTime: "2024-03-20 08:00",
            arrivalDateTime: "2024-03-20 10:00",
            baseFare: 1000000
        },
        // ... more flights
    ];

    searchResults.setFlights(flightData);
});
