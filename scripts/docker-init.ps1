$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$target = Join-Path $projectRoot '.env.docker'
if (Test-Path -LiteralPath $target) {
    Write-Host '.env.docker already exists; keeping its configuration.'
    exit 0
}

function New-HexSecret {
    $bytes = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return ([BitConverter]::ToString($bytes)).Replace('-', '').ToLowerInvariant()
}

$template = Get-Content -LiteralPath (Join-Path $projectRoot '.env.docker.example') -Raw
$template = $template.Replace('POSTGRES_PASSWORD=', ('POSTGRES_PASSWORD=' + (New-HexSecret)))
$template = $template.Replace('JWT_SECRET=', ('JWT_SECRET=' + (New-HexSecret)))
[System.IO.File]::WriteAllText($target, $template, (New-Object System.Text.UTF8Encoding($false)))
Write-Host 'Created .env.docker with random database and JWT secrets.'
