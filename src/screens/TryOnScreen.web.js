import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Image } from 'react-native';
import { colors, spacing, type, radius } from '../theme/tokens';
import PrimaryButton from '../components/PrimaryButton';
import { useFavourites } from '../context/FavouritesContext';
import { TryOnEngine } from '../tryon/TryOnEngine';
import { removeBackground } from '../tryon/bgRemoval';
import { generateGarmentGlb } from '../tryon/hunyuanClient';

export default function TryOnScreen({ route, navigation }) {
  const dress = route?.params?.dress || { id: 'custom', name: 'Custom Garment', size: 'M' };
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const resizeRef = useRef(null);
  const cancelledRef = useRef(false);
  const uploadedUrlsRef = useRef(new Set());
  const initialGenTriggeredRef = useRef(false);

  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [glbUrl, setGlbUrl] = useState(route?.params?.initialGlbUrl || null);
  const [adjustments, setAdjustments] = useState({ s: 1, y: 0, z: 0 });

  // Hunyuan3D generation state
  const [genStatus, setGenStatus] = useState('idle'); // 'idle' | 'removing_bg' | 'generating' | 'done' | 'error'
  const [genMessage, setGenMessage] = useState('');
  const [genPreview, setGenPreview] = useState(null);

  const { addFavourite } = useFavourites();
  const ready = status === 'running';

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
      resizeRef.current?.disconnect();
      engineRef.current?.dispose();
      engineRef.current = null;
      uploadedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      uploadedUrlsRef.current.clear();
    };
  }, []);

  // If navigated to with an initial image file, start Hunyuan3D generation immediately
  useEffect(() => {
    if (route?.params?.initialImageFile && !initialGenTriggeredRef.current) {
      initialGenTriggeredRef.current = true;
      handleGenerateFromPhoto(route.params.initialImageFile);
    }
  }, [route?.params?.initialImageFile]);

  useEffect(() => {
    if (!ready || !engineRef.current) return;
    engineRef.current.setMode('clothes').catch((cause) => {
      setError(cause.message || 'Could not load the body tracking model.');
    });
  }, [ready]);

  useEffect(() => {
    if (!ready || !engineRef.current) return;
    if (glbUrl) {
      engineRef.current.setGarment({ kind: 'glb', url: glbUrl }, adjustments).catch((cause) => {
        setError(cause.message || 'Could not load that garment.');
      });
    } else {
      engineRef.current.clearGarment();
    }
  }, [ready, glbUrl, adjustments]);

  const generateFromDressImage = async () => {
    if (!dress?.image) return;
    try {
      setGenStatus('removing_bg');
      setGenMessage('Loading garment photo…');
      setError('');
      const resp = await fetch(dress.image);
      const blob = await resp.blob();
      await handleGenerateFromPhoto(blob);
    } catch (err) {
      console.warn('Could not fetch dress.image directly:', err);
      setError('Could not auto-fetch this dress image. Please select the photo using "Generate from Photo".');
      setGenStatus('idle');
      setGenMessage('');
    }
  };

  const handleGenerateFromPhoto = async (file) => {
    if (!file) return;
    setGenStatus('removing_bg');
    setGenMessage('Removing background…');
    setError('');

    let transparentBlob = file;
    try {
      // 1. In-browser background removal via @imgly/background-removal
      transparentBlob = await removeBackground(file);
      const previewUrl = URL.createObjectURL(transparentBlob);
      uploadedUrlsRef.current.add(previewUrl);
      setGenPreview(previewUrl);
    } catch (bgErr) {
      console.warn('Background removal skipped or failed, falling back to original image:', bgErr);
      try {
        const origPreview = URL.createObjectURL(file);
        uploadedUrlsRef.current.add(origPreview);
        setGenPreview(origPreview);
      } catch { }
      transparentBlob = file;
    }

    try {
      // 2. Generate 3D model via Express proxy -> Hunyuan3D Gradio server
      setGenStatus('generating');
      setGenMessage('Generating 3D model… (this may take 1–3 minutes)');
      const url = await generateGarmentGlb(transparentBlob, (stepMsg) => {
        setGenMessage(stepMsg);
      });

      uploadedUrlsRef.current.add(url);
      setGlbUrl(url);
      setGenStatus('done');
      setGenMessage('3D model ready! Start camera to try it on.');
    } catch (genErr) {
      console.error('generation error:', genErr);
      setGenStatus('error');
      setError(genErr.message || 'generation failed.');
      setGenMessage('');
    }
  };

  const pickGarmentPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/webp,image/jpg';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        handleGenerateFromPhoto(file);
      }
    };
    input.click();
  };

  const pickGarment = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.glb,model/gltf-binary,application/octet-stream';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      uploadedUrlsRef.current.add(url);
      setGlbUrl(url);
      setError('');
    };
    input.click();
  };

  const start = async () => {
    if (!containerRef.current || status === 'loading') return;
    setStatus('loading');
    setError('');

    const container = containerRef.current;
    const stage = document.createElement('div');
    Object.assign(stage.style, {
      position: 'absolute',
      overflow: 'hidden',
      background: '#14171C',
      transform: 'scaleX(-1)',
    });
    container.appendChild(stage);

    const video = document.createElement('video');
    Object.assign(video.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    });
    video.playsInline = true;
    video.muted = true;
    stage.appendChild(video);

    let engine;
    const fitStage = (aspect = engine?.vw / engine?.vh || 4 / 3) => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (!width || !height) return;
      const fittedWidth = Math.min(width, height * aspect);
      const fittedHeight = fittedWidth / aspect;
      Object.assign(stage.style, {
        width: `${fittedWidth}px`,
        height: `${fittedHeight}px`,
        left: `${(width - fittedWidth) / 2}px`,
        top: `${(height - fittedHeight) / 2}px`,
      });
    };
    fitStage();

    try {
      engine = new TryOnEngine(stage, video);
      engineRef.current = engine;
      await engine.start();
      if (cancelledRef.current) {
        engine.dispose();
        return;
      }
      fitStage(engine.vw / engine.vh);
      resizeRef.current = new ResizeObserver(() => fitStage(engine.vw / engine.vh));
      resizeRef.current.observe(container);
      setStatus('running');
    } catch (cause) {
      resizeRef.current?.disconnect();
      resizeRef.current = null;
      engine?.dispose();
      engineRef.current = null;
      stage.remove();
      if (cancelledRef.current) return;
      setError(cause.message || 'Unable to start the camera. Check camera access and try again.');
      setStatus('idle');
    }
  };

  const slider = (label, key, min, max, step) => (
    <View style={styles.slider} key={key}>
      <Text style={styles.sliderLabel}>{label}: {adjustments[key].toFixed(2)}</Text>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={adjustments[key]}
        onChange={(event) => setAdjustments((current) => ({ ...current, [key]: Number(event.target.value) }))}
      />
    </View>
  );

  const handleSave = () => {
    addFavourite(dress);
    setSaved(true);
  };

  const isGenerating = genStatus === 'removing_bg' || genStatus === 'generating';

  return (
    <View style={styles.screen}>
      <View ref={containerRef} style={styles.cameraStage} />
      <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={10}>
        <Text style={styles.backText}>✕</Text>
      </Pressable>

      {!ready && (
        <View style={styles.startPanel}>
          <Text style={styles.title}>Try on {dress.name}</Text>
          <Text style={styles.description}>
            Generate a 3D garment from any photo or upload an existing .glb model.
          </Text>

          {/* Active Generation Progress Card */}
          {isGenerating && (
            <View style={styles.genProgressBox}>
              <View style={styles.genHeaderRow}>
                <ActivityIndicator size="small" color={colors.emerald} style={{ marginRight: spacing.sm }} />
                <Text style={styles.genProgressTitle}>
                  {genStatus === 'removing_bg' ? 'Removing Background…' : 'Generating 3D Model…'}
                </Text>
              </View>
              <Text style={styles.genProgressMsg}>{genMessage}</Text>
              {genPreview && (
                <View style={styles.previewRow}>
                  <Image source={{ uri: genPreview }} style={styles.garmentThumb} resizeMode="contain" />
                  <Text style={styles.thumbLabel}>Isolated Garment</Text>
                </View>
              )}
            </View>
          )}

          {/* Completed Generation Card */}
          {genStatus === 'done' && (
            <View style={styles.genSuccessBox}>
              <Text style={styles.genSuccessTitle}>✓ 3D Garment Ready</Text>
              <Text style={styles.genSuccessMsg}>{genMessage || 'Model loaded! Click Start camera below.'}</Text>
              {genPreview && (
                <Image source={{ uri: genPreview }} style={styles.garmentThumbSmall} resizeMode="contain" />
              )}
            </View>
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}

          {/* If dress has an image and no GLB generated yet, offer one-click 3D creation */}
          {dress?.image && !glbUrl && (
            <Pressable
              onPress={generateFromDressImage}
              style={[styles.aiGenButton, isGenerating && styles.disabledButton]}
              disabled={isGenerating || status === 'loading'}
            >
              <Text style={styles.aiGenButtonText}>
                ✨ Generate 3D from {dress.name} Photo
              </Text>
            </Pressable>
          )}

          {/* Hunyuan3D Generate from Photo Button */}
          <Pressable
            onPress={pickGarmentPhoto}
            style={[styles.aiGenButton, isGenerating && styles.disabledButton]}
            disabled={isGenerating || status === 'loading'}
          >
            <Text style={styles.aiGenButtonText}>
              ✨ {glbUrl ? 'Generate New 3D Garment from Photo' : 'Generate 3D Garment from Photo'}
            </Text>
          </Pressable>

          {/* Upload GLB directly */}
          <Pressable
            onPress={pickGarment}
            style={styles.uploadButton}
            disabled={isGenerating || status === 'loading'}
          >
            <Text style={styles.uploadText}>{glbUrl ? 'Choose a different .glb model' : 'Upload garment model (.glb)'}</Text>
          </Pressable>

          <PrimaryButton
            label={status === 'loading' ? 'Loading camera and models…' : 'Start camera'}
            onPress={start}
            loading={status === 'loading'}
            style={styles.startButton}
          />
        </View>
      )}

      {ready && (
        controlsOpen ? (
          <View style={styles.bottomCard}>
            <View style={styles.panelHeader}>
              <View style={styles.panelHeading}>
                <Text style={styles.dressLabel}>{glbUrl ? (dress.name || '3D Garment') : 'No 3D Garment Loaded'}</Text>
                <Text style={styles.dressMeta}>
                  {glbUrl
                    ? 'Arm tracking follows a humanoid rig or rigid torso fit.'
                    : 'Generate or upload a 3D garment to fit on your body.'}
                </Text>
              </View>
              <Pressable onPress={() => setControlsOpen(false)} style={styles.closeControls}>
                <Text style={styles.uploadText}>Hide</Text>
                <Text style={styles.closeGlyph}>⌄</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Generation Progress in Controls Panel */}
              {isGenerating && (
                <View style={styles.genProgressBox}>
                  <View style={styles.genHeaderRow}>
                    <ActivityIndicator size="small" color={colors.emerald} style={{ marginRight: spacing.sm }} />
                    <Text style={styles.genProgressTitle}>
                      {genStatus === 'removing_bg' ? 'Removing Background…' : 'Hunyuan3D Generating…'}
                    </Text>
                  </View>
                  <Text style={styles.genProgressMsg}>{genMessage}</Text>
                </View>
              )}

              {/* If dress has an image and no GLB loaded, offer one-click 3D creation */}
              {dress?.image && !glbUrl && (
                <Pressable
                  onPress={generateFromDressImage}
                  style={[styles.aiGenButton, isGenerating && styles.disabledButton]}
                  disabled={isGenerating}
                >
                  <Text style={styles.aiGenButtonText}>✨ Generate 3D from {dress.name} Photo</Text>
                </Pressable>
              )}

              {/* Generate from Photo Button */}
              <Pressable
                onPress={pickGarmentPhoto}
                style={[styles.aiGenButton, isGenerating && styles.disabledButton]}
                disabled={isGenerating}
              >
                <Text style={styles.aiGenButtonText}>✨ Generate from Photo</Text>
              </Pressable>

              <Pressable onPress={pickGarment} style={styles.uploadButton} disabled={isGenerating}>
                <Text style={styles.uploadText}>{glbUrl ? 'Choose another .glb model' : 'Upload garment model (.glb)'}</Text>
              </Pressable>

              {glbUrl && (
                <Pressable onPress={() => setGlbUrl(null)} style={styles.secondaryButton}>
                  <Text style={styles.uploadText}>Remove garment</Text>
                </Pressable>
              )}

              {glbUrl && (
                <>
                  {slider('Size', 's', 0.6, 1.8, 0.02)}
                  {slider('Up / down', 'y', -0.6, 0.6, 0.01)}
                  {slider('Forward / back', 'z', -0.5, 0.5, 0.01)}
                </>
              )}

              {!!error && <Text style={styles.error}>{error}</Text>}
              <PrimaryButton
                label={saved ? 'Saved to favourites ✓' : 'Save to favourites'}
                onPress={handleSave}
                variant={saved ? 'outline' : 'solid'}
                style={styles.saveButton}
              />
            </ScrollView>
          </View>
        ) : (
          <View style={styles.compactActions}>
            <Pressable onPress={() => setControlsOpen(true)} style={styles.adjustButton}>
              <Text style={styles.adjustText}>Adjust</Text>
              <Text style={styles.adjustGlyph}>⌃</Text>
            </Pressable>
            <PrimaryButton
              label={saved ? 'Saved ✓' : 'Save'}
              onPress={handleSave}
              variant={saved ? 'outline' : 'solid'}
              style={styles.compactSaveButton}
            />
          </View>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink, overflow: 'hidden' },
  cameraStage: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  backButton: {
    position: 'absolute', top: spacing.xl, left: spacing.md, width: 40, height: 40,
    borderRadius: radius.pill, backgroundColor: 'rgba(20,23,28,0.72)',
    alignItems: 'center', justifyContent: 'center', zIndex: 10,
  },
  backText: { color: colors.bone, fontSize: 18 },
  startPanel: {
    position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md,
    backgroundColor: colors.bone, borderRadius: radius.lg, padding: spacing.lg,
    maxHeight: '85%', overflow: 'auto',
  },
  title: { ...type.h2 },
  description: { ...type.body, color: colors.clay, marginTop: spacing.xs },
  error: { ...type.body, color: colors.error, marginTop: spacing.sm },
  startButton: { marginTop: spacing.md },
  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '48%',
    backgroundColor: colors.bone, borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg, paddingHorizontal: spacing.lg,
    paddingTop: spacing.md, paddingBottom: spacing.md,
  },
  panelHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingBottom: spacing.xs,
  },
  panelHeading: { flex: 1, paddingRight: spacing.sm },
  closeControls: { flexDirection: 'row', alignItems: 'center', padding: spacing.sm },
  closeGlyph: { color: colors.emerald, fontSize: 18, marginLeft: spacing.xs },
  compactActions: {
    position: 'absolute', bottom: spacing.md, left: spacing.md, right: spacing.md,
    flexDirection: 'row', alignItems: 'center',
  },
  adjustButton: {
    minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing.lg, marginRight: spacing.sm,
    borderRadius: radius.pill, backgroundColor: colors.bone,
  },
  adjustText: { ...type.label, color: colors.ink },
  adjustGlyph: { color: colors.emerald, fontSize: 16, marginLeft: spacing.xs },
  compactSaveButton: { flex: 1, paddingVertical: spacing.sm, borderRadius: radius.pill },
  dressLabel: { ...type.dressName },
  dressMeta: { ...type.caption, marginTop: spacing.xs },
  aiGenButton: {
    marginTop: spacing.sm, paddingVertical: 12, alignItems: 'center',
    backgroundColor: '#E7F2EC', borderWidth: 1.5, borderColor: colors.emerald,
    borderRadius: radius.md,
  },
  aiGenButtonText: { ...type.label, color: colors.emerald, fontWeight: '600' },
  disabledButton: { opacity: 0.6 },
  genProgressBox: {
    marginTop: spacing.sm, marginBottom: spacing.xs, padding: spacing.md,
    backgroundColor: '#F3F7F5', borderRadius: radius.md, borderWidth: 1,
    borderColor: '#D3E6DC',
  },
  genHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  genProgressTitle: { ...type.label, color: colors.emerald, fontWeight: '600' },
  genProgressMsg: { ...type.caption, color: colors.ink },
  previewRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm,
    paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: '#E2EDE7',
  },
  garmentThumb: {
    width: 44, height: 44, borderRadius: radius.sm,
    backgroundColor: '#E5EBE8', marginRight: spacing.sm,
  },
  garmentThumbSmall: {
    width: 36, height: 36, borderRadius: radius.sm,
    backgroundColor: '#E5EBE8', marginTop: spacing.xs,
  },
  thumbLabel: { ...type.caption, color: colors.clay, fontSize: 12 },
  genSuccessBox: {
    marginTop: spacing.sm, marginBottom: spacing.xs, padding: spacing.md,
    backgroundColor: '#EEF7F2', borderRadius: radius.md, borderWidth: 1,
    borderColor: '#C7E4D3',
  },
  genSuccessTitle: { ...type.label, color: colors.emerald, fontWeight: '600' },
  genSuccessMsg: { ...type.caption, color: colors.ink, marginTop: 2 },
  uploadButton: {
    marginTop: spacing.sm, paddingVertical: spacing.sm, alignItems: 'center',
    borderWidth: 1, borderColor: colors.clayLight, borderRadius: radius.md,
  },
  secondaryButton: { paddingVertical: spacing.sm, alignItems: 'center' },
  uploadText: { ...type.label, color: colors.emerald },
  colorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  slider: { marginTop: spacing.sm },
  sliderLabel: { ...type.caption, color: colors.ink },
  saveButton: { marginTop: spacing.md, marginBottom: spacing.sm },
});
