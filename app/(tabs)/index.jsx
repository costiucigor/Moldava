import React, { useEffect, useState } from "react";
import { StyleSheet, View, Button, Text } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import TabTwoScreen from "./TabTwoScreen";
import { useNavigation } from "expo-router";

const Waiting_Driver_Screen = () => {
    const navigation = useNavigation();
    const [currentLocation, setCurrentLocation] = useState(null);
    const [routeCoordinates, setRouteCoordinates] = useState([]);
    const [tracking, setTracking] = useState(false);
    const [distance, setDistance] = useState(0);
    const [lastTrackings, setLastTrackings] = useState([]);
    const [timer, setTimer] = useState(0);
    const [intervalId, setIntervalId] = useState(null);

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

                    if (tracking) {
                        setRouteCoordinates(prevRoute => [
                            ...prevRoute,
                            { latitude, longitude },
                        ]);

                        // Calculate distance covered based on the new coordinates
                        if (routeCoordinates.length > 1) { // Check if there are at least two coordinates
                            const lastTwoCoordinates = routeCoordinates.slice(-2); // Get the last two coordinates
                            const newDistance = distance + calculateDistance(
                                lastTwoCoordinates[0].latitude,
                                lastTwoCoordinates[0].longitude,
                                lastTwoCoordinates[1].latitude,
                                lastTwoCoordinates[1].longitude
                            );
                            setDistance(newDistance);
                        }
                    }
                }
            );
            // Clean up the location listener when the component unmounts
            return () => locationListener.remove();
        };

        if (tracking) {
            getLocation();
            const id = setInterval(() => setTimer(prevTimer => prevTimer + 1), 1000);
            setIntervalId(id);
        } else {
            clearInterval(intervalId);
            setIntervalId(null);
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
        setTracking(false);
        setTimer(0);
        clearInterval(intervalId);
        await AsyncStorage.setItem("trackingSession", JSON.stringify(routeCoordinates));

        try {
            const lastTrackingsString = await AsyncStorage.getItem("lastTrackings");
            const prevTrackings = lastTrackingsString ? JSON.parse(lastTrackingsString) : [];
            const updatedTrackings = [...prevTrackings, { session: routeCoordinates, duration: timer }];
            setLastTrackings(updatedTrackings);
            await AsyncStorage.setItem("lastTrackings", JSON.stringify(updatedTrackings));
        } catch (error) {
            console.error('Error storing last trackings:', error);
        }

        navigation.navigate('TabTwoScreen', { lastTrackings, setLastTrackings });
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
            <MapView
                style={styles.map}
                region={{
                    latitude: currentLocation?.latitude || 0,
                    longitude: currentLocation?.longitude || 0,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }}
            >
                {tracking && (
                    <Polyline
                        coordinates={routeCoordinates}
                        strokeColor="#FF0000"
                        strokeWidth={2}
                    />
                )}
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
            <View style={styles.infoContainer}>
                <Text>Distance Covered: {distance.toFixed(2)} meters</Text>
                <Text>Timer: {timer} seconds</Text>
            </View>
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
    infoContainer: {
        position: 'absolute',
        top: 10,
        left: 10,
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
        zIndex: 9999,
    },
});

export default Waiting_Driver_Screen;
