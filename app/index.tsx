import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

interface ReportData {
  // Same interface as before
  todaysDate: string;
  totalGrossIncome: string;
  calculatedNetIncome: string;
  month: string;
  all: list[];
  time: string;
}

interface input {
  name: string;
  toggle: string;
}

type list = {
  name: string;
  value: number;
};

export default function Index() {
  const [netIncome, setNetIncome] = useState<string>("0");
  const [totalGrossIncome, setTotalGrossIncome] = useState<string>("0");
  const [expList, setExpList] = useState<list[]>([]);
  const [incList, setIncList] = useState<list[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [perfer, setPerfer] = useState<string>("");
  const [allinputs, setAllInputs] = useState<input[]>([]);
  const [addName, setAddName] = useState<string>("");
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [agree, setAgree] = useState<boolean>(false);
  // State to hold data temporarily when waiting for user confirmation
  const [dataToUpdate, setDataToUpdate] = useState<ReportData | null>(null);
  const router = useRouter();

  const todaysDate = new Date().toDateString().slice(4);

  // --- Data Loading and Initialization ---
  const loadPreferences = async () => {
    try {
      const storedData = await AsyncStorage.getItem("perfer");
      const existingData: input[] = storedData ? JSON.parse(storedData) : [];
      setAllInputs(existingData);
    } catch (error) {
      console.error("Error loading preferences:", error);
      ToastAndroid.show("Error loading preferences", ToastAndroid.SHORT);
    }
  };

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    const initialExpList: list[] = [];
    const initialIncList: list[] = [];

    allinputs.forEach((input) => {
      if (input.toggle === "expense") {
        initialExpList.push({ name: input.name, value: 0 });
      } else if (input.toggle === "income") {
        initialIncList.push({ name: input.name, value: 0 });
      }
    });

    setExpList(initialExpList);
    setIncList(initialIncList);
  }, [allinputs]);

  // --- Calculation Logic ---
  const calculate = () => {
    // Made synchronous as it doesn't involve async operations itself
    const currentTotalGrossIncome = incList
      .reduce((sum, item) => {
        return sum + (item.value || 0);
      }, 0)
      .toString();

    const totalExpense = expList.reduce((sum, item) => {
      return sum + (item.value || 0);
    }, 0);

    const calculatedNetIncome =
      (parseFloat(currentTotalGrossIncome) || 0) - totalExpense;
    const stringCalculatedNetIncome = calculatedNetIncome.toString();

    // Update state for immediate display
    setTotalGrossIncome(currentTotalGrossIncome);
    setNetIncome(stringCalculatedNetIncome);

    // Prepare data structure for saving
    const month = todaysDate.slice(0, 3) + " " + todaysDate.slice(7, 11);
    const time = new Date().toISOString(); // Use ISO string for consistency
    const allData = [...expList, ...incList].map((item) => ({
      name: item.name,
      value: item.value || 0, // Ensure value is always a number
    }));

    return {
      todaysDate,
      totalGrossIncome: currentTotalGrossIncome,
      calculatedNetIncome: stringCalculatedNetIncome,
      month,
      time,
      all: allData,
    };
  };

  // --- Data Saving Logic ---

  // This function checks for existing data and either inserts directly
  // or triggers the warning modal.
  const checkAndTriggerWarningOrInsert = async (newData: ReportData) => {
    const month = newData.month; // Use month from newData for consistency
    try {
      const storedData = await AsyncStorage.getItem(month);
      const existingData: ReportData[] = storedData
        ? JSON.parse(storedData)
        : [];

      const existingEntryIndex = existingData.findIndex(
        (item) => item.todaysDate === newData.todaysDate
      );

      if (existingEntryIndex !== -1) {
        // Data for today already exists - ask the user
        setDataToUpdate(newData); // Store the new data temporarily
        setShowWarning(true); // Show the warning modal
      } else {
        // No data for today - insert directly
        existingData.push(newData);
        await AsyncStorage.setItem(month, JSON.stringify(existingData));
        ToastAndroid.show("Data inserted successfully", ToastAndroid.LONG);
        return true; // Indicate success
      }
    } catch (error) {
      console.error("Error checking/inserting data:", error);
      ToastAndroid.show("Error saving data", ToastAndroid.SHORT);
      return false; // Indicate failure
    }
    return false; // Indicate that immediate insertion didn't happen
  };

  // useEffect to handle the update *after* user agrees
  useEffect(() => {
    const performUpdate = async () => {
      // Only proceed if user agreed AND there is data waiting
      if (agree && dataToUpdate) {
        const month = dataToUpdate.month;
        try {
          const storedData = await AsyncStorage.getItem(month);
          const existingData: ReportData[] = storedData
            ? JSON.parse(storedData)
            : [];

          const existingEntryIndex = existingData.findIndex(
            (item) => item.todaysDate === dataToUpdate.todaysDate
          );

          if (existingEntryIndex !== -1) {
            // Replace the existing entry
            existingData[existingEntryIndex] = dataToUpdate;
            await AsyncStorage.setItem(month, JSON.stringify(existingData));
            ToastAndroid.show("Data updated successfully", ToastAndroid.LONG);
          } else {
            // Should not happen if logic is correct, but handle defensively
            console.warn("Attempted to update non-existent data after agree.");
            existingData.push(dataToUpdate); // Insert if somehow missing
            await AsyncStorage.setItem(month, JSON.stringify(existingData));
            ToastAndroid.show(
              "Data inserted (unexpectedly)",
              ToastAndroid.LONG
            );
          }
        } catch (error) {
          console.error("Error updating data after agree:", error);
          ToastAndroid.show("Error updating data", ToastAndroid.SHORT);
        } finally {
          // Reset states regardless of success or error
          setDataToUpdate(null);
          setAgree(false);
          // Keep showWarning false as it was set by the button press
        }
      }
    };

    performUpdate();
  }, [agree, dataToUpdate]); // Run this effect when 'agree' or 'dataToUpdate' changes

  const handleSubmit = async () => {
    try {
      const details = calculate(); // Calculate first
      if (details) {
        await checkAndTriggerWarningOrInsert(details); // Then attempt save/trigger warning
        // Success message is now shown within checkAndTriggerWarningOrInsert or the useEffect
      }
    } catch (error) {
      // Catch potential errors from calculate if it were async, or other unexpected issues
      console.error("Error in handleSubmit:", error);
      ToastAndroid.show("An unexpected error occurred", ToastAndroid.SHORT);
    }
  };

  // --- Preference Add/Delete Logic ---
  const handleAdd = async () => {
    const trimmedName = addName.trim();
    if (trimmedName === "" || perfer === "") {
      ToastAndroid.show(
        "Please enter a value and select nature",
        ToastAndroid.SHORT
      );
      return;
    }

    try {
      const storedData = await AsyncStorage.getItem("perfer");
      const existingData: input[] = storedData ? JSON.parse(storedData) : [];

      // Check if name already exists
      if (
        existingData.some(
          (item) => item.name.toLowerCase() === trimmedName.toLowerCase()
        )
      ) {
        ToastAndroid.show(
          `'${trimmedName}' already exists`,
          ToastAndroid.SHORT
        );
        return;
      }

      const newData = {
        name: trimmedName,
        toggle: perfer,
      };

      existingData.push(newData);
      await AsyncStorage.setItem("perfer", JSON.stringify(existingData));

      // Reset modal state and reload preferences
      setAddName("");
      setPerfer("");
      setShowModal(false); // Close modal on success
      loadPreferences(); // Reload preferences to update UI
      ToastAndroid.show("Added successfully", ToastAndroid.SHORT);
    } catch (error) {
      console.error("Error saving preference:", error);
      ToastAndroid.show("Error saving preference", ToastAndroid.SHORT);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      const storedData = await AsyncStorage.getItem("perfer");
      let existingData: input[] = storedData ? JSON.parse(storedData) : [];

      const updatedData = existingData.filter((item) => item.name !== name);

      // Only update if the data actually changed
      if (updatedData.length !== existingData.length) {
        await AsyncStorage.setItem("perfer", JSON.stringify(updatedData));
        loadPreferences(); // Reload preferences
        ToastAndroid.show(`'${name}' deleted`, ToastAndroid.SHORT);
      } else {
        ToastAndroid.show(`'${name}' not found`, ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error("Error deleting preference:", error);
      ToastAndroid.show("Error deleting preference", ToastAndroid.SHORT);
    }
  };

  // --- Input Change Handler ---
  const handleChange = (text: string, toggle: string, name: string) => {
    // Allow empty input to represent 0
    const newValue = text === "" ? 0 : parseInt(text, 10);

    // Prevent update if parsing fails (e.g., user types non-numeric characters)
    // Allow 0 even though isNaN(0) is false.
    if (isNaN(newValue) && text !== "") {
      console.warn(`Invalid input detected: "${text}"`);
      // Optionally provide user feedback here if needed
      return;
    }

    const updateList = (
      listSetter: React.Dispatch<React.SetStateAction<list[]>>
    ) => {
      listSetter((prevList) =>
        prevList.map((item) =>
          item.name === name ? { ...item, value: newValue } : item
        )
      );
    };

    if (toggle === "expense") {
      updateList(setExpList);
    } else if (toggle === "income") {
      updateList(setIncList);
    }
  };

  // --- Render Component ---
  return (
    <KeyboardAvoidingView behavior="position">
      <View style={styles.container}>
        <View style={styles.resultcontainer}>
          <Text style={styles.text}> Gross Income</Text>
          <Text style={styles.text}> Net Income</Text>
        </View>
        <View style={styles.results}>
          <Text style={{ fontSize: 20 }}>{totalGrossIncome}</Text>
          <Text style={{ fontSize: 20 }}>{netIncome}</Text>
        </View>

        <ScrollView
          style={styles.inputcontainer}
          contentContainerStyle={styles.inputitems} // Removed margin here, add padding if needed
          keyboardShouldPersistTaps="handled" // Helps with dismissing keyboard
        >
          {allinputs.map((item, index) => {
            // Find the corresponding value from state for display
            const listToSearch = item.toggle === "expense" ? expList : incList;
            const currentItem = listToSearch.find(
              (stateItem) => stateItem.name === item.name
            );
            const currentValue = currentItem ? currentItem.value : 0;

            return (
              <View key={`${item.name}-${index}`} style={styles.inputRow}>
                <TouchableOpacity
                  onLongPress={() => handleDelete(item.name)}
                  style={styles.inputLabelContainer}
                >
                  <Text style={styles.text}>{item.name}</Text>
                  <Ionicons
                    name="trash-outline"
                    size={14}
                    color={"#555"}
                    style={styles.deleteIcon}
                  />
                </TouchableOpacity>

                <TextInput
                  placeholder="0"
                  style={[
                    styles.input,
                    item.toggle === "expense"
                      ? styles.expenseInput
                      : styles.incomeInput,
                  ]}
                  // Use toString() to display the value, handle 0 correctly
                  value={currentValue === 0 ? "" : currentValue.toString()} // Show empty for 0
                  onChangeText={(text) =>
                    handleChange(text, item.toggle, item.name)
                  }
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                />
              </View>
            );
          })}
          {/* Add Button */}
          <View style={styles.addButtonContainer}>
            <TouchableOpacity
              onPress={() => setShowModal(true)} // Use true directly
              style={styles.addrmvbtn}
            >
              <Ionicons
                name="add-circle"
                size={50}
                color={"rgba(0, 128, 0, 0.5)"} // Make it more visible
              />
              {allinputs.length < 1 && <Text>Add expense or income</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* --- Modals --- */}

        {/* Add Preference Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showModal}
          onRequestClose={() => {
            setShowModal(false); // Use false directly
            setAddName(""); // Clear state on close
            setPerfer("");
          }}
          statusBarTranslucent
        >
          <BlurView
            intensity={80} // Adjusted intensity
            tint="light" // Changed tint
            style={styles.modalcontainer}
          >
            <View style={styles.modalcontent}>
              <Text style={styles.modalname}>Add Item</Text>
              <TextInput
                placeholder="type here..."
                value={addName} // Control the input
                onChangeText={setAddName}
                style={styles.input} // Reuse input style
                autoCapitalize="words"
              />

              <View style={styles.modalprefercontainer}>
                <TouchableOpacity
                  onPress={() => setPerfer("expense")}
                  style={[
                    styles.modalbtn,
                    styles.expenseButton, // Specific style for expense
                    perfer === "expense" && styles.modalButtonSelected,
                  ]}
                >
                  <Text style={styles.modalButtonText}>Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPerfer("income")}
                  style={[
                    styles.modalbtn,
                    styles.incomeButton, // Specific style for income
                    perfer === "income" && styles.modalButtonSelected,
                  ]}
                >
                  <Text style={styles.modalButtonText}>Income</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.modalActionButtons}>
                <TouchableOpacity
                  style={[styles.modaldone, styles.modalCloseButton]}
                  onPress={() => {
                    setShowModal(false);
                    setAddName(""); // Clear state on close
                    setPerfer("");
                  }}
                >
                  <Ionicons size={35} name="close-outline" color="#d32f2f" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modaldone, styles.modalConfirmButton]}
                  onPress={handleAdd}
                >
                  <Ionicons
                    name="checkmark-outline"
                    size={35}
                    color="#388e3c"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Modal>

        {/* Warning Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showWarning}
          onRequestClose={() => {
            setShowWarning(false);
            setAgree(false); // Ensure agree is false if closed without choice
            setDataToUpdate(null); // Clear pending data
          }}
          statusBarTranslucent
        >
          <BlurView style={styles.modalcontainer} intensity={80} tint="light">
            <View style={styles.warningContent}>
              <Ionicons
                name="warning-outline"
                size={40}
                color="#f57c00"
                style={{ marginBottom: 10 }}
              />
              <Text style={styles.warningText}>
                Data for {todaysDate} already exists.
              </Text>
              <Text style={styles.warningSubText}>
                Do you want to replace it with the current values?
              </Text>
              <View style={styles.warningButtons}>
                <TouchableOpacity
                  style={styles.warningNoButton} // "No" on the left
                  onPress={() => {
                    setShowWarning(false);
                    setAgree(false); // Explicitly set agree to false
                    setDataToUpdate(null); // Clear pending data
                    ToastAndroid.show(
                      "Operation cancelled",
                      ToastAndroid.SHORT
                    );
                  }}
                >
                  <Text style={styles.warningButtonText}>No</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.warningYesButton} // "Yes" on the right
                  onPress={() => {
                    // Just set agree and close. The useEffect will handle the update.
                    setAgree(true);
                    setShowWarning(false);
                  }}
                >
                  <Text style={styles.warningButtonText}>Yes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </Modal>

        {/* Action Buttons */}
        <View style={styles.bottomButtonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.calculateButton]}
            onPress={calculate} // Only calculates and updates display state
          >
            <Ionicons
              name="calculator-outline"
              size={20}
              color="#fff"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.buttonText}>Calculate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.insertButton]}
            onPress={handleSubmit} // Tries to save (insert or trigger update)
          >
            <Ionicons
              name="save-outline"
              size={20}
              color="#fff"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.buttonText}>Save Today</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.reportButton]}
          onPress={() => {
            router.push("./report"); // Ensure this route exists in your Expo Router setup
          }}
        >
          <Ionicons
            name="document-text-outline"
            size={20}
            color="#fff"
            style={{ marginRight: 5 }}
          />
          <Text style={styles.buttonText}>Monthly Report</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// --- Styles --- (Includes additions and refinements)
const styles = StyleSheet.create({
  container: {
    // flex: 1, // Make container take full height if needed
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start", // Align items to the top
    paddingBottom: 20, // Add padding at the bottom
    height: "100%", // Ensure it takes full screen height
    backgroundColor: "#f8f9fa", // Light background for the whole screen
  },
  resultcontainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e9ecef", // Lighter gray
    width: "100%",
    height: 45, // Slightly smaller
    justifyContent: "space-around", // Better spacing
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  results: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 55, // Slightly larger for results
    justifyContent: "space-around", // Better spacing
    backgroundColor: "#ffffff", // White background for contrast
    elevation: 2, // Subtle shadow
    marginBottom: 15, // Space before input area
  },
  inputcontainer: {
    backgroundColor: "#ffffff",
    width: "90%", // Use percentage for responsiveness
    // maxHeight: 400, // Set max height instead of fixed height
    flex: 1, // Allow it to take available space
    borderRadius: 10,
    elevation: 3,
    marginBottom: 15,
  },
  inputitems: {
    // Styles for the content inside ScrollView
    paddingVertical: 10, // Padding inside the scroll view
    alignItems: "center", // Center items horizontally
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "90%", // Width relative to the container
    marginBottom: 10,
  },
  inputLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1, // Take up available space
  },
  deleteIcon: {
    marginLeft: 5,
  },
  input: {
    // Shared input styles
    height: 40,
    width: 120, // Fixed width for the input field
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 16,
    backgroundColor: "#f1f3f5", // Very light gray background
    borderWidth: 1,
    borderColor: "#ced4da", // Subtle border
  },
  expenseInput: {
    // Specific styles for expense
    borderColor: "#e57373", // Light red border
  },
  incomeInput: {
    // Specific styles for income
    borderColor: "#81c784", // Light green border
  },
  addButtonContainer: {
    marginTop: 10, // Space above the add button
    marginBottom: 20, // Space below the add button
  },
  addrmvbtn: {
    justifyContent: "center",
    alignItems: "center",
  },
  modalcontainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalcontent: {
    width: "85%",
    borderRadius: 15,
    backgroundColor: "#ffffff", // White background
    padding: 25,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalname: {
    fontWeight: "600", // Semibold
    marginBottom: 20, // Increased space
    fontSize: 22, // Slightly smaller
    color: "#343a40", // Darker text
  },
  modalprefercontainer: {
    flexDirection: "row",
    justifyContent: "space-around", // Distribute space
    width: "100%", // Take full width of modal content
    marginVertical: 20, // Add vertical margin
  },
  modalbtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20, // More rounded
    borderWidth: 1,
    borderColor: "transparent", // Default no border
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100, // Minimum width
    elevation: 2,
  },
  expenseButton: {
    backgroundColor: "#ffebee", // Light red background
    borderColor: "#e57373", // Red border
  },
  incomeButton: {
    backgroundColor: "#e8f5e9", // Light green background
    borderColor: "#81c784", // Green border
  },
  modalButtonSelected: {
    borderWidth: 3, // Thicker border when selected
    elevation: 10, // More shadow when selected
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "500", // Medium weight
    color: "#495057",
  },
  modalActionButtons: {
    flexDirection: "row",
    justifyContent: "space-between", // Space out buttons
    width: "80%", // Control width
    marginTop: 25, // Add space above buttons
  },
  modaldone: {
    padding: 8, // Add padding for touch area
    borderRadius: 50, // Circular background
    // backgroundColor: '#e9ecef', // Light background for buttons
  },
  modalCloseButton: {
    // Specific style if needed
  },
  modalConfirmButton: {
    // Specific style if needed
  },
  // Bottom Buttons Styling
  bottomButtonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "90%",
    marginTop: 10, // Add some space above the split buttons
    marginBottom: 10,
  },
  button: {
    // Shared button styles
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    marginHorizontal: 5, // Add horizontal margin between side-by-side buttons
  },
  calculateButton: {
    backgroundColor: "#6c757d", // Secondary/Gray color
    flex: 1, // Take half the space
  },
  insertButton: {
    backgroundColor: "#28a745", // Success/Green color
    flex: 1, // Take half the space
  },
  reportButton: {
    backgroundColor: "#007bff", // Primary/Blue color
    width: "90%", // Full width button
    marginTop: 5, // Less margin for the bottom button
    marginBottom: 10,
  },
  buttonText: {
    // Renamed from 'text' to avoid conflict
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    color: "#ffffff", // White text for buttons
  },
  text: {
    // Style for regular text like labels
    fontSize: 16, // Adjusted size
    fontWeight: "500", // Medium weight
    color: "#495057", // Dark gray text
    textAlign: "center",
  },
  // Warning Modal Styles
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
