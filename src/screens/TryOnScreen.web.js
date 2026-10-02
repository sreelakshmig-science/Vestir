import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { colors, spacing, type, radius } from '../theme/tokens';
import PrimaryButton from '../components/PrimaryButton';
import { useFavourites } from '../context/FavouritesContext';
import { TryOnEngine } from '../tryon/TryOnEngine';

export default function TryOnScreen({ route, navigation }) {
  const { dress } = route.params;
  const containerRef = useRef(null);
  const engineRef = useRef(null);
  const resizeRef = useRef(null);
  const cancelledRef = useRef(false);
  const uploadedUrlsRef = useRef(new Set());
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [glbUrl, setGlbUrl] = useState(null);
  const [teeColor, setTeeColor] = useState('#2563eb');
  const [adjustments, setAdjustments] = useState({ s: 1, y: 0, z: 0 });
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

  useEffect(() => {
    if (!ready || !engineRef.current) return;
    engineRef.current.setMode('clothes').catch((cause) => {
      setError(cause.message || 'Could not load the body tracking model.');
    });
  }, [ready]);

  useEffect(() => {
    if (!ready || !engineRef.current) return;
    const garment = glbUrl ? { kind: 'glb', url: glbUrl } : { kind: 'tee', color: teeColor };
    engineRef.current.setGarment(garment, adjustments).catch((cause) => {
      setError(cause.message || 'Could not load that garment.');
    });
  }, [ready, glbUrl, teeColor, adjustments]);

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
    <View style={styles.slider}>
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
            Start the camera to put on a 3D demo shirt, or upload a garment model in .glb format.
          </Text>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable onPress={pickGarment} style={styles.uploadButton} disabled={status === 'loading'}>
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
                <Text style={styles.dressLabel}>{glbUrl ? 'Uploaded 3D garment' : '3D demo tee'}</Text>
                <Text style={styles.dressMeta}>
                  {glbUrl ? 'Arm tracking follows a humanoid rig.' : 'Raise and bend your arms to see it deform.'}
                </Text>
              </View>
              <Pressable onPress={() => setControlsOpen(false)} style={styles.closeControls}>
                <Text style={styles.uploadText}>Hide</Text>
                <Text style={styles.closeGlyph}>⌄</Text>
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Pressable onPress={pickGarment} style={styles.uploadButton}>
                <Text style={styles.uploadText}>{glbUrl ? 'Choose another .glb model' : 'Upload garment model (.glb)'}</Text>
              </Pressable>
              {glbUrl ? (
                <Pressable onPress={() => setGlbUrl(null)} style={styles.secondaryButton}>
                  <Text style={styles.uploadText}>Use built-in skinned tee</Text>
                </Pressable>
              ) : (
                <View style={styles.colorRow}>
                  <Text style={styles.sliderLabel}>Demo tee color</Text>
                  <input
                    aria-label="Demo tee color"
                    type="color"
                    value={teeColor}
                    onChange={(event) => setTeeColor(event.target.value)}
                  />
                </View>
              )}
              {slider('Size', 's', 0.6, 1.8, 0.02)}
              {slider('Up / down', 'y', -0.6, 0.6, 0.01)}
              {slider('Forward / back', 'z', -0.5, 0.5, 0.01)}
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
    alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: colors.bone, fontSize: 18 },
  startPanel: {
    position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md,
    backgroundColor: colors.bone, borderRadius: radius.lg, padding: spacing.lg,
  },
  title: { ...type.h2 },
  description: { ...type.body, color: colors.clay, marginTop: spacing.xs },
  error: { ...type.body, color: colors.error, marginTop: spacing.sm },
  startButton: { marginTop: spacing.md },
  bottomCard: {
    position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '46%',
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
