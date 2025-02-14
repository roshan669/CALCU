import { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const [expense, setExpense] = useState<string>("0");
  const [grossIncomeCash, setGrossIncomeCash] = useState<string>("0");
  const [grossIncomeDigital, setGrossIncomeDigital] = useState<string>("0");
  const [netIncome, setNetIncome] = useState<string>("0");
  const [totalGrossIncome, setTotalGrossIncome] = useState<string>("0");

  const todaysDate = new Date().toDateString().slice(4);

  const handleSubmit = () => {
    const parsedExpense = parseFloat(expense) || 0;
    const parsedGrossIncomeCash = parseFloat(grossIncomeCash) || 0;
    const parsedGrossIncomeDigital = parseFloat(grossIncomeDigital) || 0;

    const totalGross = parsedGrossIncomeCash + parsedGrossIncomeDigital;
    setTotalGrossIncome(totalGross.toString());

    const calculatedNetIncome = totalGross - parsedExpense;
    setNetIncome(calculatedNetIncome.toString());
  };

  return (
    <SafeAreaView>
      <View style={styles.container}>
        <View style={styles.titlecontainer}>
          <Text style={styles.title}> Date : {todaysDate}</Text>
        </View>

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
            placeholder="0"
            keyboardType="decimal-pad"
            onChangeText={setExpense} // Update state on text change
          />
          <Text style={styles.text}>Gross income (cash)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="decimal-pad"
            onChangeText={setGrossIncomeCash}
          />
          <Text style={styles.text}>Gross income (Digital)</Text>
          <TextInput
            style={styles.input}
            placeholder="0"
            keyboardType="decimal-pad"
            onChangeText={setGrossIncomeDigital}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.text}>Submit</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button}>
          <Text style={styles.text}>Montly Report</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  resultcontainer: {
    // marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D4D4D4",
    width: "100%",
    height: 50,
    gap: 3,
    justifyContent: "center",
    borderTopColor: "#222222",
    borderTopWidth: 1,
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
    height: 350,
    borderRadius: 10,
    elevation: 10,
    gap: 5,
    justifyContent: "center",
    marginTop: 50,
  },
  input: {
    margin: 10,
    borderColor: "#222222",
    borderWidth: 1,
    width: 200,
    borderRadius: 10,
  },
  button: {
    marginTop: 30,
    backgroundColor: "#D4D4D4",
    padding: 10,
    width: 200,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    elevation: 10,
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
    fontSize: 20,
    fontWeight: "bold",
  },
});
