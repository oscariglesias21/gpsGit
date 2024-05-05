// Función para actualizar los valores de los contenedores de datos para un vehículo específico
function updateVehicleData(vehicleElements, data) {
    vehicleElements.latitude.innerText = data.Latitude;
    vehicleElements.longitude.innerText = data.Longitude;
    vehicleElements.date.innerText = data.Date;
    vehicleElements.time.innerText = data.Time;
    vehicleElements.rpm.innerText = data.RPM;
}
// Define las variables para los elementos de los vehículos
const vehicle1Elements = {
    latitude: document.getElementById('latitude'),
    longitude: document.getElementById('longitude'),
    date: document.getElementById('date'),
    time: document.getElementById('time'),
    rpm: document.getElementById('RPM')
};

const vehicle2Elements = {
    latitude: document.getElementById('latitude1'),
    longitude: document.getElementById('longitude1'),
    date: document.getElementById('date1'),
    time: document.getElementById('time1'),
    rpm: document.getElementById('RPM1')
};


function navigate(value) {
    if (value === "item1") {
            console.log("Has seleccionado el Vehículo 1");
            document.addEventListener('DOMContentLoaded', () => {
                const myMap = L.map('mapid').setView([11.02115114, -74.84057200], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(myMap);
        
                let marker = L.marker([0, 0]).addTo(myMap);
                let routePath = L.polyline([], {color: 'red'}).addTo(myMap); // Crea una polilínea vacía con el color rojo
                let lastMarkerPosition = null;
        
                let inactivityTimer;
                let centrarMapa = null;
        
                // Intentar recuperar y dibujar la ruta almacenada
                const storedRoute = localStorage.getItem('routePath');
                if (storedRoute) {
                    const routePoints = JSON.parse(storedRoute);
                    routePath.setLatLngs(routePoints.map(p => L.latLng(p.lat, p.lng)));
                }
        
                const socket = io();
                console.log('Conexión a Socket.IO establecida correctamente.');
        
                socket.on('locationUpdate', (data) => {
                console.log(data);
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
                    console.log("Updating RPM:", data.RPM);
                    document.getElementById('RPM').innerText = data.RPM;
        
                    if (dateElement) {
                        const dateString = dateElement.textContent || dateElement.innerText;
                        const formattedDate = dateString.split('T')[0]; // Extrae solo la parte de la fecha
                        dateElement.textContent = formattedDate; // Establece el texto con la fecha formateada
                    }
                    const newLatLng = new L.LatLng(data.Latitude, data.Longitude);
                    centrarMapa = newLatLng;
                
                if (lastMarkerPosition && lastMarkerPosition.distanceTo(newLatLng) > 400) {
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
        updateVehicleData(vehicle1Elements, data1);
    } else if (value === "item2") {
            console.log("Has seleccionado el Vehículo 2");
            document.addEventListener('DOMContentLoaded', () => {
                const myMap = L.map('mapid').setView([11.02115114, -74.84057200], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(myMap);
        
                let marker = L.marker([0, 0]).addTo(myMap);
                let routePath = L.polyline([], {color: 'red'}).addTo(myMap); // Crea una polilínea vacía con el color rojo
                let lastMarkerPosition = null;
        
                let inactivityTimer;
                let centrarMapa = null;
        
                // Intentar recuperar y dibujar la ruta almacenada
                const storedRoute = localStorage.getItem('routePath');
                if (storedRoute) {
                    const routePoints = JSON.parse(storedRoute);
                    routePath.setLatLngs(routePoints.map(p => L.latLng(p.lat, p.lng)));
                }
        
                const socket = io();
                console.log('Conexión a Socket.IO establecida correctamente.');
        
                socket.on('locationUpdate1', (data) => {
                console.log(data);
                clearTimeout(inactivityTimer);
                    inactivityTimer = setTimeout(() => {
                        routePath.setLatLngs([]); // Borra la línea si no se han recibido datos durante 1 minuto
                        localStorage.removeItem('routePath'); // Opcional: Limpia la ruta almacenada
                        console.log('La ruta ha sido borrada debido a la inactividad.');
                    }, 20000); // 20000 milisegundos = 20 segundos
        
                    const dateElement = document.getElementById('date');
        
                    document.getElementById('latitude1').innerText = data.Latitude;
                    document.getElementById('longitude1').innerText = data.Longitude;
                    document.getElementById('date1').innerText = data.Date;
                    document.getElementById('time1').innerText = data.Time;
                    console.log("Updating RPM:", data.RPM);
                    document.getElementById('RPM1').innerText = data.RPM;
        
                    if (dateElement) {
                        const dateString = dateElement.textContent || dateElement.innerText;
                        const formattedDate = dateString.split('T')[0]; // Extrae solo la parte de la fecha
                        dateElement.textContent = formattedDate; // Establece el texto con la fecha formateada
                    }
                    const newLatLng = new L.LatLng(data.Latitude, data.Longitude);
                    centrarMapa = newLatLng;
                
                if (lastMarkerPosition && lastMarkerPosition.distanceTo(newLatLng) > 400) {
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
        updateVehicleData(vehicle2Elements, data2);
    } else if (value === "item3") {
        console.log("Has seleccionado ambos vehículos");
        document.addEventListener('DOMContentLoaded', () => {
                const myMap = L.map('mapid').setView([11.02115114, -74.84057200], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(myMap);
                let marker = L.marker([0, 0]).addTo(myMap);
                let routePath = L.polyline([], {color: 'red'}).addTo(myMap); // Crea una polilínea vacía con el color rojo
                let lastMarkerPosition = null;
                let inactivityTimer;
                let centrarMapa = null;
                // Intentar recuperar y dibujar la ruta almacenada
                const storedRoute = localStorage.getItem('routePath');
                if (storedRoute) {
                    const routePoints = JSON.parse(storedRoute);
                    routePath.setLatLngs(routePoints.map(p => L.latLng(p.lat, p.lng)));
                }
                const socket = io();
                console.log('Conexión a Socket.IO establecida correctamente.');
                socket.on('locationUpdate', (data) => {
                console.log(data);
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
                    console.log("Updating RPM:", data.RPM);
                    document.getElementById('RPM').innerText = data.RPM;
                    if (dateElement) {
                        const dateString = dateElement.textContent || dateElement.innerText;
                        const formattedDate = dateString.split('T')[0]; // Extrae solo la parte de la fecha
                        dateElement.textContent = formattedDate; // Establece el texto con la fecha formateada
                    }
                    const newLatLng = new L.LatLng(data.Latitude, data.Longitude);
                    centrarMapa = newLatLng;
                
                if (lastMarkerPosition && lastMarkerPosition.distanceTo(newLatLng) > 400) {
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
                
                ///////////////////////////////SEGUNDO VEHÍCULO/////////////////////////////////////////////////
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(myMap);
        
                let marker1 = L.marker([0, 0]).addTo(myMap);
                let routePath1 = L.polyline([], {color: 'red'}).addTo(myMap); // Crea una polilínea vacía con el color rojo
                let lastMarkerPosition1 = null;
        
                let inactivityTimer1;
                let centrarMapa1 = null;
        
                // Intentar recuperar y dibujar la ruta almacenada
                const storedRoute1 = localStorage.getItem('routePath1');
                if (storedRoute1) {
                    const routePoints1 = JSON.parse(storedRoute);
                    routePath1.setLatLngs(routePoints1.map(p => L.latLng(p.lat, p.lng)));
                }
                socket.on('locationUpdate1', (data) => {
                console.log(data);
                clearTimeout(inactivityTimer1);
                    inactivityTimer1 = setTimeout(() => {
                        routePath1.setLatLngs([]); // Borra la línea si no se han recibido datos durante 1 minuto
                        localStorage.removeItem('routePath1'); // Opcional: Limpia la ruta almacenada
                        console.log('La ruta ha sido borrada debido a la inactividad.');
                    }, 20000); // 20000 milisegundos = 20 segundos
                    const dateElement1 = document.getElementById('date');
                    document.getElementById('latitude1').innerText = data.Latitude;
                    document.getElementById('longitude1').innerText = data.Longitude;
                    document.getElementById('date1').innerText = data.Date;
                    document.getElementById('time1').innerText = data.Time;
                    console.log("Updating RPM:", data.RPM);
                    document.getElementById('RPM1').innerText = data.RPM;
        
                    if (dateElement1) {
                        const dateString1 = dateElement1.textContent || dateElement.innerText;
                        const formattedDate1 = dateString1.split('T')[0]; // Extrae solo la parte de la fecha
                        dateElement.textContent = formattedDate1; // Establece el texto con la fecha formateada
                    }
                    const newLatLng1 = new L.LatLng(data.Latitude, data.Longitude);
                    centrarMapa1 = newLatLng1;
                if (lastMarkerPosition1 && lastMarkerPosition1.distanceTo(newLatLng) > 400) {
                    // Si el marcador se ha movido más de 400 metros, reinicia la polilínea
                    routePath.setLatLngs([]);
                    localStorage1.removeItem('routePath1'); // Limpia la ruta almacenada si es necesario
                }
                    myMap.setView(newLatLng);
                    marker1.setLatLng(newLatLng);
                    routePath1.addLatLng(newLatLng); // Añade el nuevo punto a la polilínea para trazar el recorrido
                    lastMarkerPosition1 = newLatLng1;
                });
                document.getElementById('centrarMapaBtn').addEventListener('click', () => {
                    if (centrarMapa1) {
                        myMap.setView(centrarMapa1); // Centra el mapa en la última ubicación conocida
                    } else {
                        alert('Ubicación no disponible.'); // O maneja este caso como prefieras
                    }
                    // Guardar la ruta actual en el almacenamiento local
                    const currentRoute1 = routePath1.getLatLngs();
                        localStorage1.setItem('routePath1', JSON.stringify(currentRoute1.map(p => ({ lat: p.lat, lng: p.lng }))));
                });
        });
        updateVehicleData(vehicle1Elements, data1);
        updateVehicleData(vehicle2Elements, data2);
    }
}