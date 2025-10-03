# School Online

Простой сайт школы на Node.js + Express + SQLite + EJS + Bootstrap.

Особенности:
- Авторизация (регистрация/вход/выход)
- Новости (статьи) с комментариями и лайк/дизлайк
- Расписания: общие (для классов) и персональные (доступ только владельцу или админу)
- Расписание звонков
- Разные роли: student, parent, teacher, admin, guest, alumni
- Админская панель для редактирования и файл `config/permissions.json` для прав
- Таймаут сессии (30 минут неактивности) — приводит к разлогину

Как запустить (Windows PowerShell):

1) Установить зависимости:

```powershell
cd C:/Users/Artiom/Documents/SchoolOnline
npm install
```

2) Запустить сервер в режиме разработки (nodemon) или production:

```powershell
npm run dev    # или npm start
```

3) Откройте http://localhost:3000

Учётные данные администратора (seed):
- email: admin@school.local
- password: adminpass

Файлы важные для прав: `config/permissions.json`.

Дальше: можно добавить валидацию, загрузку аватаров, e-mail подтверждение, RBAC с проверкой прав по actions, и тесты.
