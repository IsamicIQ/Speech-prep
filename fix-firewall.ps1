# Fix Windows Firewall blocking Node.js connections
# Run this script as Administrator in PowerShell

Write-Host "Adding Windows Firewall rule for Node.js..." -ForegroundColor Yellow

# Get the path to node.exe
$nodePath = (Get-Command node).Source

# Create firewall rule
New-NetFirewallRule -DisplayName "Node.js API Access" -Direction Outbound -Program $nodePath -Action Allow

Write-Host "Firewall rule added successfully!" -ForegroundColor Green
Write-Host "You can now close this window and restart your server." -ForegroundColor Cyan
