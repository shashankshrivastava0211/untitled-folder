const socket = io();

socket.on('connect', () => {
    console.log('Socket connected');

    // Prompt user for device name
    const deviceName = prompt('Enter your device name:');

    // Initialize the map
    const map = L.map('map').setView([0, 0], 15);

    // Add the OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Markers for users' locations
    const markers = {};

    // Handle real-time updates and map initialization
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition((position) => {
            const { latitude, longitude } = position.coords;
            socket.emit('send-location', { latitude, longitude, deviceName });

            // Update the user's marker position or create it if it doesn't exist
            if (markers[socket.id]) {
                markers[socket.id].setLatLng([latitude, longitude]);
                markers[socket.id].bindPopup(deviceName).openPopup();
            } else {
                markers[socket.id] = L.marker([latitude, longitude])
                    .addTo(map)
                    .bindPopup(deviceName)
                    .openPopup();
            }
        }, 
        (error) => {
            console.log(error);
        }, 
        {   
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
        });
    } else {
        console.log('Geolocation is not supported by this browser.');
    }

    // Listen for location updates from other clients
    socket.on('receive-location', (data) => {
        const { id, latitude, longitude, deviceName } = data;

        // Update the marker position or create it if it doesn't exist
        if (markers[id]) {
            markers[id].setLatLng([latitude, longitude]);
            markers[id].bindPopup(deviceName).openPopup();
        } else {
            markers[id] = L.marker([latitude, longitude])
                .addTo(map)
                .bindPopup(deviceName)
                .openPopup();
        }
    });

    // Listen for marker removal when a client disconnects
    socket.on('remove-marker', (data) => {
        const { id } = data;

        // Remove the marker if it exists
        if (markers[id]) {
            map.removeLayer(markers[id]);
            delete markers[id];
        }
    });
});
