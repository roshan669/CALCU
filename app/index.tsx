import { useRef, useState } from "react";
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
import { rgbaColor } from "react-native-reanimated/lib/typescript/Colors";

interface ReportData {
  // Same interface as before
  todaysDate: string;
  totalGrossIncome: string;
  calculatedNetIncome: string;
  empSalary: string;
  expense: string;
  month: string;
}

interface input {
  name: string;
  toggle: string;
}

export default function Index() {
  const [netIncome, setNetIncome] = useState<string>("0");
  const [totalGrossIncome, setTotalGrossIncome] = useState<string>("0");
  const [empSalary, setEmpSalary] = useState<string>("");
  const [expList, setExpList] = useState<string[]>([]);
  const [incList, SetIncList] = useState<string[]>([]);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [perfer, setPerfer] = useState<string>("");
  const [allinputs, setAllInputs] = useState<input[]>([]);
  const [addName, setAddName] = useState<string>("");
  const router = useRouter();

  const todaysDate = new Date().toDateString().slice(4);

  const calculate = async () => {
    const parsedExpense = parseFloat(expense) || 0;

    const parsedGrossIncomeCash = parseFloat(grossIncomeCash) || 0;

    const parsedGrossIncomeDigital = parseFloat(grossIncomeDigital) || 0;

    const pardedEmpSalary = parseFloat(empSalary) || 0;

    const totalGross = parsedGrossIncomeCash + parsedGrossIncomeDigital;
    const parsedToalGross = totalGross.toString();

    const calculatedNetIncome = totalGross - parsedExpense - pardedEmpSalary;

    const stringCalculatedNetIncome = calculatedNetIncome.toString();

    setTotalGrossIncome(parsedToalGross);
    setNetIncome(calculatedNetIncome.toString());

    const month = todaysDate.slice(0, 3) + " " + todaysDate.slice(7, 11);

    const time = new Date().toString();

    return {
      todaysDate,
      totalGrossIncome: totalGross.toString(),
      calculatedNetIncome: stringCalculatedNetIncome,
      empSalary,
      expense,
      month,
      time,
    };
  };

  const updateReportData = async (newData: ReportData) => {
    try {
      const month = todaysDate.slice(0, 3) + " " + todaysDate.slice(7, 11);
      const storedData = await AsyncStorage.getItem(month);
      const existingData: ReportData[] = storedData
        ? JSON.parse(storedData)
        : [];

      // Check if an entry for this date already exists
      const existingEntryIndex = existingData.findIndex(
        (item) => item.todaysDate === newData.todaysDate
      );

      if (existingEntryIndex !== -1) {
        // Update the existing entry
        existingData[existingEntryIndex] = newData;
      } else {
        existingData.push(newData);
      }

      await AsyncStorage.setItem(month, JSON.stringify(existingData));
    } catch (error) {
      ToastAndroid.show("Error saving data", ToastAndroid.SHORT);
    }
  };

  const handleSubmit = async () => {
    if (!expense || !grossIncomeCash || !grossIncomeDigital || !empSalary) {
      ToastAndroid.show("Please fill all the fields", ToastAndroid.SHORT);
      return;
    }

    try {
      const details = await calculate();
      await updateReportData(details);
      ToastAndroid.show("Data inserted successfully", ToastAndroid.LONG);
    } catch (error) {
      ToastAndroid.show("Error inserting data", ToastAndroid.SHORT);
    }
  };

  const handleAdd = async () => {
    try {
      const storedData = await AsyncStorage.getItem("perfer");
      const existingData: input[] = storedData ? JSON.parse(storedData) : [];

      const newData = {
        name: addName,
        toggle: perfer,
      };
      setAddName("");
      setPerfer("");

      existingData.push(newData);

      await AsyncStorage.setItem("perfer", JSON.stringify(existingData));
      setShowModal(!showModal);
    } catch (error) {
      ToastAndroid.show("Error saving data", ToastAndroid.SHORT);
    }
  };

  return (
    <KeyboardAvoidingView behavior="position" style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.resultcontainer}>
          <Text style={styles.text}> Total Gross Income</Text>
          <Text style={styles.text}> Total Net Income</Text>
        </View>
        <View style={styles.results}>
          <Text style={{ fontSize: 20 }}>{totalGrossIncome}</Text>
          <Text style={{ fontSize: 20 }}>{netIncome}</Text>
        </View>

        <ScrollView
          style={styles.inputcontainer}
          contentContainerStyle={styles.inputitems}
        >
          <Text></Text>
          <TouchableOpacity
            onPress={() => setShowModal(!showModal)}
            style={styles.addrmvbtn}
          >
            <Ionicons
              name="add-circle"
              size={50}
              color={"rgba(0, 0, 0, 0.1)"}
            />
            {<Text>Add expense or income</Text>}
          </TouchableOpacity>
        </ScrollView>

        <Modal
          animationType="fade"
          transparent={true}
          visible={showModal}
          onRequestClose={() => {
            setShowModal(!showModal);
          }}
        >
          <View style={styles.modalcontainer}>
            <View style={styles.modalcontent}>
              <Text style={styles.modalname}>Add Expense or Income</Text>
              <TextInput
                onChangeText={(t) => {
                  setAddName(t);
                }}
                style={styles.input}
              />

              <View style={styles.modalprefercontainer}>
                <TouchableOpacity
                  onPress={() => {
                    setPerfer("expense");
                  }}
                  style={[
                    styles.modalbtn,
                    perfer == "expense" && {
                      borderWidth: 0.5,
                      borderColor: "#000",
                      backgroundColor: "#D9D9D9",
                    },
                  ]}
                >
                  <Text>Expense</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setPerfer("income");
                  }}
                  style={[
                    styles.modalbtn,
                    perfer == "income" && {
                      borderWidth: 0.5,
                      borderColor: "#000",
                      backgroundColor: "#D9D9D9",
                    },
                  ]}
                >
                  <Text>Income</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.modaldone} onPress={handleAdd}>
                <Ionicons name="checkmark" size={30} />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.text}>Insert</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            router.push("./report");
          }}
        >
          <Text style={styles.text}>Montly Report</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  modalname: {
    fontWeight: "bold",
    margin: 10,
  },
  modaldone: {
    marginTop: 30,
  },
  modalbtn: {
    backgroundColor: "#d4d4d4",
    height: 40,
    width: 100,
    fontWeight: "800",
    elevation: 4,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  modalcontent: {
    height: 250,
    width: "80%",
    borderRadius: 50,
    backgroundColor: "#D4D4D4",
    justifyContent: "center",
    alignItems: "center",
  },
  modalprefercontainer: {
    flexDirection: "row",
    gap: 10,
  },
  modalcontainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    flexGrow: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  inputitems: {
    flexDirection: "column",
    justifyContent: "center", // Or 'center' if you want verticle centering.
    alignItems: "center", // Center items horizontally
    flexGrow: 1,
  },
  addrmvbtn: {
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  resultcontainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D4D4D4",
    width: "100%",
    height: 50,
    gap: 3,
    justifyContent: "center",
  },
  results: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 50,
    borderRadius: 10,
    gap: 200,
    justifyContent: "center",
    backgroundColor: "#D4D4D4",
    elevation: 10,
  },
  inputcontainer: {
    backgroundColor: "#D4D4D4",
    width: 320,
    height: 400,
    borderRadius: 10,
    elevation: 10,
    gap: 5,
    marginTop: 30,
  },
  input: {
    margin: 10,
    borderColor: "#222222",
    width: 200,
    borderRadius: 10,
    height: 40,
    boxSizing: "border-box",
    padding: 8, // Adjust as needed
    backgroundColor: "#DFDFDF", // Slightly lighter background than the parent
    boxShadow: "inset 0 2px 5px rgba(0, 0, 0, 0.1)",
  },
  button: {
    marginTop: 20,
    backgroundColor: "#D4D4D4",
    padding: 10,
    width: 310,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    elevation: 10,
    flexDirection: "row",
  },
  titlecontainer: {
    width: "100%",
    height: 50,
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D4D4D4",
    padding: 10,
  },
  title: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
  },

  text: {
    textAlign: "center",
    fontSize: 19,
    fontWeight: "bold",
  },
});
