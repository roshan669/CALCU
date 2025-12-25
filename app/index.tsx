import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import { Colors } from "@/constants/theme";
import type { list, input, ReportData } from "@/types/types";
import Alert from "@/components/Alert.modal";
import { title, description } from "@/constants/textData";

export default function Index() {
  const [netIncome, setNetIncome] = useState<string>("0");
  const [totalGrossIncome, setTotalGrossIncome] = useState<string>("0");
  const [expList, setExpList] = useState<list[]>([]);
  const [incList, setIncList] = useState<list[]>([]);
  const [perfer, setPerfer] = useState<string>("");
  const [allinputs, setAllInputs] = useState<input[]>([]);
  const [addName, setAddName] = useState<string>("");
  const [showWarning, setShowWarning] = useState<string | null>(null);
  const [agree, setAgree] = useState<boolean>(false);
  // State to hold data temporarily when waiting for user confirmation
  const [dataToUpdate, setDataToUpdate] = useState<ReportData | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string>("");
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    console.log("handleSheetChanges", index);
  }, []);

  const handleSheetClose = useCallback(() => {
    bottomSheetModalRef.current?.close();
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.3}
      />
    ),
    []
  );

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
        setShowWarning("save"); // Show the warning modal
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
    const performOperation = async () => {
      if (!agree) return;

      if (showWarning === "save" && dataToUpdate) {
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
            existingData[existingEntryIndex] = dataToUpdate;
            await AsyncStorage.setItem(month, JSON.stringify(existingData));
            ToastAndroid.show("Data updated successfully", ToastAndroid.LONG);
          } else {
            existingData.push(dataToUpdate);
            await AsyncStorage.setItem(month, JSON.stringify(existingData));
            ToastAndroid.show("Data inserted", ToastAndroid.LONG);
          }
        } catch (error) {
          console.error("Error updating data:", error);
          ToastAndroid.show("Error updating data", ToastAndroid.SHORT);
        } finally {
          setDataToUpdate(null);
          setAgree(false);
          setShowWarning(null);
        }
      } else if (showWarning === "delete" && itemToDelete) {
        await handleDelete(itemToDelete);
        setAgree(false);
        setShowWarning(null);
        setItemToDelete("");
      }
    };

    performOperation();
  }, [agree, dataToUpdate, showWarning, itemToDelete]); // Run this effect when 'agree' or 'dataToUpdate' changes

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
    if (trimmedName === "") {
      ToastAndroid.show("Please enter Item Name", ToastAndroid.SHORT);
      return;
    }
    if (perfer === "") {
      ToastAndroid.show("Please Select Type", ToastAndroid.SHORT);
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
      loadPreferences(); // Reload preferences to update UI
      handleSheetClose();
      ToastAndroid.show("Added successfully", ToastAndroid.SHORT);
    } catch (error) {
      console.error("Error saving preference:", error);
      ToastAndroid.show("Error saving preference", ToastAndroid.SHORT);
    }
  };

  const handleDeleteWarning = (name: string) => {
    setItemToDelete(name);
    setShowWarning("delete");
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
  const handleChange = useCallback(
    (text: string, toggle: string, name: string) => {
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
    },
    []
  );

  // --- Render Component ---
  return (
    <KeyboardAvoidingView behavior="height" keyboardVerticalOffset={100}>
      <View style={styles.container}>
        <View style={styles.resultcontainer}>
          <Text style={styles.text}> Gross Income</Text>
          <Text style={styles.text}> Net Income</Text>
        </View>
        <View style={styles.results}>
          <Text style={{ fontSize: 25, fontWeight: "bold" }}>
            {totalGrossIncome}
          </Text>
          <Text style={{ fontSize: 25, fontWeight: "bold" }}>{netIncome}</Text>
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
                  onLongPress={() => handleDeleteWarning(item.name)}
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
              onPress={handlePresentModalPress}
              style={styles.addrmvbtn}
            >
              <Ionicons
                name="add-circle"
                size={50}
                color={"rgba(0, 128, 0, 0.5)"} // Make it more visible
              />
              {allinputs.length < 1 && (
                <Text style={{ fontSize: 20, fontWeight: "bold" }}>
                  Add expense or income
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* --- Modals --- */}

        <BottomSheetModal
          ref={bottomSheetModalRef}
          onChange={handleSheetChanges}
          backdropComponent={renderBackdrop}
          keyboardBehavior="interactive"
          keyboardBlurBehavior="restore"
        >
          <BottomSheetView style={styles.modalContentContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Item</Text>
            </View>

            <View style={styles.modalInputContainer}>
              <Text style={styles.inputLabel}>Item Name</Text>
              <BottomSheetTextInput
                placeholder="e.g., Groceries, Salary"
                value={addName}
                onChangeText={setAddName}
                style={styles.modalInput}
                autoCapitalize="words"
                placeholderTextColor="#adb5bd"
              />
            </View>

            <View style={styles.typeSelectionContainer}>
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.typeButtonsRow}>
                <TouchableOpacity
                  onPress={() => setPerfer("expense")}
                  style={[
                    styles.typeButton,
                    styles.expenseTypeButton,
                    perfer === "expense" && styles.expenseTypeButtonSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      perfer === "expense"
                        ? "arrow-down-circle"
                        : "arrow-down-circle-outline"
                    }
                    size={24}
                    color={perfer === "expense" ? "#d32f2f" : "#e57373"}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      perfer === "expense" && styles.typeButtonTextSelected,
                    ]}
                  >
                    Expense
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setPerfer("income")}
                  style={[
                    styles.typeButton,
                    styles.incomeTypeButton,
                    perfer === "income" && styles.incomeTypeButtonSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      perfer === "income"
                        ? "arrow-up-circle"
                        : "arrow-up-circle-outline"
                    }
                    size={24}
                    color={perfer === "income" ? "#388e3c" : "#81c784"}
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      perfer === "income" && styles.typeButtonTextSelected,
                    ]}
                  >
                    Income
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={() => {
                  handleSheetClose();
                  setAddName("");
                  setPerfer("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.confirmButton]}
                onPress={handleAdd}
              >
                <Text style={styles.confirmButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </BottomSheetView>
        </BottomSheetModal>

        {showWarning && (
          <Alert
            setAgree={setAgree}
            showWarning={showWarning}
            setShowWarning={setShowWarning}
            setDataToUpdate={setDataToUpdate}
            title={showWarning === "save" ? title.SAVE : title.DELETE}
            description={
              showWarning === "save" ? description.SAVE : description.DELETE
            }
          />
        )}

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

        {/* <TouchableOpacity
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
      </TouchableOpacity> */}
      </View>
    </KeyboardAvoidingView>
  );
}

// --- Styles --- (Includes additions and refinements)
const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start", // Align items to the top
    paddingBottom: 20, // Add padding at the bottom
    height: "100%", // Ensure it takes full screen height
    backgroundColor: Colors.light.background, // Light background for the whole screen
  },
  resultcontainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxHeight: 50, // Slightly smaller
    justifyContent: "space-around", // Better spacing
    paddingVertical: 10,
  },
  results: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    maxHeight: 55, // Slightly larger for results
    justifyContent: "space-around", // Better spacing
    backgroundColor: "#ffffff", // White background for contrast
    marginBottom: 15, // Space before input area
    paddingVertical: 10,
    borderBottomColor: Colors.light.icon,
    // borderBottomWidth: StyleSheet.hairlineWidth,s
  },
  inputcontainer: {
    backgroundColor: "#ffffff",
    width: "100%",
    // flex: 1,
    borderRadius: 10,
    marginBottom: 5,
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
    // minHeight: 70,
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
    height: 50,
    width: 150, // Fixed width for the input field
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
  modalContentContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: "#fff",
  },
  modalHeader: {
    marginBottom: 24,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#212529",
  },
  modalInputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modalInput: {
    height: 56,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#212529",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  typeSelectionContainer: {
    marginBottom: 32,
  },
  typeButtonsRow: {
    flexDirection: "row",
    gap: 16,
  },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  expenseTypeButton: {
    backgroundColor: "#fff",
    borderColor: "#ffcdd2",
  },
  expenseTypeButtonSelected: {
    backgroundColor: "#ffebee",
    borderColor: "#ef5350",
    borderWidth: 2,
    elevation: 0, // Flat look for selected
  },
  incomeTypeButton: {
    backgroundColor: "#fff",
    borderColor: "#c8e6c9",
  },
  incomeTypeButtonSelected: {
    backgroundColor: "#e8f5e9",
    borderColor: "#66bb6a",
    borderWidth: 2,
    elevation: 0,
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
  },
  typeButtonTextSelected: {
    color: "#212529",
    fontWeight: "700",
  },
  modalFooter: {
    flexDirection: "row",
    gap: 16,
    marginTop: "auto", // Push to bottom if container has height
  },
  actionButton: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f1f3f5",
  },
  confirmButton: {
    backgroundColor: "#212529",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#495057",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  // Keep modalcontainer for the warning modal
  modalcontainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Bottom Buttons Styling
  bottomButtonContainer: {
    gap: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    width: "95%",
    marginTop: 10, // Add some space above the split buttons
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
