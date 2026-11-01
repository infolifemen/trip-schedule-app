@echo off
echo ========================================
echo   Автоматический деплой изменений
echo ========================================
echo.

REM Проверяем что мы в директории проекта
if not exist "app" (
    echo ❌ Ошибка: не найдена директория проекта!
    echo Запустите скрипт из корневой директории trip-schedule
    pause
    exit /b 1
)

echo 📝 Шаг 1: Проверка статуса git...
git status --short
echo.

echo 📦 Шаг 2: Добавление всех изменений...
git add .
echo.

echo 💬 Шаг 3: Создание коммита...
set /p COMMIT_MSG="Введите сообщение коммита (или Enter для авто): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Auto deploy: %date% %time%
git commit -m "%COMMIT_MSG%"
echo.

echo 🚀 Шаг 4: Push на GitHub...
git push origin main
echo.

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo   ✅ ДЕПЛОЙ ЗАВЕРШЁН УСПЕШНО!
    echo ========================================
    echo.
    echo Изменения будут доступны через 1-2 минуты:
    echo https://infolifemen.github.io/trip-schedule-app/
    echo.
) else (
    echo.
    echo ========================================
    echo   ❌ ОШИБКА ДЕПЛОЯ!
    echo ========================================
    echo.
    echo Проверьте:
    echo 1. Подключение к интернету
    echo 2. Права доступа к GitHub
    echo 3. Статус git (возможны конфликты)
    echo.
)

pause
