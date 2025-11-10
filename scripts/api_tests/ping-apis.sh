#!/usr/bin/env bash
# ping-apis.sh — consolidated API pings
set -Eeuo pipefail
IFS=$'\n\t'

# ------- logging helpers -------
log() { printf '%s\n' "$*"; }
hr() { printf '%*s\n' 70 '' | tr ' ' '-'; }

# ------- .env loader (portable) -------
load_env() {
  if [[ -f .env ]]; then
    set -a
    # shellcheck disable=SC1091
    . ./.env
    set +a
    log "Loaded .env"
  else
    log "No .env found (continuing)"
  fi
}

# ------- missing/sentinel check -------
MISSING="__MISSING__"
MISSING_ANY=0
need() {
  local missing=()
  for k in "$@"; do
    local v="${!k-}"
    if [[ -z "$v" || "$v" == "$MISSING" ]]; then
      missing+=("$k")
    fi
  done
  if (( ${#missing[@]} )); then
    local msg; msg="$(printf '%s ' "${missing[@]}")"; msg="${msg% }"
    printf 'SKIP → missing env: %s\n' "$msg"
    MISSING_ANY=1
    return 1
  fi
  return 0
}

# ------- curl helpers -------
hit() {
  # usage: hit "label" curl-args...
  local name="$1"; shift
  log "▶ $name"
  if curl -sS --fail --max-time 12 "$@" >/dev/null; then
    log "✅ $name OK"
  else
    log "❌ $name FAILED"
  fi
  hr
}

hit_json_post() {
  # usage: hit_json_post "label" URL JSON_HEADERS(JSON-encoded or shell-built) JSON_BODY
  # Example: hit_json_post "Plaid: institutions/get" https://sandbox.plaid.com/institutions/get \
  #   '-H Content-Type: application/json' \
  #   '{"client_id":"...","secret":"...","country_codes":["US"],"count":1}'
  local name="$1" url="$2" headers="$3" body="$4"
  log "▶ $name"
  if curl -sS --fail --max-time 15 -X POST $headers -d "$body" "$url" >/dev/null; then
    log "✅ $name OK"
  else
    log "❌ $name FAILED"
  fi
  hr
}

main() {
  hr; log "Starting API pings…"; hr
  load_env

  # -------------------------------
  # Uploadcare
  # -------------------------------
  # Docs use "Uploadcare.Simple <public_key>:<secret_key>" for simple auth.
  if need UPLOADCARE_PUBLIC_KEY UPLOADCARE_SECRET_KEY; then
    hit "Uploadcare: list files (auth check)" \
      -H "Authorization: Uploadcare.Simple ${UPLOADCARE_PUBLIC_KEY}:${UPLOADCARE_SECRET_KEY}" \
      -H "Accept: application/vnd.uploadcare-v0.5+json" \
      "https://api.uploadcare.com/files/?limit=1"
  else
    log "Uploadcare: negative/skip recorded"; hr
  fi

  # -------------------------------
  # AWS S3 (presence + optional unauth ping) 
  # -------------------------------
  # Without SigV4 we can’t auth with curl reliably. We’ll:
  # 1) Verify creds present, and
  # 2) If AWS CLI exists, run a cheap STS call to confirm identity.
  if need AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_REGION; then
    if command -v aws >/dev/null 2>&1; then
      log "▶ AWS STS: GetCallerIdentity"
      if aws sts get-caller-identity --output json >/dev/null 2>&1; then
        log "✅ AWS CLI credentials OK (STS)"
      else
        log "❌ AWS CLI credentials FAILED (STS)"
      fi
      hr
      log "▶ AWS S3: list-buckets (permission may be restricted)"
      if aws s3 ls >/dev/null 2>&1; then
        log "✅ S3 list OK"
      else
        log "❌ S3 list FAILED (could be lack of permission)"
      fi
      hr
    else
      log "SKIP → aws CLI not found; creds present but no signed call possible."; hr
      # Best-effort unauth reachability:
      hit "S3 public endpoint reachability" https://s3.amazonaws.com/
    fi
  else
    log "AWS (S3/STS): negative/skip recorded"; hr
  fi

  # -------------------------------
  # AWS Comprehend Medical
  # -------------------------------
  # Requires SigV4. Use AWS CLI if present.
  if need AWS_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY AWS_REGION; then
    if command -v aws >/dev/null 2>&1; then
      log "▶ Comprehend Medical: detect-entities-v2 (sample text)"
      sample='{"Text":"Patient is a 65-year-old male with diabetes mellitus type 2."}'
      if aws comprehendmedical detect-entities-v2 --text "Patient is a 65-year-old male with diabetes mellitus type 2." >/dev/null 2>&1; then
        log "✅ Comprehend Medical OK"
      else
        log "❌ Comprehend Medical FAILED (region/permissions?)"
      fi
      hr
    else
      log "SKIP → aws CLI not found for Comprehend Medical"; hr
    fi
  else
    log "Comprehend Medical: negative/skip recorded"; hr
  fi

  # -------------------------------
  # Trellis (RealVerdict) — generic header ping
  # -------------------------------
  # Provide TRELLIS_API_BASE in .env (e.g., https://api.trellis.law or service URL)
  if need TRELLIS_API_KEY TRELLIS_API_BASE; then
    # Try a generic GET; many APIs reply 200/401/403; any response path is informative.
    hit "Trellis: base ping" \
      -H "X-API-Key: ${TRELLIS_API_KEY}" \
      "${TRELLIS_API_BASE%/}/"
  else
    log "Trellis: negative/skip recorded"; hr
  fi

  # -------------------------------
  # vLex — generic header ping
  # -------------------------------
  if need VLEX_API_KEY VLEX_API_BASE; then
    hit "vLex: base ping" \
      -H "Authorization: Bearer ${VLEX_API_KEY}" \
      "${VLEX_API_BASE%/}/"
  else
    log "vLex: negative/skip recorded"; hr
  fi

  # -------------------------------
  # UniCourt — generic header ping
  # -------------------------------
  if need UNICOURT_API_KEY UNICOURT_API_BASE; then
    # Some vendors use x-api-key; adjust if needed.
    hit "UniCourt: base ping" \
      -H "x-api-key: ${UNICOURT_API_KEY}" \
      "${UNICOURT_API_BASE%/}/"
  else
    log "UniCourt: negative/skip recorded"; hr
  fi

  # -------------------------------
  # Estated — simple property lookup with token
  # -------------------------------
  if need ESTATED_API_KEY; then
    # Example address; replace with your own if desired.
    hit "Estated: /property (sample)" \
      "https://api.estated.com/property?token=${ESTATED_API_KEY}&address=55%20W%2017th%20St&city=New%20York&state=NY&zip=10011"
  else
    log "Estated: negative/skip recorded"; hr
  fi

  # -------------------------------
  # ATTOM — header apikey
  # -------------------------------
  if need ATTOM_API_KEY; then
    # A harmless endpoint that commonly 200/401s
    hit "ATTOM: /property/address (sample)" \
      -H "apikey: ${ATTOM_API_KEY}" \
      "https://api.gateway.attomdata.com/propertyapi/v1.0.0/property/address?address=55%20W%2017th%20St&city=New%20York&state=NY"
  else
    log "ATTOM: negative/skip recorded"; hr
  fi

  # -------------------------------
  # Plaid — sandbox institutions/get (POST JSON)
  # -------------------------------
  if need PLAID_CLIENT_ID PLAID_SECRET; then
    # Using sandbox endpoint; if your creds are dev-only, this may 401—still informative.
    hit_json_post "Plaid: institutions/get (sandbox)" \
      "https://sandbox.plaid.com/institutions/get" \
      '-H Content-Type: application/json' \
      "$(jq -cn --arg id "$PLAID_CLIENT_ID" --arg sec "$PLAID_SECRET" \
        '{client_id:$id, secret:$sec, country_codes:["US"], count:1, offset:0}')"
  else
    log "Plaid: negative/skip recorded"; hr
  fi

  # -------------------------------
  # ElevenLabs — GET /v1/user (401/200 both informative)
  # -------------------------------
  if need ELEVENLABS_API_KEY; then
    hit "ElevenLabs: /v1/user" \
      -H "xi-api-key: ${ELEVENLABS_API_KEY}" \
      "https://api.elevenlabs.io/v1/user"
  else
    log "ElevenLabs: negative/skip recorded"; hr
  fi

 # -------------------------------
# Supabase — REST ping (auth check)
# -------------------------------
if need VITE_SUPABASE_URL VITE_SUPABASE_PUBLISHABLE_KEY; then
  hit "Supabase: /rest/v1/ (VITE vars)" \
    -H "apikey: ${VITE_SUPABASE_PUBLISHABLE_KEY}" \
    -H "Authorization: Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}" \
    "${VITE_SUPABASE_URL%/}/rest/v1/"
elif need SUPABASE_URL SUPABASE_KEY; then
  hit "Supabase: /rest/v1/ (server vars)" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}" \
    "${SUPABASE_URL%/}/rest/v1/"
else
  log "Supabase: negative/skip recorded"; hr
fi
}

# jq is optional (only needed for the Plaid JSON body)
if ! command -v jq >/dev/null 2>&1; then
  # Fallback minimal implementation for the Plaid body without jq
  jq() { echo "$4"; }
fi

main "$@"
