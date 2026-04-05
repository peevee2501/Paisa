import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  message: { message: "Slow down a bit — try again in an hour." }
});

app.use(cors({
  origin: process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : 'http://localhost:5173'
}));

app.use(express.json());

const VALID_CATEGORIES = [
  'Food & Drinks',
  'Transport',
  'Social & Relationships',
  'Shopping',
  'Health & Fitness',
  'Subscriptions',
  'Reimbursable',
  'Savings & Investments',
  'Miscellaneous'
];

const VALID_PAYMENT_METHODS = ['UPI', 'Cash', 'Card', 'Net Banking', 'Unknown'];

app.post('/api/expenses', limiter, async (req, res) => {
  try {
    const session_id = req.headers['x-session-id'];
    if (!session_id) {
      return res.status(400).json({ message: "Session missing." });
    }

    const raw_input = req.body.input?.trim();
    if (!raw_input) {
      return res.status(400).json({ message: "Tell me what you spent." });
    }
    if (raw_input.length > 500) {
      return res.status(400).json({ message: "That's a bit long — keep it short, like you'd text a friend." });
    }

    const systemPrompt = "You are an expense categorizer for young Indian professionals. The user will describe a payment in plain language — in English, Hindi, or Hinglish. Extract and return ONLY a valid JSON object. No explanation, no markdown, no backticks. Only JSON. Fields: amount (number in INR or null if not mentioned), description (short clean description max 6 words), category (exactly one of: Food & Drinks, Transport, Social & Relationships, Shopping, Health & Fitness, Subscriptions, Reimbursable, Savings & Investments, Miscellaneous), subcategory (best fit as a short string), payment_method (exactly one of: UPI, Cash, Card, Net Banking, Unknown), is_reimbursable (boolean), reimbursable_direction (i_owe or owed_to_me or null), reimbursable_person (name if mentioned, null otherwise), is_auto_categorized (always true). If the input is not an expense at all, return: {error: not_an_expense}";

    let parsed = {};
    let needs_review = false;
    let timeout = false;

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 8000)
      );

      const message = await Promise.race([
        anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: 'user', content: raw_input }]
        }),
        timeoutPromise
      ]);

      const responseText = message.content[0].text;

      try {
        parsed = JSON.parse(responseText);
      } catch (parseError) {
        needs_review = true;
        parsed = {};
      }

      if (parsed.error === 'not_an_expense') {
        return res.json({
          not_expense: true,
          message: "That doesn't look like an expense — try something like 'coffee 80 UPI'"
        });
      }

      if (typeof parsed.amount === 'string') {
        parsed.amount = parseFloat(parsed.amount) || null;
      }
      if (parsed.amount === undefined || parsed.amount === null) {
        needs_review = true;
      }

      if (!VALID_CATEGORIES.includes(parsed.category)) {
        parsed.category = 'Miscellaneous';
        needs_review = true;
      }

      if (!VALID_PAYMENT_METHODS.includes(parsed.payment_method)) {
        parsed.payment_method = 'Unknown';
      }

    } catch (error) {
      if (error.message === 'timeout') {
        timeout = true;
        needs_review = true;
        parsed = {
          description: raw_input.slice(0, 50),
          category: 'Miscellaneous',
          subcategory: null,
          payment_method: 'Unknown',
          is_reimbursable: false,
          reimbursable_direction: null,
          reimbursable_person: null
        };
      } else {
        throw error;
      }
    }

    const d = new Date();
    const month_year = `${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`;

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        session_id,
        raw_input,
        amount: parsed.amount || null,
        description: parsed.description || raw_input.slice(0, 50),
        category: parsed.category || 'Miscellaneous',
        subcategory: parsed.subcategory || null,
        payment_method: parsed.payment_method || 'Unknown',
        is_reimbursable: !!parsed.is_reimbursable,
        reimbursable_direction: parsed.reimbursable_direction || null,
        reimbursable_person: parsed.reimbursable_person || null,
        is_auto_categorized: true,
        needs_review,
        settled: false,
        month_year
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ message: "Something went wrong — try again?" });
    }

    const response = { ...data };
    if (timeout) {
      response.timeout = true;
    }

    res.json(response);

  } catch (error) {
    console.error('Error in POST /api/expenses:', error);
    res.status(500).json({ message: "Something went wrong — try again?" });
  }
});

app.get('/api/expenses', async (req, res) => {
  try {
    const session_id = req.headers['x-session-id'];
    if (!session_id) {
      return res.status(400).json({ message: "Session missing." });
    }

    const offset = parseInt(req.query.offset) || 0;

    const { data, error, count } = await supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('session_id', session_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + 19);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ message: "Something went wrong — try again?" });
    }

    const hasMore = count > offset + 20;

    res.json({ records: data, hasMore });

  } catch (error) {
    console.error('Error in GET /api/expenses:', error);
    res.status(500).json({ message: "Something went wrong — try again?" });
  }
});

app.patch('/api/expenses/:id', async (req, res) => {
  try {
    const session_id = req.headers['x-session-id'];
    if (!session_id) {
      return res.status(400).json({ message: "Session missing." });
    }

    const allowedFields = [
      'description',
      'amount',
      'category',
      'subcategory',
      'payment_method',
      'is_reimbursable',
      'reimbursable_direction',
      'reimbursable_person',
      'needs_review'
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (updates.amount !== null && updates.amount !== undefined) {
      updates.needs_review = false;
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', req.params.id)
      .eq('session_id', session_id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ message: "Something went wrong — try again?" });
    }

    res.json(data);

  } catch (error) {
    console.error('Error in PATCH /api/expenses/:id:', error);
    res.status(500).json({ message: "Something went wrong — try again?" });
  }
});

app.patch('/api/expenses/:id/settle', async (req, res) => {
  try {
    const session_id = req.headers['x-session-id'];
    if (!session_id) {
      return res.status(400).json({ message: "Session missing." });
    }

    const { data, error } = await supabase
      .from('transactions')
      .update({ settled: true })
      .eq('id', req.params.id)
      .eq('session_id', session_id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ message: "Something went wrong — try again?" });
    }

    res.json(data);

  } catch (error) {
    console.error('Error in PATCH /api/expenses/:id/settle:', error);
    res.status(500).json({ message: "Something went wrong — try again?" });
  }
});

app.get('/api/expenses/summary', async (req, res) => {
  try {
    const session_id = req.headers['x-session-id'];
    if (!session_id) {
      return res.status(400).json({ message: "Session missing." });
    }

    const month = req.query.month;
    if (!month) {
      return res.status(400).json({ message: "Month parameter required." });
    }

    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('session_id', session_id)
      .eq('month_year', month);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ message: "Something went wrong — try again?" });
    }

    const total_amount = data.reduce((sum, record) => {
      return sum + (parseFloat(record.amount) || 0);
    }, 0);

    const categoryMap = {};
    data.forEach(record => {
      const amount = parseFloat(record.amount) || 0;
      if (!categoryMap[record.category]) {
        categoryMap[record.category] = 0;
      }
      categoryMap[record.category] += amount;
    });

    const categories = Object.entries(categoryMap)
      .map(([category, total]) => ({
        category,
        total,
        percentage: total_amount > 0 ? (total / total_amount) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);

    res.json({ total_amount, categories });

  } catch (error) {
    console.error('Error in GET /api/expenses/summary:', error);
    res.status(500).json({ message: "Something went wrong — try again?" });
  }
});

app.use(express.static('client/dist'));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Paisa server running on port ${PORT}`);
});
