import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import { Audio,InterruptionModeAndroid,InterruptionModeIOS } from 'expo-av'
import Slider from '@react-native-community/slider'
import * as TaskManager from 'expo-task-manager'
import * as BackgroundFetch from 'expo-background-fetch'

const BACKGROUND_PLAYBACK_TASK = 'background-playback'

// Register the background task
TaskManager.defineTask(BACKGROUND_PLAYBACK_TASK, async () => {
  // This will run in the background
  return BackgroundFetch.BackgroundFetchResult.NewData
})

export default function MusicPlayer() {
  const [sound, setSound] = useState<Audio.Sound | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [position, setPosition] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const positionRef = useRef(0)

  // Example track (replace with your actual audio file)
  const audioSource = { uri: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' }

  useEffect(() => {
    // Set up audio mode for background playback
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      playThroughEarpieceAndroid: false
    })

    // Register the background fetch task if not already registered
    registerBackgroundPlayback()

    // Load sound
    loadSound()

    // Set up position update interval
    const interval = setInterval(updatePosition, 1000)

    return () => {
      // Clean up
      clearInterval(interval)
      if (sound) {
        sound.unloadAsync()
      }
    }
  }, [])

  const registerBackgroundPlayback = async () => {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_PLAYBACK_TASK, {
        minimumInterval: 60, // 1 minute
        stopOnTerminate: false,
        startOnBoot: true,
      })
    } catch (err) {
      console.log("Background task registration failed:", err)
    }
  }

  const loadSound = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        audioSource,
        { shouldPlay: false },
        onPlaybackStatusUpdate
      )
      setSound(newSound)
      setIsLoaded(true)
    } catch (error) {
      console.log('Error loading sound:', error)
    }
  }

  interface PlaybackStatus {
    isLoaded: boolean
    durationMillis?: number
    positionMillis?: number
    isPlaying?: boolean
  }

  const onPlaybackStatusUpdate = (status: PlaybackStatus) => {
    if (status.isLoaded) {
      setDuration(status.durationMillis || 0)
      setPosition(status.positionMillis || 0)
      positionRef.current = status.positionMillis || 0
      setIsPlaying(!!status.isPlaying)
    }
  }

  const updatePosition = async () => {
    if (sound && isPlaying) {
      const status = await sound.getStatusAsync()
      if (status.isLoaded) {
        setPosition(status.positionMillis)
      }
    }
  }

  const handlePlayPause = async () => {
    if (!sound) return

    if (isPlaying) {
      await sound.pauseAsync()
    } else {
      await sound.playAsync()
    }
  }

  interface HandleSeekProps {
    (value: number): Promise<void>
  }

  const handleSeek: HandleSeekProps = async (value) => {
    if (sound) {
      await sound.setPositionAsync(value)
    }
  }

  interface FormatTime {
    (milliseconds: number | undefined): string
  }

  const formatTime: FormatTime = (milliseconds) => {
    if (!milliseconds) return '00:00'
    
    const totalSeconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <View style={styles.container}>
      <View style={styles.playerContainer}>
        <Text style={styles.title}>Now Playing</Text>
        
        <View style={styles.artworkContainer}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/300' }}
            style={styles.artwork}
          />
        </View>
        
        <Text style={styles.songTitle}>Song Title</Text>
        <Text style={styles.artistName}>Artist Name</Text>
        
        <View style={styles.timelineContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={duration}
            value={position}
            onSlidingComplete={handleSeek}
            minimumTrackTintColor="#1DB954"
            maximumTrackTintColor="#d3d3d3"
            thumbTintColor="#1DB954"
          />
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
        
        <View style={styles.controlsContainer}>
          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlIcon}>⏮️</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.playPauseButton} onPress={handlePlayPause}>
            <Text style={styles.playPauseIcon}>{isPlaying ? '⏸️' : '▶️'}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton}>
            <Text style={styles.controlIcon}>⏭️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 20,
  },
  playerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 30,
  },
  artworkContainer: {
    marginBottom: 30,
  },
  artwork: {
    width: 250,
    height: 250,
    borderRadius: 10,
  },
  songTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  artistName: {
    fontSize: 18,
    color: '#b3b3b3',
    marginBottom: 30,
  },
  timelineContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  timeText: {
    color: '#b3b3b3',
    fontSize: 14,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
  },
  controlButton: {
    padding: 10,
  },
  playPauseButton: {
    padding: 20,
    marginHorizontal: 30,
  },
  controlIcon: {
    fontSize: 24,
    color: 'white',
  },
  playPauseIcon: {
    fontSize: 30,
    color: 'white',
  },
})