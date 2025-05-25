// Генерация инициалов по имени и фамилии
function updateAvatarInitials() {
  const firstname = document.getElementById('firstname').value.trim();
  const lastname = document.getElementById('lastname').value.trim();
  const avatar = document.getElementById('avatarPreview');

  if (!firstname && !lastname) {
    avatar.textContent = '';
  } else {
    const initials = (lastname[0] || ' ') + (firstname[0] || ' ');
    avatar.textContent = initials.toUpperCase();
  }
}

document.getElementById('firstname').addEventListener('input', updateAvatarInitials);
document.getElementById('lastname').addEventListener('input', updateAvatarInitials);

// Глазик: показать/скрыть пароль
const toggle = document.querySelector('.toggle-password');
const passwordInput = document.getElementById('password');

toggle.addEventListener('click', () => {
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  toggle.textContent = type === 'password' ? '⚇' : '⚉';
});

// Валидация: пароль, email, телефон и ФИО
const form = document.getElementById('signupForm');
form.addEventListener('submit', (e) => {
  e.preventDefault(); // отменяем отправку
  let isValid = true;

  const password = passwordInput.value;
  const confirm = document.getElementById('confirmPassword').value;
  const email = document.getElementById('email');
  const phone = document.getElementById('phone');
  const lastname = document.getElementById('lastname').value.trim();
  const firstname = document.getElementById('firstname').value.trim();
  const birthdate = document.getElementById('birthdate').value.trim();

  const userEmail = email.value.trim();
  const userPhone = phone.value.trim();

  // Проверка ФИО и даты
  if (!firstname || !lastname || !birthdate) {
    showSignupMessage('Заполните ФИО и дату рождения');
    isValid = false;
  }

  // Пароль
  if (password.length < 8) {
    showSignupMessage('Пароль должен быть не короче 8 символов');
    passwordInput.classList.add('input-error');
    isValid = false;
  } else {
    passwordInput.classList.remove('input-error');
  }

  if (password !== confirm) {
    showSignupMessage('Пароли не совпадают');
    isValid = false;
  }

  // Email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userEmail)) {
    showSignupMessage('Некорректный email');
    email.classList.add('input-error');
    isValid = false;
  } else {
    email.classList.remove('input-error');
  }

  // Телефон
  const phoneRegex = /^\+7\d{10}$/;
  if (!phoneRegex.test(userPhone)) {
    showSignupMessage('Телефон должен быть в формате +7XXXXXXXXXX');
    phone.classList.add('input-error');
    isValid = false;
  } else {
    phone.classList.remove('input-error');
  }

  // Проверка на уникальность
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const duplicate = users.find(user => user.email === userEmail || user.phone === userPhone);
  if (duplicate) {
    showSignupMessage('Такой email или номер уже зарегистрирован');
    isValid = false;
  }

  if (!isValid) return;

  // Регистрация
  const newUser = {
    firstname,
    lastname,
    birthdate,
    email: userEmail,
    phone: userPhone,
    password
  };

  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  localStorage.setItem('user', JSON.stringify(newUser));

  showSignupMessage('Регистрация успешна!', 'success');

  setTimeout(() => {
    window.location.href = '../profile/profile.html';
  }, 1000);
});

// Сообщение
function showSignupMessage(text, type = 'error') {
  const box = document.getElementById('signupMessage');
  box.textContent = text;
  box.className = '';
  box.classList.add(type === 'error' ? 'error' : 'success');
  box.id = 'signupMessage';
  box.style.display = 'block';

  setTimeout(() => {
    box.style.display = 'none';
  }, 4000);
}

document.getElementById('loginRedirectBtn').addEventListener('click', () => {
  window.location.href =  '../login/login.html';;
});
