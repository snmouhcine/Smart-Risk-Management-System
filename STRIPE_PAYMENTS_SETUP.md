# Stripe Payments Setup Instructions

## Overview
The Admin Payments page now fetches real-time payment data directly from Stripe API, providing comprehensive payment information including:
- Complete transaction history with card details
- Refund tracking
- Dispute monitoring
- Upcoming payouts
- Payment method details

## Setup Steps

### 1. Deploy the New Edge Function
Deploy the `stripe-payments` function to Supabase:

```bash
supabase functions deploy stripe-payments
```

### 2. Features

#### Data Sources
- **Stripe Mode**: Real-time data from Stripe API with comprehensive details
- **Database Mode**: Fallback to local database when Stripe is unavailable
- Toggle between sources with the "Source" button

#### Stripe-Specific Features
1. **Enhanced Payment Details**:
   - Card brand and last 4 digits
   - Receipt URLs
   - Refund amounts
   - Dispute indicators

2. **Additional Statistics**:
   - Total refunded amount
   - Active dispute count
   - Upcoming payout information

3. **Payment Status Tracking**:
   - Completed (green)
   - Failed (red)
   - Pending (yellow)
   - Refunded (blue)

## What's Different from Database

### Stripe API Provides:
- **Card Details**: Brand (Visa, Mastercard, etc.), last 4 digits, country
- **Receipt URLs**: Direct links to Stripe-hosted receipts
- **Refund Tracking**: Automatic calculation of refunded amounts
- **Dispute Information**: Real-time dispute status
- **Failure Messages**: Detailed error reasons for failed payments
- **Upcoming Payouts**: Next scheduled bank transfers

### Database Limited To:
- Basic payment records
- User association
- Simple status tracking

## API Data Fetched

The Edge Function fetches:
1. **Charges**: All payment attempts with full details
2. **Payment Intents**: Enhanced payment information
3. **Disputes**: Active dispute cases
4. **Payouts**: Upcoming bank transfers

## Performance Considerations

- Initial load fetches last 100 transactions
- Consider implementing pagination for larger datasets
- Stripe API rate limits apply (100 requests/second)

## Fallback Behavior

If Stripe API fails:
1. Automatically switches to database mode
2. Shows notification about limited features
3. Basic payment data remains accessible

## Testing

1. Toggle between Stripe and Database modes
2. Verify payment details display correctly
3. Check that refunds show proper amounts
4. Confirm receipt links work
5. Monitor for any API errors in console

## Future Enhancements

Consider adding:
- Date range filters for Stripe queries
- Export functionality with Stripe data
- Webhook for real-time updates
- Pagination for large payment histories
- Advanced search with Stripe metadata