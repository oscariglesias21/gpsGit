document.addEventListener('DOMContentLoaded', () => {
    const myMap = L.map('map-in-container').setView([11.02115114, -74.84057200], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(myMap);
    var truckIcon = L.icon({
        iconUrl: '/camion1_.png',  // Asegúrate de que esta URL sea accesible
        iconSize: [40, 40],  // Tamaño del ícono
        iconAnchor: [20, 20],  // Punto del ícono que corresponderá a la coordenada del marcador
        popupAnchor: [0, -20]  // Dónde se mostrará el popup en relación al ícono
    });
    
    var truckIcon2 = L.icon({
        iconUrl: '/camion2__.png',  // Asegúrate de que esta URL sea accesible
        iconSize: [40, 40],  // Tamaño del ícono
        iconAnchor: [20, 20],  // Punto del ícono que corresponderá a la coordenada del marcador
        popupAnchor: [0, -20]  // Dónde se mostrará el popup en relación al ícono
    });
    let marker = L.marker([0, 0], {icon: truckIcon2}).addTo(myMap);
    let marker2 = L.marker([0, 0], {icon: truckIcon}).addTo(myMap);

    let routePath = L.polyline([], {color: 'red'}).addTo(myMap); // Crea una polilínea vacía con el color rojo
    let routePath2 = L.polyline([], {color: 'blue'}).addTo(myMap); // Crea una polilínea vacía con el color rojo

    let lastMarkerPosition = null;
    let lastMarkerPosition2 = null;

    let inactivityTimer;
    let inactivityTimer2;
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

    socket.on('locationUpdate', (data) => { //vehiculo 2
        if (document.getElementById("vehicleSelector").value === "item2" || document.getElementById("vehicleSelector").value === "item3") {
            console.log('Datos recibidos del servidor:', data);
            updateVehicleDisplay(data, marker, routePath);
        }
    });
    socket.on('locationUpdate1', (data2) => { //vehiculo 1
        if (document.getElementById("vehicleSelector").value === "item1" || document.getElementById("vehicleSelector").value === "item3") {
            updateVehicleDisplay2(data2, marker2, routePath2);
        }
    });

    function updateVehicleDisplay(data, marker, routePath) { //vehiculo 2
        const { Latitude, Longitude, Date, Time, RPM } = data;
        console.log(`Fecha: ${Date}, Hora: ${Time}, Latitud: ${Latitude}, Longitud: ${Longitude}, RPM: ${RPM}`);

        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            routePath.setLatLngs([]); // Borra la línea si no se han recibido datos durante 1 minuto
            localStorage.removeItem('routePath'); // Opcional: Limpia la ruta almacenada
            console.log('La ruta ha sido borrada debido a la inactividad.');
        }, 20000); // 20000 milisegundos = 20 segundos

        document.getElementById('latitude').innerText = Latitude;
        document.getElementById('longitude').innerText = Longitude;
        document.getElementById('date').innerText = Date;
        document.getElementById('time').innerText = Time;

        if (RPM !== undefined) {
            document.getElementById('RPM').innerText = RPM;
            rpmGauge.set(RPM);  // Actualizar el gauge con el valor de RPM
        } else {
            document.getElementById('RPM').innerText = '-';
            rpmGauge.set(0);  // Resetear el gauge si no hay datos de RPM
        }

        // Asegúrate de que dateElement esté definido antes de usarlo
        let dateElement = document.getElementById('date');  // Definir correctamente dateElement
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
    }
    //vehiculo 1-------------------------------------------------------------------------------
    function updateVehicleDisplay2(data2, marker2, routePath2) {
        const { Latitude, Longitude, Date, Time} = data2;
        console.log(`Fecha: ${Date}, Hora: ${Time}, Latitud: ${Latitude}, Longitud: ${Longitude}`);

        clearTimeout(inactivityTimer2);
        inactivityTimer2 = setTimeout(() => {
            routePath2.setLatLngs([]); // Borra la línea si no se han recibido datos durante 1 minuto
            localStorage.removeItem('routePath2'); // Opcional: Limpia la ruta almacenada
            console.log('La ruta ha sido borrada debido a la inactividad.');
        }, 20000); // 20000 milisegundos = 20 segundos

        document.getElementById('latitude').innerText = Latitude;
        document.getElementById('longitude').innerText = Longitude;
        document.getElementById('date').innerText = Date;
        document.getElementById('time').innerText = Time;

        // Asegúrate de que dateElement esté definido antes de usarlo
        let dateElement = document.getElementById('date');  // Definir correctamente dateElement
        if (dateElement) {
            const dateString = dateElement.textContent || dateElement.innerText;
            const formattedDate = dateString.split('T')[0]; // Extrae solo la parte de la fecha
            dateElement.textContent = formattedDate; // Establece el texto con la fecha formateada
        }
        const newLatLng2 = new L.LatLng(data2.Latitude, data2.Longitude);
        centrarMapa = newLatLng2;
        
        if (lastMarkerPosition2 && lastMarkerPosition2.distanceTo(newLatLng2) > 200) {
            // Si el marcador se ha movido más de 200 metros, reinicia la polilínea
            routePath2.setLatLngs([]);
            localStorage.removeItem('routePath2'); // Limpia la ruta almacenada si es necesario
        }
        myMap.setView(newLatLng2);
        marker2.setLatLng(newLatLng2);
        routePath2.addLatLng(newLatLng2); // Añade el nuevo punto a la polilínea para trazar el recorrido
        lastMarkerPosition2 = newLatLng2;
    }


    document.getElementById('centrarMapaBtn').addEventListener('click', () => {
        if (centrarMapa) {
            myMap.setView(centrarMapa); // Centra el mapa en la última ubicación conocida
        } else {
            alert('Ubicación no disponible.'); // O maneja este caso como prefieras
        }
        // Guardar la ruta actual en el almacenamiento local
        const currentRoute = routePath.getLatLngs();
            localStorage.setItem('routePath', JSON.stringify(currentRoute.map(p => ({ lat: p.lat, lng: p.lng }))));
        const currentRoute2 = routePath2.getLatLngs();
            localStorage.setItem('routePath2', JSON.stringify(currentRoute2.map(p => ({ lat: p.lat, lng: p.lng }))));
    });
    // Función para cambiar la página según la opción seleccionada en el menú desplegable
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
        // Reiniciar los datos mostrados en los contenedores
        resetDataDisplays();
    });

    function resetDataDisplays() {
        document.getElementById('latitude').innerText = "--";
        document.getElementById('longitude').innerText = "--";
        document.getElementById('date').innerText = "--";
        document.getElementById('time').innerText = "--";
        document.getElementById('RPM').innerText = "--";
    }
});
