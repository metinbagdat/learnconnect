param(
    [string]$Repo = "metinbagdat/learnconnect",
    [string]$Workflow = "vercel-deploy.yml"
)

$ErrorActionPreference = "Stop"

function Require-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command not found: $Name"
    }
}

Require-Command "gh"

$runJson = gh run list --repo $Repo --workflow=$Workflow --limit 1 --json databaseId,conclusion,headSha,headBranch,createdAt,event
$runs = $runJson | ConvertFrom-Json

if (-not $runs -or $runs.Count -eq 0) {
    throw "No workflow runs found for $Workflow in $Repo"
}

$run = $runs[0]
$runId = $run.databaseId

$runDetailsJson = gh run view $runId --repo $Repo --json jobs,url
$runDetails = $runDetailsJson | ConvertFrom-Json

$job = $runDetails.jobs | Where-Object { $_.name -eq "deploy" } | Select-Object -First 1
if (-not $job) {
    $job = $runDetails.jobs | Select-Object -First 1
}

$productionUrl = $null
$inspectUrl = $null

if ($job) {
    $logText = gh run view --log --job $job.databaseId --repo $Repo
    foreach ($line in ($logText -split "`n")) {
        if (-not $inspectUrl -and $line -match 'Inspect:\s+(https://\S+)') {
            $inspectUrl = $Matches[1]
        }
        if (-not $productionUrl -and $line -match 'Production:\s+(https://\S+)') {
            $productionUrl = $Matches[1]
        }
    }
}

Write-Host "Repo        : $Repo"
Write-Host "Workflow    : $Workflow"
Write-Host "Run ID      : $runId"
Write-Host "Event       : $($run.event)"
Write-Host "Branch      : $($run.headBranch)"
Write-Host "Commit      : $($run.headSha)"
Write-Host "Created At  : $($run.createdAt)"
Write-Host "Conclusion  : $($run.conclusion)"
Write-Host "Run URL     : $($runDetails.url)"

if ($job) {
    Write-Host "Job ID      : $($job.databaseId)"
    Write-Host "Job Name    : $($job.name)"
    Write-Host "Job Status  : $($job.status)"
    Write-Host "Job Result  : $($job.conclusion)"
}

if ($inspectUrl) {
    Write-Host "Inspect URL : $inspectUrl"
}

if ($productionUrl) {
    Write-Host "Deploy URL  : $productionUrl"
}