@echo off
cd C:\Users\exdik\Qwen-Workspace\trip-schedule
if exist deploy.zip del deploy.zip

REM Используем 7-Zip для создания правильного zip (с forward slashes)
set "SEVENZIP=C:\Program Files\7-Zip\7z.exe"
if not exist "%SEVENZIP%" (
    echo 7-Zip not found, using PowerShell alternative
    goto :powershell
)

cd out
"%SEVENZIP%" a -tzip ..\deploy.zip . -r
cd ..
goto :done

:powershell
REM PowerShell fallback — создаём zip вручную
powershell -Command "Compress-Archive -Path 'out\*' -DestinationPath 'deploy.zip' -Force"

:done
echo Deploy zip created: deploy.zip
dir deploy.zip
