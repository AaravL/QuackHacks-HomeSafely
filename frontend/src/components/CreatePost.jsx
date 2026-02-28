import React, { useContext, useState } from 'react';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import { AppContext } from '../context/AppContext';
import { postsService } from '../services/api';
import '../styles/CreatePost.css';

const CreatePost = ({ onPost }) => {
  const { user, currentLocation, updateLocation } = useContext(AppContext);
  const [formData, setFormData] = useState({
    destination: '',
    mode: 'hybrid',
    startLat: currentLocation?.lat || 0,
    startLng: currentLocation?.lng || 0,
    endLat: 0,
    endLng: 0,
  });
  const [loading, setLoading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await postsService.createPost(
        user.id,
        formData.startLat,
        formData.startLng,
        formData.endLat,
        formData.endLng,
        formData.destination,
        formData.mode
      );
      onPost();
      setFormData({
        destination: '',
        mode: 'hybrid',
        startLat: currentLocation?.lat || 0,
        startLng: currentLocation?.lng || 0,
        endLat: 0,
        endLng: 0,
      });
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = (e) => {
    setFormData((prev) => ({
      ...prev,
      endLat: e.latLng.lat(),
      endLng: e.latLng.lng(),
    }));
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        updateLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setFormData((prev) => ({
          ...prev,
          startLat: position.coords.latitude,
          startLng: position.coords.longitude,
        }));
      });
    }
  };

  return (
    <div className="create-post-container">
      <div className="create-post-card">
        <h2>Create a Trip</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Destination</label>
            <input
              type="text"
              name="destination"
              placeholder="Where are you going?"
              value={formData.destination}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Mode of Transport</label>
            <select name="mode" value={formData.mode} onChange={handleChange}>
              <option value="walking">Walking</option>
              <option value="uber">Uber</option>
              <option value="hybrid">Hybrid (Uber + Walking)</option>
            </select>
          </div>

          <div className="form-group">
            <button
              type="button"
              className="btn-location"
              onClick={useCurrentLocation}
            >
              📍 Use My Current Location
            </button>
          </div>

          <div className="form-group">
            <button
              type="button"
              className="btn-map"
              onClick={() => setMapOpen(!mapOpen)}
            >
              🗺️ Select on Map
            </button>
          </div>

          {mapOpen && isLoaded && (
            <div className="map-container">
              <GoogleMap
                zoom={15}
                center={{
                  lat: formData.startLat,
                  lng: formData.startLng,
                }}
                mapContainerStyle={{ width: '100%', height: '300px' }}
                onClick={handleMapClick}
              >
                {formData.startLat !== 0 && (
                  <Marker
                    position={{
                      lat: formData.startLat,
                      lng: formData.startLng,
                    }}
                    title="Start"
                  />
                )}
                {formData.endLat !== 0 && (
                  <Marker
                    position={{
                      lat: formData.endLat,
                      lng: formData.endLng,
                    }}
                    title="End"
                  />
                )}
              </GoogleMap>
            </div>
          )}

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Trip'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
