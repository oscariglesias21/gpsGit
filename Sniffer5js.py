from scapy.all import *
from datetime import datetime
import mysql.connector
import requests

# Configuración de la conexión a MySQL
db_config = {
    "host": "localhost",
    "user": "root",
    "password": "Osqui61832513",
    "database": "p1final"
}

# Crear conexión a la base de datos
connection = mysql.connector.connect(**db_config)
cursor = connection.cursor()

# Configuración del servidor web
web_server_url = "http://127.0.0.1:3000/updateFromSniffer"  # Ajusta la URL según la configuración de tu servidor web

def extract_gps_info(payload):
    # Supongamos que los datos están en el formato "Latitud:11.0194324,Longitud:-74.8515451,Timestamp:2024-02-14 12:44:54.573851"
    gps_data = payload.decode('utf-8', 'replace').strip().split(',')

    if len(gps_data) == 3:
        latitud_str, longitud_str, timestamp_str = gps_data

        # Extraer los valores de latitud, longitud y timestamp
        latitud = float(latitud_str.split(":")[1])
        longitud = float(longitud_str.split(":")[1])
        timestamp_str = timestamp_str.replace("Timestamp:", "").strip()

        try:
            # Convertir el timestamp a objeto datetime
            datetime_obj = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S.%f")

            # Extraer fecha y hora
            fecha = datetime_obj.date()
            hora = datetime_obj.time()

            print("Latitud:", latitud)
            print("Longitud:", longitud)
            print("Fecha:", fecha)
            print("Hora:", hora)

            # Enviar datos al servidor web
            web_data = {
                "Latitude": latitud,
                "Longitude": longitud,
                "Date": str(fecha),
                "Time": str(hora)
            }
            requests.post(web_server_url, json=web_data)

        except ValueError:
            print("Formato de timestamp no válido:", timestamp_str)

    else:
        print("Formato de datos GPS no reconocido:", payload)

def packet_callback(packet):
    if IP in packet and UDP in packet:
        src_ip = packet[IP].src
        dst_ip = packet[IP].dst
        src_port = packet[UDP].sport
        dst_port = packet[UDP].dport

        payload = packet[Raw].load if Raw in packet else b""  # Obtener carga útil (payload)

        print(f"Packet captured - Source: {src_ip}:{src_port}, Destination: {dst_ip}:{dst_port}")
        print("Payload:", payload)

        extract_gps_info(payload)

# Filtrar por dirección IP y puerto específicos para UDP
sniff(filter="udp and host 192.168.1.170 and port 10000", prn=packet_callback, store=0)
