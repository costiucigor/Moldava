import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

export default function TabTwoScreen({ lastTrackings = [] }) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Last Tracking Sessions</Text>
            <View style={styles.trackingsContainer}>
                {lastTrackings.map((session, index) => (
                    <Text key={index}>Session {index + 1}: {JSON.stringify(session)}</Text>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    trackingsContainer: {
        marginTop: 10,
    },
});