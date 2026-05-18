set -e

echo "⬇️  Pulling latest code..."
git pull origin main

echo "🔨 Rebuilding app..."
docker compose build app

echo "🔄 Restarting with zero downtime..."
docker compose up -d --no-deps app

echo "🧹 Cleaning up old images..."
docker image prune -f

echo "✅ Done!"