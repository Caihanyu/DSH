<#
.SYNOPSIS
Copy one built plugin package into the web profile's node_modules.

.DESCRIPTION
The dsh profile installs local `file:` plugin dependencies as copies, so a
rebuilt plugin must be redeployed before the next boot. This script is the
repo's one-step deploy: build (unless -SkipBuild), then copy lib/, the bundle
patch, and the manifest into the profile.

.PARAMETER Plugin
Plugin directory name under plugins/ (e.g. dsh-workspace-files).

.PARAMETER SkipBuild
Deploy the current lib/ output without rebuilding.

.EXAMPLE
.\deploy-plugin.ps1 dsh-workspace-files
#>
param(
  [Parameter(Mandatory = $true)][string]$Plugin,
  [switch]$SkipBuild,
  [string]$Profile = 'web'
)

$ErrorActionPreference = 'Stop'
$src = Join-Path 'E:\DSH\plugins' $Plugin
if (-not (Test-Path $src)) { throw "no plugin at $src" }

if (-not $SkipBuild) {
  node 'E:\DSH\build\client-bundle.mjs' $src
  if ($LASTEXITCODE -ne 0) { throw 'client-bundle failed' }
}

$dst = Join-Path $env:USERPROFILE ".dsh\profiles\$Profile\node_modules\@deepseek-ai\$Plugin"
if (-not (Test-Path $dst)) { throw "plugin is not installed in profile '$Profile': $dst" }

Copy-Item (Join-Path $src 'lib') $dst -Recurse -Force
Copy-Item (Join-Path $src 'cordis.patch.yml') $dst -Force
Copy-Item (Join-Path $src 'package.json') $dst -Force
Write-Host "deployed $Plugin -> $dst"
