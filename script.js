

mapboxgl.accessToken = 'pk.eyJ1IjoidmFkaXNsYXdzIiwiYSI6ImNtYjFqdmRuMjB4MjYybXIwNWZrNHhqYXEifQ.ymvKw2wOVVot-GHrwlqfjA';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-streets-v12',
  center: [71.4704, 51.1605], // Астана
  zoom: 11
});

const mapStyles = [
  'mapbox://styles/mapbox/streets-v12',
  'mapbox://styles/mapbox/light-v11',
  'mapbox://styles/mapbox/satellite-streets-v12'
];


//form,profile
document.getElementById('profileBtn').addEventListener('click', () => {
    const user = localStorage.getItem('user');
    if (user) {
        window.location.href = 'profile/profile.html';
    } else {
      window.location.href = 'signup/signup.html';
    }
  });
  

// Обработка кнопки "Профиль"
document.getElementById('profileBtn').addEventListener('click', () => {
    const user = localStorage.getItem('user');
    if (user) {
      window.location.href = 'profile/profile.html';
    } else {
      window.location.href = 'signup/signup.html';
    }
  });
  
  // Проверка авторизации при загрузке страницы
  document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
      console.log('Добро пожаловать,', user.firstname);
      // Пример: можно динамически изменить надпись на кнопке "Профиль"
      document.getElementById('profileBtn').textContent = `${user.firstname}`;
    }
  });


  let lastUpdate = 0;
  const updateDelay = 5 * 1000; 
  
  
async function fetchWeather(lat, lon) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weather_code&timezone=auto`;
    const res = await fetch(url);
    const data = await res.json();

    document.getElementById('temperature').textContent = Math.round(data.current.temperature_2m);
    document.getElementById('wind').textContent = Math.round(data.current.wind_speed_10m);

    // Обновляем иконку погоды
    const code = data.current.weather_code;
    const icon = document.getElementById('weather-icon');
    let lucideName = 'sun';

    if ([0, 1].includes(code)) lucideName = 'sun';             // ясно
    else if ([2, 3].includes(code)) lucideName = 'cloud';      // облачно
    else if ([45, 48].includes(code)) lucideName = 'cloud-fog'; // туман
    else if (code >= 51 && code <= 67) lucideName = 'cloud-drizzle';
    else if (code >= 80 && code <= 82) lucideName = 'cloud-rain';
    else if (code >= 95 && code <= 99) lucideName = 'cloud-lightning';

    icon.setAttribute('data-lucide', lucideName);
    lucide.createIcons();
  } catch (err) {
    console.error("Ошибка при получении погоды:", err);
  }
}

async function updateWeatherIfNeeded() {
  const now = Date.now();
  if (now - lastUpdate >= updateDelay) {
    const center = map.getCenter();
    await fetchWeather(center.lat, center.lng);
    lastUpdate = now;
  }
}

map.on('moveend', updateWeatherIfNeeded);

map.on('load', () => {
  const center = map.getCenter();
  fetchWeather(center.lat, center.lng);
  lastUpdate = Date.now();
  loadNoFlyZones();
});

setInterval(updateWeatherIfNeeded, updateDelay);

map.on('load', () => {
  fetch('zonestest.geojson')
    .then(res => res.json())
    .then(originalData => {
      const polygonFeatures = [];
      const circleFeatures = [];

      for (const feature of originalData.features) {
        if (feature.geometry.type === 'Polygon') {
          polygonFeatures.push(feature);
        } else if (feature.geometry.type === 'Point' && feature.properties.radius_m) {
          // Создаём круг через turf.js
          const circle = turf.circle(feature.geometry.coordinates, feature.properties.radius_m / 1000, {
            steps: 64,
            units: 'kilometers',
            properties: feature.properties
          });
          circleFeatures.push(circle);
        }
      }

      const mergedFeatures = [...polygonFeatures, ...circleFeatures];
      const geojsonData = {
        type: 'FeatureCollection',
        features: mergedFeatures
      };

      map.addSource('no-fly-zones', {
        type: 'geojson',
        data: geojsonData
      });

      map.addLayer({
        id: 'no-fly-layer',
        type: 'fill',
        source: 'no-fly-zones',
        paint: {
          'fill-color': '#ff0000',
          'fill-opacity': 0.4
        }
      });

      map.addLayer({
        id: 'no-fly-outline',
        type: 'line',
        source: 'no-fly-zones',
        paint: {
          'line-color': '#ff0000',
          'line-width': 2
        }
      });

      // Попапы
      map.on('click', 'no-fly-layer', (e) => {
        const props = e.features[0].properties;

        const html = `
          <div style="font-family: Arial, sans-serif; font-size: 13px; line-height: 1.4; max-width: 220px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px;">🛑 Зона ${props.id}</div>
            <div><strong>Высота:</strong> ${props.altitude || "—"}</div>
            <div><strong>Ограничение:</strong> ${props.limit || "—"}</div>
            <div><strong>Статус:</strong> ${props.active || "—"}</div>
            ${props.radius_m ? `<div><strong>Радиус:</strong> ${props.radius_m / 1000} км</div>` : ""}
          </div>
        `;

        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(html)
          .addTo(map);
      });

      map.on('mouseenter', 'no-fly-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'no-fly-layer', () => {
        map.getCanvas().style.cursor = '';
      });
    });
});


function loadNoFlyZones() {
  fetch('zonestest.geojson')
    .then(res => res.json())
    .then(originalData => {
      const polygonFeatures = [];
      const circleFeatures = [];

      for (const feature of originalData.features) {
        if (feature.geometry.type === 'Polygon') {
          polygonFeatures.push(feature);
        } else if (feature.geometry.type === 'Point' && feature.properties.radius_m) {
          const circle = turf.circle(feature.geometry.coordinates, feature.properties.radius_m / 1000, {
            steps: 64,
            units: 'kilometers',
            properties: feature.properties
          });
          circleFeatures.push(circle);
        }
      }

      const mergedFeatures = [...polygonFeatures, ...circleFeatures];
      const geojsonData = {
        type: 'FeatureCollection',
        features: mergedFeatures
      };

      map.addSource('no-fly-zones', {
        type: 'geojson',
        data: geojsonData
      });

      map.addLayer({
        id: 'no-fly-layer',
        type: 'fill',
        source: 'no-fly-zones',
        paint: {
          'fill-color': '#ff0000',
          'fill-opacity': 0.4
        }
      });

      map.addLayer({
        id: 'no-fly-outline',
        type: 'line',
        source: 'no-fly-zones',
        paint: {
          'line-color': '#ff0000',
          'line-width': 2
        }
      });

      map.on('click', 'no-fly-layer', (e) => {
        const props = e.features[0].properties;
        const html = `
          <div style="font-family: Arial, sans-serif; font-size: 13px; line-height: 1.4; max-width: 220px;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 6px;">🛑 Зона ${props.id}</div>
            <div><strong>Высота:</strong> ${props.altitude || "—"}</div>
            <div><strong>Ограничение:</strong> ${props.limit || "—"}</div>
            <div><strong>Статус:</strong> ${props.active || "—"}</div>
            ${props.radius_m ? `<div><strong>Радиус:</strong> ${props.radius_m / 1000} км</div>` : ""}
          </div>
        `;
        new mapboxgl.Popup().setLngLat(e.lngLat).setHTML(html).addTo(map);
      });

      map.on('mouseenter', 'no-fly-layer', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'no-fly-layer', () => {
        map.getCanvas().style.cursor = '';
      });
    });
}




const astanaCenter = [71.4304, 51.1282];
const defaultZoom = 11.5;

const styles = [
  'mapbox://styles/mapbox/satellite-streets-v12',
  'mapbox://styles/mapbox/streets-v12',
  'mapbox://styles/mapbox/light-v11'
];
let currentStyleIndex = 0;

// Кнопка центрирования
document.getElementById('center-btn').addEventListener('click', centerMap);

function centerMap() {
  map.flyTo({
    center: astanaCenter,
    zoom: defaultZoom,
    essential: true
  });
}

document.getElementById('style-toggle-btn').addEventListener('click', () => {
  currentStyleIndex = (currentStyleIndex + 1) % styles.length;
  map.setStyle(styles[currentStyleIndex]);

  map.once('style.load', () => {
    loadNoFlyZones();           // ✅ вызываем реальную функцию
    updateWeatherIfNeeded();    // обновляем погоду
    lucide.createIcons();       // перерисовываем иконки
    document.getElementById('center-btn').addEventListener('click', centerMap); // подключаем заново центр
  });

  if (window.adminGeometry) {
    showFlightGeometryOnMap(window.adminGeometry);
  }
});


document.getElementById('zoom-in-btn').addEventListener('click', () => {
  map.zoomIn({ duration: 300 });
});

document.getElementById('zoom-out-btn').addEventListener('click', () => {
  map.zoomOut({ duration: 300 });
});


document.querySelector('.sidebar-item:nth-child(2)').addEventListener('click', () => {
  document.getElementById('flights-panel').classList.remove('open'); // ⬅ закрываем "Полёты"
  document.getElementById('monitor-panel').classList.remove('open');
  document.getElementById('flight-panel').classList.add('open');
  fillDroneOptions();
});

document.getElementById('flight-panel-close').addEventListener('click', () => {
  document.getElementById('monitor-panel').classList.remove('open');
  document.getElementById('flight-panel').classList.remove('open');
});

function fillDroneOptions() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const select = document.getElementById('droneSelect');
  select.innerHTML = `<option value="">Выберите дрон</option>`;
  (user.drones || []).forEach(drone => {
    const opt = document.createElement('option');
    opt.value = drone.serial;
    opt.textContent = `${drone.brand} ${drone.model} (${drone.serial})`;
    select.appendChild(opt);
  });
}



document.getElementById('flightForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const title = document.getElementById('flightTitle').value.trim();
  const purpose = document.getElementById('flightPurpose').value.trim();
  const drone = document.getElementById('droneSelect').value;
  const min = parseInt(document.getElementById('minAlt').value);
  const max = parseInt(document.getElementById('maxAlt').value);
  const errorBox = document.getElementById('flightError');
  errorBox.style.display = 'none';

  const blocks = document.querySelectorAll('.schedule-block');
  const schedule = [];

  let scheduleError = false;
  blocks.forEach(block => {
    const day = block.querySelector('.flight-day').value;
    const start = block.querySelector('.flight-start').value;
    const end = block.querySelector('.flight-end').value;
    if (!day || !start || !end || start >= end) scheduleError = true;
    schedule.push({ day, start, end });
  });

  if (!title || !purpose || !drone || isNaN(min) || isNaN(max) || min < 0 || max <= min || scheduleError) {
    errorBox.textContent = 'Пожалуйста, заполните все поля корректно.';
    errorBox.style.display = 'block';
    return;
  }

  if (!window.flightGeometry) {
    errorBox.textContent = 'Пожалуйста, укажите маршрут полёта.';
    errorBox.style.display = 'block';
    return;
  }

  const newFlight = {
    title,
    purpose,
    droneSerial: drone,
    altitude: { min, max },
    schedule,
    geometry: window.flightGeometry,
    status: 'pending',
    createdAt: Date.now(),
    userEmail: JSON.parse(localStorage.getItem('user')).email
  };

  const existing = JSON.parse(localStorage.getItem('flights') || '[]');
  existing.push(newFlight);
  localStorage.setItem('flights', JSON.stringify(existing));

  // 🧹 Убираем маршрут с карты
  ['drawing-geometry', 'drawing-line', 'corridor-line', 'drawing-points'].forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  });
  window.flightGeometry = null;
  drawingPoints = [];
  renderGeoCoords(); // очистить координаты в интерфейсе

  // 🧭 Возвращаем к обычному состоянию
  geoBar.style.display = 'none';
  document.getElementById('flight-panel').classList.remove('open');

  showToast('Заявка на полёт успешно отправлена!');

});



document.getElementById('addScheduleBtn').addEventListener('click', () => {
  const block = document.createElement('div');
  block.className = 'schedule-block';
  block.innerHTML = `
    <input type="date" class="flight-day">
    <input type="time" class="flight-start">
    <input type="time" class="flight-end">
    <button type="button" class="remove-schedule" title="Удалить день">✖</button>
  `;
  document.getElementById('schedule-container').appendChild(block);
});

// Удаление дня
document.getElementById('schedule-container').addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-schedule')) {
    e.target.closest('.schedule-block').remove();
  }
});

const geoBar = document.getElementById('geo-bar');
const geoBtns = document.querySelectorAll('.geo-btn');
const geoRadius = document.getElementById('geo-radius');
const geoWidth = document.getElementById('geo-width');
const geoDone = document.getElementById('geo-done');
const geoCancel = document.getElementById('geo-cancel');
const geoVisualBtn = document.getElementById('geo-visual');

let drawingMode = null;
let drawingPoints = [];
let geometryData = null;
let isVisual = false;

// Показ панели
document.getElementById('addGeometry').addEventListener('click', () => {
  document.getElementById('flight-panel').classList.remove('open');
  geoBar.style.display = 'flex';
  drawingPoints = [];
  resetGeometry();
});

// Выбор режима
geoBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    drawingMode = btn.dataset.type;
    geoRadius.style.display = drawingMode === 'circle' ? 'inline-block' : 'none';
    geoWidth.style.display = drawingMode === 'corridor' ? 'inline-block' : 'none';
    resetGeometry();
  });
});



// Отмена
geoCancel.addEventListener('click', () => {
  geoBar.style.display = 'none';
  document.getElementById('flight-panel').classList.add('open');
  resetGeometry();
});

// Готово
geoDone.addEventListener('click', () => {
  geometryData = {
    type: drawingMode,
    points: drawingPoints,
    radius: +geoRadius.value || 0,
    width: +geoWidth.value || 0,
    visual: isVisual
  };
  window.flightGeometry = geometryData;
  drawingMode = null;
  geoBar.style.display = 'none';
  document.getElementById('flight-panel').classList.add('open');
});

// Автообновление при вводе ширины/радиуса
geoRadius.addEventListener('input', renderGeometry);
geoWidth.addEventListener('input', renderGeometry);

// Добавление точки
map.on('click', (e) => {
  if (!drawingMode) return;
  const coord = [e.lngLat.lng, e.lngLat.lat];
  if (drawingMode === 'circle') {
    drawingPoints = [coord];
  } else {
    drawingPoints.push(coord);
  }
  renderGeometry();
});

map.on('click', 'drawing-points', (e) => {
  e.preventDefault();
  const clicked = turf.point(e.lngLat.toArray());

  let foundIndex = -1;
  drawingPoints.forEach((pt, i) => {
    const candidate = turf.point(pt);
    const distance = turf.distance(clicked, candidate, { units: 'meters' });

    if (distance < 10000 && foundIndex === -1) {
      foundIndex = i;
    }
  });

  if (foundIndex !== -1) {
    drawingPoints.splice(foundIndex, 1);
    renderGeometry();
  }
});

function renderGeoCoords() {
  const coordBox = document.getElementById('geo-coords');
  coordBox.innerHTML = '';

  if (drawingPoints.length === 0) {
    coordBox.style.display = 'none';
    return;
  }

  coordBox.style.display = 'block';

  const table = document.createElement('table');
  table.style.width = '100%';
  table.style.borderCollapse = 'collapse';

  drawingPoints.forEach((pt, i) => {
    const row = document.createElement('tr');
    row.style.background = '#f1f5f9';
    row.style.borderRadius = '6px';
    row.style.marginBottom = '4px';

    const coordCell = document.createElement('td');
    coordCell.textContent = `${pt[1].toFixed(5)}, ${pt[0].toFixed(5)}`;
    coordCell.style.padding = '6px';

    const btnCell = document.createElement('td');
    const btn = document.createElement('button');
    btn.textContent = '✖';
    btn.dataset.index = i;
    btn.style.background = '#ef4444';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '4px';
    btn.style.padding = '4px 8px';
    btn.style.cursor = 'pointer';

    btnCell.appendChild(btn);
    row.appendChild(coordCell);
    row.appendChild(btnCell);
    table.appendChild(row);
  });

  coordBox.appendChild(table);
}



// Рендер геометрии
function renderGeometry() {
  ['drawing-geometry', 'drawing-line', 'corridor-line', 'drawing-points'].forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  });

  let geo = null;

  if (drawingMode === 'circle' && drawingPoints.length === 1) {
    geo = turf.circle(drawingPoints[0], +geoRadius.value / 1000, { steps: 64, units: 'kilometers' });

  } else if (drawingMode === 'polygon' && drawingPoints.length >= 3) {
    geo = turf.polygon([[...drawingPoints, drawingPoints[0]]]);

  } else if (drawingMode === 'corridor' && drawingPoints.length >= 2) {
    const line = turf.lineString(drawingPoints);
    const buffered = turf.buffer(line, +geoWidth.value / 2000, { units: 'kilometers' });

    map.addSource('corridor-line', { type: 'geojson', data: line });
    map.addLayer({
      id: 'drawing-line',
      type: 'line',
      source: 'corridor-line',
      paint: {
        'line-color': '#22d3ee',
        'line-width': 3,
        'line-dasharray': [2, 2]
      }
    });

    geo = buffered;
  }

  if (geo) {
    map.addSource('drawing-geometry', { type: 'geojson', data: geo });
    map.addLayer({
      id: 'drawing-geometry',
      type: 'fill',
      source: 'drawing-geometry',
      paint: {
        'fill-color': '#60a5fa',
        'fill-opacity': 0.4
      }
    });
  }

  map.addSource('drawing-points', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: drawingPoints.map(coord => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: coord }
      }))
    }
  });

  map.addLayer({
    id: 'drawing-points',
    type: 'circle',
    source: 'drawing-points',
    paint: {
      'circle-radius': 7,
      'circle-color': '#3b82f6',
      'circle-stroke-width': 2,
      'circle-stroke-color': '#fff'
    }
  });

  const enough =
    (drawingMode === 'circle' && drawingPoints.length === 1) ||
    (drawingMode === 'polygon' && drawingPoints.length >= 3) ||
    (drawingMode === 'corridor' && drawingPoints.length >= 2);

  geoDone.style.display = enough ? 'inline-block' : 'none';

  // 👇 ДОБАВЬ В САМОМ КОНЦЕ
  renderGeoCoords();
}


// Сброс геометрии
function resetGeometry() {
  ['drawing-geometry', 'drawing-line', 'corridor-line', 'drawing-points'].forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  });
  drawingPoints = [];

  const coordBox = document.getElementById('geo-coords');
  coordBox.innerHTML = '';
  
  if (drawingPoints.length > 0) {
    coordBox.style.display = 'block';
    drawingPoints.forEach((pt, i) => {
      const div = document.createElement('div');
      div.className = 'coord-item';
      div.innerHTML = `
        ${pt[1].toFixed(5)}, ${pt[0].toFixed(5)}
        <button data-index="${i}">✖</button>
      `;
      coordBox.appendChild(div);
    });
  } else {
    coordBox.style.display = 'none';
  }
  

  geoDone.style.display = 'none';
}

// Повторная отрисовка при смене стиля
map.on('style.load', () => {
  if (drawingPoints.length > 0) renderGeometry();
});

// --- Глазик (визуальный полет) ---
geoVisualBtn.addEventListener('click', () => {
  isVisual = !isVisual;
  geoVisualBtn.classList.toggle('active', isVisual);
  const icon = geoVisualBtn.querySelector('i');
  icon.setAttribute('data-lucide', isVisual ? 'eye' : 'eye-off');
  lucide.createIcons(); // Обновляем иконки после замены
});

document.getElementById('geo-coords').addEventListener('click', (e) => {
  if (e.target.tagName === 'BUTTON') {
    const i = parseInt(e.target.dataset.index);
    drawingPoints.splice(i, 1);
    renderGeometry(); // обязательно вызвать повторный рендер!
  }
});


function showToast(message) {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.style.display = 'none';
    }, 300);
  }, 3000);

  toast.style.display = 'block';
}



document.getElementById('flightsBtn').addEventListener('click', () => {
  document.getElementById('flight-panel').classList.remove('open'); // ⬅ закрываем "Новый полёт"
  document.getElementById('monitor-panel').classList.remove('open');
  document.getElementById('flights-panel').classList.add('open');
  loadFlights();
});



// Закрытие панели
document.getElementById('flights-panel-close').addEventListener('click', () => {
  document.getElementById('flight-panel').classList.remove('open');
  document.getElementById('monitor-panel').classList.remove('open'); // ⬅ закрываем "Новый полёт"
  document.getElementById('flights-panel').classList.add('open');
});

// Вкладки (Активные / История)
document.querySelectorAll('.flight-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.flight-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    loadFlights();
  });
});

// Проставляем активную вкладку по умолчанию
const defaultTab = document.querySelector('.flight-tab[data-tab="active"]');
if (!document.querySelector('.flight-tab.active') && defaultTab) {
  defaultTab.classList.add('active');
}


function loadFlights() {
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = ['admin@example.com', 'supervisor@utm.kz'].includes(user.email); // можно добавить email админов
  const tab = document.querySelector('.flight-tab.active')?.dataset.tab || 'active';
  const allFlights = JSON.parse(localStorage.getItem('flights') || '[]');

  const now = Date.now();
  const activeFlights = allFlights.filter(f => f.schedule?.some(s => new Date(s.day + 'T' + s.end) > now));
  const historyFlights = allFlights.filter(f => !f.schedule?.some(s => new Date(s.day + 'T' + s.end) > now));

  const visibleFlights = (tab === 'active' ? activeFlights : historyFlights)
    .filter(f => isAdmin || user.drones?.some(d => d.serial === f.droneSerial));

  const grouped = {
    pending: [],
    approved: [],
    rejected: []
  };

  visibleFlights.forEach(f => {
    const status = f.status || 'pending';
    grouped[status].push(f);
  });

  const container = document.getElementById('flights-content');
  container.innerHTML = '';

  ['pending', 'approved', 'rejected'].forEach(status => {
    if (grouped[status].length === 0) return;

    const section = document.createElement('div');
    const title = document.createElement('h4');
    title.textContent = {
      pending: 'Ожидают рассмотрения',
      approved: 'Разрешённые',
      rejected: 'Отклонённые'
    }[status];
    section.appendChild(title);

    grouped[status].forEach((flight, index) => {
      const block = document.createElement('div');
      block.className = 'flight-block';
      block.style = 'padding: 10px; margin-bottom: 10px; border: 1px solid #ccc; border-radius: 6px; background: white;';

      block.innerHTML = `
        <div><strong>${flight.title}</strong></div>
        <div>Цель: ${flight.purpose}</div>
        <div>Дрон: ${flight.droneSerial}</div>
        <div>Высота: ${flight.altitude.min}-${flight.altitude.max} м</div>
        <div>Расписание: ${flight.schedule.map(s => `${s.day} ${s.start}-${s.end}`).join(', ')}</div>
      `;

      if (isAdmin) {
        const routeBtn = document.createElement('button');
        routeBtn.textContent = 'Посмотреть маршрут';
        routeBtn.style = 'margin-top: 6px;';
        routeBtn.addEventListener('click', () => {
          showFlightGeometryOnMap(flight);
        });
        block.appendChild(routeBtn);
      
        // Найдём пользователя по email/телефону
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const pilot = users.find(u => u.email === flight.userEmail);

        if (pilot) {
          const info = document.createElement('div');
          info.style = 'margin-top: 6px; font-size: 13px; color: #475569;';
          info.innerHTML = `
            <div><strong>Пилот:</strong> ${pilot.lastname} ${pilot.firstname}</div>
            <div><strong>Тел:</strong> ${pilot.phone}</div>
            <div><strong>Email:</strong> ${pilot.email}</div>
          `;
          block.appendChild(info);
        }
      }
      

      if (isAdmin && status === 'pending') {
        const controls = document.createElement('div');
        controls.style = 'margin-top: 8px;';
        controls.innerHTML = `
          <button class="approve-btn" data-id="${flight.createdAt}" style="margin-right: 6px;">Разрешить</button>
          <button class="reject-btn" data-id="${flight.createdAt}">Отклонить</button>
        `;
        block.appendChild(controls);
      }

      if (!isAdmin && status === 'rejected' && flight.reason) {
        const reason = document.createElement('div');
        reason.innerHTML = `<span style="color: red;"><strong>Причина:</strong> ${flight.reason}</span>`;
        block.appendChild(reason);
      }

      section.appendChild(block);
    });

    container.appendChild(section);
  });

  // Обработка кликов админа
  document.querySelectorAll('.approve-btn, .reject-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const flights = JSON.parse(localStorage.getItem('flights') || '[]');
      const flight = flights.find(f => f.createdAt === id);
      if (!flight) return;

      if (btn.classList.contains('reject-btn')) {
        const reason = prompt('Укажите причину отклонения:');
        if (!reason) return;
        flight.status = 'rejected';
        flight.reason = reason;
      } else {
        flight.status = 'approved';
        delete flight.reason;
      }

      localStorage.setItem('flights', JSON.stringify(flights));
      loadFlights();
    });
  });
}



function showFlightGeometryOnMap(flight) {
  window.adminGeometry = flight;

  // Удаляем старые слои
  ['admin-geometry', 'admin-outline'].forEach(id => {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  });

  if (!flight.geometry || !flight.geometry.points || flight.geometry.points.length === 0) return;

  let geo = null;

  if (flight.geometry.type === 'circle') {
    const center = flight.geometry.points[0];
    const radius = flight.geometry.radius || 0;
    if (!center || !radius) return;
    geo = turf.circle(center, radius / 1000, { steps: 64, units: 'kilometers' });
  } 
  else if (flight.geometry.type === 'polygon') {
    geo = turf.polygon([[...flight.geometry.points, flight.geometry.points[0]]]);
  } 
  else if (flight.geometry.type === 'corridor') {
    const line = turf.lineString(flight.geometry.points);
    geo = turf.buffer(line, flight.geometry.width / 2000, { units: 'kilometers' });
  }

  if (!geo) return;

  // Проверка на пересечение с запретными зонами
  const restricted = map.getSource('no-fly-zones')?._data?.features || [];
  const intersects = restricted.some(zone => turf.booleanIntersects(zone, geo));

  map.addSource('admin-geometry', {
    type: 'geojson',
    data: geo
  });

  map.addLayer({
    id: 'admin-geometry',
    type: 'fill',
    source: 'admin-geometry',
    paint: {
      'fill-color': intersects ? '#ef4444' : '#22c55e',
      'fill-opacity': 0.4
    }
  });

  map.addLayer({
    id: 'admin-outline',
    type: 'line',
    source: 'admin-geometry',
    paint: {
      'line-color': intersects ? '#dc2626' : '#15803d',
      'line-width': 2
    }
  });

  // Автофокус карты на геометрию
  const bounds = turf.bbox(geo);
  map.fitBounds(bounds, { padding: 60 });

  if (intersects) {
    alert('⚠ Маршрут пересекает запрещённую зону!');
  }
}


// Открытие панели мониторинга
document.getElementById('monitorBtn').addEventListener('click', () => {
  document.getElementById('flight-panel').classList.remove('open');
  document.getElementById('flights-panel').classList.remove('open');
  document.getElementById('monitor-panel').classList.add('open');
  loadMonitorFlights();
});

document.getElementById('monitor-close').addEventListener('click', () => {
  document.getElementById('monitor-panel').classList.remove('open');
});

function loadMonitorFlights() {
  const container = document.getElementById('monitor-content');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const all = JSON.parse(localStorage.getItem('flights') || '[]');

  const now = Date.now();
  const approved = all.filter(f =>
    f.status === 'approved' &&
    user.drones?.some(d => d.serial === f.droneSerial) &&
    f.schedule.some(s => new Date(s.day + 'T' + s.end) > now)
  );

  if (!approved.length) {
    container.innerHTML = '<p>Нет доступных полётов для запуска.</p>';
    return;
  }

  container.innerHTML = '';

  approved.forEach(flight => {
    const block = document.createElement('div');
    block.className = 'flight-block';
    block.innerHTML = `
      <div><strong>${flight.title}</strong></div>
      <div>Цель: ${flight.purpose}</div>
      <div>Дрон: ${flight.droneSerial}</div>
      <div>Высота: ${flight.altitude.min}-${flight.altitude.max} м</div>
      <div>Расписание: ${flight.schedule.map(s => `${s.day} ${s.start}-${s.end}`).join(', ')}</div>
      <button class="start-flight" data-id="${flight.createdAt}">🚀 Запустить</button>
    `;
    container.appendChild(block);
  });

  document.querySelectorAll('.start-flight').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.id);
      const allFlights = JSON.parse(localStorage.getItem('flights') || '[]');
      const flight = allFlights.find(f => f.createdAt === id);

      if (!flight) return alert("Ошибка: полёт не найден.");

      const now = Date.now();
      const isOutdated = !flight.schedule.some(s => new Date(s.day + 'T' + s.start) > now);

      if (isOutdated) {
        // Переносим в историю как "неудачный"
        flight.status = 'rejected';
        flight.reason = 'Запуск не выполнен: время старта прошло.';
        localStorage.setItem('flights', JSON.stringify(allFlights));
        alert('❌ Время запуска прошло. Полёт перенесён в историю.');
        loadMonitorFlights();
        return;
      }

      // Здесь позже будет эмуляция
      alert(`✅ Полёт "${flight.title}" успешно запущен (эмуляция)`);
      // Можно, например, скрыть или обновить список
    });
  });
}

