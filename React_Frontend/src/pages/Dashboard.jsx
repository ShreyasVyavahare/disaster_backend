import { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Warning, LocationOn, People, Update } from '@mui/icons-material';
import { disasterAPI, healthAPI } from '../services/api';

const Dashboard = () => {
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [healthStatus, setHealthStatus] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Check API health
        const healthResponse = await healthAPI.check();
        setHealthStatus(healthResponse.data);

        // Fetch disasters
        const disastersResponse = await disasterAPI.getAll({ limit: 10 });
        setDisasters(disastersResponse.data.disasters || []);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getDisasterStats = () => {
    const total = disasters.length;
    const active = disasters.filter(d => d.tags?.includes('active')).length;
    const urgent = disasters.filter(d => d.tags?.includes('urgent')).length;
    
    return { total, active, urgent };
  };

  const stats = getDisasterStats();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {healthStatus && (
        <Alert severity="success" sx={{ mb: 3 }}>
          API Status: {healthStatus.status} - Environment: {healthStatus.environment}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <Warning color="primary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Disasters
                  </Typography>
                  <Typography variant="h4">
                    {stats.total}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <LocationOn color="secondary" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Disasters
                  </Typography>
                  <Typography variant="h4">
                    {stats.active}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <People color="error" sx={{ mr: 2 }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Urgent Cases
                  </Typography>
                  <Typography variant="h4">
                    {stats.urgent}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Disasters */}
      <Typography variant="h5" gutterBottom>
        Recent Disasters
      </Typography>

      <Grid container spacing={2}>
        {disasters.map((disaster) => (
          <Grid size={{ xs: 12, md: 6 }} key={disaster.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {disaster.title}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  {disaster.location_name}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  {disaster.description}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {disaster.tags?.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      color={tag === 'urgent' ? 'error' : 'default'}
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="textSecondary">
                  Created: {new Date(disaster.created_at).toLocaleDateString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {disasters.length === 0 && (
        <Alert severity="info">
          No disasters found. Create your first disaster to get started.
        </Alert>
      )}
    </Box>
  );
};

export default Dashboard; 