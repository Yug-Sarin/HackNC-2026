import random
testlist: list[str] = []
class Shop:

    def __init__(self) -> None:
        pass

    def buyPack(self, packType: str, packCost: float, playerMoney: float, playerCards: list[str]) -> float:

        if packCost <= playerMoney:
            playerMoney = playerMoney - packCost
            self.openPack(packType=packType, playerCards=testlist)
            return playerMoney

        else:
            print("You don't have enough money for the pack!")

    def openPack(self, packType: str, playerCards: list[str]):
        
        if packType == "basic":
            chance = random.randint(1, 10)
            if chance < 4:
                playerCards.append("Fish (Common)")

            elif 3 < chance < 7:
                playerCards.append("Crab (Common)")

            elif 6 < chance < 10:
                playerCards.append("Turtle (Common)")

            else:
                playerCards.append("Octopus (Rare)")

        elif packType == "premium":
            chance = random.randint(1, 10)
            if chance < 4:
                playerCards.append("Shark (Rare)")

            elif 3 < chance < 7:
                playerCards.append("Dolphin (Rare)")

            elif 6 < chance < 10:
                playerCards.append("Whale (Epic)")

            else:
                playerCards.append("Kraken (Legendary)")

        elif packType == "legendary":
            chance = random.randint(1, 10)
            if chance < 4:
                playerCards.append("Mermaid (Epic)")

            elif 3 < chance < 7:
                playerCards.append("Sea Serpent (Epic)")

            elif 6 < chance < 10:
                playerCards.append("Poseidon (Legendary)")

            else:
                playerCards.append("Leviathan (Mythic)")

        return playerCards
