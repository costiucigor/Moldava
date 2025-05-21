import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Button, Alert, Text } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
const [location, setLocation] = useState(null);
  const [tracking, setTracking] = useState(false);
 const [route, setRoute] = useState([]);
 const [startTime, setStartTime] = useState(null);
  const mapRef = useRef<MapView | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission to access location was denied');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();
  }, []);


  useEffect(() => {
    let sub: Location.LocationSubscription;
    if (tracking) {
      setRoute([]);
      setStartTime(Date.now());

      Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (loc) => {
          setLocation(loc);
          setRoute((prev) => [...prev, loc]);
        }
      ).then((s) => (sub = s));
    }

    return () => {
      if (sub) sub.remove();
    };
  }, [tracking]);

   const [distance, setDistance] = useState(0);
   const [elapsed, setElapsed] = useState(0);

   useEffect(() => {
     let interval: NodeJS.Timeout;
     if (tracking && startTime) {
       interval = setInterval(() => {
         setElapsed(Math.floor((Date.now() - startTime) / 1000));
       }, 1000);
     } else {
       clearInterval(interval);
     }
     return () => clearInterval(interval);
   }, [tracking, startTime]);

   function getDistance(a, b) {
     const toRad = (deg) => deg * (Math.PI / 180);
     const R = 6371e3; // Earth radius in meters
     const lat1 = toRad(a.latitude);
     const lat2 = toRad(b.latitude);
     const deltaLat = toRad(b.latitude - a.latitude);
     const deltaLon = toRad(b.longitude - a.longitude);

     const aVal =
       Math.sin(deltaLat / 2) ** 2 +
       Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;

     const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
     return R * c; // in meters
   }

   useEffect(() => {
     if (route.length < 2) return;
     const prev = route[route.length - 2].coords;
     const curr = route[route.length - 1].coords;
     const delta = getDistance(prev, curr);
     setDistance((d) => d + delta);
   }, [route]);

  const saveRoute = async () => {
    if (!startTime || route.length < 2) return;

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);
    let distance = 0;
    for (let i = 1; i < route.length; i++) {
      const delta = getDistance(route[i - 1].coords, route[i].coords);
      distance += delta;
    }

    const saved = await AsyncStorage.getItem('routes');
    const routes = saved ? JSON.parse(saved) : [];

    routes.push({
      id: Date.now(),
      path: route.map((r) => r.coords),
      distance: (distance / 1000).toFixed(2), // in km
      duration,
    });

    await AsyncStorage.setItem('routes', JSON.stringify(routes));
    Alert.alert('Route saved');
    setTracking(false);
    setRoute([]);
  };

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          ref={(ref) => (mapRef.current = ref)}
          style={StyleSheet.absoluteFillObject}
          showsUserLocation
          region={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {route.length > 0 && (
            <Polyline
              coordinates={route.map((r) => r.coords)}
              strokeColor="blue"
              strokeWidth={4}
            />
          )}
        </MapView>
      )}
  {tracking && location && (
    <View style={styles.infoBox}>
      <View style={styles.infoRow}>
        <View>
          <Button title="Stop" onPress={() => setTracking(false)} />
        </View>
        <View>
          <Button title="Save" onPress={saveRoute} disabled={route.length < 2} />
        </View>
      </View>
      <View style={styles.infoData}>
        <Text>📍 Lat: {location.coords.latitude.toFixed(5)}</Text>
        <Text>📍 Lng: {location.coords.longitude.toFixed(5)}</Text>
        <Text>🕐 Time: {elapsed}s</Text>
        <Text>📏 Distance: {(distance / 1000).toFixed(2)} km</Text>
      </View>
    </View>
  )}

   <SafeAreaView style={styles.safeAreaWrapper}>
     <View style={styles.controls}>
        <Button
          title={
            tracking
              ? route.length >= 2
                ? 'Stop & Save'
                : 'Stop'
              : 'Start Tracking'
          }
          onPress={() => {
            if (!tracking) {
              setTracking(true);
            } else if (route.length >= 2) {
              saveRoute();
            } else {
              setTracking(false);
              setRoute([]);
            }
          }}
          disabled={false}
        />
          <Button title="View Saved Routes" onPress={() => navigation.navigate('routes')} />
      </View>
    </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

 controlsWrapper: {
   position: 'absolute',
   bottom: 0,
   left: 0,
   right: 0,
   backgroundColor: 'rgba(255,255,255,0.95)',
   paddingBottom: 16,
   paddingTop: 8,
   zIndex: 20,
 },

 controls: {
   flexDirection: 'row',
   justifyContent: 'space-around',
   alignItems: 'center',
 },
  infoBox: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 11,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoData: {
    gap: 4,
  },

});