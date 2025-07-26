import { supabase } from '../lib/supabase'

/**
 * Logger utility for tracking events and errors
 * Logs to Supabase in production, console in development
 */
export const logger = {
  async log(level, message, metadata = {}) {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      // Log to console in all environments
      const logMessage = `[${level.toUpperCase()}] ${message}`
      const logData = { userId: user?.id, ...metadata }
      
      switch (level) {
        case 'error':
          console.error(logMessage, logData)
          break
        case 'warning':
          console.warn(logMessage, logData)
          break
        default:
          console.log(logMessage, logData)
      }
      
      // Only log to database in production
      if (import.meta.env.PROD) {
        await supabase.from('app_logs').insert({
          user_id: user?.id,
          level,
          message,
          metadata: {
            ...metadata,
            user_agent: navigator.userAgent,
            url: window.location.href,
            timestamp: new Date().toISOString()
          }
        })
      }
    } catch (error) {
      // Fallback to console if logging fails
      console.error('Logger error:', error)
    }
  },
  
  // Convenience methods
  info: (message, metadata) => logger.log('info', message, metadata),
  warning: (message, metadata) => logger.log('warning', message, metadata),
  error: (message, metadata) => logger.log('error', message, metadata),
  
  // Track specific events
  async trackEvent(eventName, properties = {}) {
    return logger.info(`Event: ${eventName}`, { 
      event_name: eventName,
      properties 
    })
  },
  
  // Track page views
  async trackPageView(pageName) {
    return logger.info(`Page View: ${pageName}`, { 
      page: pageName,
      referrer: document.referrer 
    })
  },
  
  // Track errors with stack trace
  async trackError(error, context = {}) {
    return logger.error(error.message, {
      error_name: error.name,
      stack_trace: error.stack,
      context
    })
  }
}

// Export for use in React components
export default logger