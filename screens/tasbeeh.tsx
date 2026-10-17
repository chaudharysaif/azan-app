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
import BackButton from '../components/back-button';

export default function Tasbeeh() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [tasbeehCount, setTasbeehCount] = useState(0);
  const [currentZikr, setCurrentZikr] = useState<any>(null);
  const [zikrList, setZikrList] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [tasbeehScreen, setTasbeehScreen] = useState(true);
  const [zikrScreen, setZikrScreen] = useState(false);
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

  const MAX_COUNT = 99999;
  const tasbeehCounter = () => {
    setTasbeehCount(prev => Math.min(prev + 1, MAX_COUNT));
  };

  const resetTasbeehCounter = () => {
    setTasbeehCount(0);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#199b4d" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={
      <RefreshControl
        refreshing={refreshing}
        onRefresh={onRefresh}
        colors={['#199b4d']}
        tintColor="#199b4d"
      />
    }
    >

      <View style={styles.header}>
        {/* <BackButton /> */}

        <Text style={styles.headerTitle}>
          Tasbeeh
        </Text>

        <View style={{ width: 30 }} />
      </View>


      {/* TOP TABS */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.tabButton,
            tasbeehScreen && styles.activeTab,
          ]}
          onPress={() => {
            setTasbeehScreen(true);
            setZikrScreen(false);
          }}
        >
          <Text style={[styles.tabText, tasbeehScreen && styles.activeTabText]}>
            Counter
          </Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} style={[styles.tabButton, zikrScreen && styles.activeTab]}
          onPress={() => {
            setZikrScreen(true);
            setTasbeehScreen(false);
          }}
        >
          <Text style={[styles.tabText, zikrScreen && styles.activeTabText]}>
            Daily Zikr
          </Text>
        </TouchableOpacity>
      </View>

      {/* TASBEEH COUNTER */}
      {tasbeehScreen && (
        <View style={styles.counterScreen}>
          <Text style={styles.counterHeading}>
            Digital Tasbeeh
          </Text>
          <Text style={styles.counterSubtitle}>
            Keep your remembrance going
          </Text>

          <TouchableOpacity activeOpacity={0.85}
            onPress={tasbeehCounter}
            disabled={tasbeehCount >= 99999}
            style={styles.counterCircleWrapper}
          >
            <View style={styles.outerCircle}>
              <View style={styles.innerCircle}>
                <Text style={styles.bigCount}>
                  {tasbeehCount.toLocaleString('en-IN')}
                </Text>

                <View style={styles.counterDivider} />

                <Text style={styles.limitText}>
                  / 99,999
                </Text>

                <Text style={styles.tapHint}>
                  Tap to count
                </Text>

              </View>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetCounterButton}
            activeOpacity={0.8}
            onPress={resetTasbeehCounter}
          >
            <Text style={styles.resetIcon}>↺</Text>
            <Text style={styles.resetCounterText}>Reset</Text>
          </TouchableOpacity>

          <Text style={styles.bottomMessage}>
            Every remembrance brings peace
          </Text>

        </View>
      )}

      {/* ZIKR INFO */}
      {zikrScreen && (
        <View>
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
            <AnimatedCircularProgress size={230} width={30} fill={(count / maxCount) * 100} tintColor="#1DB954" backgroundColor="#D8F3DF" rotation={0}>
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
            <TouchableOpacity style={styles.resetBtn} onPress={resetCounter}>
              <Text style={styles.resetBtnText}>
                ↺ Reset
              </Text>
            </TouchableOpacity>

            {/* <TouchableOpacity style={styles.changeBtn}>
          <Text style={styles.changeBtnText}>
            Change Zikr
          </Text> 
        </TouchableOpacity> */}
          </View>

          {/* LIST */}
          <View style={styles.listContainer}>
            {zikrList.map((item, index) => (
              <TouchableOpacity key={item.id}
                style={[styles.card, currentZikr?.id === item.id && styles.activeCard]}
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
        </View>
      )}
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
    backgroundColor: '#199b4d',
    paddingTop: 25,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
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
    color: '#199b4d',
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
    color: '#199b4d',
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
    color: '#199b4d',
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
    backgroundColor: '#199b4d',
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
    color: '#199b4d',
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
    borderColor: '#199b4d',
  },

  numberCircle: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: '#199b4d',
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
    color: '#199b4d',
  },

  cardEnglish: {
    color: '#666',
    marginTop: 3,
  },

  cardCount: {
    color: '#199b4d',
    fontWeight: '700',
  },

  // Top Tab
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 18,
    padding: 5,
    backgroundColor: '#E8F4EB',
    borderRadius: 30,
    alignItems: 'center',
  },

  tabButton: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },

  activeTab: {
    backgroundColor: '#199B4D',
    elevation: 3,
    shadowColor: '#199B4D',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.18,
    shadowRadius: 5,
  },

  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#568366',
  },

  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Tasbeeh screen
  counterScreen: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 35,
    paddingBottom: 40,
  },

  counterHeading: {
    fontSize: 23,
    fontWeight: '700',
    color: '#176B3A',
    letterSpacing: 0.5,
  },

  counterSubtitle: {
    fontSize: 14,
    color: '#8A9B8E',
    marginTop: 6,
  },

  counterCircleWrapper: {
    marginTop: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },

  outerCircle: {
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: '#DDF3E4',
    borderWidth: 10,
    borderColor: '#B8E5C7',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#199B4D',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 15,
  },

  innerCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ECF8EF',
  },

  bigCount: {
    fontSize: 58,
    fontWeight: '800',
    color: '#176B3A',
    fontVariant: ['tabular-nums'],
  },

  counterDivider: {
    width: 65,
    height: 3,
    backgroundColor: '#D5EEDF',
    borderRadius: 5,
    marginTop: 4,
  },

  limitText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#6D947A',
    marginTop: 8,
  },

  tapHint: {
    fontSize: 13,
    color: '#A0B3A5',
    marginTop: 12,
  },

  resetCounterButton: {
    marginTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5F5E9',
    borderWidth: 1,
    borderColor: '#BDE5C9',
    paddingVertical: 15,
    paddingHorizontal: 42,
    borderRadius: 35,
    elevation: 3,
  },

  resetIcon: {
    fontSize: 25,
    color: '#199B4D',
    marginRight: 12,
    fontWeight: '700',
  },

  resetCounterText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#176B3A',
  },

  bottomMessage: {
    marginTop: 35,
    fontSize: 13,
    color: '#A0B3A5',
    textAlign: 'center',
  },
});