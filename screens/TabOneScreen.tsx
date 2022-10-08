import { StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import EditScreenInfo from "../components/EditScreenInfo";
import { Text, View } from "../components/Themed";
import { Dimensions } from "react-native";
import { RootTabScreenProps } from "../types";
import MapView, { Marker } from "react-native-maps";
import { useNetInfo } from "@react-native-community/netinfo";
import * as Location from "expo-location";
import { LocationObject } from "expo-location";
import React, { useState, useEffect, useRef } from "react";

interface markerType {
  _id: string;
  latitude: number;
  longitude: number;
  date_added: string;
  linkspeed_label: string;
}

export default function TabOneScreen({
  navigation,
}: RootTabScreenProps<"TabOne">) {
  const netInfo = useNetInfo();
  const [location, setLocation] = useState<LocationObject | null>(null);
  const speed = useRef<Number | null>(null);
  const userId = useRef<string | null>(null);
  const [markers, setMarkers] = useState<Array<markerType> | null>(null);
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
      let network_points = await AsyncStorage.getItem("network_points");
      if (network_points === null) {
        const response = await fetch(
          "https://wi-find-server-pratyush1712.vercel.app/get_classified_points"
        );
        network_points = await response.json();
        AsyncStorage.setItem("network_points", JSON.stringify(network_points));
      }
      setMarkers(JSON.parse(network_points));
    })();
  }, []);

  useEffect(() => {
    if (location && speed.current) {
      fetch(
        "https://wi-find-server-pratyush1712.vercel.app/add_network_point",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            linkspeed: speed.current,
          }),
        }
      ).then(async (data) => {
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
          title={"You"}
          pinColor={"magenta"}
        />
        {markers?.map((marker) => {
          if (marker._id !== userId.current) {
            return (
              <Marker
                pinColor={
                  marker.linkspeed_label === "high"
                    ? "green"
                    : marker.linkspeed_label === "medium"
                    ? "yellow"
                    : "red"
                }
                title={marker.linkspeed_label}
                key={marker._id as any}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
              />
            );
          }
        })}
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
