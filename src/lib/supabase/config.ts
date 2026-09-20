export function getSupabaseConfig() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://mxlqovhgqaemythgodbz.supabase.co";

  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    "sb_publishable_swp5i-6iKaWAXG-sSZNjSg_gFmfjC1x";

  return { url, publishableKey };
}
