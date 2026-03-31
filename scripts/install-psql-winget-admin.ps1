# Run this script in an elevated (Administrator) PowerShell so winget can finish the PostgreSQL installer.
# Usage: Right-click PowerShell -> Run as administrator, then:
#   Set-Location "C:\path\to\RV-SYSTEM"
#   .\scripts\install-psql-winget-admin.ps1

$ErrorActionPreference = "Stop"
Write-Host "Installing PostgreSQL 17 (includes psql) via winget..."
winget install -e --id PostgreSQL.PostgreSQL.17 --accept-package-agreements --accept-source-agreements
if ($LASTEXITCODE -ne 0) {
    Write-Host "winget exited with code $LASTEXITCODE"
    exit $LASTEXITCODE
}
Write-Host "Done. Then run (normal PowerShell): .\scripts\add-postgres-bin-to-path.ps1"
Write-Host "Or add manually: C:\Program Files\PostgreSQL\17\bin"
