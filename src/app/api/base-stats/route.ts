import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is required');
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is required');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    console.log('Base stats request received with month:', month);

    let startDate = null;
    let endDate = null;

    if (month) {
      const [year, monthNum] = month.split('-').map(Number);
      if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
        console.error('Invalid month format:', month);
        return NextResponse.json({ error: 'Invalid month format' }, { status: 400 });
      }
      startDate = new Date(year, monthNum - 1, 1).toISOString();
      endDate = new Date(year, monthNum, 0).toISOString();
    }

    console.log('Calling get_base_match_stats with dates:', { startDate, endDate });
    const { data, error } = await supabase.rpc('get_base_match_stats', {
      p_date: null,
      p_date_start: startDate,
      p_date_end: endDate
    });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Base stats response:', data);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Base stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 