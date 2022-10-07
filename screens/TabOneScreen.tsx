import { StyleSheet } from "react-native";

import EditScreenInfo from "../components/EditScreenInfo";
import { Text, View } from "../components/Themed";
import { Dimensions } from "react-native";
import { RootTabScreenProps } from "../types";
import { AppBar } from "@react-native-material/core";
import MapView, { Marker } from "react-native-maps";
import { useNetInfo } from "@react-native-community/netinfo";
import * as Location from "expo-location";
import { LocationObject } from "expo-location";
import React, { useState, useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";

interface markerType {
  _id: String;
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
    })();
    const request = {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    };
    (async (request) => {
      try {
        await fetch(
          "https://wi-find-server-pratyush1712.vercel.app/get_classified_points",
          request
        )
          .then((resp) => {
            return resp.json();
          })
          .then((data) => {
            setMarkers(data);
            return data;
          })
          .catch((err) => console.log(err));
      } catch (err) {
        console.error(err);
        throw err;
      }
    })(request);
  }, []);
  useEffect(() => {
    if (location != null && speed != null) {
      const request = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: location.coords.latitude + 0.1,
          longitude: location.coords.longitude + 0.1,
          linkspeed: speed.current,
        }),
      };
      (async (request) => {
        try {
          await fetch(
            "https://wi-find-server-pratyush1712.vercel.app/add_network_point",
            request
          )
            .then((resp) => {
              return resp.json();
            })
            .then((data) => {
              return data;
            })
            .catch((err) => console.log(err));
        } catch (err) {
          throw err;
        }
      })(request);
    }
  }, [location, speed]);
  if (location) {
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
          />
          {markers?.map((marker) => {
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
                key={marker._id}
                coordinate={{
                  latitude: marker.latitude,
                  longitude: marker.longitude,
                }}
              />
            );
          })}
        </MapView>
        <EditScreenInfo path="/screens/TabOneScreen.tsx" />
      </View>
    );
  }
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
