# -----------------------------
# Common paths
# -----------------------------
$basePath = "C:\Users\yonas\Documents\timeproject"
$envActivate = "$basePath\env\Scripts\Activate.ps1"
$backendPath = "$basePath\TimeErp"
$frontendPath = "$basePath\timefront"
$ngrokPath = "C:\Users\yonas\Downloads"

# Start Windows Terminal with all tabs in one command
Start-Process wt.exe -ArgumentList @"
; new-tab --title "Django Server" powershell -NoExit -Command "cd '$basePath'; . '$envActivate'; cd '$backendPath'; python manage.py runserver"
; new-tab --title "Django Services" powershell -NoExit -Command "cd '$basePath'; . '$envActivate'; cd '$backendPath'; python manage.py startservices"
; new-tab --title "Frontend Dev" powershell -NoExit -Command "cd '$frontendPath'; npm run dev"
; new-tab --title "ngrok" powershell -NoExit -Command "cd '$ngrokPath'; .\ngrok http 3000"
"@