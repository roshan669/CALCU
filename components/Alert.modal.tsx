import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ToastAndroid,
  StyleSheet,
} from "react-native";
import React, { SetStateAction, useContext } from "react";
import { ReportData } from "@/types/types";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { HomeContext } from "@/hooks/useHome";

interface AlertProps {
  title: string;
  description: string;
}

export default function Alert({ title, description }: AlertProps) {
  const {
    itemToDelete,
    setShowWarning,
    setAgree,
    setDataToUpdate,
    showWarning,
  } = useContext(HomeContext);
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={showWarning ? true : false}
      onRequestClose={() => {
        setShowWarning(null);
        setAgree(false); // Ensure agree is false if closed without choice
        setDataToUpdate!(null); // Clear pending data
      }}
      statusBarTranslucent
    >
      <BlurView
        style={styles.modalcontainer}
        intensity={100}
        tint="systemChromeMaterialDark"
      >
        <View style={styles.warningContent}>
          <Ionicons
            name="warning-outline"
            size={40}
            color="#f57c00"
            style={{ marginBottom: 10 }}
          />
          <Text style={styles.warningText}>{title}</Text>
          <Text style={styles.warningSubText}>
            {description}
            &quot;{itemToDelete}&quot;?
          </Text>
          <View style={styles.warningButtons}>
            <TouchableOpacity
              style={styles.warningNoButton} // "No" on the left
              onPress={() => {
                setShowWarning(null);
                setAgree(false); // Explicitly set agree to false
                setDataToUpdate!(null); // Clear pending data
                ToastAndroid.show("Operation cancelled", ToastAndroid.SHORT);
              }}
            >
              <Text style={styles.warningButtonText}>No</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.warningYesButton} // "Yes" on the right
              onPress={() => {
                // Just set agree and close. The useEffect will handle the update.
                setAgree(true);
              }}
            >
              <Text style={styles.warningButtonText}>Yes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalcontainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  warningContent: {
    backgroundColor: "#ffffff",
    padding: 30, // More padding
    borderRadius: 15,
    alignItems: "center",
    width: "85%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  warningText: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    color: "#343a40",
    marginBottom: 5, // Less space before subtext
  },
  warningSubText: {
    fontSize: 16,
    textAlign: "center",
    color: "#6c757d", // Gray subtext
    marginBottom: 25, // More space before buttons
  },
  warningButtons: {
    flexDirection: "row",
    justifyContent: "space-around", // Spread buttons
    width: "100%", // Use full width
  },
  warningYesButton: {
    backgroundColor: "#28a745", // Green
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 2,
  },
  warningNoButton: {
    backgroundColor: "#dc3545", // Red
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    elevation: 2,
  },
  warningButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
