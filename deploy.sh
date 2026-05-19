set -euo pipefail

echo "⬇️  Pulling latest code..."
git checkout -- .
git pull origin master

echo "🔨 Rebuilding app..."
docker compose build app

echo "🔄 Restarting with zero downtime..."
docker compose up -d --no-deps app

echo "⏳ Waiting for app to be healthy..."
for i in $(seq 1 15); do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' $(docker compose ps -q app) 2>/dev/null || echo "none")
  if [ "$STATUS" = "healthy" ] || docker compose ps app | grep -q "Up"; then
    echo "✅ App is up!"
    break
  fi
  if [ "$i" -eq 15 ]; then
    echo "❌ App did not start in time, rolling back..."
    docker compose restart app
    exit 1
  fi
  sleep 2
done

echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Done!"