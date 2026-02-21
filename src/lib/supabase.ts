import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pxrultsncbeibbsttgrg.supabase.co'
const supabaseAnonKey = 'sb_publishable_WbCO-FJbwJ2OMPfC2t9WPw_-6sw9E0c'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	global: {
		headers: {
			apikey: supabaseAnonKey,
		},
	},
})
