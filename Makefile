.DEFAULT_GOAL := help
.PHONY: help update update-quick build dev books-covers clean-cache install

help:
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

update: ## Telecharge SerieBox + genere les JSON avec images (cache actif)
	cd web && npm run update:data

update-quick: ## Genere les JSON sans re-telecharger SerieBox
	cd web && npm run update:data:quick

books-covers: ## Enrichit les couvertures de livres
	cd pipelines && python image_books.py

dev: ## Lance le serveur de developpement
	cd web && npm run dev

build: ## Build de production (donnees + Next.js)
	cd web && npm run build

clean-cache: ## Supprime le cache des couvertures (force un re-fetch)
	rm -f data/media-covers-cache.json
	@echo "Cache supprime. Prochain build re-fetchera toutes les images."

install: ## Installe les dependances (Node)
	cd web && npm install
