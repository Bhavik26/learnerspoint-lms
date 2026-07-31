import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { apiRequest, getStoredUser, CartItem } from '../services/api';

export default function CartScreen() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const fetchCart = async () => {
    try {
      const user = await getStoredUser();
      if (!user) {
        setCartItems([]);
        setLoading(false);
        return;
      }
      const response = await apiRequest(`/api/cart?userId=${user.userId}`);
      if (response.success && response.items) {
        setCartItems(response.items);
      }
    } catch (e: any) {
      console.error('[Cart Fetch Error]', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchCart();
    }
  }, [isFocused]);

  const handleRemoveItem = async (courseId: string) => {
    try {
      const response = await apiRequest('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ action: 'remove', courseId }),
      });
      if (response.success) {
        fetchCart();
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not remove item');
    }
  };

  const handleClearCart = async () => {
    try {
      const response = await apiRequest('/api/cart', {
        method: 'POST',
        body: JSON.stringify({ action: 'clear' }),
      });
      if (response.success) {
        setCartItems([]);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Could not clear cart');
    }
  };

  const handleCheckout = () => {
    Alert.alert(
      'Checkout Confirmation',
      'Proceed to checkout LearnersPoint order?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            await handleClearCart();
            Alert.alert('Success', 'Enrollment completed successfully! Check Live Sessions tab.');
          } 
        }
      ]
    );
  };

  const totalPrice = cartItems.reduce((acc, item) => acc + (item.course?.price || 0), 0);

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View style={styles.cardItem}>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{item.course?.title || 'Unknown Course'}</Text>
        <Text style={styles.cardPrice}>${item.course?.price || 0}</Text>
      </View>
      <TouchableOpacity 
        style={styles.removeBtn}
        onPress={() => handleRemoveItem(item.courseId)}
      >
        <Text style={styles.removeText}>✕</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        {cartItems.length > 0 && (
          <TouchableOpacity onPress={handleClearCart}>
            <Text style={styles.clearText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#3DBFF2" />
        </View>
      ) : cartItems.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyText}>Your shopping cart is empty.</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            data={cartItems}
            keyExtractor={(item) => item.id}
            renderItem={renderCartItem}
            contentContainerStyle={styles.list}
          />

          {/* Pricing Box */}
          <View style={styles.footerPanel}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Price</Text>
              <Text style={styles.totalPrice}>${totalPrice.toFixed(2)}</Text>
            </View>

            <TouchableOpacity style={styles.checkoutBtn} onPress={handleCheckout}>
              <Text style={styles.checkoutText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  clearText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  list: {
    padding: 16,
  },
  cardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardBody: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  cardPrice: {
    color: '#3DBFF2',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  removeText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 12,
  },
  footerPanel: {
    backgroundColor: '#0f172a',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  totalPrice: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  checkoutBtn: {
    backgroundColor: '#0B58CA',
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0b58ca',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  checkoutText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
