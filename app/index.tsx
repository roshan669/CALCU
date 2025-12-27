import { useCallback, useContext, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "@/styles/homeScreenStyles";
import type { list, ReportData } from "@/types/types";
import Alert from "@/components/Alert.modal";
import { title, description } from "@/constants/textData";
import { HomeContext } from "@/hooks/useHome";
import BottomSheet from "@/components/BottomSheet";

export default function Index() {
  const {
    allinputs,
    incList,
    expList,
    totalGrossIncome,
    netIncome,
    setDataToUpdate,
    setExpList,
    setIncList,
    setItemToDelete,
    setNetIncome,
    setShowWarning,
    setTotalGrossIncome,
    showWarning,
    bottomSheetModalRef,
    inputRefs,
  } = useContext(HomeContext)!;

  const handlePresentModalPress = useCallback(() => {
    inputRefs.current.forEach((input) => input?.blur());
    (bottomSheetModalRef as any).current?.present();
  }, []);

  const todaysDate = new Date().toDateString().slice(4);
  // const todaysDate = new Date(2025, 1, 2).toDateString().slice(4);

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
    return false;
  };

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

  const handleDeleteWarning = (name: string) => {
    setItemToDelete(name);
    setShowWarning("delete");
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

      const updateList = (listSetter: any) => {
        listSetter((prevList: list[]) =>
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={100}
      style={{ flex: 1 }}
    >
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
                <Text
                  style={[
                    styles.text,
                    {
                      width: "50%",
                      textAlign: "left",
                      fontSize: 20,
                      fontWeight: "bold",
                    },
                  ]}
                >
                  {item.name}
                </Text>

                <TextInput
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  placeholder="0"
                  style={[
                    styles.input,
                    item.toggle === "expense"
                      ? styles.expenseInput
                      : styles.incomeInput,
                  ]}
                  defaultValue={
                    currentValue === 0 ? "" : currentValue.toString()
                  }
                  onChangeText={(text) =>
                    handleChange(text, item.toggle, item.name)
                  }
                  onSubmitEditing={() => {
                    const nextIndex = index + 1;
                    if (nextIndex < allinputs.length) {
                      inputRefs.current[nextIndex]?.focus();
                    }
                  }}
                  keyboardType="numeric"
                  placeholderTextColor="#999"
                  returnKeyType={
                    index === allinputs.length - 1 ? "done" : "next"
                  }
                />

                <TouchableOpacity
                  onPress={() => handleDeleteWarning(item.name)}
                >
                  <Ionicons
                    name="trash-outline"
                    size={25}
                    color={"#555"}
                    style={styles.deleteIcon}
                  />
                </TouchableOpacity>
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
                color={"#6c757d"} // Make it more visible
              />
              {allinputs.length < 1 && (
                <Text
                  style={{ color: "#6c757d", fontSize: 20, fontWeight: "bold" }}
                >
                  Add expense or income
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <BottomSheet />

        {showWarning && (
          <Alert
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
      </View>
    </KeyboardAvoidingView>
  );
}
