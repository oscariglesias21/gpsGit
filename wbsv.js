const http = require('http');
const fs = require('fs');
const socketIo = require('socket.io');
const mysql = require('mysql2');
const express = require('express');

const app = express();
app.use(express.json()); 

const dbConnection = mysql.createConnection({
  host: process.env.DB_SECRET_HOST,
  user: process.env.DB_SECRET_USER,
  password: process.env.DB_SECRET_PASSWORD,
  database: process.env.DB_SECRET_DATABASE
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
  dbConnection.query('SELECT Latitude, Longitude, Date, Time FROM p2GPS ORDER BY ID DESC', (err, results) => {
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
  const { startDate, startTime, endDate, endTime } = req.query;
  const query = `
      SELECT Latitude, Longitude
      FROM p2GPS
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
          