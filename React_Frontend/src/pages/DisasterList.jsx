import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Search, Visibility, Edit, Delete, Add } from '@mui/icons-material';
import { disasterAPI } from '../services/api';

const DisasterList = () => {
  const [disasters, setDisasters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDisasters();
  }, []);

  const fetchDisasters = async () => {
    try {
      setLoading(true);
      const response = await disasterAPI.getAll();
      setDisasters(response.data.disasters || []);
    } catch (err) {
      setError('Failed to load disasters');
      console.error('Disaster list error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this disaster?')) {
      try {
        await disasterAPI.delete(id);
        fetchDisasters();
      } catch (err) {
        setError('Failed to delete disaster');
        console.error('Delete error:', err);
      }
    }
  };

  const filteredDisasters = disasters.filter((disaster) => {
    const matchesSearch = disaster.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         disaster.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         disaster.location_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !tagFilter || disaster.tags?.includes(tagFilter);
    
    return matchesSearch && matchesTag;
  });

  const allTags = [...new Set(disasters.flatMap(d => d.tags || []))];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', sm: 'center' }} mb={3} gap={2}>
        <Typography variant="h4">
          Disasters
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          size="large"
          onClick={() => navigate('/disasters/create')}
          sx={{ alignSelf: { xs: 'stretch', sm: 'auto' } }}
        >
          Create Disaster
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Search disasters"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Filter by Tag</InputLabel>
                <Select
                  value={tagFilter}
                  label="Filter by Tag"
                  onChange={(e) => setTagFilter(e.target.value)}
                >
                  <MenuItem value="">All Tags</MenuItem>
                  {allTags.map((tag) => (
                    <MenuItem key={tag} value={tag}>
                      {tag}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {filteredDisasters.map((disaster) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={disaster.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                    {disaster.title}
                  </Typography>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/disasters/${disaster.id}`)}
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => navigate(`/disasters/${disaster.id}/edit`)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(disaster.id)}
                    >
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>

                <Typography color="textSecondary" gutterBottom>
                  {disaster.location_name}
                </Typography>

                <Typography variant="body2" sx={{ mb: 2 }}>
                  {disaster.description.length > 100
                    ? `${disaster.description.substring(0, 100)}...`
                    : disaster.description}
                </Typography>

                <Box display="flex" gap={1} flexWrap="wrap" mb={2}>
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

      {filteredDisasters.length === 0 && (
        <Alert severity="info">
          {disasters.length === 0
            ? 'No disasters found. Create your first disaster to get started.'
            : 'No disasters match your search criteria.'}
        </Alert>
      )}
    </Box>
  );
};

export default DisasterList; 