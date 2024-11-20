import socket
import requests
from datetime import datetime

# Configuración del socket
UDP_IP = "0.0.0.0"  # Escuchar en todas las interfaces
UDP_PORT = 20000

# Configuración del servidor web
web_server_url = "http://52.201.18.119:80/updateFromSniffer"

def extract_gps_info(data):
    decoded_data = data.decode('utf-8','replace').strip().split(',')
    id_str, latitud_str, longitud_str, timestamp_str, *optional = decoded_data
    id = id_str.split(":")[1].strip()
    latitud = float(latitud_str.split(":")[1].strip())
    longitud = float(longitud_str.split(":")[1].strip())
    timestamp_str = timestamp_str.replace("Timestamp:", "").strip()
    datetime_obj = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S.%f")
    fecha = datetime_obj.strftime("%Y-%m-%d")
    hora = datetime_obj.strftime("%H:%M:%S")

    gps_info = {
        "Id": id,
        "Latitude": latitud,
        "Longitude": longitud,
        "Date": fecha,
        "Time": hora
    }

    if optional and optional[0]:
        rpm_str = optional[0].strip()
        if ":" in rpm_str:
            rpm = int(rpm_str.split(":")[1])
            gps_info["RPM"] = rpm

    return gps_info

def send_to_web_server(web_data):
    try:
        # Iterar sobre las URLs del servidor web
        for url in [web_server_url]:
            response = requests.post(url, json=web_data)
            print(f"Datos enviados a {url}. Respuesta: {response.status_code}")
    except Exception as e:
        print(f"Error al enviar datos al servidor web: {e}")

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.bind((UDP_IP, UDP_PORT))
print(f"Escuchando en UDP {UDP_IP}:{UDP_PORT}")

while True:
    data, addr = sock.recvfrom(1024) 
    print(f"Recibido mensaje: {data} de {addr}")
    gps_data = extract_gps_info(data)
    send_to_web_server(gps_data)
