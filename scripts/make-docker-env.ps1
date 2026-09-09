# Converts a multiline .env (with PEM keys) into a Docker-compatible .env.docker
# Usage (from admin-service):
#   powershell -File scripts\make-docker-env.ps1
#   docker run --rm --env-file .env.docker -p 3001:3001 admin-service

$ErrorActionPreference = "Stop"
$src = Join-Path $PSScriptRoot "..\.env"
$dst = Join-Path $PSScriptRoot "..\.env.docker"

if (-not (Test-Path $src)) {
  throw ".env not found at $src"
}

$lines = Get-Content -Path $src -Raw
# Normalize newlines
$lines = $lines -replace "`r`n", "`n"

# Fold multiline quoted KEY="...pem..." values into KEY="line\nline\n..."
$pattern = '(?ms)^(JWT_PRIVATE_KEY|JWT_PUBLIC_KEY)="([^"]*)"'
$converted = [regex]::Replace($lines, $pattern, {
  param($m)
  $name = $m.Groups[1].Value
  $body = $m.Groups[2].Value -replace "`n", '\n'
  return "${name}=`"$body`""
})

# Write UTF-8 without BOM (compatible with Windows PowerShell 5.x)
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($dst, $converted, $utf8NoBom)
Write-Host "Wrote $dst"
Write-Host "Run: docker run --rm --env-file .env.docker -p 3001:3001 admin-service"
