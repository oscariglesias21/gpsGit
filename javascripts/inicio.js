document.addEventListener('DOMContentLoaded', () => {
    const myMap = L.map('map-in-container').setView([11.02115114, -74.84057200], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(myMap);

    let marker = L.marker([0, 0]).addTo(myMap);
    let marker2 = L.marker([0, 0]).addTo(myMap);

    let routePath = L.polyline([], {color: 'red'}).addTo(myMap); // Crea una polilínea vacía con el color rojo
    let routePath2 = L.polyline([], {color: 'blue'}).addTo(myMap); // Crea una polilínea vacía con el color rojo

    let lastMarkerPosition = null;
    let lastMarkerPosition2 = null;

    let inactivityTimer;
    let centrarMapa = null;

    // Intentar recuperar y dibujar la ruta almacenada
    const storedRoute = localStorage.getItem('routePath');
    if (storedRoute) {
        const routePoints = JSON.parse(storedRoute);
        routePath.setLatLngs(routePoints.map(p => L.latLng(p.lat, p.lng)));
    }
    //tacometro
    const rpmGauge = new Gauge(document.getElementById("rpmGauge")).setOptions({
        angle: 0.20, 
        lineWidth: 0.20,
        radiusScale: 1,
        pointer: {
            length: 0.5, 
            strokeWidth: 0.035, // grosor del puntero
            color: '#000000' // Color del puntero
        },
        limitMax: false,
        limitMin: false,
        colorStart: '#FFC107', 
        colorStop: '#FFC107', 
        strokeColor: '#E0E0E0', 
        generateGradient: true,
        highDpiSupport: true,
        staticLabels: {
            font: "14px sans-serif", 
            labels: [0, 2000, 4000, 6000, 8000], 
            color: "#000000", 
            fractionDigits: 0 
        },
        staticZones: [
            {strokeStyle: "#F03E3E", min: 0, max: 2000}, 
            {strokeStyle: "#3498DB", min: 2000, max: 4000}, 
            {strokeStyle: "#2980B9", min: 4000, max: 6000}, 
            {strokeStyle: "#30B32D", min: 6000, max: 8000} 
        ],
    });
    rpmGauge.maxValue = 8000;
    rpmGauge.setMinValue(0); 
    rpmGauge.animationSpeed = 80;
    rpmGauge.set(0); 
    //
    const socket = io();
    console.log('Conexión a Socket.IO establecida correctamente.');

    socket.on('locationUpdate', (data) => {
        console.log('Datos recibidos del servidor:', data);
        const { Latitude, Longitude, Date, Time, RPM } = data;
        console.log(`Fecha: ${Date}, Hora: ${Time}, Latitud: ${Latitude}, Longitud: ${Longitude}, RPM: ${RPM}`);
        rpmGauge.set(data.RPM);
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
        routePath.setLatLngs([]); // Borra la línea si no se han recibido datos durante 1 minuto
        localStorage.removeItem('routePath'); // Opcional: Limpia la ruta almacenada
        console.log('La ruta ha sido borrada debido a la inactividad.');
        }, 20000); // 20000 milisegundos = 20 segundos

        const dateElement = document.getElementById('date');

        document.getElementById('latitude').innerText = data.Latitude;
        document.getElementById('longitude').innerText = data.Longitude;
        document.getElementById('date').innerText = data.Date;
        document.getElementById('time').innerText = data.Time;
        document.getElementById('RPM').innerText = data.RPM !== undefined ? data.RPM : '-';

    
        if (dateElement) {
            const dateString = dateElement.textContent || dateElement.innerText;
            const formattedDate = dateString.split('T')[0]; // Extrae solo la parte de la fecha
            dateElement.textContent = formattedDate; // Establece el texto con la fecha formateada
        }
        const newLatLng = new L.LatLng(data.Latitude, data.Longitude);
        centrarMapa = newLatLng;
        
    if (lastMarkerPosition && lastMarkerPosition.distanceTo(newLatLng) > 200) {
        // Si el marcador se ha movido más de 400 metros, reinicia la polilínea
        routePath.setLatLngs([]);
        localStorage.removeItem('routePath'); // Limpia la ruta almacenada si es necesario
    }
        myMap.setView(newLatLng);
        marker.setLatLng(newLatLng);
        routePath.addLatLng(newLatLng); // Añade el nuevo punto a la polilínea para trazar el recorrido
        lastMarkerPosition = newLatLng;

    });
    document.getElementById('centrarMapaBtn').addEventListener('click', () => {
        if (centrarMapa) {
            myMap.setView(centrarMapa); // Centra el mapa en la última ubicación conocida
        } else {
            alert('Ubicación no disponible.'); // O maneja este caso como prefieras
        }
        // Guardar la ruta actual en el almacenamiento local
        const currentRoute = routePath.getLatLngs();
            localStorage.setItem('routePath', JSON.stringify(currentRoute.map(p => ({ lat: p.lat, lng: p.lng }))));
    });
});



// Función para cambiar la página según la opción seleccionada en el menú desplegable
function navigate(option) {
    console.log("Opción seleccionada:", option);
    var vehicleSelected = document.getElementById("vehicleSelector").value;
    switch(vehicleSelected){
        case "Vehículo 1":
            mymap.addLayer(routePath);
            mymap.addLayer(marker);
            mymap.addLayer(routepath2);
            mymap.addLayer(marker2);
            break;
        case "Vehículo 2":
            mymap.addLayer(routePath2);
            mymap.addLayer(marker2);
            mymap.addLayer(routepath);
            mymap.addLayer(marker);
            break;
        case "Vehículo 1 y 2":
            mymap.addLayer(routePath);
            mymap.addLayer(marker);
            mymap.addLayer(routepath2);
            mymap.addLayer(marker2);
            break;
    }
}
socket.on('locationUpdate2', (data) => {
        console.log('Datos recibidos del servidor:', data);
        const { Latitude, Longitude, Date, Time, RPM } = data;
        console.log(`Fecha: ${Date}, Hora: ${Time}, Latitud: ${Latitude}, Longitud: ${Longitude}, RPM: ${RPM}`);
        rpmGauge.set(data.RPM);
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
        routePath.setLatLngs([]); // Borra la línea si no se han recibido datos durante 1 minuto
        localStorage.removeItem('routePath'); // Opcional: Limpia la ruta almacenada
        console.log('La ruta ha sido borrada debido a la inactividad.');
        }, 20000); // 20000 milisegundos = 20 segundos

        const dateElement = document.getElementById('date');

        document.getElementById('latitude').innerText = data.Latitude;
        document.getElementById('longitude').innerText = data.Longitude;
        document.getElementById('date').innerText = data.Date;
        document.getElementById('time').innerText = data.Time;
        document.getElementById('RPM').innerText = data.RPM !== undefined ? data.RPM : '-';

    
        if (dateElement) {
            const dateString = dateElement.textContent || dateElement.innerText;
            const formattedDate = dateString.split('T')[0]; // Extrae solo la parte de la fecha
            dateElement.textContent = formattedDate; // Establece el texto con la fecha formateada
        }
    if (lastMarkerPosition2 && lastMarkerPosition2.distanceTo(newLatLng) > 200) {
        // Si el marcador se ha movido más de 400 metros, reinicia la polilínea
        routePath2.setLatLngs([]);
        localStorage.removeItem('routePath'); // Limpia la ruta almacenada si es necesario
    }
        myMap.setView(newLatLng);
        marker2.setLatLng(newLatLng);
        routePath2.addLatLng(newLatLng); // Añade el nuevo punto a la polilínea para trazar el recorrido
        lastMarkerPosition2 = newLatLng;

    });