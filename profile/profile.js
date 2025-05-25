function showMessage(text, type = 'success') {
    const messageBox = document.getElementById('profileMessage');
    messageBox.textContent = text;
    messageBox.className = '';
    messageBox.classList.add(type === 'error' ? 'error' : 'success');
    messageBox.style.display = 'block';
  
    setTimeout(() => {
      messageBox.style.display = 'none';
    }, 4000);
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));
  
    const avatar = document.getElementById('avatarPreview');

    
    function updateAvatarInitialsFromUser(user) {
    const firstname = user.firstname?.trim() || '';
    const lastname = user.lastname?.trim() || '';

    if (!firstname && !lastname) {
        avatar.textContent = '';
    } else {
        const initials = (lastname[0] || ' ') + (firstname[0] || ' ');
        avatar.textContent = initials.toUpperCase();
    }
    }

    updateAvatarInitialsFromUser(user);

    const firstnameInput = document.getElementById('firstname');
    const lastnameInput = document.getElementById('lastname');

    // Функция генерации аватара в реальном времени
    function updateAvatarLive() {
    const tempUser = {
        firstname: firstnameInput.value,
        lastname: lastnameInput.value
    };
    updateAvatarInitialsFromUser(tempUser);
    }

    // Обновление аватара при изменении имени или фамилии
    firstnameInput.addEventListener('input', updateAvatarLive);
    lastnameInput.addEventListener('input', updateAvatarLive);
  
    if (!user) {
      window.location.href = '../signup/signup.html';
      return;
    }
  
    document.getElementById('firstname').value = user.firstname || '';
    document.getElementById('lastname').value = user.lastname || '';
    document.getElementById('birthdate').value = user.birthdate || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    renderDrones(user.drones || []);
    
    
  });
  
  // Кнопки
  const editBtn = document.getElementById('editBtn');
  const saveBtn = document.getElementById('saveBtn');
  const form = document.getElementById('profileForm');
  
  // Включить редактирование
  editBtn.addEventListener('click', () => {
    form.querySelectorAll('input').forEach(input => input.disabled = false);
    saveBtn.disabled = false;
  });
  
  // Сохранение с валидацией
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let isValid = true;
  
    const firstname = document.getElementById('firstname');
    const lastname = document.getElementById('lastname');
    const birthdate = document.getElementById('birthdate');
    const phone = document.getElementById('phone');
    const email = document.getElementById('email');
  
    const phoneVal = phone.value.trim();
    const emailVal = email.value.trim();
  
    // Очистка старых ошибок
    [firstname, lastname, birthdate, phone, email].forEach(input => {
      input.classList.remove('input-error');
    });
  
    // Проверка обязательных полей
    if (!firstname.value.trim() || !lastname.value.trim()) {
      showMessage('Имя и фамилия обязательны', 'error');
      firstname.classList.add('input-error');
      lastname.classList.add('input-error');
      isValid = false;
    }
  
    if (!birthdate.value) {
      showMessage('Дата рождения обязательна', 'error');
      birthdate.classList.add('input-error');
      isValid = false;
    }
  
    const phoneRegex = /^\+7\d{10}$/;
    if (!phoneRegex.test(phoneVal)) {
      showMessage('Телефон должен быть в формате +7XXXXXXXXXX', 'error');
      phone.classList.add('input-error');
      isValid = false;
    }
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailVal)) {
      showMessage('Некорректный email', 'error');
      email.classList.add('input-error');
      isValid = false;
    }
  
    // Проверка на уникальность email и телефона
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
  
    const duplicate = allUsers.find(u =>
      (u.email === emailVal || u.phone === phoneVal) &&
      !(u.email === currentUser.email && u.phone === currentUser.phone) // исключаем самого себя
    );
  
    if (duplicate) {
      showMessage('Такой email или номер уже зарегистрирован', 'error');
      email.classList.add('input-error');
      phone.classList.add('input-error');
      isValid = false;
    }
  
    if (!isValid) return;
  
    // Обновляем и пользователя в users[], и активного пользователя
    const updatedUser = {
      firstname: firstname.value.trim(),
      lastname: lastname.value.trim(),
      birthdate: birthdate.value,
      phone: phoneVal,
      email: emailVal,
      drones: currentUser.drones || [],
      password: currentUser.password
    };
    
  
    // Обновить пользователя в массиве users
    const updatedUsers = allUsers.map(u =>
      u.email === currentUser.email && u.phone === currentUser.phone ? updatedUser : u
    );
  
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    localStorage.setItem('user', JSON.stringify(updatedUser));
  
    form.querySelectorAll('input').forEach(input => input.disabled = true);
    saveBtn.disabled = true;
  
    showMessage('Профиль успешно обновлён!', 'success');
  });
  
  
  const droneForm = document.getElementById('droneForm');
const droneTableBody = document.getElementById('droneTableBody');

function renderDrones(drones) {
  droneTableBody.innerHTML = '';
  drones.forEach((drone, index) => {
    const row = document.createElement('tr');

    row.innerHTML = `
      <td><input type="text" value="${drone.brand}" disabled /></td>
      <td><input type="text" value="${drone.model}" disabled /></td>
      <td><input type="text" value="${drone.serial}" disabled /></td>
      <td>
        <button class="edit-drone" data-index="${index}">✎</button>
        <button class="delete-drone" data-index="${index}">🗑</button>
      </td>
    `;

    droneTableBody.appendChild(row);
  });
}

function loadUserDrones() {
  const user = JSON.parse(localStorage.getItem('user'));
  renderDrones(user.drones || []);
}

droneForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const brand = document.getElementById('brand').value.trim();
  const model = document.getElementById('model').value.trim();
  const serial = document.getElementById('serial').value.trim();

  if (!brand || !model || !serial) {
    showMessage('Заполните все поля дрона', 'error');
    return;
  }

  const user = JSON.parse(localStorage.getItem('user'));
  const drones = user.drones || [];

  if (drones.find(drone => drone.serial === serial)) {
    showMessage('Дрон с таким серийным номером уже существует', 'error');
    return;
  }

  drones.push({ brand, model, serial });
  user.drones = drones;

  localStorage.setItem('user', JSON.stringify(user));
  renderDrones(drones);

  showMessage('Дрон успешно добавлен!', 'success');
  droneForm.reset();
});


// Слушаем клики на кнопки редактирования и удаления
// Слушаем клики на кнопки редактирования и удаления
droneTableBody.addEventListener('click', (e) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const drones = user.drones || [];
  const targetIndex = parseInt(e.target.dataset.index);

  if (e.target.classList.contains('edit-drone')) {
    const row = e.target.closest('tr');
    const inputs = row.querySelectorAll('input');

    const isEditing = !inputs[0].disabled;

    if (isEditing) {
      const updated = {
        brand: inputs[0].value.trim(),
        model: inputs[1].value.trim(),
        serial: inputs[2].value.trim()
      };

      // Проверка на дубликат серийного номера
      const duplicate = drones.some((d, i) => d.serial === updated.serial && i !== targetIndex);
      if (duplicate) {
        showMessage('Серийный номер уже используется другим дроном', 'error');
        return;
      }

      // Обновляем и сохраняем
      drones[targetIndex] = updated;
      user.drones = drones;

      // Сохраняем в users[]
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex(u => u.email === user.email);
      if (userIndex !== -1) {
        users[userIndex] = user;
        localStorage.setItem('users', JSON.stringify(users));
      }

      // И в активного user
      localStorage.setItem('user', JSON.stringify(user));

      showMessage('Дрон успешно обновлён!', 'success');
    }

    // Переключаем режим
    if (isEditing) {
      row.classList.remove('editing');
      e.target.classList.remove('active');
    } else {
      row.classList.add('editing');
      e.target.classList.add('active');
    }

    inputs.forEach(input => input.disabled = isEditing);
  }

  if (e.target.classList.contains('delete-drone')) {
    drones.splice(targetIndex, 1);
    user.drones = drones;

    // Сохраняем и в user, и в users[]
    localStorage.setItem('user', JSON.stringify(user));

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.email === user.email);
    if (userIndex !== -1) {
      users[userIndex] = user;
      localStorage.setItem('users', JSON.stringify(users));
    }

    renderDrones(drones);
    showMessage('Дрон удалён!', 'success');
  }
});

  
  function logout() {
    // Просто удаляем активного пользователя
    localStorage.removeItem('user');
    // Перенаправляем обратно на регистрацию
    window.location.href = '../signup/signup.html';
  }
  