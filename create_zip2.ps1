cd C:\Users\exdik\Qwen-Workspace\trip-schedule

# Удаляем старый zip
if (Test-Path deploy.zip) { Remove-Item deploy.zip }

Add-Type -Assembly System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::Open("$PWD\deploy.zip", [System.IO.Compression.ZipArchiveMode]::Create)

# Добавляем все файлы из out/ с forward slashes
$files = Get-ChildItem -Path "out" -Recurse -File
foreach ($file in $files) {
    $relativePath = $file.FullName.Substring((Get-Item "out").FullName.Length + 1)
    $relativePath = $relativePath -replace '\\', '/'
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $file.FullName, $relativePath, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
}

$zip.Dispose()

# Проверяем
$zip = [System.IO.Compression.ZipFile]::OpenRead("$PWD\deploy.zip")
Write-Output "Total files: $($zip.Entries.Count)"
$zip.Entries | Select-Object FullName -First 15
$zip.Dispose()

Write-Output "Deploy zip created successfully"
