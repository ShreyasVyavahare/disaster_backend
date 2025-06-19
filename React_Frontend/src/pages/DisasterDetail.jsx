import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  TextField,
  Paper,
  Container,
} from '@mui/material';
import {
  Warning,
  LocationOn,
  Person,
  Schedule,
  Twitter,
  LocalHospital,
  Update,
  VerifiedUser,
  Send,
} from '@mui/icons-material';
import {
  disasterAPI,
  socialMediaAPI,
  resourcesAPI,
  updatesAPI,
  verificationAPI,
} from '../services/api';
import socketService from '../services/socket';

const DisasterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [disaster, setDisaster] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [socialMedia, setSocialMedia] = useState(null);
  const [resources, setResources] = useState(null);
  const [updates, setUpdates] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [verification, setVerification] = useState(null);

  useEffect(() => {
    fetchDisaster();
    fetchSocialMedia();
    fetchResources();
    fetchUpdates();

    socketService.joinDisaster(id);

    const handleDisasterUpdate = (data) => {
      if (data.disaster && data.disaster.id === id) {
        setDisaster(data.disaster);
      }
    };

    const handleSocialMediaUpdate = (data) => {
      if (data.disaster_id === id) {
        fetchSocialMedia();
      }
    };

    socketService.addListener('disaster_updated', handleDisasterUpdate);
    socketService.addListener('social_media_updated', handleSocialMediaUpdate);

    return () => {
      socketService.leaveDisaster(id);
      socketService.removeListener('disaster_updated', handleDisasterUpdate);
      socketService.removeListener('social_media_updated', handleSocialMediaUpdate);
    };
  }, [id]);

  const fetchDisaster = async () => {
    try {
      const response = await disasterAPI.getById(id);
      setDisaster(response.data.disaster);
    } catch (err) {
      setError('Failed to load disaster details');
      console.error('Disaster detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSocialMedia = async () => {
    try {
      const response = await socialMediaAPI.getReports(id);
      setSocialMedia(response.data);
    } catch (err) {
      console.error('Social media error:', err);
    }
  };

  const fetchResources = async () => {
    try {
      const response = await resourcesAPI.getResources(id);
      setResources(response.data);
    } catch (err) {
      console.error('Resources error:', err);
    }
  };

  const fetchUpdates = async () => {
    try {
      const response = await updatesAPI.getUpdates(id);
      setUpdates(response.data);
    } catch (err) {
      console.error('Updates error:', err);
    }
  };

  const handleImageVerification = async () => {
    if (!imageUrl) return;

    try {
      const response = await verificationAPI.verifyImage(id, imageUrl);
      setVerification(response.data.verification);
    } catch (err) {
      setError('Failed to verify image');
      console.error('Image verification error:', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!disaster) {
    return <Alert severity="error">Disaster not found</Alert>;
  }

  return (
    <Container maxWidth={false} disableGutters>
      <Box px={2} py={3} display="flex" flexDirection="column" gap={3} width="100%" height="100%">
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
          <Typography variant="h4" sx={{ wordBreak: 'break-word' }}>
            {disaster.title}
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/disasters')} sx={{ mt: { xs: 2, md: 0 } }}>
            Back to List
          </Button>
        </Box>

        {error && <Alert severity="error">{error}</Alert>}

        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>
                  {disaster.title}
                </Typography>
                <Typography color="textSecondary" gutterBottom>
                  <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                  {disaster.location_name}
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {disaster.description}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {disaster.tags?.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      color={tag === 'urgent' ? 'error' : 'default'}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" alignItems="center">
                    <Person sx={{ mr: 1 }} />
                    <Typography variant="body2">Owner: {disaster.owner_id}</Typography>
                  </Box>
                  <Box display="flex" alignItems="center">
                    <Schedule sx={{ mr: 1 }} />
                    <Typography variant="body2">
                      Created: {new Date(disaster.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 300 }}>
          <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Social Media" icon={<Twitter />} />
            <Tab label="Resources" icon={<LocalHospital />} />
            <Tab label="Official Updates" icon={<Update />} />
            <Tab label="Image Verification" icon={<VerifiedUser />} />
          </Tabs>

          <CardContent sx={{ flex: 1, overflow: 'auto' }}>
            {activeTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Social Media Reports
                </Typography>
                {socialMedia ? (
                  <Box>
                    {socialMedia.analysis && (
                      <Alert severity={socialMedia.analysis.sentiment === 'critical' ? 'error' : 'info'} sx={{ mb: 2 }}>
                        Sentiment: {socialMedia.analysis.sentiment}
                      </Alert>
                    )}
                    <List>
                      {socialMedia.reports?.map((report) => (
                        <ListItem key={report.id} divider>
                          <ListItemIcon>
                            <Twitter color="primary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={report.content}
                            secondary={`${report.user} - ${new Date(report.created_at).toLocaleString()}`}
                          />
                          <Chip
                            label={report.priority}
                            color={report.priority === 'urgent' ? 'error' : 'default'}
                            size="small"
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ) : (
                  <CircularProgress />
                )}
              </Box>
            )}

            {activeTab === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Available Resources
                </Typography>
                {resources ? (
                  <List>
                    {resources.resources?.map((resource) => (
                      <ListItem key={resource.id} divider>
                        <ListItemIcon>
                          <LocalHospital color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={resource.name}
                          secondary={`${resource.location_name} - ${resource.type}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <CircularProgress />
                )}
              </Box>
            )}

            {activeTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Official Updates
                </Typography>
                {updates ? (
                  <List>
                    {updates.updates?.map((update) => (
                      <ListItem key={update.id} divider>
                        <ListItemIcon>
                          <Update color="primary" />
                        </ListItemIcon>
                        <ListItemText
                          primary={update.title}
                          secondary={
                            <Box>
                              <Typography variant="body2">{update.summary}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                {update.source} - {new Date(update.published_at).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <CircularProgress />
                )}
              </Box>
            )}

            {activeTab === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Image Verification
                </Typography>
                <Box display="flex" gap={2} mb={3} flexDirection={{ xs: 'column', sm: 'row' }}>
                  <TextField
                    fullWidth
                    label="Image URL"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Enter image URL to verify"
                  />
                  <Button
                    variant="contained"
                    onClick={handleImageVerification}
                    disabled={!imageUrl}
                    startIcon={<Send />}
                    sx={{ minWidth: 120 }}
                  >
                    Verify
                  </Button>
                </Box>

                {verification && (
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Verification Results
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2">
                          Authentic: {verification.authentic ? 'Yes' : 'No'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2">
                          Confidence: {(verification.confidence * 100).toFixed(1)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2">
                          Manipulation Detected: {verification.manipulation_detected ? 'Yes' : 'No'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Typography variant="body2">
                          Disaster Context: {verification.disaster_context ? 'Yes' : 'No'}
                        </Typography>
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="body2">Notes: {verification.notes}</Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default DisasterDetail;
