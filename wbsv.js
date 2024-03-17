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
  dbConnection.query('SELECT * FROM p2GPS', (err, results) => {
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


function generateDatabasePage(data) {
  let htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Database Page</title>
    </head>
    <body>
      <h1>Database Content</h1>
      <table border="1">
        <tr>
          <th>Latitude</th>
          <th>Longitude</th>
          <th>Date</th>
          <th>Time</th>
        </tr>`;
        data.forEach((record) => {
          htmlContent += `
              <tr>
                <td>${record.Latitude}</td>
                <td>${record.Longitude}</td>
                <td>${record.Date}</td>
                <td>${record.Time}</td>
              </tr>`;
        });
        htmlContent += `
            </table>
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

server.listen(port, () => {
  console.log(`Servidor HTTP en ejecución en http://44.215.206.176:${port}/`);
});
          