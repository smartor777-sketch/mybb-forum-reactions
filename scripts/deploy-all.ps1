# Deploy all services
# Usage: .\deploy-all.ps1

Write-Host "=== Deploying all services ===" -ForegroundColor Cyan

Write-Host "`n[1/2] Cloudflare Worker..." -ForegroundColor Yellow
& "$PSScriptRoot\deploy-cf.ps1"

Write-Host "`n[2/2] Yandex Cloud Function..." -ForegroundColor Yellow
& "$PSScriptRoot\deploy-yc.ps1"

Write-Host "`n=== All deployments complete ===" -ForegroundColor Green
