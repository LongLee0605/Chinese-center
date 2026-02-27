# Script chay Backend + CRM (can Docker de chay PostgreSQL)
# Chay: .\scripts\start-dev.ps1
# Hoac tung buoc: xem docs\HUONG-DAN-CHAY.md

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

Write-Host "=== Chinese Center - Khoi dong dev ===" -ForegroundColor Cyan

# 1. Docker PostgreSQL
Write-Host "`n[1/4] Kiem tra Docker PostgreSQL..." -ForegroundColor Yellow
$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
    Write-Host "  Docker chua cai hoac chua co trong PATH." -ForegroundColor Red
    Write-Host "  Vui long: cai Docker Desktop roi chay: docker compose up -d" -ForegroundColor Yellow
    Write-Host "  Hoac cai PostgreSQL va tao database 'chinese_center', sua backend\.env" -ForegroundColor Yellow
    exit 1
}
Set-Location $root
docker compose up -d 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "  docker compose up -d that bai." -ForegroundColor Red; exit 1 }
Write-Host "  Cho 5 giay de PostgreSQL san sang..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# 2. Backend: prisma + seed (npm run tranh loi ExecutionPolicy voi npx)
Write-Host "`n[2/4] Backend: Prisma db push + seed..." -ForegroundColor Yellow
Set-Location "$root\backend"
npm run db:push
if ($LASTEXITCODE -ne 0) { Write-Host "  prisma db push that bai. Kiem tra PostgreSQL dang chay." -ForegroundColor Red; exit 1 }
npm run db:seed 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "  Seed co the da chay roi (user ton tai). Tiep tuc." -ForegroundColor Gray }

# 3. Start Backend (background)
Write-Host "`n[3/4] Khoi dong Backend (port 4000)..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "$root\backend" -WindowStyle Normal
Start-Sleep -Seconds 5

# 4. Start CRM (background)
Write-Host "`n[4/4] Khoi dong CRM (port 5174)..." -ForegroundColor Yellow
Start-Process -FilePath "npm" -ArgumentList "run", "dev" -WorkingDirectory "$root\crm" -WindowStyle Normal

Write-Host "`n=== Xong ===" -ForegroundColor Green
Write-Host "  Backend: http://localhost:4000/api/v1" -ForegroundColor White
Write-Host "  CRM:     http://localhost:5174" -ForegroundColor White
Write-Host "  Dang nhap CRM: admin@chinese-center.local / admin123" -ForegroundColor White
Write-Host "`nDong cua so nay an toan. De dung: dong 2 cua so npm (Backend + CRM), roi: docker compose down" -ForegroundColor Gray
