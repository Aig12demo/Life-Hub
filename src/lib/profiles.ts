import { supabase } from './supabase';
import { Profile, ProfileUpdate, ProfileFormData } from '../types/database';

export class ProfileService {
  /**
   * Get user profile by ID
   */
  static async getProfile(userId: string): Promise<{ data: Profile | null; error: any }> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    return { data, error };
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    profileData: Partial<ProfileFormData>
  ): Promise<{ data: Profile | null; error: any }> {
    const updateData: ProfileUpdate = {
      ...profileData,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  }

  /**
   * Upload profile picture
   */
  static async uploadProfilePicture(
    userId: string,
    file: File
  ): Promise<{ data: { path: string; publicUrl: string } | null; error: any }> {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        return { data: null, error: new Error('File must be an image') };
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        return { data: null, error: new Error('File size must be less than 5MB') };
      }

      // Get file extension
      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!['jpg', 'jpeg', 'png', 'webp'].includes(fileExt || '')) {
        return { data: null, error: new Error('File must be jpg, png, or webp format') };
      }

      const fileName = `${userId}_profile.${fileExt}`;

      // Delete existing profile picture if it exists
      await supabase.storage
        .from('profile_pictures')
        .remove([fileName]);

      // Upload new file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile_pictures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        return { data: null, error: uploadError };
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile_pictures')
        .getPublicUrl(fileName);

      return {
        data: {
          path: uploadData.path,
          publicUrl
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * Update profile avatar URL
   */
  static async updateAvatarUrl(
    userId: string,
    avatarUrl: string
  ): Promise<{ data: Profile | null; error: any }> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  }

  /**
   * Delete profile picture
   */
  static async deleteProfilePicture(
    userId: string
  ): Promise<{ error: any }> {
    try {
      // Remove from storage (try all possible extensions)
      const extensions = ['jpg', 'jpeg', 'png', 'webp'];
      const deletePromises = extensions.map(ext => 
        supabase.storage
          .from('profile_pictures')
          .remove([`${userId}_profile.${ext}`])
      );

      await Promise.all(deletePromises);

      // Update profile to remove avatar_url
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);

      return { error: updateError };
    } catch (error) {
      return { error };
    }
  }

  /**
   * Compress image if needed (client-side)
   */
  static async compressImage(file: File, maxSizeMB: number = 1): Promise<File> {
    return new Promise((resolve) => {
      if (file.size <= maxSizeMB * 1024 * 1024) {
        resolve(file);
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const maxWidth = 800;
        const maxHeight = 800;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          file.type,
          0.8 // Quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  }
}