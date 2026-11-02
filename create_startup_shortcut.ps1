# PowerShell script to (re)create the startup shortcut for Animal app
# Remove any existing shortcut (ignore errors if it does not exist)
$shortcutPath = Join-Path $env:APPDATA 'Microsoft\Windows\Start Menu\Programs\Startup\AnimalApp.lnk'
if (Test-Path $shortcutPath) {
    Remove-Item $shortcutPath -Force -ErrorAction SilentlyContinue
}

$ws = New-Object -ComObject WScript.Shell
$shortcut = $ws.CreateShortcut($shortcutPath)
$shortcut.TargetPath = 'D:\Animal\run_all.bat'
$shortcut.WorkingDirectory = 'D:\Animal'
$shortcut.WindowStyle = 1
$shortcut.Save()
Write-Host "Shortcut (re)created at $shortcutPath"
