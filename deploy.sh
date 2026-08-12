set -euo pipefail

DEFAULT_BRANCH=$(git remote show origin | grep "HEAD branch" | awk '{print $NF}')
[ -z "$DEFAULT_BRANCH" ] && DEFAULT_BRANCH="main"

echo "⬇️  Pulling latest code..."
git checkout -- .
git pull origin "$DEFAULT_BRANCH"

# ./uploads is bind-mounted into the container at /app/uploads (see
# docker-compose.yml) — on first creation Docker owns it as root, but the
# app runs as the non-root nextjs user (uid/gid 1001, see Dockerfile), so
# it can't mkdir inside it without this. Idempotent: safe to run every deploy.
echo "📁 Ensuring uploads/ is writable by the app's container user..."
mkdir -p uploads/attachments
chown -R 1001:1001 uploads

# Captured *before* pulling/restarting — this is the image ID rollback below
# actually restores. (Capturing it after the restart, like this script used
# to, would just capture the new image that's about to fail — too late to
# be useful as a rollback target.)
PREVIOUS_IMAGE=$(docker inspect --format='{{.Image}}' ducktale_app 2>/dev/null || true)

echo "⬇️  Pulling latest image..."
docker compose pull app

echo "🔄 Restarting with zero downtime..."
docker compose up -d --no-deps app

echo "⏳ Waiting for app to be healthy..."
for i in $(seq 1 15); do
  if docker compose ps app | grep -q "Up"; then
    echo "✅ App is up!"
    break
  fi
  if [ "$i" -eq 15 ]; then
    echo "❌ App did not start in time, rolling back..."
    if [ -n "$PREVIOUS_IMAGE" ]; then
      docker compose stop app
      docker rm -f $(docker compose ps -q app) 2>/dev/null || true
      sed -i "s|image:.*|image: $PREVIOUS_IMAGE|" docker-compose.yml
      docker compose up -d --no-deps app
    else
      echo "⚠️ No previous image to rollback, exiting..."
      exit 1
    fi
    exit 1
  fi
  sleep 2
done

echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Done!"
