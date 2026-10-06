# GERAR REFRESH TOKEN DO GMAIL
# Requer Node 18+.
# Antes:
# 1. habilite Gmail API no Google Cloud
# 2. crie OAuth Client ID do tipo "Desktop app"
# 3. coloque CLIENT_ID e CLIENT_SECRET abaixo temporariamente

$CLIENT_ID = "COLE_SEU_CLIENT_ID"
$CLIENT_SECRET = "COLE_SEU_CLIENT_SECRET"

$redirect = "http://localhost"
$scope = "https://www.googleapis.com/auth/gmail.send"

$auth = "https://accounts.google.com/o/oauth2/v2/auth?client_id=$([uri]::EscapeDataString($CLIENT_ID))&redirect_uri=$([uri]::EscapeDataString($redirect))&response_type=code&scope=$([uri]::EscapeDataString($scope))&access_type=offline&prompt=consent"

Write-Host ""
Write-Host "Abra esta URL no navegador:"
Write-Host $auth
Write-Host ""
Write-Host "Depois de autorizar, copie o parâmetro code= da URL de retorno."
Write-Host ""

$code = Read-Host "Cole o CODE"

$body = @{
    client_id     = $CLIENT_ID
    client_secret = $CLIENT_SECRET
    code          = $code
    grant_type    = "authorization_code"
    redirect_uri  = $redirect
}

$result = Invoke-RestMethod `
    -Method Post `
    -Uri "https://oauth2.googleapis.com/token" `
    -ContentType "application/x-www-form-urlencoded" `
    -Body $body

Write-Host ""
Write-Host "REFRESH TOKEN:"
Write-Host $result.refresh_token
Write-Host ""
