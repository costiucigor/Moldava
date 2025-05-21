import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, FlatList } from 'react-native';
import MapView, { Polyline } from 'react-native-maps';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RoutesScreen() {
  const [routes, setRoutes] = useState<any[]>([]);

  useEffect(() => {
    const fetchRoutes = async () => {
      const saved = await AsyncStorage.getItem('routes');
      const parsed = saved ? JSON.parse(saved) : [];
      setRoutes(parsed.reverse());
    };
    fetchRoutes();
  }, []);

  return (
    <FlatList
      data={routes}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.routeCard}>
          <Text style={styles.text}>Distance: {item.distance} km</Text>
          <Text style={styles.text}>Duration: {item.duration} sec</Text>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: item.path[0].latitude,
              longitude: item.path[0].longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Polyline coordinates={item.path} strokeColor="red" strokeWidth={3} />
          </MapView>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  routeCard: {
    margin: 10,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,
  },
  map: {
    height: 150,
    marginTop: 10,
  },
  text: {
    fontSize: 16,
  },
});