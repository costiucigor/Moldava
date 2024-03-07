import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRoute } from "@react-navigation/native";

// Create a custom Card component
function Card({ title, children, onDelete }) {
    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{title}</Text>
                <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
            </View>
            {children}
        </View>
    );
}

export default function TabTwoScreen() {
    const route = useRoute();
    const { lastTrackings = [], setLastTrackings } = route.params;

    const deleteSession = (index) => {
        const updatedTrackings = lastTrackings.filter((session, i) => i !== index);
        setLastTrackings(updatedTrackings);
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {lastTrackings.map((session, index) => (
                    <Card key={index} title={`Session ${index + 1}`} onDelete={() => deleteSession(index)}>
                        <Text>Distance: {session.session.length * 2} meters (estimated)</Text>
                        <Text>Duration: {Math.floor(session.duration / 60)} minutes, {session.duration % 60} seconds</Text>
                    </Card>
                ))}
            </ScrollView>
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
    scrollContainer: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    card: {
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderRadius: 5,
        marginBottom: 10,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    cardTitle: {
        fontWeight: 'bold',
    },
    deleteButton: {
        backgroundColor: 'red',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 5,
    },
    deleteButtonText: {
        color: 'white',
    },
});
