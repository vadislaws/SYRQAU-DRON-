const adminEmails = ['admin@example.com', 'supervisor@utm.kz'];

document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();
  const users = JSON.parse(localStorage.getItem('users') || '[]');

  const user = users.find(u => u.email === email && u.password === password);

  const message = document.getElementById('loginMessage');

  if (!user) {
    message.textContent = 'Неверный email или пароль';
    message.style.color = 'red';
    message.style.display = 'block';
    return;
  }

  // 👇 Добавляем роль пользователю при логине
  user.role = adminEmails.includes(user.email) ? 'admin' : 'user';

  localStorage.setItem('user', JSON.stringify(user));
  window.location.href = '../profile/profile.html';
});

document.getElementById('signupRedirectBtn').addEventListener('click', () => {
  window.location.href = '../signup/signup.html';
});
