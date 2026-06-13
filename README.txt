Daly Trips

Local dev:
  npm install
  npm run dev

Local Docker:
  cp .env.example .env
  docker compose up --build
  open http://localhost:8080

VPS first-time setup (DigitalOcean):
  1. Point dalytrips.com and www.dalytrips.com A records to the VPS IP
  2. Install Docker and Docker Compose on the VPS
  3. Clone this repo to VPS_DEPLOY_PATH (e.g. /home/don/daly-trip)
  4. cp .env.vps.example .env and fill VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
  5. chmod +x scripts/vps-deploy.sh
  6. docker compose -f docker-compose.prod.yml up -d --build
  7. Add the GitHub Actions deploy key to ~/.ssh/authorized_keys on the VPS

GitHub repository secrets (Settings → Secrets → Actions):
  VPS_HOST              Public IP or hostname
  VPS_USER              SSH user
  VPS_SSH_PRIVATE_KEY   Private SSH key for that user
  VPS_DEPLOY_PATH       Absolute path to the cloned repo on the VPS

Deploy:
  Push to main → GitHub Actions SSHs to the VPS and runs scripts/vps-deploy.sh
  (git pull, docker compose build, docker compose up -d).
  Caddy terminates HTTPS for dalytrips.com automatically.

Supabase:
  Apply supabase/schema.sql in the Supabase SQL Editor, then set URL and anon key in VPS .env
