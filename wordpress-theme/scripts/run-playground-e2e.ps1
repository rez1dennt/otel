param(
    [Parameter(Mandatory = $true)]
    [string]$ThemeZip,

    [ValidateRange(1024, 65535)]
    [int]$Port = 9411
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ScriptRoot = [System.IO.Path]::GetFullPath($PSScriptRoot)
$WordPressRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $ScriptRoot))
$RepositoryRoot = [System.IO.Path]::GetFullPath((Split-Path -Parent $WordPressRoot))
$BlueprintSource = Join-Path $WordPressRoot 'playground\blueprint.json'
$ResolvedThemeZip = [System.IO.Path]::GetFullPath((Resolve-Path -LiteralPath $ThemeZip -ErrorAction Stop).Path)
$TemporaryRoot = [System.IO.Path]::GetFullPath([System.IO.Path]::GetTempPath()).TrimEnd('\', '/')
$BundleRoot = Join-Path $TemporaryRoot ("forma-hotel-playground-{0}" -f [System.Guid]::NewGuid().ToString('N'))
$StdoutLog = Join-Path $BundleRoot 'playground.stdout.log'
$StderrLog = Join-Path $BundleRoot 'playground.stderr.log'
$BaseUrl = "http://127.0.0.1:$Port"
$PlaygroundProcess = $null
$TestExitCode = 1
$KeepArtifacts = $true

function Assert-TemporaryBundlePath {
    param([Parameter(Mandatory = $true)][string]$Path)

    $normalizedPath = [System.IO.Path]::GetFullPath($Path).TrimEnd('\', '/')
    $prefix = $TemporaryRoot + [System.IO.Path]::DirectorySeparatorChar
    $leaf = Split-Path -Leaf $normalizedPath
    if (-not $normalizedPath.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase) -or
        -not $leaf.StartsWith('forma-hotel-playground-', [System.StringComparison]::OrdinalIgnoreCase)) {
        throw "Unsafe Playground temporary path: $normalizedPath"
    }
}

function Quote-NativeArgument {
    param([Parameter(Mandatory = $true)][string]$Value)
    return '"' + $Value.Replace('"', '\"') + '"'
}

function Read-PlaygroundLogs {
    $parts = @()
    if (Test-Path -LiteralPath $StdoutLog) {
        $parts += Get-Content -LiteralPath $StdoutLog -Raw
    }
    if (Test-Path -LiteralPath $StderrLog) {
        $parts += Get-Content -LiteralPath $StderrLog -Raw
    }
    return ($parts -join [Environment]::NewLine).Trim()
}

if (-not (Test-Path -LiteralPath $ResolvedThemeZip -PathType Leaf)) {
    throw "Theme ZIP not found: $ResolvedThemeZip"
}
if (-not (Test-Path -LiteralPath $BlueprintSource -PathType Leaf)) {
    throw "Playground Blueprint not found: $BlueprintSource"
}

Assert-TemporaryBundlePath -Path $BundleRoot
New-Item -ItemType Directory -Path $BundleRoot -Force | Out-Null
Copy-Item -LiteralPath $BlueprintSource -Destination (Join-Path $BundleRoot 'blueprint.json') -Force
Copy-Item -LiteralPath $ResolvedThemeZip -Destination (Join-Path $BundleRoot 'theme.zip') -Force

$CliPackagePath = Join-Path $RepositoryRoot 'node_modules\@wp-playground\cli\package.json'
if (-not (Test-Path -LiteralPath $CliPackagePath -PathType Leaf)) {
    throw 'Local @wp-playground/cli is not installed. Run npm install first.'
}
$CliPackage = Get-Content -LiteralPath $CliPackagePath -Raw | ConvertFrom-Json
$CliEntry = Join-Path (Split-Path -Parent $CliPackagePath) $CliPackage.bin.'wp-playground-cli'
if (-not (Test-Path -LiteralPath $CliEntry -PathType Leaf)) {
    throw "Playground CLI entry not found: $CliEntry"
}

$Node = (Get-Command node -ErrorAction Stop).Source
$Npm = (Get-Command npm.cmd -ErrorAction Stop).Source
$Arguments = @(
    $CliEntry,
    'server',
    "--blueprint=$BundleRoot",
    '--blueprint-may-read-adjacent-files',
    "--port=$Port",
    '--workers=1',
    '--verbosity=normal'
)
$ArgumentLine = ($Arguments | ForEach-Object { Quote-NativeArgument -Value $_ }) -join ' '

try {
    Write-Host "Starting isolated WordPress Playground at $BaseUrl"
    $PlaygroundProcess = Start-Process `
        -FilePath $Node `
        -ArgumentList $ArgumentLine `
        -WorkingDirectory $RepositoryRoot `
        -WindowStyle Hidden `
        -RedirectStandardOutput $StdoutLog `
        -RedirectStandardError $StderrLog `
        -PassThru

    $Deadline = [DateTime]::UtcNow.AddSeconds(120)
    $Ready = $false
    while ([DateTime]::UtcNow -lt $Deadline) {
        if ($PlaygroundProcess.HasExited) {
            $logs = Read-PlaygroundLogs
            throw "WordPress Playground exited before becoming ready (code $($PlaygroundProcess.ExitCode)).`n$logs"
        }
        try {
            $response = Invoke-WebRequest -Uri $BaseUrl -UseBasicParsing -TimeoutSec 3
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                $Ready = $true
                break
            }
        } catch {
            # Startup can refuse connections while PHP and WordPress are being prepared.
        }
        Start-Sleep -Milliseconds 500
    }

    if (-not $Ready) {
        $logs = Read-PlaygroundLogs
        throw "WordPress Playground did not become ready within 120 seconds.`n$logs"
    }

    Write-Host 'Playground is ready; running WordPress browser tests...'
    $PreviousBaseUrl = $env:FORMA_WP_BASE_URL
    try {
        $env:FORMA_WP_BASE_URL = $BaseUrl
        & $Npm run test:theme:e2e
        $TestExitCode = $LASTEXITCODE
    } finally {
        $env:FORMA_WP_BASE_URL = $PreviousBaseUrl
    }

    if ($TestExitCode -ne 0) {
        $logs = Read-PlaygroundLogs
        Write-Warning "WordPress E2E failed. Playground logs:`n$logs"
    } else {
        $KeepArtifacts = $false
    }
} finally {
    if ($null -ne $PlaygroundProcess -and -not $PlaygroundProcess.HasExited) {
        Stop-Process -Id $PlaygroundProcess.Id -Force
        $PlaygroundProcess.WaitForExit(10000) | Out-Null
    }

    if ($KeepArtifacts) {
        Write-Warning "Playground failure artifacts preserved at $BundleRoot"
    } elseif (Test-Path -LiteralPath $BundleRoot) {
        Assert-TemporaryBundlePath -Path $BundleRoot
        Remove-Item -LiteralPath $BundleRoot -Recurse -Force
    }
}

exit $TestExitCode
