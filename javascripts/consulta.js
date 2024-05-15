var truckIcon = L.icon({
    iconUrl: '/camion1_.png', 
    iconSize: [40, 40],  // Tamaño del ícono
    iconAnchor: [20, 20],  // Punto del ícono que corresponderá a la coordenada del marcador
    popupAnchor: [0, -20]  // Dónde se mostrará el popup en relación al ícono
});

var truckIcon2 = L.icon({
    iconUrl: '/camion2__.png', 
    iconSize: [40, 40],  // Tamaño del ícono
    iconAnchor: [20, 20],  // Punto del ícono que corresponderá a la coordenada del marcador
    popupAnchor: [0, -20]  // Dónde se mostrará el popup en relación al ícono
});
let markers= []
let markers2 = []
let trayectos = []; // Almacena las polilíneas de cada trayecto
let trayectos2 = [];
let rutaActual;
let rutaActual2;
let decoradores = [];
let decoradores2 = []; // Almacena las instancias de los decoradores de flechas
let rpmGaugeHistoric;

document.addEventListener('DOMContentLoaded', () => {
    const myMap = L.map('mapid').setView([11.02115114, -74.84057200], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(myMap);
    // Inicializar el tacómetro
    rpmGaugeHistoric = new Gauge(document.getElementById("rpmGaugeMap")).setOptions({
        angle: 0.20, 
            lineWidth: 0.20,
            radiusScale: 1,
            pointer: {
                length: 0.5, // Relativo al radio del gauge
                strokeWidth: 0.035, // El grosor del puntero
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
    rpmGaugeHistoric.maxValue = 8000; // valor máximo del tacómetro
    rpmGaugeHistoric.setMinValue(0);  // valor mínimo del tacómetro
    rpmGaugeHistoric.set(0); // Establece un valor inicial
    console.log("rpmGaugeHistoric inicializado:", rpmGaugeHistoric);

    document.getElementById("vehicleSelector").addEventListener("change", () => {
        limpiarMapa();  // Limpia el mapa cada vez que se cambia la selección del vehículo
        const vehiculoSeleccionado = document.getElementById("vehicleSelector").value;
        const startDateTime = document.getElementById('startDateTime').value;
        const endDateTime = document.getElementById('endDateTime').value;
    
        if (vehiculoSeleccionado === 'vehiculo1' && startDateTime && endDateTime) {
            cargarDatos2(startDateTime, endDateTime, myMap);
        } else if (vehiculoSeleccionado === 'vehiculo2' && startDateTime && endDateTime) {
            cargarDatos(startDateTime, endDateTime, myMap);
        } else if (vehiculoSeleccionado === 'vehiculos' && startDateTime && endDateTime)
            cargarAmbosDatos(startDateTime, endDateTime, myMap);
    });

    document.getElementById('submitButton').addEventListener('click', (event) => {
        event.preventDefault(); // Previene la acción por defecto del formulario
        startDateTime = document.getElementById('startDateTime').value;
        endDateTime = document.getElementById('endDateTime').value;
    
        // Actualiza y muestra la fecha y hora seleccionadas
        updateDateTimeDisplay(startDateTime, endDateTime);
    
        // Decidir qué función llamar basándose en el vehículo seleccionado
        vehiculoSeleccionado = document.getElementById('vehicleSelector').value;
        if (vehiculoSeleccionado === 'vehiculo1') {
            cargarDatos2(startDateTime, endDateTime, myMap);
        } else if (vehiculoSeleccionado === 'vehiculo2') {
            cargarDatos(startDateTime, endDateTime, myMap);
        } else if (vehiculoSeleccionado === 'vehiculos'){
            cargarAmbosDatos(startDateTime, endDateTime, myMap);
        }
    });
    

    });
    if (!localStorage.getItem('hasSeenInstructions')) {
        console.log('Mostrando modal');
        var myModal = new bootstrap.Modal(document.getElementById('instructionsModal'), {
            keyboard: false
        });
        myModal.show();
        localStorage.setItem('hasSeenInstructions', 'true');
    }


let marcadorDeslizable; //definición de marcador deslizable
let marcadorDeslizable2; //definición de marcador deslizable 2
    function cargarDatos(startDateTime, endDateTime, myMap) {
        if (vehiculoSeleccionado == 'vehiculo2'){
            limpiarMapa()
        const link = `/consulta-historicos?startDateTime=${startDateTime}&endDateTime=${endDateTime}`; 
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
                    // Eliminar trayectos existentes y limpiar el arreglo
                    trayectos.forEach(trayecto => trayecto.remove());
                    trayectos = [];

                    // Eliminar marcadores existentes y limpiar el arreglo
                    markers.forEach(marker => marker.remove());
                    markers = [];

                    decoradores.forEach(decorador => decorador.remove());
                    decoradores = [];

                    rutaActual = L.polyline([], {
                        color: 'blue',      // Cambia el color a azul o el que prefieras
                        weight: 3,          // Ajusta el grosor de la línea
                        opacity: 0.7,       // Ajusta la opacidad de la línea
                        lineJoin: 'round',  // Establece cómo se unen los segmentos de la línea ('miter' es predeterminado, 'round' o 'bevel')
                    }).addTo(myMap);

                    trayectos.push(rutaActual);

                    let ultimoPunto = null;
                    data.forEach(point => {
                        const lat = parseFloat(point.Latitude); 
                        const lng = parseFloat(point.Longitude);
                        const nuevoPunto = L.latLng(lat, lng);

                        if (ultimoPunto && myMap.distance(ultimoPunto, nuevoPunto) > 500) {
                            if (ultimoPunto) {
                    let decorador = L.polylineDecorator(rutaActual, {
                        patterns: [
                            {offset: '5%', repeat: '50px', symbol: L.Symbol.arrowHead({pixelSize: 10, pathOptions: {opacity: 0.7, color: 'blue', weight: 3}})}
                        ]
                    }).addTo(myMap);
                    decoradores.push(decorador);
                }
                
                // Comienza un nuevo segmento
                rutaActual = L.polyline([], { color: 'blue', weight: 3, opacity: 0.7, lineJoin: 'round' }).addTo(myMap);
                trayectos.push(rutaActual);
            }

            // Añade el nuevo punto al segmento actual
            rutaActual.addLatLng(nuevoPunto);
            ultimoPunto = nuevoPunto;
        });

        // Decora el último segmento después de salir del bucle forEach
        if (rutaActual.getLatLngs().length > 0) {
            let decorador = L.polylineDecorator(rutaActual, {
                patterns: [
                    {offset: '5%', repeat: '50px', symbol: L.Symbol.arrowHead({pixelSize: 10, pathOptions: {opacity: 0.7, color: 'blue', weight: 3}})}
                ]
            }).addTo(myMap);
            decoradores.push(decorador);
        }
                    //implementación de slider
                    if (!marcadorDeslizable) {
                        marcadorDeslizable = L.marker([0, 0],{ 
                            draggable: 'true',
                            icon: truckIcon2
                        }).addTo(myMap);
                    }
                    const slider = document.getElementById('timeSlider');
                    slider.max = data.length - 1;
                    slider.value = 0;

                    slider.oninput = function() {
                        const puntoSeleccionado = data[this.value];
                        console.log("Intentando establecer RPM en tacómetro:", rpmGaugeHistoric);
                        const latLng = L.latLng(puntoSeleccionado.Latitude, puntoSeleccionado.Longitude);
                        marcadorDeslizable.setLatLng(latLng);
                        marcadorDeslizable.bindPopup(`Fecha y Hora de Paso: ${puntoSeleccionado.DateTime} - RPM: ${puntoSeleccionado.RPM}`).openPopup();
                        myMap.setView(latLng, myMap.getZoom());
                        if (rpmGaugeHistoric) {
                            rpmGaugeHistoric.set(puntoSeleccionado.RPM);
                        } else {
                            console.error('rpmGaugeHistoric no está definido');
                        }
                    };

                    slider.oninput();

                    document.getElementById('timeSlider').style.display = 'block'; 
                } else {
                    alert("No hay datos de ruta disponibles para la ventana de tiempo seleccionada.");
                    document.getElementById('timeSlider').style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error en fetch o procesando data:', error);
                alert("Hubo un problema al cargar los datos.");
                document.getElementById('timeSlider').style.display = 'none';
            });
    }
    }
//vehiculo 1
    function cargarDatos2(startDateTime, endDateTime, myMap) {
        const vehiculoSeleccionado = document.getElementById('vehicleSelector').value;
        if (vehiculoSeleccionado == 'vehiculo1'){
            limpiarMapa()
        const link2 = `/consulta-historicos2?startDateTime=${startDateTime}&endDateTime=${endDateTime}`; 
        fetch(link2)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data2 => {
                console.log(data2);
                if (data2.length > 0) {
                    // Eliminar trayectos existentes y limpiar el arreglo
                    trayectos2.forEach(trayecto => trayecto.remove());
                    trayectos2 = [];

                    // Eliminar marcadores existentes y limpiar el arreglo
                    markers2.forEach(marker => marker.remove());
                    markers2 = [];

                    decoradores2.forEach(decorador => decorador.remove());
                    decoradores2 = [];

                    rutaActual2 = L.polyline([], {
                        color: 'red',      // Cambia el color a azul o el que prefieras
                        weight: 3,          // Ajusta el grosor de la línea
                        opacity: 0.7,       // Ajusta la opacidad de la línea
                        lineJoin: 'round',  // Establece cómo se unen los segmentos de la línea ('miter' es predeterminado, 'round' o 'bevel')
                    }).addTo(myMap);

                    trayectos2.push(rutaActual2);

                    let ultimoPunto2 = null;
                    data2.forEach(point => {
                        const lat = parseFloat(point.Latitude); 
                        const lng = parseFloat(point.Longitude);
                        const nuevoPunto = L.latLng(lat, lng);

                        if (ultimoPunto2 && myMap.distance(ultimoPunto2, nuevoPunto) > 500) {
                            if (ultimoPunto2) {
                    let decorador = L.polylineDecorator(rutaActual2, {
                        patterns: [
                            {offset: '5%', repeat: '50px', symbol: L.Symbol.arrowHead({pixelSize: 10, pathOptions: {opacity: 0.7, color: 'red', weight: 3}})}
                        ]
                    }).addTo(myMap);
                    decoradores2.push(decorador);
                }
                
                // Comienza un nuevo segmento
                rutaActual2 = L.polyline([], { color: 'red', weight: 3, opacity: 0.7, lineJoin: 'round' }).addTo(myMap);
                trayectos2.push(rutaActual2);
            }

            // Añade el nuevo punto al segmento actual
            rutaActual2.addLatLng(nuevoPunto);
            ultimoPunto2 = nuevoPunto;
        });

        // Decora el último segmento después de salir del bucle forEach
        if (rutaActual2.getLatLngs().length > 0) {
            let decorador = L.polylineDecorator(rutaActual2, {
                patterns: [
                    {offset: '5%', repeat: '50px', symbol: L.Symbol.arrowHead({pixelSize: 10, pathOptions: {opacity: 0.7, color: 'red', weight: 3}})}
                ]
            }).addTo(myMap);
            decoradores2.push(decorador);
        }
                    //implementación de slider
                    if (!marcadorDeslizable2) {
                        marcadorDeslizable2 = L.marker([0, 0], {
                            draggable: 'true',
                            icon: truckIcon
                        }).addTo(myMap);
                    }
                    const slider = document.getElementById('timeSlider');
                    slider.max = data2.length - 1;
                    slider.value = 0;

                    slider.oninput = function() {
                        const puntoSeleccionado2 = data2[this.value];
                        const latLng2 = L.latLng(puntoSeleccionado2.Latitude, puntoSeleccionado2.Longitude);
                        marcadorDeslizable2.setLatLng(latLng2);
                        marcadorDeslizable2.bindPopup(`Fecha y Hora de Paso: ${puntoSeleccionado2.DateTime}`).openPopup();
                        myMap.setView(latLng2, myMap.getZoom());
                    };

                    slider.oninput();

                    document.getElementById('timeSlider').style.display = 'block'; 
                } else {
                    alert("No hay datos de ruta disponibles para la ventana de tiempo seleccionada.");
                    document.getElementById('timeSlider').style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Error en fetch o procesando data:', error);
                alert("Hubo un problema al cargar los datos.");
                document.getElementById('timeSlider').style.display = 'none';
            });
    }
    }
    function updateDateTimeDisplay() {
    const startDateTimeStr = document.getElementById('startDateTime').value;
    const endDateTimeStr = document.getElementById('endDateTime').value;

    if (startDateTimeStr && endDateTimeStr) {
            const [startDate, startTime] = startDateTimeStr.split(' ');
            const [endDate, endTime] = endDateTimeStr.split(' ');

            document.getElementById('startDateSpan').textContent = startDate;
            document.getElementById('startTimeSpan').textContent = startTime;
            document.getElementById('endDateSpan').textContent = endDate;
            document.getElementById('endTimeSpan').textContent = endTime;
    }
}
//ambos vehiculos
function cargarAmbosDatos(startDateTime, endDateTime, myMap) {
    console.log("Cargando datos para ambos vehículos");

    // Preparar las URLs para las consultas de ambos vehículos
    const link1 = `/consulta-historicos?startDateTime=${startDateTime}&endDateTime=${endDateTime}`;
    const link2 = `/consulta-historicos2?startDateTime=${startDateTime}&endDateTime=${endDateTime}`;

    // Usar Promise.all para manejar las dos solicitudes de forma simultánea
    Promise.all([
        fetch(link1).then(response => response.json()),
        fetch(link2).then(response => response.json())
    ]).then(results => {
        const [data1, data2] = results;

        // Limpia el mapa antes de mostrar nuevos datos
        limpiarMapa();

        // Procesar y mostrar los datos del primer vehículo
        if (data1.length > 0) {
            procesarDatosVehiculo(data1, myMap, 'blue', truckIcon2);
        } else {
            console.log("No hay datos para el vehículo 1 en el rango seleccionado.");
        }

        // Procesar y mostrar los datos del segundo vehículo
        if (data2.length > 0) {
            procesarDatosVehiculo(data2, myMap, 'red', truckIcon);
        } else {
            console.log("No hay datos para el vehículo 2 en el rango seleccionado.");
        }

        // Mostrar controles de usuario si hay datos
        if (data1.length > 0 || data2.length > 0) {
            document.getElementById('timeSlider').style.display = 'block';
        } else {
            alert("No hay datos de ruta disponibles para la ventana de tiempo seleccionada.");
            document.getElementById('timeSlider').style.display = 'none';
        }
    }).catch(error => {
        console.error('Error cargando datos de ambos vehículos:', error);
        alert("Hubo un problema al cargar los datos de ambos vehículos.");
        document.getElementById('timeSlider').style.display = 'none';
    });
}

// Función para procesar y mostrar los datos de cada vehículo
function procesarDatosVehiculo(data, myMap, color, icon) {
    let rutaActual = L.polyline([], { color: color, weight: 3, opacity: 0.7, lineJoin: 'round' }).addTo(myMap);
    let decoradores = [];
    let ultimoPunto = null;

    data.forEach(point => {
        const lat = parseFloat(point.Latitude);
        const lng = parseFloat(point.Longitude);
        const nuevoPunto = L.latLng(lat, lng);
        if (ultimoPunto && myMap.distance(ultimoPunto, nuevoPunto) > 500) {
            // Comienza un nuevo segmento si la distancia supera los 500 metros
            rutaActual = L.polyline([], { color: color, weight: 3, opacity: 0.7, lineJoin: 'round' }).addTo(myMap);
        }
        rutaActual.addLatLng(nuevoPunto);
        ultimoPunto = nuevoPunto;

        // Añadir marcadores y decoradores si es necesario
    });

    // Decorar la ruta con símbolos de dirección
    let decorador = L.polylineDecorator(rutaActual, {
        patterns: [
            {offset: '5%', repeat: '50px', symbol: L.Symbol.arrowHead({pixelSize: 10, pathOptions: {opacity: 0.7, color: color, weight: 3}})}
        ]
    }).addTo(myMap);
    decoradores.push(decorador);
    actualizarMarcadorDeslizable(data, myMap, icon);
}
function actualizarMarcadorDeslizable(data, myMap, icon) {
    if (!marcadorDeslizable) {
        marcadorDeslizable = L.marker([0, 0], {
            draggable: true,
            icon: icon
        }).addTo(myMap);
    }

    const slider = document.getElementById('timeSlider');
    slider.max = data.length - 1;
    slider.value = 0;

    slider.oninput = function() {
        const puntoSeleccionado = data[this.value];
        const latLng = L.latLng(puntoSeleccionado.Latitude, puntoSeleccionado.Longitude);
        marcadorDeslizable.setLatLng(latLng);
        marcadorDeslizable.bindPopup(`Fecha y Hora de Paso: ${puntoSeleccionado.DateTime} - RPM: ${puntoSeleccionado.RPM}`).openPopup();
        myMap.setView(latLng, myMap.getZoom());
        if (rpmGaugeHistoric) {
            rpmGaugeHistoric.set(puntoSeleccionado.RPM);
        }
    };

    slider.oninput(); // Inicializa el marcador en la primera posición
}

function limpiarMapa() {
    // Limpiar trayectos, marcadores y decoradores del vehículo 1
    trayectos.forEach(trayecto => trayecto.remove());
    trayectos = [];
    markers.forEach(marker => marker.remove());
    markers = [];
    decoradores.forEach(decorador => {
        if (decorador.remove) {
            decorador.remove();
        }
    });
    decoradores = [];

    // Limpiar trayectos, marcadores y decoradores del vehículo 2
    trayectos2.forEach(trayecto => trayecto.remove());
    trayectos2 = [];
    markers2.forEach(marker => marker.remove());
    markers2 = [];
    decoradores2.forEach(decorador => {
        if (decorador.remove) {
            decorador.remove();
        }
    });
    decoradores2 = [];

    if (marcadorDeslizable) {
        marcadorDeslizable.remove(); // Eliminar marcador deslizable si existe
        marcadorDeslizable = null; // Restablecer a null para reutilización
    }

    if (marcadorDeslizable2) {
        marcadorDeslizable2.remove(); // Eliminar marcador deslizable 2 si existe
        marcadorDeslizable2 = null; // Restablecer a null para reutilización
    }
}