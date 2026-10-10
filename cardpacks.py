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

        return playerCards
            