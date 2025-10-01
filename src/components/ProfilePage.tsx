import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  User, 
  Camera, 
  Save, 
  Loader2, 
  Upload, 
  X, 
  Check,
  ArrowLeft,
  Shield
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ProfileService } from '../lib/profiles';
import { Profile, ProfileFormData } from '../types/database';

interface ProfilePageProps {
  onBack: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ProfileFormData>({
    nickname: '',
    age: null,
    gender: '',
    height: null,
    height_unit: 'cm',
    weight: null,
    weight_unit: 'kg',
    bio: '',
  });

  // Load profile data
  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await ProfileService.getProfile(user.id);
      if (error) {
        setError('Failed to load profile');
        console.error('Profile load error:', error);
      } else if (data) {
        setProfile(data);
        setFormData({
          nickname: data.nickname || '',
          age: data.age,
          gender: data.gender || '',
          height: data.height,
          height_unit: data.height_unit || 'cm',
          weight: data.weight,
          weight_unit: data.weight_unit || 'kg',
          bio: data.bio || '',
        });
      }
    } catch (err) {
      setError('Failed to load profile');
      console.error('Profile load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Handle form changes
  const handleInputChange = useCallback((
    field: keyof ProfileFormData,
    value: string | number | null
  ) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      setHasChanges(true);
      return newData;
    });
    setError(null);
  }, []);

  // Handle form submission
  const handleSave = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !hasChanges) return;

    // Validate required fields
    if (!formData.nickname.trim()) {
      setError('Nickname is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const { data, error } = await ProfileService.updateProfile(user.id, formData);
      if (error) {
        setError('Failed to save profile');
        console.error('Profile save error:', error);
      } else {
        setProfile(data);
        setHasChanges(false);
        setSuccess('Profile saved successfully!');
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError('Failed to save profile');
      console.error('Profile save error:', err);
    } finally {
      setSaving(false);
    }
  }, [user, formData, hasChanges]);

  // Handle file upload
  const handleFileUpload = useCallback(async (file: File) => {
    if (!user) return;

    setUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Compress image if needed
      const compressedFile = await ProfileService.compressImage(file);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const { data, error } = await ProfileService.uploadProfilePicture(user.id, compressedFile);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        setError(error.message || 'Failed to upload image');
      } else if (data) {
        // Update avatar URL in profile
        const { data: updatedProfile, error: updateError } = await ProfileService.updateAvatarUrl(
          user.id,
          data.publicUrl
        );

        if (updateError) {
          setError('Failed to update profile picture');
        } else {
          setProfile(updatedProfile);
          setSuccess('Profile picture updated successfully!');
          setTimeout(() => setSuccess(null), 3000);
        }
      }
    } catch (err) {
      setError('Failed to upload image');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }, [user]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  // Trigger file input
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Profile</h1>
            <p className="text-gray-600">Manage your personal information</p>
          </div>
        </div>

        {/* Privacy Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 flex items-start">
          <Shield className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
          <p className="text-blue-800 text-sm">
            Your information is safe with us. We never share your data with third parties.
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 flex items-center">
            <Check className="w-5 h-5 mr-2" />
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Profile Picture Section */}
          <div className="text-center mb-8">
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-lg">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600">
                    <User className="w-16 h-16 text-white" />
                  </div>
                )}
              </div>
              
              {/* Upload Button */}
              <button
                onClick={triggerFileInput}
                disabled={uploading}
                className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5" />
                )}
              </button>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="mt-4 max-w-xs mx-auto">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">Uploading... {uploadProgress}%</p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleFileInputChange}
              className="hidden"
            />

            <p className="text-sm text-gray-500 mt-4">
              Upload a profile picture (JPG, PNG, WebP - Max 5MB)
            </p>
          </div>

          {/* Profile Form */}
          <form onSubmit={handleSave} className="space-y-6">
            {/* Nickname */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nickname *
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={(e) => handleInputChange('nickname', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your nickname"
                required
              />
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age
              </label>
              <input
                type="number"
                min="13"
                max="120"
                value={formData.age || ''}
                onChange={(e) => handleInputChange('age', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your age"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleInputChange('gender', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            {/* Height */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Height
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  step="0.1"
                  value={formData.height || ''}
                  onChange={(e) => handleInputChange('height', e.target.value ? parseFloat(e.target.value) : null)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter height"
                />
                <select
                  value={formData.height_unit}
                  onChange={(e) => handleInputChange('height_unit', e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="cm">cm</option>
                  <option value="ft">ft</option>
                </select>
              </div>
            </div>

            {/* Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  step="0.1"
                  value={formData.weight || ''}
                  onChange={(e) => handleInputChange('weight', e.target.value ? parseFloat(e.target.value) : null)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter weight"
                />
                <select
                  value={formData.weight_unit}
                  onChange={(e) => handleInputChange('weight_unit', e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                maxLength={500}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                placeholder="Tell us a bit about yourself..."
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.bio.length}/500 characters
              </p>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={saving || !hasChanges || !formData.nickname.trim()}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};