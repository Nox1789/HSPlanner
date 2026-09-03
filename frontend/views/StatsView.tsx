import { useBuildPerformanceDeps } from '../hooks/useBuildPerformanceDeps'
import { useBuild } from '../store/build'
import { StatsPanel } from './stats/StatsPanel'

export default function StatsView() {
  const inventory = useBuild((s) => s.inventory)
  const mercInventory = useBuild((s) => s.mercInventory)
  const allocatedEtherNodes = useBuild((s) => s.allocatedEtherNodes)
  const buildDeps = useBuildPerformanceDeps()

  return (
    <StatsPanel
      deps={buildDeps}
      rawInventory={inventory}
      mercInventory={mercInventory}
      allocatedEtherNodes={allocatedEtherNodes}
    />
  )
}
