# Nexora Startup Script
# Runs on login via Task Scheduler — waits for Docker, then brings containers up

$logFile = "C:\Users\AdminNote\nexora-startup.log"
$projectPath = "\\wsl.localhost\Ubuntu\home\exit\ai-automation-company-template"

function Log($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$ts  $msg" | Tee-Object -FilePath $logFile -Append
}

Log "=== Nexora startup script triggered ==="

# Wait for Docker Desktop to be ready (up to 3 minutes)
Log "Waiting for Docker Desktop..."
$timeout = 180
$elapsed = 0
while ($elapsed -lt $timeout) {
    $dockerReady = & docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        Log "Docker is ready."
        break
    }
    Start-Sleep -Seconds 5
    $elapsed += 5
}

if ($elapsed -ge $timeout) {
    Log "ERROR: Docker did not start within $timeout seconds."
    exit 1
}

# Bring up production containers
Log "Starting docker-compose (prod)..."
$composeFile = "\\wsl.localhost\Ubuntu\home\exit\ai-automation-company-template\docker-compose.prod.yml"

# Use wsl to run docker compose inside WSL where the project lives
& wsl -d Ubuntu -e bash -c "cd /home/exit/ai-automation-company-template && docker compose -f docker-compose.prod.yml up -d 2>&1"

if ($LASTEXITCODE -eq 0) {
    Log "Containers started successfully."
} else {
    Log "WARNING: docker compose returned exit code $LASTEXITCODE — check containers manually."
}

# Check Tailscale
Log "Checking Tailscale..."
$ts = Get-Service -Name "Tailscale" -ErrorAction SilentlyContinue
if ($ts -and $ts.Status -ne "Running") {
    Start-Service -Name "Tailscale"
    Log "Tailscale started."
} else {
    Log "Tailscale already running."
}

Log "=== Startup complete ==="
