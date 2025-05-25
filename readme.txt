Эмуляция видеостриминга с дрона (RTSP + Архивация через Flask)

Данная часть проекта эмулирует поведение дрона, который передаёт видеопоток в реальном времени через RTSP, а также параллельно отправляет 10-секундные фрагменты видео на сервер для архивации и последующего просмотра.

Реализованные функции:
-Живой RTSP-поток через FFmpeg
- RTSP-сервер на базе MediaMTX (ex rtsp-simple-server)
-Зацикленное воспроизведение sample.mp4
-Просмотр live-потока через VLC
-Автоматическая нарезка видео на фрагменты (по 10 сек)
-Отправка фрагментов на Flask-сервер
-Доступ к архиву фрагментов через Nginx

Структура проекта:
├── sample.mp4                  # Видео с дрона (или эмуляция)
├── mediamtx                    # RTSP-сервер (скачан вручную)
├── realtime_uploader.sh        # Скрипт автоматической отправки фрагментов
├── dji_dronestream_emulator_project/
│   ├── api_server/
│   │   └── server.py           # Flask-сервер /upload
│   └── uploaded_segments/      # Сюда сохраняются .mp4-фрагменты
└── nginx (установлен через brew)


Запуск:


1. Установка зависимостей
FFmpeg:

brew install ffmpeg

MediaMTX (RTSP-сервер):
Скачать с: https://github.com/bluenviron/mediamtx/releases
Распаковать:

tar -xvzf mediamtx_v*.tar.gz

Flask:

pip install flask

Nginx:

brew install nginx


2. Запуск RTSP-сервера

Открываем 1 терминал:

cd ~/Downloads
./mediamtx

Вывод:

[RTSP] listener opened on :8554


3. Запуск FFmpeg стрима

Открываем 2 терминал:

cd ~/Downloads/dji_dronestream_emulator_project/stream_source
ffmpeg -re -stream_loop -1 -i sample.mp4 -c copy -f rtsp rtsp://localhost:8554/mystream

видео будет зациклено и передаваться по RTSP


4. Просмотр потока в VLC
 1.Открываем VLC
 2.Файл -> Открыть сетевой поток
 3.Вставить керек:

rtsp://localhost:8554/mystream

Автоматическая отправка фрагментов:

Открываем 3 терминал:

cd ~/Downloads
chmod +x realtime_uploader.sh
./realtime_uploader.sh

Скрипт будет:
каждые 10 секунд записывать видеофайл
отправлять его на Flask-сервер
удалять его локально после отправки


Flask-сервер для загрузки:

server.py:

from flask import Flask, request
import os

app = Flask(__name__)
UPLOAD_FOLDER = "uploaded_segments"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['file']
    if file:
        file.save(os.path.join(UPLOAD_FOLDER, file.filename))
        return f"Saved {file.filename}\\n", 200
    return "No file\\n", 400

app.run(host="0.0.0.0", port=5050)

Запуск:

cd dji_dronestream_emulator_project/api_server
python server.py


Веб-доступ к архиву через Nginx
 1.ОТкроем конфигурацию nginx:

sudo nano /usr/local/nginx/conf/nginx.conf

 2.Добавляем внутрь server { … }:

location /uploaded_segments/ {
    root html;
    autoindex on;
}

 3.Перезапускаем nginx:

sudo /usr/local/nginx/sbin/nginx -s reload

 4. Переходим  в браузере:

http://localhost:8080/uploaded_segments/

ВСЕ теперь нам предоставлены фрагменты .mp4, готовые к просмотру


Результат:
Эмуляция дрона через sample.mp4
RTSP-трансляция live-потока
Просмотр потока в VLC
Автоматическая нарезка видео
Отправка на сервер и сохранение архива
Веб-интерфейс для просмотра фрагментов


Часть проекта для сбора и отправки телеметрических данных с беспилотного устройства (дрона) с помощью ESP32 и передачи их:
 • через LoRa (зашифрованно)
 • по Wi-Fi (открытые и зашифрованные данные)
на сервер, реализованный на Flask.

Архитектура

Устройство:
Микроконтроллер: ESP32 (модуль ESP-WROOM-32C)
Датчики:
NEO-6M GPS-модуль (UART)
BMP180 — температура и давление (I2C)
DHT22 — температура и влажность (digital pin)
Связь:
LoRa RA-02 — передача зашифрованных данных
Wi-Fi — передача открытых и зашифрованных данных на сервер
Шифрование: AES-128 ECB (библиотека mbedtls, встроенная в ESP32)
Кодировка: Base64

Структура данных

ESP32 формирует строку вида:

ID:9620691c,LAT:43.238949,LON:76.889709,ALT:847.3,SAT:7,T1:24.63,T2:25.42,Tavg:25.02,H:42.6,P:1012.3

Затем:
Шифрует строку с помощью AES-128 ECB
Кодирует результат в Base64
Передаёт зашифрованную строку по LoRa
Также отправляет:
POST /plain — открытые данные
POST /encrypted — зашифрованные данные (Base64)
на Flask-сервер по HTTP

Сервер Flask

Эндпоинты:
/ — основная страница HTML
/plain — приём открытых данных (POST)
/encrypted — приём зашифрованных данных (POST)

Интерфейс отображает:
Последнюю зашифрованную строку (Base64)
Последнюю открытую строку
Распарсенные значения: ID, GPS, температура, давление, влажность и т.д.
Время последнего обновления

Запуск

Устройство:
Код написан на C++ (Arduino framework)
Загружается через Arduino IDE или PlatformIO

Сервер:

pip install flask
python app.py

Открыть в браузере:
http://<ip-компьютера>:5000

Используемые библиотеки (ESP32)
TinyGPS++ — обработка GPS
Adafruit BMP085 — давление и температура
DHT — работа с датчиком DHT22
LoRa — передача по радиоканалу (RA-02)
WiFi.h и HTTPClient.h — подключение к сети и HTTP POST
mbedtls/aes.h — AES-128 ECB шифрование
base64.h — кодирование в Base64
