<script lang="ts">
  import FrameEl from './Frame.svelte'
  import PreactWrapper from './PreactWrapper.svelte'
  import framesStore from './frames-store.svelte'
  import { Pin } from '../../../center/canvas'
  import rootStore from '../lib/root-store.svelte'

  const FS = framesStore.getContext()
  const RS = rootStore.getContext()

  export const context = FS
</script>

{#each FS.frames as frame (frame.id)}
  {#if !RS.backgroundMode || (RS.backgroundMode && frame.fm.layer === 'bg')}
    {#if import.meta.env.DEV || (!import.meta.env.DEV && !frame.fm.draft)}
      <Pin id={frame.id} data={frame.fm} debug={false}>
        <FrameEl p={frame.fm} id={frame.id}>
          <PreactWrapper component={frame.component} />
        </FrameEl>
      </Pin>
    {/if}
  {/if}
{/each}
