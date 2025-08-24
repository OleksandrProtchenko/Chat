# Chat (FastAPI + Vite React)
Ріал‑тайм мессенджер для приватних діалогів з підтримкою файлів і станами повідомлень

## Стек:
- Backend: FastAPI, SQLAlchemy, JWT (OAuth2 password flow), WebSocket
- Frontend: React + TypeScript + Vite
- Transport: WebSocket (new_message, conversation_updated, message_edited, message_deleted)
- Storage: /storage/attachments
- Container: Docker (frontend / backend / Postgres)

## Можливості
- Реєстрація, логін, зміна пароля, нікнейму
- Список діалогів: прев'ю останнього, лічильник непрочитаних повідомлень, hide / clear
- Повідомлення: відправка тексту, відправка файлів (upload / download / delete), пагінація
- Редагування, видалення для мене (scope=me) и для усіх (scope=all)
- Автоматична відмітка прочитаних при перегляді
- Оновлення нових / відредагованих / видалених повідомлень через WS + ORM listeners

## Запуск проєкту за допомогою Docker
!!!ВАЖЛИВО!!! 
Перед запуском проєкта замініть файл у папці backend/.env.example на файл .env та внесіть зміни у файлі .env за прикладом інформації з .env.example

```bash
cd папка проєкту з папками frontend backend та файлом docker-compose.yml
docker compose build
docker compose up
```
Після цього ви зможете зайти до застосунку за адрессою http://localhost:3000/
