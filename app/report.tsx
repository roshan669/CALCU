import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ToastAndroid,
  TouchableOpacity,
  FlatList,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { Table, Row, Rows } from "react-native-table-component";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";

interface ReportData {
  todaysDate: string;
  totalGrossIncome: string;
  calculatedNetIncome: string;
  empSalary: string;
  expense: string;
  month: string;
  time?: string;
}

export default function Report() {
  const [reportData, setReportData] = useState<ReportData[]>([]); // Now an array of ReportData
  const [allMonths, setAllMonths] = useState<string[]>([]);
  const isMounted = useRef(true);

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
      if (keys.length > 4) {
        await Promise.all(
          keys.map(async (monthKey) => {
            await checkAndClearData(monthKey);
          })
        );
      }
    };

    fetchKeys();
    const todaysDate = new Date().toDateString().slice(4);
    const month = todaysDate.slice(0, 3) + " " + todaysDate.slice(7, 11);

    loadReportData(month);

    return () => {
      // Cleanup function for component unmount
      isMounted.current = false; // Set mount status to false
    };
  }, []);

  const checkAndClearData = async (monthKey: string) => {
    try {
      const storedData = await AsyncStorage.getItem(monthKey);
      if (storedData) {
        const reportDataForMonth = JSON.parse(storedData);
        if (reportDataForMonth && reportDataForMonth.length > 0) {
          // Check for valid data

          const firstReportDateString = reportDataForMonth[0].time;
          const firstReportDate = new Date(firstReportDateString);

          const currentDate = new Date();

          const timeDifference =
            currentDate.getTime() - firstReportDate.getTime();
          const daysDifference = Math.ceil((timeDifference / 1000) * 3600 * 24);

          if (daysDifference >= 90) {
            await AsyncStorage.removeItem(monthKey);

            if (isMounted.current) {
              // Check if component is still mounted
              ToastAndroid.show(
                "Financial report for " +
                  monthKey +
                  " cleared. take backup now",
                ToastAndroid.SHORT
              );
              if (monthKey === reportData[0]?.month) {
                // Optional chaining
                loadReportData(monthKey); // Refresh if current month was cleared
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking/clearing data:", error);
    }
  };

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
  const generateHTML = () => {
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #C1C0C9;
            padding: 8px;
            text-align: center;
          }
          th {
            background-color: #f1f8ff;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #FFF1C1;
          }
          .month-title {
            font-size: 20px;
            text-align: center;
            color: #222222;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="month-title">${
          reportData.length > 0 ? reportData[0].month : ""
        }</div>
        <table>
          <thead>
            <tr>
              ${tableHead.map((header) => `<th>${header}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${tableData
              .map(
                (row) =>
                  `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`
              )
              .join("")}
          </tbody>
          <tfoot>
            <tr>
              ${tableFoot.map((footer) => `<th>${footer}</th>`).join("")}
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;
    return html;
  };

  const printReport = async () => {
    const html = generateHTML();

    await Print.printAsync({ html }).then(() => {
      if (reportData.length > 20) {
        AsyncStorage.removeItem(reportData[0].month, () => {
          ToastAndroid.show(
            "Finacial report cleared Save PDF for Backup ",
            ToastAndroid.SHORT
          );
        });
      }
    });
  };

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
          backgroundColor: "#f1f8ff",
          padding: 5,
          borderRadius: 10,
          elevation: 5,
          shadowColor: "#000",
          shadowOpacity: 1,
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
              textStyle={StyleSheet.flatten([styles.headText])}
            />
            <Rows
              data={tableData}
              style={styles.row}
              textStyle={StyleSheet.flatten([styles.rowText])}
            />
            <Row
              data={tableFoot}
              style={styles.head}
              textStyle={StyleSheet.flatten([styles.headText])}
            />
          </Table>
        </View>
      </ScrollView>
      <TouchableOpacity style={styles.printButton} onPress={printReport}>
        <Text style={styles.printButtonText}>Print Report</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  printButton: {
    marginTop: 20,
    backgroundColor: "#007AFF", // Example color
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    borderTopWidth: 1,
  },
  printButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  container: { flex: 1, backgroundColor: "#fff" },
  head: { height: 50, backgroundColor: "#f1f8ff" },
  headText: { margin: 1, textAlign: "center", fontWeight: "bold" }, // Style object for head text
  row: { flexDirection: "row", backgroundColor: "#FFF1C1" },
  rowText: { margin: 1, textAlign: "center" }, // Style object for row text
  months: {
    height: 50,
    backgroundColor: "#007AFF",
    width: "100%",
    justifyContent: "center",
    elevation: 10,
  },
});
