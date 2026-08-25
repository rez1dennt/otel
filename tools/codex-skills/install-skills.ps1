param(
    [string]$Destination = (Join-Path ([Environment]::GetFolderPath('UserProfile')) '.agents\skills')
)

$ErrorActionPreference = 'Stop'
$skillNames = @(
    'website-build-workflow',
    'website-visual-polish',
    'website-release-qa'
)

New-Item -ItemType Directory -Force -Path $Destination | Out-Null
foreach ($skillName in $skillNames) {
    $source = Join-Path $PSScriptRoot $skillName
    $target = Join-Path $Destination $skillName
    if (-not (Test-Path -LiteralPath (Join-Path $source 'SKILL.md'))) {
        throw "Invalid skill source: $source"
    }
    New-Item -ItemType Directory -Force -Path $target | Out-Null
    Copy-Item -LiteralPath (Join-Path $source 'SKILL.md') -Destination $target -Force
    foreach ($folder in @('references', 'agents', 'evals')) {
        $sourceFolder = Join-Path $source $folder
        if (Test-Path -LiteralPath $sourceFolder) {
            Copy-Item -LiteralPath $sourceFolder -Destination $target -Recurse -Force
        }
    }
    Write-Output "Installed $skillName -> $target"
}

