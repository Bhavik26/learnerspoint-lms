import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ScrollView, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { apiRequest, Course } from '../services/api';
import AiChatModal from '../components/AiChatModal';

export default function HomeScreen({ navigation }: any) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = ['ALL', 'DEVELOPMENT', 'BUSINESS', 'CYBERSECURITY', 'DESIGN'];

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/api/courses');
      if (response.success && response.courses) {
        setCourses(response.courses);
      }
    } catch (e: any) {
      console.error('[API Course Fetch Error]', e);
      Alert.alert('Network Issue', 'Could not sync latest course list from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleAddToCart = async (courseId: string) => {
    try {
      const response = await apiRequest('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ action: 'add', courseId }),
      });
      if (response.success) {
        Alert.alert('Cart Updated', 'Course has been added to your checkout cart!');
      }
    } catch (e: any) {
      Alert.alert('Cart Error', e.message || 'Cannot add item');
    }
  };

  const filteredCourses = selectedCategory === 'ALL'
    ? courses
    : courses.filter(c => c.category?.toUpperCase() === selectedCategory);

  const renderCourseItem = ({ item }: { item: Course }) => (
    <View style={styles.courseCard}>
      <Text style={styles.courseCategory}>{item.category || 'DEVELOPMENT'}</Text>
      <Text style={styles.courseTitle}>{item.title}</Text>
      <Text style={styles.courseDesc} numberOfLines={2}>{item.description}</Text>
      <View style={styles.row}>
        <Text style={styles.coursePrice}>${item.price}</Text>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => handleAddToCart(item.id)}
        >
          <Text style={styles.addBtnText}>+ Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brandTitle}>LearnersPoint<Text style={styles.dot}>.</Text></Text>
      </View>

      {/* Category Horizontal Slider */}
      <View style={styles.sliderContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.categoryButton, 
                selectedCategory === cat && styles.activeCategoryButton
              ]}
            >
              <Text style={[
                styles.categoryText, 
                selectedCategory === cat && styles.activeCategoryText
              ]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3DBFF2" />
          <Text style={styles.loadingText}>Fetching available courses...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCourses}
          keyExtractor={(item) => item.id}
          renderItem={renderCourseItem}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No active courses available under this category.</Text>
            </View>
          }
          onRefresh={fetchCourses}
          refreshing={loading}
        />
      )}

      {/* Floating AI Guide Widget */}
      <AiChatModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
  },
  dot: {
    color: '#3DBFF2',
  },
  sliderContainer: {
    marginVertical: 12,
    height: 46,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeCategoryButton: {
    backgroundColor: '#0B58CA',
    borderColor: '#3DBFF2',
  },
  categoryText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: 'bold',
  },
  activeCategoryText: {
    color: '#ffffff',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 48,
  },
  loadingText: {
    color: '#94a3b8',
    marginTop: 12,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  courseCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  courseCategory: {
    color: '#3DBFF2',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  courseTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  courseDesc: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  coursePrice: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addBtn: {
    backgroundColor: '#0B58CA',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
