import { StyleSheet } from "react-native";

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

export default function TabOneScreen({
  navigation,
}: RootTabScreenProps<"TabOne">) {
  const netInfo = useNetInfo();
  const [location, setLocation] = useState<LocationObject | null>(null);
  const speed = useRef<number | null>(null);
  const [markers, setMarkers] = useState<Array<marker>>([]);
  console.log(netInfo.type)
  if (netInfo.type === "wifi") {
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

      const response = await fetch(`${API_URL}/points/all`);
      setMarkers((await response.json()).data);
      console.log(markers)
    })();
  }, []);

  useEffect(() => {
    if (location && speed) {
      fetch(
        `${API_URL}/points/point`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: location.coords.latitude + 0.1,
            longitude: location.coords.longitude + 0.1,
            speed: speed.current,
            date: Date.now(),
          }),
        }
      );
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
        {markers.map(marker =>
          <Marker
            pinColor={marker.speed <= 100 ? "red" : (marker.speed <= 400 ? "yellow" : "green")}
            title={`Speed: ${marker.speed}`}
            key={marker._id as any}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
          />)}
      </MapView>
      <EditScreenInfo path="/screens/TabOneScreen.tsx" />
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
