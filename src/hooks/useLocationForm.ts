import { useState, useCallback } from "react";

interface NewLocationData {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
}

interface SearchResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface UseLocationFormOptions {
  onTriggerFlyTo?: () => void;
  onClearSelection?: () => void;
}

interface UseLocationFormReturn {
  // State
  showAddForm: boolean;
  showFullscreenAddForm: boolean;
  newLocationData: NewLocationData | null;

  // Handlers
  handleMapClick: (result: { lat: number; lng: number; name?: string; address?: string }) => void;
  handleSearchSelect: (result: SearchResult) => void;
  handleFormSuccess: () => void;
  handleFormCancel: () => void;
  setShowFullscreenAddForm: (show: boolean) => void;
}

/**
 * Custom hook for managing location form state and interactions
 *
 * Handles:
 * - Form visibility (inline vs fullscreen)
 * - New location data from map clicks or search
 * - Form success/cancel handlers
 *
 * @param onTriggerFlyTo - Callback to trigger map fly-to animation
 * @param onClearSelection - Callback to clear location selection
 * @returns Location form state and handlers
 */
export function useLocationForm({
  onTriggerFlyTo,
  onClearSelection,
}: UseLocationFormOptions = {}): UseLocationFormReturn {
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFullscreenAddForm, setShowFullscreenAddForm] = useState(false);
  const [newLocationData, setNewLocationData] = useState<NewLocationData | null>(null);

  const handleMapClick = useCallback((result: { lat: number; lng: number; name?: string; address?: string }) => {
    setNewLocationData({
      lat: result.lat,
      lng: result.lng,
      name: result.name,
      address: result.address,
    });
    setShowAddForm(true);
  }, []);

  const handleSearchSelect = useCallback((result: SearchResult) => {
    setNewLocationData({
      lat: result.latitude,
      lng: result.longitude,
      name: result.name,
      address: result.address,
    });
    setShowAddForm(true);
    onTriggerFlyTo?.();
  }, [onTriggerFlyTo]);

  const handleFormSuccess = useCallback(() => {
    setShowAddForm(false);
    setNewLocationData(null);
    setShowFullscreenAddForm(false);
  }, []);

  const handleFormCancel = useCallback(() => {
    setShowAddForm(false);
    setNewLocationData(null);
    onClearSelection?.();
    setShowFullscreenAddForm(false);
  }, [onClearSelection]);

  return {
    showAddForm,
    showFullscreenAddForm,
    newLocationData,
    handleMapClick,
    handleSearchSelect,
    handleFormSuccess,
    handleFormCancel,
    setShowFullscreenAddForm,
  };
}
