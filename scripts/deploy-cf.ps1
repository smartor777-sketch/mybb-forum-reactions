# Deploy Cloudflare Worker
# Requires: wrangler CLI authenticated (npx wrangler login)

Set-Location "$PSScriptRoot\..\worker"

Write-Host "Deploying Cloudflare Worker..." -ForegroundColor Cyan
npx wrangler deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "Worker deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "Deployment failed!" -ForegroundColor Red
    exit 1
}
