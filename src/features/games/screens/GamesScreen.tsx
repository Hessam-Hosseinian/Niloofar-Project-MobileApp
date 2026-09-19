
import { games } from "../data/gameCatalog";
import { GameCard } from "../components/GameCard";
{games.map((game) => (
  <GameCard
    key={game.key}
    game={game}
    onPress={() => {
      console.log(game.key);
    }}
  />
))}