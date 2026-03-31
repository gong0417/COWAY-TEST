# Adds PostgreSQL bin (psql.exe) to the current user's PATH if not already present.
# Run after installing PostgreSQL from https://www.postgresql.org/download/windows/ or winget.

$ErrorActionPreference = "Stop"
$bins = @()
foreach ($root in @("${env:ProgramFiles}\PostgreSQL", "${env:ProgramFiles(x86)}\PostgreSQL")) {
    if (-not (Test-Path $root)) { continue }
    Get-ChildItem -Path $root -Directory -ErrorAction SilentlyContinue | ForEach-Object {
        $p = Join-Path $_.FullName "bin\psql.exe"
        if (Test-Path $p) { $bins += $p }
    }
}

if ($bins.Count -eq 0) {
    Write-Host "psql.exe not found under Program Files. Install PostgreSQL first, e.g.:"
    Write-Host '  winget install -e --id PostgreSQL.PostgreSQL.17 --accept-package-agreements --accept-source-agreements'
    Write-Host "Or run the installer from https://www.postgresql.org/download/windows/ (include Command Line Tools)."
    exit 1
}

# Prefer numerically highest version folder (17 > 16)
$chosen = $bins | Sort-Object {
    $leaf = Split-Path (Split-Path $_ -Parent) -Leaf
    try { [version]$leaf } catch { [version]"0.0" }
} -Descending | Select-Object -First 1

$binDir = Split-Path $chosen -Parent
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -like "*$binDir*") {
    Write-Host "Already on user PATH: $binDir"
    exit 0
}

[Environment]::SetEnvironmentVariable("Path", "$userPath;$binDir", "User")
Write-Host "Added to user PATH: $binDir"
Write-Host "Open a new terminal and run: psql --version"
