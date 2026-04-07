# GitHub 원격(origin) 연결 — 프로젝트 루트 기준
# 사용: PowerShell에서 COWAY-TEST(프로젝트 루트) 폴더로 이동 후
#   .\scripts\git-setup-remote.ps1
# (Git for Windows 설치 필요: https://git-scm.com/download/win )

$ErrorActionPreference = "Stop"
$RemoteUrl = "https://github.com/gong0417/COWAY-TEST.git"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "Git이 PATH에 없습니다. Git for Windows를 설치한 뒤 터미널을 다시 열고 이 스크립트를 실행하세요."
    exit 1
}

if (-not (Test-Path (Join-Path $Root ".git"))) {
    git init
    Write-Host "[ok] git init"
}

$hasOrigin = git remote 2>$null | Where-Object { $_ -eq "origin" }
if ($hasOrigin) {
    git remote set-url origin $RemoteUrl
    Write-Host "[ok] origin URL -> $RemoteUrl"
}
else {
    git remote add origin $RemoteUrl
    Write-Host "[ok] origin 추가 -> $RemoteUrl"
}

Write-Host ""
Write-Host "다음을 순서대로 실행하세요 (처음 올릴 때):"
Write-Host "  git branch -M main"
Write-Host "  git add ."
Write-Host '  git commit -m "Initial commit"'
Write-Host "  git push -u origin main"
Write-Host ""
Write-Host "GitHub 저장소에 이미 README 등 커밋이 있으면 push 전에:"
Write-Host "  git pull origin main --allow-unrelated-histories"
Write-Host "  (충돌 나면 해결 후) git push -u origin main"
