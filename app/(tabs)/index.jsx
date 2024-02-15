import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";

const Waiting_Driver_Screen = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }

      const locationOptions = {
        accuracy: Location.Accuracy.Low, // Lower accuracy for less sensitive updates
        distanceInterval: 50, // Update every 50 meters
      };

      const locationListener = await Location.watchPositionAsync(
          locationOptions,
          (newLocation) => {
            const { latitude, longitude } = newLocation.coords;
            setCurrentLocation({ latitude, longitude });
            setRouteCoordinates((prevRoute) => [
              ...prevRoute,
              { latitude, longitude },
            ]);
          }
      );

      // Clean up the location listener when the component unmounts
      return () => locationListener.remove();
    };

    getLocation();
  }, []);

  return (
      <View style={styles.container}>
        {currentLocation && (
            <MapView
                style={styles.map}
                initialRegion={{
                  latitude: currentLocation.latitude,
                  longitude: currentLocation.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
            >
              <Polyline
                  coordinates={routeCoordinates}
                  strokeColor="#FF0000"
                  strokeWidth={2}
              />
              <Marker
                  coordinate={{
                    latitude: currentLocation.latitude,
                    longitude: currentLocation.longitude,
                  }}
                  title="Your Location"
              />
            </MapView>
        )}
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  map: {
    width: "100%",
    height: "100%",
  },
});

export default Waiting_Driver_Screen;
