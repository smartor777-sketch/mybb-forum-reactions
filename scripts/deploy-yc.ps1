# Deploy Yandex Cloud Function (forum-reactions-proxy)
# Requires: yc CLI authenticated (yc init)

$FUNCTION_NAME = "forum-reactions-proxy"
$FUNCTION_ID = "d4ee6f70vp5h5c796jju"
$FOLDER_ID = "b1gj4571nl92ki7re235"
$RUNTIME = "nodejs18"
$ENTRYPOINT = "index.handler"
$MEMORY = "128MB"
$TIMEOUT = "10s"

Set-Location "$PSScriptRoot\..\yandex-proxy"

Write-Host "Deploying Yandex Cloud Function: $FUNCTION_NAME" -ForegroundColor Cyan

# Create temp zip
$zipPath = "$env:TEMP\yc-proxy.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

# Zip the function files
Compress-Archive -Path "index.js" -DestinationPath $zipPath -Force

# Deploy
yc serverless function version create `
    --function-id $FUNCTION_ID `
    --runtime $RUNTIME `
    --entrypoint $ENTRYPOINT `
    --memory $MEMORY `
    --execution-timeout $TIMEOUT `
    --source-path $zipPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "Function deployed successfully!" -ForegroundColor Green
    Write-Host "URL: https://functions.yandexcloud.net/$FUNCTION_ID" -ForegroundColor Yellow
} else {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}

# Cleanup
Remove-Item $zipPath -Force -ErrorAction SilentlyContinue
