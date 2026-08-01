import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { useNavigation } from '@react-navigation/native';
import API from './api/endpoints';

export default function Tasbeeh() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [currentZikr, setCurrentZikr] = useState<any>(null);
  const [zikrList, setZikrList] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const maxCount = currentZikr?.count || 33;

  const getZikr = async () => {
    try {
      const response = await fetch(API.GET_DUA);
      const data = await response.json();
      setCurrentZikr(data.data[0]);
      setZikrList(data.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await getZikr();
    setRefreshing(false);
  };

  useEffect(() => {
    getZikr();
  }, []);

  const incrementCounter = () => {
    if (count < maxCount) {
      setCount(prev => prev + 1);
    }
  };

  const resetCounter = () => {
    setCount(0);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#1c8846" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#1c8846']}
          tintColor="#1c8846"
        />
      }
    >

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          Tasbeeh
        </Text>

        <View style={{ width: 30 }} />
      </View>

      {/* ZIKR INFO */}
      <View style={styles.topSection}>
        <Text style={styles.arabic}>
          {currentZikr?.dua_arabic}
        </Text>

        <Text style={styles.english}>
          {currentZikr?.dua_english}
        </Text>

        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {currentZikr?.count} times
          </Text>
        </View>
      </View>

      {/* PROGRESS */}
      <View style={styles.progressContainer}>
        <AnimatedCircularProgress
          size={230}
          width={30}
          fill={(count / maxCount) * 100}
          tintColor="#1DB954"
          backgroundColor="#D8F3DF"
          rotation={0}
        >
          {() => (
            <View style={styles.centerCircle}>
              <Text style={styles.counter}>
                {count}
              </Text>

              <Text style={styles.ofText}>
                of {maxCount}
              </Text>
            </View>
          )}
        </AnimatedCircularProgress>
      </View>

      {/* TAP BUTTON */}
      <TouchableOpacity
        style={styles.tapButton}
        activeOpacity={0.8}
        onPress={incrementCounter}
      >
        <Text style={styles.tapIcon}>👆</Text>
      </TouchableOpacity>

      {/* BUTTONS */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={resetCounter}
        >
          <Text style={styles.resetBtnText}>
            ↺ Reset
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.changeBtn}>
          <Text style={styles.changeBtnText}>
            Change Zikr
          </Text>
        </TouchableOpacity>
      </View>

      {/* LIST */}
      <View style={styles.listContainer}>
        {zikrList.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.card,
              currentZikr?.id === item.id &&
              styles.activeCard,
            ]}
            onPress={() => {
              setCurrentZikr(item);
              setCount(0);
            }}
          >
            <View style={styles.numberCircle}>
              <Text style={styles.numberText}>
                {index + 1}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.cardArabic}>
                {item.dua_arabic}
              </Text>

              <Text style={styles.cardEnglish}>
                {item.dua_english}
              </Text>
            </View>

            <Text style={styles.cardCount}>
              0 / {item.count}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },

  loader: {
    flex: 1,
    justifyContent: 'center',
  },

  header: {
    backgroundColor: '#1c8846',
    paddingTop: 25,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  back: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
  },

  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },

  topSection: {
    alignItems: 'center',
    marginTop: 25,
  },

  arabic: {
    fontSize: 30,
    color: '#1c8846',
    marginBottom: 10,
  },

  english: {
    fontSize: 16,
    color: '#666',
  },

  badge: {
    marginTop: 10,
    backgroundColor: '#E7F7EC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 30,
  },

  badgeText: {
    color: '#1c8846',
    fontWeight: '600',
  },

  progressContainer: {
    marginTop: 25,
    alignItems: 'center',
  },

  centerCircle: {
    alignItems: 'center',
  },

  counter: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#1c8846',
  },

  ofText: {
    color: '#777',
  },

  tapButton: {
    alignSelf: 'center',
    marginTop: 25,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1c8846',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },

  tapIcon: {
    fontSize: 34,
    color: '#fff',
  },

  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 25,
  },

  resetBtn: {
    flex: 1,
    marginRight: 8,
    backgroundColor: '#FFECEC',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  resetBtnText: {
    color: '#E74C3C',
    fontWeight: '600',
  },

  changeBtn: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: '#EAF9EF',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  changeBtnText: {
    color: '#1c8846',
    fontWeight: '600',
  },

  listContainer: {
    padding: 20,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },

  activeCard: {
    borderWidth: 2,
    borderColor: '#1c8846',
  },

  numberCircle: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#1c8846',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  numberText: {
    color: '#fff',
    fontWeight: '700',
  },

  cardArabic: {
    fontSize: 18,
    color: '#1c8846',
  },

  cardEnglish: {
    color: '#666',
    marginTop: 3,
  },

  cardCount: {
    color: '#1c8846',
    fontWeight: '700',
  },
});