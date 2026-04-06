# Paisa

Expense tracker built for how Indians actually handle money.

Most Indians don't track expenses — not because they don't care, but because money is fluid here. You pay for friends, split across UPI, cash, and cards, deal in amounts that feel too small to log, and suddenly have no idea where the month went. Existing tools weren't built for this.

Paisa lets you log what you spent the way you'd text a friend — in English, Hindi, or Hinglish. Claude handles the rest.

## What it does
- Plain-language expense logging ("Zomato 650 card", "Gave Rohan 500 cash he'll pay me back", "chai at canteen 40")
- Auto-categorization via Claude API across 10 India-specific categories
- Tracks who owes whom — bidirectional (I owe / owed to me)
- Flags incomplete entries without blocking you — saves first, asks later
- Monthly spending view by category
- Needs Review queue for entries missing amounts

## Tech stack
- Frontend: Mobile-first web app (390px, works in any browser)
- Backend: Node.js / Express on Railway
- Database: Supabase (PostgreSQL)
- AI: Claude API (claude-sonnet-4-20250514)
- Deployment: Railway

## Live
https://paisa-production-8ef2.up.railway.app/

## Status
Active development.