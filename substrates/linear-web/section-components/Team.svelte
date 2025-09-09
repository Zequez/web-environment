<script lang="ts" module>
  export type Config = {
    type: 'Team'
    members: {
      img: string
      name: string
      role: string
      about: string
      href: string
    }[]
  }
</script>

<script lang="ts">
  const { config }: { config: Config } = $props()
</script>

<div class="flexcc">
  {#each config.members as member (member.name)}
    <div class="flex flex-col">
      <img src={member.img} class="w-30 rounded-full" alt={member.name} />
      <a href={member.href} target="_blank">{member.name}</a>
      <div>{member.role}</div>
      <div>{member.about}</div>
    </div>
  {/each}
</div>
