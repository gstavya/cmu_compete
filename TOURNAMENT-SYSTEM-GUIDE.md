# Tournament System Guide

## Overview

The CMU Compete tournament system allows users to create and participate in competitive tournaments with fair bracket generation based on ELO ratings.

## Features

### Tournament Creation

- **Tournament Organizers**: Any authenticated user can create tournaments
- **Tournament Settings**:
  - Name and description
  - Maximum participants (4, 8, 16, or 32)
  - Start date and time
  - Entry fee (optional)
  - Automatic prize pool calculation

### Tournament Signup

- Users can sign up for upcoming tournaments
- Entry fees are deducted from user balance
- Prevents duplicate signups
- Enforces participant limits

### Fair Bracket Generation

The system uses sophisticated ELO-based seeding to ensure fair competition:

#### ELO-Based Seeding

- Participants are sorted by their current ELO rating (highest to lowest)
- Higher ELO players are seeded to avoid early elimination
- Standard tournament seeding patterns are used:
  - 4 players: [1, 4, 3, 2]
  - 8 players: [1, 8, 4, 5, 3, 6, 7, 2]
  - 16+ players: Extended seeding pattern

#### Bracket Structure

- Single elimination format
- Automatic bye handling for odd participant counts
- Visual bracket display with match progression
- ELO gap warnings for unbalanced matches (>200 point difference)

### Tournament Management

- **Status Tracking**: Upcoming → Active → Completed
- **Bracket Visualization**: Real-time bracket updates
- **Champion Declaration**: Automatic winner identification
- **Match Results**: Track individual match outcomes

## Technical Implementation

### Data Structure

```javascript
// Tournament Document
{
  name: string,
  description: string,
  maxParticipants: number,
  startDate: Date,
  entryFee: number,
  prizePool: number,
  status: 'upcoming' | 'active' | 'completed',
  createdBy: string,
  participants: string[],
  bracket: Match[],
  bracketMetadata: {
    totalParticipants: number,
    totalRounds: number,
    created: string
  }
}

// Match Object
{
  id: string,
  round: number,
  participants: [string, string],
  winner: string,
  completed: boolean,
  isBye: boolean,
  eloDifference: number
}
```

### Key Functions

#### `generateFairBracket(participantIds)`

- Fetches ELO ratings for all participants
- Sorts by ELO rating (highest to lowest)
- Applies standard tournament seeding
- Creates bracket structure with proper match assignments
- Handles byes for odd participant counts

#### `updateBracket(bracket, matchId, winnerId)`

- Updates match results
- Advances winners to next round
- Maintains bracket integrity

#### `isTournamentComplete(bracket)`

- Checks if tournament has finished
- Identifies the champion

## Usage Examples

### Creating a Tournament

1. Click "Create Tournament" button
2. Fill in tournament details:
   - Name: "Spring Championship"
   - Max Participants: 16
   - Start Date: Select future date/time
   - Entry Fee: $10.00
3. Click "Create Tournament"

### Joining a Tournament

1. Browse available tournaments
2. Click "Sign Up" on desired tournament
3. Entry fee is automatically deducted
4. Confirmation message appears

### Starting a Tournament

1. Tournament creator clicks "Start Tournament"
2. System generates fair bracket based on participant ELO ratings
3. Tournament status changes to "Active"
4. Bracket is displayed with first round matches

## ELO Rating Integration

The tournament system integrates with the existing ELO rating system:

- **Rating Fetching**: Automatically retrieves current ELO ratings
- **Fair Seeding**: Higher-rated players avoid early elimination
- **Balance Warnings**: Alerts for matches with large ELO gaps
- **Rating Updates**: Tournament results can update ELO ratings (future feature)

## Security & Permissions

### Firestore Rules

```javascript
// Tournaments collection - public read, authenticated write
match /tournaments/{document} {
  allow read: if true;
  allow write: if request.auth != null;
}
```

### Access Control

- Public read access for tournament browsing
- Authenticated write access for creation/participation
- Creator-only tournament management (start tournament)

## Future Enhancements

### Planned Features

1. **Match Result Input**: Allow manual match result entry
2. **ELO Rating Updates**: Automatic ELO updates after tournaments
3. **Tournament Types**: Double elimination, round-robin, Swiss
4. **Prize Distribution**: Automatic prize pool distribution
5. **Tournament History**: Past tournament results and statistics
6. **Live Updates**: Real-time bracket updates
7. **Tournament Analytics**: Performance statistics and trends

### Integration Opportunities

- **Betting System**: Allow betting on tournament matches
- **Video Uploads**: Tournament match recordings
- **Leaderboard**: Tournament-specific rankings
- **Notifications**: Tournament updates and reminders

## Troubleshooting

### Common Issues

#### "Failed to generate tournament bracket"

- Check that all participants have valid ELO ratings
- Ensure at least 2 participants are signed up
- Verify Firebase connection

#### "Insufficient balance to join tournament"

- User needs sufficient balance for entry fee
- Check user balance in profile

#### "Tournament is full"

- Maximum participants reached
- Wait for next tournament or create new one

### Error Handling

- All errors are displayed to users with helpful messages
- Console logging for debugging
- Graceful fallbacks for missing data

## Best Practices

### For Tournament Organizers

1. Set realistic entry fees
2. Allow adequate signup time
3. Use descriptive tournament names
4. Set appropriate participant limits

### For Participants

1. Check ELO rating before signing up
2. Ensure sufficient balance for entry fees
3. Join tournaments early to secure spots
4. Check tournament start times

### For Developers

1. Always handle async operations properly
2. Validate input data before processing
3. Use proper error handling and user feedback
4. Test bracket generation with various participant counts
