<script lang="ts">
    import type { PageServerData } from './$types'
  
    export let data: PageServerData

</script>


<h1>Welcome to SvelteKit</h1>
<h2>{data.page_server_data.message}</h2>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
