<script lang="ts" module>
  export type Config = {
    type: 'Team'
    members: {
      img: string
      name: string
      role: string
      about: string
      website?: string
      contactLinks: NetworkLink[]
    }[]
  }

  type NetworkLink =
    | { type: 'email'; value: string }
    | {
        type: 'whatsapp'
        value: string
      }
    | { type: 'telegram'; value: string }
</script>

<script lang="ts">
  const { config }: { config: Config } = $props()

  import WhatsappIcon from '~icons/fa6-brands/whatsapp'
  import TelegramIcon from '~icons/fa6-brands/telegram'
  import EmailIcon from '~icons/fa6-solid/envelope'
</script>

<div class="flexsc flex-wrap">
  {#each config.members as member (member.name)}
    <div
      class={[
        'flexcs flex-col w-50 bg-main-950 m2',
        'rounded-lg overflow-hidden shadow-md',
        'b-t-1.5 b-t-main-800 b-b-3 b-x-2 b-x-main-700 b-b-main-600',
        { 'bg-red-500!': false },
      ]}
    >
      <img src={member.img} class="h50 w50 object-cover" alt={member.name} />
      <div class="flex flex-col p2 text-sm flex-grow">
        {#if member.website}
          <a
            class="text-center text-sm text-alt-500 group mb2"
            href={member.website}
            target="_blank"
          >
            <span class="b-alt-600/50 b-b-2 b-dashed group-hover:b-alt-600/100">
              {member.name}
            </span>
          </a>
        {:else}
          <div class="text-center text-sm group mb2">
            {member.name}
          </div>
        {/if}
        <div class="text-center mb2 opacity-60 flex-grow text-xs">
          {member.about}
        </div>
        <div
          class="b-x-2.5 b-y-.5 b-main-800 bg-main-900 p2 rounded-md shadow-sm text-center text-black/70"
        >
          {member.role}
        </div>
        {#if member.contactLinks.length}
          <div class="mt2 flex flex-col space-y-1">
            {#each member.contactLinks as { type: linkType, value } (linkType)}
              {@const linkDisplay = {
                telegram: {
                  klass: 'bg-sky-500 hover:bg-sky-400',
                  Icon: TelegramIcon,
                  text: 'Telegram',
                },
                whatsapp: {
                  klass: 'bg-green-500 hover:bg-green-400',
                  Icon: WhatsappIcon,
                  text: 'Whatsapp',
                },
                email: {
                  klass: 'bg-red-500 hover:bg-red-400',
                  Icon: EmailIcon,
                  text: 'Email',
                },
              }[linkType]}

              <a
                href="https://t.me/549"
                class={[
                  'flexcs space-x-2 px1 py.75 b b-black/10 b-t-black/15 mt1',
                  'text-white rounded-full text-shadow-[0_1px_0_#0003] bg-gradient-to-b from-black/3 to-black/0',
                  linkDisplay.klass,
                  'uppercase text-xs font-semibold',
                ]}
              >
                <linkDisplay.Icon class="opacity-75 w5 text-center" />
                <div>{linkDisplay.text}</div>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/each}
</div>
