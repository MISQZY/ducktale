import { register } from "@antv/x6-react-shape";
import { QuestNodeCard } from "./QuestNodeCard";

export const QUEST_NODE_SHAPE = "quest-node-card";

register({
  shape: QUEST_NODE_SHAPE,
  component: QuestNodeCard,
  effect: ["data"],
});
