// Inicializar la cantidad de cupos disponibles para cada colectivo desde el servidor
let availableSeats = {};
let isFetching = false; // Bandera para prevenir solicitudes duplicadas
let isInitialized = false; // Bandera para evitar múltiples inicializaciones

// Función para sincronizar los cupos iniciales al cargar la página
function fetchAvailableSeats() {
    fetch('/available-seats')
        .then(response => response.json())
        .then(data => {
            availableSeats = data;
            updateAvailableSeatsDisplay(); // Actualiza la interfaz
            checkAndResetSeats(); // Verifica si es necesario reiniciar
        })
        .catch(error => console.error('Error al obtener los cupos disponibles:', error));
}


// Función para reservar un cupo según el colectivo seleccionado
function reserveSeat(event) {
    if (isFetching) return; // Prevenir solicitudes duplicadas
    isFetching = true;

    event.stopPropagation();
    console.log('Evento clic en Reservar ejecutado');

    const selectedColectivo = document.getElementById('vehicleSelector').value;
    const vehicleSelector = document.getElementById('vehicleSelector');
    const selectedOption = vehicleSelector.options[vehicleSelector.selectedIndex];
    const car = selectedOption.dataset.car; // Vehículo
    const plate = selectedOption.dataset.plate; // Placa

    if (!["item1", "item2"].includes(selectedColectivo)) {
        Swal.fire({
            icon: 'info',
            title: 'Información',
            text: 'Por favor, selecciona un colectivo válido.',
            confirmButtonText: 'Entendido'
        });
        isFetching = false; // Liberar el flag si la validación falla
        return;
    }

    // Verificar si ya se reservó desde este dispositivo y si han pasado 5 minutos
    const reservationKey = `reservation_${selectedColectivo}`;
    const lastReservationTime = localStorage.getItem(reservationKey);
    const now = Date.now();

    if (lastReservationTime) {
        const timeElapsed = (now - parseInt(lastReservationTime, 10)) / 1000; // Tiempo transcurrido en segundos
        const waitTime = 2 * 60; // 5 minutos en segundos

        if (timeElapsed < waitTime) {
            const remainingTime = Math.ceil((waitTime - timeElapsed) / 60); // Tiempo restante en minutos
            Swal.fire({
                icon: 'warning',
                title: 'Reserva no permitida',
                text: `Debes esperar ${remainingTime} minuto(s) antes de realizar otra reserva.`,
                confirmButtonText: 'Aceptar'
            });
            isFetching = false; // Liberar el flag si no ha pasado suficiente tiempo
            return;
        }
    }

    Swal.fire({
        title: 'Selecciona el método de pago',
        input: 'select',
        inputOptions: {
            efectivo: 'Efectivo',
            tarjeta: 'Tarjeta'
        },
        inputPlaceholder: 'Selecciona un método de pago',
        showCancelButton: true,
        confirmButtonText: 'Reservar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const paymentMethod = result.value;

            // Enviar solicitud de reserva al servidor con método de pago, vehículo y placa
            fetch('/reserve-seat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    colectivo: selectedColectivo,
                    paymentMethod,
                    car,
                    plate 
                })
            })
                .then(response => {
                    isFetching = false; // Liberar el flag después de la respuesta
                    if (response.ok) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Reserva Exitosa',
                            text: `¡Cupo reservado para el ${selectedColectivo === "item1" ? "Colectivo 1" : "Colectivo 2"}, Vehículo: ${car}, Placa: ${plate} con pago en ${paymentMethod}!`,
                            confirmButtonText: 'Aceptar'
                        });

                        // Guardar el tiempo de la reserva en localStorage
                        localStorage.setItem(reservationKey, now.toString());

                        fetchAvailableSeats();
                    } else {
                        response.text().then(text => {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: text || 'Algo salió mal. Por favor, inténtalo nuevamente.',
                                confirmButtonText: 'Aceptar'
                            });
                        });
                    }
                })
                .catch(error => {
                    isFetching = false; // Liberar el flag en caso de error
                    console.error('Error al reservar el cupo:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error de conexión',
                        text: 'No se pudo conectar con el servidor.',
                        confirmButtonText: 'Aceptar'
                    });
                });
        } else {
            isFetching = false; // Liberar el flag si el usuario cancela
        }
    });
}





// Función para actualizar la visualización de los cupos disponibles
function updateAvailableSeatsDisplay() {
    const selectedColectivo = document.getElementById('vehicleSelector').value;

    if (selectedColectivo === "item1") {
        document.getElementById('availableSeats').innerText = availableSeats.item1 || 0;
    } else if (selectedColectivo === "item2") {
        document.getElementById('availableSeats').innerText = availableSeats.item2 || 0;
    } else if (selectedColectivo === "item3") {
        document.getElementById('availableSeats').innerText = `C1: ${availableSeats.item1 || 0}, C2: ${availableSeats.item2 || 0}`;
    }
}
let isResetting = false; // Nueva bandera para evitar reinicios múltiples

function checkAndResetSeats() {
    const allZero = availableSeats.item1 === 0 && availableSeats.item2 === 0;

    if (allZero && !isResetting) {
        console.log('Cupos en cero. Reiniciando automáticamente...');
        isResetting = true; // Evitar reinicios adicionales
        resetSeats();
    }
}

function resetSeats() {
    fetch('/reset-seats', { method: 'POST' })
        .then(response => {
            if (response.ok) {
                console.log('Cupos reiniciados automáticamente.');
                fetchAvailableSeats(); // Actualizar los datos tras el reinicio
                isResetting = false; // Permitir futuros reinicios
            } else {
                console.error('Error al reiniciar los cupos automáticamente.');
                isResetting = false; // Liberar la bandera en caso de error
            }
        })
        .catch(error => {
            console.error('Error al intentar reiniciar los cupos:', error);
            isResetting = false; // Liberar la bandera en caso de error
        });
}

// Verificar periódicamente los cupos
function startMonitoringSeats() {
    setInterval(() => {
        fetchAvailableSeats(); // Sincronizar los datos actuales
        checkAndResetSeats(); // Verificar si es necesario reiniciar
    }, 5000); // Ejecutar cada 5 segundos (ajustable)
}


function reserveSeatWithUserName(selectedColectivo, userName) {
    fetch('/reserve-seat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ colectivo: selectedColectivo, user: userName })
    })
    .then(response => {
        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Reserva Exitosa',
                text: `¡Cupo reservado por ${userName} en el ${selectedColectivo === "item1" ? "Colectivo 1" : "Colectivo 2"}! ${car}, Placa: ${plate}`,
                confirmButtonText: 'Aceptar'
            });
        } else {
            response.text().then(text => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: text || 'Algo salió mal. Por favor, inténtalo nuevamente.',
                    confirmButtonText: 'Aceptar'
                });
            });
        }
    })
    .catch(error => {
        console.error('Error al reservar el cupo:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo conectar con el servidor.',
            confirmButtonText: 'Aceptar'
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (isInitialized) return; // Prevenir inicialización múltiple
    isInitialized = true;

    fetchAvailableSeats(); // Sincronizar los cupos disponibles al cargar
    updateAvailableSeatsDisplay(); // Actualizar la interfaz

    // Registrar el evento "Reservar cupo" de manera única
    const reserveButton = document.getElementById('reserveSeatBtn');
    reserveButton.replaceWith(reserveButton.cloneNode(true)); // Clona el botón para eliminar eventos duplicados
    const newReserveButton = document.getElementById('reserveSeatBtn');
    newReserveButton.addEventListener('click', reserveSeat); // Agregar el evento una sola vez

    // Escuchar cambios en el selector de colectivos
    document.getElementById('vehicleSelector').addEventListener('change', updateAvailableSeatsDisplay);
    startMonitoringSeats();

    // Ejemplo de inicialización adicional de componentes si es necesario
    console.log('Componentes inicializados correctamente.');

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

    // Iconos y marcadores de camiones
    var truckIcon = L.icon({
        iconUrl: '/colectivo1 (2).png',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });

    var truckIcon2 = L.icon({
        iconUrl: '/colectivo2-removebg-preview.png',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });

    let marker = L.marker([0, 0], {icon: truckIcon2}).addTo(myMap);
    let marker2 = L.marker([0, 0], {icon: truckIcon}).addTo(myMap);

    let routePath = L.polyline([], {color: 'blue'}).addTo(myMap);
    let routePath2 = L.polyline([], {color: 'red'}).addTo(myMap);

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

    socket.on('updateSeats', (data) => {
        console.log('Cupos actualizados desde el servidor:', data);
        availableSeats = data; // Sincronizar con los datos del servidor
        updateAvailableSeatsDisplay();
        checkAndResetSeats(); // Verificar si es necesario reiniciar
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
