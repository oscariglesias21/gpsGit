const http = require('http');
const fs = require('fs');
const socketIo = require('socket.io');
const mysql = require('mysql2');
const express = require('express');


const app = express();
app.use(express.json()); 

const dbConnection = mysql.createConnection({
  host: 'dbgps.cj42w80qu3u7.us-east-1.rds.amazonaws.com',
  user: 'oscariglesias_21',
  password: 'Osqui61832513',
  database: 'p2db'
});
const port = 80;
dbConnection.connect((err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    process.exit(1);
  }
  console.log('Conexión a la base de datos establecida correctamente');
});

app.post('/updateFromSniffer', (req, res) => {
  const { Latitude, Longitude, Date, Time } = req.body;
  const insertQuery = 'INSERT INTO p2GPS (Latitude, Longitude, Date, Time) VALUES (?, ?, ?, ?)';
  const insertValues = [Latitude, Longitude, Date, Time];
  dbConnection.query(insertQuery, insertValues, (err, results) => {
    if (err) {
      console.error('Error al insertar datos en la base de datos:', err);
      return res.status(500).send('Internal Server Error');
    }
    // Envía la actualización a clientes conectados a través de Socket.IO
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
  dbConnection.query('SELECT * FROM p2GPS ORDER BY ID ASC', (err, results) => {
    if (err) {
      console.error('Error al consultar la base de datos:', err);
      return res.status(500).send('Internal Server Error');
    }
    const htmlContent = generateDatabasePage(results);

    // Envío dinámico a HTML client
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(htmlContent);
    res.end();
  });
});

// Ruta de consulta
app.get('/consulta', (req, res) => {
  res.send('Consulta de Históricos');
});

function generateDatabasePage(data) {
  let htmlContent = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tabla de Base de Datos</title>
      <style>
        /* Estilos generales */
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 1200px;
            margin: 20px auto;
            padding: 0 20px;
        }
        /* Estilos de la tabla */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
            border: 1px solid black; /* Borde negro */
        }
        /* Colores por columna */
        th:nth-child(1) {
            background-color: #496989; /* Longitud */
        }
        th:nth-child(2) {
            background-color: #58A399; /* Latitud */
        }
        th:nth-child(3) {
            background-color: #496989; /* Fecha */
        }
        th:nth-child(4) {
            background-color: #58A399; /* Hora */
        }
        /* Cambiar color al pasar el mouse */
        tbody tr:hover {
            background-color: #d9d9d9;
        }
        /* Estilos responsivos */
        @media screen and (max-width: 600px) {
            table {
                overflow-x: auto;
            }
            table, thead, tbody, th, td, tr {
                display: block;
            }
            thead tr {
                position: absolute;
                top: -9999px;
                left: -9999px;
            }
            tr {
                border: 1px solid #ccc;
            }
            td {
                border: none;
                border-bottom: 1px solid #eee;
                position: relative;
                padding-left: 50%;
            }
            td:before {
                position: absolute;
                top: 6px;
                left: 6px;
                width: 45%;
                padding-right: 10px;
                white-space: nowrap;
            }
            td:nth-of-type(1):before { content: "Longitud:"; }
            td:nth-of-type(2):before { content: "Latitud:"; }
            td:nth-of-type(3):before { content: "Fecha:"; }
            td:nth-of-type(4):before { content: "Hora:"; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Tabla de Base de Datos</h2>
        <table>
          <thead>
            <tr>
              <th>Longitud</th>
              <th>Latitud</th>
              <th>Fecha</th>
              <th>Hora</th>
            </tr>
          </thead>
          <tbody>`;

  data.forEach((record) => {
    htmlContent += `
            <tr>
              <td>${record.Longitude}</td>
              <td>${record.Latitude}</td>
              <td>${record.Date}</td>
              <td>${record.Time}</td>
            </tr>`;
  });

  htmlContent += `
          </tbody>
        </table>
      </div>
    </body>
    </html>`;

  return htmlContent;
}

    const server = http.createServer(app);
    const io = socketIo(server);
    
    io.on('connection', (socket) => {
      console.log('Nuevo cliente conectado');
      sendLatestDataToClients();
    });
    
    dbConnection.on('change', (event, table, id) => {
      sendLatestDataToClients();
    });
    // Consulta el último dato en la base de datos y lo envía a todos los clientes
    function sendLatestDataToClients() {
      dbConnection.query('SELECT * FROM p2GPS ORDER BY ID DESC LIMIT 1', (err, results) => {
        if (err) throw err;
  if (results.length > 0) {
    const latestLocation = {
      Latitude: results[0].Latitude,
      Longitude: results[0].Longitude,
      Date: results[0].Date,
      Time: results[0].Time
    };
    io.emit('locationUpdate', latestLocation);
  }
});
}