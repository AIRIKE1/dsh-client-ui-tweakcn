# dsh-client-ui-tweakcn - install into the DSH Desktop profile
# Usage: run .\install.ps1 from the plugin folder (or pass -Src <plugin dir>)
param(
  [string]$Src = $PSScriptRoot
)
$ErrorActionPreference = "Stop"

$profileDir = Join-Path $env:USERPROFILE ".dsh\profiles\desktop"
$dst = Join-Path $profileDir "node_modules\dsh-client-ui-tweakcn"
$profilePkgPath = Join-Path $profileDir "package.json"

if (-not (Test-Path $profilePkgPath)) {
  Write-Error "desktop profile not found: $profilePkgPath"
  exit 1
}

# 1) copy the plugin package (skip dev artifacts)
if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
Copy-Item $Src $dst -Recurse -Force -Exclude ".git", "node_modules", ".pnpm"
Write-Host "copied to $dst"

# 2) register into dsh.profile.bundles
$profilePkg = Get-Content $profilePkgPath -Raw -Encoding UTF8 | ConvertFrom-Json
if (-not $profilePkg.dsh.profile.bundles.Contains("dsh-client-ui-tweakcn")) {
  $profilePkg.dsh.profile.bundles += "dsh-client-ui-tweakcn"
  $profilePkg | ConvertTo-Json -Depth 20 | Set-Content $profilePkgPath -Encoding UTF8
  Write-Host "registered dsh-client-ui-tweakcn in bundles"
} else {
  Write-Host "bundles already contains dsh-client-ui-tweakcn"
}

Write-Host ""
Write-Host "Installed. Please RESTART DSH Desktop to load the new plugin bundle."
Write-Host "To uninstall: remove $dst and drop dsh-client-ui-tweakcn from bundles in $profilePkgPath"
