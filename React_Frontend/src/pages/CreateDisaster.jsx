import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Grid,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { disasterAPI } from '../services/api';

const CreateDisaster = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    location_name: '',
    description: '',
    tags: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const availableTags = [
    'flood',
    'earthquake',
    'fire',
    'hurricane',
    'tornado',
    'tsunami',
    'volcano',
    'drought',
    'urgent',
    'active',
    'resolved',
  ];

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleTagsChange = (event) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      tags: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!formData.title || !formData.description) {
      setError('Title and description are required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await disasterAPI.create(formData);
      
      navigate(`/disasters/${response.data.disaster.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create disaster');
      console.error('Create disaster error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/disasters');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Create New Disaster
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box component="form" onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Disaster Title"
                  value={formData.title}
                  onChange={handleInputChange('title')}
                  required
                  helperText="Enter a descriptive title for the disaster"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Location Name"
                  value={formData.location_name}
                  onChange={handleInputChange('location_name')}
                  helperText="e.g., Manhattan, NYC (optional - will be extracted from description if not provided)"
                />
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>Tags</InputLabel>
                  <Select
                    multiple
                    value={formData.tags}
                    onChange={handleTagsChange}
                    input={<OutlinedInput label="Tags" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {availableTags.map((tag) => (
                      <MenuItem key={tag} value={tag}>
                        {tag}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid size={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  required
                  multiline
                  rows={4}
                  helperText="Provide a detailed description of the disaster. Location will be automatically extracted if not specified above."
                />
              </Grid>

              <Grid size={12}>
                <Box display="flex" gap={2} justifyContent="flex-end">
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Disaster'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default CreateDisaster; 