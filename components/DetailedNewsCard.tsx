import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Share,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { News } from '../types/news';

const { width, height } = Dimensions.get('window');

interface Comment {
  _id: string;
  user: {
    _id: string;
    name: string;
  };
  text: string;
  likes: string[];
  replies: Reply[];
  createdAt: string;
  isLiked?: boolean;
}

interface Reply {
  _id: string;
  user: {
    _id: string;
    name: string;
  };
  text: string;
  likes: string[];
  createdAt: string;
  isLiked?: boolean;
}

interface DetailedNewsCardProps {
  visible: boolean;
  news: News | null;
  onClose: () => void;
}

export default function DetailedNewsCard({ visible, news, onClose }: DetailedNewsCardProps) {
  const { token, user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ commentId: string; userName: string } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [views, setViews] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const heartScale = useRef(new Animated.Value(1)).current;
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);

  useEffect(() => {
    if (visible && news) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      fetchComments();
      fetchNewsDetails();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, news]);

  const fetchComments = async () => {
    if (!news || !token) return;
    
    try {
      const response = await fetch(`http://10.0.2.2:3000/api/social/news/${news._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments(data.news.comments || []);
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const fetchNewsDetails = async () => {
    if (!news || !token) return;
    
    try {
      const response = await fetch(`http://10.0.2.2:3000/api/social/news/${news._id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.news.isLiked || false);
        setLikesCount(data.news.likes?.length || 0);
        setViews(data.news.views || 0);
      }
    } catch (error) {
      console.error('Failed to fetch news details:', error);
    }
  };

  const handleLike = async () => {
    if (!news || !token) return;
    
    try {
      // Optimistic update
      const newLikedState = !isLiked;
      setIsLiked(newLikedState);
      setLikesCount(prev => newLikedState ? prev + 1 : prev - 1);

      const response = await fetch(`http://10.0.2.2:3000/api/social/news/${news._id}/like`, {
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

  const handleDoubleTap = () => {
    if (!isLiked) {
      handleLike();
      setShowHeartAnimation(true);
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(() => setShowHeartAnimation(false), 500);
      });
    }
  };

  const handleAddComment = async () => {
    if (!news || !token || !newComment.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://10.0.2.2:3000/api/social/news/${news._id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text: newComment.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => [...prev, data.comment]);
        setNewComment('');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReply = async () => {
    if (!news || !token || !replyText.trim() || !replyingTo) return;
    
    setLoading(true);
    try {
      const response = await fetch(`http://10.0.2.2:3000/api/social/news/${news._id}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          text: replyText.trim(),
          parentCommentId: replyingTo.commentId 
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(prev => prev.map(comment => 
          comment._id === replyingTo.commentId 
            ? { ...comment, replies: [...comment.replies, data.comment] }
            : comment
        ));
        setReplyText('');
        setReplyingTo(null);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add reply');
    } finally {
      setLoading(false);
    }
  };

  const handleCommentLike = async (commentId: string, replyId?: string) => {
    if (!news || !token) return;
    
    try {
      const url = replyId 
        ? `http://10.0.2.2:3000/api/social/news/${news._id}/comment/${commentId}/reply/${replyId}/like`
        : `http://10.0.2.2:3000/api/social/news/${news._id}/comment/${commentId}/like`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        setComments(prev => prev.map(comment => {
          if (comment._id === commentId) {
            if (replyId) {
              return {
                ...comment,
                replies: comment.replies.map(reply => 
                  reply._id === replyId 
                    ? { ...reply, isLiked: data.isLiked, likes: data.isLiked ? [...reply.likes, user?.id || ''] : reply.likes.filter(id => id !== user?.id) }
                    : reply
                )
              };
            } else {
              return {
                ...comment,
                isLiked: data.isLiked,
                likes: data.isLiked ? [...comment.likes, user?.id || ''] : comment.likes.filter(id => id !== user?.id)
              };
            }
          }
          return comment;
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to like comment');
    }
  };

  const handleShare = async () => {
    if (!news) return;
    
    try {
      const shareContent = {
        title: news.headline,
        message: `${news.headline}\n\n${news.summary.en.text}\n\nRead more: ${news.url}`,
        url: news.url,
      };
      
      await Share.share(shareContent);
    } catch (error) {
      Alert.alert('Error', 'Failed to share the news');
    }
  };

  const handleReadMore = () => {
    if (news?.url) {
      Linking.openURL(news.url);
    }
  };

  const renderComment = (comment: Comment) => (
    <View key={comment._id} style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        <View style={styles.commentUserInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>
              {comment.user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.commentMeta}>
            <Text style={styles.commentUserName}>{comment.user.name}</Text>
            <Text style={styles.commentTime}>
              {new Date(comment.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.commentLikeButton, comment.isLiked && styles.commentLikedButton]}
          onPress={() => handleCommentLike(comment._id)}
        >
          <Ionicons 
            name={comment.isLiked ? "heart" : "heart-outline"} 
            size={16} 
            color={comment.isLiked ? "#ff6b6b" : "#666"} 
          />
          <Text style={[styles.commentLikeText, comment.isLiked && styles.commentLikedText]}>
            {comment.likes.length}
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.commentText}>{comment.text}</Text>
      
      <View style={styles.commentActions}>
        <TouchableOpacity 
          style={styles.replyButton}
          onPress={() => setReplyingTo({ commentId: comment._id, userName: comment.user.name })}
        >
          <Ionicons name="chatbubble-outline" size={14} color="#666" />
          <Text style={styles.replyButtonText}>Reply</Text>
        </TouchableOpacity>
      </View>

      {/* Replies */}
      {comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => (
            <View key={reply._id} style={styles.replyContainer}>
              <View style={styles.replyHeader}>
                <View style={styles.replyUserInfo}>
                  <View style={[styles.userAvatar, styles.replyAvatar]}>
                    <Text style={styles.userInitial}>
                      {reply.user.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.replyMeta}>
                    <Text style={styles.replyUserName}>{reply.user.name}</Text>
                    <Text style={styles.replyTime}>
                      {new Date(reply.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.commentLikeButton, reply.isLiked && styles.commentLikedButton]}
                  onPress={() => handleCommentLike(comment._id, reply._id)}
                >
                  <Ionicons 
                    name={reply.isLiked ? "heart" : "heart-outline"} 
                    size={14} 
                    color={reply.isLiked ? "#ff6b6b" : "#666"} 
                  />
                  <Text style={[styles.commentLikeText, reply.isLiked && styles.commentLikedText]}>
                    {reply.likes.length}
                  </Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.replyText}>{reply.text}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Reply Input */}
      {replyingTo?.commentId === comment._id && (
        <View style={styles.replyInputContainer}>
          <Text style={styles.replyingToText}>Replying to {replyingTo.userName}</Text>
          <View style={styles.replyInputRow}>
            <TextInput
              style={styles.replyInput}
              placeholder="Write a reply..."
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendReplyButton, !replyText.trim() && styles.sendReplyButtonDisabled]}
              onPress={handleAddReply}
              disabled={!replyText.trim() || loading}
            >
              <Ionicons name="send" size={16} color={replyText.trim() ? "#007AFF" : "#ccc"} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  if (!news) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.View 
          style={[
            styles.modalContent,
            { transform: [{ translateY: slideAnim }] }
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>News Details</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* News Image */}
            <TouchableOpacity 
              style={styles.imageContainer} 
              onPress={handleDoubleTap}
              activeOpacity={1}
            >
              <Image 
                source={{ uri: news.img || 'https://via.placeholder.com/400x200?text=News' }} 
                style={styles.newsImage}
                resizeMode="cover"
              />
              {showHeartAnimation && (
                <Animated.View style={[styles.heartOverlay, { transform: [{ scale: heartScale }] }]}>
                  <Ionicons name="heart" size={80} color="#ff6b6b" />
                </Animated.View>
              )}
              <View style={styles.imageOverlay}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{news.genre || 'News'}</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* News Content */}
            <View style={styles.newsContent}>
              <Text style={styles.headline}>{news.headline}</Text>
              <Text style={styles.summary}>{news.summary.en.text}</Text>
              
              <View style={styles.newsMeta}>
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.locationText}>
                    {news.city_town}, {news.state}
                  </Text>
                </View>
                <Text style={styles.dateText}>
                  {new Date(news.date).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.likeButton, isLiked && styles.likedButton]}
                  onPress={handleLike}
                >
                  <Ionicons 
                    name={isLiked ? "heart" : "heart-outline"} 
                    size={20} 
                    color={isLiked ? "#ff6b6b" : "#666"} 
                  />
                  <Text style={[styles.actionButtonText, isLiked && styles.likedText]}>
                    {likesCount}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.commentButton]}
                  onPress={() => setShowComments(!showComments)}
                >
                  <Ionicons name="chatbubble-outline" size={20} color="#666" />
                  <Text style={styles.actionButtonText}>{comments.length}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.viewButton]}
                >
                  <Ionicons name="eye-outline" size={20} color="#666" />
                  <Text style={styles.actionButtonText}>{views}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.shareButton]}
                  onPress={handleShare}
                >
                  <Ionicons name="share-outline" size={20} color="#007AFF" />
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.readMoreButton]}
                  onPress={handleReadMore}
                >
                  <Ionicons name="open-outline" size={20} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Comments Section */}
            {showComments && (
              <View style={styles.commentsSection}>
                <Text style={styles.commentsTitle}>Comments ({comments.length})</Text>
                
                {/* Add Comment */}
                <View style={styles.addCommentContainer}>
                  <View style={styles.commentInputRow}>
                    <View style={styles.userAvatar}>
                      <Text style={styles.userInitial}>
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </Text>
                    </View>
                    <TextInput
                      style={styles.commentInput}
                      placeholder="Add a comment..."
                      value={newComment}
                      onChangeText={setNewComment}
                      multiline
                    />
                    <TouchableOpacity
                      style={[styles.sendCommentButton, !newComment.trim() && styles.sendCommentButtonDisabled]}
                      onPress={handleAddComment}
                      disabled={!newComment.trim() || loading}
                    >
                      <Ionicons name="send" size={18} color={newComment.trim() ? "#007AFF" : "#ccc"} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Comments List */}
                <View style={styles.commentsList}>
                  {comments.length === 0 ? (
                    <View style={styles.noComments}>
                      <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
                      <Text style={styles.noCommentsText}>No comments yet</Text>
                      <Text style={styles.noCommentsSubtext}>Be the first to share your thoughts!</Text>
                    </View>
                  ) : (
                    comments.map(renderComment)
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  headerSpacer: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  newsImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  heartOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -40,
    marginTop: -40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  newsContent: {
    padding: 20,
  },
  headline: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    lineHeight: 30,
  },
  summary: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
    marginBottom: 20,
  },
  newsMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 14,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButton: {
    alignItems: 'center',
    gap: 4,
  },
  likeButton: {
    // Additional styles for like button
  },
  likedButton: {
    // Additional styles for liked state
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
  },
  likedText: {
    color: '#ff6b6b',
  },
  commentsSection: {
    marginTop: 20,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 20,
    gap: 12,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
  },
  sendCommentButton: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  sendCommentButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  commentsList: {
    maxHeight: 400,
  },
  commentContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentMeta: {
    flexDirection: 'column',
  },
  commentUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  commentTime: {
    fontSize: 12,
    color: '#999',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 8,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 16,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyButtonText: {
    fontSize: 12,
    color: '#666',
  },
  repliesContainer: {
    marginTop: 12,
    marginLeft: 20,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#e0e0e0',
  },
  replyContainer: {
    marginBottom: 12,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  replyUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  replyMeta: {
    flexDirection: 'column',
  },
  replyUserName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  replyTime: {
    fontSize: 11,
    color: '#999',
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  replyingToText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  replyInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  replyInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
  },
  sendReplyButton: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  sendReplyButtonDisabled: {
    backgroundColor: '#f0f0f0',
  },
  noComments: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noCommentsText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  noCommentsSubtext: {
    fontSize: 14,
    color: '#999',
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  commentLikedButton: {
    // Additional styles for liked comment button
  },
  commentLikeText: {
    fontSize: 12,
    color: '#666',
  },
  commentLikedText: {
    color: '#ff6b6b',
  },
  replyAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  replyText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
    marginBottom: 4,
  },
  content: {
    flex: 1,
  },
  commentButton: {
    // Additional styles for comment button
  },
  viewButton: {
    // Additional styles for view button
  },
  shareButton: {
    // Additional styles for share button
  },
  readMoreButton: {
    // Additional styles for read more button
  },
}); 