param([switch]$ReviewOnly)
$ErrorActionPreference = 'Stop'
$onboardingWorkspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$onboardingStage = [IO.Path]::GetFullPath((Join-Path $onboardingWorkspace '.onboarding-backend'))
$onboardingTarget = [IO.Path]::GetFullPath('D:\web apps\Python\CBD_Python')
$onboardingManifest = Get-Content -LiteralPath (Join-Path $onboardingWorkspace 'docs\onboarding-backend-manifest.json') -Raw | ConvertFrom-Json
$onboardingCopies = @()
foreach ($onboardingEntry in $onboardingManifest) {
    $onboardingSourceFile = [IO.Path]::GetFullPath((Join-Path $onboardingStage $onboardingEntry.path))
    $onboardingTargetFile = [IO.Path]::GetFullPath((Join-Path $onboardingTarget $onboardingEntry.path))
    if (-not $onboardingSourceFile.StartsWith($onboardingStage + '\', [StringComparison]::OrdinalIgnoreCase) -or
        -not $onboardingTargetFile.StartsWith($onboardingTarget + '\', [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Manifest path is outside the reviewed staging/backend directories.'
    }
    $onboardingSourceHash = (Get-FileHash -LiteralPath $onboardingSourceFile -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($onboardingSourceHash -ne $onboardingEntry.staged_sha256) { throw "Staged file changed: $($onboardingEntry.path)" }
    if ($null -eq $onboardingEntry.original_sha256) {
        if (Test-Path -LiteralPath $onboardingTargetFile) { throw "New target file already exists: $($onboardingEntry.path)" }
    } else {
        if (-not (Test-Path -LiteralPath $onboardingTargetFile)) { throw "Original target file is missing: $($onboardingEntry.path)" }
        $onboardingTargetHash = (Get-FileHash -LiteralPath $onboardingTargetFile -Algorithm SHA256).Hash.ToLowerInvariant()
        if ($onboardingTargetHash -ne $onboardingEntry.original_sha256) { throw "Backend changed since review: $($onboardingEntry.path)" }
    }
    $onboardingCopies += [PSCustomObject]@{ Source=$onboardingSourceFile; Target=$onboardingTargetFile; Relative=$onboardingEntry.path }
}
if ($ReviewOnly) {
    $onboardingCopies.Relative
    Write-Output "Validated $($onboardingCopies.Count) files. Backend unchanged."
    exit 0
}
foreach ($onboardingCopy in $onboardingCopies) {
    Copy-Item -LiteralPath $onboardingCopy.Source -Destination $onboardingCopy.Target -Force
}
Write-Output "Applied $($onboardingCopies.Count) reviewed backend files. No migration, commit, push or deployment was run."
