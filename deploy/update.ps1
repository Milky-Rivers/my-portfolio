$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$key = Join-Path $HOME ".ssh\milky-river-deploy"
$remote = "ubuntu@43.142.94.139"
$remoteStage = "/home/ubuntu/milky-river-site"
$sshOptions = @("-i", $key, "-o", "IdentitiesOnly=yes", "-o", "BatchMode=yes")

if (-not (Test-Path -LiteralPath $key)) {
  throw "SSH key not found: $key"
}

ssh @sshOptions $remote "mkdir -p $remoteStage"

$items = @(
  "index.html",
  "styles.css",
  "main.js",
  "demo.html",
  "demo.js",
  "assets",
  "play"
)

foreach ($item in $items) {
  $source = Join-Path $projectRoot $item
  scp @sshOptions -r $source "$remote`:$remoteStage/"
}

scp @sshOptions (Join-Path $PSScriptRoot "Caddyfile") "$remote`:/home/ubuntu/Caddyfile"

ssh @sshOptions $remote @"
sudo rsync -a --delete $remoteStage/ /var/www/milky-river/
sudo install -m 644 /home/ubuntu/Caddyfile /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo systemctl reload caddy
sudo systemctl is-active caddy
"@

Write-Output "Deployed to https://milky-river.cn/"
