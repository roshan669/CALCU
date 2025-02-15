import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ToastAndroid,
  Touchable,
  TouchableOpacity,
  FlatList,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Table, Row, Rows, TableWrapper } from "react-native-table-component";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface ReportData {
  todaysDate: string;
  totalGrossIncome: string;
  calculatedNetIncome: string;
  empSalary: string;
  expense: string;
  month: string;
}

export default function Report() {
  const [reportData, setReportData] = useState<ReportData[]>([]); // Now an array of ReportData
  const [allMonths, setAllMonths] = useState<string[]>([]);

  const getAllKeys = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys; // Return the keys (important!)
    } catch (error) {
      return []; // Return an empty array in case of error (good practice)
    }
  };

  useEffect(() => {
    const fetchKeys = async () => {
      const keys = await getAllKeys();
      setAllMonths([...keys]); // Directly set the keys array
    };

    fetchKeys();
    const todaysDate = new Date().toDateString().slice(4);
    const month = todaysDate.slice(0, 3) + " " + todaysDate.slice(7, 11);

    loadReportData(month);
  }, []);

  const loadReportData = async (month: string) => {
    try {
      const storedData = await AsyncStorage.getItem(month);
      if (!storedData) {
        ToastAndroid.show("No data to display", ToastAndroid.SHORT); // Show a toast if there is no data
        return;
      }
      setReportData(JSON.parse(storedData));
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const calculateTotals = () => {
    let totalExpenses = 0;
    let totalSalary = 0;
    let totalGross = 0;
    let totalNet = 0;

    reportData.forEach((item) => {
      totalExpenses += parseFloat(item.expense) || 0;
      totalSalary += parseFloat(item.empSalary) || 0;
      totalGross += parseFloat(item.totalGrossIncome) || 0;
      totalNet += parseFloat(item.calculatedNetIncome) || 0;
    });

    return {
      totalExpenses: totalExpenses.toFixed(2), // Format to 2 decimal places
      totalSalary: totalSalary.toFixed(2),
      totalGross: totalGross.toFixed(2),
      totalNet: totalNet.toFixed(2),
    };
  };

  const tableHead = [
    "Date",
    "Expenses",
    "Salary",
    "Gross Income",
    "Net Income",
  ];

  const totals = calculateTotals();

  const tableFoot = [
    "Total",
    "Rs." + totals.totalExpenses, // Use calculated totals
    "Rs." + totals.totalSalary,
    "Rs." + totals.totalGross,
    "Rs." + totals.totalNet,
  ];

  const tableData = reportData.map((item) => [
    // Map over the array
    item.todaysDate,
    item.expense,
    item.empSalary,
    item.totalGrossIncome,
    item.calculatedNetIncome,
  ]);

  const handlePress = (month: string) => {
    loadReportData(month);
  };

  const renderItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      onPress={() => handlePress(item)}
      style={{
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          margin: 5,
          color: "#222222",
          fontWeight: "bold",
          fontSize: 20,
          backgroundColor: "#FFF",
          padding: 5,
          borderRadius: 10,
        }}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.months}>
        {allMonths.length > 0 ? (
          <FlatList
            horizontal={true}
            data={allMonths}
            renderItem={renderItem}
            keyExtractor={(item) => item} // Use the key itself as the key
          />
        ) : (
          <Text>No Data</Text>
        )}
      </View>
      <ScrollView>
        <View>
          <Text
            style={{
              fontSize: 20,
              textAlign: "center",
              color: "#222222",
              elevation: 10,
              marginTop: 10,
            }}
          >
            {reportData.length > 0 ? reportData[0].month : ""}{" "}
          </Text>
          <Table borderStyle={{ borderWidth: 1, borderColor: "#C1C0C9" }}>
            <Row
              data={tableHead}
              style={styles.head}
              textStyle={styles.headText}
            />
            <Rows
              data={tableData}
              style={styles.row}
              textStyle={styles.rowText}
            />
            <Row
              data={tableFoot}
              style={styles.head}
              textStyle={styles.headText}
            />
          </Table>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  head: { height: 50, backgroundColor: "#f1f8ff" },
  headText: { margin: 1, textAlign: "center", fontWeight: "bold" }, // Style object for head text
  row: { flexDirection: "row", backgroundColor: "#FFF1C1" },
  rowText: { margin: 1, textAlign: "center" }, // Style object for row text
  months: {
    height: 50,
    backgroundColor: "#D4D4D4",
    width: "100%",
    justifyContent: "center",
    elevation: 10,
  },
});
