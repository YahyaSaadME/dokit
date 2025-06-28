import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  Share,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';

interface News {
  _id: string;
  headline: string;
  summary: {
    en: { audio: string, text: string },
    hi: { audio: string, text: string },
    hi_en: { audio: string, text: string }
  };
  date: string;
  country: string;
  state: string;
  city_town: string;
  genre: string;
  keywords: string;
  url: string;
  img: string;
  createdAt: string;
}

const BookmarkCard = ({ item, onRemove }: { item: News; onRemove: (id: string) => void }) => {
  const [removing, setRemoving] = useState(false);

  const handleShare = async () => {
    try {
      const shareContent = {
        title: item.headline,
        message: `${item.headline}\n\n${item.summary.en.text}\n\nRead more: ${item.url}`,
        url: item.url,
      };
      
      await Share.share(shareContent);
    } catch (error) {
      Alert.alert('Error', 'Failed to share the news');
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      onRemove(item._id);
    } finally {
      setRemoving(false);
    }
  };

  const handleReadMore = () => {
    if (item.url) {
      Linking.openURL(item.url);
    }
  };

  return (
    <View style={styles.bookmarkCard}>
      <Image 
        source={{ uri: item.img || 'https://via.placeholder.com/400x200?text=News' }} 
        style={styles.cardImage}
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <Text style={styles.headline}>{item.headline}</Text>
        <Text style={styles.summaryText} numberOfLines={4}>
          {item.summary.en.text}
        </Text>
        
        <View style={styles.cardFooter}>
          <View style={styles.sourceContainer}>
            <Text style={styles.locationText}>
              {item.city_town}, {item.state}
            </Text>
            <Text style={styles.dateText}>
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={16} color="#007AFF" />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.removeButton]}
              onPress={handleRemove}
              disabled={removing}
            >
              <Ionicons name="trash-outline" size={16} color="#ff6b6b" />
              <Text style={styles.removeButtonText}>
                {removing ? '...' : 'Remove'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.readMoreButton]}
              onPress={handleReadMore}
            >
              <Ionicons name="open-outline" size={16} color="#007AFF" />
              <Text style={styles.readMoreButtonText}>Read</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default function ExploreScreen() {
  const { getBookmarks, removeBookmark } = useAuth();
  const [bookmarks, setBookmarks] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const result = await getBookmarks();
      if (result.success && result.bookmarks) {
        setBookmarks(result.bookmarks);
      } else {
        setError(result.message || 'Failed to load bookmarks');
      }
    } catch (error) {
      setError('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveBookmark = async (newsId: string) => {
    try {
      const result = await removeBookmark(newsId);
      if (result.success) {
        setBookmarks(prev => prev.filter(item => item._id !== newsId));
      } else {
        Alert.alert('Error', result.message || 'Failed to remove bookmark');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to remove bookmark');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bookmarks</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading bookmarks...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Bookmarks</Text>
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={48} color="#ff6b6b" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadBookmarks}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bookmarks</Text>
        <Text style={styles.headerSubtitle}>
          {bookmarks.length} saved article{bookmarks.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {bookmarks.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="bookmark-outline" size={64} color="#ccc" />
          <Text style={styles.emptyTitle}>No bookmarks yet</Text>
          <Text style={styles.emptySubtitle}>
            Save articles you want to read later by tapping the bookmark button
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          renderItem={({ item }) => (
            <BookmarkCard item={item} onRemove={handleRemoveBookmark} />
          )}
          keyExtractor={item => item._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
  },
  listContainer: {
    padding: 20,
  },
  bookmarkCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  cardContent: {
    padding: 20,
  },
  headline: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    lineHeight: 24,
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 16,
  },
  cardFooter: {
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sourceContainer: {
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 11,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  shareButton: {
    backgroundColor: '#f0f8ff',
    borderColor: '#007AFF',
  },
  shareButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#fff',
    borderColor: '#ff6b6b',
  },
  removeButtonText: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '500',
  },
  readMoreButton: {
    backgroundColor: '#fff',
    borderColor: '#007AFF',
  },
  readMoreButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
});