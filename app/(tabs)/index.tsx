import React from 'react';
import { View, Text, Button, Image, StyleSheet } from 'react-native';
import { AudioPro, useAudioPro } from 'react-native-audio-pro';

// 🎧 Track info
const track = {
  id: '1',
  url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  title: 'Sample Track',
  artist: 'Artist Name',
  artwork: 'https://assets.weforum.org/article/image/0ZUBmNNVLRCfn3NdU55nQ00UF64m2ObtcDS0grx02fA.jpg',
};

export default function AudioPlayer() {
  const {
    state,            // 'IDLE', 'PLAYING', 'PAUSED', etc
    position,         // ms
    duration,         // ms
    playbackSpeed,    // e.g., 1.0
    volume,           // 0.0–1.0
    error,            // last error or null
    playingTrack,     // current track object
  } = useAudioPro();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{track.title} — {track.artist}</Text>
      <Image source={{ uri: track.artwork }} style={styles.artwork} />

      <Text style={styles.status}>State: {state}</Text>
      <Text style={styles.progress}>
        {Math.floor(position/1000)}s / {Math.floor(duration/1000)}s
      </Text>

      {error && <Text style={styles.error}>Error: {JSON.stringify(error)}</Text>}

      <View style={styles.controls}>
        <Button title="▶ Play"  onPress={() => AudioPro.play(track)} />
        <Button title="⏸ Pause" onPress={() => AudioPro.pause()} />
        <Button title="■ Stop"  onPress={() => AudioPro.stop()} />
      </View>

      <View style={styles.controls}>
        <Button title="⏩ +30s" onPress={() => AudioPro.seekForward(30_000)} />
        <Button title="⏪ -30s" onPress={() => AudioPro.seekBack(30_000)} />
      </View>

      <View style={styles.controls}>
        <Button title="Speed ×1.5" onPress={() => AudioPro.setPlaybackSpeed(1.5)} />
        <Button title="Vol 50%" onPress={() => AudioPro.setVolume(0.5)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center' },
  title:     { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  artwork:   { width: 200, height: 200, marginBottom: 10 },
  status:    { marginVertical: 5 },
  progress:  { marginBottom: 10 },
  error:     { color: 'red', marginBottom: 10 },
  controls:  { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginVertical: 5 },
});
