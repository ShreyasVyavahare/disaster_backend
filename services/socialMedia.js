const logger = require('../utils/logger');
const cacheManager = require('../utils/cache');

class SocialMediaService {
  constructor() {}

  async getSocialMediaReports(disasterId, keywords = []) {
    const cacheKey = `social_media_${disasterId}_${keywords.join('_')}`;
    return cacheManager.cached(cacheKey, async () => {
      const reports = this.getMockReports(disasterId, keywords);
      logger.info(`Returned ${reports.length} mock social media reports`);
      return {
        source: 'mock',
        reports,
        timestamp: new Date().toISOString()
      };
    }, 1800);
  }

  getMockReports(disasterId, keywords) {
    const mockReports = [
      {
        id: `mock_${Date.now()}_1`,
        content: `#floodrelief Need food and water in Manhattan, NYC`,
        user: 'citizen1',
        created_at: new Date().toISOString(),
        source: 'mock',
        disaster_id: disasterId,
        priority: 'high'
      },
      {
        id: `mock_${Date.now()}_2`,
        content: `Emergency shelter available at Lower East Side, NYC. Contact 555-0123`,
        user: 'responder1',
        created_at: new Date().toISOString(),
        source: 'mock',
        disaster_id: disasterId,
        priority: 'medium'
      },
      {
        id: `mock_${Date.now()}_3`,
        content: `Roads blocked due to flooding. Avoid Brooklyn, NYC area`,
        user: 'volunteer1',
        created_at: new Date().toISOString(),
        source: 'mock',
        disaster_id: disasterId,
        priority: 'high'
      },
      {
        id: `mock_${Date.now()}_4`,
        content: `Medical supplies needed at Queens, NYC. Urgent!`,
        user: 'citizen2',
        created_at: new Date().toISOString(),
        source: 'mock',
        disaster_id: disasterId,
        priority: 'urgent'
      },
      {
        id: `mock_${Date.now()}_5`,
        content: `Power restored in Bronx, NYC area. Relief efforts continuing`,
        user: 'reliefAdmin',
        created_at: new Date().toISOString(),
        source: 'mock',
        disaster_id: disasterId,
        priority: 'low'
      }
    ];
    if (keywords.length > 0) {
      return mockReports.filter(report =>
        keywords.some(keyword =>
          report.content.toLowerCase().includes(keyword.toLowerCase())
        )
      );
    }
    return mockReports;
  }

  analyzeReports(reports) {
    const analysis = {
      needs: [],
      offers: [],
      alerts: [],
      sentiment: 'neutral',
      priority_count: {
        urgent: 0,
        high: 0,
        medium: 0,
        low: 0
      }
    };
    reports.forEach(report => {
      const content = report.content.toLowerCase();
      if (analysis.priority_count[report.priority] !== undefined) {
        analysis.priority_count[report.priority]++;
      }
      if (content.includes('need') || content.includes('require') || content.includes('looking for')) {
        analysis.needs.push({ content: report.content, user: report.user, priority: report.priority });
      }
      if (content.includes('available') || content.includes('offering') || content.includes('can help')) {
        analysis.offers.push({ content: report.content, user: report.user, priority: report.priority });
      }
      if (content.includes('alert') || content.includes('warning') || content.includes('avoid')) {
        analysis.alerts.push({ content: report.content, user: report.user, priority: report.priority });
      }
    });
    const urgentCount = analysis.priority_count.urgent;
    const highCount = analysis.priority_count.high;
    if (urgentCount > 0) {
      analysis.sentiment = 'critical';
    } else if (highCount > 2) {
      analysis.sentiment = 'concerning';
    } else if (analysis.offers.length > analysis.needs.length) {
      analysis.sentiment = 'positive';
    }
    return analysis;
  }
}

module.exports = new SocialMediaService(); 