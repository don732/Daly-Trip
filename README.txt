Daly Trips

Local dev:
  npm install
  npm run dev

Local Docker:
  cp .env.example .env
  docker compose up --build
  open http://localhost:8080

VPS layout (same pattern as bag-tag):
  Host nginx owns ports 80 and 443 for all domains on the box.
  Each app runs in Docker on its own localhost port:
    bag-tag  → 127.0.0.1:8080
    daly-trip → 127.0.0.1:8081 (WEB_HOST_PORT in .env)

VPS first-time setup:
  1. Point dalytrips.com and www A records to the VPS IP
  2. Clone this repo to VPS_DEPLOY_PATH (e.g. /home/don/Daly-Trip)
  3. cp .env.vps.example .env and fill Supabase vars
  4. chmod +x scripts/vps-deploy.sh
  5. docker compose -f docker-compose.prod.yml up -d --build
  6. curl -I http://127.0.0.1:8081
  7. sudo cp docker/dalytrips.com.nginx.example /etc/nginx/sites-available/dalytrips.com
     sudo ln -s /etc/nginx/sites-available/dalytrips.com /etc/nginx/sites-enabled/
     sudo nginx -t && sudo systemctl reload nginx
     sudo certbot --nginx -d dalytrips.com -d www.dalytrips.com

GitHub repository secrets:
  VPS_HOST  VPS_USER  VPS_SSH_PRIVATE_KEY  VPS_DEPLOY_PATH

Deploy:
  Push to main → scripts/vps-deploy.sh on the VPS (git pull, docker compose build, up -d)

Supabase:
  Apply supabase/schema.sql in the Supabase SQL Editor, then set URL and anon key in VPS .env
