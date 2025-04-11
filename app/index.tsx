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
  const router = useRouter();

  const todaysDate = new Date().toDateString().slice(4);

  const data = async () => {
    const storedData = await AsyncStorage.getItem("perfer");
    const existingData: input[] = storedData ? JSON.parse(storedData) : [];

    setAllInputs(existingData);
  };

  useEffect(() => {
    data();
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

  const calculate = async () => {
    const totalGrossIncome = incList
      .reduce((sum, item) => {
        return sum + (item.value || 0);
      }, 0)
      .toString(); // Convert to string here

    const totalExpense = expList.reduce((sum, item) => {
      return sum + (item.value || 0);
    }, 0);

    const calculatedNetIncome =
      (parseFloat(totalGrossIncome) || 0) - totalExpense;
    const stringCalculatedNetIncome = calculatedNetIncome.toString();

    setTotalGrossIncome(totalGrossIncome);
    setNetIncome(stringCalculatedNetIncome);

    const month = todaysDate.slice(0, 3) + " " + todaysDate.slice(7, 11);
    const time = new Date().toString();
    const allData = [...expList, ...incList].map((item) => {
      return {
        name: item.name,
        value: item.value,
      };
    });

    console.log(allData);
    return {
      todaysDate,
      totalGrossIncome, // Use the correct property name
      calculatedNetIncome: stringCalculatedNetIncome, // Use the correct property name
      month,
      time,
      all: allData,
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
    try {
      const details = await calculate();
      await updateReportData(details);
      ToastAndroid.show("Data inserted successfully", ToastAndroid.LONG);
    } catch (error) {
      ToastAndroid.show("Error inserting data", ToastAndroid.SHORT);
    }
  };

  const handleAdd = async () => {
    if (addName == "" || perfer == "") {
      ToastAndroid.show("please enter a value and select nature", 1000);
      return;
    }

    try {
      const storedData = await AsyncStorage.getItem("perfer");
      const existingData: input[] = storedData ? JSON.parse(storedData) : [];

      const trim = addName.trim();
      const newData = {
        name: trim,
        toggle: perfer,
      };
      setAddName("");
      setPerfer("");

      existingData.push(newData);

      await AsyncStorage.setItem("perfer", JSON.stringify(existingData));
      data();
      setShowModal(!showModal);
    } catch (error) {
      ToastAndroid.show("Error saving data", ToastAndroid.SHORT);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      const storedData = await AsyncStorage.getItem("perfer");
      const existingData: input[] = storedData ? JSON.parse(storedData) : [];

      const updatedData = existingData.filter((item) => item.name !== name);

      await AsyncStorage.setItem("perfer", JSON.stringify(updatedData));
      data();
    } catch (error) {
      ToastAndroid.show("Error saving data", ToastAndroid.SHORT);
    }
  };

  const handleChange = (e: string, toggle: string, name: string) => {
    let newValue = parseInt(e, 10);
    if (e === "") newValue = 0;
    if (isNaN(newValue)) return;

    if (toggle === "expense") {
      setExpList((prev) =>
        prev.map((item, i) =>
          item.name === name ? { ...item, value: newValue } : item
        )
      );
    } else if (toggle === "income") {
      setIncList((prev) =>
        prev.map((item, i) =>
          item.name === name ? { ...item, value: newValue } : item
        )
      );
    }
  };
  return (
    <KeyboardAvoidingView behavior="position">
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
          contentContainerStyle={[styles.inputitems, { margin: 20 }]}
        >
          {allinputs.map((item, index) => {
            return (
              <View key={index}>
                <TouchableOpacity
                  onLongPress={() => handleDelete(item.name)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={styles.text}>{item.name}</Text>
                  <Ionicons name="trash" size={10} color={"#222"} />
                </TouchableOpacity>

                <TextInput
                  key={index}
                  placeholder="0"
                  style={[
                    styles.input,
                    item.toggle === "expense"
                      ? { borderColor: "red", borderWidth: 0.25 }
                      : { borderColor: "green", borderWidth: 0.25 },
                  ]}
                  onChangeText={(text) =>
                    handleChange(text, item.toggle, item.name)
                  }
                  keyboardType="numeric"
                />
              </View>
            );
          })}
          <View>
            <TouchableOpacity
              onPress={() => setShowModal(!showModal)}
              style={styles.addrmvbtn}
            >
              <Ionicons
                name="add-circle"
                size={50}
                color={"rgba(0, 0, 0, 0.1)"}
              />
              {allinputs.length < 1 && <Text>Add expense or income</Text>}
            </TouchableOpacity>
          </View>
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
                placeholder="eg:salary"
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
              <View style={{ flexDirection: "row-reverse", gap: 80 }}>
                <TouchableOpacity style={styles.modaldone} onPress={handleAdd}>
                  <Ionicons name="checkmark" size={35} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modaldone}
                  onPress={() => {
                    setShowModal(!showModal);
                  }}
                >
                  <Ionicons size={35} name="close-outline" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <View style={{ flexDirection: "row", gap: 30 }}>
          <TouchableOpacity
            style={[styles.button, { width: 137 }]}
            onPress={calculate}
          >
            <Text style={styles.text}>Calculate</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { width: 137 }]}
            onPress={handleSubmit}
          >
            <Text style={styles.text}>Insert</Text>
          </TouchableOpacity>
        </View>

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
    fontWeight: "heavy",
    margin: 10,
    fontSize: 24,
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
    height: 260,
    width: "85%",
    borderRadius: 15,
    backgroundColor: "#d4d4d4",
    justifyContent: "center",
    alignItems: "center",
  },
  modalprefercontainer: {
    flexDirection: "row",
    gap: 20,
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
    marginBottom: 30,
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
    width: 250,
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
