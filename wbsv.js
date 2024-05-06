const http = require('http');
const fs = require('fs');
const socketIo = require('socket.io');
const mysql = require('mysql2');
const express = require('express');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '/home/ubuntu/.env') });

const app = express();
app.use(express.static(path.join(__dirname, 'javascripts')));
app.use(express.static(path.join(__dirname, 'assets')));
app.use(express.static(path.join(__dirname, 'styles')));
app.use(express.json()); 

const dbConnection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
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
  const { Latitude, Longitude, Date, Time, RPM } = req.body;

  if (!Latitude || !Longitude || !Date || !Time || RPM == null) {
    return res.status(400).send('Bad Request: Missing fields');
  }

  console.log(`Received data - Fecha: ${Date}, Hora: ${Time}, Latitud: ${Latitude}, Longitud: ${Longitude}, RPM: ${RPM}`);
  const insertQuery = 'INSERT INTO p2GPS2 (Latitude, Longitude, Date, Time, RPM) VALUES (?, ?, ?, ?, ?)';
  const insertValues = [Latitude, Longitude, Date, Time, RPM];
  dbConnection.query(insertQuery, insertValues, (err, results) => {
    if (err) {
      console.error('Error al insertar datos en la base de datos:', err);
      return res.status(500).send('Internal Server Error');
    }
    // Envía la actualización a clientes conectados a través de Socket.IO
    io.emit('locationUpdate', { Latitude, Longitude, Date, Time, RPM });
    res.status(200).send('OK');
  });
});

app.post('/FromSniffer', (req, res) => {
  const { Latitude, Longitude, Date, Time, RPM } = req.body;
  console.log(`Direct update - Fecha: ${Date}, Hora: ${Time}, Latitud: ${Latitude}, Longitud: ${Longitude}, RPM: ${RPM}`);
  io.emit('locationUpdate', { Latitude, Longitude, Date, Time, RPM});
  res.status(200).send('OK');
});

// Servir el archivo HTML index
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
  fs.readFile('database.html', (error, results) => {
    if (error) {
      res.writeHead(404);
      res.write('Error: File not found');
    } else {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.write(results);
    }
    res.end();
  });
});

app.get('/database-datos', (req, res) => {
  // Agregando RPM al SELECT
  dbConnection.query('SELECT Latitude, Longitude, Date, Time, RPM FROM p2GPS2 ORDER BY ID DESC', (err, results) => {
    if (err) {
      console.error('Error al consultar la base de datos:', err);
      return res.status(500).send('Internal Server Error');
    }
    // Envío de los resultados de la consulta como respuesta JSON
    console.log('La informacion se ha enviado correctamente');
    res.setHeader('Content-Type', 'application/json');
    res.json(results);
  });
});

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
      dbConnection.query('SELECT * FROM p2GPS2 ORDER BY ID DESC LIMIT 1', (err, results) => {
        if (err) throw err;
  if (results.length > 0) {
    const latestLocation = {
      Latitude: results[0].Latitude,
      Longitude: results[0].Longitude,
      Date: results[0].Date,
      Time: results[0].Time,
    };
    io.emit('locationUpdate', latestLocation);
  }
});
}
// Ruta de consulta
app.get('/consulta', (req, res) => {
  fs.readFile('consulta.html', (error, data) => {
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

app.get('/consulta-historicos', (req, res) => {
  const { startDateTime, endDateTime } = req.query;
  const startParts = startDateTime.split('T');
  const endParts = endDateTime.split('T');
  const startDate = startParts[0];
  const startTime = startParts[1];
  const endDate = endParts[0];
  const endTime = endParts[1];

  const query = `
      SELECT Latitude, Longitude, CONCAT(Date, ' ', Time) AS DateTime, RPM
      FROM p2GPS2
      WHERE (Date > ? OR (Date = ? AND Time >= ?))
        AND (Date < ? OR (Date = ? AND Time <= ?))`;

  dbConnection.query(query, [startDate, startDate, startTime, endDate, endDate, endTime], (error, results) => {
      if (error) {
          console.error('Error en consulta:', error);
          res.status(500).send('Server Error');
          return;
      }
      res.json(results);
  });
});



server.listen(port, () => {
  console.log(`Servidor HTTP en ejecución`);
});