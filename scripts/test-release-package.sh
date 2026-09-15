#!/usr/bin/env bash
set -euo pipefail

# Package tracked plugin files only, excluding test reports and local credentials.
git archive --format=zip --output=siteimprove.zip HEAD siteimprove/
network="release-package-${GITHUB_RUN_ID:-local}"
volume="${network}-files"
database="${network}-db"
cleanup() {
  docker rm -f "$database" >/dev/null 2>&1 || true
  docker volume rm "$volume" >/dev/null 2>&1 || true
  docker network rm "$network" >/dev/null 2>&1 || true
}
trap cleanup EXIT
docker network create "$network" >/dev/null
docker volume create "$volume" >/dev/null
# Disposable database on an isolated network; no published ports or real accounts.
docker run -d --name "$database" --network "$network" \
  -e MYSQL_ALLOW_EMPTY_PASSWORD=yes -e MYSQL_ROOT_HOST=% -e MYSQL_DATABASE=wordpress mysql:8.0 >/dev/null
wp() {
  docker run --rm --network "$network" --user 0:0 \
    -v "$volume:/var/www/html" -v "$PWD/siteimprove.zip:/package/siteimprove.zip:ro" \
    wordpress:cli wp --allow-root "$@"
}
wp core download --version=6.9.4
wp config create --dbname=wordpress --dbuser=root --dbpass='' --dbhost="$database" --skip-check
ready=false
for attempt in $(seq 1 60); do
  if docker exec "$database" mysqladmin ping --silent >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 2
done
test "$ready" = true
# Synthetic account confined to the disposable container; never used remotely.
fixture_password="$(openssl rand -hex 24)"
if [ "${GITHUB_ACTIONS:-}" = true ]; then
  printf '::add-mask::%s\n' "$fixture_password"
fi
wp core install --url=http://localhost --title='Release fixture' \
  --admin_user=fixture_admin --admin_password="$fixture_password" \
  --admin_email=fixture@example.test --skip-email
wp plugin install /package/siteimprove.zip --activate
wp plugin is-active siteimprove
wp eval 'if (!did_action("plugins_loaded")) { exit(1); }'
wp plugin deactivate siteimprove
wp plugin delete siteimprove
wp plugin list --format=json | python3 -c 'import json,sys; assert all(p["name"] != "siteimprove" for p in json.load(sys.stdin)), "Plugin removal failed"'
echo 'Release ZIP installation, activation, bootstrap, and removal passed.'
