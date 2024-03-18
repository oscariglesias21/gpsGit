import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:lottie/lottie.dart';
import 'package:permission_handler/permission_handler.dart';
import 'dart:async';

void main() {
  runApp(MyApp());
}
class MyApp extends StatefulWidget {
  @override
  _MyAppState createState() => _MyAppState();
}
//----------------------------------------------------------------------------DEFINICIÓN DE VARIABLES IMPORTANTES-------------------------------------------------------------
class _MyAppState extends State<MyApp> {
  String _location = 'Desconocido';
  Timer? _timer; // Variable para almacenar el temporizador
  bool _isTracking = false;
  @override
  void initState() {
    super.initState();
    _updateLocationAndTime(); //se llama a la función para actualizar en el estado de la app la ubicación y timestamp
  }
@override
void dispose() {
  _timer?.cancel();
  super.dispose();
}
//--------------------------------------------------------------------------FUNCIÓN UBICACIÓN Y TIMESTAMP------------------------------------------------------------
  Future<void> _updateLocationAndTime() async {
    var locationStatus = await Permission.location.status; //permiso de ubicación
   
    if (locationStatus.isDenied) {
      await Permission.location.request(); //request si se niega el servicio
    }

    if (locationStatus.isGranted) {
      Position position = await Geolocator.getCurrentPosition();
      setState(() {
        _location =
            "Latitud:${position.latitude}, Longitud:${position.longitude}, Timestamp:${position.timestamp.toLocal().toString()}"; //actualización de estado / hora local
      });
    } else {
      setState(() {
        _location = 'Permiso de ubicación denegado';
      });
    }
  }
//VALIDACIÓN DE IP
  bool isValidIP(String ipAddress) {
    try {
      InternetAddress(ipAddress);
      return true;
    } catch (e) {
      return false;
    }
  }
//-------------------------------------------------------------FUNCIÓN DE ENVÍO UDP-------------------------------------------------------------------------------------------
Future<void> sendUDP(double latitude, double longitude, String timestamp) async {
  try {
    // Habilitar interfaz ipv4 
    final udpSocket = await RawDatagramSocket.bind(InternetAddress.anyIPv4, 0);
    
    String message = "Latitud:$latitude,Longitud:$longitude,Timestamp:$timestamp";
    List<int> data = utf8.encode(message); // codificar el mensaje en bytes
    
    // Lista de direcciones IP y puertos a los que enviar
    List<Map<String, dynamic>> destinations = [
      {'ip': '52.201.18.119', 'port': 20000},
      {'ip': '54.211.70.225', 'port': 20000},
    ];
    
    // Envío de datos a cada dirección IP y puerto
    for (var destination in destinations) {
      udpSocket.send(
        data, 
        InternetAddress(destination['ip']), 
        destination['port']
      );
      print('Datos enviados a ${destination['ip']}:${destination['port']}');
    }
    
    udpSocket.close(); // Cerrar el socket
  } catch (e) {
    print("Error de envío: $e");
  }
}
//---------------------------------------------------------------------FUNCIÓN ENVÍO DE DATOS---------------------------------------------------------------------
void sendData() {
    if (_timer != null) {
    _timer!.cancel();
  }
  _timer = Timer.periodic(Duration(seconds: 5), (timer) {
  Geolocator.getCurrentPosition().then((position) {
    // Llamado de UDP
    sendUDP(position.latitude, position.longitude, position.timestamp.toLocal().toString());
      });
    });
  }
//------------------------------------------------------------------Función para finalizar rastreo--------------------------------------------------------------------------------
void stopTracking() {
  if (_timer != null && _timer!.isActive) {
    _timer!.cancel(); // Cancela el temporizador si está activo
  }
  setState(() {
    _isTracking = false; // Actualiza el estado para reflejar que el rastreo ha sido detenido
  });
}
//------------------------------------------------------------------------FRONTEND Y LLAMADO DE FUNCIONES.--------------------------------------------------------
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(
          title: const Center(child: Text("GPS")),
        ),
        body: Center(
          child: Container(
            padding: EdgeInsets.all(16),
            margin: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.5),
                  spreadRadius: 2,
                  blurRadius: 5,
                  offset: Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                Lottie.asset('assets/animatedglobo.json'),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    ElevatedButton(
                      onPressed: sendData,
                      child: Text('Iniciar Ruta'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                      ),
                    ),
                     ElevatedButton(
                      onPressed: stopTracking,
                      child: Text('Finalizar Ruta'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                      ),
                     ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  _location,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 11),
                ),
              ],
            ),
          ),
        ),
        backgroundColor: Colors.lightGreen[100],
      ),
    );
  }
}