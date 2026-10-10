cd C:\Users\exdik\Qwen-Workspace\trip-schedule

# Удаляем старый zip
if (Test-Path deploy.zip) { Remove-Item deploy.zip }

# Создаём временную директорию с правильной структурой
$tempDir = "deploy_temp"
if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
Copy-Item -Path "out\*" -Destination $tempDir -Recurse

# Создаём zip с forward slashes (используем .NET ZipFile)
Add-Type -Assembly System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, "$PWD\deploy.zip", [System.IO.Compression.CompressionLevel]::Optimal, $false)

# Проверяем что paths используют forward slashes
$zip = [System.IO.Compression.ZipFile]::OpenRead("$PWD\deploy.zip")
Write-Output "Total files: $($zip.Entries.Count)"
$zip.Entries | Select-Object FullName -First 10
$zip.Dispose()

# Удаляем temp
Remove-Item $tempDir -Recurse -Force

Write-Output "Deploy zip created successfully"
