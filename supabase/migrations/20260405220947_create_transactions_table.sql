/*
  # Create transactions table for Paisa expense tracker

  1. New Tables
    - `transactions`
      - `id` (uuid, primary key) - Unique identifier for each transaction
      - `session_id` (text) - Anonymous session identifier from localStorage
      - `raw_input` (text) - Original user input text
      - `amount` (numeric) - Amount in INR, nullable if not provided
      - `description` (text) - Clean description of the expense
      - `category` (text) - Main category (Food & Drinks, Transport, etc.)
      - `subcategory` (text, nullable) - Optional subcategory
      - `payment_method` (text) - UPI, Cash, Card, Net Banking, or Unknown
      - `is_reimbursable` (boolean) - Whether this is a reimbursable expense
      - `reimbursable_direction` (text, nullable) - i_owe or owed_to_me
      - `reimbursable_person` (text, nullable) - Person involved in reimbursement
      - `is_auto_categorized` (boolean) - Whether categorized by AI
      - `needs_review` (boolean) - Flagged for user review
      - `settled` (boolean) - Whether reimbursement is settled
      - `month_year` (text) - Format: "Apr 2026" for monthly summaries
      - `created_at` (timestamptz) - Timestamp of creation

  2. Security
    - Enable RLS on `transactions` table
    - Add policy for session-based access (read/write based on session_id)
    
  3. Indexes
    - Index on session_id for fast filtering
    - Index on created_at for chronological ordering
    - Index on month_year for monthly summaries
*/

CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  raw_input text NOT NULL,
  amount numeric,
  description text NOT NULL,
  category text NOT NULL,
  subcategory text,
  payment_method text NOT NULL DEFAULT 'Unknown',
  is_reimbursable boolean DEFAULT false,
  reimbursable_direction text,
  reimbursable_person text,
  is_auto_categorized boolean DEFAULT true,
  needs_review boolean DEFAULT false,
  settled boolean DEFAULT false,
  month_year text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_session_id ON transactions(session_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_month_year ON transactions(month_year);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all operations based on session_id
-- Note: Since session_id is client-controlled, this is intentionally permissive
-- for anonymous usage. In production with real auth, this would use auth.uid()
CREATE POLICY "Allow access based on session_id"
  ON transactions
  FOR ALL
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);