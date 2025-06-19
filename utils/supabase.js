const { createClient } = require('@supabase/supabase-js');
const logger = require('./logger');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  logger.error('Missing Supabase configuration. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('disasters')
      .select('count')
      .limit(1);
    
    if (error) {
      logger.error('Supabase connection test failed:', error);
      return false;
    }
    
    logger.info('✅ Supabase connection successful');
    return true;
  } catch (error) {
    logger.error('Supabase connection test failed:', error);
    return false;
  }
};

// Initialize database tables if they don't exist
const initializeDatabase = async () => {
  try {
    // Create disasters table
    const { error: disastersError } = await supabase.rpc('create_disasters_table_if_not_exists');
    if (disastersError) {
      logger.warn('Disasters table creation:', disastersError.message);
    }

    // Create reports table
    const { error: reportsError } = await supabase.rpc('create_reports_table_if_not_exists');
    if (reportsError) {
      logger.warn('Reports table creation:', reportsError.message);
    }

    // Create resources table
    const { error: resourcesError } = await supabase.rpc('create_resources_table_if_not_exists');
    if (resourcesError) {
      logger.warn('Resources table creation:', resourcesError.message);
    }

    // Create cache table
    const { error: cacheError } = await supabase.rpc('create_cache_table_if_not_exists');
    if (cacheError) {
      logger.warn('Cache table creation:', cacheError.message);
    }

    logger.info('Database initialization completed');
  } catch (error) {
    logger.error('Database initialization failed:', error);
  }
};

module.exports = {
  supabase,
  testConnection,
  initializeDatabase
}; 