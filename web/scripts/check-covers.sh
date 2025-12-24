#!/bin/bash
# Script to check if problematic games now have covers

echo "🔍 Checking problematic games..."
echo ""

GAMES_JSON="/Users/guillaumedemerges/Dev/hub_data/web/data/games.json"

check_game() {
    local search_term="$1"
    local display_name="$2"
    
    echo "Checking: $display_name"
    result=$(cat "$GAMES_JSON" | jq -r ".[] | select(.title | contains(\"$search_term\")) | {title: .title, coverUrl: .coverUrl}")
    
    if [ -n "$result" ]; then
        echo "$result" | jq '.'
    else
        echo "  ❌ Not found"
    fi
    echo ""
}

echo "=== The Witcher 3 ==="
check_game "Witcher 3" "The Witcher 3"

echo "=== Final Fantasy III ==="
check_game "Final Fantasy III" "Final Fantasy III"

echo "=== Dragon Quest IX ==="
check_game "Dragon Quest IX" "Dragon Quest IX"

echo "=== Pokemon Ruby ==="
check_game "Pokemon" "Pokemon Ruby/Pocket Monsters"

echo "✅ Check complete!"
