import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  return {
    page_server_data: { message: 'hello world' },
  }
}