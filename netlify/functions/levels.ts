import { Handler } from '@netlify/functions';
import { getSupabaseClient } from '@/lib/supabaseClient';




if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = getSupabaseClient();

export const handler: Handler = async (event) => {
  try {
    const { data, error } = await supabase
      .from('levels_with_info')
      .select('*')
      .order('level');

    if (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data || []),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal Server Error',
        details: err instanceof Error ? err.message : String(err),
      }),
    };
  }
}; 