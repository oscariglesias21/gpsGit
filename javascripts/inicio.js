document.addEventListener('DOMContentLoaded', () => {
    const rpmGaugeElement = document.getElementById("rpmGauge");
    console.log('RPM Gauge element:', rpmGaugeElement); 
    if (rpmGaugeElement) {
        // Inicialización del gauge
        rpmGaugeElement.width = 300;
        rpmGaugeElement.height = 140;
        const rpmGauge = new Gauge(rpmGaugeElement);
        rpmGauge.setOptions({
            angle: 0.20,
            lineWidth: 0.20,
            radiusScale: 1,
            pointer: {
                length: 0.5,
                strokeWidth: 0.035,
                color: '#000000'
            },
            limitMax: false,
            limitMin: false,
            colorStart: '#FFC107',
            colorStop: '#FFC107',
            strokeColor: '#E0E0E0',
            generateGradient: true,
            highDpiSupport: true,
            staticLabels: {
                font: "12px sans-serif",
                labels: [0, 2000, 4000, 6000],
                color: "#000000",
                fractionDigits: 0
            },
            staticZones: [
                {strokeStyle: "#30B32D", min: 0, max: 2000},
                {strokeStyle: "#3498DB", min: 2000, max: 4000},
                {strokeStyle: "#F03E3E", min: 4000, max: 6000},
            ],
        });
        rpmGauge.maxValue = 6000;
        rpmGauge.setMinValue(0);
        rpmGauge.animationSpeed = 80;
        rpmGauge.set(0);

        // Guardar el rpmGauge en una variable global
        window.rpmGauge = rpmGauge;
    } else {
        console.error('Canvas element not found!');
    }

    // Inicialización del mapa de Leaflet y otros componentes
    const myMap = L.map('map-in-container').setView([11.02115114, -74.84057200], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(myMap);

    // Iconos de los camiones
    var truckIcon = L.icon({
        iconUrl: '/camion1_.png',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });

    var truckIcon2 = L.icon({
        iconUrl: '/camion2__.png',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });

    // Marcadores de los camiones
    let marker = L.marker([0, 0], {icon: truckIcon2}).addTo(myMap);
    let marker2 = L.marker([0, 0], {icon: truckIcon}).addTo(myMap);

    // Rutas de los camiones
    let routePath = L.polyline([], {color: 'blue'}).addTo(myMap);
    let routePath2 = L.polyline([], {color: 'red'}).addTo(myMap);

    // Variables de posición y temporizador
    let lastMarkerPosition = null;
    let lastMarkerPosition2 = null;
    let inactivityTimer;
    let inactivityTimer2;
    let centrarMapa = null;

    // Recuperar y dibujar la ruta almacenada
    const storedRoute = localStorage.getItem('routePath');
    if (storedRoute) {
        const routePoints = JSON.parse(storedRoute);
        routePath.setLatLngs(routePoints.map(p => L.latLng(p.lat, p.lng)));
    }

    // Conexión al servidor mediante Socket.IO
    const socket = io();
    console.log('Conexión a Socket.IO establecida correctamente.');

    // Escuchar actualizaciones de ubicación de los vehículos
    socket.on('locationUpdate', (data) => {
        if (document.getElementById("vehicleSelector").value === "item2" || document.getElementById("vehicleSelector").value === "item3") {
            console.log('Datos recibidos del servidor:', data);
            updateVehicleDisplay(data, marker, routePath);
        }
    });

    socket.on('locationUpdate1', (data2) => {
        if (document.getElementById("vehicleSelector").value === "item1" || document.getElementById("vehicleSelector").value === "item3") {
            updateVehicleDisplay2(data2, marker2, routePath2);
        }
    });

    // Actualización de la visualización del vehículo 2
    function updateVehicleDisplay(data, marker, routePath) {
        const { Latitude, Longitude, Date, Time, RPM } = data;
        console.log(`Fecha: ${Date}, Hora: ${Time}, Latitud: ${Latitude}, Longitud: ${Longitude}, RPM: ${RPM}`);

        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            routePath.setLatLngs([]);
            localStorage.removeItem('routePath');
            console.log('La ruta ha sido borrada debido a la inactividad.');
        }, 20000);

        document.getElementById('latitude').innerText = Latitude;
        document.getElementById('longitude').innerText = Longitude;
        document.getElementById('date').innerText = Date;
        document.getElementById('time').innerText = Time;

        if (RPM !== undefined) {
            document.getElementById('RPM').innerText = RPM;
            window.rpmGauge.set(RPM);
        } else {
            document.getElementById('RPM').innerText = '-';
            window.rpmGauge.set(0);
        }

        let dateElement = document.getElementById('date');
        if (dateElement) {
            const dateString = dateElement.textContent || dateElement.innerText;
            const formattedDate = dateString.split('T')[0];
            dateElement.textContent = formattedDate;
        }
        const newLatLng = new L.LatLng(data.Latitude, data.Longitude);
        centrarMapa = newLatLng;

        if (lastMarkerPosition && lastMarkerPosition.distanceTo(newLatLng) > 200) {
            routePath.setLatLngs([]);
            localStorage.removeItem('routePath');
        }
        myMap.setView(newLatLng);
        marker.setLatLng(newLatLng);
        routePath.addLatLng(newLatLng);
        lastMarkerPosition = newLatLng;
    }

    // Actualización de la visualización del vehículo 1
    function updateVehicleDisplay2(data2, marker2, routePath2) {
        const { Latitude, Longitude, Date, Time } = data2;
        console.log(`Fecha: ${Date}, Hora: ${Time}, Latitud: ${Latitude}, Longitud: ${Longitude}`);

        clearTimeout(inactivityTimer2);
        inactivityTimer2 = setTimeout(() => {
            routePath2.setLatLngs([]);
            localStorage.removeItem('routePath2');
            console.log('La ruta ha sido borrada debido a la inactividad.');
        }, 20000);

        document.getElementById('latitude').innerText = Latitude;
        document.getElementById('longitude').innerText = Longitude;
        document.getElementById('date').innerText = Date;
        document.getElementById('time').innerText = Time;

        let dateElement = document.getElementById('date');
        if (dateElement) {
            const dateString = dateElement.textContent || dateElement.innerText;
            const formattedDate = dateString.split('T')[0];
            dateElement.textContent = formattedDate;
        }
        const newLatLng2 = new L.LatLng(data2.Latitude, data2.Longitude);
        centrarMapa = newLatLng2;

        if (lastMarkerPosition2 && lastMarkerPosition2.distanceTo(newLatLng2) > 200) {
            routePath2.setLatLngs([]);
            localStorage.removeItem('routePath2');
        }
        myMap.setView(newLatLng2);
        marker2.setLatLng(newLatLng2);
        routePath2.addLatLng(newLatLng2);
        lastMarkerPosition2 = newLatLng2;
    }

    // Función para centrar el mapa en la última ubicación conocida
    document.getElementById('centrarMapaBtn').addEventListener('click', () => {
        if (centrarMapa) {
            myMap.setView(centrarMapa);
        } else {
            alert('Ubicación no disponible.');
        }
        const currentRoute = routePath.getLatLngs();
        localStorage.setItem('routePath', JSON.stringify(currentRoute.map(p => ({ lat: p.lat, lng: p.lng }))));
        const currentRoute2 = routePath2.getLatLngs();
        localStorage.setItem('routePath2', JSON.stringify(currentRoute2.map(p => ({ lat: p.lat, lng: p.lng }))));
    });

    // Función para cambiar la visualización según el vehículo seleccionado
    function navigate() {
        const selectedOption = document.getElementById("vehicleSelector").value;
        console.log("Opción seleccionada:", selectedOption);
        document.getElementById('latitude').innerText = "Cargando...";
        document.getElementById('longitude').innerText = "Cargando...";
        document.getElementById('date').innerText = "Cargando...";
        document.getElementById('time').innerText = "Cargando...";
        document.getElementById('RPM').innerText = "Cargando...";
        if (selectedOption === "item1") {
            myMap.addLayer(routePath2);
            myMap.addLayer(marker2);
            myMap.removeLayer(routePath);
            myMap.removeLayer(marker);
        } else if (selectedOption === "item2") {
            myMap.addLayer(routePath);
            myMap.addLayer(marker);
            myMap.removeLayer(routePath2);
            myMap.removeLayer(marker2);
        } else if (selectedOption === "item3") {
            myMap.addLayer(routePath);
            myMap.addLayer(marker);
            myMap.addLayer(routePath2);
            myMap.addLayer(marker2);
        }
    }

    document.getElementById("vehicleSelector").addEventListener("change", () => {
        navigate();
        resetDataDisplays();
    });

    // Función para resetear las visualizaciones de datos
    function resetDataDisplays() {
        document.getElementById('latitude').innerText = "--";
        document.getElementById('longitude').innerText = "--";
        document.getElementById('date').innerText = "--";
        document.getElementById('time').innerText = "--";
        document.getElementById('RPM').innerText = "--";
    }
});
