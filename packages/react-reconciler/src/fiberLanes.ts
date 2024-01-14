export type Lane = number; //代表优先级
export type Lanes = number;  //lane优先级集合

export const SyncLane = 0b0001;  //同步优先级
export const NoLane = 0b0000;  //没有优先级
export const NoLanes = 0b0000;  //没有优先级


//合并优先级
export function mergeLanes(laneA: Lane, laneB: Lane): Lanes {
  return laneA | laneB;
}

export function requestUpdateLane() {
  return SyncLane
}

//选中优先级最高的lane, NoLane除外
export function getHighestPriorityLane(lanes: Lanes): Lane {
  return lanes & -lanes
}

