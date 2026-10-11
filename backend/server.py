from flask import Flask, request, jsonify
from flask_cors import CORS

from cardPacks import Shop

app = Flask(__name__)
CORS(app)

shop = Shop()


@app.route("/buy-pack", methods=["POST"])
def buy_pack():
    data = request.get_json()

    pack_type = data["packType"]
    pack_cost = data["packCost"]
    player_money = data["playerMoney"]
    player_cards = data["playerCards"]

    if pack_cost > player_money:
        return jsonify({
            "success": False,
            "message": "You don't have enough money for the pack!"
        })

    updated_money = player_money - pack_cost

    cards_before = len(player_cards)

    # Use your existing pack-opening method.
    shop.openPack(pack_type, player_cards)

    new_card = player_cards[cards_before]

    return jsonify({
        "success": True,
        "money": updated_money,
        "cards": player_cards,
        "newCard": new_card
    })


if __name__ == "__main__":
    app.run(debug=True)