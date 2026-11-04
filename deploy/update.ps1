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
scp @sshOptions (Join-Path $PSScriptRoot "sshd_hardening.conf") "$remote`:/home/ubuntu/sshd_hardening.conf"

ssh @sshOptions $remote @"
sudo rsync -a --delete $remoteStage/ /var/www/milky-river/
sudo install -m 644 /home/ubuntu/Caddyfile /etc/caddy/Caddyfile
sudo install -m 644 /home/ubuntu/sshd_hardening.conf /etc/ssh/sshd_config.d/00-hardening.conf
sudo rm -f /etc/ssh/sshd_config.d/99-hardening.conf
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
sudo sshd -t
sudo systemctl reload caddy
sudo systemctl reload ssh
sudo systemctl is-active caddy
"@

Write-Output "Deployed to https://milky-river.cn/"
