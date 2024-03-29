document.addEventListener('DOMContentLoaded', () => {
    const myMap = L.map('mapid').setView([11.02115114, -74.84057200], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(myMap);

    let routePath = L.polyline([], { color: 'red' }).addTo(myMap);
    document.getElementById('timeWindowForm').addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent form submission
        const startDate = document.getElementById('startDate').value;
        const startTime = document.getElementById('startTime').value;
        const endDate = document.getElementById('endDate').value;
        const endTime = document.getElementById('endTime').value;

        console.log('Fecha de inicio:', startDate);
        console.log('Hora de inicio:', startTime);
        console.log('Fecha de fin:', endDate);
        console.log('Hora de fin:', endTime);

        cargarDatos(startDate, startTime, endDate, endTime);
    });

    function cargarDatos(startDate, startTime, endDate, endTime) {
    const link = `/consulta-historicos?startDate=${startDate}&startTime=${startTime}&endDate=${endDate}&endTime=${endTime}`;
        fetch(link)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
        })
        .then(data => {
            console.log(data);
            if (data.length > 0) {
                // Clear the previous route
                routePath.setLatLngs([]);

                // Iterate through the data array and add each point to the route
                data.forEach(point => {
                    routePath.addLatLng([point.latitud, point.longitud]);
                });
                myMap.fitBounds(routePath.getBounds());
                // Add a marker at the initial point of the route
                const firstPoint = [data[0].latitud, data[0].longitud];
                const firstMarker = L.marker(firstPoint).addTo(myMap).bindPopup('Punto inicial').openPopup();

                // Add a marker at the last point of the route
                const lastPoint = [data[data.length - 1].latitud, data[data.length - 1].longitud];
                const lastMarker = L.marker(lastPoint).addTo(myMap).bindPopup('Punto final').openPopup();
            } else {
                alert("No hay datos de ruta disponibles para la ventana de tiempo seleccionada.");
            }
        })
        .catch(error => {
            console.error('Error fetching or processing data:', error);
            alert("Hubo un problema al cargar los datos.");
        });
    }
});
