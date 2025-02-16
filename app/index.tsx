import { useState } from "react";
import {
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from "react-native";

import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ReportData {
  // Same interface as before
  todaysDate: string;
  totalGrossIncome: string;
  calculatedNetIncome: string;
  empSalary: string;
  expense: string;
  month: string;
}

export default function Index() {
  const [expense, setExpense] = useState<string>("");
  const [grossIncomeCash, setGrossIncomeCash] = useState<string>("");
  const [grossIncomeDigital, setGrossIncomeDigital] = useState<string>("");
  const [netIncome, setNetIncome] = useState<string>("0");
  const [totalGrossIncome, setTotalGrossIncome] = useState<string>("0");
  const [empSalary, setEmpSalary] = useState<string>("");
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

        <View style={styles.inputcontainer}>
          <Text style={styles.text}> Total Expense</Text>
          <TextInput
            style={styles.input}
            value={expense}
            placeholder="0"
            keyboardType="decimal-pad"
            onChangeText={setExpense} // Update state on text change
          />
          <Text style={styles.text}>Gross income (cash)</Text>
          <TextInput
            value={grossIncomeCash}
            style={styles.input}
            placeholder="0"
            keyboardType="decimal-pad"
            onChangeText={setGrossIncomeCash}
          />
          <Text style={styles.text}>Gross income (Digital)</Text>
          <TextInput
            value={grossIncomeDigital}
            style={styles.input}
            placeholder="0"
            keyboardType="decimal-pad"
            onChangeText={setGrossIncomeDigital}
          />

          <Text style={styles.text}> Employee Salary</Text>
          <TextInput
            value={empSalary}
            style={styles.input}
            placeholder="0"
            keyboardType="decimal-pad"
            onChangeText={setEmpSalary}
          />
        </View>

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
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#D4D4D4",
    width: 320,
    height: 400,
    borderRadius: 10,
    elevation: 10,
    gap: 5,
    justifyContent: "center",
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
