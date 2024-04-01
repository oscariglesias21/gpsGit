import socket
import requests
from datetime import datetime

# Configuración del socket
UDP_IP = "0.0.0.0"  # Escuchar en todas las interfaces
UDP_PORT = 20000

# Configuración del servidor web
web_server_url = "http://52.201.18.119:80/updateFromSniffer"
web_server_url1 = "http://54.211.70.225:80/updateFromSniffer"
web_server_url2 = "http://3.82.103.211:80/updateFromSniffer"

def extract_gps_info(data):
    # Simula la extracción de los datos GPS del payload
    # Asegúrate de adaptar esta parte al formato específico de tus datos
    decoded_data = data.decode('utf-8','replace').strip().split(',')    
    latitud_str, longitud_str, timestamp_str = decoded_data

    latitud = float(latitud_str.split(":")[1])
    longitud = float(longitud_str.split(":")[1])

    timestamp_str = timestamp_str.replace("Timestamp:", "").strip()
    datetime_obj = datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S.%f")
    fecha = datetime_obj.strftime("%Y-%m-%d") 
    hora = datetime_obj.strftime("%H:%M:%S")  # Formato de hora a HH:MM:SS
    

    return {
        "Latitude": latitud,
        "Longitude": longitud,
        "Date": fecha,  # Fecha ya formateada
        "Time": hora    # Hora ya formateada
    }

def send_to_web_server(web_data):
    try:
        # Iterar sobre las URLs del servidor web
        for url in [web_server_url, web_server_url1, web_server_url2]:
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
    # Extraer y enviar los datos GPS
    gps_data = extract_gps_info(data)
    send_to_web_server(gps_data)
