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
  // Same interface as before
  todaysDate: string;
  totalGrossIncome: string;
  calculatedNetIncome: string;
  month: string;
  all: list[];
  time: string;
  [key: string]: string | number | list[] | undefined; // Allow dynamic properties
}

type list = {
  name: string;
  value: number;
};

export default function Report() {
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [allMonths, setAllMonths] = useState<string[]>([]);
  const isMounted = useRef(true);

  const getAllKeys = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      return keys;
    } catch (error) {
      return [];
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const keys = await getAllKeys();
      const filteredkeys = keys.filter((item) => item !== "perfer");
      setAllMonths(filteredkeys);

      if (keys.length > 4) {
        await Promise.all(
          keys.map(async (monthKey) => {
            await checkAndClearData(monthKey);
          })
        );
      }

      const todaysDate = new Date().toDateString().slice(4);
      const month = todaysDate.slice(0, 3) + " " + todaysDate.slice(7, 11);
      loadReportData(month);
    };

    fetchInitialData();

    return () => {
      isMounted.current = false;
    };
  }, []);

  const checkAndClearData = async (monthKey: string) => {
    try {
      const storedData = await AsyncStorage.getItem(monthKey);
      if (storedData) {
        const reportDataForMonth = JSON.parse(storedData);
        if (reportDataForMonth && reportDataForMonth.length > 0) {
          const firstReportDateString = reportDataForMonth[0].time;
          const firstReportDate = new Date(firstReportDateString);
          const currentDate = new Date();
          const timeDifference =
            currentDate.getTime() - firstReportDate.getTime();
          const daysDifference = Math.ceil((timeDifference / 1000) * 3600 * 24);

          if (daysDifference >= 90) {
            await AsyncStorage.removeItem(monthKey);
            if (isMounted.current) {
              ToastAndroid.show(
                "Financial report for " +
                  monthKey +
                  " cleared. take backup now",
                ToastAndroid.SHORT
              );
              if (monthKey === reportData[0]?.month) {
                loadReportData(monthKey);
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
        ToastAndroid.show(
          "No data to display for " + month,
          ToastAndroid.SHORT
        );
        setReportData([]); // Clear previous data
        return;
      }

      const parsedData = JSON.parse(storedData);

      setReportData(parsedData);
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const calculateTotals = () => {
    let totalGross = 0;
    let totalNet = 0;

    reportData.forEach((item) => {
      totalGross += parseFloat(item.totalGrossIncome) || 0;
      totalNet += parseFloat(item.calculatedNetIncome) || 0;
    });

    return {
      totalGross: totalGross.toFixed(1),
      totalNet: totalNet.toFixed(1),
    };
  };

  const getTableHead = () => {
    const staticHeaders = ["Date", "Gross Income", "Net Income"];
    let dynamicHeaders: string[] = [];

    if (reportData && reportData.length > 0) {
      let longestAllArray: list[] = [];

      // Find the reportData item with the longest 'all' array
      reportData.forEach((item) => {
        if (
          item.all &&
          Array.isArray(item.all) &&
          item.all.length > longestAllArray.length
        ) {
          longestAllArray = item.all;
        }
      });

      // Extract unique 'name' values from the longest 'all' array as headers
      const seenNames = new Set<string>();
      longestAllArray.forEach((item) => {
        if (item.name && !seenNames.has(item.name)) {
          dynamicHeaders.push(item.name);
          seenNames.add(item.name);
        }
      });
    }

    return [...staticHeaders, ...dynamicHeaders];
  };

  const tableHead = getTableHead();
  const totals = calculateTotals();

  const getTableData = () => {
    const headers = getTableHead(); // Get the updated headers (including dynamic ones)
    return reportData.map((item) => {
      const rowData: (string | number | undefined)[] = [
        item.todaysDate,
        item.totalGrossIncome,
        item.calculatedNetIncome,
      ];

      // Add dynamic values based on the headers
      headers.slice(3).forEach((header) => {
        // Skip static headers
        const foundItem = (item.all || []).find(
          (allItem) => allItem.name === header
        );
        rowData.push(foundItem ? foundItem.value?.toString() : "Nill"); // Or "".toString() for empty string
      });

      return rowData;
    });
  };

  const tableData = getTableData();

  const getTableFoot = () => {
    const headers = getTableHead(); // Get the updated headers
    const staticFoot = ["Total Rs.", totals.totalGross, totals.totalNet];
    const dynamicExpenseIncomeTotals: string[] = [];

    // Calculate totals for dynamic columns
    headers.slice(3).forEach((header) => {
      let total = 0;
      reportData.forEach((item) => {
        const foundItem = (item.all || []).find(
          (allItem) => allItem.name === header
        );
        total += foundItem ? parseInt(foundItem.value as string) || 0 : 0;
      });
      dynamicExpenseIncomeTotals.push(total.toFixed(0));
    });

    return [...staticFoot, ...dynamicExpenseIncomeTotals];
  };

  const tableFoot = getTableFoot();

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
                  `<tr>${row
                    .map((cell) => `<td>${cell || ""}</td>`)
                    .join("")}</tr>`
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
      if (reportData.length > 20 && reportData[0]?.month) {
        AsyncStorage.removeItem(reportData[0].month, () => {
          ToastAndroid.show(
            "Financial report cleared Save PDF for Backup ",
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
            keyExtractor={(item) => item}
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
            {reportData.length > 0 ? reportData[0].month : "Select Month"}
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
    backgroundColor: "#007AFF",
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
  headText: { margin: 1, textAlign: "center", fontWeight: "bold" },
  row: { flexDirection: "row", backgroundColor: "#FFF1C1" },
  rowText: { margin: 1, textAlign: "center" },
  months: {
    height: 50,
    backgroundColor: "#007AFF",
    width: "100%",
    justifyContent: "center",
    elevation: 10,
  },
});
