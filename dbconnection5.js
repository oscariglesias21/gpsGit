const http = require('http');
const fs = require('fs');
const socketIo = require('socket.io');
const mysql = require('mysql2');
const express = require('express');


const app = express();
app.use(express.json()); // Middleware para analizar JSON en las solicitudes

// Database connection 
const dbConnection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Osqui61832513',
  database: 'p1final'
});

const host = '127.0.0.1';
const port = 3000;

// Crear conexión a la base de datos
dbConnection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    process.exit(1);
  }
  console.log('Conexión a la base de datos establecida correctamente');
});

// Ruta para manejar las solicitudes POST del sniffer
app.post('/updateFromSniffer', (req, res) => {
  const { Latitude, Longitude, Date, Time } = req.body;
  // Inserta los datos en la base de datos si es necesario
  const insertQuery = 'INSERT INTO tabladatos (Latitude, Longitude, Date, Time) VALUES (?, ?, ?, ?)';
  const insertValues = [Latitude, Longitude, Date, Time];

  dbConnection.query(insertQuery, insertValues, (err, results) => {
    if (err) {
      console.error('Error al insertar datos en la base de datos:', err);
      return res.status(500).send('Internal Server Error');
    }

    // Envía la actualización a los clientes conectados a través de Socket.IO
    io.emit('locationUpdate', { Latitude, Longitude, Date, Time });

    res.status(200).send('OK');
  });
});

// Servir el archivo HTML estático
app.get('/', (req, res) => {
  fs.readFile('index.html', (error, data) => {
    if (error) {
      res.writeHead(404);
      res.write('Error: File not found');
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(data);
    }
    res.end();
  });
});
app.get('/database', (req, res) => {
  // 
  dbConnection.query('SELECT * FROM tabladatos', (err, results) => {
    if (err) {
      console.error('Error al consultar la base de datos:', err);
      return res.status(500).send('Internal Server Error');
    }

    // Actualizar campos de frontend inicial con los datos requeridos
    const htmlContent = generateDatabasePage(results);

    // Envíar de manera dinámica los datos HTML
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(htmlContent);
    res.end();
  });
});

// Función para contenido HTML en la base de datos (frontend) 
function generateDatabasePage(data) {
  let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Base de Datos</title>
    </head>
    <body>
      <h1>Base de Datos</h1>
      <table border="1">
        <tr>
          <th>Latitud</th>
          <th>Longitud</th>
          <th>Fecha</th>
          <th>Hora</th>
        </tr>`;

  // Iteración de base de datos para agregar filas
  data.forEach((record) => {
    htmlContent += `
        <tr>
          <td>${record.Latitude}</td>
          <td>${record.Longitude}</td>
          <td>${record.Date}</td>
          <td>${record.Time}</td>
        </tr>`;
  });

  // Cerrar html
  htmlContent += `
      </table>
    </body>
    </html>`;

  return htmlContent;
}

const server = http.createServer(app);
const io = socketIo(server);

// Maneja la conexión de un nuevo cliente
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');
  // Envía el último dato al nuevo cliente
  sendLatestDataToClients();
});

// Escucha eventos de cambios en la base de datos
dbConnection.on('change', (event, table, id) => {
  // Si hay un cambio, envía el último dato a todos los clientes
  sendLatestDataToClients();
});

// Consulta el último dato en la base de datos y lo envía a todos los clientes
function sendLatestDataToClients() {
  dbConnection.query('SELECT * FROM tabladatos ORDER BY ID DESC LIMIT 1', (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      const latestLocation = {
        Latitude: results[0].Latitude,
        Longitude: results[0].Longitude,
        Date: results[0].Date,
        Time: results[0].Time
      };
      // Envía los valores a todos los clientes
      io.emit('locationUpdate', latestLocation);
    }
  });
}

server.listen(port, host, () => {
  console.log(`Servidor HTTP en ejecución en http://${host}:${port}/`);
});