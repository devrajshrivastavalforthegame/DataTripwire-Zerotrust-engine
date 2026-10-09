# Run from repository root. Local Docker Compose only; no reset/deploy.
$ErrorActionPreference = "Stop"
$checks = [System.Collections.Generic.List[object]]::new()
function Check($name, $pass, $details) {
  $checks.Add([pscustomobject]@{ Test=$name; Result=$(if ($pass) {"PASS"} else {"FAIL"}); Details=[string]$details })
}
function HttpStatus($err) {
  try { return [int]$err.Exception.Response.StatusCode.value__ } catch { return 0 }
}
function ExpectStatus($name, $expected, $action) {
  $actual = 200
  try { $null = & $action } catch { $actual = HttpStatus $_ }
  Check $name ($actual -eq $expected) ("expected {0}, received {1}" -f $expected,$actual)
}
if (!(Test-Path ".\docker-compose.yml")) { throw "Run from repository root." }
foreach ($file in @(".\backend\database\migrations\005_portal_sessions.sql",".\backend\database\migrations\006_behavior_score.sql")) {
  if (!(Test-Path $file)) { throw "Missing $file" }
}
Write-Output "Running available automated build/tests..."
if (Test-Path ".\backend\node_modules") {
  npm --prefix backend test
  Check "Backend automated test suite" ($LASTEXITCODE -eq 0) "npm --prefix backend test"
} else {
  Write-Output "Backend unit tests skipped: backend/node_modules is not installed in this checkout."
}
if (Test-Path ".\frontend\package.json") {
  npm --prefix frontend run build
  Check "Frontend production build" ($LASTEXITCODE -eq 0) "npm --prefix frontend run build"
} else {
  Write-Output "Frontend build skipped: this branch checkout has no frontend/ directory."
}
Write-Output "Applying local idempotent migrations..."
foreach ($file in @(".\backend\database\migrations\005_portal_sessions.sql",".\backend\database\migrations\006_behavior_score.sql")) {
  Get-Content -Raw $file | docker compose exec -T postgres psql -X -v ON_ERROR_STOP=1 -U datatripwire -d datatripwire
  if ($LASTEXITCODE -ne 0) { throw "Migration failed: $file. No database reset was attempted." }
}
Check "Migrations 005 and 006" $true "psql succeeded"
Write-Output "Rebuilding backend..."
docker compose up -d --no-deps --build backend
if ($LASTEXITCODE -ne 0) { throw "Backend rebuild failed." }
$healthy = $false
for ($i=0; $i -lt 20; $i++) {
  try {
    $h = Invoke-RestMethod "http://127.0.0.1:3000/health/db" -TimeoutSec 3
    if ($h.status -eq "ok" -and $h.database -eq $true) { $healthy=$true; break }
  } catch {}
  Start-Sleep 2
}
Check "Backend DB health" $healthy "GET /health/db"
if (!$healthy) { docker compose logs --tail 80 backend; throw "DB health failed. See logs above." }
$accounts = @(
 @{Name="Admin";Email="admin@datatripwire.local";Password="Admin@123";Portal="admin";Role="security_manager"},
 @{Name="Employee";Email="employee@workshepher.local";Password="Employee@123";Portal="employee";Role="employee"}
)
$adminToken = ""
foreach ($a in $accounts) {
  $token = ""
  try {
    $body = @{email=$a.Email;password=$a.Password;portal=$a.Portal} | ConvertTo-Json
    $login = Invoke-RestMethod "http://127.0.0.1:3000/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $body -TimeoutSec 10
    $token = [string]$login.accessToken
    Check "$($a.Name) login" (![string]::IsNullOrWhiteSpace($token) -and $login.user.email -eq $a.Email -and $login.user.role -eq $a.Role) ("email={0}; role={1}" -f $login.user.email,$login.user.role)
  } catch {
    $msg = $_.ErrorDetails.Message
    if (!$msg) { $msg=$_.Exception.Message }
    Check "$($a.Name) login" $false $msg
  }
  if (!$token) {
    Check "$($a.Name) /me" $false "Skipped: no token"
    Check "$($a.Name) logout" $false "Skipped: no token"
    Check "$($a.Name) token invalidation" $false "Skipped: no token"
    continue
  }
  $headers = @{ Authorization = "Bearer $token" }
  if ($a.Name -eq "Admin") { $adminToken=$token }
  try {
    $me = Invoke-RestMethod "http://127.0.0.1:3000/api/v1/auth/me" -Headers $headers -TimeoutSec 10
    Check "$($a.Name) /me" ($me.user.email -eq $a.Email) $me.user.email
  } catch {
    $msg=$_.ErrorDetails.Message; if (!$msg) {$msg=$_.Exception.Message}
    Check "$($a.Name) /me" $false $msg
  }
  try {
    $out = Invoke-RestMethod "http://127.0.0.1:3000/api/v1/auth/logout" -Method Post -Headers $headers -TimeoutSec 10
    Check "$($a.Name) logout" ($out.status -eq "ok") $out.status
  } catch {
    $msg=$_.ErrorDetails.Message; if (!$msg) {$msg=$_.Exception.Message}
    Check "$($a.Name) logout" $false $msg
  }
  ExpectStatus "$($a.Name) token invalidated" 401 { Invoke-RestMethod "http://127.0.0.1:3000/api/v1/auth/me" -Headers $headers -TimeoutSec 10 }
}
ExpectStatus "Employee denied admin portal" 403 {
  $b=@{email="employee@workshepher.local";password="Employee@123";portal="admin"} | ConvertTo-Json
  Invoke-RestMethod "http://127.0.0.1:3000/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $b -TimeoutSec 10
}
ExpectStatus "Admin denied employee portal" 403 {
  $b=@{email="admin@datatripwire.local";password="Admin@123";portal="employee"} | ConvertTo-Json
  Invoke-RestMethod "http://127.0.0.1:3000/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $b -TimeoutSec 10
}
# Use a fresh admin session here; the per-account test already logged its session out.
$adminToken = ""
try {
  $adminBody = @{email="admin@datatripwire.local";password="Admin@123";portal="admin"} | ConvertTo-Json
  $adminLogin = Invoke-RestMethod "http://127.0.0.1:3000/api/v1/auth/login" -Method Post -ContentType "application/json" -Body $adminBody -TimeoutSec 10
  $adminToken = [string]$adminLogin.accessToken
  Check "Admin login for Data Exposure tests" (![string]::IsNullOrWhiteSpace($adminToken) -and $adminLogin.user.role -eq "security_manager") ("role={0}" -f $adminLogin.user.role)
} catch {
  $msg=$_.ErrorDetails.Message; if (!$msg) {$msg=$_.Exception.Message}
  Check "Admin login for Data Exposure tests" $false $msg
}
ExpectStatus "Data Exposure rejects unauthenticated request" 401 { Invoke-RestMethod "http://127.0.0.1:3000/api/v1/security/data-exposure?window=7d&limit=50" -TimeoutSec 10 }
if (!$adminToken) {
  foreach ($w in @("24h","7d","30d")) { Check "Data Exposure $w" $false "Skipped: admin login failed" }
} else {
  $exposureHeaders = @{Authorization="Bearer $adminToken"}
  foreach ($w in @("24h","7d","30d")) {
    try {
      $r = Invoke-RestMethod "http://127.0.0.1:3000/api/v1/security/data-exposure?window=$w&limit=50" -Headers $exposureHeaders -TimeoutSec 15
      $ok = ($r.window.key -eq $w -and $null -ne $r.users -and $r.generated_at)
      if ($ok -and @($r.users).Count -gt 0) {
        foreach ($u in $r.users) {
          if ($null -ne $u.current.metrics.recorded_bytes -or $u.current.metrics.byte_volume_status -ne "NOT_CAPTURED" -or !$u.current.severity -or $null -eq $u.current.factors -or !$u.trend.direction) { $ok=$false }
        }
      }
      Check "Data Exposure $w" ([bool]$ok) ("window={0}; users={1}" -f $r.window.key,@($r.users).Count)
    } catch {
      $msg=$_.ErrorDetails.Message; if (!$msg) {$msg=$_.Exception.Message}
      Check "Data Exposure $w" $false $msg
    }
  }
  try {
    $out = Invoke-RestMethod "http://127.0.0.1:3000/api/v1/auth/logout" -Method Post -Headers $exposureHeaders -TimeoutSec 10
    Check "Admin logout after Data Exposure" ($out.status -eq "ok") $out.status
  } catch {
    $msg=$_.ErrorDetails.Message; if (!$msg) {$msg=$_.Exception.Message}
    Check "Admin logout after Data Exposure" $false $msg
  }
  ExpectStatus "Admin exposure token invalidated" 401 { Invoke-RestMethod "http://127.0.0.1:3000/api/v1/auth/me" -Headers $exposureHeaders -TimeoutSec 10 }
}
Write-Output "`n=== RESULTS ==="
$checks | Format-Table -Wrap -AutoSize
$failed = @($checks | Where-Object { $_.Result -eq "FAIL" })
Write-Output ("Summary: {0} passed, {1} failed." -f ($checks.Count-$failed.Count),$failed.Count)
if ($failed.Count -gt 0) { Write-Output "Review failures and backend logs:"; docker compose logs --tail 100 backend } else { Write-Output "PASS: local backend authentication/session/Data Exposure smoke checks passed." }
