#!/bin/bash
# Droplet bootstrap, run once on first boot as root. Built from the DigitalOcean
# Docker marketplace image, so docker and the compose plugin are already present.
#
# This file is a committed template. The real user-data passed to the droplet is
# generated at provision time with the placeholders below filled in (secrets and
# the registry credentials are never committed):
#   __POSTGRES_PASSWORD__   generated per droplet
#   __BETTER_AUTH_SECRET__  generated per droplet
#   __APP_IMAGE__           ghcr.io/virgilvox/vampirefreaks-net:latest (public, no pull creds)
set -euo pipefail

VOL=/dev/disk/by-id/scsi-0DO_Volume_vfdata
MOUNT=/mnt/vfdata

# 1. Block-storage volume for the Postgres data dir. Format only if empty.
if ! blkid "$VOL" >/dev/null 2>&1; then
  mkfs.ext4 -F "$VOL"
fi
mkdir -p "$MOUNT"
grep -q "$MOUNT" /etc/fstab || echo "$VOL $MOUNT ext4 defaults,nofail,discard 0 2" >>/etc/fstab
mount -a
mkdir -p "$MOUNT/pgdata"

# 2. A little swap so Postgres, the app, and Caddy coexist on a 1 GB droplet.
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo "/swapfile none swap sw 0 0" >>/etc/fstab
fi

# 3. The stack files. The image is a public GHCR package, so no registry login
# is needed to pull it.
mkdir -p /opt/vf

cat >/opt/vf/.env <<EOF
APP_IMAGE=__APP_IMAGE__
POSTGRES_PASSWORD=__POSTGRES_PASSWORD__
BETTER_AUTH_SECRET=__BETTER_AUTH_SECRET__
SPACES_KEY=__SPACES_KEY__
SPACES_SECRET=__SPACES_SECRET__
EOF
chmod 600 /opt/vf/.env

# docker-compose.prod.yml and Caddyfile are written here by the provisioner
# (inlined into the generated user-data from deploy/ in the repo).

# 4. Pull, migrate, seed once, then bring the stack up.
cd /opt/vf
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml run --rm migrate
docker compose -f docker-compose.prod.yml run --rm seed || true
docker compose -f docker-compose.prod.yml up -d
