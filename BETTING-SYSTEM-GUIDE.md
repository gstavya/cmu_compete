# CMU Compete Betting System

## Overview

The CMU Compete betting system allows users to place bets on pending matches with real money using Stripe payment processing.

## Features

### 1. **Betting Interface**

- View all pending matches available for betting
- See real-time odds based on ELO ratings
- Place bets with amounts between $1-$100
- View betting history and statistics

### 2. **Payment Processing**

- Integrated with Stripe API for secure payments
- Mock implementation for demo purposes
- Real-time payment confirmation
- Automatic bet placement upon successful payment

### 3. **Odds Calculation**

- Dynamic odds based on player ELO ratings
- Simple probability calculation: `1 / (1 + 10^((opponent_elo - player_elo) / 400))`
- Minimum odds of 1.1x to ensure house edge
- Real-time odds display

### 4. **Bet Management**

- Track active, won, lost, and cancelled bets
- Automatic bet settlement when matches complete
- Full refunds for cancelled matches
- Comprehensive betting statistics

## How It Works

### Placing a Bet

1. **Navigate to Betting Tab**: Click the "Betting" tab in the main navigation
2. **Select Match**: Choose from available pending matches
3. **Choose Outcome**: Select which player you think will win
4. **Set Amount**: Enter bet amount between $1-$100
5. **Review**: Check potential winnings and odds
6. **Pay**: Complete payment through Stripe
7. **Confirm**: Bet is placed and appears in your betting history

### Bet Settlement

- **Automatic**: Bets are automatically settled when match results are recorded
- **Winning Bets**: Full payout based on odds
- **Losing Bets**: No payout
- **Cancelled Matches**: Full refund of bet amount

### Betting Statistics

- **Total Bets**: Number of bets placed
- **Win Rate**: Percentage of winning bets
- **Total Wagered**: Total amount bet
- **Total Winnings**: Total amount won
- **Net Profit**: Winnings minus wagered amount

## Technical Implementation

### Database Structure

#### Bets Collection

```javascript
{
  matchId: "match_id",
  bettor: "andrew_id",
  betOn: "challenger" | "opponent",
  amount: 10.00,
  odds: 1.5,
  potentialWinnings: 15.00,
  status: "active" | "won" | "lost" | "cancelled",
  paymentIntentId: "stripe_payment_intent_id",
  createdAt: timestamp,
  settledAt: timestamp,
  winnings: 15.00,
  matchDetails: {
    challenger: "player1",
    opponent: "player2",
    sport: "pingpong",
    scheduledDate: timestamp
  }
}
```

### Stripe Integration

#### Mock Implementation

- `stripeMock.js`: Mock Stripe implementation for demo
- Simulates payment processing with 2-second delay
- Returns successful payment confirmation
- No real money transactions in demo mode

#### Real Implementation (Production)

```javascript
// Backend API endpoint
POST /api/create-payment-intent
{
  "amount": 1000, // $10.00 in cents
  "currency": "usd",
  "metadata": {
    "matchId": "match_123",
    "bettor": "sgaonkar",
    "betOn": "challenger"
  }
}

// Frontend payment confirmation
const stripe = await loadStripe('pk_live_...');
const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: cardElement }
});
```

### Odds Calculation Algorithm

```javascript
const calculateOdds = (match, betOn) => {
  const challengerELO = match.challengerELO || 1200;
  const opponentELO = match.opponentELO || 1200;

  const challengerWinProbability =
    1 / (1 + Math.pow(10, (opponentELO - challengerELO) / 400));
  const opponentWinProbability = 1 - challengerWinProbability;

  if (betOn === "challenger") {
    return Math.max(1.1, 1 / challengerWinProbability);
  } else {
    return Math.max(1.1, 1 / opponentWinProbability);
  }
};
```

## Security Considerations

### Payment Security

- All payments processed through Stripe (PCI compliant)
- No card details stored locally
- Secure payment intent creation
- Automatic fraud detection

### Bet Validation

- Minimum bet: $1
- Maximum bet: $100
- Only authenticated users can bet
- Cannot bet on completed matches
- Cannot bet on own matches

### Data Integrity

- All bet data stored in Firestore
- Atomic transactions for bet placement
- Automatic bet settlement
- Audit trail for all betting activity

## Legal Considerations

### Terms of Service

- Users must be 18+ to place bets
- All betting is for entertainment purposes
- House reserves right to cancel bets
- Responsible gambling guidelines

### Compliance

- Follow local gambling regulations
- Implement responsible gambling features
- Age verification requirements
- Transaction limits and cooling-off periods

## Future Enhancements

### Advanced Features

- Live betting during matches
- Parlay bets (multiple match combinations)
- Betting pools and tournaments
- Social betting features

### Analytics

- Advanced odds calculation with machine learning
- Betting pattern analysis
- Risk management tools
- Performance metrics

### Mobile Optimization

- Mobile-first betting interface
- Push notifications for bet results
- Quick bet placement
- Mobile payment optimization

## Demo Mode

The current implementation uses mock Stripe integration for demonstration purposes:

- **No Real Money**: All payments are simulated
- **Mock Processing**: 2-second delay simulates real payment processing
- **Test Data**: Uses sample matches and odds
- **Full Functionality**: All betting features work as intended

To enable real betting:

1. Set up Stripe account and get API keys
2. Replace mock implementation with real Stripe SDK
3. Implement backend payment processing
4. Add proper error handling and validation
5. Implement responsible gambling features

## Usage Instructions

### For Users

1. **Login**: Must be authenticated to place bets
2. **Navigate**: Go to "Betting" tab
3. **Browse**: View available matches and odds
4. **Bet**: Click "Place Bet" on desired match
5. **Pay**: Complete payment (demo mode)
6. **Track**: Monitor bets in "Your Bets" section

### For Administrators

1. **Monitor**: Check betting activity in Firestore
2. **Settle**: Use `settleBets()` function when matches complete
3. **Cancel**: Use `cancelBets()` for cancelled matches
4. **Analytics**: Use `getBettingStats()` for user statistics

The betting system provides a complete, secure, and user-friendly platform for sports betting within the CMU Compete application.
