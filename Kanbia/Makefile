.PHONY: up down logs reset test exploit status
DEV_DEBUG_TOKEN ?= kanbia-dev-1000
up:
	docker compose up --build -d
down:
	docker compose down -v
logs:
	docker compose logs -f
reset:
	curl -s -H "X-Dev-Token: $(DEV_DEBUG_TOKEN)" -X POST http://localhost:1000/api/_debug/reset
test:
	python3 tests/verify.py
exploit:
	python3 exploit/exploit.py
status:
	docker compose ps
