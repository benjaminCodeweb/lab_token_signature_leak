#!/usr/bin/env bash
set -euo pipefail

# ── Colors ──
R='\033[31m' Y='\033[33m' G='\033[32m' B='\033[34m' C='\033[36m' W='\033[37m'
BD='\033[1m' NC='\033[0m'

# ── Lab metadata ──
LAB_CATEGORY="AUTH"
LAB_NAME="kanbia"
LAB_DIR="Kanbia"
LAB_PORT="1000"
LAB_CREDS="attacker@kanbia.local / password123"
LAB_DIFF="Medium"
LAB_VULN="JWT secret disclosure -> privilege escalation (forjar token admin)"

# ── OS detection ──
OS_TYPE=$(uname -s 2>/dev/null || echo "Unknown")

# ── Docker Compose command ──
COMPOSE_CMD=""
if docker compose version &>/dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
    COMPOSE_CMD="docker-compose"
fi

banner() {
    printf "
"
    printf "  ${BD}${B} _  __         _     _${NC}
"
    printf "  ${BD}${B}| |/ /__ _ _ _| |__ (_) __ _${NC}
"
    printf "  ${BD}${B}| ' </ _\` | ' \ '_ \| |/ _\` |${NC}
"
    printf "  ${BD}${B}|_|\_\__,_|_||_|_.__/|_|\__,_|${NC}
"
    printf "  ${BD}${W}   Kanbia — tableros kanban de equipo${NC}
"
    printf "
"
    printf "  ${Y}Bug Bounty Labs${NC} by ${BD}@_.gorkaaa.b${NC}
"
    printf "  ${W}https://www.instagram.com/_.gorkaaa.b/${NC}
"
    printf "
"
    printf "  ${BD}${G}[$LAB_CATEGORY]${NC} ${BD}$LAB_NAME${NC}
"
    printf "  ${W}$LAB_VULN${NC}
"
    printf "  ${W}Difficulty: ${NC}"
    case "$LAB_DIFF" in
        Easy)   printf "${G}$LAB_DIFF${NC}
" ;;
        Medium) printf "${Y}$LAB_DIFF${NC}
" ;;
        Hard)   printf "${R}$LAB_DIFF${NC}
" ;;
    esac
    printf "
"
}

check_docker() {
    if ! command -v docker &>/dev/null; then
        if [ "$OS_TYPE" = "Darwin" ]; then
            printf "  ${R}[!]${NC} Docker not found. Install Docker Desktop:\n"
            printf "      https://www.docker.com/products/docker-desktop\n"; exit 1
        elif [ "$OS_TYPE" = "Linux" ]; then
            printf "  ${Y}[*]${NC} Docker not found. Installing...\n"
            sudo apt update -qq && sudo apt install -y docker.io >/dev/null 2>&1
            sudo systemctl restart docker && sudo systemctl enable docker
            printf "  ${G}[+]${NC} Docker installed.\n"
        else
            printf "  ${R}[!]${NC} Docker not found. Install Docker Desktop.\n"; exit 1
        fi
    fi
    if [ -z "$COMPOSE_CMD" ]; then printf "  ${R}[!]${NC} Docker Compose not found.\n"; exit 1; fi
    if ! docker info &>/dev/null; then printf "  ${R}[!]${NC} Docker daemon is not running.\n"; exit 1; fi
}

do_deploy() {
    printf "  ${C}[*]${NC} Building lab image...\n"
    $COMPOSE_CMD up --build -d 2>&1 | grep -E "Built|Started|Created" || true
    printf "\n  ${C}[*]${NC} Waiting for service..."
    for i in $(seq 1 60); do
        if curl -sk -o /dev/null -w "" http://localhost:$LAB_PORT/ 2>/dev/null; then break; fi
        sleep 2; printf "."
    done
    printf " ${G}Ready!${NC}\n\n"
    printf "  ${BD}${G}==========================================${NC}\n"
    printf "  ${BD}${G}  Lab deployed successfully!${NC}\n"
    printf "  ${BD}${G}==========================================${NC}\n\n"
    printf "  ${BD}URL:${NC}         http://localhost:$LAB_PORT\n"
    printf "  ${BD}Credentials:${NC} $LAB_CREDS\n"
    printf "  ${BD}Lab:${NC}         $LAB_NAME ($LAB_CATEGORY)\n"
    printf "  ${BD}Vuln:${NC}        $LAB_VULN\n"
    printf "  ${BD}Difficulty:${NC}  $LAB_DIFF\n\n"
    printf "  ${W}Writeup:${NC}     http://localhost:$LAB_PORT/writeup\n\n"
    printf "  ${R}Press Ctrl+C to stop and remove the lab${NC}\n\n"
}

do_destroy() { printf "  ${Y}[*]${NC} Stopping and removing lab...\n"; $COMPOSE_CMD down -v 2>/dev/null || true; printf "  ${G}[+]${NC} Lab removed.\n\n"; }
do_status()  { $COMPOSE_CMD ps 2>/dev/null || printf "  ${Y}Lab is not running.${NC}\n"; }
cleanup()    { printf "\n\n  ${Y}[*]${NC} Stopping lab...\n"; $COMPOSE_CMD down -v 2>/dev/null || true; printf "  ${G}[+]${NC} Lab removed. Goodbye!\n\n"; exit 0; }

trap cleanup INT TERM
cd "$(dirname "$0")"
banner
check_docker
ACTION="${1:-deploy}"
case "$ACTION" in
    deploy) do_deploy; while true; do sleep 1; done ;;
    destroy) do_destroy ;;
    status)  do_status ;;
    *) printf "  Usage: $0 [deploy|destroy|status]\n"; exit 1 ;;
esac
