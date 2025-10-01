/*
  # Create User Profiles System

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users.id)
      - `nickname` (text)
      - `age` (integer)
      - `gender` (text)
      - `height` (decimal)
      - `height_unit` (text, cm/ft)
      - `weight` (decimal)
      - `weight_unit` (text, kg/lbs)
      - `bio` (text)
      - `avatar_url` (text)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `profiles` table
    - Add policies for users to manage only their own profile
    - Create trigger to auto-create profile on user signup

  3. Storage
    - Create public bucket for profile pictures
    - Add RLS policy for secure file uploads
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text,
  age integer CHECK (age >= 13 AND age <= 120),
  gender text CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
  height decimal(5,2),
  height_unit text CHECK (height_unit IN ('cm', 'ft')) DEFAULT 'cm',
  weight decimal(5,2),
  weight_unit text CHECK (weight_unit IN ('kg', 'lbs')) DEFAULT 'kg',
  bio text CHECK (char_length(bio) <= 500),
  avatar_url text,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create function to handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for profile pictures
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_pictures', 'profile_pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for profile pictures
CREATE POLICY "Users can upload own profile picture"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile_pictures' AND
    name ~ ('^' || auth.uid()::text || '_profile\.(jpg|jpeg|png|webp)$')
  );

CREATE POLICY "Users can update own profile picture"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile_pictures' AND
    name ~ ('^' || auth.uid()::text || '_profile\.(jpg|jpeg|png|webp)$')
  );

CREATE POLICY "Users can delete own profile picture"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile_pictures' AND
    name ~ ('^' || auth.uid()::text || '_profile\.(jpg|jpeg|png|webp)$')
  );

CREATE POLICY "Anyone can view profile pictures"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'profile_pictures');