@echo off
chcp 65001 >nul
title График командировок
cd /d "%~dp0"
echo ============================================
echo   График командировок - запуск...
echo ============================================
echo.

REM Проверяем наличие Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ОШИБКА] Python не найден!
    pause
    exit /b 1
)

REM Устанавливаем зависимости при первом запуске
if not exist ".deps_installed" (
    echo [УСТАНОВКА] Устанавливаю зависимости...
    pip install -r requirements.txt -q
    if errorlevel 1 (
        echo [ОШИБКА] Не удалось установить зависимости
        pause
        exit /b 1
    )
    echo. > .deps_installed
)

echo [ЗАПУСК] Открываю приложение...
echo Приложение будет доступно в браузере по адресу:
echo   http://localhost:8501
echo.
echo Не закрывайте это окно!
echo ============================================
streamlit run app.py --server.port 8501 --server.headless false
