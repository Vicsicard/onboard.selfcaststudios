import { syncCalendlyEvents } from '../../utils/syncCalendlyEvents';

export default async function handler(req, res) {
  // Only allow GET method for manual syncing
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Parse date parameters if provided
    const startDate = req.query.startDate ? new Date(req.query.startDate) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : undefined;
    
    // Sync Calendly events
    const results = await syncCalendlyEvents({
      startDate,
      endDate
    });
    
    // Return the results
    res.status(200).json({
      message: 'Calendly events synced successfully',
      results
    });
    
  } catch (error) {
    console.error('Error syncing Calendly events:', error);
    res.status(500).json({ message: 'Error syncing Calendly events', error: error.message });
  }
}
