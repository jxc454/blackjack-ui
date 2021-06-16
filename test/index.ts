import { getOdds } from "../src/hit_stay_only/paths_to_value";
import { buildNewDeck } from "../src/blackjack/blackjack";

console.log(getOdds(buildNewDeck(), [9,1], 5));
