let markers = [];
let markers2 = [];
let trayectos = []; // Almacena las polilíneas de cada trayecto
let rutaActual;
let rutaActual2;
let decoradores = []; // Almacena las instancias de los decoradores de flechas
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


    document.getElementById('submitButton').addEventListener('click', (event) => {
        event.preventDefault(); // Previene la acción por defecto del formulario
        const startDateTime = document.getElementById('startDateTime').value;
        const endDateTime = document.getElementById('endDateTime').value;

        // Actualiza y muestra la fecha y hora seleccionadas
        updateDateTimeDisplay(startDateTime, endDateTime);

        // Carga los datos para el intervalo de tiempo seleccionado
        cargarDatos(startDateTime, endDateTime, myMap);
    });
    if (!localStorage.getItem('hasSeenInstructions')) {
        console.log('Mostrando modal');
        var myModal = new bootstrap.Modal(document.getElementById('instructionsModal'), {
            keyboard: false
        });
        myModal.show();
        localStorage.setItem('hasSeenInstructions', 'true');
    }
    function navigate() {
        const selectedOption = document.getElementById("vehicleSelector").value;
        console.log("Opción seleccionada:", selectedOption);
        if (selectedOption === "vehiculo1") {
            myMap.addLayer(rutaActual2);
            myMap.addLayer(markers2);
            myMap.removeLayer(rutaActual);
            myMap.removeLayer(markers);
        } else if (selectedOption === "vehiculo2") {
            myMap.addLayer(rutaActual);
            myMap.addLayer(markers);
            myMap.removeLayer(rutaActual2);
            myMap.removeLayer(markers2);
        } else if (selectedOption === "vehiculos") {
            myMap.addLayer(rutaActual);
            myMap.addLayer(markers);
            myMap.addLayer(rutaActual2);
            myMap.addLayer(markers2);
        }
    }
    document.getElementById("vehicleSelector").addEventListener("change", () => {
        navigate();
    });
});

let marcadorDeslizable; //definición de marcador deslizable
    function cargarDatos(startDateTime, endDateTime, myMap) {
        const vehiculoSeleccionado = document.getElementById('vehicleSelector').value;
        if (vehiculoSeleccionado == 'vehiculo2'){
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
                        marcadorDeslizable = L.marker([0, 0], {
                            draggable: 'true',
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

