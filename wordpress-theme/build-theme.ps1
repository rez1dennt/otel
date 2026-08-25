param(
    [switch]$SkipE2E
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$WordPressRoot = [System.IO.Path]::GetFullPath($PSScriptRoot)
$RepositoryRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $WordPressRoot))
$ThemeRoot = Join-Path $WordPressRoot 'forma-hotel'
$BuildRoot = Join-Path $WordPressRoot '.build'
$StageRoot = Join-Path $BuildRoot 'stage'
$CandidateZip = Join-Path $BuildRoot 'forma-hotel.zip'
$DistRoot = Join-Path $WordPressRoot 'dist'
$FinalZip = Join-Path $DistRoot 'forma-hotel.zip'
$NextFinalZip = Join-Path $DistRoot 'forma-hotel.zip.next'
$Generator = Join-Path $WordPressRoot 'scripts\generate-wordpress-theme.mjs'
$Validator = Join-Path $WordPressRoot 'scripts\validate-wordpress-theme.mjs'
$E2ERunner = Join-Path $WordPressRoot 'scripts\run-playground-e2e.ps1'

function Assert-PathWithin {
    param(
        [Parameter(Mandatory = $true)][string]$Path,
        [Parameter(Mandatory = $true)][string]$AllowedRoot
    )

    $normalizedPath = [System.IO.Path]::GetFullPath($Path).TrimEnd('\', '/')
    $normalizedRoot = [System.IO.Path]::GetFullPath($AllowedRoot).TrimEnd('\', '/')
    $prefix = $normalizedRoot + [System.IO.Path]::DirectorySeparatorChar

    if (-not $normalizedPath.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Unsafe build path outside allowed root: $normalizedPath"
    }
}

function Invoke-Checked {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$Arguments
    )

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code $LASTEXITCODE`: $FilePath $($Arguments -join ' ')"
    }
}

function New-PortableZip {
    param(
        [Parameter(Mandatory = $true)][string]$SourceDirectory,
        [Parameter(Mandatory = $true)][string]$DestinationPath
    )

    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $sourceRoot = [System.IO.Path]::GetFullPath($SourceDirectory).TrimEnd('\', '/')
    $sourcePrefix = $sourceRoot + [System.IO.Path]::DirectorySeparatorChar
    $archive = [System.IO.Compression.ZipFile]::Open(
        $DestinationPath,
        [System.IO.Compression.ZipArchiveMode]::Create
    )

    try {
        Get-ChildItem -LiteralPath $sourceRoot -Recurse -File |
            Sort-Object FullName |
            ForEach-Object {
                $relativePath = $_.FullName.Substring($sourcePrefix.Length).Replace('\', '/')
                $entry = $archive.CreateEntry(
                    $relativePath,
                    [System.IO.Compression.CompressionLevel]::Optimal
                )
                $inputStream = [System.IO.File]::OpenRead($_.FullName)
                $outputStream = $entry.Open()
                try {
                    $inputStream.CopyTo($outputStream)
                } finally {
                    $outputStream.Dispose()
                    $inputStream.Dispose()
                }
            }
    } finally {
        $archive.Dispose()
    }
}

Assert-PathWithin -Path $StageRoot -AllowedRoot $BuildRoot
Assert-PathWithin -Path $CandidateZip -AllowedRoot $BuildRoot
Assert-PathWithin -Path $FinalZip -AllowedRoot $DistRoot
Assert-PathWithin -Path $NextFinalZip -AllowedRoot $DistRoot

$Node = (Get-Command node -ErrorAction Stop).Source
$Npm = (Get-Command npm.cmd -ErrorAction Stop).Source

Push-Location $RepositoryRoot
try {
    Write-Host 'Generating the WordPress theme snapshot...'
    Invoke-Checked -FilePath $Node -Arguments @($Generator)

    Write-Host 'Running WordPress theme tests...'
    Invoke-Checked -FilePath $Npm -Arguments @('run', 'test:theme')

    Write-Host 'Validating the generated theme source...'
    Invoke-Checked -FilePath $Node -Arguments @($Validator, $ThemeRoot)

    if (Test-Path -LiteralPath $StageRoot) {
        Remove-Item -LiteralPath $StageRoot -Recurse -Force
    }
    New-Item -ItemType Directory -Path $StageRoot -Force | Out-Null
    Copy-Item -LiteralPath $ThemeRoot -Destination $StageRoot -Recurse -Force

    New-Item -ItemType Directory -Path $BuildRoot -Force | Out-Null
    if (Test-Path -LiteralPath $CandidateZip) {
        Remove-Item -LiteralPath $CandidateZip -Force
    }

    Write-Host 'Creating the candidate ZIP...'
    New-PortableZip -SourceDirectory $StageRoot -DestinationPath $CandidateZip

    Invoke-Checked -FilePath $Node -Arguments @($Validator, $ThemeRoot, $CandidateZip)

    if ($SkipE2E) {
        Write-Host "Validated candidate retained at $CandidateZip"
        Write-Host 'E2E was skipped; the final dist archive was not changed.'
        return
    }

    if (-not (Test-Path -LiteralPath $E2ERunner -PathType Leaf)) {
        throw "Playground E2E runner not found: $E2ERunner"
    }

    Write-Host 'Installing the candidate in WordPress Playground...'
    & powershell -NoProfile -ExecutionPolicy Bypass -File $E2ERunner -ThemeZip $CandidateZip
    if ($LASTEXITCODE -ne 0) {
        throw "WordPress Playground E2E failed with exit code $LASTEXITCODE"
    }

    New-Item -ItemType Directory -Path $DistRoot -Force | Out-Null
    if (Test-Path -LiteralPath $NextFinalZip) {
        Remove-Item -LiteralPath $NextFinalZip -Force
    }
    Copy-Item -LiteralPath $CandidateZip -Destination $NextFinalZip -Force
    Invoke-Checked -FilePath $Node -Arguments @($Validator, $ThemeRoot, $NextFinalZip)
    Move-Item -LiteralPath $NextFinalZip -Destination $FinalZip -Force
    Invoke-Checked -FilePath $Node -Arguments @($Validator, $ThemeRoot, $FinalZip)

    Write-Host "Final WordPress theme archive: $FinalZip"
} finally {
    Pop-Location
}
