import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

function getSupabaseAdmin() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(url, serviceKey);
}

function getKeyUserMap(): Map<string, string> {
    const raw = process.env.QUICK_ADD_KEYS || '';
    const map = new Map<string, string>();

    if (!raw) return map;

    for (const pair of raw.split(',')) {
        const [email, key] = pair.trim().split(':');
        if (email && key) {
            map.set(key.trim(), email.trim());
        }
    }

    return map;
}

export async function POST(request: NextRequest) {
    try {
        const apiKey = request.headers.get('x-api-key');

        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: 'Missing x-api-key header' },
                { status: 401 }
            );
        }

        const keyUserMap = getKeyUserMap();

        if (keyUserMap.size === 0) {
            return NextResponse.json(
                { success: false, error: 'QUICK_ADD_KEYS not configured on server' },
                { status: 500 }
            );
        }

        const userEmail = keyUserMap.get(apiKey);

        if (!userEmail) {
            return NextResponse.json(
                { success: false, error: 'Invalid API key' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { amount, note } = body;
        const type = body.type || 'expense';

        if (!amount) {
            return NextResponse.json(
                { success: false, error: 'Missing required field: amount' },
                { status: 400 }
            );
        }

        if (type !== 'income' && type !== 'expense') {
            return NextResponse.json(
                { success: false, error: 'Type must be "income" or "expense"' },
                { status: 400 }
            );
        }

        const parsedAmount = parseInt(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return NextResponse.json(
                { success: false, error: 'Amount must be a positive number' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseAdmin();

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('id, name')
            .eq('email', userEmail)
            .single();

        if (userError || !user) {
            return NextResponse.json(
                { success: false, error: `User not found for email: ${userEmail}` },
                { status: 404 }
            );
        }

        const categoryName = type === 'expense' ? 'Chưa phân loại' : 'Thu nhập khác';
        let { data: category } = await supabase
            .from('categories')
            .select('id')
            .eq('name', categoryName)
            .eq('type', type)
            .single();

        if (!category) {
            const { data: newCat, error: catError } = await supabase
                .from('categories')
                .insert({
                    name: categoryName,
                    icon: type === 'expense' ? '❓' : '💵',
                    type: type,
                    monthly_limit: 0,
                })
                .select('id')
                .single();

            if (catError || !newCat) {
                return NextResponse.json(
                    { success: false, error: 'Failed to create default category' },
                    { status: 500 }
                );
            }
            category = newCat;
        }

        const { data: tx, error: txError } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                category_id: category.id,
                amount: parsedAmount,
                type: type,
            })
            .select()
            .single();

        if (txError) {
            return NextResponse.json(
                { success: false, error: txError.message },
                { status: 500 }
            );
        }

        const balanceDelta = type === 'income' ? parsedAmount : -parsedAmount;

        const { error: rpcError } = await supabase.rpc('update_user_balance', {
            p_user_id: user.id,
            p_delta: balanceDelta,
        });

        if (rpcError) {
            const { data: userData } = await supabase
                .from('users')
                .select('total_balance')
                .eq('id', user.id)
                .single();

            if (userData) {
                await supabase
                    .from('users')
                    .update({ total_balance: userData.total_balance + balanceDelta })
                    .eq('id', user.id);
            }
        }

        const msg = `✅ ${user.name}: -${parsedAmount.toLocaleString()}₫${note ? ' (' + note + ')' : ''}`;

        return NextResponse.json({ success: true, message: msg });

    } catch (error: any) {
        console.error('Quick add API error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'Quick Add API — Mỗi người dùng key riêng, hệ thống tự nhận diện.',
        usage: {
            method: 'POST',
            headers: {
                'x-api-key': 'Your personal API key',
                'Content-Type': 'application/json',
            },
            body: {
                amount: 50000,
                type: 'expense | income',
                note: '(optional) Cà phê sáng',
            },
        },
        note: 'No need to specify user — the API key identifies who you are.',
    });
}
