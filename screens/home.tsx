import { StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EditScreenInfo from "../components/EditScreenInfo";
import { Text, View } from "../components/Themed";
import { Dimensions } from "react-native";
import { RootTabScreenProps, successResponse } from "../types";
import MapView, { Marker } from "react-native-maps";
import { useNetInfo } from "@react-native-community/netinfo";
import * as Location from "expo-location";
import { LocationObject } from "expo-location";
import React, { useState, useEffect, useRef } from "react";
import { API_URL } from "../constants";

interface marker {
  _id: string;
  latitude: number;
  longitude: number;
  date: Date;
  speed: number;
}

export default function HomeScreen({
  navigation,
}: RootTabScreenProps<"Home">) {
  const netInfo = useNetInfo();
  const [location, setLocation] = useState<LocationObject | null>(null);
  const speed = useRef<Number | null>(null);
  const userId = useRef<string | null>(null);
  const [markers, setMarkers] = useState<Array<marker>>([]);
  if (netInfo.type === "wifi" && netInfo.details.ssid === "eduroam") {
    speed.current = netInfo.details.linkSpeed;
  }

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permission to access location was denied");
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      let networkPoints = await AsyncStorage.getItem("network_points");
      if (networkPoints === null || netInfo.isConnected) {
        const response = await fetch(`${API_URL}/points/all`);
        networkPoints = JSON.stringify((await response.json()).data);
        AsyncStorage.setItem("network_points", networkPoints);
      }
      setMarkers(JSON.parse(networkPoints));
    })();
  }, []);

  useEffect(() => {
    if (location && speed.current) {
      fetch(`${API_URL}/points/point`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          speed: speed.current,
          date: Date.now(),
        }),
      }).then(async (data) => {
        userId.current = (await data.json())._id;
      });
    }
  }, [location, speed]);

  if (!location) {
    return <Text>Loading...</Text>;
  }

  return (
    <View>
      <MapView
        showsUserLocation={true}
        style={styles.map}
        region={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.0122,
          longitudeDelta: 0.0121,
        }}
      >
        <Marker
          coordinate={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }}
          title={`You (speed: ${speed.current})`}
        />
        {markers.map((marker) => (
          <Marker
            pinColor={
              marker.speed <= 100
                ? "red"
                : marker.speed <= 400
                  ? "yellow"
                  : "green"
            }
            title={`Speed: ${marker.speed}`}
            key={marker._id as any}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
});
