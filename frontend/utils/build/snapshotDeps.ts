import type { BuildPerformanceDeps } from './buildPerformance'
import { applyDisabledPotions } from './buildPerformance'
import { entityRatesFrom } from './entityRates'
import { mercGrantedSkillRanks } from './mercStats'
import type { BuildSnapshot } from './shareBuild'

export function performanceDepsFromSnapshot(
  snapshot: BuildSnapshot,
): BuildPerformanceDeps {
  return {
    classId: snapshot.classId,
    level: snapshot.level,
    allocatedAttrs: snapshot.allocated,
    inventory: applyDisabledPotions(snapshot.inventory, snapshot.disabledPotions ?? {}),
    skillRanks: snapshot.skillRanks,
    subskillRanks: snapshot.subskillRanks,
    activeAuraId: snapshot.activeAuraId,
    activeBuffs: snapshot.activeBuffs,
    customStats: snapshot.customStats,
    allocatedTreeNodes: snapshot.allocatedTreeNodes,
    treeSocketed: snapshot.treeSocketed,
    activeSkillIds: snapshot.activeSkillIds,
    enemyConditions: snapshot.enemyConditions,
    playerConditions: snapshot.playerConditions,
    skillProjectiles: snapshot.skillProjectiles,
    enemyResistances: snapshot.enemyResistances,
    procToggles: snapshot.procToggles,
    killsPerSec: snapshot.killsPerSec,
    entityRates: entityRatesFrom(
      snapshot.entityRates,
      snapshot.entityAttacksPerSecond,
    ),
    grantedSkillRanks: mercGrantedSkillRanks(
      snapshot.mercInventory,
      snapshot.mercDisabledAuras,
    ),
  }
}
