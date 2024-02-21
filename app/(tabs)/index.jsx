import React, { useEffect, useState } from "react";
import { StyleSheet, View, Button, Text } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import TabTwoScreen from "./TabTwoScreen";

const Waiting_Driver_Screen = () => {
    const [currentLocation, setCurrentLocation] = useState(null);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [tracking, setTracking] = useState(false);
    const [distance, setDistance] = useState(0);
    const [lastTrackings, setLastTrackings] = useState([]);
    const [timer, setTimer] = useState(0);
    let intervalId;

    useEffect(() => {
        const requestLocationPermissions = async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                console.log("Permission to access location was denied");
            }
        };

        requestLocationPermissions();

        // Clean up any side effects if needed
        return () => {};
    }, []);

    useEffect(() => {
        const getLocation = async () => {
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            setCurrentLocation({ latitude, longitude });

            const locationOptions = {
                accuracy: Location.Accuracy.Low,
                distanceInterval: 1,
            };

            const locationListener = await Location.watchPositionAsync(
                locationOptions,
                newLocation => {
                    const { latitude, longitude } = newLocation.coords;
                    setCurrentLocation({ latitude, longitude });
                    setRouteCoordinates(prevRoute => [
                        ...prevRoute,
                        { latitude, longitude },
                    ]);

                    // Calculate distance covered
                    if (routeCoordinates.length > 0) {
                        const lastCoordinate = routeCoordinates[routeCoordinates.length - 1];
                        const newDistance = distance + calculateDistance(
                            lastCoordinate.latitude,
                            lastCoordinate.longitude,
                            latitude,
                            longitude
                        );
                        setDistance(newDistance);
                    }
                }
            );

            // Clean up the location listener when the component unmounts
            return () => locationListener.remove();
        };

        if (tracking) {
            getLocation();
            intervalId = setInterval(() => setTimer(prevTimer => prevTimer + 1), 1000);
        } else {
            clearInterval(intervalId);
        }

        return () => clearInterval(intervalId);
    }, [tracking]);

    const startTracking = () => {
        setRouteCoordinates([]);
        setDistance(0);
        setTimer(0);
        setTracking(true);
    };

    const stopTracking = async () => {
        await AsyncStorage.setItem("trackingSession", JSON.stringify(routeCoordinates));
        setLastTrackings(prevTrackings => [...prevTrackings, { session: routeCoordinates, duration: timer }]);
        setTracking(false);
    };

    const calculateDistance = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const distance = R * c;
        return distance;
    };

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
                    {currentLocation && (
                        <Marker
                            coordinate={{
                                latitude: currentLocation.latitude,
                                longitude: currentLocation.longitude,
                            }}
                            title="Your Location"
                        />
                    )}
                </MapView>
            )}
            <View style={styles.buttonsContainer}>
                <Button
                    title="Start Tracking"
                    onPress={startTracking}
                    disabled={tracking}
                />
                <Button
                    title="Stop Tracking"
                    onPress={stopTracking}
                    disabled={!tracking}
                />
            </View>
            <Text>Distance Covered: {distance.toFixed(2)} meters</Text>
            <Text>Timer: {timer} seconds</Text>
            <TabTwoScreen lastTrackings={lastTrackings} />
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
        height: "70%",
    },
    buttonsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        marginBottom: 10,
    },
});

export default Waiting_Driver_Screen;
