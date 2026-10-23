import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, type, radius } from '../theme/tokens';
import FormField from '../components/FormField';
import PrimaryButton from '../components/PrimaryButton';
import { useDresses } from '../context/DressesContext';
import { apiRequest } from '../auth';

export default function UploadDressScreen({ navigation }) {
  const { addDress } = useDresses();
  const [image, setImage] = useState(null);
  const [name, setName] = useState('');
  const [size, setSize] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Photo library access is needed to pick an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setError('Camera access is needed to take a photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!result.canceled) setImage(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!image) return setError('Add a photo of the garment first.');
    if (!name.trim()) return setError('Give it a name.');
    if (!size.trim()) return setError('Add a size.');

    setSubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const file = image.file || await fetch(image.uri).then((response) => {
          if (!response.ok) throw new Error('Could not read the selected image.');
          return response.blob();
        });
        formData.append('image', file, image.fileName || 'garment.jpg');
      } else {
        formData.append('image', {
          uri: image.uri,
          name: image.fileName || 'garment.jpg',
          type: image.mimeType || 'image/jpeg',
        });
      }

      const uploaded = await apiRequest('upload', {
        method: 'POST',
        body: formData,
      });
      if (typeof uploaded?.image !== 'string' || !uploaded.image) {
        throw new Error('The backend did not return an image URL.');
      }

      const result = await apiRequest('dresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          size: size.trim().toUpperCase(),
          description: description.trim() || 'No description provided.',
          image: uploaded.image,
        }),
      });
      if (!result?.dress?._id) throw new Error('The backend did not return the saved dress ID.');

      addDress(result.dress);
      navigation.goBack();
    } catch (submitError) {
      setError(submitError.message || 'Could not upload this dress. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <Text style={type.h1}>Upload a piece</Text>
      <Text style={[type.body, styles.subtitle]}>Add a photo and a few details for others to try on.</Text>

      {image ? (
        <Pressable onPress={pickFromLibrary}>
          <Image source={{ uri: image.uri }} style={styles.preview} />
          <Text style={styles.changePhoto}>Change photo</Text>
        </Pressable>
      ) : (
        <View style={styles.photoButtons}>
          <Pressable style={styles.photoButton} onPress={takePhoto}>
            <Text style={styles.photoButtonText}>Take a photo</Text>
          </Pressable>
          <Pressable style={styles.photoButton} onPress={pickFromLibrary}>
            <Text style={styles.photoButtonText}>Choose from library</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.form}>
        <FormField label="Name" placeholder="e.g. Ivory Wrap Dress" value={name} onChangeText={setName} />
        <FormField label="Size" placeholder="e.g. M" value={size} onChangeText={setSize} autoCapitalize="characters" />
        <FormField
          label="Description"
          placeholder="Fabric, fit, how it wears..."
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={styles.descriptionField}
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton label="Upload" onPress={handleSubmit} loading={submitting} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bone },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing.lg, color: colors.clay },
  photoButtons: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
  photoButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.emerald,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoButtonText: { color: colors.emerald, fontFamily: type.bodySemiBold?.fontFamily, textAlign: 'center' },
  preview: { width: '100%', aspectRatio: 3 / 4, borderRadius: radius.md, backgroundColor: colors.clayLight },
  changePhoto: { ...type.label, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.lg, textDecorationLine: 'underline' },
  form: { marginTop: spacing.sm },
  descriptionField: { height: 90, textAlignVertical: 'top' },
  error: { ...type.caption, color: colors.error, marginBottom: spacing.md },
});
