import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ActivityIndicator, 
  TouchableOpacity, 
  SafeAreaView, 
  Linking, 
  Dimensions, 
  FlatList,
  StatusBar,
  TextInput,
  ScrollView,
  Share,
  Alert,
  Platform,
  Animated,
  Modal
} from 'react-native'
import React, { useEffect, useState, useRef } from 'react'
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import DetailedNewsCard from '../../components/DetailedNewsCard';
import { News } from '../../types/news';

const TAGS = ['All', 'Politics', 'Sports', 'Tech', 'Business', 'World', 'India', 'Health', 'Science'];

// Clean, modern news card component with enhanced design and functionality
const NewsCard = ({ item, onCardPress }: { item: News; onCardPress: (news: News) => void }) => {
  const { addBookmark, removeBookmark, isBookmarked, token } = useAuth();
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [isLiked, setIsLiked] = useState(item.isLiked || false);
  const [likesCount, setLikesCount] = useState(item.likes?.length || 0);
  const [views, setViews] = useState(item.views || 0);
  const [commentsCount, setCommentsCount] = useState(item.comments?.length || 0);
  const [viewStartTime, setViewStartTime] = useState<number | null>(null);
  const [impressionInterval, setImpressionInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const [showLikeAnimation, setShowLikeAnimation] = useState(false);

  const heartScale = useRef(new Animated.Value(1)).current;
  const cardScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Start tracking impression when card is visible
    startImpressionTracking();
    
    return () => {
      stopImpressionTracking();
    };
  }, []);

  const startImpressionTracking = () => {
    setViewStartTime(Date.now());
    const interval = setInterval(() => {
      recordImpression(1000);
    }, 1000);
    setImpressionInterval(interval);
  };

  const stopImpressionTracking = () => {
    if (impressionInterval) {
      clearInterval(impressionInterval);
      const duration = Date.now() - (viewStartTime || Date.now());
      if (duration > 3000) {
        recordImpression(duration, true);
      }
    }
  };

  const recordImpression = async (duration: number, isComplete = false) => {
    try {
      const response = await fetch(`http://10.0.2.2:3000/api/social/news/${item._id}/impression`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ duration, isComplete }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setViews(data.views);
      }
    } catch (error) {
      console.error('Failed to record impression:', error);
    }
  };

  const handleDoubleTap = () => {
    if (!isLiked) {
      handleLike();
      // Enhanced heart animation
      setShowLikeAnimation(true);
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => setShowLikeAnimation(false), 500);
      });
    }
  };

  const handleLike = async () => {
    try {
      // Optimistic update
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

      const response = await fetch(`http://10.0.2.2:3000/api/social/news/${item._id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.isLiked);
        setLikesCount(data.likesCount);
      } else {
        // Revert on error
        setIsLiked(!newLikedState);
        setLikesCount(prev => !newLikedState ? prev + 1 : prev - 1);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : prev - 1);
      Alert.alert('Error', 'Failed to like the news');
    }
  };

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

  const handleBookmark = async () => {
    if (bookmarkLoading) return;
    
    setBookmarkLoading(true);
    try {
      const isCurrentlyBookmarked = isBookmarked(item._id);
      
      if (isCurrentlyBookmarked) {
        await removeBookmark(item._id);
      } else {
        await addBookmark(item._id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update bookmark');
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleReadMore = () => {
    if (item.url) {
      Linking.openURL(item.url);
    }
  };

  const handleCardPress = () => {
    // Card press animation
    Animated.sequence([
      Animated.timing(cardScale, {
        toValue: 0.98,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(cardScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onCardPress(item);
    });
  };

  const isCurrentlyBookmarked = isBookmarked(item._id);

  return (
    <Animated.View style={[styles.newsCard, { transform: [{ scale: cardScale }] }]}>
      <TouchableOpacity 
        style={styles.cardImageContainer} 
        onPress={handleDoubleTap}
        activeOpacity={1}
      >
        <Image 
          source={{ uri: item.img || 'https://via.placeholder.com/400x200?text=News' }} 
          style={styles.cardImage}
          resizeMode="cover"
        />
        {showLikeAnimation && (
          <Animated.View style={[styles.heartOverlay, { transform: [{ scale: heartScale }] }]}>
            <Ionicons name="heart" size={80} color="#ff6b6b" />
          </Animated.View>
        )}
        <View style={styles.imageOverlay}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{item.genre || 'News'}</Text>
          </View>
        </View>
      </TouchableOpacity>
      
      <View style={styles.cardContent}>
        <TouchableOpacity onPress={handleCardPress} activeOpacity={0.9}>
          <Text style={styles.headline} numberOfLines={3}>
            {item.headline}
          </Text>
          <Text style={styles.summaryText} numberOfLines={4}>
            {item.summary.en.text}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.cardFooter}>
          <View style={styles.sourceContainer}>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={14} color="#666" />
              <Text style={styles.locationText}>
                {item.city_town}, {item.state}
              </Text>
            </View>
            <Text style={styles.dateText}>
              {new Date(item.date).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </View>
          
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.likeButton, isLiked && styles.likedButton]}
              onPress={handleLike}
            >
              <Ionicons 
                name={isLiked ? "heart" : "heart-outline"} 
                size={18} 
                color={isLiked ? "#ff6b6b" : "#666"} 
              />
              <Text style={[styles.actionButtonText, isLiked && styles.likedText]}>
                {likesCount}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.commentButton]}
              onPress={() => onCardPress(item)}
            >
              <Ionicons name="chatbubble-outline" size={18} color="#666" />
              <Text style={styles.actionButtonText}>{commentsCount}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.viewButton]}
            >
              <Ionicons name="eye-outline" size={18} color="#666" />
              <Text style={styles.actionButtonText}>{views}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.shareButton]}
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={18} color="#007AFF" />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.bookmarkButton, isCurrentlyBookmarked && styles.bookmarked]}
              onPress={handleBookmark}
              disabled={bookmarkLoading}
            >
              <Ionicons 
                name={isCurrentlyBookmarked ? "bookmark" : "bookmark-outline"} 
                size={18} 
                color={isCurrentlyBookmarked ? "#007AFF" : "#666"} 
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.readMoreButton]}
              onPress={handleReadMore}
            >
              <Ionicons name="open-outline" size={18} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const { width, height } = Dimensions.get('window');
const CARD_HEIGHT = 600; // Set a common/fixed card height for all cards

// Card Loader Component
const CardLoader = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View style={[styles.loaderCard, { opacity }]}>
      <View style={styles.loaderImage} />
      <View style={styles.loaderContent}>
        <View style={styles.loaderTitle} />
        <View style={styles.loaderText} />
        <View style={styles.loaderText} />
        <View style={styles.loaderText} />
        <View style={styles.loaderFooter}>
          <View style={styles.loaderLocation} />
          <View style={styles.loaderDate} />
        </View>
        <View style={styles.loaderButtons}>
          <View style={styles.loaderButton} />
          <View style={styles.loaderButton} />
          <View style={styles.loaderButton} />
        </View>
      </View>
    </Animated.View>
  );
};

// Category Card Loader Component
const CategoryCardLoader = () => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View style={[styles.loaderCategorySection, { opacity }]}>
      <View style={styles.loaderCategoryHeader}>
        <View style={styles.loaderCategoryTitleContainer}>
          <View style={styles.loaderCategoryEmoji} />
          <View style={styles.loaderCategoryTitle} />
        </View>
        <View style={styles.loaderSeeAll} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
        {[1, 2, 3].map((_, index) => (
          <View key={index} style={styles.loaderCategoryNewsCard}>
            <View style={styles.loaderCategoryNewsImage} />
            <View style={styles.loaderCategoryNewsContent}>
              <View style={styles.loaderCategoryNewsTitle} />
              <View style={styles.loaderCategoryNewsLocation} />
            </View>
          </View>
        ))}
      </ScrollView>
    </Animated.View>
  );
};

export default function Index() {
  const [news, setNews] = useState<News[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewableItemIndex, setViewableItemIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [showDetailedNews, setShowDetailedNews] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const { user, token } = useAuth();

  useEffect(() => {
    fetchNews();
    StatusBar.setBarStyle('dark-content');
    StatusBar.setBackgroundColor('#fff');
  }, []);

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to fetch from regular news endpoint (no auth required)
      let response = await fetch('http://10.0.2.2:3000/api/news');
      let result = await response.json();
      
      if (result.data && result.data.length > 0) {
        // Transform the data to match our News type
        const transformedNews = result.data.map((item: any) => ({
          ...item,
          isLiked: false,
          likes: [],
          comments: [],
          views: 0,
          impressions: []
        }));
        setNews(transformedNews);
        return;
      }
      
      // If no news from regular endpoint, try social endpoint with auth
      if (token) {
        response = await fetch('http://10.0.2.2:3000/api/social/news', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
          setNews(result.data);
          return;
        }
      }
      
      // // If still no news, create some dummy news to ensure the app works
      // const dummyNews: News[] = [
      //   {
      //     _id: '1',
      //     headline: 'Welcome to Dokit - Your News Companion',
      //     summary: {
      //       en: { audio: '', text: 'Dokit brings you the latest news from around the world. Stay informed with personalized content tailored just for you.' },
      //       hi: { audio: '', text: 'डोकिट आपको दुनिया भर की ताज़ा खबरें लाता है। आपके लिए तैयार की गई व्यक्तिगत सामग्री के साथ सूचित रहें।' },
      //       hi_en: { audio: '', text: 'Dokit brings you the latest news from around the world. Stay informed with personalized content tailored just for you.' }
      //     },
      //     img: 'https://via.placeholder.com/400x200?text=Dokit+News',
      //     url: 'https://dokit.com',
      //     city_town: 'Mumbai',
      //     state: 'Maharashtra',
      //     country: 'India',
      //     date: new Date().toISOString(),
      //     createdAt: new Date().toISOString(),
      //     genre: 'General',
      //     keywords: 'news, information',
      //     isLiked: false,
      //     likes: [],
      //     comments: [],
      //     views: 0
      //   },
      //   {
      //     _id: '2',
      //     headline: 'Technology Trends 2024',
      //     summary: {
      //       en: { audio: '', text: 'Explore the latest technology trends that are shaping our future. From AI to sustainable tech, discover what\'s next.' },
      //       hi: { audio: '', text: 'उन नवीनतम तकनीकी रुझानों का अन्वेषण करें जो हमारे भविष्य को आकार दे रहे हैं। एआई से लेकर स्थायी तकनीक तक, जानें क्या आगे है।' },
      //       hi_en: { audio: '', text: 'Explore the latest technology trends that are shaping our future. From AI to sustainable tech, discover what\'s next.' }
      //     },
      //     img: 'https://via.placeholder.com/400x200?text=Tech+News',
      //     url: 'https://tech-news.com',
      //     city_town: 'Bangalore',
      //     state: 'Karnataka',
      //     country: 'India',
      //     date: new Date().toISOString(),
      //     createdAt: new Date().toISOString(),
      //     genre: 'Tech',
      //     keywords: 'technology, innovation',
      //     isLiked: false,
      //     likes: [],
      //     comments: [],
      //     views: 0
      //   },
      //   {
      //     _id: '3',
      //     headline: 'Sports Highlights Today',
      //     summary: {
      //       en: { audio: '', text: 'Get the latest sports updates, match results, and athlete performances from around the world.' },
      //       hi: { audio: '', text: 'दुनिया भर से ताज़ा खेल अपडेट, मैच के परिणाम और एथलीटों के प्रदर्शन प्राप्त करें।' },
      //       hi_en: { audio: '', text: 'Get the latest sports updates, match results, and athlete performances from around the world.' }
      //     },
      //     img: 'https://via.placeholder.com/400x200?text=Sports+News',
      //     url: 'https://sports-news.com',
      //     city_town: 'Delhi',
      //     state: 'Delhi',
      //     country: 'India',
      //     date: new Date().toISOString(),
      //     createdAt: new Date().toISOString(),
      //     genre: 'Sports',
      //     keywords: 'sports, athletics',
      //     isLiked: false,
      //     likes: [],
      //     comments: [],
      //     views: 0
      //   }
      // ];
      
      // setNews(dummyNews);
      // console.log('Using dummy news data');
      
    } catch (err) {
      console.error('Fetch news error:', err);
      setError('Failed to fetch news');
      
      // Even if there's an error, show dummy news
      const fallbackNews: News[] = [
        {
          _id: 'fallback1',
          headline: 'Dokit News Service',
          summary: {
            en: { audio: '', text: 'Welcome to Dokit! We\'re here to keep you informed with the latest news and updates.' },
            hi: { audio: '', text: 'डोकिट में आपका स्वागत है! हम आपको ताज़ा खबरों और अपडेट के साथ सूचित रखने के लिए यहाँ हैं।' },
            hi_en: { audio: '', text: 'Welcome to Dokit! We\'re here to keep you informed with the latest news and updates.' }
          },
          img: 'https://via.placeholder.com/400x200?text=Dokit',
          url: 'https://dokit.com',
          city_town: 'Mumbai',
          state: 'Maharashtra',
          country: 'India',
          date: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          genre: 'General',
          keywords: 'news',
          isLiked: false,
          likes: [],
          comments: [],
          views: 0
        }
      ];
      setNews(fallbackNews);
    } finally {
      setLoading(false);
    }
  };

  const onViewableItemsChanged = React.useRef(({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
    if (viewableItems.length > 0) {
      setViewableItemIndex(viewableItems[0].index ?? 0);
    }
  });

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50
  };

  // Filter news by search and tag
  const filteredNews = news.filter(item => {
    const matchesSearch = item.headline.toLowerCase().includes(search.toLowerCase()) || item.summary.en.text.toLowerCase().includes(search.toLowerCase());
    const matchesTag = selectedTag === 'All' || item.genre?.toLowerCase() === selectedTag.toLowerCase() || item.keywords?.toLowerCase().includes(selectedTag.toLowerCase());
    return matchesSearch && matchesTag;
  });

  // Get trending news (most recent)
  const trendingNews = news.slice(0, 3);

  // Get today's headlines
  const today = new Date().toDateString();
  const todaysHeadlines = news.filter(item => 
    new Date(item.date).toDateString() === today
  ).slice(0, 3);

  // Get user's preferred categories news
  const userPreferredNews = user?.categories ? 
    news.filter(item => 
      user.categories?.some(category => 
        item.genre?.toLowerCase().includes(category.toLowerCase()) ||
        item.keywords?.toLowerCase().includes(category.toLowerCase())
      )
    ).slice(0, 3) : [];

  // Handle card press to show detailed view
  const handleCardPress = (news: News) => {
    setSelectedNews(news);
    setShowDetailedNews(true);
  };

  // Handle "See All" for trending
  const handleSeeAllTrending = () => {
    // Navigate to trending screen or filter
    setSelectedTag('All');
    // You can implement a dedicated trending screen here
  };

  // Handle "See All" for today's headlines
  const handleSeeAllHeadlines = () => {
    // Filter to show only today's news
    setSelectedTag('All');
    // You can implement a dedicated today's headlines screen here
  };

  // Handle "See All" for user interests
  const handleSeeAllInterests = () => {
    // Filter to show only user's preferred categories
    setSelectedTag('All');
    // You can implement a dedicated interests screen here
  };

  // Render category card
  const renderCategoryCard = (title: string, news: News[], emoji: string, onSeeAll: () => void) => {
    if (news.length === 0) return null;

    return (
      <View style={styles.categorySection}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryTitleContainer}>
            <Text style={styles.categoryEmoji}>{emoji}</Text>
            <Text style={styles.categoryTitle}>{title}</Text>
          </View>
          <TouchableOpacity style={styles.seeAllButton} onPress={onSeeAll}>
            <Text style={styles.seeAllText}>See All</Text>
            <Ionicons name="chevron-forward" size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {news.map((item, index) => (
            <TouchableOpacity key={item._id} style={styles.categoryNewsCard} onPress={() => handleCardPress(item)}>
              <Image 
                source={{ uri: item.img || 'https://via.placeholder.com/200x120?text=News' }} 
                style={styles.categoryNewsImage}
                resizeMode="cover"
              />
              <View style={styles.categoryNewsContent}>
                <Text style={styles.categoryNewsTitle} numberOfLines={2}>
                  {item.headline}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render header section with category cards
  const renderHeader = () => (
    <View style={styles.headerSection}>
      {renderCategoryCard('Trending', trendingNews, '🔥', handleSeeAllTrending)}
      {renderCategoryCard('Today\'s Headlines', todaysHeadlines, '📰', handleSeeAllHeadlines)}
      {userPreferredNews.length > 0 && 
        renderCategoryCard('Your Interests', userPreferredNews, '⭐', handleSeeAllInterests)
      }
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logoText}>Dokit</Text>
          <View style={styles.headerRight}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search news..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#888"
            />
            <TouchableOpacity style={styles.notificationIcon}>
              <Ionicons name="notifications-outline" size={26} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Tag list */}
        <View style={styles.tagsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScrollContent}>
            {TAGS.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, selectedTag === tag && styles.tagSelected]}
                onPress={() => setSelectedTag(tag)}
              >
                <Text style={[styles.tagText, selectedTag === tag && styles.tagTextSelected]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Loading Cards */}
        <FlatList
          data={[1, 2, 3]} // Show 3 loading cards
          renderItem={() => <CardLoader />}
          keyExtractor={(_, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.headerSection}>
              <CategoryCardLoader />
              <CategoryCardLoader />
              <CategoryCardLoader />
            </View>
          }
        />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchNews}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logoText}>Dokit</Text>
        <View style={styles.headerRight}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search news..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#888"
          />
          <TouchableOpacity style={styles.notificationIcon}>
            <Ionicons name="notifications-outline" size={26} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Tag list */}
      <View style={styles.tagsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScrollContent}>
          {TAGS.map(tag => (
            <TouchableOpacity
              key={tag}
              style={[styles.tag, selectedTag === tag && styles.tagSelected]}
              onPress={() => setSelectedTag(tag)}
            >
              <Text style={[styles.tagText, selectedTag === tag && styles.tagTextSelected]}>{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* News cards */}
      <FlatList
        ref={flatListRef}
        data={filteredNews}
        renderItem={({ item }) => <NewsCard item={item} onCardPress={handleCardPress} />}
        keyExtractor={item => item._id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Ionicons name="newspaper-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No news found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search or filters</Text>
          </View>
        }
        style={{backgroundColor: '#fff'}}
      />

      {/* Detailed News Modal */}
      <DetailedNewsCard
        visible={showDetailedNews}
        news={selectedNews}
        onClose={() => {
          setShowDetailedNews(false);
          setSelectedNews(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 16,
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  notificationIcon: {
    padding: 8,
  },
  tagsContainer: {
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tagsScrollContent: {
    paddingHorizontal: 20,
  },
  tag: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  tagSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tagText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#fff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    color: '#ff6b6b',
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 2,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  newsCard: {
    height: CARD_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginHorizontal: 20,
    marginVertical: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  cardImageContainer: {
    position: 'relative',
    width: '100%',
    height: CARD_HEIGHT * 0.4,
  },
  cardImage: {
    width: '100%',
    height: CARD_HEIGHT * 0.4,
    backgroundColor: '#f0f0f0',
  },
  heartOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
    zIndex: 10,
  },
  cardContent: {
    padding: 24,
    flex: 1,
    justifyContent: 'space-between',
  },
  headline: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1a1a1a',
    lineHeight: 28,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 8,
  },
  cardFooter: {
    marginTop: 'auto',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  sourceContainer: {
    marginBottom: 16,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    marginRight: 12,
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '400',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom:4
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 3,
    borderWidth: 1,
    gap: 6,
    minHeight: 44,
  },
  actionButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  likeButton: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
  },
  likedButton: {
    backgroundColor: '#fff5f5',
    borderColor: '#ff6b6b',
  },
  likedText: {
    color: '#ff6b6b',
  },
  commentButton: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
  },
  viewButton: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
  },
  shareButton: {
    backgroundColor: '#f0f8ff',
    borderColor: '#007AFF',
  },
  bookmarkButton: {
    backgroundColor: '#fff',
    borderColor: '#e0e0e0',
  },
  bookmarked: {
    backgroundColor: '#e3f2fd',
    borderColor: '#007AFF',
  },
  readMoreButton: {
    backgroundColor: '#fff',
    borderColor: '#007AFF',
  },
  imageOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  categoryBadge: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 3,
  },
  categoryBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  categorySection: {
    marginHorizontal: 10,
    marginVertical: 5,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f0f8ff',
    borderRadius: 3,
  },
  seeAllText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  categoryNewsCard: {
    width: 220,
    backgroundColor: '#fff',
    borderRadius: 4,
    marginRight: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  categoryNewsImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#f0f0f0',
  },
  categoryNewsContent: {
    padding: 16,
  },
  categoryNewsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    lineHeight: 20,
    marginBottom: 8,
  },
  categoryNewsLocation: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  headerSection: {
    paddingTop: 5,
  },
  loaderCard: {
    height: CARD_HEIGHT,
    backgroundColor: '#fff',
    borderRadius: 4,
    marginHorizontal: 20,
    marginVertical: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  loaderImage: {
    width: '100%',
    height: CARD_HEIGHT * 0.35,
    backgroundColor: '#f0f0f0',
  },
  loaderContent: {
    padding: 20,
    flex: 1,
    justifyContent: 'space-between',
  },
  loaderTitle: {
    height: 20,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },
  loaderText: {
    height: 16,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  loaderFooter: {
    marginTop: 'auto',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  loaderLocation: {
    height: 14,
    backgroundColor: '#f0f0f0',
    marginBottom: 4,
  },
  loaderDate: {
    height: 12,
    backgroundColor: '#f0f0f0',
  },
  loaderButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  loaderButton: {
    flex: 1,
    height: 40,
    backgroundColor: '#f0f0f0',
    borderRadius: 2,
  },
  loaderCategorySection: {
    backgroundColor: '#fff',
    borderRadius: 4,
    marginHorizontal: 20,
    marginVertical: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  loaderCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  loaderCategoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#fff',
  },
  loaderCategoryEmoji: {
    width: 24,
    height: 24,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    marginRight: 12,
  },
  loaderCategoryTitle: {
    height: 18,
    backgroundColor: '#f0f0f0',
    flex: 1,
    borderRadius: 4,
  },
  loaderSeeAll: {
    width: 60,
    height: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  loaderCategoryNewsCard: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 3,
    marginRight: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loaderCategoryNewsImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  loaderCategoryNewsContent: {
    padding: 12,
  },
  loaderCategoryNewsTitle: {
    height: 14,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
  },
  loaderCategoryNewsLocation: {
    height: 12,
    backgroundColor: '#f0f0f0',
  },
});